-- IDI Tables + Seed: create tables if they don't exist, then seed 24 months of data
-- Safe to run multiple times (IF NOT EXISTS + ON CONFLICT DO NOTHING)

-- =============================================
-- TABELAS IDI (idempotentes)
-- =============================================

CREATE TABLE IF NOT EXISTS idi_fipezap_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes DATE NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  tipo_imovel VARCHAR(50) NOT NULL DEFAULT 'residencial',
  indice_venda DECIMAL(10, 4),
  variacao_venda_mes DECIMAL(6, 3),
  variacao_venda_12m DECIMAL(6, 3),
  preco_m2_venda DECIMAL(12, 2),
  indice_locacao DECIMAL(10, 4),
  variacao_locacao_mes DECIMAL(6, 3),
  variacao_locacao_12m DECIMAL(6, 3),
  preco_m2_locacao DECIMAL(12, 2),
  fonte VARCHAR(50) DEFAULT 'fipe',
  data_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mes, cidade, uf, tipo_imovel)
);

CREATE TABLE IF NOT EXISTS idi_datazap_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_publicacao DATE NOT NULL,
  tipo_relatorio VARCHAR(50) NOT NULL,
  titulo VARCHAR(255),
  descricao TEXT,
  cidades_em_alta JSONB DEFAULT '[]'::jsonb,
  cidades_em_queda JSONB DEFAULT '[]'::jsonb,
  preco_medio_nacional DECIMAL(12, 2),
  variacao_nacional_mes DECIMAL(6, 3),
  volume_total_anuncios INTEGER,
  dias_venda_media INTEGER,
  indice_demanda DECIMAL(6, 3),
  indice_oferta DECIMAL(6, 3),
  pdf_url VARCHAR(500),
  data_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(data_publicacao, tipo_relatorio)
);

CREATE TABLE IF NOT EXISTS idi_mercado_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_coleta DATE NOT NULL DEFAULT CURRENT_DATE,
  cidade VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  bairro VARCHAR(100) DEFAULT '',
  preco_m2_medio DECIMAL(12, 2),
  preco_m2_min DECIMAL(12, 2),
  preco_m2_max DECIMAL(12, 2),
  anuncios_ativos INTEGER,
  anuncios_novos_dia INTEGER,
  dias_venda_media INTEGER,
  apartamentos_pct DECIMAL(5, 2),
  casas_pct DECIMAL(5, 2),
  comercial_pct DECIMAL(5, 2),
  fonte VARCHAR(50) DEFAULT 'agregado',
  UNIQUE(data_coleta, cidade, uf, bairro)
);

CREATE TABLE IF NOT EXISTS idi_macro_indicadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_referencia DATE NOT NULL,
  selic_meta DECIMAL(6, 3),
  selic_acumulada_mes DECIMAL(8, 5),
  ipca_mes DECIMAL(6, 3),
  ipca_acumulado_12m DECIMAL(6, 3),
  incc_mes DECIMAL(6, 3),
  incc_acumulado_12m DECIMAL(6, 3),
  igpm_mes DECIMAL(6, 3),
  igpm_acumulado_12m DECIMAL(6, 3),
  pib_variacao_trimestre DECIMAL(6, 3),
  pib_variacao_12m DECIMAL(6, 3),
  taxa_desemprego DECIMAL(5, 2),
  confianca_consumidor DECIMAL(6, 2),
  fonte VARCHAR(50) DEFAULT 'bcb',
  data_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(data_referencia)
);

CREATE TABLE IF NOT EXISTS idi_score_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes DATE NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  uf VARCHAR(5) NOT NULL,
  tipo_imovel VARCHAR(50) NOT NULL DEFAULT 'residencial',
  score_preco DECIMAL(5, 2),
  score_variacao DECIMAL(5, 2),
  score_demanda DECIMAL(5, 2),
  score_liquidez DECIMAL(5, 2),
  score_macro DECIMAL(5, 2),
  score_idi DECIMAL(5, 2),
  score_idi_normalizado DECIMAL(5, 2),
  ranking_nacional INTEGER,
  ranking_estadual INTEGER,
  confianca_score DECIMAL(4, 3),
  fontes_utilizadas JSONB DEFAULT '[]'::jsonb,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mes, cidade, uf, tipo_imovel)
);

