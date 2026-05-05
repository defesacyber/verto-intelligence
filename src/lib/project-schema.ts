import { z } from 'zod';

// ─── Tipos de empreendimento (categorias brasileiras) ──────────────────────────
export const PROPERTY_TYPES = [
  { value: 'apartamentos',       label: 'Apartamentos' },
  { value: 'condominio_casas',   label: 'Condomínio de Casas' },
  { value: 'condominio_lotes',   label: 'Condomínio Fechado de Lotes' },
  { value: 'loteamento_aberto',  label: 'Loteamento Aberto' },
  // legados
  { value: 'residential',        label: 'Residencial (legado)' },
  { value: 'commercial',         label: 'Comercial (legado)' },
  { value: 'land',               label: 'Terreno (legado)' },
  { value: 'mixed',              label: 'Misto (legado)' },
] as const;

export const PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map(p => p.value) as [string, ...string[]];

// ─── Regimes tributários ──────────────────────────────────────────────────────
export const TAX_REGIMES = [
  { value: 'lucro_presumido', label: 'Lucro Presumido' },
  { value: 'ret',             label: 'RET — Regime Especial de Tributação' },
  { value: 'scp',             label: 'SCP — Sociedade em Conta de Participação' },
  { value: 'lucro_real',      label: 'Lucro Real' },
  { value: 'simples',         label: 'Simples Nacional' },
] as const;

// ─── Tipos de unidades ────────────────────────────────────────────────────────
export const UNIT_TYPES_APTO = ['studio', 'flat', '1q', '2q', '3q', '4q'] as const;
export const UNIT_TYPES_CASA = ['sobrado', 'terrea'] as const;
export const UNIT_TYPES_LOTE = ['lote_padrao'] as const;

// ─── Custos configuráveis (DRE) ───────────────────────────────────────────────
export const adjustableCostsSchema = z.object({
  comissao_venda:           z.number().min(0).max(20).default(5.0),   // % do VGV
  gestao_vendas:            z.number().min(0).max(10).default(1.5),   // % do VGV
  marketing:                z.number().min(0).max(15).default(3.0),   // % do VGV
  administracao:            z.number().min(0).max(15).default(5.0),   // % da receita
  incorporacao:             z.number().min(0).max(10).default(2.0),   // % da receita
  engenharia_arquitetura:   z.number().min(0).max(10).default(3.0),   // % do custo obra
  impostos:                 z.number().min(0).max(20).default(8.0),   // % da receita (varia por regime)
  outros:                   z.number().min(0).max(10).default(1.0),   // % da receita
});

export type AdjustableCosts = z.infer<typeof adjustableCostsSchema>;

// ─── Schema principal do formulário de inputs ─────────────────────────────────
export const projectFormSchema = z.object({
  // Aquisição do terreno
  land_acquisition_type: z.enum(['compra', 'permuta', 'usufruto']).nullable(),
  land_cost: z.number().min(0),
  permuta_units: z.number().min(0),
  usufruto_years: z.number().min(0),

  // Custos do projeto (diretos)
  approval_costs: z.number().min(0),
  infrastructure_costs: z.number().min(0),
  project_costs: z.number().min(0),
  contingency_percent: z.number().min(0).max(100),

  // Custos configuráveis (percentuais DRE)
  adjustable_costs: adjustableCostsSchema.default({
    comissao_venda: 5.0,
    gestao_vendas: 1.5,
    marketing: 3.0,
    administracao: 5.0,
    incorporacao: 2.0,
    engenharia_arquitetura: 3.0,
    impostos: 8.0,
    outros: 1.0,
  }),

  // Cronograma
  launch_months: z.number().min(1).max(24).default(3),          // meses de lançamento
  construction_months: z.number().min(6).max(120),               // meses de obra
  launch_date: z.string().nullable(),

  // Velocidade de vendas
  sales_velocity: z.number().min(1).max(100),                    // % em 12m (estimativa cliente)
  estimated_launch_velocity: z.number().min(0).default(0),       // unidades no lançamento

  // Parâmetros financeiros
  financing_rate: z.number().min(0).max(50),
  discount_rate: z.number().min(0).max(50),

  // Sustentabilidade
  certifications: z.array(z.string()),
  sustainability_initiatives: z.array(z.string()),

  // Distribuição de unidades (aptos e casas)
  unit_distribution: z.object({
    studio:   z.number().min(0),
    flat:     z.number().min(0).default(0),
    '1q':     z.number().min(0),
    '2q':     z.number().min(0),
    '3q':     z.number().min(0),
    '4q':     z.number().min(0),
    sobrado:  z.number().min(0).default(0),
    terrea:   z.number().min(0).default(0),
    lote:     z.number().min(0).default(0),
  }),

  // Tamanho médio por tipo (m²)
  unit_areas: z.object({
    studio:   z.number().min(0).default(35),
    flat:     z.number().min(0).default(45),
    '1q':     z.number().min(0).default(45),
    '2q':     z.number().min(0).default(65),
    '3q':     z.number().min(0).default(90),
    '4q':     z.number().min(0).default(130),
    sobrado:  z.number().min(0).default(120),
    terrea:   z.number().min(0).default(100),
    lote:     z.number().min(0).default(250),
  }).optional(),

  // Preço médio de venda por tipo (R$) — preenchido pelo cliente
  unit_prices: z.object({
    studio:   z.number().min(0).default(0),
    flat:     z.number().min(0).default(0),
    '1q':     z.number().min(0).default(0),
    '2q':     z.number().min(0).default(0),
    '3q':     z.number().min(0).default(0),
    '4q':     z.number().min(0).default(0),
    sobrado:  z.number().min(0).default(0),
    terrea:   z.number().min(0).default(0),
    lote:     z.number().min(0).default(0),
  }).optional(),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;

// ─── Defaults exportados ──────────────────────────────────────────────────────
export const DEFAULT_ADJUSTABLE_COSTS: AdjustableCosts = {
  comissao_venda: 5.0,
  gestao_vendas: 1.5,
  marketing: 3.0,
  administracao: 5.0,
  incorporacao: 2.0,
  engenharia_arquitetura: 3.0,
  impostos: 8.0,
  outros: 1.0,
};

// Alíquotas padrão por regime (para auto-preencher o campo impostos)
export const IMPOSTOS_POR_REGIME: Record<string, number> = {
  ret:             4.0,  // RET: 4% sobre receita bruta
  scp:             6.0,  // SCP: ~6% (IRPJ + CSLL sobre lucro presumido)
  lucro_presumido: 8.0,  // Lucro Presumido: ~8% na construção civil
  lucro_real:      34.0, // Lucro Real: IRPJ 25% + CSLL 9%
  simples:         4.0,  // Simples: Anexo VII ~4%
};
