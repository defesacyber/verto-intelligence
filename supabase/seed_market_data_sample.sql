-- Seed: Dados de mercado estimados (amostra)
-- Execute este script para popular dados iniciais de mercado
-- NOTA: Estes são dados estimados. Em produção, serão substituídos por dados reais das APIs

-- Dados para São Paulo
INSERT INTO public.market_data_cache (
  city_id, price_m2_avg, price_m2_low_segment, price_m2_mid_segment,
  price_m2_high_segment, price_variation_12m, demand_index, stock_units,
  absorption_months, absorption_rate, units_launched_month, units_sold_month,
  rental_yield, avg_days_on_market, confidence_index, attractiveness_score,
  source, data_period, expires_at
) VALUES (
  3550308, -- São Paulo
  8500.00, 6200.00, 8500.00, 12800.00,
  5.2, 75, 12500, 18.5, 4.8, 850, 720,
  4.5, 65, 72, 7.8,
  'estimated', '2026-01', NOW() + INTERVAL '30 days'
)
ON CONFLICT (city_id, neighborhood_id, data_period) DO NOTHING;

-- Dados para Rio de Janeiro
INSERT INTO public.market_data_cache (
  city_id, price_m2_avg, price_m2_low_segment, price_m2_mid_segment,
  price_m2_high_segment, price_variation_12m, demand_index, stock_units,
  absorption_months, absorption_rate, units_launched_month, units_sold_month,
  rental_yield, avg_days_on_market, confidence_index, attractiveness_score,
  source, data_period, expires_at
) VALUES (
  3304557, -- Rio de Janeiro
  7800.00, 5800.00, 7800.00, 11500.00,
  4.8, 68, 9800, 20.2, 4.3, 680, 580,
  4.8, 72, 65, 7.2,
  'estimated', '2026-01', NOW() + INTERVAL '30 days'
)
ON CONFLICT (city_id, neighborhood_id, data_period) DO NOTHING;

-- Dados para Belo Horizonte
INSERT INTO public.market_data_cache (
  city_id, price_m2_avg, price_m2_low_segment, price_m2_mid_segment,
  price_m2_high_segment, price_variation_12m, demand_index, stock_units,
  absorption_months, absorption_rate, units_launched_month, units_sold_month,
  rental_yield, avg_days_on_market, confidence_index, attractiveness_score,
  source, data_period, expires_at
) VALUES (
  3106200, -- Belo Horizonte
  6200.00, 4500.00, 6200.00, 9200.00,
  6.1, 72, 5200, 16.8, 5.2, 420, 380,
  5.2, 58, 70, 8.1,
  'estimated', '2026-01', NOW() + INTERVAL '30 days'
)
ON CONFLICT (city_id, neighborhood_id, data_period) DO NOTHING;

-- Dados para Brasília
INSERT INTO public.market_data_cache (
  city_id, price_m2_avg, price_m2_low_segment, price_m2_mid_segment,
  price_m2_high_segment, price_variation_12m, demand_index, stock_units,
  absorption_months, absorption_rate, units_launched_month, units_sold_month,
  rental_yield, avg_days_on_market, confidence_index, attractiveness_score,
  source, data_period, expires_at
) VALUES (
  5300108, -- Brasília
  7200.00, 5200.00, 7200.00, 10500.00,
  5.5, 70, 4800, 17.5, 4.9, 380, 330,
  4.9, 62, 68, 7.6,
  'estimated', '2026-01', NOW() + INTERVAL '30 days'
)
ON CONFLICT (city_id, neighborhood_id, data_period) DO NOTHING;

-- Dados para Curitiba
INSERT INTO public.market_data_cache (
  city_id, price_m2_avg, price_m2_low_segment, price_m2_mid_segment,
  price_m2_high_segment, price_variation_12m, demand_index, stock_units,
  absorption_months, absorption_rate, units_launched_month, units_sold_month,
  rental_yield, avg_days_on_market, confidence_index, attractiveness_score,
  source, data_period, expires_at
) VALUES (
  4106902, -- Curitiba
  6800.00, 4900.00, 6800.00, 9900.00,
  5.8, 71, 4200, 18.2, 4.7, 340, 290,
  5.0, 66, 69, 7.5,
  'estimated', '2026-01', NOW() + INTERVAL '30 days'
)
ON CONFLICT (city_id, neighborhood_id, data_period) DO NOTHING;

-- Verificar inserção
SELECT
  c.nome,
  c.uf,
  mdc.price_m2_avg,
  mdc.demand_index,
  mdc.attractiveness_score,
  mdc.source
FROM public.market_data_cache mdc
JOIN public.cities c ON c.id = mdc.city_id
ORDER BY mdc.attractiveness_score DESC;
