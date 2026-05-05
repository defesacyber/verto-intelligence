-- Migration to ensure users table exists and auth trigger is correctly configured
-- This aligns the database schema with the application's expectations (useAuth.ts)

-- 1. Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create users table if it doesn't exist (based on SUPABASE_SETUP.sql)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  open_id VARCHAR(64) UNIQUE,
  name TEXT,
  email VARCHAR(320) UNIQUE NOT NULL,
  login_method VARCHAR(64) DEFAULT 'email',
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  password_hash VARCHAR(255),
  lifetime_access BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_signed_in TIMESTAMPTZ
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 4. Create or replace the handle_new_user function to insert into public.users
-- This replaces any previous version that might have inserted into 'profiles'
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

-- 5. Re-create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill existing users from auth.users (idempotent)
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
