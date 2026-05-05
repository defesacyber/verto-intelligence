/**
 * =====================================================
 * Verto Intelligence - DATA SERVICE (SINGLE SOURCE OF TRUTH)
 * =====================================================
 * 
 * Este serviço centraliza todos os dados e cálculos do sistema.
 * Todas as fontes de dados devem passar por aqui para garantir
 * consistência em todo o aplicativo.
 * 
 * FONTES OBRIGATÓRIAS:
 * - SELIC: API BCB Série 432
 * - IPCA: API IBGE SIDRA Tabela 1737
 * - Dólar: API PTAX (Olinda BCB)
 * - Financiamento: Série 25497 BCB
 * - Preços/m²: Tabela idi_fipezap_historico (prioridade) ou FALLBACK_CITY_DATA
 */

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// INTERFACES
// =====================================================

export interface MacroIndicators {
  selic: number;
  selicChange: number | null;
  ipca12m: number;
  ipcaChange: number | null;
  dollar: number;
  dollarChange: number | null;
  financingAvg: number;
  financingCaixa: number;
  lastUpdated: string;
  source: 'api' | 'fallback';
}

export interface CityMarketData {
  city: string;
  uf: string;
  priceM2: number;
  variation12m: number;
  variationMonth: number;
  demandIndex: number;
  stockUnits: number;
  absorptionMonths: number;
  marketHeat: 'hot' | 'balanced' | 'saturated';
  source: 'database' | 'fallback';
  lastUpdated: string;
}

export interface NationalStats {
  avgPriceM2: number;
  avgVariation12m: number;
  totalCities: number;
  citiesAbove7Percent: number;
  citiesBelow3Percent: number;
  topGainers: Array<{ city: string; uf: string; variation: number }>;
  topLosers: Array<{ city: string; uf: string; variation: number }>;
}

export interface ViabilityMetrics {
  vgv: number;
  totalCost: number;
  profit: number;
  margin: number;
  roi: number;
  tir: number;
  paybackMonths: number;
}

export interface IndicatorFormula {
  id: string;
  name: string;
  formula: string;
  source: string;
  sourceUrl: string | null;
}

// =====================================================
// FALLBACK DATA (usado quando APIs falham)
// =====================================================

/*
// Fallback macro indicators - kept for potential future use when APIs fail
const FALLBACK_MACRO: MacroIndicators = {
  selic: 14.25,
  selicChange: null,
  ipca12m: 4.83,
  ipcaChange: null,
  dollar: 5.40,
  dollarChange: null,
  financingAvg: 11.49,
  financingCaixa: 11.25, // max(14.25 - 3.0, 9.99)
  lastUpdated: new Date().toISOString(),
  source: 'fallback',
};
*/

/**
 * FALLBACK_CITY_DATA - Dados de fallback para cidades principais
 * ATENÇÃO: Estes valores SÓ são usados quando a tabela idi_fipezap_historico não retorna dados
 * Valores baseados em médias históricas do FipeZap
 */
