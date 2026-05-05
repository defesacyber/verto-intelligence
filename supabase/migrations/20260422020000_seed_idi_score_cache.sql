-- Populate idi_score_cache by calculating IDI scores from idi_fipezap_historico
-- Replicates the calculateIDIScore() algorithm from idi-data-import Edge Function
-- Safe to run multiple times (ON CONFLICT DO NOTHING)
--
-- Macro assumptions (Brazil, Apr/2026 estimates):
--   SELIC: 13.75%  |  IPCA 12m: 5.0%  |  INCC 12m: 4.0%

INSERT INTO idi_score_cache (
  mes, cidade, uf, tipo_imovel,
  score_preco, score_variacao, score_demanda, score_liquidez, score_macro,
  score_idi, score_idi_normalizado,
  ranking_nacional, ranking_estadual,
  confianca_score,
  fontes_utilizadas,
  atualizado_em
)
WITH macro_params AS (
  SELECT
    13.75 AS selic,
    5.0   AS ipca_12m,
    4.0   AS incc_12m
),
macro_score AS (
  SELECT
    ROUND((
      GREATEST(15, 100 - selic   * 6)  * 0.5 +
      GREATEST(15, 100 - ipca_12m * 10) * 0.3 +
      GREATEST(15, 85  - incc_12m * 7)  * 0.2
    )::NUMERIC, 1) AS score_macro
  FROM macro_params
),
base AS (
  SELECT
    f.mes,
    f.cidade,
    f.uf,
    f.tipo_imovel,
    f.variacao_venda_12m,
    f.variacao_venda_mes,
    f.variacao_locacao_mes,
    f.preco_m2_venda,
    f.indice_locacao,
    f.variacao_locacao_12m,
    m.score_macro,

    -- score_variacao (weight 30%)
    ROUND(CASE
      WHEN f.variacao_venda_12m >= 5  AND f.variacao_venda_12m <= 9
        THEN 98 - POWER(ABS(f.variacao_venda_12m - 7)::NUMERIC, 1.5) * 3
      WHEN f.variacao_venda_12m > 9  AND f.variacao_venda_12m <= 14
        THEN 82 - (f.variacao_venda_12m - 9) * 4
      WHEN f.variacao_venda_12m > 14
        THEN GREATEST(25, 62 - (f.variacao_venda_12m - 14) * 5)
      WHEN f.variacao_venda_12m >= 2  AND f.variacao_venda_12m < 5
        THEN 60 + (f.variacao_venda_12m - 2) * 8
      WHEN f.variacao_venda_12m >= 0  AND f.variacao_venda_12m < 2
        THEN 40 + f.variacao_venda_12m * 10
      ELSE GREATEST(15, 40 + f.variacao_venda_12m * 5)
    END::NUMERIC, 1) AS score_variacao,

    -- score_preco (weight 25%)
    ROUND(CASE
      WHEN f.preco_m2_venda >= 8000  AND f.preco_m2_venda <= 14000
        THEN 75 + LEAST(23, (f.preco_m2_venda - 8000) / 260)
      WHEN f.preco_m2_venda > 14000 AND f.preco_m2_venda <= 20000
        THEN 92 - (f.preco_m2_venda - 14000) / 600
      WHEN f.preco_m2_venda > 20000
        THEN GREATEST(55, 82 - (f.preco_m2_venda - 20000) / 400)
      WHEN f.preco_m2_venda >= 4000  AND f.preco_m2_venda < 8000
        THEN 50 + (f.preco_m2_venda - 4000) / 160
      ELSE GREATEST(25, 30 + f.preco_m2_venda / 160)
    END::NUMERIC, 1) AS score_preco,

    -- inputs for score_demanda
    COALESCE(f.variacao_venda_mes,   0.5) * 0.7
      + COALESCE(f.variacao_locacao_mes, 0.3) * 0.3  AS demanda_real,

    -- inputs for score_liquidez
    (COALESCE(f.indice_locacao, 100) - 100) * 0.4
      + COALESCE(f.variacao_locacao_12m, 3) * 5       AS liquidez_real

  FROM idi_fipezap_historico f
  CROSS JOIN macro_score m
),
scored AS (
  SELECT
    mes, cidade, uf, tipo_imovel,
    score_macro,
    score_variacao,
    score_preco,

    -- score_demanda (weight 20%)
    ROUND(CASE
      WHEN demanda_real >= 1.0 THEN LEAST(98, 85 + demanda_real * 8)
      WHEN demanda_real >= 0.6 THEN 70 + (demanda_real - 0.6) * 37.5
      WHEN demanda_real >= 0.3 THEN 55 + (demanda_real - 0.3) * 50
      WHEN demanda_real >= 0   THEN 40 + demanda_real * 50
      ELSE GREATEST(15, 40 + demanda_real * 20)
    END::NUMERIC, 1) AS score_demanda,

    -- score_liquidez (weight 10%)
    ROUND(CASE
      WHEN liquidez_real >= 25 THEN LEAST(95, 80 + liquidez_real * 0.6)
      WHEN liquidez_real >= 10 THEN 65 + liquidez_real
      WHEN liquidez_real >= 0  THEN 50 + liquidez_real * 1.5
      ELSE GREATEST(25, 50 + liquidez_real)
    END::NUMERIC, 1) AS score_liquidez

  FROM base
),
with_idi AS (
  SELECT *,
    ROUND(LEAST(100, GREATEST(0,
      score_variacao * 0.30 +
      score_preco    * 0.25 +
      score_demanda  * 0.20 +
      score_liquidez * 0.10 +
      score_macro    * 0.15
    ))::NUMERIC, 1) AS score_idi
  FROM scored
),
with_ranks AS (
  SELECT *,
    RANK() OVER (PARTITION BY mes         ORDER BY score_idi DESC)::INTEGER AS ranking_nacional,
    RANK() OVER (PARTITION BY mes, uf     ORDER BY score_idi DESC)::INTEGER AS ranking_estadual
  FROM with_idi
)
SELECT
  mes,
  cidade,
  uf,
  tipo_imovel,
  score_preco,
  score_variacao,
  score_demanda,
  score_liquidez,
  score_macro,
  score_idi,
  score_idi                                            AS score_idi_normalizado,
  ranking_nacional,
  ranking_estadual,
  0.90::DECIMAL(4,3)                                   AS confianca_score,
  '["fipezap_historico","seed_estimativa"]'::JSONB     AS fontes_utilizadas,
  NOW()                                                AS atualizado_em
FROM with_ranks
ON CONFLICT (mes, cidade, uf, tipo_imovel) DO NOTHING;

SELECT 'IDI scores calculados: ' || COUNT(*) || ' linhas em idi_score_cache'
FROM idi_score_cache;
