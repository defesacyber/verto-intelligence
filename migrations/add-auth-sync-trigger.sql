-- =============================================
-- MIGRATION: Add Auth Sync Trigger
-- =============================================
-- Execute este script no Supabase SQL Editor para sincronizar
-- automaticamente os usuários do Supabase Auth com a tabela users

-- Function to sync Supabase Auth users with users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, login_method, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    last_signed_in = NOW(),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function when auth user is created/updated
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync existing auth users to users table (run once)
INSERT INTO public.users (id, email, name, login_method, created_at, updated_at, last_signed_in)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', email),
  COALESCE(raw_app_meta_data->>'provider', 'email'),
  created_at,
  updated_at,
  last_sign_in_at
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  last_signed_in = EXCLUDED.last_signed_in,
  updated_at = NOW();
