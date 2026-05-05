/**
 * Market Data Helper
 * Abstracts database queries for market data to replace CITY_PARAMS
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

export interface CityMarketData {
  price_m2_base: number;
  price_m2_delta: number;
  demand_index: number;
  stock_units: number;
  absorption_months: number;
  vgv_multiplier: number;
  market_heat: 'hot' | 'balanced' | 'saturated';
  source: string;
  expires_at: string;
  created_at: string;
}

/**
 * Get market data for a city from database
 * Falls back to Brasil (Nacional) if city not found
 */
export async function getCityMarketData(
  supabase: SupabaseClient,
  cityName: string
): Promise<CityMarketData> {
  try {
    // First, find the city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('nome', cityName)
      .maybeSingle();

    if (cityError) {
      console.error(`Error fetching city ${cityName}:`, cityError);
      return getDefaultMarketData();
    }

    if (!city) {
      // Try Brasil (Nacional) as fallback
      if (cityName !== 'Brasil (Nacional)') {
        console.warn(`City not found: ${cityName}, using Brasil (Nacional)`);
        return getCityMarketData(supabase, 'Brasil (Nacional)');
      }
      return getDefaultMarketData();
    }

    // Get latest market data from cache
    const { data: marketData, error: dataError } = await supabase
      .from('market_data_cache')
      .select(`
        price_m2_avg,
        price_variation_12m,
        demand_index,
        stock_units,
        absorption_months,
        source,
        expires_at,
        created_at
      `)
      .eq('city_id', city.id)
      .is('neighborhood_id', null) // City-level data only
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dataError) {
      console.error(`Error fetching market data for ${cityName}:`, dataError);
      return getDefaultMarketData();
    }

    if (!marketData) {
      console.warn(`No market data found for ${cityName}`);
      return getDefaultMarketData();
    }

    // Transform database data to expected format
    return {
      price_m2_base: marketData.price_m2_avg || 8500,
      price_m2_delta: marketData.price_variation_12m || 3.5,
      demand_index: marketData.demand_index || 65,
      stock_units: marketData.stock_units || 150000,
      absorption_months: marketData.absorption_months || 14,
      vgv_multiplier: calculateVGVMultiplier(marketData.price_m2_avg),
      market_heat: determineMarketHeat(
        marketData.demand_index,
        marketData.absorption_months
      ),
      source: marketData.source,
      expires_at: marketData.expires_at,
      created_at: marketData.created_at,
    };
  } catch (error) {
    console.error(`Unexpected error fetching data for ${cityName}:`, error);
    return getDefaultMarketData();
  }
}

/**
 * Get default/fallback market data (Brasil Nacional)
 */
function getDefaultMarketData(): CityMarketData {
  return {
    price_m2_base: 8500,
    price_m2_delta: 3.5,
    demand_index: 65,
    stock_units: 150000,
    absorption_months: 14,
    vgv_multiplier: 1.0,
    market_heat: 'balanced',
    source: 'estimated',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };
}

/**
 * Calculate VGV multiplier based on average price
 * Higher prices = larger market = higher multiplier
 */
function calculateVGVMultiplier(priceM2: number | null): number {
  if (!priceM2) return 1.0;

  if (priceM2 >= 18000) return 2.5;
  if (priceM2 >= 12000) return 2.0;
  if (priceM2 >= 10000) return 1.5;
  if (priceM2 >= 8000) return 1.0;
  if (priceM2 >= 6000) return 0.6;
  if (priceM2 >= 5000) return 0.4;
  return 0.2;
}

/**
 * Determine market heat based on demand and absorption
 * Hot: High demand + fast absorption
 * Saturated: Low demand + slow absorption
 * Balanced: Everything else
 */
function determineMarketHeat(
  demandIndex: number | null,
  absorptionMonths: number | null
): 'hot' | 'balanced' | 'saturated' {
  if (!demandIndex || !absorptionMonths) return 'balanced';

  // Hot market: demand > 70 AND absorption < 12 months
  if (demandIndex >= 70 && absorptionMonths <= 12) {
    return 'hot';
  }

  // Saturated: demand < 60 OR absorption > 15 months
  if (demandIndex < 60 || absorptionMonths > 15) {
    return 'saturated';
  }

  return 'balanced';
}

/**
 * Get time series data for charts
 */
export async function getTimeSeriesData(
  supabase: SupabaseClient,
  cityName: string,
  metricType: string,
  monthsBack: number = 12
): Promise<{ labels: string[]; values: number[] }> {
  try {
    const { data: city } = await supabase
      .from('cities')
      .select('id')
      .eq('nome', cityName)
      .maybeSingle();

    if (!city) {
      return { labels: [], values: [] };
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const { data: timeSeries, error } = await supabase
      .from('market_time_series')
      .select('period_date, value')
      .eq('city_id', city.id)
      .eq('metric_type', metricType)
      .is('segment', null) // Overall, not segmented
      .gte('period_date', startDate.toISOString().split('T')[0])
      .order('period_date', { ascending: true });

    if (error || !timeSeries || timeSeries.length === 0) {
      return { labels: [], values: [] };
    }

    const labels = timeSeries.map(ts => {
      const date = new Date(ts.period_date);
      return date.toLocaleDateString('pt-BR', { month: 'short' });
    });

    const values = timeSeries.map(ts => ts.value);

    return { labels, values };
  } catch (error) {
    console.error('Error fetching time series:', error);
    return { labels: [], values: [] };
  }
}
