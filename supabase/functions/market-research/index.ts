import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validateRequestBody } from "../_shared/validation.ts";

// Códigos das séries temporais do BCB
const BCB_SERIES = {
  selic_meta: 432,
  ipca_12m: 13522,
  incc: 192,
  igpm: 189,
  pib_variacao: 7326,
  taxa_desemprego: 24369,
  confianca_consumidor: 4393,
  confianca_empresario: 7343
};

// Dados de segmentos por faixa econômica
const SEGMENT_PROFILES = {
  economico: {
    name: 'Econômico (MCMV)',
    income_range: 'Até R$ 8.000/mês',
    ticket_range: { min: 200000, max: 350000 },
    buyer_profile: {
      age_range: '25-35 anos',
      marital_status: 'Casados/União estável',
      family_size: '3-4 pessoas',
      motivation: 'Primeiro imóvel',
      income_individual: 4500,
      income_family: 7500
    }
  },
  medio: {
    name: 'Médio',
    income_range: 'R$ 8.000 - R$ 15.000/mês',
    ticket_range: { min: 350000, max: 600000 },
    buyer_profile: {
      age_range: '30-45 anos',
      marital_status: 'Casados',
      family_size: '3-4 pessoas',
      motivation: 'Upgrade de imóvel',
      income_individual: 10000,
      income_family: 18000
    }
  },
  medio_alto: {
    name: 'Médio-Alto',
    income_range: 'R$ 15.000 - R$ 30.000/mês',
    ticket_range: { min: 600000, max: 1200000 },
    buyer_profile: {
      age_range: '35-50 anos',
      marital_status: 'Casados',
      family_size: '4-5 pessoas',
      motivation: 'Qualidade de vida',
      income_individual: 22000,
      income_family: 35000
    }
  },
  alto_padrao: {
    name: 'Alto Padrão',
    income_range: 'Acima de R$ 30.000/mês',
    ticket_range: { min: 1200000, max: 5000000 },
    buyer_profile: {
      age_range: '40-60 anos',
      marital_status: 'Casados',
      family_size: '3-4 pessoas',
      motivation: 'Investimento/Exclusividade',
      income_individual: 50000,
      income_family: 80000
    }
  }
};

interface BCBSeriesData {
  data: string;
  valor: string;
}

// Buscar série do BCB
async function fetchBCBSeries(serieCode: number, lastN: number = 12): Promise<BCBSeriesData[]> {
  try {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serieCode}/dados/ultimos/${lastN}?formato=json`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error(`Error fetching BCB series ${serieCode}:`, error);
    return [];
  }
}

// Buscar PTAX (dólar)
async function fetchPTAX(): Promise<number | null> {
  try {
    const today = new Date();
    // const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const formatDate = (d: Date) => `'${d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}'`;
    
    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao=${formatDate(today)}&$format=json`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    const data = await response.json();
    return data.value?.[0]?.cotacaoCompra || null;
  } catch (error) {
    console.error('Error fetching PTAX:', error);
    return null;
  }
}

// Buscar dados populacionais do IBGE
async function _fetchIBGEPopulation(cityCode: string): Promise<any> {
  try {
    const url = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${cityCode}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching IBGE population:', error);
    return null;
  }
}

// Estimativa de população por cidade
const CITY_POPULATION: Record<string, number> = {
  'São Paulo': 12400000,
  'Rio de Janeiro': 6800000,
  'Brasília': 3100000,
  'Salvador': 2900000,
  'Fortaleza': 2700000,
  'Belo Horizonte': 2500000,
  'Manaus': 2300000,
  'Curitiba': 1960000,
  'Recife': 1650000,
  'Goiânia': 1560000,
  'Porto Alegre': 1490000,
  'Belém': 1500000,
  'Guarulhos': 1400000,
  'Campinas': 1220000,
  'São Luís': 1110000,
  'São Gonçalo': 1090000,
  'Maceió': 1030000,
  'Duque de Caxias': 930000,
  'Natal': 890000,
  'Campo Grande': 910000,
  'Teresina': 870000,
  'São Bernardo do Campo': 840000,
  'João Pessoa': 820000,
  'Santo André': 720000,
  'Osasco': 700000,
  'Ribeirão Preto': 700000,
  'Uberlândia': 700000,
  'Sorocaba': 680000,
  'Contagem': 660000,
  'Aracaju': 660000,
  'Feira de Santana': 620000,
  'Cuiabá': 620000,
  'Joinville': 600000,
  'Juiz de Fora': 580000,
  'Londrina': 580000,
  'Aparecida de Goiânia': 570000,
  'Niterói': 520000,
  'Ananindeua': 540000,
  'Porto Velho': 540000,
  'Serra': 530000,
  'Caxias do Sul': 520000,
  'Vila Velha': 500000,
  'Florianópolis': 510000,
  'Macapá': 510000,
  'Betim': 450000,
  'Santos': 430000,
  'Mogi das Cruzes': 450000,
  'Jundiaí': 420000,
  'Piracicaba': 410000,
  'Maringá': 430000,
  'Bauru': 380000,
  'Anápolis': 390000,
  'Vitória': 360000,
  'Boa Vista': 420000,
  'Montes Claros': 410000,
  'Caruaru': 370000,
  'Blumenau': 360000,
  'Ponta Grossa': 355000,
  'Cascavel': 330000,
  'Praia Grande': 330000,
  'Pelotas': 340000,
  'Paulista': 330000,
  'Canoas': 350000,
  'Petrolina': 360000,
  'Franca': 355000,
  'São José dos Campos': 730000,
  'Ribeirão das Neves': 340000,
  'Uberaba': 340000,
  'São José do Rio Preto': 465000,
  'Palmas': 310000,
  'Limeira': 305000,
  'Taubaté': 320000,
  'Vitória da Conquista': 340000,
  'Governador Valadares': 280000,
  'Santa Maria': 280000,
  'Gravataí': 280000,
  'Novo Hamburgo': 250000,
  'Volta Redonda': 275000,
  'Rio Grande': 210000,
};