const FALLBACK_CITY_DATA: Record<string, Omit<CityMarketData, 'city' | 'uf' | 'source' | 'lastUpdated'>> = {
  // Nacional - média ponderada
  'Brasil (Nacional)': { priceM2: 8500, variation12m: 5.5, variationMonth: 0.45, demandIndex: 65, stockUnits: 150000, absorptionMonths: 14, marketHeat: 'balanced' },
  
  // Sudeste
  'São Paulo-SP': { priceM2: 12500, variation12m: 5.2, variationMonth: 0.43, demandIndex: 78, stockUnits: 45000, absorptionMonths: 10, marketHeat: 'hot' },
  'Rio de Janeiro-RJ': { priceM2: 10800, variation12m: 4.8, variationMonth: 0.40, demandIndex: 68, stockUnits: 32000, absorptionMonths: 13, marketHeat: 'balanced' },
  'Belo Horizonte-MG': { priceM2: 8200, variation12m: 4.0, variationMonth: 0.33, demandIndex: 66, stockUnits: 18000, absorptionMonths: 14, marketHeat: 'balanced' },
  'Campinas-SP': { priceM2: 8900, variation12m: 4.8, variationMonth: 0.40, demandIndex: 72, stockUnits: 8500, absorptionMonths: 11, marketHeat: 'hot' },
  'Vitória-ES': { priceM2: 9200, variation12m: 3.8, variationMonth: 0.32, demandIndex: 62, stockUnits: 5500, absorptionMonths: 14, marketHeat: 'balanced' },
  
  // Sul
  'Curitiba-PR': { priceM2: 9800, variation12m: 5.5, variationMonth: 0.46, demandIndex: 75, stockUnits: 15000, absorptionMonths: 9, marketHeat: 'hot' },
  'Porto Alegre-RS': { priceM2: 8500, variation12m: 3.2, variationMonth: 0.27, demandIndex: 58, stockUnits: 14000, absorptionMonths: 16, marketHeat: 'saturated' },
  'Florianópolis-SC': { priceM2: 12800, variation12m: 6.2, variationMonth: 0.52, demandIndex: 82, stockUnits: 8500, absorptionMonths: 7, marketHeat: 'hot' },
  'Balneário Camboriú-SC': { priceM2: 18500, variation12m: 7.5, variationMonth: 0.63, demandIndex: 85, stockUnits: 6200, absorptionMonths: 6, marketHeat: 'hot' },
  
  // Centro-Oeste - Valor UNIFICADO: R$ 6.500/m² para Goiânia
  'Brasília-DF': { priceM2: 11200, variation12m: 4.2, variationMonth: 0.35, demandIndex: 70, stockUnits: 22000, absorptionMonths: 12, marketHeat: 'balanced' },
  'Goiânia-GO': { priceM2: 6500, variation12m: 5.8, variationMonth: 0.48, demandIndex: 76, stockUnits: 12000, absorptionMonths: 8, marketHeat: 'hot' },
  'Campo Grande-MS': { priceM2: 5200, variation12m: 3.5, variationMonth: 0.29, demandIndex: 60, stockUnits: 4500, absorptionMonths: 14, marketHeat: 'balanced' },
  'Cuiabá-MT': { priceM2: 5800, variation12m: 4.0, variationMonth: 0.33, demandIndex: 62, stockUnits: 4800, absorptionMonths: 13, marketHeat: 'balanced' },
  
  // Nordeste
  'Salvador-BA': { priceM2: 7500, variation12m: 3.8, variationMonth: 0.32, demandIndex: 62, stockUnits: 16000, absorptionMonths: 15, marketHeat: 'saturated' },
  'Recife-PE': { priceM2: 7800, variation12m: 4.0, variationMonth: 0.33, demandIndex: 64, stockUnits: 14000, absorptionMonths: 14, marketHeat: 'balanced' },
  'Fortaleza-CE': { priceM2: 7200, variation12m: 4.2, variationMonth: 0.35, demandIndex: 66, stockUnits: 12000, absorptionMonths: 13, marketHeat: 'balanced' },
  'Natal-RN': { priceM2: 6500, variation12m: 3.5, variationMonth: 0.29, demandIndex: 60, stockUnits: 5500, absorptionMonths: 15, marketHeat: 'saturated' },
  'João Pessoa-PB': { priceM2: 6200, variation12m: 4.5, variationMonth: 0.38, demandIndex: 68, stockUnits: 4800, absorptionMonths: 11, marketHeat: 'hot' },
  
  // Norte
  'Manaus-AM': { priceM2: 5800, variation12m: 3.5, variationMonth: 0.29, demandIndex: 60, stockUnits: 6500, absorptionMonths: 15, marketHeat: 'saturated' },
  'Belém-PA': { priceM2: 5500, variation12m: 3.2, variationMonth: 0.27, demandIndex: 58, stockUnits: 5800, absorptionMonths: 16, marketHeat: 'saturated' },
};

// =====================================================
// FÓRMULAS E DOCUMENTAÇÃO DOS INDICADORES
// =====================================================

