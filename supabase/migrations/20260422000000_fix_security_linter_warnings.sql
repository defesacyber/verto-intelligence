-- Fix 1: function_search_path_mutable
-- Prevents search_path injection attacks
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix 2: city_market_data — split permissive ALL policy into SELECT (public) + DML (admin only)
DROP POLICY IF EXISTS city_market_data_policy ON public.city_market_data;

CREATE POLICY "city_market_data_select" ON public.city_market_data
  FOR SELECT USING (true);

CREATE POLICY "city_market_data_insert" ON public.city_market_data
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND (users.role)::text = 'admin')
  );

CREATE POLICY "city_market_data_update" ON public.city_market_data
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND (users.role)::text = 'admin')
  );

CREATE POLICY "city_market_data_delete" ON public.city_market_data
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND (users.role)::text = 'admin')
  );

-- Fix 3: neighborhoods — mesma correção
DROP POLICY IF EXISTS neighborhoods_policy ON public.neighborhoods;

CREATE POLICY "neighborhoods_select" ON public.neighborhoods
  FOR SELECT USING (true);

CREATE POLICY "neighborhoods_insert" ON public.neighborhoods
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND (users.role)::text = 'admin')
  );

CREATE POLICY "neighborhoods_update" ON public.neighborhoods
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND (users.role)::text = 'admin')
  );

CREATE POLICY "neighborhoods_delete" ON public.neighborhoods
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND (users.role)::text = 'admin')
  );
