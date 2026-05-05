-- Fix security warning: Function Search Path Mutable
-- Set explicit search_path for SECURITY DEFINER functions to prevent malicious object substitution

-- Fix for public.handle_new_user()
-- This function is SECURITY DEFINER, so it needs a fixed search_path
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Fix for public.update_updated_at_column()
-- This function is often SECURITY DEFINER, so it needs a fixed search_path
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