export const INDICATOR_FORMULAS: Record<string, IndicatorFormula> = {
  // Macro
  selic: {
    id: 'selic',
    name: 'Taxa Selic',
    formula: 'Valor direto da API BCB Série 432',
    source: 'Banco Central do Brasil',
    sourceUrl: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432',
  },
  ipca_12m: {
    id: 'ipca_12m',
    name: 'IPCA 12 meses',
    formula: 'Valor acumulado 12 meses da API IBGE SIDRA Tabela 1737',
    source: 'IBGE',
    sourceUrl: 'https://apisidra.ibge.gov.br/values/t/1737',
  },
  dollar: {
    id: 'dollar',
    name: 'Dólar Comercial',
    formula: 'Cotação PTAX de venda (Olinda BCB)',
    source: 'Banco Central do Brasil',
    sourceUrl: 'https://olinda.bcb.gov.br/olinda/servico/PTAX',
  },
  financing_avg: {
    id: 'financing_avg',
    name: 'Financiamento Médio',
    formula: 'API BCB Série 25497 (Taxa média financiamento imobiliário)',
    source: 'Banco Central do Brasil',
    sourceUrl: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.25497',
  },
  financing_caixa: {
    id: 'financing_caixa',
    name: 'Financiamento Caixa SBPE',
    formula: 'max(Selic - 3.0, 9.99)',
    source: 'Estimativa baseada na Selic',
    sourceUrl: null,
  },
  
  // Mercado
  price_m2: {
    id: 'price_m2',
    name: 'Preço Médio m²',
    formula: 'Dados reais de idi_fipezap_historico ou FALLBACK_CITY_DATA',
    source: 'FipeZap / Índice FipeZap',
    sourceUrl: 'https://www.fipezap.com.br',
  },
  variation_weekly: {
    id: 'variation_weekly',
    name: 'Variação Semanal',
    formula: 'variation12m / 52',
    source: 'Calculado a partir da variação anual',
    sourceUrl: null,
  },
  market_status: {
    id: 'market_status',
    name: 'Status do Mercado',
    formula: 'absorptionMonths >= 12: Saturado | 8-12: Equilibrado | < 8: Aquecido',
    source: 'Análise de meses de estoque',
    sourceUrl: null,
  },
  vgv_launched: {
    id: 'vgv_launched',
    name: 'VGV Lançado',
    formula: 'unitsLaunched × priceM2 × 55 (área média)',
    source: 'Cálculo interno',
    sourceUrl: null,
  },
  
  // Viabilidade
  vgv: {
    id: 'vgv',
    name: 'VGV Total',
    formula: 'Σ(quantidade × área_m2 × preço_m2) para todos tipos de unidade',
    source: 'Cálculo interno',
    sourceUrl: null,
  },
  roi: {
    id: 'roi',
    name: 'ROI',
    formula: '(lucroLiquido / investimentoTotal) × 100',
    source: 'Cálculo interno',
    sourceUrl: null,
  },
  tir: {
    id: 'tir',
    name: 'TIR',
    formula: 'Taxa interna de retorno anualizada do fluxo de caixa',
    source: 'Cálculo interno',
    sourceUrl: null,
  },
  payback: {
    id: 'payback',
    name: 'Payback',
    formula: 'investimentoTotal / (VGV / mesesVenda)',
    source: 'Cálculo interno',
    sourceUrl: null,
  },
  margin: {
    id: 'margin',
    name: 'Margem',
    formula: '(lucro / VGV) × 100',
    source: 'Cálculo interno',
    sourceUrl: null,
  },
  
  // Projetos
  permuta_units: {
    id: 'permuta_units',
    name: 'Unidades em Permuta',
    formula: 'Math.ceil(totalUnidades × percentualPermuta / 100)',
    source: 'Cálculo interno',
    sourceUrl: null,
  },
  sales_validation: {
    id: 'sales_validation',
    name: 'Validação de Vendas',
    formula: 'lançamento% + obra% + chaves% = 100%',
    source: 'Regra de negócio',
    sourceUrl: null,
  },
};

// =====================================================
// THRESHOLDS DE VIABILIDADE
// =====================================================

export const VIABILITY_THRESHOLDS = {
  ROI: { min: 15, recommended: 25, excellent: 35 },
  TIR: { min: 12, recommended: 18, excellent: 25 },
  PAYBACK: { max: 48, recommended: 36, excellent: 24 },
  MARGIN: { min: 20, recommended: 30, excellent: 40 },
} as const;

export const SCENARIO_MULTIPLIERS = {
  pessimistic: { sales: 0.85, costs: 1.15, time: 1.3 },
  projected: { sales: 1.0, costs: 1.0, time: 1.0 },
  optimistic: { sales: 1.12, costs: 0.92, time: 0.8 },
} as const;

// =====================================================
// CACHE DE DADOS
// =====================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const dataCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCached<T>(key: string): T | null {
  const entry = dataCache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data as T;
  }
  dataCache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
  dataCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  });
}

// =====================================================
// FUNÇÕES DE BUSCA DE DADOS
// =====================================================

/**
 * Busca dados de mercado de uma cidade da tabela idi_fipezap_historico
 */
