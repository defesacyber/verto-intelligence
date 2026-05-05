
-- Tabela para armazenar relatórios de pesquisa de mercado
CREATE TABLE public.market_research_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Bloco 1: Macroeconômico
  macro_data JSONB DEFAULT '{}'::jsonb,
  macro_summary TEXT,
  macro_generated_at TIMESTAMPTZ,
  
  -- Bloco 2: Cidade
  city_data JSONB DEFAULT '{}'::jsonb,
  city_analysis TEXT,
  price_by_segment JSONB DEFAULT '{}'::jsonb,
  best_neighborhoods JSONB DEFAULT '{}'::jsonb,
  buyer_profile JSONB DEFAULT '{}'::jsonb,
  
  -- Bloco 3: Bairro
  neighborhood_data JSONB DEFAULT '{}'::jsonb,
  neighborhood_analysis TEXT,
  product_adequacy VARCHAR(50), -- ADEQUADO, PARCIALMENTE_ADEQUADO, INADEQUADO
  product_adequacy_justification TEXT,
  
  -- Bloco 4: Concorrência
  competitors JSONB DEFAULT '[]'::jsonb,
  competition_analysis TEXT,
  
  -- Bloco 5: Demanda
  demand_data JSONB DEFAULT '{}'::jsonb,
  demand_analysis TEXT,
  
  -- Bloco 6: Velocidade de Vendas
  sales_velocity_scenarios JSONB DEFAULT '{}'::jsonb,
  velocity_analysis TEXT,
  
  -- Bloco 7: Conclusão
  market_conclusion TEXT,
  final_verdict VARCHAR(50), -- FAVORAVEL, FAVORAVEL_COM_RESSALVAS, DESFAVORAVEL
  
  -- Metadados
  status VARCHAR(20) DEFAULT 'draft', -- draft, generating, completed, error
  generation_progress INTEGER DEFAULT 0,
  error_message TEXT,
  data_sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para dados de concorrentes (cache e entrada manual)
CREATE TABLE public.competitor_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_research_id UUID REFERENCES public.market_research_reports(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Dados do empreendimento concorrente
  name VARCHAR(255) NOT NULL,
  developer VARCHAR(255),
  address TEXT,
  neighborhood VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  uf CHAR(2) NOT NULL,
  
  -- Datas
  launch_date DATE,
  delivery_date DATE,
  
  -- Preços
  avg_price_m2 NUMERIC(12,2),
  min_ticket NUMERIC(14,2),
  max_ticket NUMERIC(14,2),
  avg_ticket NUMERIC(14,2),
  
  -- Unidades
  total_units INTEGER,
  sold_units INTEGER,
  available_units INTEGER,
  vso_monthly NUMERIC(5,2), -- Velocidade sobre oferta mensal em %
  
  -- Tipologia
  unit_types JSONB DEFAULT '[]'::jsonb, -- [{type: "2 quartos", area: 65, count: 50}]
  
  -- Diferenciais
  differentials TEXT[],
  amenities TEXT[],
  
  -- Metadados
  source VARCHAR(50) DEFAULT 'manual', -- manual, scraping, api
  source_url TEXT,
  confidence_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  data_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para parâmetros de viabilidade editáveis
CREATE TABLE public.viability_parameters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  
  -- Custos indiretos (% sobre VGV)
  sales_commission_pct NUMERIC(5,2) DEFAULT 5.00,
  sales_management_fee_pct NUMERIC(5,2) DEFAULT 1.00,
  marketing_pct NUMERIC(5,2) DEFAULT 3.00,
  admin_fee_pct NUMERIC(5,2) DEFAULT 2.00,
  incorporation_fee_pct NUMERIC(5,2) DEFAULT 3.00,
  legal_expenses_pct NUMERIC(5,2) DEFAULT 1.00,
  
  -- Custos sobre obra
  engineering_pct NUMERIC(5,2) DEFAULT 5.00,
  insurance_pct NUMERIC(5,2) DEFAULT 1.00,
  contingency_pct NUMERIC(5,2) DEFAULT 5.00,
  
  -- Parâmetros de venda
  down_payment_pct NUMERIC(5,2) DEFAULT 30.00,
  monthly_installments INTEGER DEFAULT 36,
  balloon_at_keys_pct NUMERIC(5,2) DEFAULT 30.00,
  
  -- Taxas
  discount_rate NUMERIC(5,2), -- Se null, usa Selic + 4%
  
  -- CUB/Custo
  cub_code VARCHAR(20), -- R1-N, R8-A, etc
  cub_value NUMERIC(12,2),
  cub_adjustment_factor NUMERIC(5,2) DEFAULT 1.00,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_market_research_project ON public.market_research_reports(project_id);
CREATE INDEX idx_market_research_user ON public.market_research_reports(user_id);
CREATE INDEX idx_market_research_status ON public.market_research_reports(status);
CREATE INDEX idx_competitor_project ON public.competitor_data(project_id);
CREATE INDEX idx_competitor_city ON public.competitor_data(city, uf);
CREATE INDEX idx_viability_params_project ON public.viability_parameters(project_id);

-- RLS
ALTER TABLE public.market_research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viability_parameters ENABLE ROW LEVEL SECURITY;

-- Políticas para market_research_reports
CREATE POLICY "Users can view their own market research reports"
  ON public.market_research_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own market research reports"
  ON public.market_research_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own market research reports"
  ON public.market_research_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own market research reports"
  ON public.market_research_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para competitor_data (baseado no projeto)
CREATE POLICY "Users can view competitors for their projects"
  ON public.competitor_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = competitor_data.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create competitors for their projects"
  ON public.competitor_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = competitor_data.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update competitors for their projects"
  ON public.competitor_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = competitor_data.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete competitors for their projects"
  ON public.competitor_data FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = competitor_data.project_id 
      AND p.user_id = auth.uid()
    )
  );

-- Políticas para viability_parameters
CREATE POLICY "Users can view viability params for their projects"
  ON public.viability_parameters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = viability_parameters.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create viability params for their projects"
  ON public.viability_parameters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = viability_parameters.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update viability params for their projects"
  ON public.viability_parameters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = viability_parameters.project_id 
      AND p.user_id = auth.uid()
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_market_research_reports_updated_at
  BEFORE UPDATE ON public.market_research_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competitor_data_updated_at
  BEFORE UPDATE ON public.competitor_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_viability_parameters_updated_at
  BEFORE UPDATE ON public.viability_parameters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
