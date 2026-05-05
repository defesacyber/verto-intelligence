import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { BCB_SERIES, fetchBCBSeries, getLatestValue, calculateAccumulated12m } from "../_shared/bcb-client.ts";


serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req.headers.get('origin'));
  }

  try {
    const { action, months = 12 } = await req.json();

    if (typeof action !== 'string' || action.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Ação inválida'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');

    // Security: Admin-only action
    if (action === 'fetch-latest') {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);

      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Fetching latest macro indicators from BCB...');
      
      // Buscar todas as séries em paralelo
      const [
        selicMetaData,
        selicAcumuladaData,
        ipcaData,
        ipca12mData,
        inccData,
        igpmData,
        pibData,
        desempregoData,
        confiancaData
      ] = await Promise.all([
        fetchBCBSeries(BCB_SERIES.selic_meta, 3),
        fetchBCBSeries(BCB_SERIES.selic_acumulada, 3),
        fetchBCBSeries(BCB_SERIES.ipca, 12),
        fetchBCBSeries(BCB_SERIES.ipca_12m, 3),
        fetchBCBSeries(BCB_SERIES.incc, 12),
        fetchBCBSeries(BCB_SERIES.igpm, 12),
        fetchBCBSeries(BCB_SERIES.pib_variacao, 4),
        fetchBCBSeries(BCB_SERIES.taxa_desemprego, 3),
        fetchBCBSeries(BCB_SERIES.confianca_consumidor, 3)
      ]);

      // Montar objeto com indicadores
      const today = new Date().toISOString().split('T')[0];
      
      const indicators = {
        data_referencia: today,
        selic_meta: getLatestValue(selicMetaData),
        selic_acumulada_mes: getLatestValue(selicAcumuladaData),
        ipca_mes: getLatestValue(ipcaData),
        ipca_acumulado_12m: getLatestValue(ipca12mData) || calculateAccumulated12m(ipcaData),
        incc_mes: getLatestValue(inccData),
        incc_acumulado_12m: calculateAccumulated12m(inccData),
        igpm_mes: getLatestValue(igpmData),
        igpm_acumulado_12m: calculateAccumulated12m(igpmData),
        pib_variacao_trimestre: getLatestValue(pibData),
        pib_variacao_12m: null, // BCB não tem série específica
        taxa_desemprego: getLatestValue(desempregoData),
        confianca_consumidor: getLatestValue(confiancaData),
        fonte: 'bcb'
      };

      console.log('Indicators fetched:', indicators);

      // Salvar no banco de dados
      const { error: saveError } = await supabase
        .from('idi_macro_indicadores')
        .upsert(indicators, { onConflict: 'data_referencia' })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving indicators:', saveError);
      }

      return new Response(JSON.stringify({
        success: true,
        data: indicators,
        saved: !saveError,
        sources: {
          selic: selicMetaData.length > 0 ? 'bcb' : 'unavailable',
          ipca: ipcaData.length > 0 ? 'bcb' : 'unavailable',
          incc: inccData.length > 0 ? 'bcb' : 'unavailable',
          igpm: igpmData.length > 0 ? 'bcb' : 'unavailable',
          pib: pibData.length > 0 ? 'bcb' : 'unavailable',
          desemprego: desempregoData.length > 0 ? 'bcb' : 'unavailable'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-cached') {
      // Buscar dados em cache do banco
      const { data: cachedData, error } = await supabase
        .from('idi_macro_indicadores')
        .select('*')
        .order('data_referencia', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching cached indicators:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Se não há cache ou está desatualizado (mais de 24h), buscar novos
      const now = new Date();
      const cacheDate = cachedData?.data_importacao ? new Date(cachedData.data_importacao) : null;
      const cacheAge = cacheDate ? (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60) : 999;
      
      if (!cachedData || cacheAge > 24) {
        console.log('Cache expired or missing, fetching fresh data...');
        // Chamar recursivamente para buscar dados frescos
        const freshResponse = await fetch(Deno.env.get('SUPABASE_URL') + '/functions/v1/bcb-macro-data', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'fetch-latest' }),
        });
        
        if (freshResponse.ok) {
          const freshData = await freshResponse.json();
          return new Response(JSON.stringify({
            success: true,
            data: freshData.data,
            source: 'fresh',
            age_hours: 0
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        data: cachedData,
        source: 'cache',
        age_hours: Math.round(cacheAge * 10) / 10
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-historical') {
      const { data: historicalData, error } = await supabase
        .from('idi_macro_indicadores')
        .select('*')
        .order('data_referencia', { ascending: false })
        .limit(months);

      if (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: historicalData?.reverse() || [],
        count: historicalData?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Ação não reconhecida. Use: fetch-latest, get-cached, get-historical'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bcb-macro-data function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