export async function fetchCityMarketData(city: string, uf?: string): Promise<CityMarketData> {
  const cacheKey = `market_${city}_${uf || 'any'}`;
  const cached = getCached<CityMarketData>(cacheKey);
  if (cached) return cached;

  try {
    // Para "Nacional", buscar média de todas as cidades
    if (city === 'Brasil (Nacional)' || city === 'Nacional') {
      const stats = await fetchNationalStats();
      const result: CityMarketData = {
        city: 'Brasil (Nacional)',
        uf: 'BR',
        priceM2: stats.avgPriceM2,
        variation12m: stats.avgVariation12m,
        variationMonth: stats.avgVariation12m / 12,
        demandIndex: 65,
        stockUnits: 150000,
        absorptionMonths: 14,
        marketHeat: 'balanced',
        source: stats.totalCities > 0 ? 'database' : 'fallback',
        lastUpdated: new Date().toISOString(),
      };
      setCache(cacheKey, result);
      return result;
    }

    // Buscar dados reais do banco
    let query = supabase
      .from('idi_fipezap_historico')
      .select('cidade, uf, preco_m2_venda, variacao_venda_12m, variacao_venda_mes, mes')
      .eq('cidade', city)
      .order('mes', { ascending: false })
      .limit(1);

    if (uf) {
      query = query.eq('uf', uf);
    }

    const { data, error } = await query.maybeSingle();

    if (!error && data && data.preco_m2_venda) {
      const variacao12m = data.variacao_venda_12m != null ? Number(data.variacao_venda_12m) : 5;
      const absorptionMonths = calculateAbsorptionMonths(variacao12m);
      const result: CityMarketData = {
        city: data.cidade,
        uf: data.uf,
        priceM2: Number(data.preco_m2_venda),
        variation12m: variacao12m,
        variationMonth: data.variacao_venda_mes != null ? Number(data.variacao_venda_mes) : 0,
        demandIndex: calculateDemandIndex(variacao12m),
        stockUnits: estimateStockUnits(city),
        absorptionMonths,
        marketHeat: getMarketHeat(absorptionMonths),
        source: 'database',
        lastUpdated: new Date().toISOString(),
      };
      setCache(cacheKey, result);
      console.log(`[DataService] Real data for ${city}: R$ ${result.priceM2}/m²`);
      return result;
    }
  } catch (e) {
    console.log(`[DataService] Error fetching data for ${city}:`, e);
  }

  // Fallback
  const fallbackKey = uf ? `${city}-${uf}` : city;
  const fallback = FALLBACK_CITY_DATA[fallbackKey] || FALLBACK_CITY_DATA['Brasil (Nacional)'];
  
  const result: CityMarketData = {
    city,
    uf: uf || 'BR',
    ...fallback,
    source: 'fallback',
    lastUpdated: new Date().toISOString(),
  };
  
  console.log(`[DataService] Using fallback for ${city}: R$ ${result.priceM2}/m²`);
  setCache(cacheKey, result);
  return result;
}

/**
 * Busca estatísticas nacionais da tabela idi_fipezap_historico
 */
export async function fetchNationalStats(): Promise<NationalStats> {
  const cacheKey = 'national_stats';
  const cached = getCached<NationalStats>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('idi_fipezap_historico')
      .select('cidade, uf, preco_m2_venda, variacao_venda_12m')
      .not('preco_m2_venda', 'is', null)
      .order('mes', { ascending: false });

    if (!error && data && data.length > 0) {
      // Deduplica por cidade (pega o mais recente)
      const cityMap = new Map<string, { city: string; uf: string; price: number; variation: number }>();
      for (const row of data) {
        const key = `${row.cidade}-${row.uf}`;
        if (!cityMap.has(key)) {
          cityMap.set(key, {
            city: row.cidade,
            uf: row.uf,
            price: Number(row.preco_m2_venda),
            variation: row.variacao_venda_12m != null ? Number(row.variacao_venda_12m) : 0,
          });
        }
      }

      const cities = Array.from(cityMap.values());
      const totalCities = cities.length;
      const avgPriceM2 = Math.round(cities.reduce((sum, c) => sum + c.price, 0) / totalCities);
      const avgVariation12m = parseFloat((cities.reduce((sum, c) => sum + c.variation, 0) / totalCities).toFixed(1));

      const sortedByVariation = [...cities].sort((a, b) => b.variation - a.variation);
      
      const result: NationalStats = {
        avgPriceM2,
        avgVariation12m,
        totalCities,
        citiesAbove7Percent: cities.filter(c => c.variation >= 7).length,
        citiesBelow3Percent: cities.filter(c => c.variation < 3).length,
        topGainers: sortedByVariation.slice(0, 5).map(c => ({ city: c.city, uf: c.uf, variation: c.variation })),
        topLosers: sortedByVariation.slice(-5).reverse().map(c => ({ city: c.city, uf: c.uf, variation: c.variation })),
      };

      setCache(cacheKey, result, 10 * 60 * 1000); // 10 min cache
      return result;
    }
  } catch (e) {
    console.log('[DataService] Error fetching national stats:', e);
  }

  // Fallback
  return {
    avgPriceM2: 8500,
    avgVariation12m: 5.5,
    totalCities: 0,
    citiesAbove7Percent: 0,
    citiesBelow3Percent: 0,
    topGainers: [],
    topLosers: [],
  };
}

