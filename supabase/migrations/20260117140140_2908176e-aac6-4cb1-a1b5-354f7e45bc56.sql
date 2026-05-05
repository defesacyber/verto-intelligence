-- =====================================================
-- Expansão do Módulo de Projetos - Novos Campos
-- =====================================================

-- Adicionar campos de identificação e localização
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS rua TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS quadra TEXT,
ADD COLUMN IF NOT EXISTS lote TEXT,
ADD COLUMN IF NOT EXISTS padrao_empreendimento TEXT CHECK (padrao_empreendimento IN ('alto', 'medio', 'economico', 'popular'));

-- Adicionar campos de terreno e negociação
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS area_terreno_m2 NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS tipo_negociacao TEXT CHECK (tipo_negociacao IN ('compra', 'permuta')),
ADD COLUMN IF NOT EXISTS valor_terreno NUMERIC(14, 2),
ADD COLUMN IF NOT EXISTS permuta_percentual NUMERIC(5, 2);

-- Adicionar campos de unidades expandidos
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS tipo_unidade TEXT CHECK (tipo_unidade IN ('1Q', '2Q', '3Q', '4Q', 'misto')),
ADD COLUMN IF NOT EXISTS distribuicao_unidades JSONB DEFAULT '{}';

-- Adicionar campos fiscais
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS regime_tributario TEXT CHECK (regime_tributario IN ('lucro_real', 'lucro_presumido', 'ret_1_patrimonio_afetacao', 'ret_2_mcmv'));

-- Adicionar campos de cronograma
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS projecao_lancamento_meses INTEGER,
ADD COLUMN IF NOT EXISTS projecao_construcao_meses INTEGER,
ADD COLUMN IF NOT EXISTS venda_lancamento_pct NUMERIC(5, 2) DEFAULT 30,
ADD COLUMN IF NOT EXISTS venda_obra_pct NUMERIC(5, 2) DEFAULT 50,
ADD COLUMN IF NOT EXISTS venda_entrega_pct NUMERIC(5, 2) DEFAULT 20;

-- Adicionar campos de VGV por tipo de unidade
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS vgv_por_tipo JSONB DEFAULT '[]';

-- Comentários explicativos
COMMENT ON COLUMN public.projects.padrao_empreendimento IS 'Padrão do empreendimento: alto, medio, economico, popular';
COMMENT ON COLUMN public.projects.tipo_negociacao IS 'Tipo de negociação do terreno: compra ou permuta';
COMMENT ON COLUMN public.projects.permuta_percentual IS 'Percentual de unidades em permuta (arredondar para cima)';
COMMENT ON COLUMN public.projects.distribuicao_unidades IS 'JSON com distribuição de unidades por tipo: {"tipo1": {"quartos": "2Q", "qtd": 50, "area": 65, "preco_m2": 8500}}';
COMMENT ON COLUMN public.projects.regime_tributario IS 'Regime tributário: lucro_real, lucro_presumido, ret_1_patrimonio_afetacao, ret_2_mcmv';
COMMENT ON COLUMN public.projects.vgv_por_tipo IS 'VGV calculado por tipo de unidade: [{"tipo": "1Q", "vgv_unitario": 450000, "vgv_total": 22500000}]';