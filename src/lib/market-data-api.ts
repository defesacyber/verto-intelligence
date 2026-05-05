import { supabase } from '@/integrations/supabase/client';

interface MarketDataResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  source?: string;
  hasCommercialApi?: boolean;
  macro?: {
    selic_rate: number;
    ipca_12m: number;
    pib_growth: number;
    last_updated?: string;
  };
}

interface State {
  id: number;
  sigla: string;
  nome: string;
}

interface City {
  id: number;
  nome: string;
}

interface CityMarketData {
  city: string;
  uf: string;
  neighborhood?: string;
  avg_price_m2: number;
  price_variation_12m: number;
  demand_index: number;
  absorption_rate: number;
  supply_units: number;
  selic_rate: number;
  ipca_12m: number;
  pib_growth: number;
  source?: string;
  rental_yield?: number;
  avg_days_on_market?: number;
  properties_sold_30d?: number;
}

interface ApiSource {
  name: string;
  status: 'active' | 'not_configured' | 'error';
  description: string;
}

interface ApiStatusResponse {
  success: boolean;
  data?: {
    hasDataZAP: boolean;
    hasFipeZAP: boolean;
    hasCommercialApi: boolean;
    availableSources: ApiSource[];
  };
  error?: string;
}

export const marketDataApi = {
  // Verificar status das APIs
  async checkApiStatus(): Promise<ApiStatusResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('market-data-api', {
        body: { action: 'check-api-status' },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao verificar status das APIs:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao verificar APIs' 
      };
    }
  },

  // Listar estados
  async listStates(): Promise<{ success: boolean; data?: State[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('market-data-api', {
        body: { action: 'list-states' },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao listar estados:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao listar estados' 
      };
    }
  },

  // Listar cidades de um estado
  async listCities(uf: string): Promise<{ success: boolean; data?: City[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('market-data-api', {
        body: { action: 'list-cities', uf },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao listar cidades:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao listar cidades' 
      };
    }
  },

  // Buscar dados de mercado de uma cidade
  async getMarketData(city: string, uf: string, neighborhood?: string): Promise<MarketDataResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('market-data-api', {
        body: { action: 'get-market-data', city, uf, neighborhood },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar dados de mercado:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao buscar dados' 
      };
    }
  },

  // Buscar dados de todas as cidades principais
  async getAllCitiesData(): Promise<{ success: boolean; data?: CityMarketData[]; macro?: MarketDataResponse['macro']; hasCommercialApi?: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('market-data-api', {
        body: { action: 'get-all-cities-data' },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar todos os dados:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao buscar dados' 
      };
    }
  },
};

export type { State, City, CityMarketData, MarketDataResponse, ApiSource, ApiStatusResponse };
