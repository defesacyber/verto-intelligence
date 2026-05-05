-- ============================================
-- SEED COMPLETO: Dados de Mercado para TODAS as 26 Cidades
-- ============================================
-- Execute este script para popular market_data_cache com dados realistas
-- Dados estimados baseados em médias de mercado por região

INSERT INTO public.market_data_cache (
  city_id, price_m2_avg, price_m2_low_segment, price_m2_mid_segment,
  price_m2_high_segment, price_variation_12m, demand_index, stock_units,
  absorption_months, absorption_rate, units_launched_month, units_sold_month,
  rental_yield, avg_days_on_market, confidence_index, attractiveness_score,
  source, data_period, expires_at
) VALUES
-- São Paulo - Principal mercado do país
(3550308, 8500.00, 6200.00, 8500.00, 12800.00, 5.2, 75, 12500, 18.5, 4.8, 850, 720, 4.5, 65, 72, 7.8, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Rio de Janeiro - Segundo maior mercado
(3304557, 7800.00, 5800.00, 7800.00, 11500.00, 4.8, 68, 9800, 20.2, 4.3, 680, 580, 4.8, 72, 65, 7.2, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Belo Horizonte - Mercado forte em MG
(3106200, 6200.00, 4500.00, 6200.00, 9200.00, 6.1, 72, 5200, 16.8, 5.2, 420, 380, 5.2, 58, 70, 8.1, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Brasília - Capital federal, mercado premium
(5300108, 7200.00, 5200.00, 7200.00, 10500.00, 5.5, 70, 4800, 17.5, 4.9, 380, 330, 4.9, 62, 68, 7.6, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Curitiba - Mercado sólido do Sul
(4106902, 6800.00, 4900.00, 6800.00, 9900.00, 5.8, 71, 4200, 18.2, 4.7, 340, 290, 5.0, 66, 69, 7.5, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Porto Alegre - Capital do RS
(4314902, 6500.00, 4700.00, 6500.00, 9500.00, 5.3, 67, 3800, 19.5, 4.4, 310, 260, 5.1, 70, 66, 7.3, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Manaus - Norte, mercado em crescimento
(1302603, 5200.00, 3800.00, 5200.00, 7800.00, 6.5, 73, 2100, 15.3, 5.6, 180, 150, 5.5, 55, 71, 7.9, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Salvador - Nordeste, turismo forte
(2927408, 5800.00, 4200.00, 5800.00, 8500.00, 5.9, 69, 3500, 17.8, 4.8, 290, 245, 5.3, 68, 67, 7.4, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Fortaleza - Nordeste, em expansão
(2304400, 5500.00, 4000.00, 5500.00, 8200.00, 6.2, 70, 3200, 16.9, 5.1, 270, 230, 5.4, 63, 69, 7.6, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Goiânia - Centro-Oeste, estável
(5208707, 5900.00, 4300.00, 5900.00, 8700.00, 5.7, 68, 2800, 18.1, 4.7, 240, 205, 5.2, 67, 66, 7.3, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Recife - Nordeste, mercado tradicional
(2611606, 5600.00, 4100.00, 5600.00, 8300.00, 5.4, 67, 3100, 18.7, 4.6, 260, 220, 5.3, 69, 65, 7.2, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Belém - Norte, porto importante
(1501402, 5100.00, 3700.00, 5100.00, 7600.00, 6.3, 71, 1900, 16.2, 5.3, 165, 140, 5.5, 60, 70, 7.7, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Guarulhos - Grande SP, industrial
(3518800, 7200.00, 5300.00, 7200.00, 10800.00, 5.0, 73, 4500, 17.3, 5.0, 380, 320, 4.7, 64, 71, 7.7, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Campinas - Interior SP, tecnologia
(3509502, 6900.00, 5000.00, 6900.00, 10200.00, 5.1, 72, 4100, 17.6, 4.9, 350, 295, 4.8, 65, 70, 7.6, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Florianópolis - Sul, turismo e qualidade de vida
(4205407, 9200.00, 6800.00, 9200.00, 13800.00, 4.5, 65, 2200, 21.5, 4.0, 185, 155, 4.2, 75, 63, 6.9, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- São Luís - Nordeste, porto
(2111300, 5300.00, 3900.00, 5300.00, 7900.00, 6.0, 69, 2300, 17.2, 5.0, 195, 165, 5.4, 64, 68, 7.5, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Macapá - Norte, fronteira
(1600303, 4800.00, 3500.00, 4800.00, 7200.00, 6.7, 74, 1200, 14.8, 5.8, 105, 90, 5.7, 52, 73, 8.0, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Maceió - Nordeste, litoral
(2704302, 5400.00, 3900.00, 5400.00, 8100.00, 5.8, 68, 2600, 17.9, 4.8, 220, 185, 5.3, 68, 66, 7.3, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- João Pessoa - Nordeste, qualidade de vida
(2507507, 5200.00, 3800.00, 5200.00, 7800.00, 5.9, 69, 2400, 17.5, 4.9, 205, 175, 5.3, 66, 67, 7.4, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Aracaju - Nordeste, pequeno mas estável
(2800308, 5100.00, 3700.00, 5100.00, 7600.00, 6.1, 70, 2100, 16.8, 5.1, 180, 155, 5.4, 64, 69, 7.6, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Palmas - Centro-Oeste, planejada
(1721000, 5500.00, 4000.00, 5500.00, 8200.00, 6.4, 72, 1400, 15.6, 5.5, 125, 105, 5.5, 58, 71, 7.8, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Rio Branco - Norte, fronteira
(1200401, 4600.00, 3400.00, 4600.00, 6900.00, 6.9, 75, 1100, 14.2, 6.0, 98, 85, 5.8, 50, 74, 8.1, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Porto Velho - Norte, desenvolvimento
(1100205, 4900.00, 3600.00, 4900.00, 7300.00, 6.6, 73, 1300, 14.9, 5.7, 115, 98, 5.6, 54, 72, 7.9, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Boa Vista - Norte, fronteira
(1400100, 4700.00, 3500.00, 4700.00, 7000.00, 6.8, 74, 1050, 14.5, 5.9, 92, 80, 5.7, 51, 73, 8.0, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Cuiabá - Centro-Oeste, agronegócio
(5103403, 5700.00, 4200.00, 5700.00, 8500.00, 5.6, 69, 2500, 17.8, 4.8, 215, 182, 5.3, 67, 67, 7.4, 'estimated', '2026-01', NOW() + INTERVAL '30 days'),
-- Campo Grande - Centro-Oeste, estável
(5002704, 5600.00, 4100.00, 5600.00, 8400.00, 5.7, 68, 2400, 18.0, 4.8, 205, 173, 5.2, 68, 66, 7.3, 'estimated', '2026-01', NOW() + INTERVAL '30 days')
ON CONFLICT (city_id, neighborhood_id, data_period) DO UPDATE SET
  price_m2_avg = EXCLUDED.price_m2_avg,
  price_m2_low_segment = EXCLUDED.price_m2_low_segment,
  price_m2_mid_segment = EXCLUDED.price_m2_mid_segment,
  price_m2_high_segment = EXCLUDED.price_m2_high_segment,
  price_variation_12m = EXCLUDED.price_variation_12m,
  demand_index = EXCLUDED.demand_index,
  stock_units = EXCLUDED.stock_units,
  absorption_months = EXCLUDED.absorption_months,
  absorption_rate = EXCLUDED.absorption_rate,
  units_launched_month = EXCLUDED.units_launched_month,
  units_sold_month = EXCLUDED.units_sold_month,
  rental_yield = EXCLUDED.rental_yield,
  avg_days_on_market = EXCLUDED.avg_days_on_market,
  confidence_index = EXCLUDED.confidence_index,
  attractiveness_score = EXCLUDED.attractiveness_score,
  updated_at = NOW();

-- Verificar inserção
SELECT COUNT(*) as total_inserido FROM public.market_data_cache;

-- Visualizar dados por região
SELECT
  c.nome as cidade,
  c.uf,
  mdc.price_m2_avg as preco_m2,
  mdc.demand_index as demanda,
  mdc.attractiveness_score as atratividade
FROM public.market_data_cache mdc
JOIN public.cities c ON c.id = mdc.city_id
ORDER BY mdc.attractiveness_score DESC
LIMIT 10;
