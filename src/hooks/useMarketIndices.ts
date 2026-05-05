import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarketIndex {
  label: string;
  description: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  source: string;
  date?: string;
}

interface MarketIndicesResponse {
  weekly: MarketIndex[];
  monthly: MarketIndex[];
  quarterly: MarketIndex[];
  sources: {
    public: string[];
    paid: {
      fipezap: boolean;
      secovi: boolean;
      ademi: boolean;
    };
  };
  lastUpdated: string;
}

async function fetchMarketIndices(): Promise<MarketIndicesResponse> {
  const { data, error } = await supabase.functions.invoke('market-indices');
  
  if (error) {
    console.error('Error fetching market indices:', error);
    throw new Error(error.message || 'Failed to fetch market indices');
  }
  
  return data;
}

export function useMarketIndices() {
  return useQuery({
    queryKey: ['market-indices'],
    queryFn: fetchMarketIndices,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
}
