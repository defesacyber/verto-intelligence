-- Remove the overly permissive INSERT policy on alert_history
-- Edge functions use service role key which bypasses RLS, so this policy is unnecessary
DROP POLICY IF EXISTS "System can insert alert history" ON public.alert_history;