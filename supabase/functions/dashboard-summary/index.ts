import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";


// BCB API endpoints
// Observação: a URL do SGS exige o ponto antes do código da série: bcdata.sgs.{codigo}
const BCB_API_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.';
const IBGE_SIDRA_API = 'https://apisidra.ibge.gov.br/values';

interface MetricValue {
  raw: string;
  num: number;
}

interface MetricDelta {
  raw: string | null;
  num: number | null;
  type: 'pct' | 'pp' | 'abs' | null;
}

interface MetricCard {
  metric_id: string;
  label: string;
  description: string;
  source: string;
  value: MetricValue;
  unit: string;
  delta: MetricDelta;
  period: { kind: string; ref: string | null };
  geo: { city: string };
  updated_at: string;
  provenance_url: string | null;
}

// =====================================================
// SINGLE SOURCE OF TRUTH - Parâmetros por cidade
// Os dados vêm SEMPRE da tabela idi_fipezap_historico
// O FALLBACK_CITY_DATA só é usado quando o banco não retorna dados
// =====================================================

interface CityParams {
  priceM2Base: number;
  priceM2Delta: number;
  demandIndex: number;
  stockUnits: number;
  absorptionMonths: number;
  vgvMultiplier: number;
  marketHeat: 'hot' | 'balanced' | 'saturated';
}

// Fallback apenas quando idi_fipezap_historico não tem dados
// Valores alinhados com FALLBACK_CITY_DATA em data-service.ts
const FALLBACK_CITY_DATA: Record<string, CityParams> = {
  'Brasil (Nacional)': { priceM2Base: 8500, priceM2Delta: 5.5, demandIndex: 65, stockUnits: 150000, absorptionMonths: 14, vgvMultiplier: 1.0, marketHeat: 'balanced' },
  'São Paulo': { priceM2Base: 12500, priceM2Delta: 5.2, demandIndex: 78, stockUnits: 45000, absorptionMonths: 10, vgvMultiplier: 2.5, marketHeat: 'hot' },
  'Rio de Janeiro': { priceM2Base: 10800, priceM2Delta: 4.8, demandIndex: 68, stockUnits: 32000, absorptionMonths: 13, vgvMultiplier: 1.8, marketHeat: 'balanced' },
  'Belo Horizonte': { priceM2Base: 8200, priceM2Delta: 4.0, demandIndex: 66, stockUnits: 18000, absorptionMonths: 14, vgvMultiplier: 1.2, marketHeat: 'balanced' },
  'Curitiba': { priceM2Base: 9800, priceM2Delta: 5.5, demandIndex: 75, stockUnits: 15000, absorptionMonths: 9, vgvMultiplier: 1.4, marketHeat: 'hot' },
  'Porto Alegre': { priceM2Base: 8500, priceM2Delta: 3.2, demandIndex: 58, stockUnits: 14000, absorptionMonths: 16, vgvMultiplier: 1.0, marketHeat: 'saturated' },
  'Florianópolis': { priceM2Base: 12800, priceM2Delta: 6.2, demandIndex: 82, stockUnits: 8500, absorptionMonths: 7, vgvMultiplier: 1.1, marketHeat: 'hot' },
  'Brasília': { priceM2Base: 11200, priceM2Delta: 4.2, demandIndex: 70, stockUnits: 22000, absorptionMonths: 12, vgvMultiplier: 1.6, marketHeat: 'balanced' },
  // Centro-Oeste - Valor unificado: R$ 6.500/m² para Goiânia
  'Goiânia': { priceM2Base: 6500, priceM2Delta: 5.8, demandIndex: 76, stockUnits: 12000, absorptionMonths: 8, vgvMultiplier: 0.9, marketHeat: 'hot' },
  'Campo Grande': { priceM2Base: 5200, priceM2Delta: 3.5, demandIndex: 60, stockUnits: 4500, absorptionMonths: 14, vgvMultiplier: 0.3, marketHeat: 'balanced' },
  'Cuiabá': { priceM2Base: 5800, priceM2Delta: 4.0, demandIndex: 62, stockUnits: 4800, absorptionMonths: 13, vgvMultiplier: 0.35, marketHeat: 'balanced' },
  // Nordeste
  'Salvador': { priceM2Base: 7500, priceM2Delta: 3.8, demandIndex: 62, stockUnits: 16000, absorptionMonths: 15, vgvMultiplier: 1.0, marketHeat: 'saturated' },
  'Recife': { priceM2Base: 7800, priceM2Delta: 4.0, demandIndex: 64, stockUnits: 14000, absorptionMonths: 14, vgvMultiplier: 0.9, marketHeat: 'balanced' },
  'Fortaleza': { priceM2Base: 7200, priceM2Delta: 4.2, demandIndex: 66, stockUnits: 12000, absorptionMonths: 13, vgvMultiplier: 0.85, marketHeat: 'balanced' },
  // Norte
  'Manaus': { priceM2Base: 5800, priceM2Delta: 3.5, demandIndex: 60, stockUnits: 6500, absorptionMonths: 15, vgvMultiplier: 0.45, marketHeat: 'saturated' },
  'Belém': { priceM2Base: 5500, priceM2Delta: 3.2, demandIndex: 58, stockUnits: 5800, absorptionMonths: 16, vgvMultiplier: 0.38, marketHeat: 'saturated' },
  // Nordeste adicional
  'Natal': { priceM2Base: 6800, priceM2Delta: 3.8, demandIndex: 60, stockUnits: 10000, absorptionMonths: 14, vgvMultiplier: 0.7, marketHeat: 'balanced' },
  'Maceió': { priceM2Base: 6200, priceM2Delta: 3.5, demandIndex: 58, stockUnits: 8000, absorptionMonths: 15, vgvMultiplier: 0.6, marketHeat: 'saturated' },
  'João Pessoa': { priceM2Base: 6500, priceM2Delta: 4.0, demandIndex: 62, stockUnits: 9000, absorptionMonths: 14, vgvMultiplier: 0.65, marketHeat: 'balanced' },
  'Aracaju': { priceM2Base: 6000, priceM2Delta: 3.5, demandIndex: 58, stockUnits: 7500, absorptionMonths: 15, vgvMultiplier: 0.55, marketHeat: 'saturated' },
  'Teresina': { priceM2Base: 5500, priceM2Delta: 3.2, demandIndex: 56, stockUnits: 7000, absorptionMonths: 16, vgvMultiplier: 0.5, marketHeat: 'saturated' },
  'São Luís': { priceM2Base: 5800, priceM2Delta: 3.3, demandIndex: 56, stockUnits: 8000, absorptionMonths: 16, vgvMultiplier: 0.52, marketHeat: 'saturated' },
  // Sul adicional
  'Joinville': { priceM2Base: 8200, priceM2Delta: 5.0, demandIndex: 72, stockUnits: 9500, absorptionMonths: 10, vgvMultiplier: 0.9, marketHeat: 'hot' },
  'Londrina': { priceM2Base: 7200, priceM2Delta: 4.2, demandIndex: 65, stockUnits: 9000, absorptionMonths: 12, vgvMultiplier: 0.8, marketHeat: 'balanced' },
  'Maringá': { priceM2Base: 7500, priceM2Delta: 4.5, demandIndex: 68, stockUnits: 8500, absorptionMonths: 11, vgvMultiplier: 0.82, marketHeat: 'balanced' },
  'Caxias do Sul': { priceM2Base: 7000, priceM2Delta: 3.8, demandIndex: 62, stockUnits: 7000, absorptionMonths: 13, vgvMultiplier: 0.7, marketHeat: 'balanced' },
  // SP interior
  'Campinas': { priceM2Base: 8900, priceM2Delta: 4.8, demandIndex: 72, stockUnits: 14000, absorptionMonths: 11, vgvMultiplier: 1.1, marketHeat: 'balanced' },
  'Ribeirão Preto': { priceM2Base: 8200, priceM2Delta: 4.5, demandIndex: 68, stockUnits: 10000, absorptionMonths: 12, vgvMultiplier: 0.9, marketHeat: 'balanced' },
  'São José dos Campos': { priceM2Base: 9500, priceM2Delta: 5.0, demandIndex: 74, stockUnits: 11000, absorptionMonths: 10, vgvMultiplier: 1.0, marketHeat: 'hot' },
  'Santos': { priceM2Base: 10200, priceM2Delta: 5.5, demandIndex: 76, stockUnits: 9000, absorptionMonths: 9, vgvMultiplier: 0.95, marketHeat: 'hot' },
  // MG e ES
  'Uberlândia': { priceM2Base: 7200, priceM2Delta: 4.0, demandIndex: 64, stockUnits: 10000, absorptionMonths: 13, vgvMultiplier: 0.75, marketHeat: 'balanced' },
  'Vitória': { priceM2Base: 9200, priceM2Delta: 3.8, demandIndex: 62, stockUnits: 8000, absorptionMonths: 14, vgvMultiplier: 0.8, marketHeat: 'balanced' },
  'Niterói': { priceM2Base: 9500, priceM2Delta: 4.5, demandIndex: 66, stockUnits: 7000, absorptionMonths: 12, vgvMultiplier: 0.78, marketHeat: 'balanced' },
};

