/**
 * Verto Intelligence FINANCIAL ENGINE
 * Centralized logic for all real estate financial calculations.
 */

export interface CashFlow {
  month: number;
  revenue: number;
  costs: number;
  net: number;
  cumulative: number;
}

/**
 * Basic ROI Calculation
 */
export const calculateROI = (profit: number, investment: number): number => {
  if (investment <= 0) return 0;
  return (profit / investment) * 100;
};

/**
 * Basic Margin Calculation
 */
export const calculateMargin = (profit: number, revenue: number): number => {
  if (revenue <= 0) return 0;
  return (profit / revenue) * 100;
};

/**
 * Net Present Value (NPV / VPL)
 */
export function calculateNPV(cashFlows: number[], discountRate: number): number {
  const monthlyRate = Math.pow(1 + discountRate, 1/12) - 1;
  return cashFlows.reduce((npv, cf, month) => {
    return npv + cf / Math.pow(1 + monthlyRate, month);
  }, 0);
}

/**
 * Internal Rate of Return (IRR / TIR) using Newton-Raphson
 */
export function calculateIRR(cashFlows: number[], maxIterations = 100): number {
  if (cashFlows.length === 0) return 0;
  
  let rate = 0.1; // Initial guess 10%
  const precision = 0.0001;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;
    
    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + rate, j);
      derivative -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
    }
    
    if (Math.abs(derivative) < 0.0000001) break;
    
    const newRate = rate - npv / derivative;
    
    if (Math.abs(newRate - rate) < precision) {
      return newRate * 12 * 100; // Annualized percentage
    }
    
    rate = newRate;
  }
  
  return Math.min(Math.max(rate * 12 * 100, 0), 100);
}

/**
 * Payback Calculation with linear interpolation
 */
export function calculatePayback(cashFlows: CashFlow[]): number {
  for (let i = 0; i < cashFlows.length; i++) {
    if (cashFlows[i].cumulative >= 0) {
      if (i === 0) return 0;
      const prev = cashFlows[i - 1].cumulative;
      const curr = cashFlows[i].cumulative;
      if (curr === prev) return i;
      return i - 1 + Math.abs(prev) / (curr - prev);
    }
  }
  return cashFlows.length;
}

/**
 * Calculate estimated time to sell all units based on absorption rate.
 */
export function calculateAbsorptionMonths(absorptionRate: number): number {
  if (absorptionRate <= 0) return 0;
  return Math.round(100 / absorptionRate);
}

/**
 * Cash Flow Generator
 */
export function generateCashFlow(
  totalUnits: number,
  avgUnitPrice: number,
  salesVelocityUnits: number,
  totalInvestment: number,
  constructionMonths: number,
  annualFinancingRate: number
): CashFlow[] {
  const cashFlows: CashFlow[] = [];
  let cumulative = -totalInvestment;
  const monthlyInvestment = totalInvestment / constructionMonths;
  const monthlyInterestRate = annualFinancingRate / 100 / 12;
  
  // Total months = construction + sales period
  const salesMonths = Math.ceil(totalUnits / salesVelocityUnits);
  const totalMonths = salesMonths + constructionMonths;
  let unitsSold = 0;
  
  for (let month = 0; month <= totalMonths; month++) {
    let revenue = 0;
    let costs = 0;
    
    // Costs during construction
    if (month <= constructionMonths) {
      costs = monthlyInvestment + (cumulative < 0 ? Math.abs(cumulative) * monthlyInterestRate : 0);
    }
    
    // Revenue from sales (starting month 3)
    if (month >= 3 && unitsSold < totalUnits) {
      const unitsThisMonth = Math.min(salesVelocityUnits, totalUnits - unitsSold);
      revenue = unitsThisMonth * avgUnitPrice;
      unitsSold += unitsThisMonth;
    }
    
    const net = revenue - costs;
    cumulative += net;
    
    cashFlows.push({ month, revenue, costs, net, cumulative });
  }
  
  return cashFlows;
}
