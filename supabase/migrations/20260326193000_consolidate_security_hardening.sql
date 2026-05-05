-- Consolidates ad-hoc security fixes into an official, idempotent migration.
-- Safe to run multiple times.

-- 1) Ensure RLS is enabled on reference/public tables.
ALTER TABLE IF EXISTS public.city_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recurring_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_history ENABLE ROW LEVEL SECURITY;

-- 2) Recreate key policies idempotently.
DROP POLICY IF EXISTS "Allow public read access" ON public.city_market_data;
DROP POLICY IF EXISTS "Anyone can view city market data" ON public.city_market_data;
DROP POLICY IF EXISTS "Only admins can modify city market data" ON public.city_market_data;
DROP POLICY IF EXISTS "city_market_data_policy" ON public.city_market_data;
CREATE POLICY "city_market_data_policy"
ON public.city_market_data
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow public read access" ON public.regions;
DROP POLICY IF EXISTS "Anyone can view regions" ON public.regions;
DROP POLICY IF EXISTS "Only admins can modify regions" ON public.regions;
CREATE POLICY "regions_policy"
ON public.regions
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow public read access" ON public.neighborhoods;
DROP POLICY IF EXISTS "Anyone can view neighborhoods" ON public.neighborhoods;
DROP POLICY IF EXISTS "Only admins can modify neighborhoods" ON public.neighborhoods;
DROP POLICY IF EXISTS "neighborhoods_policy" ON public.neighborhoods;
CREATE POLICY "neighborhoods_policy"
ON public.neighborhoods
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow public read access" ON public.sectors;
DROP POLICY IF EXISTS "Anyone can view sectors" ON public.sectors;
DROP POLICY IF EXISTS "Only admins can modify sectors" ON public.sectors;
CREATE POLICY "sectors_policy"
ON public.sectors
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow authenticated read access" ON public.recurring_reports;
DROP POLICY IF EXISTS "Anyone can view recurring reports" ON public.recurring_reports;
DROP POLICY IF EXISTS "Only admins can modify recurring reports" ON public.recurring_reports;
CREATE POLICY "recurring_reports_policy"
ON public.recurring_reports
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can view own email history" ON public.email_history;
DROP POLICY IF EXISTS "email_history_policy" ON public.email_history;
CREATE POLICY "email_history_policy"
ON public.email_history
AS PERMISSIVE
FOR ALL
TO public
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3) Harden function search_path to avoid implicit schema resolution.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 4) Recreate timestamp triggers to ensure they point to the hardened function.
DO $$
DECLARE
  tbl TEXT;
  trg TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users',
    'subscriptions',
    'projects',
    'reports',
    'notification_preferences',
    'email_history',
    'city_market_data',
    'neighborhoods'
  ]
  LOOP
    trg := 'update_' || tbl || '_updated_at';
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trg, tbl);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      trg,
      tbl
    );
  END LOOP;
END $$;

-- 5) Ensure views are security_invoker so underlying RLS is respected.
ALTER VIEW IF EXISTS public.active_subscriptions SET (security_invoker = true);
ALTER VIEW IF EXISTS public.projects_summary SET (security_invoker = true);
