-- Fix Security Alerts: Enable RLS on public tables and fix View security

-- 1. Enable RLS on tables flagged as "RLS Disabled in Public"
ALTER TABLE public.city_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_reports ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for Market Data tables (Reference data - Read Only for everyone)
-- city_market_data
CREATE POLICY "Allow public read access" ON public.city_market_data
    FOR SELECT
    USING (true);

-- regions
CREATE POLICY "Allow public read access" ON public.regions
    FOR SELECT
    USING (true);

-- neighborhoods
CREATE POLICY "Allow public read access" ON public.neighborhoods
    FOR SELECT
    USING (true);

-- sectors
CREATE POLICY "Allow public read access" ON public.sectors
    FOR SELECT
    USING (true);

-- 3. Create policies for Recurring Reports (Content - Read Only for authenticated users)
-- Assuming recurring_reports are for all logged-in users. 
-- If it should be public, change to "true". keeping it authenticated for safety.
CREATE POLICY "Allow authenticated read access" ON public.recurring_reports
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. Fix Security Definer Views
-- Views by default run with the privileges of the owner (Security Definer behavior).
-- We want them to run with the privileges of the invoker to respect RLS on underlying tables.
ALTER VIEW public.projects_summary SET (security_invoker = true);
ALTER VIEW public.active_subscriptions SET (security_invoker = true);