-- Índices (idempotentes)
CREATE INDEX IF NOT EXISTS idx_fipezap_cidade_mes ON idi_fipezap_historico (cidade, mes DESC);
CREATE INDEX IF NOT EXISTS idx_fipezap_uf_mes ON idi_fipezap_historico (uf, mes DESC);
CREATE INDEX IF NOT EXISTS idx_macro_data ON idi_macro_indicadores (data_referencia DESC);
CREATE INDEX IF NOT EXISTS idx_score_cidade_mes ON idi_score_cache (cidade, uf, mes DESC);
CREATE INDEX IF NOT EXISTS idx_score_ranking ON idi_score_cache (ranking_nacional);
CREATE INDEX IF NOT EXISTS idx_snapshot_cidade_data ON idi_mercado_snapshot (cidade, uf, data_coleta DESC);

-- RLS
ALTER TABLE idi_fipezap_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE idi_datazap_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE idi_mercado_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE idi_macro_indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE idi_score_cache ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (idempotentes com DO NOTHING)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view FipeZap data' AND tablename = 'idi_fipezap_historico') THEN
    CREATE POLICY "Anyone can view FipeZap data" ON idi_fipezap_historico FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view IDI scores' AND tablename = 'idi_score_cache') THEN
    CREATE POLICY "Anyone can view IDI scores" ON idi_score_cache FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view macro indicators' AND tablename = 'idi_macro_indicadores') THEN
    CREATE POLICY "Anyone can view macro indicators" ON idi_macro_indicadores FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view market snapshots' AND tablename = 'idi_mercado_snapshot') THEN
    CREATE POLICY "Anyone can view market snapshots" ON idi_mercado_snapshot FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view DataZap reports' AND tablename = 'idi_datazap_reports') THEN
    CREATE POLICY "Anyone can view DataZap reports" ON idi_datazap_reports FOR SELECT USING (true);
  END IF;
END $$;

-- =============================================
-- SEED: 24 meses de dados históricos estimados
-- Baseado em preços IDI Brasil alinhados com
-- benchmarks de mercado por cidade
-- =============================================

DO $$
DECLARE
  city_data JSONB := '[
    {"cidade":"São Paulo","uf":"SP","preco_base":12500,"var_anual":5.2,"preco_loc_m2":65},
    {"cidade":"Rio de Janeiro","uf":"RJ","preco_base":10800,"var_anual":4.8,"preco_loc_m2":56},
    {"cidade":"Belo Horizonte","uf":"MG","preco_base":8200,"var_anual":4.0,"preco_loc_m2":42},
    {"cidade":"Curitiba","uf":"PR","preco_base":9800,"var_anual":5.5,"preco_loc_m2":50},
    {"cidade":"Porto Alegre","uf":"RS","preco_base":8500,"var_anual":3.2,"preco_loc_m2":43},
    {"cidade":"Florianópolis","uf":"SC","preco_base":12800,"var_anual":6.2,"preco_loc_m2":60},
    {"cidade":"Brasília","uf":"DF","preco_base":11200,"var_anual":4.2,"preco_loc_m2":55},
    {"cidade":"Goiânia","uf":"GO","preco_base":6500,"var_anual":5.8,"preco_loc_m2":34},
    {"cidade":"Salvador","uf":"BA","preco_base":7500,"var_anual":3.8,"preco_loc_m2":38},
    {"cidade":"Recife","uf":"PE","preco_base":7800,"var_anual":4.0,"preco_loc_m2":40},
    {"cidade":"Fortaleza","uf":"CE","preco_base":7200,"var_anual":4.2,"preco_loc_m2":37},
    {"cidade":"Manaus","uf":"AM","preco_base":5800,"var_anual":3.5,"preco_loc_m2":30},
    {"cidade":"Belém","uf":"PA","preco_base":5500,"var_anual":3.2,"preco_loc_m2":28},
    {"cidade":"Campinas","uf":"SP","preco_base":8900,"var_anual":4.8,"preco_loc_m2":46},
    {"cidade":"Natal","uf":"RN","preco_base":6800,"var_anual":3.8,"preco_loc_m2":35},
    {"cidade":"Joinville","uf":"SC","preco_base":8200,"var_anual":5.0,"preco_loc_m2":42},
    {"cidade":"Londrina","uf":"PR","preco_base":7200,"var_anual":4.2,"preco_loc_m2":37},
    {"cidade":"Campo Grande","uf":"MS","preco_base":5200,"var_anual":3.5,"preco_loc_m2":27},
    {"cidade":"Cuiabá","uf":"MT","preco_base":5800,"var_anual":4.0,"preco_loc_m2":30},
    {"cidade":"Vitória","uf":"ES","preco_base":9200,"var_anual":3.8,"preco_loc_m2":47},
    {"cidade":"João Pessoa","uf":"PB","preco_base":6500,"var_anual":4.0,"preco_loc_m2":33},
    {"cidade":"Maceió","uf":"AL","preco_base":6200,"var_anual":3.5,"preco_loc_m2":32},
    {"cidade":"Aracaju","uf":"SE","preco_base":6000,"var_anual":3.5,"preco_loc_m2":31},
    {"cidade":"Teresina","uf":"PI","preco_base":5500,"var_anual":3.2,"preco_loc_m2":28},
    {"cidade":"São Luís","uf":"MA","preco_base":5800,"var_anual":3.3,"preco_loc_m2":30},
    {"cidade":"Uberlândia","uf":"MG","preco_base":7200,"var_anual":4.0,"preco_loc_m2":37},
    {"cidade":"Ribeirão Preto","uf":"SP","preco_base":8200,"var_anual":4.5,"preco_loc_m2":42},
    {"cidade":"Santos","uf":"SP","preco_base":10200,"var_anual":5.5,"preco_loc_m2":52},
    {"cidade":"São José dos Campos","uf":"SP","preco_base":9500,"var_anual":5.0,"preco_loc_m2":48},
    {"cidade":"Niterói","uf":"RJ","preco_base":9500,"var_anual":4.5,"preco_loc_m2":48},
    {"cidade":"Maringá","uf":"PR","preco_base":7500,"var_anual":4.5,"preco_loc_m2":38},
    {"cidade":"Caxias do Sul","uf":"RS","preco_base":7000,"var_anual":3.8,"preco_loc_m2":36},
    {"cidade":"Palmas","uf":"TO","preco_base":5800,"var_anual":4.0,"preco_loc_m2":30},
    {"cidade":"Porto Velho","uf":"RO","preco_base":5500,"var_anual":3.5,"preco_loc_m2":28},
    {"cidade":"Rio Branco","uf":"AC","preco_base":4500,"var_anual":2.8,"preco_loc_m2":23},
    {"cidade":"Macapá","uf":"AP","preco_base":4800,"var_anual":3.0,"preco_loc_m2":25},
    {"cidade":"Boa Vista","uf":"RR","preco_base":5200,"var_anual":3.2,"preco_loc_m2":27}
  ]'::JSONB;
  c          JSONB;
  mes_ref    DATE;
  i          INTEGER;
  preco_v    NUMERIC;
  preco_l    NUMERIC;
  var_m      NUMERIC;
  var_l_m    NUMERIC;
  indice_v   NUMERIC;
  base_price NUMERIC;
  base_loc   NUMERIC;
  var_anual  NUMERIC;
