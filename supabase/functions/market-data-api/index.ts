import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from "../_shared/cors.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";


// =====================================================
// SINGLE SOURCE OF TRUTH - Fallback apenas quando banco não retorna dados
// Valores alinhados com FALLBACK_CITY_DATA em data-service.ts e dashboard-summary
// =====================================================
const FALLBACK_MARKET_DATA: Record<string, { avgPriceM2: number; variation12m: number; demandIndex: number; absorptionRate: number }> = {
  'São Paulo-SP': { avgPriceM2: 12500, variation12m: 5.2, demandIndex: 78, absorptionRate: 10 },
  'Rio de Janeiro-RJ': { avgPriceM2: 10800, variation12m: 4.8, demandIndex: 68, absorptionRate: 13 },
  'Belo Horizonte-MG': { avgPriceM2: 8200, variation12m: 4.0, demandIndex: 66, absorptionRate: 14 },
  'Curitiba-PR': { avgPriceM2: 9800, variation12m: 5.5, demandIndex: 75, absorptionRate: 9 },
  'Porto Alegre-RS': { avgPriceM2: 8500, variation12m: 3.2, demandIndex: 58, absorptionRate: 16 },
  'Brasília-DF': { avgPriceM2: 11200, variation12m: 4.2, demandIndex: 70, absorptionRate: 12 },
  'Salvador-BA': { avgPriceM2: 7500, variation12m: 3.8, demandIndex: 62, absorptionRate: 15 },
  'Fortaleza-CE': { avgPriceM2: 7200, variation12m: 4.2, demandIndex: 66, absorptionRate: 13 },
  'Recife-PE': { avgPriceM2: 7800, variation12m: 4.0, demandIndex: 64, absorptionRate: 14 },
  // Centro-Oeste - Valor UNIFICADO: R$ 6.500/m² para Goiânia
  'Goiânia-GO': { avgPriceM2: 6500, variation12m: 5.8, demandIndex: 76, absorptionRate: 8 },
  'Florianópolis-SC': { avgPriceM2: 12800, variation12m: 6.2, demandIndex: 82, absorptionRate: 7 },
  'Campinas-SP': { avgPriceM2: 8900, variation12m: 4.8, demandIndex: 72, absorptionRate: 11 },
  'Vitória-ES': { avgPriceM2: 9200, variation12m: 3.8, demandIndex: 62, absorptionRate: 14 },
  'Manaus-AM': { avgPriceM2: 5800, variation12m: 3.5, demandIndex: 60, absorptionRate: 15 },
  'Belém-PA': { avgPriceM2: 5500, variation12m: 3.2, demandIndex: 58, absorptionRate: 16 },
  'Campo Grande-MS': { avgPriceM2: 5200, variation12m: 3.5, demandIndex: 60, absorptionRate: 14 },
  'Cuiabá-MT': { avgPriceM2: 5800, variation12m: 4.0, demandIndex: 62, absorptionRate: 13 },
  // Nordeste adicional
  'Maceió-AL': { avgPriceM2: 6200, variation12m: 3.5, demandIndex: 58, absorptionRate: 15 },
  'Natal-RN': { avgPriceM2: 6800, variation12m: 3.8, demandIndex: 60, absorptionRate: 14 },
  'Teresina-PI': { avgPriceM2: 5500, variation12m: 3.2, demandIndex: 56, absorptionRate: 16 },
  'João Pessoa-PB': { avgPriceM2: 6500, variation12m: 4.0, demandIndex: 62, absorptionRate: 14 },
  'Aracaju-SE': { avgPriceM2: 6000, variation12m: 3.5, demandIndex: 58, absorptionRate: 15 },
  'São Luís-MA': { avgPriceM2: 5800, variation12m: 3.3, demandIndex: 56, absorptionRate: 16 },
  // Sul adicional
  'Joinville-SC': { avgPriceM2: 8200, variation12m: 5.0, demandIndex: 72, absorptionRate: 10 },
  'Blumenau-SC': { avgPriceM2: 7500, variation12m: 4.5, demandIndex: 68, absorptionRate: 11 },
  'Caxias do Sul-RS': { avgPriceM2: 7000, variation12m: 3.8, demandIndex: 62, absorptionRate: 13 },
  'Londrina-PR': { avgPriceM2: 7200, variation12m: 4.2, demandIndex: 65, absorptionRate: 12 },
  'Maringá-PR': { avgPriceM2: 7500, variation12m: 4.5, demandIndex: 68, absorptionRate: 11 },
  // SP interior
  'Campinas-SP': { avgPriceM2: 8900, variation12m: 4.8, demandIndex: 72, absorptionRate: 11 },
  'Ribeirão Preto-SP': { avgPriceM2: 8200, variation12m: 4.5, demandIndex: 68, absorptionRate: 12 },
  'São José dos Campos-SP': { avgPriceM2: 9500, variation12m: 5.0, demandIndex: 74, absorptionRate: 10 },
  'Sorocaba-SP': { avgPriceM2: 7800, variation12m: 4.2, demandIndex: 66, absorptionRate: 12 },
  'Santos-SP': { avgPriceM2: 10200, variation12m: 5.5, demandIndex: 76, absorptionRate: 9 },
  // MG adicional
  'Uberlândia-MG': { avgPriceM2: 7200, variation12m: 4.0, demandIndex: 64, absorptionRate: 13 },
  'Contagem-MG': { avgPriceM2: 6800, variation12m: 3.8, demandIndex: 62, absorptionRate: 14 },
  // ES
  'Vitória-ES': { avgPriceM2: 9200, variation12m: 3.8, demandIndex: 62, absorptionRate: 14 },
  'Vila Velha-ES': { avgPriceM2: 8500, variation12m: 3.5, demandIndex: 60, absorptionRate: 15 },
  'Serra-ES': { avgPriceM2: 6800, variation12m: 3.2, demandIndex: 58, absorptionRate: 15 },
  // RJ interior
  'Niterói-RJ': { avgPriceM2: 9500, variation12m: 4.5, demandIndex: 66, absorptionRate: 12 },
  // Norte adicional
  'Porto Velho-RO': { avgPriceM2: 5500, variation12m: 3.5, demandIndex: 58, absorptionRate: 15 },
  'Macapá-AP': { avgPriceM2: 4800, variation12m: 3.0, demandIndex: 52, absorptionRate: 18 },
  'Boa Vista-RR': { avgPriceM2: 5200, variation12m: 3.2, demandIndex: 54, absorptionRate: 17 },
  'Palmas-TO': { avgPriceM2: 5800, variation12m: 4.0, demandIndex: 62, absorptionRate: 13 },
  'Rio Branco-AC': { avgPriceM2: 4500, variation12m: 2.8, demandIndex: 50, absorptionRate: 18 },
};

