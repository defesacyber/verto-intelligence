-- ============================================
-- MIGRATION: Market Data Tables
-- Purpose: Replace hardcoded CITY_PARAMS with database-driven market data
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CITIES TABLE (from IBGE API)
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

COMMENT ON TABLE public.cities IS 'Brazilian cities master table sourced from IBGE API';
COMMENT ON COLUMN public.cities.ibge_code IS 'IBGE official city code';

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
CREATE INDEX IF NOT EXISTS idx_neighborhoods_name ON public.neighborhoods(name);

COMMENT ON TABLE public.neighborhoods IS 'Neighborhoods/districts within cities';

-- ============================================
-- MARKET DATA CACHE (replaces CITY_PARAMS)
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
  demand_index INTEGER CHECK (demand_index >= 0 AND demand_index <= 100),
  stock_units INTEGER CHECK (stock_units >= 0),
  absorption_months DECIMAL(5,2),
  absorption_rate DECIMAL(5,2),

  -- Supply metrics
  units_launched_month INTEGER CHECK (units_launched_month >= 0),
  units_sold_month INTEGER CHECK (units_sold_month >= 0),
  vgv_launched_month DECIMAL(15,2),

  -- Investment metrics
  rental_yield DECIMAL(5,2),
  avg_days_on_market INTEGER CHECK (avg_days_on_market >= 0),
  confidence_index INTEGER CHECK (confidence_index >= 0 AND confidence_index <= 100),
  attractiveness_score DECIMAL(3,1) CHECK (attractiveness_score >= 0 AND attractiveness_score <= 10),

  -- Data provenance
  source VARCHAR(50) NOT NULL CHECK (source IN ('datazap', 'fipezap', 'secovi', 'ademi', 'estimated', 'manual')),
  data_period VARCHAR(20),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(city_id, neighborhood_id, data_period)
);

CREATE INDEX IF NOT EXISTS idx_market_data_city ON public.market_data_cache(city_id);
CREATE INDEX IF NOT EXISTS idx_market_data_neighborhood ON public.market_data_cache(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_market_data_expires ON public.market_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_market_data_source ON public.market_data_cache(source);
CREATE INDEX IF NOT EXISTS idx_market_data_period ON public.market_data_cache(data_period);

COMMENT ON TABLE public.market_data_cache IS 'Cached market data from external APIs (DataZAP, FipeZAP) or estimates';
COMMENT ON COLUMN public.market_data_cache.source IS 'Data source: datazap, fipezap, secovi, ademi, estimated, or manual';
COMMENT ON COLUMN public.market_data_cache.expires_at IS 'Cache expiration timestamp';

-- ============================================
-- TIME SERIES DATA (for charts)
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

CREATE INDEX IF NOT EXISTS idx_time_series_city_metric ON public.market_time_series(city_id, metric_type, period_date DESC);
CREATE INDEX IF NOT EXISTS idx_time_series_segment ON public.market_time_series(segment);

COMMENT ON TABLE public.market_time_series IS 'Historical time series data for charts and trend analysis';
COMMENT ON COLUMN public.market_time_series.metric_type IS 'Metric type: price_m2, demand_index, stock, vgv, etc.';
COMMENT ON COLUMN public.market_time_series.segment IS 'Market segment: low, mid, high, or NULL for overall';

-- ============================================
-- MACRO INDICATORS (BCB data)
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
CREATE INDEX IF NOT EXISTS idx_macro_indicators_source ON public.macro_indicators(source);

COMMENT ON TABLE public.macro_indicators IS 'Macroeconomic indicators from Brazilian Central Bank (BCB) and other sources';
COMMENT ON COLUMN public.macro_indicators.indicator_type IS 'Type: selic, ipca, igpm, incc, cdi, tr, dollar, pib, etc.';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_time_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_indicators ENABLE ROW LEVEL SECURITY;

-- Cities: Authenticated users can view
CREATE POLICY "Authenticated users can view cities"
  ON public.cities FOR SELECT
  USING (auth.role() = 'authenticated');

-- Neighborhoods: Authenticated users can view
CREATE POLICY "Authenticated users can view neighborhoods"
  ON public.neighborhoods FOR SELECT
  USING (auth.role() = 'authenticated');

-- Market Data Cache: Authenticated users can view
CREATE POLICY "Authenticated users can view market data"
  ON public.market_data_cache FOR SELECT
  USING (auth.role() = 'authenticated');

-- Market Data Cache: Service role can manage (insert/update/delete)
CREATE POLICY "Service role can manage market data"
  ON public.market_data_cache FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Time Series: Authenticated users can view
CREATE POLICY "Authenticated users can view time series"
  ON public.market_time_series FOR SELECT
  USING (auth.role() = 'authenticated');

-- Time Series: Service role can manage
CREATE POLICY "Service role can manage time series"
  ON public.market_time_series FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Macro Indicators: Authenticated users can view
CREATE POLICY "Authenticated users can view macro indicators"
  ON public.macro_indicators FOR SELECT
  USING (auth.role() = 'authenticated');

-- Macro Indicators: Service role can manage
CREATE POLICY "Service role can manage macro indicators"
  ON public.macro_indicators FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
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
