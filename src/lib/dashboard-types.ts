// Modelo canônico de métricas do dashboard conforme spec

export interface MetricValue {
  raw: string; // ex: "R$ 8.920/m²", "68 pontos"
  num: number; // valor normalizado
}

export interface MetricDelta {
  raw: string | null; // ex: "+4.80%", "+2.5 pts"
  num: number | null;
  type: 'pct' | 'pp' | 'abs' | null;
}

export interface MetricPeriod {
  kind: 'macro' | 'weekly' | 'monthly' | 'quarterly' | 'project';
  ref: string | null; // ex: "2025-W52", "2025-12", "2025-Q4"
}

export interface MetricGeo {
  city: string;
}

export interface MetricCard {
  metric_id: string;
  label: string;
  description: string;
  source: string;
  value: MetricValue;
  unit: string; // ex: "%", "R$/m²", "pontos", "meses", "unidades", "R$"
  delta: MetricDelta;
  period: MetricPeriod;
  geo: MetricGeo;
  updated_at: string; // ISO string
  provenance_url: string | null;
}

// Insights interpretativos
export type InsightSeverity = 'info' | 'warning' | 'risk';

export interface InsightDriver {
  metric_id: string;
  value_raw: string;
  rule: string;
}

export interface MarketInsight {
  insight_id: string;
  title: string;
  severity: InsightSeverity;
  message: string;
  drivers: InsightDriver[];
}

// Dados de gráficos
export interface ChartSeries {
  name: string; // ex: "Baixo Padrão", "Médio Padrão", "Alto Padrão"
  values: number[];
}

export interface ChartData {
  chart_id: string;
  city: string;
  months: number;
  labels: string[]; // ex: ["Jan", "Fev", ...]
  series: ChartSeries[];
  unit: string;
  updated_at: string;
}

// Estoque x Demanda
export interface SegmentStock {
  segment: string;
  months_of_stock: number;
}

export interface StockDemandData {
  city: string;
  months: number;
  total_stock_units: number;
  monthly_total_demand_units: number;
  avg_months_of_stock: number;
  status: 'Mercado saturado' | 'Mercado equilibrado' | 'Mercado aquecido';
  by_segment: SegmentStock[];
  updated_at: string;
}

// Response completa do dashboard
export interface DashboardSummaryResponse {
  city: string;
  weekly_ref: string;
  monthly_ref: string;
  quarterly_ref: string;
  macro: MetricCard[];
  weekly: MetricCard[];
  monthly: MetricCard[];
  quarterly: MetricCard[];
  projects: MetricCard[];
  charts: {
    price_m2_trend: ChartData;
    demand_index_trend: ChartData;
    stock_available_trend: ChartData;
    investment_attractiveness_trend: ChartData;
  };
  stock_demand: StockDemandData;
  insights: MarketInsight[];
  updated_at: string;
}

// Helper types
export type MarketStatus = 'saturated' | 'balanced' | 'heated';

export function getMarketStatus(monthsOfStock: number): MarketStatus {
  if (monthsOfStock >= 12) return 'saturated';
  if (monthsOfStock >= 8) return 'balanced';
  return 'heated';
}

export function getMarketStatusLabel(status: MarketStatus): string {
  const labels: Record<MarketStatus, string> = {
    saturated: 'Mercado saturado',
    balanced: 'Mercado equilibrado',
    heated: 'Mercado aquecido',
  };
  return labels[status];
}

export function getDeltaColor(delta: MetricDelta, invertedLogic = false): 'positive' | 'negative' | 'neutral' {
  if (delta.num === null || delta.num === 0) return 'neutral';
  const isPositive = delta.num > 0;
  if (invertedLogic) {
    return isPositive ? 'negative' : 'positive';
  }
  return isPositive ? 'positive' : 'negative';
}