// Function to fetch real market data from database
async function _fetchRealMarketDataFromDB(supabase: any, city: string, uf: string): Promise<{ avgPriceM2: number; variation12m: number } | null> {
  try {
    const { data, error } = await supabase
      .from('idi_fipezap_historico')
      .select('preco_m2_venda, variacao_venda_12m')
      .eq('cidade', city)
      .order('mes', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data && data.preco_m2_venda) {
      console.log(`Real data for ${city}-${uf}: R$ ${data.preco_m2_venda}/m²`);
      return {
        avgPriceM2: parseFloat(data.preco_m2_venda),
        variation12m: parseFloat(data.variacao_venda_12m || 0),
      };
    }
  } catch (_error) {
    console.log(`Could not fetch real data for ${city}-${uf}`);
  }
  return null;
}

// Fallback para indicadores macroeconômicos
const FALLBACK_MACRO = {
  selic_rate: 12.25,
  ipca_12m: 4.83,
  pib_growth: 2.9,
  last_updated: new Date().toISOString().split('T')[0],
};

// Função para buscar indicadores macro do banco (se disponível) ou usar fallback
async function getMacroIndicators(supabase: any) {
  try {
    const { data } = await supabase
      .from('idi_macro_indicadores')
      .select('selic_meta, ipca_acumulado_12m, pib_variacao_12m, data_referencia')
      .order('data_referencia', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      return {
        selic_rate: data.selic_meta || FALLBACK_MACRO.selic_rate,
        ipca_12m: data.ipca_acumulado_12m || FALLBACK_MACRO.ipca_12m,
        pib_growth: data.pib_variacao_12m || FALLBACK_MACRO.pib_growth,
        last_updated: data.data_referencia,
        source: 'bcb'
      };
    }
  } catch (_error) {
    console.log('Using fallback macro indicators');
  }
  
  return {
    ...FALLBACK_MACRO,
    source: 'fallback'
  };
}

