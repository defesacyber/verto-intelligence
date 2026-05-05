-- ============================================
-- MIGRATION 1: Market Data Tables (VERSÃO CORRIGIDA)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.cities (
  id INTEGER PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  ibge_code VARCHAR(10) UNIQUE,
  population INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cities_uf ON public.cities(uf);
CREATE INDEX IF NOT EXISTS idx_cities_nome ON public.cities(nome);

-- ============================================
-- NEIGHBORHOODS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.neighborhoods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id INTEGER NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  zone VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city_id, name)
);

CREATE INDEX IF NOT EXISTS idx_neighborhoods_city ON public.neighborhoods(city_id);

-- ============================================
-- MARKET DATA CACHE
-- ============================================
CREATE TABLE IF NOT EXISTS public.market_data_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id INTEGER NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE CASCADE,

  -- Price metrics
  price_m2_avg DECIMAL(10,2),
  price_m2_low_segment DECIMAL(10,2),
  price_m2_mid_segment DECIMAL(10,2),
  price_m2_high_segment DECIMAL(10,2),
  price_variation_12m DECIMAL(5,2),

  -- Demand metrics
  demand_index INTEGER,
  stock_units INTEGER,
  absorption_months DECIMAL(5,2),
  absorption_rate DECIMAL(5,2),

  -- Supply metrics
  units_launched_month INTEGER,
  units_sold_month INTEGER,
  vgv_launched_month DECIMAL(15,2),

  -- Investment metrics
  rental_yield DECIMAL(5,2),
  avg_days_on_market INTEGER,
  confidence_index INTEGER,
  attractiveness_score DECIMAL(3,1),

  -- Data provenance
  source VARCHAR(50) NOT NULL,
  data_period VARCHAR(20),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(city_id, neighborhood_id, data_period)
);

CREATE INDEX IF NOT EXISTS idx_market_data_city ON public.market_data_cache(city_id);
CREATE INDEX IF NOT EXISTS idx_market_data_expires ON public.market_data_cache(expires_at);

-- ============================================
-- TIME SERIES DATA
-- ============================================
CREATE TABLE IF NOT EXISTS public.market_time_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id INTEGER NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  segment VARCHAR(20),
  period_date DATE NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(city_id, metric_type, segment, period_date)
);

CREATE INDEX IF NOT EXISTS idx_time_series_city_metric ON public.market_time_series(city_id, metric_type);

-- ============================================
-- MACRO INDICATORS
-- ============================================
CREATE TABLE IF NOT EXISTS public.macro_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_type VARCHAR(50) NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  reference_date DATE NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'bcb',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(indicator_type, reference_date)
);

CREATE INDEX IF NOT EXISTS idx_macro_indicators_type_date ON public.macro_indicators(indicator_type, reference_date DESC);

-- ============================================
-- ROW LEVEL SECURITY (CORRIGIDO)
-- ============================================

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_time_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_indicators ENABLE ROW LEVEL SECURITY;

-- Políticas: Permitir leitura para usuários autenticados E anônimos
CREATE POLICY "Allow read access to cities"
  ON public.cities FOR SELECT
  USING (TRUE);

CREATE POLICY "Allow read access to neighborhoods"
  ON public.neighborhoods FOR SELECT
  USING (TRUE);

CREATE POLICY "Allow read access to market data"
  ON public.market_data_cache FOR SELECT
  USING (TRUE);

CREATE POLICY "Allow read access to time series"
  ON public.market_time_series FOR SELECT
  USING (TRUE);

CREATE POLICY "Allow read access to macro indicators"
  ON public.macro_indicators FOR SELECT
  USING (TRUE);

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_neighborhoods_updated_at
  BEFORE UPDATE ON public.neighborhoods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_data_cache_updated_at
  BEFORE UPDATE ON public.market_data_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