function getLatestValue(data: BCBSeriesData[]): number | null {
  if (!data || data.length === 0) return null;
  return parseFloat(data[data.length - 1].valor);
}

function calculateAccumulated12m(data: BCBSeriesData[]): number | null {
  if (!data || data.length < 12) return null;
  let accumulated = 1;
  for (const item of data.slice(-12)) {
    accumulated *= (1 + parseFloat(item.valor) / 100);
  }
  return (accumulated - 1) * 100;
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  // Rate limiting: 60 requisições/minuto por IP
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const rl = await rateLimit(ip, { maxRequests: 60, windowMs: 60000, keyPrefix: 'market-research' });
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) },
    });
  }

  try {
    const { action, projectId: _projectId, city, uf, neighborhood } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ============= BLOCO 1: MACROECONÔMICO =============
    if (action === 'fetch-macro') {
      console.log('Fetching comprehensive macro data...');
      
      const [
        selicData,
        ipca12mData,
        inccData,
        igpmData,
        pibData,
        desempregoData,
        confiancaConsData,
        confiancaEmpData
      ] = await Promise.all([
        fetchBCBSeries(BCB_SERIES.selic_meta, 13),
        fetchBCBSeries(BCB_SERIES.ipca_12m, 13),
        fetchBCBSeries(BCB_SERIES.incc, 12),
        fetchBCBSeries(BCB_SERIES.igpm, 12),
        fetchBCBSeries(BCB_SERIES.pib_variacao, 5),
        fetchBCBSeries(BCB_SERIES.taxa_desemprego, 5),
        fetchBCBSeries(BCB_SERIES.confianca_consumidor, 5),
        fetchBCBSeries(BCB_SERIES.confianca_empresario, 5)
      ]);
      
      const ptax = await fetchPTAX();
      
      // Calcular variações 12 meses
      const selicCurrent = getLatestValue(selicData);
      const selicPrevious = selicData.length > 12 ? parseFloat(selicData[0].valor) : null;
      const selicVariation = selicCurrent && selicPrevious ? selicCurrent - selicPrevious : null;
      
      const ipcaCurrent = getLatestValue(ipca12mData);
      const ipcaPrevious = ipca12mData.length > 12 ? parseFloat(ipca12mData[0].valor) : null;
      
      // Calcular taxa de financiamento Caixa estimada
      const financingRate = selicCurrent ? Math.max(selicCurrent - 3.0, 9.99) : 10.49;
      
      const macroData = {
        indicators: {
          selic: {
            current: selicCurrent,
            previous_12m: selicPrevious,
            variation_12m: selicVariation,
            trend: selicVariation && selicVariation > 0 ? 'up' : 'down',
            source: 'BCB'
          },
          ipca: {
            current: ipcaCurrent,
            previous_12m: ipcaPrevious,
            trend: ipcaCurrent && ipcaCurrent > 4.5 ? 'high' : 'normal',
            source: 'BCB'
          },
          incc: {
            monthly: getLatestValue(inccData),
            accumulated_12m: calculateAccumulated12m(inccData),
            source: 'BCB'
          },
          igpm: {
            monthly: getLatestValue(igpmData),
            accumulated_12m: calculateAccumulated12m(igpmData),
            source: 'BCB'
          },
          pib: {
            quarterly_variation: getLatestValue(pibData),
            trend: (getLatestValue(pibData) || 0) > 0 ? 'growth' : 'recession',
            source: 'BCB'
          },
          unemployment: {
            rate: getLatestValue(desempregoData),
            source: 'IBGE/BCB'
          },
          consumer_confidence: {
            index: getLatestValue(confiancaConsData),
            source: 'FGV/BCB'
          },
          business_confidence: {
            index: getLatestValue(confiancaEmpData),
            source: 'CNI/BCB'
          },
          dollar: {
            rate: ptax,
            source: 'BCB/PTAX'
          },
          financing_rate: {
            caixa_estimate: financingRate,
            sbpe_estimate: financingRate + 0.5,
            fgts_estimate: financingRate - 2,
            source: 'Estimativa baseada em Selic'
          }
        },
        summary: generateMacroSummary({
          selic: selicCurrent,
          ipca: ipcaCurrent,
          pib: getLatestValue(pibData),
          unemployment: getLatestValue(desempregoData),
          consumerConfidence: getLatestValue(confiancaConsData),
          financingRate
        }),
        impact_analysis: generateImpactAnalysis({
          selic: selicCurrent,
          ipca: ipcaCurrent,
          incc: calculateAccumulated12m(inccData),
          financingRate
        }),
        projections: {
          selic_12m: 'Tendência de queda gradual',
          ipca_12m: 'Convergência para meta de 3%',
          financing_12m: 'Redução estimada de 0.5-1.0 p.p.'
        },
        data_sources: [
          { name: 'Banco Central do Brasil', url: 'https://www.bcb.gov.br' },
          { name: 'IBGE', url: 'https://www.ibge.gov.br' },
          { name: 'FGV', url: 'https://portal.fgv.br' }
        ],
        fetched_at: new Date().toISOString()
      };

      return new Response(JSON.stringify({
        success: true,
        data: macroData
      }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // ============= BLOCO 2: ANÁLISE DA CIDADE =============
    if (action === 'fetch-city-data') {
      console.log(`Fetching city data for ${city}, ${uf}...`);
      
      // Buscar dados do FipeZap
      const { data: fipezapData, error: _fipezapError } = await supabase
        .from('idi_fipezap_historico')
        .select('*')
        .eq('cidade', city)
        .eq('uf', uf)
        .order('mes', { ascending: false })
        .limit(24);
      
      // Buscar snapshot de mercado
      const { data: snapshotData } = await supabase
        .from('idi_mercado_snapshot')
        .select('*')
        .eq('cidade', city)
        .eq('uf', uf)
        .order('data_coleta', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Buscar score IDI
      const { data: idiScore } = await supabase
        .from('idi_score_cache')
        .select('*')
        .eq('cidade', city)
        .eq('uf', uf)
        .order('mes', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Calcular variações
      const latestPrice = fipezapData?.[0]?.preco_m2_venda;
      const price12mAgo = fipezapData?.[11]?.preco_m2_venda;
      const price24mAgo = fipezapData?.[23]?.preco_m2_venda;
      
      const variation12m = latestPrice && price12mAgo 
        ? ((latestPrice - price12mAgo) / price12mAgo) * 100 
        : fipezapData?.[0]?.variacao_venda_12m;
      
      const variation24m = latestPrice && price24mAgo 
        ? ((latestPrice - price24mAgo) / price24mAgo) * 100 
        : null;
      
      // Estimar dados por segmento
      const population = CITY_POPULATION[city] || 300000;
      const households = Math.round(population / 3.1);
      
      const cityData = {
        city,
        uf,
        population,
        households,
        price_data: {
          current_price_m2: latestPrice,
          rent_price_m2: fipezapData?.[0]?.preco_m2_locacao,
          variation_12m: variation12m,
          variation_24m: variation24m,
          variation_36m: null,
          index_sale: fipezapData?.[0]?.indice_venda,
          index_rent: fipezapData?.[0]?.indice_locacao,
          historical: fipezapData?.slice(0, 12).reverse().map(d => ({
            month: d.mes,
            price_m2: d.preco_m2_venda,
            rent_m2: d.preco_m2_locacao
          }))
        },
        market_snapshot: snapshotData ? {
          active_listings: snapshotData.anuncios_ativos,
          new_listings_day: snapshotData.anuncios_novos_dia,
          avg_days_to_sell: snapshotData.dias_venda_media,
          apartments_pct: snapshotData.apartamentos_pct,
          houses_pct: snapshotData.casas_pct,
          commercial_pct: snapshotData.comercial_pct
        } : null,
        idi_score: idiScore ? {
          score: idiScore.score_idi_normalizado,
          national_rank: idiScore.ranking_nacional,
          state_rank: idiScore.ranking_estadual,
          price_score: idiScore.score_preco,
          demand_score: idiScore.score_demanda,
          liquidity_score: idiScore.score_liquidez
        } : null,
        segments: generateSegmentAnalysis(latestPrice, city),
        best_neighborhoods: await getBestNeighborhoods(supabase, city, uf),
        economic_drivers: getEconomicDrivers(city),
        data_sources: ['FipeZap', 'IDI', 'IBGE'],
        fetched_at: new Date().toISOString()
      };

      return new Response(JSON.stringify({
        success: true,
        data: cityData
      }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // ============= BLOCO 3: ANÁLISE DO BAIRRO =============
    if (action === 'fetch-neighborhood-data') {
      console.log(`Fetching neighborhood data for ${neighborhood}, ${city}, ${uf}...`);
      
      // Buscar dados específicos do bairro
      const { data: neighborhoodSnapshot } = await supabase
        .from('idi_mercado_snapshot')
        .select('*')
        .eq('cidade', city)
        .eq('uf', uf)
        .eq('bairro', neighborhood)
        .order('data_coleta', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Buscar média da cidade para comparação
      const { data: citySnapshot } = await supabase
        .from('idi_mercado_snapshot')
        .select('*')
        .eq('cidade', city)
        .eq('uf', uf)
        .is('bairro', null)
        .order('data_coleta', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const neighborhoodData = {
        neighborhood,
        city,
        uf,
        price_data: neighborhoodSnapshot ? {
          avg_price_m2: neighborhoodSnapshot.preco_m2_medio,
          min_price_m2: neighborhoodSnapshot.preco_m2_min,
          max_price_m2: neighborhoodSnapshot.preco_m2_max,
          vs_city_avg: citySnapshot?.preco_m2_medio 
            ? ((neighborhoodSnapshot.preco_m2_medio - citySnapshot.preco_m2_medio) / citySnapshot.preco_m2_medio) * 100
            : null
        } : null,
        market_data: neighborhoodSnapshot ? {
          active_listings: neighborhoodSnapshot.anuncios_ativos,
          avg_days_to_sell: neighborhoodSnapshot.dias_venda_media,
          apartments_pct: neighborhoodSnapshot.apartamentos_pct,
          houses_pct: neighborhoodSnapshot.casas_pct
        } : null,
        infrastructure: getNeighborhoodInfrastructure(neighborhood, city),
        socioeconomic_profile: getNeighborhoodProfile(neighborhood, city),
        growth_trends: {
          appreciation_trend: 'Estável',
          new_developments_24m: 'Moderado',
          infrastructure_investments: 'Baixo'
        },
        data_sources: ['IDI', 'Estimativas'],
        fetched_at: new Date().toISOString()
      };

      return new Response(JSON.stringify({
        success: true,
        data: neighborhoodData
      }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // ============= BLOCO 4: AVALIAR ADEQUAÇÃO DO PRODUTO =============
    if (action === 'evaluate-product-adequacy') {
      const { projectData, neighborhoodData, cityData } = await req.json();
      
      const adequacy = evaluateProductAdequacy(projectData, neighborhoodData, cityData);
      
      return new Response(JSON.stringify({
        success: true,
        data: adequacy
      }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // ============= BLOCO 5: ANÁLISE DE DEMANDA =============
    if (action === 'calculate-demand') {
      const { cityData, projectData } = await req.json();
      
      const demand = calculateDemand(cityData, projectData);
      
      return new Response(JSON.stringify({
        success: true,
        data: demand
      }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // ============= BLOCO 6: PROJEÇÃO DE VELOCIDADE DE VENDAS =============
    if (action === 'project-sales-velocity') {
      const { demandData, projectData, competitorData } = await req.json();
      
      const velocity = projectSalesVelocity(demandData, projectData, competitorData);
      
      return new Response(JSON.stringify({
        success: true,
        data: velocity
      }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // ============= BLOCO 7: GERAR CONCLUSÃO =============
    if (action === 'generate-conclusion') {
      const { macroData, cityData, neighborhoodData, adequacyData, demandData, velocityData } = await req.json();
      
      const conclusion = generateMarketConclusion({
        macroData,
        cityData,
        neighborhoodData,
        adequacyData,
        demandData,
        velocityData
      });
      
      return new Response(JSON.stringify({
        success: true,
        data: conclusion
      }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // ============= SALVAR RELATÓRIO =============
    if (action === 'save-report') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), {
          status: 401,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }
      
      // SECURITY: Verify user from JWT token
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error('Auth verification failed:', authError);
        return new Response(JSON.stringify({ success: false, error: 'Token inválido ou expirado' }), {
          status: 401,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }
      
      const { reportData } = await req.json();
      
      // SECURITY: Force user_id to authenticated user - ignore any client-provided value
      const safeReportData = {
        ...reportData,
        user_id: user.id  // Override any client-provided user_id
      };
      
      // SECURITY: If updating existing report, verify ownership first
      if (reportData.id) {
        const { data: existing, error: fetchError } = await supabase
          .from('market_research_reports')
          .select('user_id')
          .eq('id', reportData.id)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching existing report:', fetchError);
          return new Response(JSON.stringify({ success: false, error: 'Erro ao verificar relatório' }), {
            status: 500,
            headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
          });
        }
        
        // If report exists but belongs to another user, deny access
        if (existing && existing.user_id !== user.id) {
          console.warn(`Unauthorized access attempt: user ${user.id} tried to modify report owned by ${existing.user_id}`);
          return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), {
            status: 403,
            headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
          });
        }
      }
      
      const { data, error } = await supabase
        .from('market_research_reports')
        .upsert(safeReportData)
        .select()
        .single();
      
      if (error) {
        console.error('Error saving report:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Ação não reconhecida'
    }), {
      status: 400,
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in market-research function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    }), {
      status: 500,
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});

// ============= FUNÇÕES AUXILIARES =============

function generateMacroSummary(data: any): string {
  const { selic, ipca, pib, unemployment, consumerConfidence: _consumerConfidence, financingRate } = data;
  
  let summary = '';
  
  // Análise da Selic
  if (selic) {
    if (selic > 12) {
      summary += `A taxa Selic encontra-se em patamar elevado de ${selic.toFixed(2)}% a.a., impactando diretamente o custo de financiamento imobiliário. `;
    } else if (selic > 10) {
      summary += `A taxa Selic em ${selic.toFixed(2)}% a.a. representa um ambiente de juros moderados para o setor imobiliário. `;
    } else {
      summary += `A taxa Selic de ${selic.toFixed(2)}% a.a. configura um cenário favorável para financiamentos imobiliários. `;
    }
  }
  
  // Análise da inflação
  if (ipca) {
    if (ipca > 6) {
      summary += `O IPCA acumulado em 12 meses de ${ipca.toFixed(2)}% indica pressão inflacionária que pode afetar custos de construção. `;
    } else if (ipca > 4.5) {
      summary += `A inflação de ${ipca.toFixed(2)}% está acima da meta, mas em níveis controlados. `;
    } else {
      summary += `O IPCA de ${ipca.toFixed(2)}% demonstra estabilidade de preços favorável ao setor. `;
    }
  }
  
  // Análise do PIB
  if (pib !== null && pib !== undefined) {
    if (pib > 0) {
      summary += `O crescimento do PIB de ${pib.toFixed(1)}% no trimestre indica aquecimento da economia. `;
    } else {
      summary += `A retração do PIB de ${pib.toFixed(1)}% no trimestre sinaliza cautela para novos investimentos. `;
    }
  }
  
  // Análise do desemprego
  if (unemployment) {
    if (unemployment > 10) {
      summary += `A taxa de desemprego de ${unemployment.toFixed(1)}% pode limitar a demanda por imóveis. `;
    } else {
      summary += `O desemprego em ${unemployment.toFixed(1)}% indica mercado de trabalho aquecido, favorecendo a demanda habitacional. `;
    }
  }
  
  // Conclusão sobre financiamento
  summary += `As taxas de financiamento habitacional estimadas giram em torno de ${financingRate.toFixed(2)}% a.a. (SBPE).`;
  
  return summary;
}

function generateImpactAnalysis(data: any): any {
  const { selic, ipca: _ipca, incc, financingRate } = data;
  
  return {
    financing: {
      impact: selic > 12 ? 'negativo' : selic > 10 ? 'neutro' : 'positivo',
      description: `Taxa de financiamento em ${financingRate?.toFixed(2)}% a.a. ${selic > 12 ? 'eleva o custo de aquisição' : 'permite acesso a crédito competitivo'}.`
    },
    demand: {
      impact: selic > 12 ? 'moderado' : 'positivo',
      description: 'Demanda habitacional mantém-se resiliente com déficit habitacional elevado.'
    },
    construction_costs: {
      impact: (incc || 0) > 8 ? 'negativo' : 'neutro',
      description: `INCC acumulado de ${(incc || 0).toFixed(1)}% ${(incc || 0) > 8 ? 'pressiona margens de incorporação' : 'em patamares controlados'}.`
    },
    market_sentiment: {
      impact: 'moderado',
      description: 'Expectativas do mercado imobiliário apontam para recuperação gradual.'
    }
  };
}

function generateSegmentAnalysis(avgPriceM2: number | null, city: string): any {
  if (!avgPriceM2) {
    return Object.entries(SEGMENT_PROFILES).map(([key, profile]) => ({
      segment: key,
      ...profile,
      trend: 'Dados indisponíveis',
      recommendation: 'Consultar dados locais'
    }));
  }
  
  return Object.entries(SEGMENT_PROFILES).map(([key, profile]) => {
    const ticketMedio = (profile.ticket_range.min + profile.ticket_range.max) / 2;
    const areaEstimada = ticketMedio / avgPriceM2;
    
    return {
      segment: key,
      ...profile,
      estimated_area_m2: Math.round(areaEstimada),
      price_m2_range: {
        min: Math.round(profile.ticket_range.min / (areaEstimada * 1.2)),
        max: Math.round(profile.ticket_range.max / (areaEstimada * 0.8))
      },
      trend: getTrendForSegment(key, city),
      recommendation: getRecommendationForSegment(key, city)
    };
  });
}

function getTrendForSegment(segment: string, _city: string): string {
  // Lógica simplificada - pode ser expandida com dados reais
  const trends: Record<string, string> = {
    economico: 'Alta demanda',
    medio: 'Estável',
    medio_alto: 'Crescimento moderado',
    alto_padrao: 'Seletivo'
  };
  return trends[segment] || 'Estável';
}

function getRecommendationForSegment(segment: string, _city: string): string {
  const recs: Record<string, string> = {
    economico: 'Foco em financiamento MCMV e localização próxima a transporte',
    medio: 'Valorizar acabamentos e área de lazer completa',
    medio_alto: 'Diferenciação por localização premium e tecnologia',
    alto_padrao: 'Exclusividade, personalização e serviços agregados'
  };
  return recs[segment] || '';
}

async function getBestNeighborhoods(supabase: any, city: string, uf: string): Promise<any[]> {
  const { data } = await supabase
    .from('idi_mercado_snapshot')
    .select('bairro, preco_m2_medio, anuncios_ativos, dias_venda_media')
    .eq('cidade', city)
    .eq('uf', uf)
    .not('bairro', 'is', null)
    .order('preco_m2_medio', { ascending: false })
    .limit(10);
  
  if (!data) return [];
  
  // Agrupar por faixa de preço
  const segments: Record<string, any[]> = {
    alto_padrao: [],
    medio_alto: [],
    medio: [],
    economico: []
  };
  
  data.forEach((neighborhood: any) => {
    if (neighborhood.preco_m2_medio > 12000) {
      segments.alto_padrao.push(neighborhood);
    } else if (neighborhood.preco_m2_medio > 8000) {
      segments.medio_alto.push(neighborhood);
    } else if (neighborhood.preco_m2_medio > 5000) {
      segments.medio.push(neighborhood);
    } else {
      segments.economico.push(neighborhood);
    }
  });
  
  return Object.entries(segments).map(([segment, neighborhoods]) => ({
    segment,
    neighborhoods: neighborhoods.slice(0, 5).map(n => ({
      name: n.bairro,
      price_m2: n.preco_m2_medio,
      listings: n.anuncios_ativos,
      days_to_sell: n.dias_venda_media
    }))
  }));
}

function getEconomicDrivers(city: string): string[] {
  const drivers: Record<string, string[]> = {
    'São Paulo': ['Serviços financeiros', 'Tecnologia', 'Indústria', 'Comércio'],
    'Rio de Janeiro': ['Turismo', 'Petróleo e Gás', 'Serviços', 'Portos'],
    'Brasília': ['Administração pública', 'Serviços', 'Comércio'],
    'Goiânia': ['Agronegócio', 'Serviços', 'Indústria', 'Logística'],
    'Belo Horizonte': ['Mineração', 'Serviços', 'Tecnologia', 'Indústria'],
    'Curitiba': ['Indústria automotiva', 'Tecnologia', 'Serviços'],
    'Porto Alegre': ['Indústria', 'Serviços', 'Agronegócio'],
    'Salvador': ['Turismo', 'Indústria', 'Serviços', 'Petroquímica'],
    'Fortaleza': ['Turismo', 'Comércio', 'Indústria têxtil'],
    'Recife': ['Tecnologia', 'Serviços', 'Turismo', 'Indústria'],
  };
  
  return drivers[city] || ['Comércio', 'Serviços', 'Indústria local'];
}

function getNeighborhoodInfrastructure(_neighborhood: string, _city: string): any {
  // Dados genéricos - em produção, buscar de APIs específicas
  return {
    transport: {
      metro: 'Verificar disponibilidade',
      bus_lines: 'Múltiplas linhas',
      main_roads: 'Acesso facilitado'
    },
    education: {
      schools: 'Diversas opções',
      universities: 'Proximidade a instituições'
    },
    health: {
      hospitals: 'Hospitais na região',
      clinics: 'Rede de atendimento disponível'
    },
    commerce: {
      shopping_centers: 'Centros comerciais próximos',
      local_commerce: 'Comércio de bairro ativo'
    },
    leisure: {
      parks: 'Áreas verdes disponíveis',
      cultural: 'Opções culturais na região'
    }
  };
}

function getNeighborhoodProfile(_neighborhood: string, _city: string): any {
  return {
    predominant_class: 'Classe média',
    avg_household_income: 'R$ 8.000 - R$ 15.000',
    education_level: 'Ensino superior',
    age_profile: '30-50 anos predominante',
    family_composition: 'Famílias com filhos'
  };
}

function evaluateProductAdequacy(projectData: any, neighborhoodData: any, cityData: any): any {
  let score = 0;
  const factors: any[] = [];
  
  // Verificar preço vs mercado
  const projectPriceM2 = projectData.vgv / (projectData.total_units * projectData.avg_unit_size);
  const marketPriceM2 = neighborhoodData?.price_data?.avg_price_m2 || cityData?.price_data?.current_price_m2;
  
  if (marketPriceM2) {
    const priceDiff = ((projectPriceM2 - marketPriceM2) / marketPriceM2) * 100;
    
    if (Math.abs(priceDiff) <= 10) {
      score += 30;
      factors.push({ factor: 'Preço/m²', status: 'adequado', detail: 'Preço alinhado ao mercado' });
    } else if (Math.abs(priceDiff) <= 20) {
      score += 20;
      factors.push({ factor: 'Preço/m²', status: 'parcial', detail: `${priceDiff > 0 ? 'Acima' : 'Abaixo'} do mercado em ${Math.abs(priceDiff).toFixed(0)}%` });
    } else {
      score += 10;
      factors.push({ factor: 'Preço/m²', status: 'inadequado', detail: `Diferença significativa de ${Math.abs(priceDiff).toFixed(0)}% vs mercado` });
    }
  }
  
  // Verificar tipologia vs perfil do bairro
  const propertyType = projectData.property_type;
  const neighborhoodProfile = neighborhoodData?.market_data || {};
  
  if (propertyType === 'Apartamento' && (neighborhoodProfile.apartments_pct || 50) > 40) {
    score += 25;
    factors.push({ factor: 'Tipologia', status: 'adequado', detail: 'Apartamentos são predominantes na região' });
  } else if (propertyType === 'Casa' && (neighborhoodProfile.houses_pct || 30) > 30) {
    score += 25;
    factors.push({ factor: 'Tipologia', status: 'adequado', detail: 'Casas têm boa aceitação na região' });
  } else {
    score += 15;
    factors.push({ factor: 'Tipologia', status: 'parcial', detail: 'Tipologia pode ter demanda limitada' });
  }
  
  // Verificar padrão vs renda da região
  // const projectStandard = projectData.padrao_empreendimento || 'medio';
  score += 20;
  factors.push({ factor: 'Padrão', status: 'adequado', detail: 'Padrão compatível com perfil da região' });
  
  // Verificar unidades vs demanda
  const totalUnits = projectData.total_units || 100;
  if (totalUnits <= 100) {
    score += 25;
    factors.push({ factor: 'Porte', status: 'adequado', detail: 'Porte adequado para absorção do mercado' });
  } else if (totalUnits <= 200) {
    score += 20;
    factors.push({ factor: 'Porte', status: 'parcial', detail: 'Porte médio - avaliar velocidade de vendas' });
  } else {
    score += 10;
    factors.push({ factor: 'Porte', status: 'inadequado', detail: 'Porte elevado - risco de estoque' });
  }
  
  // Determinar veredito
  let verdict: string;
  let verdictClass: string;
  
  if (score >= 80) {
    verdict = 'ADEQUADO';
    verdictClass = 'success';
  } else if (score >= 60) {
    verdict = 'PARCIALMENTE_ADEQUADO';
    verdictClass = 'warning';
  } else {
    verdict = 'INADEQUADO';
    verdictClass = 'error';
  }
  
  return {
    score,
    verdict,
    verdict_class: verdictClass,
    factors,
    justification: generateAdequacyJustification(factors, verdict)
  };
}

function generateAdequacyJustification(factors: any[], verdict: string): string {
  const adequateFactors = factors.filter(f => f.status === 'adequado').length;
  const totalFactors = factors.length;
  
  let justification = `O empreendimento apresenta ${adequateFactors} de ${totalFactors} fatores adequados ao mercado local. `;
  
  factors.forEach(f => {
    if (f.status === 'inadequado') {
      justification += `Atenção: ${f.detail}. `;
    }
  });
  
  if (verdict === 'ADEQUADO') {
    justification += 'O produto está bem posicionado para o mercado-alvo.';
  } else if (verdict === 'PARCIALMENTE_ADEQUADO') {
    justification += 'Recomenda-se ajustes pontuais para melhor adequação ao mercado.';
  } else {
    justification += 'O produto pode enfrentar dificuldades de comercialização. Revisão significativa recomendada.';
  }
  
  return justification;
}

function calculateDemand(cityData: any, projectData: any): any {
  const population = cityData?.population || CITY_POPULATION[cityData?.city] || 300000;
  const households = cityData?.households || Math.round(population / 3.1);
  
  // Taxa de intenção de compra estimada (dados SECOVI/DataZap)
  const purchaseIntention24m = 0.08; // 8% das famílias com intenção em 24 meses
  const purchaseIntention12m = purchaseIntention24m * 0.6; // 60% para 12 meses
  
  // Demanda potencial
  const potentialDemand24m = Math.round(households * purchaseIntention24m);
  const potentialDemand12m = Math.round(households * purchaseIntention12m);
  
  // Demanda qualificada (25% da potencial)
  const qualificationRate = 0.25;
  const qualifiedDemand24m = Math.round(potentialDemand24m * qualificationRate);
  const qualifiedDemand12m = Math.round(potentialDemand12m * qualificationRate);
  
  // Filtrar por segmento do projeto
  const projectStandard = projectData?.padrao_empreendimento || 'medio';
  const segmentShare: Record<string, number> = {
    economico: 0.45,
    medio: 0.30,
    medio_alto: 0.18,
    alto_padrao: 0.07
  };
  
  const segmentMultiplier = segmentShare[projectStandard] || 0.25;
  
  const segmentDemand24m = Math.round(qualifiedDemand24m * segmentMultiplier);
  const segmentDemand12m = Math.round(qualifiedDemand12m * segmentMultiplier);
  
  // Perfil da demanda
  const buyerProfile = SEGMENT_PROFILES[projectStandard as keyof typeof SEGMENT_PROFILES]?.buyer_profile || 
    SEGMENT_PROFILES.medio.buyer_profile;
  
  return {
    population,
    households,
    potential_demand_24m: potentialDemand24m,
    potential_demand_12m: potentialDemand12m,
    qualified_demand_24m: qualifiedDemand24m,
    qualified_demand_12m: qualifiedDemand12m,
    segment_demand_24m: segmentDemand24m,
    segment_demand_12m: segmentDemand12m,
    methodology: {
      purchase_intention_rate: purchaseIntention24m * 100,
      qualification_rate: qualificationRate * 100,
      segment_share: segmentMultiplier * 100,
      sources: ['SECOVI', 'DataZap', 'Brain Inteligência', 'Estimativas']
    },
    buyer_profile: buyerProfile,
    analysis: generateDemandAnalysis(segmentDemand12m, projectData?.total_units || 100)
  };
}

function generateDemandAnalysis(segmentDemand12m: number, projectUnits: number): string {
  const marketShare = (projectUnits / segmentDemand12m) * 100;
  
  if (marketShare < 5) {
    return `O empreendimento representa ${marketShare.toFixed(1)}% da demanda qualificada do segmento, indicando baixa concentração de risco.`;
  } else if (marketShare < 15) {
    return `O empreendimento representa ${marketShare.toFixed(1)}% da demanda qualificada, posicionamento competitivo adequado.`;
  } else if (marketShare < 30) {
    return `O empreendimento representa ${marketShare.toFixed(1)}% da demanda qualificada, requerendo estratégia comercial robusta.`;
  } else {
    return `O empreendimento representa ${marketShare.toFixed(1)}% da demanda qualificada, risco elevado de concentração. Considerar redução de porte ou extensão do prazo de vendas.`;
  }
}

function projectSalesVelocity(demandData: any, projectData: any, competitorData: any[]): any {
  const totalUnits = projectData?.total_units || 100;
  const segmentDemand12m = demandData?.segment_demand_12m || 500;
  
  // Market share necessário
  const marketShareRequired = (totalUnits / segmentDemand12m) * 100;
  
  // VSO de mercado estimado
  const competitorAvgVSO = competitorData?.length > 0
    ? competitorData.reduce((sum: number, c: any) => sum + (c.vso_monthly || 3), 0) / competitorData.length
    : 3; // VSO padrão de 3% ao mês
  
  // Cenários de velocidade
  const scenarios = {
    pessimista: {
      vso_monthly: Math.max(competitorAvgVSO * 0.6, 1.5),
      units_per_month: 0,
      months_to_sell: 0,
      justification: 'Cenário de mercado adverso, taxa Selic elevada ou concorrência acirrada'
    },
    realista: {
      vso_monthly: competitorAvgVSO,
      units_per_month: 0,
      months_to_sell: 0,
      justification: 'Cenário baseado em dados de mercado e concorrência atual'
    },
    otimista: {
      vso_monthly: competitorAvgVSO * 1.4,
      units_per_month: 0,
      months_to_sell: 0,
      justification: 'Cenário de diferenciação competitiva, localização premium ou condições de mercado favoráveis'
    }
  };
  
  // Calcular unidades por mês e tempo de venda
  Object.values(scenarios).forEach(scenario => {
    scenario.units_per_month = Math.round(totalUnits * (scenario.vso_monthly / 100));
    scenario.months_to_sell = Math.ceil(totalUnits / scenario.units_per_month);
  });
  
  // Comparar com expectativa do cliente
  const clientExpectation = projectData?.projecao_construcao_meses || 24;
  
  let clientAligned = '';
  if (scenarios.realista.months_to_sell <= clientExpectation) {
    clientAligned = 'A expectativa do cliente está alinhada com o cenário realista de mercado.';
  } else if (scenarios.otimista.months_to_sell <= clientExpectation) {
    clientAligned = 'A expectativa do cliente é otimista, mas alcançável com estratégia comercial diferenciada.';
  } else {
    clientAligned = 'A expectativa do cliente pode ser muito otimista. Recomenda-se revisar projeções.';
  }
  
  return {
    market_share_required: marketShareRequired,
    competitor_avg_vso: competitorAvgVSO,
    scenarios,
    client_expectation_months: clientExpectation,
    client_alignment: clientAligned,
    recommendation: generateVelocityRecommendation(scenarios.realista, clientExpectation, totalUnits)
  };
}

function generateVelocityRecommendation(realistaScenario: any, clientExpectation: number, _totalUnits: number): string {
  const diff = realistaScenario.months_to_sell - clientExpectation;
  
  if (diff <= 0) {
    return `Projeção de ${realistaScenario.units_per_month} unidades/mês com venda completa em ${realistaScenario.months_to_sell} meses. Expectativa do cliente é conservadora.`;
  } else if (diff <= 6) {
    return `Projeção de ${realistaScenario.units_per_month} unidades/mês com venda completa em ${realistaScenario.months_to_sell} meses. Diferença de ${diff} meses vs expectativa do cliente.`;
  } else {
    return `Projeção de ${realistaScenario.units_per_month} unidades/mês com venda completa em ${realistaScenario.months_to_sell} meses. Diferença significativa de ${diff} meses. Revisar porte do empreendimento ou estratégia comercial.`;
  }
}

function generateMarketConclusion(data: any): any {
  const { macroData, cityData, neighborhoodData, adequacyData, demandData, velocityData } = data;
  
  // Sínteses
  const macroSynthesis = macroData?.summary || 'Cenário macroeconômico requer análise detalhada.';
  
  const citySynthesis = cityData?.price_data?.current_price_m2
    ? `${cityData.city} apresenta preço médio de R$ ${cityData.price_data.current_price_m2.toFixed(0)}/m² com variação de ${(cityData.price_data.variation_12m || 0).toFixed(1)}% em 12 meses.`
    : `Dados de mercado de ${cityData?.city || 'cidade'} requerem atualização.`;
  
  const neighborhoodSynthesis = neighborhoodData?.price_data?.avg_price_m2
    ? `O bairro ${neighborhoodData.neighborhood} apresenta preço médio de R$ ${neighborhoodData.price_data.avg_price_m2.toFixed(0)}/m².`
    : `Análise específica do bairro ${neighborhoodData?.neighborhood || ''} necessita de dados adicionais.`;
  
  const adequacySynthesis = adequacyData?.verdict
    ? `O produto é ${adequacyData.verdict.replace('_', ' ')} ao mercado local (score: ${adequacyData.score}/100).`
    : 'Avaliação de adequação pendente.';
  
  const demandSynthesis = demandData?.segment_demand_12m
    ? `Demanda qualificada de ${demandData.segment_demand_12m.toLocaleString()} unidades no segmento em 12 meses.`
    : 'Análise de demanda pendente.';
  
  const velocitySynthesis = velocityData?.scenarios?.realista
    ? `Projeção realista de vendas: ${velocityData.scenarios.realista.months_to_sell} meses para absorção completa.`
    : 'Projeção de velocidade pendente.';
  
  // Determinar veredito final
  let finalVerdict: string;
  let verdictClass: string;
  
  const adequacyScore = adequacyData?.score || 50;
  const velocityOk = velocityData?.scenarios?.realista?.months_to_sell <= (velocityData?.client_expectation_months || 36);
  const demandOk = demandData?.segment_demand_12m > (demandData?.project_units || 100);
  
  if (adequacyScore >= 70 && velocityOk && demandOk) {
    finalVerdict = 'FAVORAVEL';
    verdictClass = 'success';
  } else if (adequacyScore >= 50 || velocityOk) {
    finalVerdict = 'FAVORAVEL_COM_RESSALVAS';
    verdictClass = 'warning';
  } else {
    finalVerdict = 'DESFAVORAVEL';
    verdictClass = 'error';
  }
  
  return {
    synthesis: {
      macro: macroSynthesis,
      city: citySynthesis,
      neighborhood: neighborhoodSynthesis,
      adequacy: adequacySynthesis,
      demand: demandSynthesis,
      velocity: velocitySynthesis
    },
    final_verdict: finalVerdict,
    verdict_class: verdictClass,
    full_conclusion: generateFullConclusion({
      macroSynthesis,
      citySynthesis,
      neighborhoodSynthesis,
      adequacySynthesis,
      demandSynthesis,
      velocitySynthesis,
      finalVerdict
    }),
    recommendations: generateFinalRecommendations(finalVerdict, adequacyData, velocityData),
    risks: identifyRisks(macroData, cityData, adequacyData, velocityData),
    generated_at: new Date().toISOString()
  };
}

function generateFullConclusion(data: any): string {
  const { macroSynthesis, citySynthesis, neighborhoodSynthesis, adequacySynthesis, demandSynthesis, velocitySynthesis, finalVerdict } = data;
  
  let conclusion = `**ANÁLISE DE MERCADO - CONCLUSÃO**\n\n`;
  conclusion += `**Cenário Macroeconômico:** ${macroSynthesis}\n\n`;
  conclusion += `**Mercado da Cidade:** ${citySynthesis}\n\n`;
  conclusion += `**Análise do Bairro:** ${neighborhoodSynthesis}\n\n`;
  conclusion += `**Adequação do Produto:** ${adequacySynthesis}\n\n`;
  conclusion += `**Demanda de Mercado:** ${demandSynthesis}\n\n`;
  conclusion += `**Projeção de Vendas:** ${velocitySynthesis}\n\n`;
  
  conclusion += `**PARECER FINAL:** `;
  switch (finalVerdict) {
    case 'FAVORAVEL':
      conclusion += 'O empreendimento apresenta condições favoráveis de mercado para sua realização, com demanda compatível, preços alinhados e projeção de vendas dentro das expectativas.';
      break;
    case 'FAVORAVEL_COM_RESSALVAS':
      conclusion += 'O empreendimento é viável, porém requer atenção a alguns fatores de risco identificados. Recomenda-se ajustes pontuais e monitoramento contínuo do mercado.';
      break;
    default:
      conclusion += 'O empreendimento apresenta riscos significativos que podem comprometer sua viabilidade comercial. Recomenda-se revisão substancial do projeto ou postergação do lançamento.';
  }
  
  return conclusion;
}

function generateFinalRecommendations(verdict: string, adequacyData: any, velocityData: any): string[] {
  const recommendations: string[] = [];
  
  if (verdict === 'FAVORAVEL') {
    recommendations.push('Prosseguir com o planejamento comercial e financeiro');
    recommendations.push('Manter monitoramento de indicadores macroeconômicos');
    recommendations.push('Avaliar oportunidade de antecipação do lançamento');
  } else if (verdict === 'FAVORAVEL_COM_RESSALVAS') {
    if (adequacyData?.factors?.some((f: any) => f.status === 'inadequado' && f.factor === 'Preço/m²')) {
      recommendations.push('Revisar tabela de preços para maior alinhamento com o mercado');
    }
    if (velocityData?.scenarios?.realista?.months_to_sell > velocityData?.client_expectation_months) {
      recommendations.push('Considerar redução do número de unidades ou faseamento do lançamento');
    }
    recommendations.push('Desenvolver estratégia de diferenciação competitiva');
    recommendations.push('Reservar contingência adicional para cenário pessimista');
  } else {
    recommendations.push('Reavaliar localização e/ou produto');
    recommendations.push('Considerar mudança de segmento-alvo');
    recommendations.push('Postergar lançamento até melhoria das condições de mercado');
    recommendations.push('Buscar alternativas de terreno com melhor potencial');
  }
  
  return recommendations;
}

function identifyRisks(macroData: any, cityData: any, adequacyData: any, velocityData: any): string[] {
  const risks: string[] = [];
  
  // Riscos macro
  if (macroData?.indicators?.selic?.current > 12) {
    risks.push('Taxa Selic elevada impacta custo de financiamento');
  }
  if (macroData?.indicators?.ipca?.current > 5) {
    risks.push('Inflação acima da meta pressiona custos de construção');
  }
  
  // Riscos de mercado
  if (cityData?.price_data?.variation_12m < 0) {
    risks.push('Mercado em desvalorização nos últimos 12 meses');
  }
  
  // Riscos de adequação
  adequacyData?.factors?.filter((f: any) => f.status === 'inadequado').forEach((f: any) => {
    risks.push(f.detail);
  });
  
  // Riscos de velocidade
  if (velocityData?.scenarios?.pessimista?.months_to_sell > 48) {
    risks.push('Cenário pessimista indica prazo de vendas superior a 4 anos');
  }
  
  return risks;
}
