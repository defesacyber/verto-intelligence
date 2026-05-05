-- Tabela: FipeZap Index Histórico (dados públicos da FIPE)
CREATE TABLE idi_fipezap_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes DATE NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  tipo_imovel VARCHAR(50) NOT NULL DEFAULT 'residencial',
  
  -- Índice de Venda
  indice_venda DECIMAL(10, 4),
  variacao_venda_mes DECIMAL(6, 3),
  variacao_venda_12m DECIMAL(6, 3),
  preco_m2_venda DECIMAL(12, 2),
  
  -- Índice de Locação
  indice_locacao DECIMAL(10, 4),
  variacao_locacao_mes DECIMAL(6, 3),
  variacao_locacao_12m DECIMAL(6, 3),
  preco_m2_locacao DECIMAL(12, 2),
  
  -- Metadados
  fonte VARCHAR(50) DEFAULT 'fipe',
  data_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(mes, cidade, uf, tipo_imovel)
);

-- Índices para performance
CREATE INDEX idx_fipezap_cidade_mes ON idi_fipezap_historico (cidade, mes DESC);
CREATE INDEX idx_fipezap_uf_mes ON idi_fipezap_historico (uf, mes DESC);
CREATE INDEX idx_fipezap_tipo_imovel ON idi_fipezap_historico (tipo_imovel);

-- Tabela: DataZap Report Extraído (relatórios públicos)
CREATE TABLE idi_datazap_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_publicacao DATE NOT NULL,
  tipo_relatorio VARCHAR(50) NOT NULL,
  
  -- Conteúdo estruturado
  titulo VARCHAR(255),
  descricao TEXT,
  
  -- Insights por cidade
  cidades_em_alta JSONB DEFAULT '[]'::jsonb,
  cidades_em_queda JSONB DEFAULT '[]'::jsonb,
  
  -- Métricas agregadas nacionais
  preco_medio_nacional DECIMAL(12, 2),
  variacao_nacional_mes DECIMAL(6, 3),
  volume_total_anuncios INTEGER,
  dias_venda_media INTEGER,
  
  -- Dados de comportamento
  indice_demanda DECIMAL(6, 3),
  indice_oferta DECIMAL(6, 3),
  
  -- Arquivo original
  pdf_url VARCHAR(500),
  
  data_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(data_publicacao, tipo_relatorio)
);

CREATE INDEX idx_datazap_tipo ON idi_datazap_reports (tipo_relatorio);
CREATE INDEX idx_datazap_data ON idi_datazap_reports (data_publicacao DESC);

-- Tabela: Mercado Snapshot (dados agregados)
CREATE TABLE idi_mercado_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_coleta DATE NOT NULL DEFAULT CURRENT_DATE,
  cidade VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  bairro VARCHAR(100) DEFAULT '',
  
  -- Preços
  preco_m2_medio DECIMAL(12, 2),
  preco_m2_min DECIMAL(12, 2),
  preco_m2_max DECIMAL(12, 2),
  
  -- Volume
  anuncios_ativos INTEGER,
  anuncios_novos_dia INTEGER,
  
  -- Liquidez
  dias_venda_media INTEGER,
  
  -- Segmentação
  apartamentos_pct DECIMAL(5, 2),
  casas_pct DECIMAL(5, 2),
  comercial_pct DECIMAL(5, 2),
  
  fonte VARCHAR(50) DEFAULT 'agregado',
  
  UNIQUE(data_coleta, cidade, uf, bairro)
);

CREATE INDEX idx_snapshot_cidade_data ON idi_mercado_snapshot (cidade, uf, data_coleta DESC);

-- Tabela: Cache de Indicadores Macroeconômicos (BCB)
CREATE TABLE idi_macro_indicadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_referencia DATE NOT NULL,
  
  -- Taxas BCB
  selic_meta DECIMAL(6, 3),
  selic_acumulada_mes DECIMAL(8, 5),
  
  -- Inflação
  ipca_mes DECIMAL(6, 3),
  ipca_acumulado_12m DECIMAL(6, 3),
  incc_mes DECIMAL(6, 3),
  incc_acumulado_12m DECIMAL(6, 3),
  igpm_mes DECIMAL(6, 3),
  igpm_acumulado_12m DECIMAL(6, 3),
  
  -- PIB
  pib_variacao_trimestre DECIMAL(6, 3),
  pib_variacao_12m DECIMAL(6, 3),
  
  -- Outros
  taxa_desemprego DECIMAL(5, 2),
  confianca_consumidor DECIMAL(6, 2),
  
  fonte VARCHAR(50) DEFAULT 'bcb',
  data_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(data_referencia)
);

CREATE INDEX idx_macro_data ON idi_macro_indicadores (data_referencia DESC);

-- Tabela: Cache de Scores IDI Calculados
CREATE TABLE idi_score_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes DATE NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  tipo_imovel VARCHAR(50) NOT NULL DEFAULT 'residencial',
  
  -- Componentes do score
  score_preco DECIMAL(5, 2),
  score_variacao DECIMAL(5, 2),
  score_demanda DECIMAL(5, 2),
  score_liquidez DECIMAL(5, 2),
  score_macro DECIMAL(5, 2),
  
  -- Score Final IDI
  score_idi DECIMAL(5, 2),
  score_idi_normalizado DECIMAL(5, 2),
  
  -- Ranking
  ranking_nacional INTEGER,
  ranking_estadual INTEGER,
  
  -- Confiança do cálculo
  confianca_score DECIMAL(4, 3),
  fontes_utilizadas JSONB DEFAULT '[]'::jsonb,
  
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(mes, cidade, uf, tipo_imovel)
);

CREATE INDEX idx_score_cidade_mes ON idi_score_cache (cidade, uf, mes DESC);
CREATE INDEX idx_score_ranking ON idi_score_cache (ranking_nacional);

-- Enable RLS on all tables
ALTER TABLE idi_fipezap_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE idi_datazap_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE idi_mercado_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE idi_macro_indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE idi_score_cache ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (dados são públicos)
CREATE POLICY "Anyone can view FipeZap data" ON idi_fipezap_historico FOR SELECT USING (true);
CREATE POLICY "Anyone can view DataZap reports" ON idi_datazap_reports FOR SELECT USING (true);
CREATE POLICY "Anyone can view market snapshots" ON idi_mercado_snapshot FOR SELECT USING (true);
CREATE POLICY "Anyone can view macro indicators" ON idi_macro_indicadores FOR SELECT USING (true);
CREATE POLICY "Anyone can view IDI scores" ON idi_score_cache FOR SELECT USING (true);