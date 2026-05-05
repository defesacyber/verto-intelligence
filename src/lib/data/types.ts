/**
 * Verto Intelligence DATA TYPES
 */

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

export interface IndicatorFormula {
  id: string;
  name: string;
  formula: string;
  source: string;
  sourceUrl: string | null;
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
