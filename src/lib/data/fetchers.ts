import { supabase } from '@/integrations/supabase/client';

interface DbCityMarketRow {
  cidade: string;
  uf: string;
  preco_m2_venda: number | string | null;
  variacao_venda_12m?: number | string | null;
  variacao_venda_mes?: number | string | null;
  mes: string;
}

/**
 * Fetch market data for a specific city from Supabase
 */
export async function fetchCityMarketFromDb(city: string, uf?: string): Promise<DbCityMarketRow | null> {
  try {
    let query = supabase
      .from('idi_fipezap_historico')
      .select('cidade, uf, preco_m2_venda, variacao_venda_12m, variacao_venda_mes, mes')
      .eq('cidade', city)
      .order('mes', { ascending: false })
      .limit(1);

    if (uf) query = query.eq('uf', uf);

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;
    return data as DbCityMarketRow;
  } catch (e) {
    console.error(`[DbFetcher] Error for ${city}:`, e);
    return null;
  }
}

/**
 * Fetch all cities to compute national statistics
 */
export async function fetchAllCitiesMarketData(): Promise<DbCityMarketRow[]> {
  try {
    const { data } = await supabase
      .from('idi_fipezap_historico')
      .select('cidade, uf, preco_m2_venda, variacao_venda_12m')
      .not('preco_m2_venda', 'is', null)
      .order('mes', { ascending: false });

    return (data || []) as DbCityMarketRow[];
  } catch (e) {
    console.error('[DbFetcher] Error for national stats:', e);
    return [];
  }
}
