-- =====================================================================
-- Extensão dos campos do projeto — Verto Intelligence
-- Adiciona: endereço completo, CEP, bairro, regime tributário,
-- novos tipos de empreendimento, e ajuste nos project_inputs
-- =====================================================================

-- 1. Adicionar colunas à tabela projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS cep VARCHAR(9),
  ADD COLUMN IF NOT EXISTS regime_tributario TEXT DEFAULT 'lucro_presumido'
    CHECK (regime_tributario IN ('scp', 'ret', 'lucro_presumido', 'lucro_real', 'simples')),
  ADD COLUMN IF NOT EXISTS tipo_negociacao_terreno TEXT DEFAULT 'compra'
    CHECK (tipo_negociacao_terreno IN ('compra', 'permuta', 'usufruto'));

-- 2. Atualizar o CHECK de property_type para incluir tipos imobiliários brasileiros
-- Primeiro remover o constraint antigo (se existir como named constraint)
DO $$
BEGIN
  -- Remove old check constraint if named
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
    AND constraint_name LIKE '%property_type%'
  ) THEN
    ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_property_type_check;
  END IF;
END $$;

-- Adicionar novo constraint com tipos BR + ingleses para compatibilidade
ALTER TABLE public.projects
  ADD CONSTRAINT projects_property_type_check
  CHECK (property_type IN (
    -- Tipos brasileiros (novos)
    'condominio_casas',
    'apartamentos',
    'condominio_lotes',
    'loteamento_aberto',
    -- Tipos legados (manter compatibilidade)
    'residential',
    'commercial',
    'land',
    'mixed'
  ));

-- 3. Adicionar campos de velocidade de venda e prazo ao project_inputs
-- O project_inputs guarda JSONB, então os novos campos entram no JSON
-- Mas vamos garantir que a tabela exista com a coluna inputs_data

-- Adicionar coluna de custos configuráveis (percentuais DRE editáveis)
-- Esta coluna armazena um JSONB com os percentuais que o cliente pode editar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_inputs') THEN
    ALTER TABLE public.project_inputs
      ADD COLUMN IF NOT EXISTS adjustable_costs JSONB DEFAULT '{
        "comissao_venda": 5.0,
        "gestao_vendas": 1.5,
        "marketing": 3.0,
        "administracao": 5.0,
        "incorporacao": 2.0,
        "engenharia_arquitetura": 3.0,
        "impostos": 8.0,
        "outros": 1.0
      }'::jsonb,
      ADD COLUMN IF NOT EXISTS launch_months INTEGER DEFAULT 3,
      ADD COLUMN IF NOT EXISTS estimated_launch_velocity INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS construction_cost_m2_calculated NUMERIC,
      ADD COLUMN IF NOT EXISTS construction_cost_source TEXT DEFAULT 'calculado_ia',
      ADD COLUMN IF NOT EXISTS tipo_unidades JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 4. Índices úteis para as novas colunas
CREATE INDEX IF NOT EXISTS idx_projects_cep ON public.projects(cep) WHERE cep IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_bairro ON public.projects(bairro) WHERE bairro IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_regime ON public.projects(regime_tributario);

-- 5. Comentários para documentação
COMMENT ON COLUMN public.projects.street IS 'Rua/Avenida do endereço do terreno';
COMMENT ON COLUMN public.projects.bairro IS 'Bairro onde está localizado o terreno';
COMMENT ON COLUMN public.projects.cep IS 'CEP do endereço (formato: 00000-000)';
COMMENT ON COLUMN public.projects.regime_tributario IS 'Regime tributário: scp, ret, lucro_presumido, lucro_real, simples';
COMMENT ON COLUMN public.projects.tipo_negociacao_terreno IS 'Forma de aquisição do terreno';