// Runtime cache para dados reais
const cityParamsCache: Map<string, CityParams> = new Map();

// Cache for real-time market data from database
const marketDataCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fetch real market data from idi_fipezap_historico table
async function fetchRealMarketData(supabase: any, city: string): Promise<{ priceM2: number; variation12m: number; variationMonth: number } | null> {
  const cacheKey = `market_${city}`;
  const cached = marketDataCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Try exact city match first
    const { data, error } = await supabase
      .from('idi_fipezap_historico')
      .select('cidade, preco_m2_venda, variacao_venda_mes, variacao_venda_12m, mes')
      .eq('cidade', city)
      .order('mes', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data && data.preco_m2_venda) {
      const result = {
        priceM2: parseFloat(data.preco_m2_venda),
        variation12m: parseFloat(data.variacao_venda_12m || 0),
        variationMonth: parseFloat(data.variacao_venda_mes || 0),
      };
      marketDataCache.set(cacheKey, { data: result, timestamp: Date.now() });
      console.log(`Real market data for ${city}: R$ ${result.priceM2}/m² (${result.variation12m}% 12m)`);
      return result;
    }
  } catch (e) {
    console.log(`Could not fetch real data for ${city}:`, e);
  }

  return null;
}

/**
 * Get city params with real data priority (Single Source of Truth)
 * 1. Busca dados reais da tabela idi_fipezap_historico
 * 2. Se não encontrar, usa FALLBACK_CITY_DATA
 * 3. Armazena em cache para consistência durante a requisição
 */
async function getCityParamsWithRealData(supabase: any, city: string): Promise<CityParams> {
  const fallback = FALLBACK_CITY_DATA[city] || FALLBACK_CITY_DATA['Brasil (Nacional)'];
  
  // Nacional: média ponderada de todas as cidades
  if (city === 'Brasil (Nacional)') {
    try {
      const { data } = await supabase
        .from('idi_fipezap_historico')
        .select('cidade, preco_m2_venda, variacao_venda_12m, mes')
        .not('preco_m2_venda', 'is', null)
        .order('mes', { ascending: false });

      if (data && data.length > 0) {
        // Deduplica por cidade (pega o mais recente)
        const cityMap = new Map<string, { price: number; variation: number }>();
        for (const row of data) {
          if (!cityMap.has(row.cidade)) {
            cityMap.set(row.cidade, {
              price: parseFloat(row.preco_m2_venda),
              variation: parseFloat(row.variacao_venda_12m || 0),
            });
          }
        }
        
        const cities = Array.from(cityMap.values());
        const avgPrice = cities.reduce((sum, c) => sum + c.price, 0) / cities.length;
        const avgVariation = cities.reduce((sum, c) => sum + c.variation, 0) / cities.length;
        
        const result: CityParams = {
          ...fallback,
          priceM2Base: Math.round(avgPrice),
          priceM2Delta: parseFloat(avgVariation.toFixed(1)),
        };
        
        cityParamsCache.set(city, result);
        console.log(`[SSOT] Nacional: R$ ${result.priceM2Base}/m² (média de ${cities.length} cidades)`);
        return result;
      }
    } catch (e) {
      console.log('[SSOT] Error fetching national average:', e);
    }
    
    cityParamsCache.set(city, fallback);
    return fallback;
  }

  // Cidade específica
  const realData = await fetchRealMarketData(supabase, city);
  
  if (realData) {
    // Calcula absorptionMonths baseado na variação
    const absorptionMonths = realData.variation12m >= 7 ? 7 :
                             realData.variation12m >= 5 ? 9 :
                             realData.variation12m >= 3 ? 12 : 15;
    
    const result: CityParams = {
      ...fallback,
      priceM2Base: Math.round(realData.priceM2),
      priceM2Delta: realData.variation12m,
      absorptionMonths,
      marketHeat: getMarketHeatStatus(absorptionMonths),
    };
    
    cityParamsCache.set(city, result);
    console.log(`[SSOT] ${city}: R$ ${result.priceM2Base}/m² (fonte: idi_fipezap_historico)`);
    return result;
  }

  // Fallback
  console.log(`[SSOT] ${city}: R$ ${fallback.priceM2Base}/m² (fonte: FALLBACK_CITY_DATA)`);
  cityParamsCache.set(city, fallback);
  return fallback;
}

// Get city params from cache or fallback
function getCityParams(city: string): CityParams {
  // Primeiro tenta do cache (preenchido por getCityParamsWithRealData)
  if (cityParamsCache.has(city)) {
    return cityParamsCache.get(city)!;
  }
  // Fallback para dados estáticos
  return FALLBACK_CITY_DATA[city] || FALLBACK_CITY_DATA['Brasil (Nacional)'];
}

// Calcula status do mercado baseado em meses de absorção
function getMarketHeatStatus(absorptionMonths: number): 'hot' | 'balanced' | 'saturated' {
  if (absorptionMonths < 8) return 'hot';
  if (absorptionMonths >= 12) return 'saturated';
  return 'balanced';
}

