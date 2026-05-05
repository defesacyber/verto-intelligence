// Shared BCB Client for Edge Functions

export const BCB_SERIES = {
  selic_meta: 432,
  selic_acumulada: 4189,
  ipca: 433,
  ipca_12m: 13522,
  incc: 192,
  igpm: 189,
  pib_variacao: 7326,
  taxa_desemprego: 24369,
  confianca_consumidor: 4393,
  confianca_empresario: 7343
};

export interface BCBSeriesData {
  data: string;
  valor: string;
}

/**
 * Fetch a time series from the Brazilian Central Bank (BCB)
 */
export async function fetchBCBSeries(serieCode: number, lastN: number = 12): Promise<BCBSeriesData[]> {
  try {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serieCode}/dados/ultimos/${lastN}?formato=json`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    });
    
    if (!response.ok) {
      console.error(`BCB API error for series ${serieCode}:`, response.status);
      return [];
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching BCB series ${serieCode}:`, error);
    return [];
  }
}

/**
 * Get the latest value from a BCB series
 */
export function getLatestValue(data: BCBSeriesData[]): number | null {
  if (!data || data.length === 0) return null;
  const latest = data[data.length - 1];
  return parseFloat(latest.valor.replace(',', '.'));
}

/**
 * Calculate the accumulated 12-month variation from monthly series
 */
export function calculateAccumulated12m(data: BCBSeriesData[]): number | null {
  if (!data || data.length < 12) return null;
  
  const last12 = data.slice(-12);
  let accumulated = 1;
  
  for (const item of last12) {
    const value = parseFloat(item.valor.replace(',', '.'));
    accumulated *= (1 + value / 100);
  }
  
  return (accumulated - 1) * 100;
}

/**
 * Fetch PTAX (dollar) from BCB Olinda API
 */
export async function fetchPTAX(): Promise<number | null> {
  try {
    const today = new Date();
    const formatDate = (d: Date) => `'${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}'`;
    
    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao=${formatDate(today)}&$format=json`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    const data = await response.json();
    return data.value?.[0]?.cotacaoCompra || null;
  } catch (error) {
    console.error('Error fetching PTAX:', error);
    return null;
  }
}
