-- Tabela de inputs detalhados do projeto
CREATE TABLE public.project_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Distribuição de unidades
  unit_distribution JSONB DEFAULT '{}',
  
  -- Aquisição do terreno
  land_acquisition_type TEXT CHECK (land_acquisition_type IN ('compra', 'permuta', 'usufruto')),
  land_cost DECIMAL(15, 2) DEFAULT 0,
  permuta_units INTEGER DEFAULT 0,
  usufruto_years INTEGER DEFAULT 0,
  
  -- Custos adicionais
  approval_costs DECIMAL(15, 2) DEFAULT 0,
  infrastructure_costs DECIMAL(15, 2) DEFAULT 0,
  project_costs DECIMAL(15, 2) DEFAULT 0,
  contingency_percent DECIMAL(5, 2) DEFAULT 5,
  
  -- Parâmetros financeiros
  sales_velocity INTEGER DEFAULT 10,
  launch_date DATE,
  construction_months INTEGER DEFAULT 24,
  financing_rate DECIMAL(5, 2) DEFAULT 12,
  discount_rate DECIMAL(5, 2) DEFAULT 15,
  
  -- ESG/Sustentabilidade
  certifications JSONB DEFAULT '[]',
  sustainability_initiatives JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(project_id)
);

-- Tabela de resultados de análise
CREATE TABLE public.analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  analysis_type TEXT CHECK (analysis_type IN ('viability', 'market', 'financial')),
  
  -- Métricas financeiras
  vpl DECIMAL(15, 2),
  tir DECIMAL(5, 2),
  payback_months INTEGER,
  profit_margin DECIMAL(5, 2),
  total_investment DECIMAL(15, 2),
  gross_revenue DECIMAL(15, 2),
  net_profit DECIMAL(15, 2),
  
  -- Cenários
  scenarios JSONB DEFAULT '{}',
  
  -- Métricas de mercado
  market_demand INTEGER,
  supply_demand_ratio DECIMAL(5, 2),
  competitors_count INTEGER,
  avg_price_m2 DECIMAL(10, 2),
  
  -- Risco
  risk_score DECIMAL(3, 2) DEFAULT 0.5,
  risk_level TEXT CHECK (risk_level IN ('baixo', 'medio', 'alto')),
  risk_factors JSONB DEFAULT '[]',
  
  -- Insights
  recommendations JSONB DEFAULT '[]',
  viability_status TEXT CHECK (viability_status IN ('viavel', 'viavel_com_ressalvas', 'inviavel')),
  
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(project_id, analysis_type)
);

-- Tabela de dados de mercado (cache)
CREATE TABLE public.market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  uf TEXT NOT NULL,
  neighborhood TEXT,
  
  avg_price_m2 DECIMAL(10, 2),
  price_variation_12m DECIMAL(5, 2),
  supply_units INTEGER,
  demand_index INTEGER,
  absorption_rate DECIMAL(5, 2),
  
  selic_rate DECIMAL(5, 2),
  ipca_12m DECIMAL(5, 2),
  pib_growth DECIMAL(5, 2),
  
  source TEXT DEFAULT 'fipe',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() + INTERVAL '24 hours'
);

-- Índices para market_data
CREATE INDEX idx_market_city ON public.market_data(city, uf);
CREATE INDEX idx_market_expires ON public.market_data(expires_at);

-- Enable RLS
ALTER TABLE public.project_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_inputs
CREATE POLICY "Users can view inputs for their projects" ON public.project_inputs
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_inputs.project_id AND projects.user_id = auth.uid())
);

CREATE POLICY "Users can create inputs for their projects" ON public.project_inputs
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_inputs.project_id AND projects.user_id = auth.uid())
);

CREATE POLICY "Users can update inputs for their projects" ON public.project_inputs
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_inputs.project_id AND projects.user_id = auth.uid())
);

CREATE POLICY "Users can delete inputs for their projects" ON public.project_inputs
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_inputs.project_id AND projects.user_id = auth.uid())
);

-- RLS Policies for analysis_results
CREATE POLICY "Users can view analysis for their projects" ON public.analysis_results
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = analysis_results.project_id AND projects.user_id = auth.uid())
);

CREATE POLICY "Users can create analysis for their projects" ON public.analysis_results
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = analysis_results.project_id AND projects.user_id = auth.uid())
);

CREATE POLICY "Users can update analysis for their projects" ON public.analysis_results
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = analysis_results.project_id AND projects.user_id = auth.uid())
);

CREATE POLICY "Users can delete analysis for their projects" ON public.analysis_results
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = analysis_results.project_id AND projects.user_id = auth.uid())
);

-- RLS Policy for market_data (public read)
CREATE POLICY "Anyone can view market data" ON public.market_data
FOR SELECT USING (true);

-- Trigger para updated_at em project_inputs
CREATE TRIGGER update_project_inputs_updated_at
BEFORE UPDATE ON public.project_inputs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();