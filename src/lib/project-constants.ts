// =====================================================
// Verto Intelligence - Constantes para o módulo de projetos
// Single Source of Truth para cálculos de viabilidade
// =====================================================

export const PADRAO_OPTIONS = [
  { value: 'alto', label: 'Alto Padrão', description: 'Acabamento premium, áreas comuns sofisticadas' },
  { value: 'medio', label: 'Médio Padrão', description: 'Acabamento de qualidade, áreas comuns completas' },
  { value: 'economico', label: 'Econômico', description: 'Acabamento básico, foco em custo-benefício' },
  { value: 'popular', label: 'Popular', description: 'Padrão MCMV ou similar, foco em acessibilidade' },
] as const;

export const TIPO_NEGOCIACAO_OPTIONS = [
  { value: 'compra', label: 'Compra', description: 'Aquisição direta do terreno com pagamento em dinheiro' },
  { value: 'permuta', label: 'Permuta', description: 'Troca de unidades do empreendimento pelo terreno' },
] as const;

export const TIPO_UNIDADE_OPTIONS = [
  { value: '1Q', label: '1 Quarto', description: 'Studio ou apartamento compacto' },
  { value: '2Q', label: '2 Quartos', description: 'Apartamento para casais ou pequenas famílias' },
  { value: '3Q', label: '3 Quartos', description: 'Apartamento familiar padrão' },
  { value: '4Q', label: '4 Quartos', description: 'Apartamento amplo para famílias maiores' },
  { value: 'misto', label: 'Misto', description: 'Combine diferentes tipologias no mesmo empreendimento' },
] as const;

export const REGIME_TRIBUTARIO_OPTIONS = [
  { 
    value: 'lucro_real', 
    label: 'Lucro Real',
    description: 'Tributos calculados sobre o lucro efetivo. Indicado para margens menores.',
    taxRate: 'IRPJ 15% + CSLL 9% + PIS/COFINS ~9,25%',
  },
  { 
    value: 'lucro_presumido', 
    label: 'Lucro Presumido',
    description: 'Base de cálculo presumida (8% para imóveis). Bom para margens altas.',
    taxRate: 'Carga efetiva ~5,93% sobre receita bruta',
  },
  { 
    value: 'ret_1_patrimonio_afetacao', 
    label: 'RET 1% - Patrimônio de Afetação',
    description: 'Regime especial com alíquota única de 1% sobre receita. Requer SPE e afetação.',
    taxRate: '1% sobre receita bruta',
  },
  { 
    value: 'ret_2_mcmv', 
    label: 'RET 4% - Minha Casa Minha Vida',
    description: 'Regime especial para MCMV com alíquota de 4%. Exige enquadramento no programa.',
    taxRate: '4% sobre receita bruta',
  },
] as const;

export const TIPO_IMOVEL_OPTIONS = [
  { value: 'residencial_vertical', label: 'Residencial Vertical', description: 'Apartamentos' },
  { value: 'residencial_horizontal', label: 'Residencial Horizontal', description: 'Casas em condomínio' },
  { value: 'comercial', label: 'Comercial', description: 'Salas comerciais ou lajes corporativas' },
  { value: 'loteamento', label: 'Loteamento', description: 'Lotes urbanizados para venda' },
  { value: 'multiuso', label: 'Multiuso', description: 'Empreendimento misto (residencial + comercial)' },
] as const;

// Interface para distribuição de unidades mistas
export interface TipoUnidadeConfig {
  id: string;
  nome: string;
  quartos: '1Q' | '2Q' | '3Q' | '4Q';
  quantidade: number;
  area_m2: number;
  preco_m2: number;
}

/**
 * Cálculo de VGV por tipo de unidade
 * Fórmula: VGV = área_m² × preço_m² × quantidade
 */
export function calcularVGVPorTipo(config: TipoUnidadeConfig): { unitario: number; total: number } {
  const unitario = config.area_m2 * config.preco_m2;
  const total = unitario * config.quantidade;
  return { unitario, total };
}

