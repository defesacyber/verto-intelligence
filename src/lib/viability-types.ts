// Tipos para o módulo de análise de viabilidade econômica

export interface UnitDistribution {
  studio?: number;
  '1q'?: number;
  '2q'?: number;
  '3q'?: number;
  '4q'?: number;
  [key: string]: number | undefined;
}

export interface ProjectInput {
  id?: string;
  project_id: string;
  unit_distribution: UnitDistribution;
  land_acquisition_type: 'compra' | 'permuta' | 'usufruto' | null;
  land_cost: number;
  permuta_units: number;
  usufruto_years: number;
  approval_costs: number;
  infrastructure_costs: number;
  project_costs: number;
  contingency_percent: number;
  sales_velocity: number;
  launch_date: string | null;
  construction_months: number;
  financing_rate: number;
  discount_rate: number;
  certifications: string[];
  sustainability_initiatives: string[];
}

export interface Scenario {
  vpl: number;
  tir: number;
  payback_months: number;
  profit_margin: number;
  gross_revenue: number;
  net_profit: number;
  demand_factor: number;
  [key: string]: number;
}

export interface AnalysisResult {
  id?: string;
  project_id: string;
  analysis_type: 'viability' | 'market' | 'financial';
  vpl: number;
  tir: number;
  payback_months: number;
  profit_margin: number;
  total_investment: number;
  gross_revenue: number;
  net_profit: number;
  scenarios: {
    pessimista: Scenario;
    realista: Scenario;
    otimista: Scenario;
  };
  market_demand: number;
  supply_demand_ratio: number;
  competitors_count: number;
  avg_price_m2: number;
  risk_score: number;
  risk_level: 'baixo' | 'medio' | 'alto';
  risk_factors: string[];
  recommendations: string[];
  viability_status: 'viavel' | 'viavel_com_ressalvas' | 'inviavel';
  generated_at?: string;
}

export interface MarketData {
  id?: string;
  city: string;
  uf: string;
  neighborhood: string | null;
  avg_price_m2: number;
  price_variation_12m: number;
  supply_units: number;
  demand_index: number;
  absorption_rate: number;
  selic_rate: number;
  ipca_12m: number;
  pib_growth: number;
}

export interface ViabilityMetrics {
  vpl: number;
  tir: number;
  paybackMonths: number;
  profitMargin: number;
  totalInvestment: number;
  grossRevenue: number;
  netProfit: number;
  roi: number;
}

export interface CashFlow {
  month: number;
  revenue: number;
  costs: number;
  net: number;
  cumulative: number;
}

// Constantes para cálculos
export const CERTIFICATIONS = [
  { id: 'leed_platinum', label: 'LEED Platinum', valorization: 10 },
  { id: 'leed_gold', label: 'LEED Gold', valorization: 7 },
  { id: 'leed_silver', label: 'LEED Silver', valorization: 5 },
  { id: 'aqua', label: 'AQUA', valorization: 6 },
  { id: 'breeam', label: 'BREEAM', valorization: 5 },
  { id: 'selo_casa_azul', label: 'Selo Casa Azul', valorization: 4 },
];

export const SUSTAINABILITY_INITIATIVES = [
  { id: 'energia_solar', label: 'Energia Solar', valorization: 5 },
  { id: 'reuso_agua', label: 'Reuso de Água', valorization: 3 },
  { id: 'materiais_reciclados', label: 'Materiais Reciclados', valorization: 2 },
  { id: 'isolamento_termico', label: 'Isolamento Térmico', valorization: 3 },
  { id: 'mobilidade_verde', label: 'Mobilidade Verde', valorization: 2 },
];

export const PROPERTY_TYPES = [
  { id: 'vertical', label: 'Condomínio Residencial (Edifício)' },
  { id: 'horizontal', label: 'Casas em Condomínio' },
  { id: 'loteamento_aberto', label: 'Loteamento Aberto' },
  { id: 'loteamento_fechado', label: 'Loteamento Fechado' },
  { id: 'misto', label: 'Misto (Residencial + Comercial)' },
  { id: 'comercial', label: 'Comercial / Logístico' },
];

export const CONSTRUCTION_STANDARDS = [
  { id: 'economico', label: 'Econômico', costPerM2: 2500 },
  { id: 'popular', label: 'Popular', costPerM2: 3000 },
  { id: 'medio', label: 'Médio', costPerM2: 4000 },
  { id: 'alto_padrao', label: 'Alto Padrão', costPerM2: 6000 },
  { id: 'luxo', label: 'Luxo', costPerM2: 10000 },
];

export const TARGET_AUDIENCES = [
  { id: 'baixa_renda', label: 'Baixa Renda (até 3 SM)' },
  { id: 'classe_media_baixa', label: 'Classe Média Baixa (3-10 SM)' },
  { id: 'classe_media', label: 'Classe Média (10-30 SM)' },
  { id: 'classe_alta', label: 'Classe Alta (30+ SM)' },
  { id: 'investidores', label: 'Investidores Internacionais' },
];