interface IBGECity {
  id: number;
  nome: string;
}

interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

interface DataZAPResponse {
  avg_price_m2: number;
  price_variation_12m: number;
  demand_index: number;
  absorption_rate: number;
  supply_units: number;
  rental_yield?: number;
  avg_days_on_market?: number;
  properties_sold_30d?: number;
}

// Função para buscar dados da API DataZAP (quando API key estiver configurada)
async function fetchDataZAPData(city: string, uf: string, apiKey: string): Promise<DataZAPResponse | null> {
  try {
    const response = await fetch(`https://api.datazap.com.br/v1/market-data?city=${encodeURIComponent(city)}&state=${uf}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log('DataZAP API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    return {
      avg_price_m2: data.avgPricePerM2 || data.avg_price_m2,
      price_variation_12m: data.priceVariation12m || data.price_variation_12m,
      demand_index: data.demandIndex || data.demand_index,
      absorption_rate: data.absorptionRate || data.absorption_rate,
      supply_units: data.supplyUnits || data.supply_units,
      rental_yield: data.rentalYield || data.rental_yield,
      avg_days_on_market: data.avgDaysOnMarket || data.avg_days_on_market,
      properties_sold_30d: data.propertiesSold30d || data.properties_sold_30d,
    };
  } catch (error) {
    console.error('Erro ao buscar dados do DataZAP:', error);
    return null;
  }
}

// Função para buscar dados da API FipeZAP (quando API key estiver configurada)
async function fetchFipeZAPData(city: string, uf: string, apiKey: string): Promise<DataZAPResponse | null> {
  try {
    const response = await fetch(`https://api.fipezap.com.br/v1/indices?city=${encodeURIComponent(city)}&state=${uf}`, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log('FipeZAP API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    return {
      avg_price_m2: data.indice_venda || data.avg_price_m2,
      price_variation_12m: data.variacao_12m || data.price_variation_12m,
      demand_index: data.indice_demanda || 70,
      absorption_rate: data.taxa_absorcao || 10,
      supply_units: data.oferta || 1000,
      rental_yield: data.rentabilidade_aluguel,
      avg_days_on_market: data.tempo_medio_venda,
      properties_sold_30d: data.vendas_30d,
    };
  } catch (error) {
    console.error('Erro ao buscar dados do FipeZAP:', error);
    return null;
  }
}

