-- =============================================
-- SCHEMA COMPLETO - SUPABASE POSTGRESQL
-- Plataforma de Análise de Viabilidade Imobiliária
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. TABELA: users
-- =============================================
CREATE TABLE users (
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

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- 2. TABELA: subscriptions
-- =============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) CHECK (plan IN ('basico', 'profissional', 'premium')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  payment_provider VARCHAR(50) DEFAULT 'asaas',
  external_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);

-- =============================================
-- 3. TABELA: city_market_data
-- =============================================
CREATE TABLE city_market_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_name VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  population INTEGER,
  avg_income DECIMAL(10,2),
  gdp_per_capita DECIMAL(10,2),
  avg_price_per_m2 INTEGER,
  sales_velocity INTEGER,
  inventory INTEGER,
  appreciation VARCHAR(10),
  demand VARCHAR(20) CHECK (demand IN ('baixa', 'media', 'alta', 'muito_alta')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_city_market_city_state ON city_market_data(city_name, state);

-- =============================================
-- 4. TABELA: regions
-- =============================================
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES city_market_data(id) ON DELETE CASCADE,
  region_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_regions_city_id ON regions(city_id);

-- =============================================
-- 5. TABELA: neighborhoods
-- =============================================
CREATE TABLE neighborhoods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  city_id UUID REFERENCES city_market_data(id) ON DELETE CASCADE,
  neighborhood_name VARCHAR(100) NOT NULL,
  avg_price_per_m2 INTEGER,
  sales_velocity INTEGER,
  inventory INTEGER,
  appreciation VARCHAR(10),
  demand VARCHAR(20) CHECK (demand IN ('baixa', 'media', 'alta', 'muito_alta')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_neighborhoods_region_id ON neighborhoods(region_id);
CREATE INDEX idx_neighborhoods_city_id ON neighborhoods(city_id);

-- =============================================
-- 6. TABELA: sectors
-- =============================================
CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
  sector_name VARCHAR(100) NOT NULL,
  avg_price_per_m2 INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sectors_neighborhood_id ON sectors(neighborhood_id);

-- =============================================
-- 7. TABELA: projects
-- =============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  neighborhood VARCHAR(100),
  address TEXT,
  property_type VARCHAR(50) CHECK (property_type IN ('apartamento', 'casa', 'comercial', 'terreno', 'misto')),
  target_audience VARCHAR(50) CHECK (target_audience IN ('economico', 'media', 'media_alta', 'alta', 'luxo')),
  total_area INTEGER,
  total_units INTEGER,
  avg_unit_size INTEGER,
  estimated_price DECIMAL(15,2),
  launch_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  region_id UUID REFERENCES regions(id),
  neighborhood_id UUID REFERENCES neighborhoods(id),
  sector_id UUID REFERENCES sectors(id),
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'analise', 'aprovado', 'em_construcao', 'concluido', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_city_state ON projects(city, state);
CREATE INDEX idx_projects_property_type ON projects(property_type);
CREATE INDEX idx_projects_status ON projects(status);

-- =============================================
-- 8. TABELA: reports
-- =============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Cenário Pessimista
  pessimistic_vgv DECIMAL(15,2),
  pessimistic_roi DECIMAL(5,2),
  pessimistic_tir DECIMAL(5,2),
  pessimistic_payback INTEGER,
  
  -- Cenário Projetado
  projected_vgv DECIMAL(15,2),
  projected_roi DECIMAL(5,2),
  projected_tir DECIMAL(5,2),
  projected_payback INTEGER,
  
  -- Cenário Otimista
  optimistic_vgv DECIMAL(15,2),
  optimistic_roi DECIMAL(5,2),
  optimistic_tir DECIMAL(5,2),
  optimistic_payback INTEGER,
  
  -- Tempo de Absorção
  absorption_time INTEGER,
  
  -- Análises Qualitativas (JSON)
  market_infrastructure JSONB,
  competitors JSONB,
  neighborhood_trends JSONB,
  swot_analysis JSONB,
  strategic_recommendations JSONB,
  market_risk JSONB,
  
  -- Análises Quantitativas (JSON)
  sensitivity_analysis JSONB,
  cash_flow_projection JSONB,
  supply_demand_analysis JSONB,
  financial_risk_score DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reports_project_id ON reports(project_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- =============================================
-- 9. TABELA: recurring_reports
-- =============================================
CREATE TABLE recurring_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type VARCHAR(20) CHECK (report_type IN ('weekly', 'monthly', 'quarterly')),
  week_number INTEGER CHECK (week_number BETWEEN 1 AND 52),
  month INTEGER CHECK (month BETWEEN 1 AND 12),
  quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
  year INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  news JSONB,
  indicators JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_recurring_reports_type_year ON recurring_reports(report_type, year);
CREATE INDEX idx_recurring_reports_created_at ON recurring_reports(created_at DESC);

-- =============================================
-- 10. TABELA: notification_preferences
-- =============================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  weekly_reports BOOLEAN DEFAULT TRUE,
  monthly_reports BOOLEAN DEFAULT TRUE,
  quarterly_reports BOOLEAN DEFAULT TRUE,
  subscription_alerts BOOLEAN DEFAULT TRUE,
  plan_change_alerts BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- =============================================
-- 11. TABELA: email_history
-- =============================================
CREATE TABLE email_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) CHECK (email_type IN (
    'weekly_report',
    'monthly_report',
    'quarterly_report',
    'subscription_expiring',
    'plan_upgrade',
    'plan_downgrade',
    'welcome',
    'password_reset'
  )),
  subject VARCHAR(255),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed'))
);

-- Indexes
CREATE INDEX idx_email_history_user_id ON email_history(user_id);
CREATE INDEX idx_email_history_sent_at ON email_history(sent_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON users 
  FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users 
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions 
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects 
  FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can create own projects" ON projects 
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
CREATE POLICY "Users can update own projects" ON projects 
  FOR UPDATE USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can delete own projects" ON projects 
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Reports policies
CREATE POLICY "Users can view own reports" ON reports 
  FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can create own reports" ON reports 
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
CREATE POLICY "Users can update own reports" ON reports 
  FOR UPDATE USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can delete own reports" ON reports 
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Reference data policies (read-only)
CREATE POLICY "Allow public read access on city_market_data" ON city_market_data
  FOR SELECT USING (true);
CREATE POLICY "Allow public read access on regions" ON regions
  FOR SELECT USING (true);
CREATE POLICY "Allow public read access on neighborhoods" ON neighborhoods
  FOR SELECT USING (true);
CREATE POLICY "Allow public read access on sectors" ON sectors
  FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access on recurring_reports" ON recurring_reports
  FOR SELECT TO authenticated USING (true);

-- Notification Preferences policies
CREATE POLICY "Users can manage own preferences" ON notification_preferences 
  FOR ALL USING (user_id::text = auth.uid()::text);

-- Email History policies
CREATE POLICY "Users can view own email history" ON email_history 
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at 
  BEFORE UPDATE ON reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_city_market_data_updated_at 
  BEFORE UPDATE ON city_market_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_neighborhoods_updated_at 
  BEFORE UPDATE ON neighborhoods 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AUTH SYNC TRIGGER
-- =============================================

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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- VIEWS
-- =============================================

-- Active subscriptions view
CREATE VIEW active_subscriptions
WITH (security_invoker = true)
AS
SELECT 
  s.*, 
  u.name as user_name, 
  u.email as user_email 
FROM subscriptions s 
JOIN users u ON s.user_id = u.id 
WHERE s.status = 'active' AND s.end_date > NOW();

-- Projects summary view
CREATE VIEW projects_summary
WITH (security_invoker = true)
AS
SELECT 
  p.*, 
  u.name as owner_name, 
  u.email as owner_email,
  COUNT(r.id) as reports_count 
FROM projects p 
JOIN users u ON p.user_id = u.id 
LEFT JOIN reports r ON r.project_id = p.id 
GROUP BY p.id, u.name, u.email;

-- =============================================
-- SEED DATA
-- =============================================

-- Sample cities data
INSERT INTO city_market_data (city_name, state, population, avg_income, gdp_per_capita, avg_price_per_m2, sales_velocity, inventory, appreciation, demand) VALUES
  ('São Paulo', 'SP', 12396372, 3500.00, 45000.00, 9845, 7, 12450, '+5.2%', 'alta'),
  ('Rio de Janeiro', 'RJ', 6747815, 3200.00, 38000.00, 8520, 6, 9800, '+3.8%', 'alta'),
  ('Belo Horizonte', 'MG', 2521564, 2800.00, 32000.00, 6750, 8, 5600, '+4.5%', 'media'),
  ('Curitiba', 'PR', 1963726, 3100.00, 35000.00, 7200, 9, 4200, '+6.1%', 'alta'),
  ('Porto Alegre', 'RS', 1492530, 2900.00, 33000.00, 6400, 7, 3800, '+3.2%', 'media'),
  ('Brasília', 'DF', 3055149, 4200.00, 52000.00, 11500, 5, 6500, '+4.8%', 'alta'),
  ('Salvador', 'BA', 2900319, 2400.00, 28000.00, 5200, 6, 4100, '+2.9%', 'media'),
  ('Fortaleza', 'CE', 2703391, 2200.00, 25000.00, 4800, 7, 3500, '+3.5%', 'media'),
  ('Recife', 'PE', 1661017, 2500.00, 27000.00, 5500, 6, 2900, '+3.1%', 'media'),
  ('Campinas', 'SP', 1223237, 3300.00, 42000.00, 7800, 8, 3200, '+5.8%', 'alta');

