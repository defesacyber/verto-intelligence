import type { ViabilityMetrics, CashFlow, Scenario } from './viability-types';

/**
 * Calcula o Valor Presente Líquido (VPL)
 * @param cashFlows Array de fluxos de caixa
 * @param discountRate Taxa de desconto anual (ex: 0.15 para 15%)
 */
export function calculateNPV(cashFlows: number[], discountRate: number): number {
  const monthlyRate = Math.pow(1 + discountRate, 1/12) - 1;
  return cashFlows.reduce((npv, cf, month) => {
    return npv + cf / Math.pow(1 + monthlyRate, month);
  }, 0);
}

/**
 * Calcula a Taxa Interna de Retorno (TIR) usando método de Newton-Raphson
 * @param cashFlows Array de fluxos de caixa (primeiro valor negativo = investimento)
 */
export function calculateIRR(cashFlows: number[], maxIterations = 100): number {
  let rate = 0.1; // Estimativa inicial de 10%
  const precision = 0.0001;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;
    
    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + rate, j);
      derivative -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
    }
    
    const newRate = rate - npv / derivative;
    
    if (Math.abs(newRate - rate) < precision) {
      return newRate * 12 * 100; // Converter para anual e percentual
    }
    
    rate = newRate;
  }
  
  return rate * 12 * 100;
}

/**
 * Calcula o Payback em meses
 * @param cashFlows Array de fluxos de caixa cumulativos
 */
export function calculatePayback(cashFlows: CashFlow[]): number {
  for (let i = 0; i < cashFlows.length; i++) {
    if (cashFlows[i].cumulative >= 0) {
      if (i === 0) return 0;
      // Interpolação linear
      const prev = cashFlows[i - 1].cumulative;
      const curr = cashFlows[i].cumulative;
      return i - 1 + Math.abs(prev) / (curr - prev);
    }
  }
  return cashFlows.length;
}

/**
 * Gera projeção de fluxo de caixa
 */
export function generateCashFlow(
  totalUnits: number,
  unitPrice: number,
  salesVelocity: number,
  totalInvestment: number,
  constructionMonths: number,
  monthlyInterestRate: number
): CashFlow[] {
  const cashFlows: CashFlow[] = [];
  let cumulative = -totalInvestment;
  const monthlyInvestment = totalInvestment / constructionMonths;
  const totalMonths = Math.ceil(totalUnits / salesVelocity) + constructionMonths;
  let unitsSold = 0;
  
  for (let month = 0; month <= totalMonths; month++) {
    let revenue = 0;
    let costs = 0;
    
    // Custos durante construção
    if (month <= constructionMonths) {
      costs = monthlyInvestment + (cumulative < 0 ? Math.abs(cumulative) * monthlyInterestRate : 0);
    }
    
    // Receitas de vendas (começam após lançamento)
    if (month >= 3 && unitsSold < totalUnits) {
      const unitsThisMonth = Math.min(salesVelocity, totalUnits - unitsSold);
      revenue = unitsThisMonth * unitPrice;
      unitsSold += unitsThisMonth;
    }
    
    const net = revenue - costs;
    cumulative += net;
    
    cashFlows.push({
      month,
      revenue,
      costs,
      net,
      cumulative
    });
  }
  
  return cashFlows;
}

/**
 * Calcula métricas de viabilidade completas
 */
export function calculateViabilityMetrics(
  totalUnits: number,
  avgUnitPrice: number,
  landCost: number,
  constructionCostPerM2: number,
  avgUnitArea: number,
  additionalCosts: number,
  contingencyPercent: number,
  salesVelocity: number,
  constructionMonths: number,
  discountRate: number,
  financingRate: number
): ViabilityMetrics {
  // Cálculo de custos
  const constructionCost = totalUnits * avgUnitArea * constructionCostPerM2;
  const baseCost = landCost + constructionCost + additionalCosts;
  const contingency = baseCost * (contingencyPercent / 100);
  const totalInvestment = baseCost + contingency;
  
  // Receita bruta
  const grossRevenue = totalUnits * avgUnitPrice;
  
  // Gerar fluxo de caixa
  const cashFlows = generateCashFlow(
    totalUnits,
    avgUnitPrice,
    salesVelocity,
    totalInvestment,
    constructionMonths,
    financingRate / 100 / 12
  );
  
  // Extrair valores líquidos para cálculo
  const netFlows = cashFlows.map(cf => cf.net);
  
  // Calcular métricas
  const vpl = calculateNPV(netFlows, discountRate / 100);
  const tir = calculateIRR(netFlows);
  const paybackMonths = calculatePayback(cashFlows);
  const netProfit = grossRevenue - totalInvestment;
  const profitMargin = (netProfit / grossRevenue) * 100;
  const roi = (netProfit / totalInvestment) * 100;
  
  return {
    vpl,
    tir: Math.min(Math.max(tir, 0), 100), // Limitar TIR entre 0-100%
    paybackMonths: Math.round(paybackMonths),
    profitMargin,
    totalInvestment,
    grossRevenue,
    netProfit,
    roi
  };
}

/**
 * Gera cenários otimista, realista e pessimista
 */