// =====================================================
// FUNÇÕES DE CÁLCULO
// =====================================================

/**
 * Calcula Financiamento Caixa: max(Selic - 3.0, 9.99)
 */
export function calculateFinancingCaixa(selic: number): number {
  return Math.max(selic - 3.0, 9.99);
}

/**
 * Calcula variação semanal a partir da anual
 */
export function calculateWeeklyVariation(annualVariation: number): number {
  return parseFloat((annualVariation / 52).toFixed(3));
}

/**
 * Calcula status do mercado baseado em meses de estoque
 */
export function getMarketHeat(absorptionMonths: number): 'hot' | 'balanced' | 'saturated' {
  if (absorptionMonths < 8) return 'hot';
  if (absorptionMonths >= 12) return 'saturated';
  return 'balanced';
}

/**
 * Calcula VGV Lançado
 */
export function calculateVGVLaunched(unitsLaunched: number, priceM2: number, avgArea: number = 55): number {
  return unitsLaunched * priceM2 * avgArea;
}

/**
 * Calcula índice de demanda baseado na variação de preços
 */
function calculateDemandIndex(variation12m: number): number {
  // Base 60, ajusta conforme variação
  return Math.min(95, Math.max(40, Math.round(60 + variation12m * 3)));
}

/**
 * Calcula meses de absorção baseado na variação de preços
 */
function calculateAbsorptionMonths(variation12m: number): number {
  // Mercados quentes têm absorção mais rápida
  if (variation12m >= 7) return 7;
  if (variation12m >= 5) return 9;
  if (variation12m >= 3) return 12;
  return 15;
}

/**
 * Estima unidades em estoque para uma cidade
 */
function estimateStockUnits(city: string): number {
  const cityKey = `${city}-`;
  const fallback = Object.entries(FALLBACK_CITY_DATA).find(([k]) => k.startsWith(cityKey));
  return fallback?.[1]?.stockUnits || 5000;
}

// =====================================================
// CÁLCULOS DE VIABILIDADE
// =====================================================

export interface ProjectViabilityInput {
  totalUnits: number;
  unitDistribution: Array<{
    tipo: string;
    quantidade: number;
    areaM2: number;
    precoM2: number;
  }>;
  landCost: number;
  constructionCostPerM2: number;
  additionalCosts: number;
  contingencyPercent: number;
  salesVelocityPercent: number;
  constructionMonths: number;
  discountRate: number;
  financingRate: number;
  permutaPercent?: number;
}

/**
 * Calcula VGV total a partir da distribuição de unidades
 * Fórmula: Σ(quantidade × área_m2 × preço_m2)
 */
export function calculateTotalVGV(unitDistribution: ProjectViabilityInput['unitDistribution']): {
  total: number;
  byType: Array<{ tipo: string; vgv: number; unidades: number }>;
} {
  const byType = unitDistribution.map(u => ({
    tipo: u.tipo,
    vgv: u.quantidade * u.areaM2 * u.precoM2,
    unidades: u.quantidade,
  }));

  return {
    total: byType.reduce((sum, t) => sum + t.vgv, 0),
    byType,
  };
}

/**
 * Calcula unidades em permuta - SEMPRE arredonda para cima
 */
export function calculatePermutaUnits(totalUnits: number, permutaPercent: number): number {
  return Math.ceil((totalUnits * permutaPercent) / 100);
}

/**
 * Valida que a soma das projeções de venda = 100%
 */
export function validateSalesProjection(lancamento: number, obra: number, chaves: number): {
  valid: boolean;
  total: number;
  difference: number;
} {
  const total = lancamento + obra + chaves;
  return {
    valid: Math.abs(total - 100) < 0.01,
    total,
    difference: 100 - total,
  };
}

/**
 * Calcula métricas de viabilidade completas
 */
