// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Básico',
    price: 29.90,
    priceFormatted: 'R$ 29,90',
    interval: 'mês',
    popular: false,
    features: [
      'Relatórios mensais e trimestrais',
      'Dashboard com indicadores',
      'Gráficos de evolução',
      'Até 3 projetos ativos',
    ],
    limits: { projects: 3, reports: 'monthly' },
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Profissional',
    price: 39.90,
    priceFormatted: 'R$ 39,90',
    interval: 'mês',
    popular: true,
    features: [
      'Tudo do Básico +',
      'Relatórios semanais',
      'Gráficos avançados',
      'Análise de tendências',
      'Até 10 projetos ativos',
    ],
    limits: { projects: 10, reports: 'weekly' },
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 69.90,
    priceFormatted: 'R$ 69,90',
    interval: 'mês',
    popular: false,
    features: [
      'Tudo do Profissional +',
      'Análise de viabilidade ilimitada',
      'Pesquisa qualitativa (IA)',
      'Análise SWOT',
      'Recomendações estratégicas',
      'Exportação em PDF',
      'Projetos ilimitados',
    ],
    limits: { projects: -1, reports: 'weekly' },
  },
};

export const PROPERTY_TYPES = [
  // Tipos brasileiros (novos — categorias corretas)
  { value: 'apartamentos',      label: 'Apartamentos' },
  { value: 'condominio_casas',  label: 'Condomínio de Casas' },
  { value: 'condominio_lotes',  label: 'Condomínio Fechado de Lotes' },
  { value: 'loteamento_aberto', label: 'Loteamento Aberto' },
  // Legados (compatibilidade)
  { value: 'residential',       label: 'Residencial (legado)' },
  { value: 'commercial',        label: 'Comercial (legado)' },
  { value: 'mixed',             label: 'Misto (legado)' },
  { value: 'land',              label: 'Terreno (legado)' },
] as const;

export const STANDARD_TYPES = [
  { value: 'baixo',    label: 'Baixo Padrão' },
  { value: 'medio',   label: 'Médio Padrão' },
  { value: 'alto',    label: 'Alto Padrão' },
  { value: 'luxo',    label: 'Luxo / Super Alto' },
  // legados
  { value: 'economic', label: 'Econômico (legado)' },
  { value: 'standard', label: 'Padrão (legado)' },
  { value: 'high',     label: 'Alto Padrão (legado)' },
  { value: 'luxury',   label: 'Luxo (legado)' },
] as const;

export const TAX_REGIMES = [
  { value: 'lucro_presumido', label: 'Lucro Presumido' },
  { value: 'ret',             label: 'RET — Regime Especial de Tributação' },
  { value: 'scp',             label: 'SCP — Sociedade em Conta de Participação' },
  { value: 'lucro_real',      label: 'Lucro Real' },
  { value: 'simples',         label: 'Simples Nacional' },
] as const;

export const PROJECT_STATUS = [
  { value: 'draft', label: 'Rascunho', color: 'muted' },
  { value: 'analysis', label: 'Em Análise', color: 'info' },
  { value: 'approved', label: 'Aprovado', color: 'success' },
  { value: 'rejected', label: 'Reprovado', color: 'destructive' },
  { value: 'archived', label: 'Arquivado', color: 'muted' },
] as const;

export const VIABILITY_THRESHOLDS = {
  ROI: { min: 15, recommended: 25, excellent: 35 },
  TIR: { min: 12, recommended: 18, excellent: 25 },
  PAYBACK: { max: 48, recommended: 36, excellent: 24 },
  MARGIN: { min: 20, recommended: 30, excellent: 40 },
} as const;

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(value / 100);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
};

export const formatArea = (value: number): string => `${formatNumber(value)} m²`;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_NEW: '/projects/new',
  REPORTS: '/reports',
  SUBSCRIPTION: '/subscription',
  SETTINGS: '/settings',
} as const;
