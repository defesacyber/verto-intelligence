import { VIABILITY_THRESHOLDS } from './constants';

export interface ProjectInput {
  landArea: number;
  landCost: number;
  constructionCostPerM2: number;
  totalUnits: number;
  averageUnitArea: number;
  averageSalePrice: number;
  constructionMonths: number;
  salesMonths: number;
  financingRate: number;
  otherCosts: number;
}

export interface ScenarioResult {
  vgv: number;
  totalCost: number;
  profit: number;
  margin: number;
  roi: number;
  tir: number;
  paybackMonths: number;
}

export interface ViabilityResult {
  pessimistic: ScenarioResult;
  projected: ScenarioResult;
  optimistic: ScenarioResult;
  recommendation: 'approved' | 'conditional' | 'rejected';
  score: number;
  highlights: string[];
  risks: string[];
}

const SCENARIO_FACTORS = {
  pessimistic: { sales: 0.85, costs: 1.15, time: 1.3 },
  projected: { sales: 1.0, costs: 1.0, time: 1.0 },
  optimistic: { sales: 1.12, costs: 0.92, time: 0.8 },
};

export function calculateScenario(
  input: ProjectInput,
  scenario: keyof typeof SCENARIO_FACTORS
): ScenarioResult {
  const factor = SCENARIO_FACTORS[scenario];
  
  // VGV - Valor Geral de Vendas
  const vgv = input.totalUnits * input.averageSalePrice * factor.sales;
  
  // Construction Area
  const totalConstructionArea = input.totalUnits * input.averageUnitArea;
  
  // Total Costs
  const constructionCost = totalConstructionArea * input.constructionCostPerM2 * factor.costs;
  const landCost = input.landCost;
  const financingCost = (constructionCost + landCost) * (input.financingRate / 100) * 
    ((input.constructionMonths + input.salesMonths) * factor.time / 12);
  const otherCosts = input.otherCosts * factor.costs;
  
  const totalCost = constructionCost + landCost + financingCost + otherCosts;
  
  // Profit and Margins
  const profit = vgv - totalCost;
  const margin = (profit / vgv) * 100;
  const roi = (profit / totalCost) * 100;
  
  // TIR - Simplified approximation
  const totalMonths = (input.constructionMonths + input.salesMonths) * factor.time;
  const monthlyReturn = Math.pow(1 + (profit / totalCost), 1 / totalMonths) - 1;
  const tir = monthlyReturn * 12 * 100;
  
  // Payback
  const paybackMonths = totalCost / (vgv / input.salesMonths);
  
  return {
    vgv,
    totalCost,
    profit,
    margin,
    roi,
    tir,
    paybackMonths: Math.round(paybackMonths * factor.time),
  };
}

export function calculateViability(input: ProjectInput): ViabilityResult {
  const pessimistic = calculateScenario(input, 'pessimistic');
  const projected = calculateScenario(input, 'projected');
  const optimistic = calculateScenario(input, 'optimistic');
  
  // Calculate score (0-100)
  let score = 0;
  const highlights: string[] = [];
  const risks: string[] = [];
  
  // ROI Score (max 30 points)
  if (projected.roi >= VIABILITY_THRESHOLDS.ROI.excellent) {
    score += 30;
    highlights.push(`ROI excelente de ${projected.roi.toFixed(1)}%`);
  } else if (projected.roi >= VIABILITY_THRESHOLDS.ROI.recommended) {
    score += 25;
    highlights.push(`ROI sólido de ${projected.roi.toFixed(1)}%`);
  } else if (projected.roi >= VIABILITY_THRESHOLDS.ROI.min) {
    score += 15;
  } else {
    risks.push(`ROI baixo de ${projected.roi.toFixed(1)}% (mínimo: ${VIABILITY_THRESHOLDS.ROI.min}%)`);
  }
  
  // TIR Score (max 25 points)
  if (projected.tir >= VIABILITY_THRESHOLDS.TIR.excellent) {
    score += 25;
    highlights.push(`TIR excelente de ${projected.tir.toFixed(1)}% a.a.`);
  } else if (projected.tir >= VIABILITY_THRESHOLDS.TIR.recommended) {
    score += 20;
  } else if (projected.tir >= VIABILITY_THRESHOLDS.TIR.min) {
    score += 10;
  } else {
    risks.push(`TIR abaixo do recomendado: ${projected.tir.toFixed(1)}%`);
  }
  
  // Margin Score (max 25 points)
  if (projected.margin >= VIABILITY_THRESHOLDS.MARGIN.excellent) {
    score += 25;
    highlights.push(`Margem excelente de ${projected.margin.toFixed(1)}%`);
  } else if (projected.margin >= VIABILITY_THRESHOLDS.MARGIN.recommended) {
    score += 20;
  } else if (projected.margin >= VIABILITY_THRESHOLDS.MARGIN.min) {
    score += 10;
  } else {
    risks.push(`Margem baixa de ${projected.margin.toFixed(1)}%`);
  }
  
  // Payback Score (max 20 points)
  if (projected.paybackMonths <= VIABILITY_THRESHOLDS.PAYBACK.excellent) {
    score += 20;
    highlights.push(`Payback rápido de ${projected.paybackMonths} meses`);
  } else if (projected.paybackMonths <= VIABILITY_THRESHOLDS.PAYBACK.recommended) {
    score += 15;
  } else if (projected.paybackMonths <= VIABILITY_THRESHOLDS.PAYBACK.max) {
    score += 5;
    risks.push(`Payback longo de ${projected.paybackMonths} meses`);
  } else {
    risks.push(`Payback muito longo: ${projected.paybackMonths} meses`);
  }
  
  // Pessimistic scenario risk check
  if (pessimistic.profit < 0) {
    score -= 20;
    risks.push('Cenário pessimista resulta em prejuízo');
  }
  
  // Determine recommendation
  let recommendation: 'approved' | 'conditional' | 'rejected';
  if (score >= 70 && pessimistic.profit > 0) {
    recommendation = 'approved';
  } else if (score >= 45) {
    recommendation = 'conditional';
  } else {
    recommendation = 'rejected';
  }
  
  return {
    pessimistic,
    projected,
    optimistic,
    recommendation,
    score: Math.max(0, Math.min(100, score)),
    highlights,
    risks,
  };
}

export function getRecommendationColor(recommendation: string): string {
  switch (recommendation) {
    case 'approved':
      return 'success';
    case 'conditional':
      return 'warning';
    case 'rejected':
      return 'destructive';
    default:
      return 'muted';
  }
}

export function getRecommendationLabel(recommendation: string): string {
  switch (recommendation) {
    case 'approved':
      return 'Aprovado';
    case 'conditional':
      return 'Condicional';
    case 'rejected':
      return 'Reprovado';
    default:
      return 'Pendente';
  }
}