BEGIN
  FOR c IN SELECT * FROM jsonb_array_elements(city_data) LOOP
    base_price := (c->>'preco_base')::NUMERIC;
    base_loc   := (c->>'preco_loc_m2')::NUMERIC;
    var_anual  := (c->>'var_anual')::NUMERIC;

    FOR i IN 0..23 LOOP
      mes_ref := DATE_TRUNC('month', CURRENT_DATE) - (i || ' months')::INTERVAL;
      var_m   := ROUND((var_anual / 12.0 + (CASE WHEN i % 3 = 0 THEN 0.05 ELSE -0.02 END))::NUMERIC, 3);
      var_l_m := ROUND((var_m * 1.1)::NUMERIC, 3);
      preco_v  := ROUND((base_price / POWER(1 + var_anual / 100.0, i::NUMERIC / 12.0))::NUMERIC, 2);
      preco_l  := ROUND((base_loc  / POWER(1 + var_anual / 100.0, i::NUMERIC / 12.0))::NUMERIC, 2);
      indice_v := ROUND((preco_v / 6000.0)::NUMERIC, 4);

      INSERT INTO public.idi_fipezap_historico (
        mes, cidade, uf, tipo_imovel,
        indice_venda, variacao_venda_mes, variacao_venda_12m, preco_m2_venda,
        indice_locacao, variacao_locacao_mes, variacao_locacao_12m, preco_m2_locacao,
        fonte
      ) VALUES (
        mes_ref, c->>'cidade', c->>'uf', 'residencial',
        indice_v, var_m, var_anual, preco_v,
        ROUND((indice_v * 0.45)::NUMERIC, 4), var_l_m,
        ROUND((var_anual * 1.1)::NUMERIC, 3), preco_l,
        'seed_estimativa'
      )
      ON CONFLICT (mes, cidade, uf, tipo_imovel) DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seed concluído: idi_fipezap_historico populada com 24 meses × 37 cidades';
END;
$$;