/**
 * Cálculo de unidades em permuta
 * REGRA: SEMPRE arredondar para CIMA (Math.ceil)
 * Fórmula: Math.ceil(totalUnidades × percentualPermuta / 100)
 */
export function calcularUnidadesPermuta(totalUnidades: number, percentualPermuta: number): number {
  return Math.ceil((totalUnidades * percentualPermuta) / 100);
}

/**
 * Validar que a soma das projeções de vendas = 100%
 * Fórmula: lancamento% + obra% + entrega% = 100%
 */
export function validarProjecaoVendas(lancamento: number, obra: number, entrega: number): {
  valid: boolean;
  total: number;
  difference: number;
} {
  const total = lancamento + obra + entrega;
  return {
    valid: Math.abs(total - 100) < 0.01,
    total,
    difference: 100 - total,
  };
}

// Formatação de moeda
export function formatCurrencyBR(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Formatação de área
export function formatArea(value: number): string {
  return `${value.toLocaleString('pt-BR')} m²`;
}

// Formatação de percentual
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// =====================================================
// TOOLTIPS E DOCUMENTAÇÃO DOS CAMPOS
// =====================================================

export const FIELD_TOOLTIPS = {
  // Identificação
  nome_projeto: {
    title: 'Nome do Projeto',
    description: 'Nome comercial ou interno do empreendimento',
  },
  cidade: {
    title: 'Cidade',
    description: 'Município onde o empreendimento será construído',
  },
  bairro: {
    title: 'Bairro',
    description: 'Bairro ou região do empreendimento',
  },
  endereco_completo: {
    title: 'Endereço Completo',
    description: 'Formato: Rua X, nº Y, Quadra Z, Lote W',
  },
  
  // Terreno
  area_terreno: {
    title: 'Área do Terreno',
    description: 'Área total do terreno em metros quadrados',
  },
  tipo_negociacao: {
    title: 'Tipo de Negociação',
    description: 'Compra: pagamento em dinheiro. Permuta: troca por unidades do empreendimento.',
  },
  permuta_percentual: {
    title: 'Percentual de Permuta',
    description: 'Porcentagem das unidades que serão trocadas pelo terreno. O cálculo de unidades sempre arredonda para CIMA.',
    formula: 'Math.ceil(totalUnidades × %permuta / 100)',
  },
  
  // Unidades
  total_unidades: {
    title: 'Total de Unidades',
    description: 'Número total de unidades do empreendimento',
  },
  tipo_unidade: {
    title: 'Tipo de Unidade',
    description: 'Tipologia predominante ou misto para múltiplos tipos',
  },
  preco_m2: {
    title: 'Preço Estimado de Venda (R$/m²)',
    description: 'Preço médio de venda por metro quadrado na região',
    source: 'Fonte sugerida: FipeZap ou dados do Dashboard',
  },
  
  // Regime Tributário
  regime_tributario: {
    title: 'Regime Tributário',
    description: 'Escolha impacta diretamente na carga tributária e margem líquida',
    options: {
      lucro_real: 'Tributos sobre lucro efetivo (~34% sobre lucro)',
      lucro_presumido: 'Base presumida (~5,93% sobre receita)',
      ret_1: 'RET 1% - Alíquota única para SPE com afetação',
      ret_4: 'RET 4% - Específico para MCMV',
    },
  },
  
  // Cronograma
  projecao_vendas: {
    title: 'Projeção de Vendas',
    description: 'Distribuição percentual das vendas por fase do projeto',
    validation: 'A soma de Lançamento + Obra + Entrega deve ser exatamente 100%',
    formula: 'lancamento% + obra% + chaves% = 100%',
  },
  
  // Padrão
  padrao_empreendimento: {
    title: 'Padrão do Empreendimento',
    description: 'Define o nível de acabamento e especificações. Impacta diretamente nos custos de construção.',
  },
} as const;