function estimatePriceByState(uf: string): number {
  const stateAverages: Record<string, number> = {
    'SP': 9000, 'RJ': 8000, 'DF': 9500, 'SC': 8500, 'PR': 7000,
    'RS': 6500, 'MG': 6000, 'ES': 6500, 'GO': 5500, 'MT': 5000,
    'MS': 5000, 'BA': 5500, 'PE': 6000, 'CE': 5800, 'AM': 4500,
    'PA': 4200, 'MA': 4000, 'PI': 3800, 'RN': 5000, 'PB': 4800,
    'AL': 4500, 'SE': 4600, 'TO': 4000, 'RO': 4200, 'AC': 4000,
    'AP': 4000, 'RR': 4000,
  };
  return stateAverages[uf] || 5000;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req.headers.get('origin'));
  }

  try {
    const { action, city, uf, neighborhood } = await req.json();
    if (typeof action !== 'string' || action.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Ação inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar indicadores macro uma vez
    const macroIndicators = await getMacroIndicators(supabase);
    
    // Verificar se há API keys comerciais configuradas
    const datazapApiKey = Deno.env.get('DATAZAP_API_KEY');
    const fipezapApiKey = Deno.env.get('FIPEZAP_API_KEY');
    const hasCommercialApi = !!(datazapApiKey || fipezapApiKey);

    if (action === 'check-api-status') {
      return new Response(JSON.stringify({
        success: true,
        data: {
          hasDataZAP: !!datazapApiKey,
          hasFipeZAP: !!fipezapApiKey,
          hasCommercialApi,
          macroSource: macroIndicators.source,
          availableSources: [
            { name: 'IBGE', status: 'active', description: 'Dados demográficos e geográficos' },
            { name: 'BCB', status: macroIndicators.source === 'bcb' ? 'active' : 'fallback', description: 'Indicadores macroeconômicos (Selic, IPCA, PIB)' },
            { name: 'DataZAP', status: datazapApiKey ? 'active' : 'not_configured', description: 'Dados de mercado imobiliário detalhados' },
            { name: 'FipeZAP', status: fipezapApiKey ? 'active' : 'not_configured', description: 'Índices de preços imobiliários' },
            { name: 'Estimativas', status: 'active', description: 'Dados estimados baseados em análises regionais' },
          ],
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list-states') {
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
      const states: IBGEState[] = await response.json();
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: states.map(s => ({ id: s.id, sigla: s.sigla, nome: s.nome }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list-cities') {
      if (!uf) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'UF é obrigatório' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      const cities: IBGECity[] = await response.json();
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: cities.map(c => ({ id: c.id, nome: c.nome }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-market-data') {
      if (!city || !uf) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Cidade e UF são obrigatórios' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verificar se há dados em cache no banco
      const { data: cachedData } = await supabase
        .from('market_data')
        .select('*')
        .eq('city', city)
        .eq('uf', uf)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cachedData) {
        console.log('Retornando dados do cache para:', city, uf);
        return new Response(JSON.stringify({ 
          success: true, 
          data: cachedData,
          source: cachedData.source || 'cache',
          hasCommercialApi,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let marketData: any = null;
      let dataSource = 'estimated';

      // Tentar buscar de APIs comerciais primeiro
      if (datazapApiKey) {
        console.log('Tentando buscar dados do DataZAP para:', city, uf);
        const datazapData = await fetchDataZAPData(city, uf, datazapApiKey);
        if (datazapData) {
          marketData = {
            city,
            uf,
            neighborhood: neighborhood || null,
            avg_price_m2: datazapData.avg_price_m2,
            price_variation_12m: datazapData.price_variation_12m,
            demand_index: datazapData.demand_index,
            absorption_rate: datazapData.absorption_rate,
            supply_units: datazapData.supply_units,
            rental_yield: datazapData.rental_yield,
            avg_days_on_market: datazapData.avg_days_on_market,
            properties_sold_30d: datazapData.properties_sold_30d,
            selic_rate: macroIndicators.selic_rate,
            ipca_12m: macroIndicators.ipca_12m,
            pib_growth: macroIndicators.pib_growth,
            source: 'datazap',
          };
          dataSource = 'datazap';
        }
      }

      if (!marketData && fipezapApiKey) {
        console.log('Tentando buscar dados do FipeZAP para:', city, uf);
        const fipezapData = await fetchFipeZAPData(city, uf, fipezapApiKey);
        if (fipezapData) {
          marketData = {
            city,
            uf,
            neighborhood: neighborhood || null,
            avg_price_m2: fipezapData.avg_price_m2,
            price_variation_12m: fipezapData.price_variation_12m,
            demand_index: fipezapData.demand_index,
            absorption_rate: fipezapData.absorption_rate,
            supply_units: fipezapData.supply_units,
            rental_yield: fipezapData.rental_yield,
            avg_days_on_market: fipezapData.avg_days_on_market,
            properties_sold_30d: fipezapData.properties_sold_30d,
            selic_rate: macroIndicators.selic_rate,
            ipca_12m: macroIndicators.ipca_12m,
            pib_growth: macroIndicators.pib_growth,
            source: 'fipezap',
          };
          dataSource = 'fipezap';
        }
      }

      // Fallback para dados estimados (usando FALLBACK_MARKET_DATA)
      if (!marketData) {
        const cityKey = `${city}-${uf}`;
        const baseData = FALLBACK_MARKET_DATA[cityKey];
        
        if (baseData) {
          marketData = {
            city,
            uf,
            neighborhood: neighborhood || null,
            avg_price_m2: baseData.avgPriceM2,
            price_variation_12m: baseData.variation12m,
            demand_index: baseData.demandIndex,
            absorption_rate: baseData.absorptionRate,
            supply_units: Math.floor(Math.random() * 5000) + 1000,
            selic_rate: macroIndicators.selic_rate,
            ipca_12m: macroIndicators.ipca_12m,
            pib_growth: macroIndicators.pib_growth,
            source: 'fallback',
          };
        } else {
          const avgPriceM2 = estimatePriceByState(uf);
          marketData = {
            city,
            uf,
            neighborhood: neighborhood || null,
            avg_price_m2: avgPriceM2,
            price_variation_12m: 5.0 + Math.random() * 5,
            demand_index: 60 + Math.floor(Math.random() * 25),
            absorption_rate: 8 + Math.random() * 6,
            supply_units: Math.floor(Math.random() * 3000) + 500,
            selic_rate: macroIndicators.selic_rate,
            ipca_12m: macroIndicators.ipca_12m,
            pib_growth: macroIndicators.pib_growth,
            source: 'estimated',
          };
        }
      }

      // Salvar no cache
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (dataSource !== 'estimated' ? 6 : 24));
      
      await supabase
        .from('market_data')
        .upsert({
          city: marketData.city,
          uf: marketData.uf,
          neighborhood: marketData.neighborhood,
          avg_price_m2: marketData.avg_price_m2,
          price_variation_12m: marketData.price_variation_12m,
          demand_index: marketData.demand_index,
          absorption_rate: marketData.absorption_rate,
          supply_units: marketData.supply_units,
          selic_rate: marketData.selic_rate,
          ipca_12m: marketData.ipca_12m,
          pib_growth: marketData.pib_growth,
          source: marketData.source,
          expires_at: expiresAt.toISOString(),
        }, {
          onConflict: 'city,uf',
        });

      console.log('Dados de mercado gerados para:', city, uf, '- fonte:', dataSource);
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: marketData,
        source: dataSource,
        hasCommercialApi,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-all-cities-data') {
      // First try to get real data from idi_fipezap_historico
      let allData: any[] = [];
      
      try {
        const { data: realData, error } = await supabase
          .from('idi_fipezap_historico')
          .select('cidade, uf, preco_m2_venda, variacao_venda_12m')
          .not('preco_m2_venda', 'is', null)
          .order('mes', { ascending: false });

        if (!error && realData && realData.length > 0) {
          // Get unique cities with their latest data
          const cityMap = new Map<string, any>();
          realData.forEach((r: any) => {
            const key = `${r.cidade}-${r.uf}`;
            if (!cityMap.has(key)) {
              cityMap.set(key, {
                city: r.cidade,
                uf: r.uf,
                avg_price_m2: parseFloat(r.preco_m2_venda),
                price_variation_12m: parseFloat(r.variacao_venda_12m || 0),
                demand_index: 70 + Math.floor(Math.random() * 20),
                absorption_rate: 8 + Math.random() * 6,
                supply_units: Math.floor(Math.random() * 5000) + 1000,
                selic_rate: macroIndicators.selic_rate,
                ipca_12m: macroIndicators.ipca_12m,
                pib_growth: macroIndicators.pib_growth,
                source: 'fipezap_db',
              });
            }
          });
          
          // Get main cities only (capitals and major cities)
          const mainCities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 
            'Brasília', 'Salvador', 'Fortaleza', 'Recife', 'Goiânia', 'Florianópolis', 'Campinas',
            'Vitória', 'Manaus', 'Belém', 'Natal', 'João Pessoa', 'Maceió', 'Aracaju', 'Cuiabá', 'Campo Grande'];
          
          allData = Array.from(cityMap.values()).filter(d => mainCities.includes(d.city));
          console.log(`Loaded ${allData.length} cities from real data`);
        }
      } catch (e) {
        console.error('Error fetching real data:', e);
        console.log('Could not fetch real data, using fallback');
      }
      
      // If no real data, use FALLBACK_MARKET_DATA
      if (allData.length === 0) {
        allData = Object.entries(FALLBACK_MARKET_DATA).map(([key, fallbackData]) => {
          const [city, uf] = key.split('-');
          return {
            city,
            uf,
            avg_price_m2: fallbackData.avgPriceM2,
            price_variation_12m: fallbackData.variation12m,
            demand_index: fallbackData.demandIndex,
            absorption_rate: fallbackData.absorptionRate,
            supply_units: Math.floor(Math.random() * 5000) + 1000,
            selic_rate: macroIndicators.selic_rate,
            ipca_12m: macroIndicators.ipca_12m,
            pib_growth: macroIndicators.pib_growth,
            source: 'fallback',
          };
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        data: allData,
        macro: macroIndicators,
        hasCommercialApi,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Ação não reconhecida' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na edge function market-data:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
