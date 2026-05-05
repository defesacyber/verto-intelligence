import { MacroIndicators, CityMarketData } from './types';

export const FALLBACK_MACRO: MacroIndicators = {
  selic: 14.25,
  selicChange: null,
  ipca12m: 4.83,
  ipcaChange: null,
  dollar: 5.40,
  dollarChange: null,
  financingAvg: 11.49,
  financingCaixa: 11.25,
  lastUpdated: new Date().toISOString(),
  source: 'fallback',
};

export const FALLBACK_CITY_DATA: Record<string, Omit<CityMarketData, 'city' | 'uf' | 'source' | 'lastUpdated'>> = {
  'Brasil (Nacional)': { priceM2: 8500, variation12m: 5.5, variationMonth: 0.45, demandIndex: 65, stockUnits: 150000, absorptionMonths: 14, marketHeat: 'balanced' },
  'São Paulo-SP': { priceM2: 12500, variation12m: 5.2, variationMonth: 0.43, demandIndex: 78, stockUnits: 45000, absorptionMonths: 10, marketHeat: 'hot' },
  'Rio de Janeiro-RJ': { priceM2: 10800, variation12m: 4.8, variationMonth: 0.40, demandIndex: 68, stockUnits: 32000, absorptionMonths: 13, marketHeat: 'balanced' },
  'Belo Horizonte-MG': { priceM2: 8200, variation12m: 4.0, variationMonth: 0.33, demandIndex: 66, stockUnits: 18000, absorptionMonths: 14, marketHeat: 'balanced' },
  'Curitiba-PR': { priceM2: 9800, variation12m: 5.5, variationMonth: 0.46, demandIndex: 75, stockUnits: 15000, absorptionMonths: 9, marketHeat: 'hot' },
  'Goiânia-GO': { priceM2: 6500, variation12m: 5.8, variationMonth: 0.48, demandIndex: 76, stockUnits: 12000, absorptionMonths: 8, marketHeat: 'hot' },
};

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
