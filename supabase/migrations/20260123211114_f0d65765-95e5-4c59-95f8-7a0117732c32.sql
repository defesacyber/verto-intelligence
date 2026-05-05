-- Fix: Replace overly permissive INSERT policy with service role requirement
DROP POLICY IF EXISTS "System can insert alert history" ON public.alert_history;

-- Only edge functions (with service role) can insert alert history
-- This is handled at the application level via service role key