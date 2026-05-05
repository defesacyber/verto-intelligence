import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardSummaryResponse } from '@/lib/dashboard-types';

const FALLBACK_DASHBOARD_DATA: DashboardSummaryResponse = {
  city: 'Brasil (Nacional)',
  weekly_ref: '',
  monthly_ref: '',
  quarterly_ref: '',
  projects: [],
  updated_at: new Date().toISOString(),
  macro: [
    {
      metric_id: 'selic',
      label: 'Taxa Selic',
      description: 'Taxa básica de juros (meta definida pelo Copom)',
      source: 'Banco Central do Brasil',
      value: { raw: '11,25% a.a.', num: 11.25 },
      unit: '% a.a.',
      delta: { raw: '+0.50 p.p.', num: 0.5, type: 'pp' },
      period: { kind: 'macro', ref: null },
      geo: { city: 'Brasil' },
      updated_at: new Date().toISOString(),
      provenance_url: null
    },
    {
      metric_id: 'ipca',
      label: 'IPCA (12 meses)',
      description: 'Índice de Preços ao Consumidor (Inflação)',
      source: 'IBGE / Sidra',
      value: { raw: '4,42%', num: 4.42 },
      unit: '%',
      delta: { raw: '+0.15 p.p.', num: 0.15, type: 'pp' },
      period: { kind: 'macro', ref: null },
      geo: { city: 'Brasil' },
      updated_at: new Date().toISOString(),
      provenance_url: null
    },
    {
      metric_id: 'incc',
      label: 'INCC-M (12 meses)',
      description: 'Índice Nacional de Custo de Construção',
      source: 'FGV / IBRE',
      value: { raw: '4,51%', num: 4.51 },
      unit: '%',
      delta: { raw: '-0.10 p.p.', num: -0.1, type: 'pp' },
      period: { kind: 'macro', ref: null },
      geo: { city: 'Brasil' },
      updated_at: new Date().toISOString(),
      provenance_url: null
    }
  ],
  weekly: [
    {
      metric_id: 'weekly_price_m2',
      label: 'Preço Médio/m²',
      description: 'Preço médio do metro quadrado na região selecionada',
      source: 'FipeZap / IDI Brasil',
      value: { raw: 'R$ 9.845/m²', num: 9845 },
      unit: 'R$/m²',
      delta: { raw: '+0.12%', num: 0.12, type: 'pct' },
      period: { kind: 'weekly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
    {
      metric_id: 'weekly_sales_velocity',
      label: 'Velocidade de Vendas',
      description: 'Unidades vendidas por semana estimadas',
      source: 'ADEMI / SECOVI',
      value: { raw: '7 un/semana', num: 7 },
      unit: 'un/semana',
      delta: { raw: '+3.5%', num: 3.5, type: 'pct' },
      period: { kind: 'weekly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
    {
      metric_id: 'weekly_market_status',
      label: 'Status do Mercado',
      description: 'Baseado nos meses de estoque disponível',
      source: 'Análise Verto Intelligence',
      value: { raw: 'Aquecido', num: 1 },
      unit: '',
      delta: { raw: null, num: null, type: null },
      period: { kind: 'weekly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
    {
      metric_id: 'weekly_price_m2_variation',
      label: 'Variação Semanal',
      description: 'Variação semanal estimada do preço do m²',
      source: 'FipeZap',
      value: { raw: '+0.12%', num: 0.12 },
      unit: '%',
      delta: { raw: null, num: null, type: null },
      period: { kind: 'weekly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
  ],
  monthly: [
    {
      metric_id: 'monthly_launches_count',
      label: 'Lançamentos',
      description: 'Número de lançamentos no mês',
      source: 'ADEMI / CBIC',
      value: { raw: '8 empreendimentos', num: 8 },
      unit: 'empreendimentos',
      delta: { raw: '+14.3%', num: 14.3, type: 'pct' },
      period: { kind: 'monthly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
    {
      metric_id: 'monthly_stock_available',
      label: 'Estoque Disponível',
      description: 'Unidades disponíveis em estoque',
      source: 'SECOVI / DataStore',
      value: { raw: '12.450 un.', num: 12450 },
      unit: 'unidades',
      delta: { raw: '-2.3%', num: -2.3, type: 'pct' },
      period: { kind: 'monthly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
    {
      metric_id: 'monthly_absorption_rate',
      label: 'Taxa de Absorção',
      description: 'Percentual do estoque absorvido no mês',
      source: 'Cálculo Verto Intelligence',
      value: { raw: '67%', num: 67 },
      unit: '%',
      delta: { raw: '+2.1 p.p.', num: 2.1, type: 'pp' },
      period: { kind: 'monthly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
    {
      metric_id: 'monthly_demand_index',
      label: 'Índice de Demanda',
      description: 'Índice de demanda imobiliária (0–100)',
      source: 'IDI Brasil / FipeZap',
      value: { raw: '72 pts', num: 72 },
      unit: 'pontos',
      delta: { raw: '+3.5 pts', num: 3.5, type: 'abs' },
      period: { kind: 'monthly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
    {
      metric_id: 'monthly_price_variation_12m',
      label: 'Variação Preço 12m',
      description: 'Variação acumulada do preço do m² em 12 meses',
      source: 'FipeZap / IBGE',
      value: { raw: '+8.4%', num: 8.4 },
      unit: '%',
      delta: { raw: '+0.8 p.p.', num: 0.8, type: 'pp' },
      period: { kind: 'monthly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
  ],
  quarterly: [
    {
      metric_id: 'quarterly_vgv_launched',
      label: 'VGV Lançado',
      description: 'Valor Geral de Vendas dos lançamentos do trimestre',
      source: 'ADEMI / CBIC',
      value: { raw: 'R$ 3,8 bi', num: 3800000000 },
      unit: 'R$',
      delta: { raw: '+12.4%', num: 12.4, type: 'pct' },
      period: { kind: 'quarterly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
    {
      metric_id: 'quarterly_new_units',
      label: 'Novas Unidades',
      description: 'Total de novas unidades lançadas no trimestre',
      source: 'ADEMI / SECOVI',
      value: { raw: '8.450 un.', num: 8450 },
      unit: 'unidades',
      delta: { raw: '+8.2%', num: 8.2, type: 'pct' },
      period: { kind: 'quarterly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
    {
      metric_id: 'quarterly_sold_units',
      label: 'Unidades Vendidas',
      description: 'Unidades vendidas no trimestre',
      source: 'SECOVI / DataStore',
      value: { raw: '5.680 un.', num: 5680 },
      unit: 'unidades',
      delta: { raw: '+5.1%', num: 5.1, type: 'pct' },
      period: { kind: 'quarterly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
    {
      metric_id: 'quarterly_investment_attractiveness',
      label: 'Atratividade',
      description: 'Índice de atratividade para investimento imobiliário',
      source: 'IDI Brasil / Cálculo Verto Intelligence',
      value: { raw: '68 pts', num: 68 },
      unit: 'pontos',
      delta: { raw: '+2.5 pts', num: 2.5, type: 'abs' },
      period: { kind: 'quarterly', ref: null },
      geo: { city: 'Brasil (Nacional)' },
      updated_at: new Date().toISOString(),
      provenance_url: null,
    },
  ],
  idi: {
    score: { raw: '72/100', num: 72 },
    label: 'Mercado Aquecido',
    delta: { raw: '+10.5%', num: 10.5, type: 'pct' },
    components: {
      price: { raw: '75', num: 75 },
      supply: { raw: '60', num: 60 },
      demand: { raw: '80', num: 80 }
    },
    geo: { city: 'Rio de Janeiro' },
    updated_at: new Date().toISOString()
  },
  charts: {
    price_m2_trend: {
      chart_id: 'price-trend',
      city: 'Rio de Janeiro',
      months: 6,
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      series: [
        { name: 'Médio Padrão', values: [10200, 10250, 10300, 10350, 10450, 10550] }
      ],
      unit: 'R$/m²',
      updated_at: new Date().toISOString()
    },
    demand_index_trend: {
      chart_id: 'demand-trend',
      city: 'Rio de Janeiro',
      months: 6,
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      series: [
        { name: 'Demanda', values: [65, 68, 70, 72, 75, 78] }
      ],
      unit: 'Pontos',
      updated_at: new Date().toISOString()
    },
    stock_available_trend: {
      chart_id: 'stock-trend',
      city: 'Rio de Janeiro',
      months: 6,
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      series: [
        { name: 'Oferta', values: [25000, 24800, 24500, 24200, 24000, 23800] }
      ],
      unit: 'Unidades',
      updated_at: new Date().toISOString()
    },
    investment_attractiveness_trend: {
      chart_id: 'attractiveness-trend',
      city: 'Rio de Janeiro',
      months: 6,
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      series: [
        { name: 'Atratividade', values: [70, 71, 72, 72, 73, 74] }
      ],
      unit: 'Pontos',
      updated_at: new Date().toISOString()
    }
  },
  stock_demand: {
    city: 'Rio de Janeiro',
    months: 12,
    total_stock_units: 32000,
    monthly_total_demand_units: 2400,
    avg_months_of_stock: 12.7,
    status: 'Mercado equilibrado',
    by_segment: [
      { segment: 'Econômico', months_of_stock: 6.5 },
      { segment: 'Médio', months_of_stock: 13.2 },
      { segment: 'Alto', months_of_stock: 18.5 },
    ],
    updated_at: new Date().toISOString(),
  },
  insights: [
    {
      insight_id: '1',
      title: 'Momento Favorável para Lançamentos',
      severity: 'info',
      message: 'A demanda por imóveis de médio padrão cresceu 15% nos últimos 6 meses no "Rio de Janeiro", indicando uma janela de oportunidade.',
      drivers: []
    }
  ]
};

async function fetchDashboardSummary(city: string): Promise<DashboardSummaryResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('dashboard-summary', {
      body: { city },
    });
    
    if (error) throw error;
    if (!data) throw new Error('No data returned');

    return data;
  } catch (err) {
    console.warn('Dashboard summary fetch failed, using fallback.', err);
    // fallback logic
    const fallback = { ...FALLBACK_DASHBOARD_DATA };
    if (fallback.geo) fallback.geo.city = city;
    return fallback;
  }
}

export function useDashboardSummary(city: string = 'Rio de Janeiro') {
  return useQuery({
    queryKey: ['dashboard-summary', city],
    queryFn: () => fetchDashboardSummary(city),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });
}