export function calculateViabilityMetrics(input: ProjectViabilityInput): ViabilityMetrics {
  const { total: vgv } = calculateTotalVGV(input.unitDistribution);
  
  // Custos
  const totalArea = input.unitDistribution.reduce((sum, u) => sum + u.quantidade * u.areaM2, 0);
  const constructionCost = totalArea * input.constructionCostPerM2;
  const contingency = (constructionCost + input.landCost) * (input.contingencyPercent / 100);
  const totalCost = input.landCost + constructionCost + input.additionalCosts + contingency;
  
  // Financiamento
  const salesMonths = Math.ceil(input.totalUnits / (input.totalUnits * (input.salesVelocityPercent / 100)));
  const financingCost = totalCost * (input.financingRate / 100) * ((input.constructionMonths + salesMonths) / 12);
  
  const totalInvestment = totalCost + financingCost;
  
  // Resultados
  const profit = vgv - totalInvestment;
  const margin = (profit / vgv) * 100;
  const roi = (profit / totalInvestment) * 100;
  
  // TIR simplificada
  const totalMonths = input.constructionMonths + salesMonths;
  const monthlyReturn = Math.pow(1 + (profit / totalInvestment), 1 / totalMonths) - 1;
  const tir = monthlyReturn * 12 * 100;
  
  // Payback
  const paybackMonths = Math.round(totalInvestment / (vgv / salesMonths));
  
  return {
    vgv,
    totalCost: totalInvestment,
    profit,
    margin: parseFloat(margin.toFixed(1)),
    roi: parseFloat(roi.toFixed(1)),
    tir: parseFloat(tir.toFixed(1)),
    paybackMonths,
  };
}

/**
 * Aplica multiplicadores de cenário
 */
export function applyScenarioMultipliers(
  metrics: ViabilityMetrics,
  scenario: keyof typeof SCENARIO_MULTIPLIERS
): ViabilityMetrics {
  const mult = SCENARIO_MULTIPLIERS[scenario];
  
  const adjustedVGV = metrics.vgv * mult.sales;
  const adjustedCost = metrics.totalCost * mult.costs;
  const adjustedProfit = adjustedVGV - adjustedCost;
  const adjustedMargin = (adjustedProfit / adjustedVGV) * 100;
  const adjustedROI = (adjustedProfit / adjustedCost) * 100;
  
  return {
    vgv: adjustedVGV,
    totalCost: adjustedCost,
    profit: adjustedProfit,
    margin: parseFloat(adjustedMargin.toFixed(1)),
    roi: parseFloat(adjustedROI.toFixed(1)),
    tir: metrics.tir * (mult.sales / mult.costs), // Aproximação
    paybackMonths: Math.round(metrics.paybackMonths * mult.time),
  };
}

/**
 * Retorna cor do threshold baseado no valor
 */
export function getThresholdColor(
  metric: 'ROI' | 'TIR' | 'MARGIN' | 'PAYBACK',
  value: number
): 'success' | 'warning' | 'destructive' {
  if (metric === 'PAYBACK') {
    const threshold = VIABILITY_THRESHOLDS.PAYBACK;
    if (value <= threshold.excellent) return 'success';
    if (value <= threshold.recommended) return 'warning';
    return 'destructive';
  }
  
  const threshold = VIABILITY_THRESHOLDS[metric];
  if (value >= threshold.excellent) return 'success';
  if (value >= threshold.recommended) return 'warning';
  if (value >= threshold.min) return 'warning';
  return 'destructive';
}

// =====================================================
// STATUS DO SISTEMA
// =====================================================

export interface SystemStatus {
  bcbLastSync: string | null;
  ibgeLastSync: string | null;
  fipezapLastSync: string | null;
  offlineMode: boolean;
  cacheSize: number;
  errors: string[];
}

let systemStatus: SystemStatus = {
  bcbLastSync: null,
  ibgeLastSync: null,
  fipezapLastSync: null,
  offlineMode: false,
  cacheSize: 0,
  errors: [],
};

export function getSystemStatus(): SystemStatus {
  return {
    ...systemStatus,
    cacheSize: dataCache.size,
  };
}

export function updateSystemStatus(updates: Partial<SystemStatus>): void {
  systemStatus = { ...systemStatus, ...updates };
}

export function clearCache(): void {
  dataCache.clear();
}

// =====================================================
// FORMATAÇÃO
// =====================================================

export function formatCurrencyBR(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentBR(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumberBR(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatAreaBR(value: number): string {
  return `${formatNumberBR(value)} m²`;
}