export function generateScenarios(
  baseMetrics: ViabilityMetrics,
  _totalUnits: number,
  _avgUnitPrice: number
): { pessimista: Scenario; realista: Scenario; otimista: Scenario } {
  // Fatores de ajuste para cada cenário
  const factors = {
    pessimista: { demand: 0.7, price: 0.9, cost: 1.15 },
    realista: { demand: 1.0, price: 1.0, cost: 1.0 },
    otimista: { demand: 1.3, price: 1.1, cost: 0.95 }
  };
  
  const createScenario = (factor: typeof factors.pessimista): Scenario => {
    const adjustedRevenue = baseMetrics.grossRevenue * factor.price;
    const adjustedCost = baseMetrics.totalInvestment * factor.cost;
    const adjustedProfit = adjustedRevenue - adjustedCost;
    const adjustedMargin = (adjustedProfit / adjustedRevenue) * 100;
    const adjustedVpl = baseMetrics.vpl * factor.demand * (factor.price / factor.cost);
    const adjustedTir = baseMetrics.tir * factor.demand * 0.9;
    const adjustedPayback = Math.round(baseMetrics.paybackMonths / factor.demand);
    
    return {
      vpl: adjustedVpl,
      tir: Math.min(Math.max(adjustedTir, 0), 100),
      payback_months: adjustedPayback,
      profit_margin: adjustedMargin,
      gross_revenue: adjustedRevenue,
      net_profit: adjustedProfit,
      demand_factor: factor.demand
    };
  };
  
  return {
    pessimista: createScenario(factors.pessimista),
    realista: createScenario(factors.realista),
    otimista: createScenario(factors.otimista)
  };
}

/**
 * Calcula score de risco (0.0 = baixo, 1.0 = alto)
 */
export function calculateRiskScore(
  metrics: ViabilityMetrics,
  _marketDemand: number,
  supplyDemandRatio: number,
  competitorsCount: number
): { score: number; level: 'baixo' | 'medio' | 'alto'; factors: string[] } {
  const factors: string[] = [];
  let riskScore = 0;
  
  // Análise de TIR
  if (metrics.tir < 10) {
    riskScore += 0.3;
    factors.push('TIR abaixo de 10% - retorno baixo');
  } else if (metrics.tir < 15) {
    riskScore += 0.1;
    factors.push('TIR moderada entre 10-15%');
  }
  
  // Análise de VPL
  if (metrics.vpl < 0) {
    riskScore += 0.4;
    factors.push('VPL negativo - projeto inviável');
  } else if (metrics.vpl < 1000000) {
    riskScore += 0.15;
    factors.push('VPL baixo - margem de segurança reduzida');
  }
  
  // Análise de Payback
  if (metrics.paybackMonths > 60) {
    riskScore += 0.2;
    factors.push('Payback acima de 5 anos');
  } else if (metrics.paybackMonths > 36) {
    riskScore += 0.1;
    factors.push('Payback entre 3-5 anos');
  }
  
  // Análise de oferta/demanda
  if (supplyDemandRatio > 1.5) {
    riskScore += 0.2;
    factors.push('Sobre-oferta na região');
  } else if (supplyDemandRatio > 1.2) {
    riskScore += 0.1;
    factors.push('Oferta elevada na região');
  }
  
  // Análise de concorrência
  if (competitorsCount > 10) {
    riskScore += 0.15;
    factors.push('Alta concorrência na região');
  } else if (competitorsCount > 5) {
    riskScore += 0.05;
    factors.push('Concorrência moderada');
  }
  
  // Normalizar score entre 0 e 1
  riskScore = Math.min(Math.max(riskScore, 0), 1);
  
  // Determinar nível
  let level: 'baixo' | 'medio' | 'alto';
  if (riskScore < 0.3) {
    level = 'baixo';
  } else if (riskScore < 0.6) {
    level = 'medio';
  } else {
    level = 'alto';
  }
  
  return { score: riskScore, level, factors };
}

/**
 * Gera recomendações baseadas na análise
 */
export function generateRecommendations(
  metrics: ViabilityMetrics,
  riskLevel: 'baixo' | 'medio' | 'alto',
  hasCertifications: boolean
): string[] {
  const recommendations: string[] = [];
  
  // Recomendações baseadas em TIR
  if (metrics.tir > 20) {
    recommendations.push('Excelente TIR - considere acelerar o lançamento');
  } else if (metrics.tir < 12) {
    recommendations.push('Revisar precificação para melhorar TIR');
  }
  
  // Recomendações baseadas em risco
  if (riskLevel === 'alto') {
    recommendations.push('Lançar em fases para reduzir exposição de risco');
    recommendations.push('Investir mais em pré-venda antes de iniciar obra');
  } else if (riskLevel === 'medio') {
    recommendations.push('Monitorar indicadores de mercado mensalmente');
  }
  
  // Recomendações de ESG
  if (!hasCertifications) {
    recommendations.push('Buscar certificação ESG para valorização adicional de 5-10%');
  }
  
  // Recomendações gerais
  if (metrics.paybackMonths > 36) {
    recommendations.push('Considerar parcerias para reduzir capital imobilizado');
  }
  
  if (metrics.profitMargin < 20) {
    recommendations.push('Otimizar custos construtivos para melhorar margem');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Projeto bem estruturado - prosseguir com lançamento');
  }
  
  return recommendations.slice(0, 5); // Máximo 5 recomendações
}

/**
 * Determina status de viabilidade
 */
export function determineViabilityStatus(
  metrics: ViabilityMetrics,
  riskLevel: 'baixo' | 'medio' | 'alto'
): 'viavel' | 'viavel_com_ressalvas' | 'inviavel' {
  if (metrics.vpl < 0 || metrics.tir < 5 || riskLevel === 'alto') {
    return 'inviavel';
  }
  
  if (metrics.tir < 12 || riskLevel === 'medio' || metrics.paybackMonths > 48) {
    return 'viavel_com_ressalvas';
  }
  
  return 'viavel';
}