// Fetch BCB series
async function fetchBCBSeries(seriesCode: number, lastN: number = 2): Promise<any[]> {
  try {
    const url = `${BCB_API_BASE}/${seriesCode}/dados/ultimos/${lastN}?formato=json`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching BCB series ${seriesCode}:`, error);
    return [];
  }
}

// Fetch SELIC Meta (series 432)
async function fetchSelicMeta(): Promise<{ value: number; date: string; change: number } | null> {
  try {
    const data = await fetchBCBSeries(432, 5);
    if (data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const previous = data.length > 1 ? parseFloat(data[data.length - 2]?.valor?.replace(',', '.') || current.toString()) : current;
      const change = current - previous;
      console.log(`[BCB] Selic Meta: ${current}% a.a., anterior: ${previous}%, variação: ${change} p.p.`);
      return { value: current, date: data[data.length - 1]?.data || '', change };
    }
    return null;
  } catch (error) {
    console.error('[BCB] Erro ao buscar Selic:', error);
    return null;
  }
}

// Fetch taxa de financiamento imobiliário (série 25497 - Taxa média de juros - Financiamento imobiliário com taxas reguladas)
async function fetchFinancingRate(): Promise<{ value: number; date: string } | null> {
  try {
    const data = await fetchBCBSeries(25497, 2);
    if (data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      console.log(`[BCB] Taxa financiamento imobiliário: ${current}% a.a.`);
      return { value: current, date: data[data.length - 1]?.data || '' };
    }
    return null;
  } catch (error) {
    console.error('[BCB] Erro ao buscar taxa de financiamento:', error);
    return null;
  }
}

// Fetch Dollar PTAX via Olinda API (mais confiável para cotações recentes)
async function fetchDollarPTAX(): Promise<{ value: number; date: string } | null> {
  try {
    // Tenta buscar cotação dos últimos dias úteis
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
      
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${formattedDate}'&$format=json`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data?.value && data.value.length > 0) {
          // Pega a última cotação do dia (fechamento)
          const lastQuote = data.value[data.value.length - 1];
          const value = parseFloat(lastQuote.cotacaoVenda || '0');
          if (value > 0) {
            console.log(`[BCB PTAX] Dólar comercial (venda): R$ ${value.toFixed(4)} em ${formattedDate}`);
            return { value, date: formattedDate };
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.error('[BCB PTAX] Erro ao buscar cotação:', error);
    return null;
  }
}

// Fetch Dollar via SGS API (fallback)
async function fetchDollarSGS(): Promise<{ value: number; date: string; change: number } | null> {
  try {
    const data = await fetchBCBSeries(1, 10);
    if (data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const previousIndex = Math.max(0, data.length - 6);
      const previous = parseFloat(data[previousIndex]?.valor?.replace(',', '.') || current.toString());
      const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
      console.log(`[BCB SGS] Dólar série 1: R$ ${current.toFixed(4)}, variação: ${change.toFixed(2)}%`);
      return { value: current, date: data[data.length - 1]?.data || '', change };
    }
    return null;
  } catch (error) {
    console.error('[BCB SGS] Erro ao buscar dólar:', error);
    return null;
  }
}

// Combina ambas as fontes para obter o dólar comercial
async function fetchDollar(): Promise<{ value: number; date: string; change: number } | null> {
  // Tenta primeiro a API PTAX (mais atualizada)
  const ptax = await fetchDollarPTAX();
  // Tenta também a API SGS para pegar o histórico
  const sgs = await fetchDollarSGS();
  
  if (ptax && ptax.value > 0) {
    // Calcula variação usando dados históricos do SGS se disponível
    const change = sgs?.change || 0;
    return { value: ptax.value, date: ptax.date, change };
  }
  
  if (sgs && sgs.value > 0) {
    return sgs;
  }
  
  return null;
}

// Fetch INCC-DI (BCB série 192)
async function fetchINCC(): Promise<{ value: number; accumulated12m: number; date: string } | null> {
  try {
    const data = await fetchBCBSeries(192, 13);
    if (data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const accumulated = data.slice(-12).reduce((sum: number, d: any) => {
        const v = parseFloat(d?.valor?.replace(',', '.') || '0');
        return sum + v;
      }, 0);
      return { value: current, accumulated12m: parseFloat(accumulated.toFixed(2)), date: data[data.length - 1]?.data || '' };
    }
    return null;
  } catch { return null; }
}

// Fetch IGP-M (BCB série 189)
async function fetchIGPM(): Promise<{ value: number; accumulated12m: number; date: string } | null> {
  try {
    const data = await fetchBCBSeries(189, 13);
    if (data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const accumulated = data.slice(-12).reduce((sum: number, d: any) => {
        const v = parseFloat(d?.valor?.replace(',', '.') || '0');
        return sum + v;
      }, 0);
      return { value: current, accumulated12m: parseFloat(accumulated.toFixed(2)), date: data[data.length - 1]?.data || '' };
    }
    return null;
  } catch { return null; }
}

// Fetch IPCA 12 months
async function fetchIPCA12m(): Promise<{ value: number; date: string; change: number } | null> {
  try {
    const response = await fetch(
      `${IBGE_SIDRA_API}/t/1737/n1/all/v/2265/p/last%202/d/v2265%202`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 2) {
      const current = parseFloat(data[data.length - 1]?.V || '0');
      const previous = parseFloat(data[data.length - 2]?.V || '0');
      return { value: current, date: data[data.length - 1]?.D2N || '', change: current - previous };
    }
    return null;
  } catch {
    return null;
  }
}

// Get current period references
function getPeriodRefs(): { weekly: string; monthly: string; quarterly: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  const weekNumber = getWeekNumber(now);
  
  return {
    weekly: `${year}-W${String(weekNumber).padStart(2, '0')}`,
    monthly: `${year}-${month}`,
    quarterly: `${year}-Q${quarter}`,
  };
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatBRL(value: number): string {
  if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(1)} bilhões`;
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(1)} milhões`;
  return formatCurrency(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

// Build macro indicators (same for all cities - national data)
async function buildMacroIndicators(city: string): Promise<MetricCard[]> {
  const now = new Date().toISOString();
  const metrics: MetricCard[] = [];
  
  // Fetch real data from BCB and IBGE
  const [selic, ipca12m, dollar, financingRate, incc, igpm] = await Promise.all([
    fetchSelicMeta(),
    fetchIPCA12m(),
    fetchDollar(),
    fetchFinancingRate(),
    fetchINCC(),
    fetchIGPM(),
  ]);
  
  console.log('[Macro] Dados obtidos:', { 
    selic: selic?.value, 
    ipca: ipca12m?.value, 
    dollar: dollar?.value,
    financing: financingRate?.value 
  });
  
  // 1) Taxa Selic
  const selicValue = selic?.value || 14.25;
  const selicChange = selic?.change || 0;
  metrics.push({
    metric_id: 'macro_selic_rate',
    label: 'Taxa Selic',
    description: 'Taxa básica de juros definida pelo COPOM',
    source: 'Banco Central (Bacen)',
    value: { raw: `${selicValue.toFixed(2)}% ao ano`, num: selicValue },
    unit: '%',
    delta: { 
      raw: selicChange !== 0 ? `${selicChange >= 0 ? '+' : ''}${selicChange.toFixed(2)} p.p.` : null, 
      num: selicChange !== 0 ? selicChange : null, 
      type: selicChange !== 0 ? 'pp' : null 
    },
    period: { kind: 'macro', ref: null },
    geo: { city },
    updated_at: now,
    provenance_url: 'https://www.bcb.gov.br/controleinflacao/taxaselic',
  });
  
  // 2) IPCA 12 meses
  const ipcaValue = ipca12m?.value || 4.5;
  const ipcaChange = ipca12m?.change || 0;
  metrics.push({
    metric_id: 'macro_ipca_12m_pct',
    label: 'IPCA (12 meses)',
    description: 'Inflação acumulada nos últimos 12 meses',
    source: 'IBGE',
    value: { raw: `${ipcaValue.toFixed(2)}% inflação acumulada`, num: ipcaValue },
    unit: '%',
    delta: { 
      raw: ipcaChange !== 0 ? `${ipcaChange >= 0 ? '+' : ''}${ipcaChange.toFixed(2)} p.p.` : null, 
      num: ipcaChange !== 0 ? ipcaChange : null, 
      type: ipcaChange !== 0 ? 'pp' : null 
    },
    period: { kind: 'macro', ref: null },
    geo: { city },
    updated_at: now,
    provenance_url: 'https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9256-indice-nacional-de-precos-ao-consumidor-amplo.html',
  });
  
  // 3) Dólar Comercial (PTAX venda)
  const dollarValue = dollar?.value || 5.40; // Fallback atualizado
  const dollarChange = dollar?.change || 0;
  const dollarDate = dollar?.date || '';
  console.log(`[Macro] Dólar final: R$ ${dollarValue}, data: ${dollarDate}, variação: ${dollarChange}%`);
  metrics.push({
    metric_id: 'macro_usd_brl',
    label: 'Dólar (cotação comercial)',
    description: 'Taxa de câmbio oficial PTAX (venda)',
    source: 'Banco Central (Bacen)',
    value: { raw: formatCurrency(dollarValue), num: dollarValue },
    unit: 'R$',
    delta: { 
      raw: dollarChange !== 0 ? `${dollarChange >= 0 ? '+' : ''}${dollarChange.toFixed(2)}%` : null, 
      num: dollarChange !== 0 ? dollarChange : null, 
      type: dollarChange !== 0 ? 'pct' : null 
    },
    period: { kind: 'macro', ref: null },
    geo: { city },
    updated_at: now,
    provenance_url: 'https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes',
  });
  
  // 4) Financiamento Médio (dados reais do BCB ou fallback atualizado)
  const financingValue = financingRate?.value || 11.49;
  metrics.push({
    metric_id: 'macro_financing_avg_rate',
    label: 'Financiamento Médio',
    description: 'Taxa média de financiamento imobiliário nos bancos',
    source: 'Bancos / Bacen',
    value: { raw: `${financingValue.toFixed(2)}% a.a + TR`, num: financingValue },
    unit: '%',
    delta: { raw: null, num: null, type: null },
    period: { kind: 'macro', ref: null },
    geo: { city },
    updated_at: now,
    provenance_url: 'https://www.bcb.gov.br/estatisticas/txjuros',
  });
  
  // 5) Financiamento Caixa SBPE (estimativa baseada na Selic + spread)
  const caixaRate = Math.max(selicValue - 3.0, 9.99);
  metrics.push({
    metric_id: 'macro_financing_caixa_rate',
    label: 'Financiamento Caixa',
    description: 'Taxa de financiamento imobiliário Caixa (SBPE)',
    source: 'Caixa (SBPE)',
    value: { raw: `${caixaRate.toFixed(2)}% a.a + TR`, num: caixaRate },
    unit: '%',
    delta: { raw: null, num: null, type: null },
    period: { kind: 'macro', ref: null },
    geo: { city },
    updated_at: now,
    provenance_url: 'https://www.caixa.gov.br/voce/habitacao/',
  });

  // 6) INCC-DI (custo de construção)
  const inccValue = incc?.value ?? 0.27;
  const incc12m = incc?.accumulated12m ?? 4.51;
  metrics.push({
    metric_id: 'macro_incc_di',
    label: 'INCC-DI (mensal)',
    description: `Índice Nacional de Custo da Construção — acumulado 12m: ${incc12m.toFixed(2)}%`,
    source: 'FGV / BCB',
    value: { raw: `${inccValue.toFixed(2)}% (mês)`, num: inccValue },
    unit: '%',
    delta: { raw: `${incc12m.toFixed(2)}% (12m)`, num: incc12m, type: 'pct' },
    period: { kind: 'macro', ref: null },
    geo: { city },
    updated_at: now,
    provenance_url: 'https://portalibre.fgv.br/estudos-e-pesquisas/indices-de-precos/incc',
  });

  // 7) IGP-M
  const igpmValue = igpm?.value ?? 0.31;
  const igpm12m = igpm?.accumulated12m ?? 3.73;
  metrics.push({
    metric_id: 'macro_igpm',
    label: 'IGP-M (mensal)',
    description: `Índice Geral de Preços do Mercado (FGV) — acumulado 12m: ${igpm12m.toFixed(2)}%`,
    source: 'FGV / BCB',
    value: { raw: `${igpmValue.toFixed(2)}% (mês)`, num: igpmValue },
    unit: '%',
    delta: { raw: `${igpm12m.toFixed(2)}% (12m)`, num: igpm12m, type: 'pct' },
    period: { kind: 'macro', ref: null },
    geo: { city },
    updated_at: now,
    provenance_url: 'https://portalibre.fgv.br/estudos-e-pesquisas/indices-de-precos/igp',
  });

  return metrics;
}

// Build weekly indices based on city params
function buildWeeklyIndices(city: string, ref: string): MetricCard[] {
  const now = new Date().toISOString();
  const params = getCityParams(city);
  
  const weeklyPriceChange = (params.priceM2Delta / 52).toFixed(2);
  const salesVelocity = Math.round(params.stockUnits / params.absorptionMonths / 4);
  const newLaunches = Math.round(params.vgvMultiplier * 6);
  const weeklyStock = Math.round(params.stockUnits / 4);
  
  return [
    {
      metric_id: 'weekly_price_change_pct',
      label: 'Variação Semanal de Preços',
      description: 'Variação do preço médio do m² na última semana',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `+${weeklyPriceChange}%`, num: parseFloat(weeklyPriceChange) },
      unit: '%',
      delta: { raw: `+${weeklyPriceChange}%`, num: parseFloat(weeklyPriceChange), type: 'pct' },
      period: { kind: 'weekly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'weekly_sales_velocity_units_per_month',
      label: 'Velocidade de Vendas',
      description: 'Unidades vendidas por mês (média semanal)',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${salesVelocity} un/mês`, num: salesVelocity },
      unit: 'un/mês',
      delta: { raw: params.marketHeat === 'hot' ? '+8%' : params.marketHeat === 'saturated' ? '-3%' : '+2%', num: params.marketHeat === 'hot' ? 8 : params.marketHeat === 'saturated' ? -3 : 2, type: 'pct' },
      period: { kind: 'weekly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'weekly_new_launches_count',
      label: 'Novos Lançamentos',
      description: 'Novos empreendimentos lançados na última semana',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${newLaunches} empreendimentos`, num: newLaunches },
      unit: 'empreendimentos',
      delta: { raw: params.marketHeat === 'hot' ? '+3' : params.marketHeat === 'saturated' ? '-1' : '+1', num: params.marketHeat === 'hot' ? 3 : params.marketHeat === 'saturated' ? -1 : 1, type: 'abs' },
      period: { kind: 'weekly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'weekly_available_stock_units',
      label: 'Estoque Disponível',
      description: 'Total de unidades disponíveis para venda',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${formatNumber(weeklyStock)} unidades`, num: weeklyStock },
      unit: 'unidades',
      delta: { raw: params.marketHeat === 'hot' ? '-4.5%' : params.marketHeat === 'saturated' ? '+1.2%' : '-1.8%', num: params.marketHeat === 'hot' ? -4.5 : params.marketHeat === 'saturated' ? 1.2 : -1.8, type: 'pct' },
      period: { kind: 'weekly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
  ];
}

// Build monthly indices based on city params
function buildMonthlyIndices(city: string, ref: string): MetricCard[] {
  const now = new Date().toISOString();
  const params = getCityParams(city);
  
  const priceM2 = params.priceM2Base;
  const monthlyPriceChange = (params.priceM2Delta / 12).toFixed(2);
  const unitsLaunched = Math.round(params.stockUnits * 0.08);
  const unitsSold = Math.round(params.stockUnits / params.absorptionMonths);
  const absorptionRate = Math.round((unitsSold / (params.stockUnits / 12)) * 100);
  const avgSalePrice = Math.round(priceM2 * 55); // Average 55m² unit
  const vgvLaunched = unitsLaunched * avgSalePrice;
  
  return [
    {
      metric_id: 'monthly_price_m2_brl',
      label: 'Preço Médio do m²',
      description: 'Preço médio de venda por metro quadrado',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `R$ ${formatNumber(priceM2)}/m²`, num: priceM2 },
      unit: 'R$/m²',
      delta: { raw: `+${monthlyPriceChange}%`, num: parseFloat(monthlyPriceChange), type: 'pct' },
      period: { kind: 'monthly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'monthly_demand_index_points',
      label: 'Índice de Demanda IDI',
      description: 'Índice de Demanda Imobiliária (0-100)',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${params.demandIndex} pontos`, num: params.demandIndex },
      unit: 'pontos',
      delta: { raw: params.marketHeat === 'hot' ? '+4.2 pts' : params.marketHeat === 'saturated' ? '-1.5 pts' : '+1.8 pts', num: params.marketHeat === 'hot' ? 4.2 : params.marketHeat === 'saturated' ? -1.5 : 1.8, type: 'abs' },
      period: { kind: 'monthly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'monthly_absorption_time_months',
      label: 'Tempo de Absorção',
      description: 'Tempo médio para absorver o estoque disponível',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${params.absorptionMonths} meses`, num: params.absorptionMonths },
      unit: 'meses',
      delta: { raw: params.marketHeat === 'hot' ? '-2 meses' : params.marketHeat === 'saturated' ? '+1 mês' : '-0.5 mês', num: params.marketHeat === 'hot' ? -2 : params.marketHeat === 'saturated' ? 1 : -0.5, type: 'abs' },
      period: { kind: 'monthly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'monthly_vgv_launched_brl',
      label: 'VGV Lançado',
      description: 'Valor Geral de Vendas dos lançamentos do mês',
      source: 'IDI Brasil / Estimativa',
      value: { raw: formatBRL(vgvLaunched), num: vgvLaunched },
      unit: 'R$',
      delta: { raw: params.marketHeat === 'hot' ? '+25%' : params.marketHeat === 'saturated' ? '-8%' : '+12%', num: params.marketHeat === 'hot' ? 25 : params.marketHeat === 'saturated' ? -8 : 12, type: 'pct' },
      period: { kind: 'monthly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'monthly_units_launched',
      label: 'Unidades Lançadas',
      description: 'Total de unidades lançadas no mês',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${formatNumber(unitsLaunched)} unidades`, num: unitsLaunched },
      unit: 'unidades',
      delta: { raw: params.marketHeat === 'hot' ? '+28%' : params.marketHeat === 'saturated' ? '-5%' : '+15%', num: params.marketHeat === 'hot' ? 28 : params.marketHeat === 'saturated' ? -5 : 15, type: 'pct' },
      period: { kind: 'monthly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'monthly_units_sold',
      label: 'Unidades Vendidas',
      description: 'Total de unidades vendidas no mês',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${formatNumber(unitsSold)} unidades`, num: unitsSold },
      unit: 'unidades',
      delta: { raw: params.marketHeat === 'hot' ? '+18%' : params.marketHeat === 'saturated' ? '-3%' : '+8%', num: params.marketHeat === 'hot' ? 18 : params.marketHeat === 'saturated' ? -3 : 8, type: 'pct' },
      period: { kind: 'monthly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'monthly_absorption_rate_pct',
      label: 'Taxa de Absorção',
      description: 'Percentual do estoque absorvido pelo mercado',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${absorptionRate}%`, num: absorptionRate },
      unit: '%',
      delta: { raw: params.marketHeat === 'hot' ? '+8 pp' : params.marketHeat === 'saturated' ? '-2 pp' : '+3 pp', num: params.marketHeat === 'hot' ? 8 : params.marketHeat === 'saturated' ? -2 : 3, type: 'pp' },
      period: { kind: 'monthly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'monthly_avg_sale_price_brl',
      label: 'Preço Médio de Venda',
      description: 'Preço médio das unidades vendidas',
      source: 'IDI Brasil / Estimativa',
      value: { raw: formatCurrency(avgSalePrice), num: avgSalePrice },
      unit: 'R$',
      delta: { raw: `+${(parseFloat(monthlyPriceChange) + 1.2).toFixed(1)}%`, num: parseFloat(monthlyPriceChange) + 1.2, type: 'pct' },
      period: { kind: 'monthly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
  ];
}

// Build quarterly indices based on city params
function buildQuarterlyIndices(city: string, ref: string): MetricCard[] {
  const now = new Date().toISOString();
  const params = getCityParams(city);
  
  const quarterlyPriceChange = (params.priceM2Delta / 4).toFixed(1);
  const unitsLaunchedQ = Math.round(params.stockUnits * 0.25);
  const unitsSoldQ = Math.round(params.stockUnits / params.absorptionMonths * 3);
  const avgSalePrice = Math.round(params.priceM2Base * 55);
  const vgvQ = unitsLaunchedQ * avgSalePrice;
  const confidenceIndex = params.marketHeat === 'hot' ? 75 : params.marketHeat === 'saturated' ? 52 : 65;
  const rentalYield = params.marketHeat === 'hot' ? 7.2 : params.marketHeat === 'saturated' ? 9.5 : 8.2;
  const attractiveness = params.marketHeat === 'hot' ? 8.5 : params.marketHeat === 'saturated' ? 5.8 : 7.2;
  
  return [
    {
      metric_id: 'quarterly_price_change_pct',
      label: 'Variação Acumulada de Preços',
      description: 'Variação do preço do m² no trimestre',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `+${quarterlyPriceChange}%`, num: parseFloat(quarterlyPriceChange) },
      unit: '%',
      delta: { raw: `+${quarterlyPriceChange}%`, num: parseFloat(quarterlyPriceChange), type: 'pct' },
      period: { kind: 'quarterly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'quarterly_vgv_brl',
      label: 'VGV Trimestral',
      description: 'Valor Geral de Vendas do trimestre',
      source: 'IDI Brasil / Estimativa',
      value: { raw: formatBRL(vgvQ), num: vgvQ },
      unit: 'R$',
      delta: { raw: params.marketHeat === 'hot' ? '+32%' : params.marketHeat === 'saturated' ? '-5%' : '+18%', num: params.marketHeat === 'hot' ? 32 : params.marketHeat === 'saturated' ? -5 : 18, type: 'pct' },
      period: { kind: 'quarterly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'quarterly_units_launched',
      label: 'Unidades Lançadas (Trimestre)',
      description: 'Total de unidades lançadas no trimestre',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${formatNumber(unitsLaunchedQ)} unidades`, num: unitsLaunchedQ },
      unit: 'unidades',
      delta: { raw: params.marketHeat === 'hot' ? '+35%' : params.marketHeat === 'saturated' ? '-8%' : '+20%', num: params.marketHeat === 'hot' ? 35 : params.marketHeat === 'saturated' ? -8 : 20, type: 'pct' },
      period: { kind: 'quarterly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'quarterly_units_sold',
      label: 'Unidades Vendidas (Trimestre)',
      description: 'Total de unidades vendidas no trimestre',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${formatNumber(unitsSoldQ)} unidades`, num: unitsSoldQ },
      unit: 'unidades',
      delta: { raw: params.marketHeat === 'hot' ? '+25%' : params.marketHeat === 'saturated' ? '-4%' : '+12%', num: params.marketHeat === 'hot' ? 25 : params.marketHeat === 'saturated' ? -4 : 12, type: 'pct' },
      period: { kind: 'quarterly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'quarterly_total_stock_units',
      label: 'Estoque Total',
      description: 'Total de unidades em estoque',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${formatNumber(params.stockUnits)} unidades`, num: params.stockUnits },
      unit: 'unidades',
      delta: { raw: params.marketHeat === 'hot' ? '-12%' : params.marketHeat === 'saturated' ? '+5%' : '-3%', num: params.marketHeat === 'hot' ? -12 : params.marketHeat === 'saturated' ? 5 : -3, type: 'pct' },
      period: { kind: 'quarterly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'quarterly_sector_confidence_points',
      label: 'Índice de Confiança do Setor',
      description: 'Índice de confiança do setor imobiliário (0-100)',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${confidenceIndex} pontos`, num: confidenceIndex },
      unit: 'pontos',
      delta: { raw: params.marketHeat === 'hot' ? '+15 pts' : params.marketHeat === 'saturated' ? '-5 pts' : '+8 pts', num: params.marketHeat === 'hot' ? 15 : params.marketHeat === 'saturated' ? -5 : 8, type: 'abs' },
      period: { kind: 'quarterly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'quarterly_rental_yield_pct_aa',
      label: 'Rentabilidade Média (Aluguel)',
      description: 'Rentabilidade do aluguel sobre o preço de venda',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${rentalYield}% a.a.`, num: rentalYield },
      unit: '%',
      delta: { raw: params.marketHeat === 'hot' ? '-0.3 pp' : params.marketHeat === 'saturated' ? '+0.8 pp' : '+0.2 pp', num: params.marketHeat === 'hot' ? -0.3 : params.marketHeat === 'saturated' ? 0.8 : 0.2, type: 'pp' },
      period: { kind: 'quarterly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'quarterly_investment_attractiveness_score_10',
      label: 'Atratividade de Investimento',
      description: 'Score de atratividade para investimento (0-10)',
      source: 'IDI Brasil / Estimativa',
      value: { raw: `${attractiveness}/10`, num: attractiveness },
      unit: 'score_10',
      delta: { raw: params.marketHeat === 'hot' ? '+0.8' : params.marketHeat === 'saturated' ? '-0.5' : '+0.3', num: params.marketHeat === 'hot' ? 0.8 : params.marketHeat === 'saturated' ? -0.5 : 0.3, type: 'abs' },
      period: { kind: 'quarterly', ref },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
  ];
}

// Build project KPIs
function buildProjectKPIs(city: string): MetricCard[] {
  const now = new Date().toISOString();
  return [
    {
      metric_id: 'project_total_projects',
      label: 'Total de Projetos',
      description: 'Número de projetos em análise',
      source: 'Sistema',
      value: { raw: '1', num: 1 },
      unit: '',
      delta: { raw: null, num: null, type: null },
      period: { kind: 'project', ref: null },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'project_total_units',
      label: 'Total de Unidades',
      description: 'Total de unidades nos projetos',
      source: 'Sistema',
      value: { raw: '170 unidades no total', num: 170 },
      unit: 'unidades',
      delta: { raw: null, num: null, type: null },
      period: { kind: 'project', ref: null },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'project_total_vgv_brl',
      label: 'VGV Total',
      description: 'Valor Geral de Vendas total dos projetos',
      source: 'Sistema',
      value: { raw: 'R$ 97.580.000', num: 97580000 },
      unit: 'R$',
      delta: { raw: null, num: null, type: null },
      period: { kind: 'project', ref: null },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'project_roi_avg_pct',
      label: 'ROI Médio',
      description: 'Retorno sobre investimento médio',
      source: 'Sistema',
      value: { raw: '18%', num: 18 },
      unit: '%',
      delta: { raw: null, num: null, type: null },
      period: { kind: 'project', ref: null },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
    {
      metric_id: 'project_tir_avg_pct',
      label: 'TIR Média',
      description: 'Taxa Interna de Retorno média',
      source: 'Sistema',
      value: { raw: '22%', num: 22 },
      unit: '%',
      delta: { raw: null, num: null, type: null },
      period: { kind: 'project', ref: null },
      geo: { city },
      updated_at: now,
      provenance_url: null,
    },
  ];
}

// Build chart data based on city params
function buildChartData(city: string): Record<string, any> {
  const months = 12;
  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date().toISOString();
  const params = getCityParams(city);
  
  // Generate price trends based on city base price
  const lowBase = Math.round(params.priceM2Base * 0.55);
  const midBase = Math.round(params.priceM2Base * 0.85);
  const highBase = Math.round(params.priceM2Base * 1.5);
  
  const growthFactor = params.priceM2Delta / 100 / 12;
  
  const generateTrend = (base: number, growth: number) => {
    return Array.from({ length: 12 }, (_, i) => Math.round(base * (1 + growth * i)));
  };
  
  return {
    price_m2_trend: {
      chart_id: 'price_m2_trend',
      city,
      months,
      labels,
      series: [
        { name: 'Baixo Padrão', values: generateTrend(lowBase, growthFactor) },
        { name: 'Médio Padrão', values: generateTrend(midBase, growthFactor) },
        { name: 'Alto Padrão', values: generateTrend(highBase, growthFactor * 1.2) },
      ],
      unit: 'R$/m²',
      updated_at: now,
    },
    demand_index_trend: {
      chart_id: 'demand_index_trend',
      city,
      months,
      labels,
      series: [
        { name: 'Baixo Padrão', values: generateTrend(params.demandIndex - 10, params.marketHeat === 'hot' ? 0.008 : -0.002) },
        { name: 'Médio Padrão', values: generateTrend(params.demandIndex, params.marketHeat === 'hot' ? 0.01 : 0.002) },
        { name: 'Alto Padrão', values: generateTrend(params.demandIndex - 15, params.marketHeat === 'hot' ? 0.012 : -0.005) },
      ],
      unit: 'pontos',
      updated_at: now,
    },
    stock_available_trend: {
      chart_id: 'stock_available_trend',
      city,
      months,
      labels,
      series: [
        { name: 'Baixo Padrão', values: generateTrend(Math.round(params.stockUnits * 0.5), params.marketHeat === 'hot' ? -0.015 : 0.005) },
        { name: 'Médio Padrão', values: generateTrend(Math.round(params.stockUnits * 0.35), params.marketHeat === 'hot' ? -0.012 : 0.003) },
        { name: 'Alto Padrão', values: generateTrend(Math.round(params.stockUnits * 0.15), params.marketHeat === 'hot' ? -0.01 : 0.002) },
      ],
      unit: 'unidades',
      updated_at: now,
    },
    investment_attractiveness_trend: {
      chart_id: 'investment_attractiveness_trend',
      city,
      months,
      labels,
      series: [
        { name: 'Baixo Padrão', values: generateTrend(params.marketHeat === 'hot' ? 72 : params.marketHeat === 'saturated' ? 55 : 65, 0.005) },
        { name: 'Médio Padrão', values: generateTrend(params.marketHeat === 'hot' ? 78 : params.marketHeat === 'saturated' ? 60 : 70, 0.006) },
        { name: 'Alto Padrão', values: generateTrend(params.marketHeat === 'hot' ? 68 : params.marketHeat === 'saturated' ? 48 : 58, 0.004) },
      ],
      unit: 'pontos',
      updated_at: now,
    },
  };
}

// Build stock vs demand data based on city params
function buildStockDemandData(city: string): any {
  const now = new Date().toISOString();
  const params = getCityParams(city);
  
  const lowStock = Math.round(params.stockUnits * 0.5);
  const midStock = Math.round(params.stockUnits * 0.35);
  const highStock = Math.round(params.stockUnits * 0.15);
  
  const lowDemand = Math.round(lowStock / (params.absorptionMonths * 1.2));
  const midDemand = Math.round(midStock / params.absorptionMonths);
  const highDemand = Math.round(highStock / (params.absorptionMonths * 0.7));
  
  const bySegment = [
    { segment: 'Baixo Padrão', months_of_stock: parseFloat((lowStock / lowDemand).toFixed(1)), stock: lowStock, demand: lowDemand },
    { segment: 'Médio Padrão', months_of_stock: parseFloat((midStock / midDemand).toFixed(1)), stock: midStock, demand: midDemand },
    { segment: 'Alto Padrão', months_of_stock: parseFloat((highStock / highDemand).toFixed(1)), stock: highStock, demand: highDemand },
  ];
  
  const totalStock = lowStock + midStock + highStock;
  const totalDemand = lowDemand + midDemand + highDemand;
  const avgMonths = parseFloat((totalStock / totalDemand).toFixed(1));
  
  let status = 'Mercado equilibrado';
  if (avgMonths >= 12) status = 'Mercado saturado';
  else if (avgMonths < 8) status = 'Mercado aquecido';
  
  return {
    city,
    months: 12,
    total_stock_units: totalStock,
    monthly_total_demand_units: totalDemand,
    avg_months_of_stock: avgMonths,
    status,
    by_segment: bySegment,
    updated_at: now,
  };
}

// Fetch real market insights data from database
interface CityMarketSummary {
  cidade: string;
  uf: string;
  preco_m2: number;
  variacao_12m: number;
  variacao_mes: number;
}

interface StateMarketSummary {
  uf: string;
  cidades_count: number;
  preco_medio: number;
  variacao_media: number;
  cidades_em_alta: string[];
  cidades_em_queda: string[];
}

async function fetchMarketDataForInsights(supabase: any, _city: string): Promise<{
  cities: CityMarketSummary[];
  states: StateMarketSummary[];
  topGainers: CityMarketSummary[];
  topLosers: CityMarketSummary[];
  nationalStats: { avgPrice: number; avgVariation: number; totalCities: number };
}> {
  try {
    // Fetch latest data for all cities
    const { data: allCities, error } = await supabase
      .from('idi_fipezap_historico')
      .select('cidade, uf, preco_m2_venda, variacao_venda_12m, variacao_venda_mes, mes')
      .not('preco_m2_venda', 'is', null)
      .order('mes', { ascending: false });

    if (error || !allCities) {
      console.log('Error fetching market data for insights:', error);
      return { cities: [], states: [], topGainers: [], topLosers: [], nationalStats: { avgPrice: 0, avgVariation: 0, totalCities: 0 } };
    }

    // Get unique latest data per city
    const cityMap = new Map<string, CityMarketSummary>();
    for (const row of allCities) {
      const key = `${row.cidade}-${row.uf}`;
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          cidade: row.cidade,
          uf: row.uf,
          preco_m2: parseFloat(row.preco_m2_venda),
          variacao_12m: parseFloat(row.variacao_venda_12m || 0),
          variacao_mes: parseFloat(row.variacao_venda_mes || 0),
        });
      }
    }

    const cities = Array.from(cityMap.values());

    // Calculate national stats
    const totalCities = cities.length;
    const avgPrice = cities.reduce((sum, c) => sum + c.preco_m2, 0) / totalCities;
    const avgVariation = cities.reduce((sum, c) => sum + c.variacao_12m, 0) / totalCities;

    // Group by state
    const stateMap = new Map<string, { cities: CityMarketSummary[] }>();
    for (const c of cities) {
      if (!stateMap.has(c.uf)) {
        stateMap.set(c.uf, { cities: [] });
      }
      stateMap.get(c.uf)!.cities.push(c);
    }

    const states: StateMarketSummary[] = [];
    for (const [uf, data] of stateMap) {
      const stateCities = data.cities;
      const precoMedio = stateCities.reduce((sum, c) => sum + c.preco_m2, 0) / stateCities.length;
      const variacaoMedia = stateCities.reduce((sum, c) => sum + c.variacao_12m, 0) / stateCities.length;
      
      states.push({
        uf,
        cidades_count: stateCities.length,
        preco_medio: Math.round(precoMedio),
        variacao_media: parseFloat(variacaoMedia.toFixed(1)),
        cidades_em_alta: stateCities.filter(c => c.variacao_12m >= 7).map(c => c.cidade).slice(0, 3),
        cidades_em_queda: stateCities.filter(c => c.variacao_12m < 3).map(c => c.cidade).slice(0, 3),
      });
    }

    // Top gainers and losers
    const sortedByVariation = [...cities].sort((a, b) => b.variacao_12m - a.variacao_12m);
    const topGainers = sortedByVariation.slice(0, 5);
    const topLosers = sortedByVariation.slice(-5).reverse();

    return {
      cities,
      states: states.sort((a, b) => b.variacao_media - a.variacao_media),
      topGainers,
      topLosers,
      nationalStats: { avgPrice: Math.round(avgPrice), avgVariation: parseFloat(avgVariation.toFixed(1)), totalCities },
    };
  } catch (e) {
    console.log('Error in fetchMarketDataForInsights:', e);
    return { cities: [], states: [], topGainers: [], topLosers: [], nationalStats: { avgPrice: 0, avgVariation: 0, totalCities: 0 } };
  }
}

// Build market insights based on city data - now with real data
async function buildMarketInsights(supabase: any, city: string, macro: MetricCard[], stockDemand: any): Promise<any[]> {
  const insights: any[] = [];
  const params = getCityParams(city);
  
  // Fetch real market data for insights
  const marketData = await fetchMarketDataForInsights(supabase, city);
  const isNational = city === 'Brasil (Nacional)';
  
  // Find metrics
  const selicMetric = macro.find(m => m.metric_id === 'macro_selic_rate');
  const ipcaMetric = macro.find(m => m.metric_id === 'macro_ipca_12m_pct');
  const dollarMetric = macro.find(m => m.metric_id === 'macro_usd_brl');
  
  // =========== INSIGHTS NACIONAIS (dados concretos) ===========
  if (isNational && marketData.nationalStats.totalCities > 0) {
    // 1) Panorama Nacional com dados reais
    const citiesAbove7 = marketData.cities.filter(c => c.variacao_12m >= 7).length;
    const citiesBelow3 = marketData.cities.filter(c => c.variacao_12m < 3).length;
    
    insights.push({
      insight_id: 'national_overview',
      title: `Panorama Nacional: ${marketData.nationalStats.totalCities} Cidades Monitoradas`,
      severity: 'info',
      message: `O mercado imobiliário brasileiro apresenta preço médio de R$ ${formatNumber(marketData.nationalStats.avgPrice)}/m² com valorização média de ${marketData.nationalStats.avgVariation}% em 12 meses. ${citiesAbove7} cidades em alta acelerada (>7%) e ${citiesBelow3} com crescimento moderado (<3%).`,
      drivers: [
        { metric_id: 'national_avg_price', value_raw: `R$ ${formatNumber(marketData.nationalStats.avgPrice)}/m²`, rule: 'média nacional' },
        { metric_id: 'cities_high_growth', value_raw: `${citiesAbove7} cidades`, rule: 'variação_12m >= 7%' },
      ],
    });

    // 2) Top Cidades em Alta
    if (marketData.topGainers.length > 0) {
      const topCities = marketData.topGainers.slice(0, 3);
      const topList = topCities.map(c => `${c.cidade}/${c.uf} (+${c.variacao_12m}%)`).join(', ');
      
      insights.push({
        insight_id: 'top_gainers',
        title: 'Cidades com Maior Valorização',
        severity: 'info',
        message: `As cidades com maior valorização nos últimos 12 meses são: ${topList}. Estas regiões apresentam demanda aquecida e potencial para novos investimentos.`,
        drivers: topCities.map(c => ({
          metric_id: `city_${c.cidade.toLowerCase().replace(/\s/g, '_')}`,
          value_raw: `+${c.variacao_12m}% | R$ ${formatNumber(c.preco_m2)}/m²`,
          rule: 'top_3_valorização',
        })),
      });
    }

    // 3) Cidades em Desaceleração (oportunidade ou risco)
    if (marketData.topLosers.length > 0) {
      const lowCities = marketData.topLosers.filter(c => c.variacao_12m < 4).slice(0, 3);
      if (lowCities.length > 0) {
        const lowList = lowCities.map(c => `${c.cidade}/${c.uf} (+${c.variacao_12m}%)`).join(', ');
        
        insights.push({
          insight_id: 'low_growth_cities',
          title: 'Cidades com Crescimento Moderado',
          severity: 'warning',
          message: `As cidades com menor valorização incluem: ${lowList}. Pode indicar excesso de oferta ou demanda enfraquecida. Análise detalhada recomendada antes de investir.`,
          drivers: lowCities.map(c => ({
            metric_id: `city_${c.cidade.toLowerCase().replace(/\s/g, '_')}`,
            value_raw: `+${c.variacao_12m}% | R$ ${formatNumber(c.preco_m2)}/m²`,
            rule: 'baixa_valorização',
          })),
        });
      }
    }

    // 4) Estados em Destaque
    const topStates = marketData.states.slice(0, 3);
    if (topStates.length > 0) {
      const stateList = topStates.map(s => `${s.uf} (${s.cidades_count} cidades, +${s.variacao_media}%)`).join(', ');
      
      insights.push({
        insight_id: 'top_states',
        title: 'Estados com Melhor Desempenho',
        severity: 'info',
        message: `Os estados com maior valorização média são: ${stateList}. Estes mercados regionais apresentam dinâmica favorável ao desenvolvimento imobiliário.`,
        drivers: topStates.map(s => ({
          metric_id: `state_${s.uf}`,
          value_raw: `+${s.variacao_media}% | R$ ${formatNumber(s.preco_medio)}/m²`,
          rule: 'top_states',
        })),
      });
    }
  }

  // =========== INSIGHTS ESPECÍFICOS POR CIDADE ===========
  if (!isNational) {
    // Encontrar dados da cidade selecionada
    const cityData = marketData.cities.find(c => c.cidade === city);
    const stateData = cityData ? marketData.states.find(s => s.uf === cityData.uf) : null;

    if (cityData) {
      // Insight da cidade com comparativo
      const aboveNational = cityData.variacao_12m > marketData.nationalStats.avgVariation;
      const priceComparison = cityData.preco_m2 > marketData.nationalStats.avgPrice ? 'acima' : 'abaixo';
      
      insights.push({
        insight_id: 'city_performance',
        title: `${city}: ${aboveNational ? 'Desempenho Acima da Média' : 'Desempenho Abaixo da Média'}`,
        severity: aboveNational ? 'info' : 'warning',
        message: `${city} apresenta valorização de ${cityData.variacao_12m}% em 12 meses (média nacional: ${marketData.nationalStats.avgVariation}%). Preço médio de R$ ${formatNumber(cityData.preco_m2)}/m², ${priceComparison} da média nacional de R$ ${formatNumber(marketData.nationalStats.avgPrice)}/m².`,
        drivers: [
          { metric_id: 'city_variation', value_raw: `+${cityData.variacao_12m}%`, rule: 'variação_12m' },
          { metric_id: 'city_price', value_raw: `R$ ${formatNumber(cityData.preco_m2)}/m²`, rule: 'preço_m2' },
        ],
      });
    }

    // Cidades do mesmo estado em alta
    if (stateData && stateData.cidades_em_alta.length > 0) {
      const otherCities = stateData.cidades_em_alta.filter(c => c !== city).slice(0, 3);
      if (otherCities.length > 0) {
        insights.push({
          insight_id: 'state_hot_cities',
          title: `Cidades em Alta em ${stateData.uf}`,
          severity: 'info',
          message: `No estado de ${stateData.uf}, outras cidades em valorização acelerada: ${otherCities.join(', ')}. Média estadual: R$ ${formatNumber(stateData.preco_medio)}/m² com +${stateData.variacao_media}% a.a.`,
          drivers: [
            { metric_id: `state_${stateData.uf}_avg`, value_raw: `+${stateData.variacao_media}%`, rule: 'média_estadual' },
          ],
        });
      }
    }
  }

  // =========== INSIGHTS MACRO (mantidos) ===========
  // 1) Taxa Selic Elevada
  if (selicMetric && selicMetric.value.num >= 12) {
    insights.push({
      insight_id: 'selic_high',
      title: 'Taxa Selic Elevada',
      severity: 'risk',
      message: `A taxa Selic está em ${selicMetric.value.raw}, encarecendo o crédito imobiliário. Impacto direto na capacidade de financiamento e velocidade de vendas.`,
      drivers: [{ metric_id: 'macro_selic_rate', value_raw: selicMetric.value.raw, rule: 'macro_selic_rate >= 12' }],
    });
  }
  
  // 2) Inflação Controlada
  if (ipcaMetric && ipcaMetric.value.num <= 5) {
    insights.push({
      insight_id: 'ipca_controlled',
      title: 'Inflação Controlada',
      severity: 'info',
      message: `O IPCA está em ${ipcaMetric.value.raw}, dentro da meta. Cenário favorável para planejamento de longo prazo e estabilidade de custos.`,
      drivers: [{ metric_id: 'macro_ipca_12m_pct', value_raw: ipcaMetric.value.raw, rule: 'macro_ipca_12m_pct <= 5' }],
    });
  }
  
  // 3) Dólar Elevado
  if (dollarMetric && dollarMetric.value.num >= 5.0) {
    insights.push({
      insight_id: 'dollar_high',
      title: 'Dólar Elevado',
      severity: 'warning',
      message: `O dólar está a ${dollarMetric.value.raw}, encarecendo insumos importados. Monitorar impacto nos custos de obra.`,
      drivers: [{ metric_id: 'macro_usd_brl', value_raw: dollarMetric.value.raw, rule: 'macro_usd_brl >= 5.0' }],
    });
  }
  
  // 4) Market status insight (baseado em dados locais)
  if (!isNational) {
    if (params.marketHeat === 'saturated') {
      insights.push({
        insight_id: 'market_saturated',
        title: 'Mercado Saturado',
        severity: 'risk',
        message: `${city} apresenta ${stockDemand.avg_months_of_stock} meses de estoque. Mercado saturado exige diferenciação ou aguardar absorção.`,
        drivers: [{ metric_id: 'stock_demand', value_raw: `${stockDemand.avg_months_of_stock} meses`, rule: '>= 12' }],
      });
    } else if (params.marketHeat === 'hot') {
      insights.push({
        insight_id: 'market_hot',
        title: 'Mercado Aquecido',
        severity: 'info',
        message: `${city} apresenta apenas ${stockDemand.avg_months_of_stock} meses de estoque. Oportunidade para novos lançamentos.`,
        drivers: [{ metric_id: 'stock_demand', value_raw: `${stockDemand.avg_months_of_stock} meses`, rule: '< 8' }],
      });
    }
  }
  
  return insights;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req.headers.get('origin')) });
  }

  try {
    console.log('Dashboard summary function called');
    
    // Initialize Supabase client for real data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get city from query params or body
    let city = 'Rio de Janeiro';
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      city = url.searchParams.get('city') || 'Rio de Janeiro';
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        city = body.city || 'Rio de Janeiro';
      } catch {
        // Use default city if body parsing fails
      }
    }
    
    // Fetch real market data for the city (with fallback to static)
    const cityParams = await getCityParamsWithRealData(supabase, city);
    
    const periods = getPeriodRefs();
    
    // Build all data with real city params
    const [macro] = await Promise.all([
      buildMacroIndicators(city),
    ]);
    
    // Os dados reais já estão no cache via getCityParamsWithRealData
    // Todas as funções usam getCityParams que agora consulta o cache primeiro
    const weekly = buildWeeklyIndices(city, periods.weekly);
    const monthly = buildMonthlyIndices(city, periods.monthly);
    const quarterly = buildQuarterlyIndices(city, periods.quarterly);
    const projects = buildProjectKPIs(city);
    const charts = buildChartData(city);
    const stockDemand = buildStockDemandData(city);
    const insights = await buildMarketInsights(supabase, city, macro, stockDemand);
    
    const response = {
      city,
      weekly_ref: periods.weekly,
      monthly_ref: periods.monthly,
      quarterly_ref: periods.quarterly,
      macro,
      weekly,
      monthly,
      quarterly,
      projects,
      charts,
      stock_demand: stockDemand,
      insights,
      data_source: cityParams.priceM2Base ? 'real' : 'estimated',
      updated_at: new Date().toISOString(),
    };
    
    console.log(`Dashboard summary built for ${city} (price: R$ ${cityParams.priceM2Base}/m²)`);
    
    return new Response(JSON.stringify(response), {
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in dashboard-summary function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
