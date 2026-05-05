-- Tabela de ranking IDI por cidade
CREATE TABLE IF NOT EXISTS public.idi_ranking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id varchar(100) NOT NULL,
  cidade_nome varchar(255) NOT NULL,
  estado varchar(2) NOT NULL,
  periodo date NOT NULL,
  tipo_imovel varchar(50) NOT NULL DEFAULT 'residencial',
  score_idi decimal(5,2),
  score_momentum decimal(5,2),
  score_volume decimal(5,2),
  score_absorcao decimal(5,2),
  score_demanda decimal(5,2),
  score_macro decimal(5,2),
  score_esg decimal(5,2),
  ranking_nacional integer,
  ranking_estado integer,
  ranking_regiao integer,
  variacao_percentual decimal(5,2),
  variacao_ranking integer,
  tendencia varchar(10) DEFAULT 'stable',
  preco_medio_m2 decimal(10,2),
  preco_mediano_m2 decimal(10,2),
  preco_variacao_12m decimal(5,2),
  volume_transacoes integer,
  dias_venda_media integer,
  dados_fonte varchar(255),
  atualizado_em timestamptz DEFAULT now(),
  criado_em timestamptz DEFAULT now(),
  UNIQUE(cidade_id, periodo, tipo_imovel)
);

-- Tabela de dados macroeconômicos por cidade
CREATE TABLE IF NOT EXISTS public.idi_macro_dados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id varchar(100) NOT NULL,
  periodo date NOT NULL,
  populacao integer,
  pib_per_capita decimal(12,2),
  pib_crescimento decimal(5,2),
  taxa_desemprego decimal(5,2),
  renda_media decimal(10,2),
  idh decimal(3,3),
  selic_referencia decimal(5,2),
  ipca_acumulado decimal(5,2),
  incc_mensal decimal(5,2),
  igpm_mensal decimal(5,2),
  cub_estadual decimal(10,2),
  criado_em timestamptz DEFAULT now(),
  UNIQUE(cidade_id, periodo)
);

-- Tabela de dados ESG
CREATE TABLE IF NOT EXISTS public.idi_esg_dados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id varchar(100) NOT NULL,
  periodo date NOT NULL,
  score_sustentabilidade decimal(5,2),
  risco_climatico decimal(5,2),
  certificacoes_verdes integer,
  energia_renovavel_percentual decimal(5,2),
  areas_verdes_percentual decimal(5,2),
  transporte_publico_cobertura decimal(5,2),
  criado_em timestamptz DEFAULT now(),
  UNIQUE(cidade_id, periodo)
);

-- Tabela de bairros (drill-down do IDI)
CREATE TABLE IF NOT EXISTS public.idi_bairros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bairro_id varchar(100) NOT NULL,
  bairro_nome varchar(255) NOT NULL,
  cidade_id varchar(100) NOT NULL,
  periodo date NOT NULL,
  tipo_imovel varchar(50) NOT NULL DEFAULT 'residencial',
  score_idi decimal(5,2),
  ranking_cidade integer,
  preco_medio_m2 decimal(10,2),
  volume_transacoes integer,
  dias_venda_media integer,
  criado_em timestamptz DEFAULT now(),
  UNIQUE(bairro_id, periodo, tipo_imovel)
);

-- Tabela histórica para gráficos de tendência
CREATE TABLE IF NOT EXISTS public.idi_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id varchar(100) NOT NULL,
  periodo date NOT NULL,
  tipo_imovel varchar(50) NOT NULL DEFAULT 'residencial',
  score_idi decimal(5,2),
  score_momentum decimal(5,2),
  score_volume decimal(5,2),
  score_absorcao decimal(5,2),
  score_demanda decimal(5,2),
  score_macro decimal(5,2),
  score_esg decimal(5,2),
  preco_m2 decimal(10,2),
  volume_transacoes integer,
  dias_venda integer,
  ranking_nacional integer,
  criado_em timestamptz DEFAULT now(),
  UNIQUE(cidade_id, periodo, tipo_imovel)
);

-- Tabela de concorrentes por projeto
CREATE TABLE IF NOT EXISTS public.project_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  nome varchar(255) NOT NULL,
  tipo varchar(50) NOT NULL DEFAULT 'direto',
  localizacao text,
  tipologia text,
  area_min decimal(8,2),
  area_max decimal(8,2),
  preco_min decimal(12,2),
  preco_max decimal(12,2),
  diferencial text,
  criado_em timestamptz DEFAULT now()
);

-- Tabela de análises SWOT por projeto
CREATE TABLE IF NOT EXISTS public.project_swot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  forcas text[] DEFAULT '{}',
  fraquezas text[] DEFAULT '{}',
  oportunidades text[] DEFAULT '{}',
  ameacas text[] DEFAULT '{}',
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE(project_id)
);

-- Tabela de dados de mercado semanal (Market Weekly)
CREATE TABLE IF NOT EXISTS public.market_weekly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id varchar(100) NOT NULL,
  cidade_nome varchar(255) NOT NULL,
  estado varchar(2) NOT NULL,
  semana_inicio date NOT NULL,
  semana_fim date NOT NULL,
  total_vendas integer,
  vendas_casas integer,
  vendas_apartamentos integer,
  vendas_comercial integer,
  maior_venda_valor decimal(12,2),
  maior_venda_bairro varchar(255),
  maior_venda_area decimal(8,2),
  taxa_financiamento_institucional decimal(5,2),
  taxa_financiamento_consumidor decimal(5,2),
  variacao_taxa_semanal decimal(5,2),
  variacao_taxa_anual decimal(5,2),
  preco_medio_m2 decimal(10,2),
  variacao_preco_mensal decimal(5,2),
  dias_medio_venda integer,
  criado_em timestamptz DEFAULT now(),
  UNIQUE(cidade_id, semana_inicio)
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_idi_ranking_nacional ON public.idi_ranking(ranking_nacional);
CREATE INDEX IF NOT EXISTS idx_idi_periodo_estado ON public.idi_ranking(periodo, estado);
CREATE INDEX IF NOT EXISTS idx_idi_score ON public.idi_ranking(score_idi DESC);
CREATE INDEX IF NOT EXISTS idx_idi_historico_cidade ON public.idi_historico(cidade_id, periodo);
CREATE INDEX IF NOT EXISTS idx_market_weekly_cidade ON public.market_weekly(cidade_id, semana_inicio DESC);

-- RLS para tabelas de dados de mercado (públicas, somente leitura)
ALTER TABLE public.idi_ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idi_macro_dados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idi_esg_dados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idi_bairros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idi_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_swot ENABLE ROW LEVEL SECURITY;

-- Políticas: dados de mercado leitura pública para usuários autenticados
CREATE POLICY "Authenticated users can read IDI data" ON public.idi_ranking
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read macro data" ON public.idi_macro_dados
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read ESG data" ON public.idi_esg_dados
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read neighborhood data" ON public.idi_bairros
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read IDI history" ON public.idi_historico
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read weekly market" ON public.market_weekly
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin pode inserir/atualizar dados de mercado
CREATE POLICY "Admins can manage IDI data" ON public.idi_ranking
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage macro data" ON public.idi_macro_dados
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage weekly market" ON public.market_weekly
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Políticas de concorrentes e SWOT (owner only)
CREATE POLICY "Users own competitors" ON public.project_competitors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own SWOT" ON public.project_swot
  FOR ALL USING (auth.uid() = user_id);
