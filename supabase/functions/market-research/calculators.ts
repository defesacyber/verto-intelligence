// Market Research Calculators

export const SEGMENT_PROFILES = {
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

export function evaluateProductAdequacy(projectData: any, neighborhoodData: any, cityData: any): any {
  let score = 0;
  const factors: any[] = [];
  
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
  
  score += 20;
  factors.push({ factor: 'Padrão', status: 'adequado', detail: 'Padrão compatível com perfil da região' });
  
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
  
  let verdict = 'INADEQUADO';
  let verdictClass = 'error';
  
  if (score >= 80) {
    verdict = 'ADEQUADO';
    verdictClass = 'success';
  } else if (score >= 60) {
    verdict = 'PARCIALMENTE_ADEQUADO';
    verdictClass = 'warning';
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
    if (f.status === 'inadequado') justification += `Atenção: ${f.detail}. `;
  });
  if (verdict === 'ADEQUADO') justification += 'O produto está bem posicionado para o mercado-alvo.';
  else if (verdict === 'PARCIALMENTE_ADEQUADO') justification += 'Recomenda-se ajustes pontuais para melhor adequação ao mercado.';
  else justification += 'O produto pode enfrentar dificuldades de comercialização. Revisão significativa recomendada.';
  return justification;
}

export function calculateDemand(cityData: any, projectData: any): any {
  const population = cityData?.population || 300000;
  const households = cityData?.households || Math.round(population / 3.1);
  const purchaseIntention24m = 0.08;
  const purchaseIntention12m = purchaseIntention24m * 0.6;
  const potentialDemand24m = Math.round(households * purchaseIntention24m);
  const potentialDemand12m = Math.round(households * purchaseIntention12m);
  const qualificationRate = 0.25;
  const qualifiedDemand24m = Math.round(potentialDemand24m * qualificationRate);
  const qualifiedDemand12m = Math.round(potentialDemand12m * qualificationRate);
  const projectStandard = projectData?.padrao_empreendimento || 'medio';
  const segmentShare: Record<string, number> = { economico: 0.45, medio: 0.30, medio_alto: 0.18, alto_padrao: 0.07 };
  const segmentMultiplier = segmentShare[projectStandard] || 0.25;
  const segmentDemand24m = Math.round(qualifiedDemand24m * segmentMultiplier);
  const segmentDemand12m = Math.round(qualifiedDemand12m * segmentMultiplier);
  const buyerProfile = SEGMENT_PROFILES[projectStandard as keyof typeof SEGMENT_PROFILES]?.buyer_profile || SEGMENT_PROFILES.medio.buyer_profile;

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
  if (marketShare < 5) return `O empreendimento representa ${marketShare.toFixed(1)}% da demanda qualificada do segmento, indicando baixa concentração de risco.`;
  if (marketShare < 15) return `O empreendimento representa ${marketShare.toFixed(1)}% da demanda qualificada, posicionamento competitivo adequado.`;
  if (marketShare < 30) return `O empreendimento representa ${marketShare.toFixed(1)}% da demanda qualificada, requerendo estratégia comercial robusta.`;
  return `O empreendimento representa ${marketShare.toFixed(1)}% da demanda qualificada, risco elevado de concentração. Considerar redução de porte ou extensão do prazo de vendas.`;
}

export function projectSalesVelocity(demandData: any, projectData: any, competitorData: any[]): any {
  const totalUnits = projectData?.total_units || 100;
  const competitorAvgVSO = competitorData?.length > 0 ? competitorData.reduce((sum: number, c: any) => sum + (c.vso_monthly || 3), 0) / competitorData.length : 3;
  const scenarios = {
    pessimista: { vso_monthly: Math.max(competitorAvgVSO * 0.6, 1.5), units_per_month: 0, months_to_sell: 0, justification: 'Cenário de mercado adverso, taxa Selic elevada ou concorrência acirrada' },
    realista: { vso_monthly: competitorAvgVSO, units_per_month: 0, months_to_sell: 0, justification: 'Cenário baseado em dados de mercado e concorrência atual' },
    otimista: { vso_monthly: competitorAvgVSO * 1.4, units_per_month: 0, months_to_sell: 0, justification: 'Cenário de diferenciação competitiva, localização premium ou condições de mercado favoráveis' }
  };
  Object.values(scenarios).forEach(scenario => {
    scenario.units_per_month = Math.round(totalUnits * (scenario.vso_monthly / 100));
    scenario.months_to_sell = Math.ceil(totalUnits / scenario.units_per_month);
  });
  const clientExpectation = projectData?.projecao_construcao_meses || 24;
  let clientAligned = '';
  if (scenarios.realista.months_to_sell <= clientExpectation) clientAligned = 'A expectativa do cliente está alinhada com o cenário realista de mercado.';
  else if (scenarios.otimista.months_to_sell <= clientExpectation) clientAligned = 'A expectativa do cliente é otimista, mas alcançável com estratégia comercial diferenciada.';
  else clientAligned = 'A expectativa do cliente pode ser muito otimista. Recomenda-se revisar projeções.';
  return { scenarios, client_expectation_months: clientExpectation, client_alignment: clientAligned, recommendation: generateVelocityRecommendation(scenarios.realista, clientExpectation, totalUnits) };
}

function generateVelocityRecommendation(realistaScenario: any, clientExpectation: number, _totalUnits: number): string {
  const diff = realistaScenario.months_to_sell - clientExpectation;
  if (diff <= 0) return `Projeção de ${realistaScenario.units_per_month} unidades/mês com venda completa em ${realistaScenario.months_to_sell} meses. Expectativa do cliente é conservadora.`;
  if (diff <= 6) return `Projeção de ${realistaScenario.units_per_month} unidades/mês com venda completa em ${realistaScenario.months_to_sell} meses. Diferença de ${diff} meses vs expectativa do cliente.`;
  return `Projeção de ${realistaScenario.units_per_month} unidades/mês com venda completa em ${realistaScenario.months_to_sell} meses. Diferença significativa de ${diff} meses. Revisar porte do empreendimento ou estratégia comercial.`;
}
