-- Seed: Popular planos de assinatura
-- Execute este script no Supabase SQL Editor após aplicar as migrations

INSERT INTO public.subscription_plans (name, slug, price_monthly, price_yearly, features, limits, is_active)
VALUES
(
  'Gratuito',
  'free',
  0.00,
  0.00,
  '["1 projeto simultâneo", "Relatórios básicos", "Dados de 5 cidades", "Análise de viabilidade simples"]'::jsonb,
  '{"projects": 1, "reports_per_month": 5, "cities": 5, "api_calls_per_day": 100}'::jsonb,
  true
),
(
  'Profissional',
  'pro',
  99.00,
  990.00,
  '["10 projetos simultâneos", "Relatórios avançados", "Alertas de IDI", "Dados de todas as cidades", "Suporte por email", "Exportação PDF/Excel", "Análise de viabilidade completa", "Comparativo de cidades"]'::jsonb,
  '{"projects": 10, "reports_per_month": 100, "cities": -1, "api_calls_per_day": 1000}'::jsonb,
  true
),
(
  'Empresarial',
  'enterprise',
  299.00,
  2990.00,
  '["Projetos ilimitados", "API completa", "Alertas personalizados", "Suporte prioritário 24/7", "Consultoria mensal", "Dados históricos completos", "Webhooks", "Integrações customizadas", "White label"]'::jsonb,
  '{"projects": -1, "reports_per_month": -1, "cities": -1, "api_calls_per_day": -1, "api_access": true, "webhooks": true}'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  updated_at = now();

-- Verificar inserção
SELECT id, name, slug, price_monthly, is_active
FROM public.subscription_plans
ORDER BY price_monthly;
