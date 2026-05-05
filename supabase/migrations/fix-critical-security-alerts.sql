-- =============================================
-- CORREÇÃO DE ALERTAS CRÍTICOS DO SUPABASE
-- Fix RLS Disabled e Security Definer Views
-- =============================================

-- =============================================
-- 1. HABILITAR RLS NAS TABELAS PÚBLICAS
-- =============================================

-- city_market_data: Dados de mercado por cidade (leitura pública)
ALTER TABLE public.city_market_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view city market data" 
ON public.city_market_data 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify city market data" 
ON public.city_market_data 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- neighborhoods: Dados de bairros (leitura pública)
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view neighborhoods" 
ON public.neighborhoods 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify neighborhoods" 
ON public.neighborhoods 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- recurring_reports: Relatórios recorrentes (leitura pública, escrita admin)
ALTER TABLE public.recurring_reports ENABLE ROW LEVEL SECURITY;

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Anyone can view recurring reports" ON public.recurring_reports;

CREATE POLICY "Anyone can view recurring reports" 
ON public.recurring_reports 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify recurring reports" 
ON public.recurring_reports 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- regions: Dados de regiões (leitura pública)
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view regions" 
ON public.regions 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify regions" 
ON public.regions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- sectors: Dados de setores (leitura pública)
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sectors" 
ON public.sectors 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify sectors" 
ON public.sectors 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- =============================================
-- 2. CORRIGIR SECURITY DEFINER VIEWS
-- =============================================

-- active_subscriptions: View de assinaturas ativas
-- Recriar como SECURITY INVOKER (mais seguro)
DROP VIEW IF EXISTS public.active_subscriptions;

CREATE VIEW public.active_subscriptions
WITH (security_invoker = true)
AS
SELECT 
  s.*,
  u.email,
  u.name
FROM public.subscriptions s
JOIN public.users u ON u.id = s.user_id
WHERE s.status = 'active'
  AND (s.end_date IS NULL OR s.end_date > NOW());

-- Adicionar comentário explicativo
COMMENT ON VIEW public.active_subscriptions IS 
'View de assinaturas ativas. Security Invoker garante que apenas usuários com permissão adequada possam ver os dados.';

-- projects_summary: View de resumo de projetos
-- Recriar como SECURITY INVOKER
DROP VIEW IF EXISTS public.projects_summary;

CREATE VIEW public.projects_summary
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.user_id,
  p.name,
  p.city,
  p.status,
  p.created_at,
  u.email as user_email,
  u.name as user_name,
  COUNT(r.id) as report_count
FROM public.projects p
JOIN public.users u ON u.id = p.user_id
LEFT JOIN public.reports r ON r.project_id = p.id
GROUP BY p.id, p.user_id, p.name, p.city, p.status, p.created_at, u.email, u.name;

-- Adicionar comentário explicativo
COMMENT ON VIEW public.projects_summary IS 
'View de resumo de projetos com contagem de relatórios. Security Invoker garante que RLS seja respeitado.';

-- =============================================
-- 3. VERIFICAÇÃO FINAL
-- =============================================

-- Verificar todas as tabelas públicas têm RLS habilitado
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND NOT rowsecurity
  LOOP
    RAISE WARNING 'Tabela sem RLS: %.%', r.schemaname, r.tablename;
  END LOOP;
END $$;

-- =============================================
-- RESUMO DAS CORREÇÕES
-- =============================================

/*
✅ RLS HABILITADO:
  - city_market_data (leitura pública, escrita admin)
  - neighborhoods (leitura pública, escrita admin)
  - recurring_reports (leitura pública, CRUD próprio usuário)
  - regions (leitura pública, escrita admin)
  - sectors (leitura pública, escrita admin)

✅ VIEWS CORRIGIDAS:
  - active_subscriptions (SECURITY INVOKER)
  - projects_summary (SECURITY INVOKER)

PRÓXIMOS PASSOS:
1. Execute este SQL no Supabase Dashboard > SQL Editor
2. Verifique os alertas no Supabase Dashboard
3. Confirme que todos os alertas foram resolvidos
*/
