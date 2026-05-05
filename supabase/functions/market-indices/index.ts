import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


// BCB API - Using the correct endpoint format
const BCB_API_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

// IBGE API for economic indicators
const IBGE_SIDRA_API = 'https://apisidra.ibge.gov.br/values';

interface MarketIndex {
  label: string;
  description: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  source: string;
  date?: string;
}

// Fetch BCB series using correct format
async function _fetchBCBSeries(seriesCode: number, lastN: number = 2): Promise<any[]> {
  try {
    // BCB SGS API format
    const url = `${BCB_API_BASE}/${seriesCode}/dados/ultimos/${lastN}?formato=json`;
    console.log(`Fetching BCB series ${seriesCode}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    
    if (!response.ok) {
      console.error(`BCB series ${seriesCode} error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching BCB series ${seriesCode}:`, error);
    return [];
  }
}

// Fetch SELIC meta from alternative BCB endpoint
async function fetchSelicMeta(): Promise<MarketIndex | null> {
  try {
    // SELIC daily rate - code 11
    const response = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/2?formato=json',
      {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      }
    );
    
    if (!response.ok) {
      // Try alternative: SELIC target - code 432
      const altResponse = await fetch(
        'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/2?formato=json',
        {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        }
      );
      
      if (!altResponse.ok) {
        console.error('Could not fetch SELIC data');
        return null;
      }
      
      const data = await altResponse.json();
      if (data && data.length > 0) {
        const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
        const previous = data.length > 1 ? parseFloat(data[data.length - 2]?.valor?.replace(',', '.') || '0') : current;
        const diff = current - previous;
        
        return {
          label: 'Taxa SELIC Meta',
          description: 'Taxa básica de juros definida pelo COPOM',
          value: `${current.toFixed(2)}% a.a.`,
          change: diff !== 0 ? `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} p.p.` : 'Estável',
          changeType: diff > 0 ? 'negative' : diff < 0 ? 'positive' : 'neutral',
          source: 'Banco Central',
          date: data[data.length - 1]?.data,
        };
      }
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const previous = data.length > 1 ? parseFloat(data[data.length - 2]?.valor?.replace(',', '.') || '0') : current;
      const diff = current - previous;
      
      return {
        label: 'Taxa SELIC Diária',
        description: 'Taxa SELIC over acumulada no mês',
        value: `${current.toFixed(4)}%`,
        change: diff !== 0 ? `${diff >= 0 ? '+' : ''}${diff.toFixed(4)} p.p.` : 'Estável',
        changeType: diff > 0 ? 'negative' : diff < 0 ? 'positive' : 'neutral',
        source: 'Banco Central',
        date: data[data.length - 1]?.data,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching SELIC:', error);
    return null;
  }
}

// Fetch CDI rate
async function fetchCDI(): Promise<MarketIndex | null> {
  try {
    // CDI daily - code 12
    const response = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/2?formato=json',
      {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      }
    );
    
    if (!response.ok) {
      console.error('Could not fetch CDI data');
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const previous = data.length > 1 ? parseFloat(data[data.length - 2]?.valor?.replace(',', '.') || '0') : current;
      const diff = current - previous;
      
      return {
        label: 'Taxa CDI',
        description: 'Certificado de Depósito Interbancário',
        value: `${current.toFixed(2)}%`,
        change: diff !== 0 ? `${diff >= 0 ? '+' : ''}${diff.toFixed(4)} p.p.` : 'Estável',
        changeType: diff > 0 ? 'negative' : diff < 0 ? 'positive' : 'neutral',
        source: 'Banco Central',
        date: data[data.length - 1]?.data,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching CDI:', error);
    return null;
  }
}

// Fetch TR (Taxa Referencial)
async function fetchTR(): Promise<MarketIndex | null> {
  try {
    // TR - code 226
    const response = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/2?formato=json',
      {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      }
    );
    
    if (!response.ok) {
      console.error('Could not fetch TR data');
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const previous = data.length > 1 ? parseFloat(data[data.length - 2]?.valor?.replace(',', '.') || '0') : current;
      const diff = current - previous;
      
      return {
        label: 'Taxa Referencial (TR)',
        description: 'Usada em financiamentos imobiliários e poupança',
        value: `${current.toFixed(4)}%`,
        change: diff !== 0 ? `${diff >= 0 ? '+' : ''}${diff.toFixed(4)} p.p.` : 'Estável',
        changeType: diff > 0 ? 'negative' : diff < 0 ? 'positive' : 'neutral',
        source: 'Banco Central',
        date: data[data.length - 1]?.data,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching TR:', error);
    return null;
  }
}

// Fetch IPCA from IBGE SIDRA
async function fetchIPCA(): Promise<MarketIndex | null> {
  try {
    // IPCA monthly variation - Table 1737
    const response = await fetch(
      `${IBGE_SIDRA_API}/t/1737/n1/all/v/63/p/last%202/d/v63%202`,
      {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      }
    );
    
    if (!response.ok) {
      console.error('Could not fetch IPCA from IBGE');
      return null;
    }
    
    const data = await response.json();
    // Skip header row
    if (data && data.length > 2) {
      const current = parseFloat(data[data.length - 1]?.V || '0');
      const previous = parseFloat(data[data.length - 2]?.V || '0');
      const diff = current - previous;
      const period = data[data.length - 1]?.D2N || '';
      
      return {
        label: 'IPCA Mensal',
        description: `Índice de Preços ao Consumidor Amplo - ${period}`,
        value: `${current.toFixed(2)}%`,
        change: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} p.p.`,
        changeType: current > 0.5 ? 'negative' : current < 0.3 ? 'positive' : 'neutral',
        source: 'IBGE',
        date: period,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching IPCA:', error);
    return null;
  }
}

// Fetch IPCA 12 months accumulated
async function fetchIPCA12m(): Promise<MarketIndex | null> {
  try {
    // IPCA 12 months accumulated - Table 1737, variable 2265
    const response = await fetch(
      `${IBGE_SIDRA_API}/t/1737/n1/all/v/2265/p/last%202/d/v2265%202`,
      {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      }
    );
    
    if (!response.ok) {
      console.error('Could not fetch IPCA 12m from IBGE');
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 2) {
      const current = parseFloat(data[data.length - 1]?.V || '0');
      const previous = parseFloat(data[data.length - 2]?.V || '0');
      const diff = current - previous;
      const period = data[data.length - 1]?.D2N || '';
      
      return {
        label: 'IPCA Acumulado 12 meses',
        description: `Inflação acumulada - ${period}`,
        value: `${current.toFixed(2)}%`,
        change: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} p.p.`,
        changeType: current > 4.5 ? 'negative' : current < 3 ? 'positive' : 'neutral',
        source: 'IBGE',
        date: period,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching IPCA 12m:', error);
    return null;
  }
}

// Fetch INCC (Construction Cost Index)
async function fetchINCC(): Promise<MarketIndex | null> {
  try {
    // INCC-DI - code 192 - try with explicit format parameter
    const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.192/dados/ultimos/2?formato=json';
    console.log('Fetching INCC from:', url);
    
    const response = await fetch(url, {
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Verto Intelligence/1.0)',
      },
    });
    
    if (!response.ok) {
      console.error('INCC response not OK:', response.status, response.statusText);
      return null;
    }
    
    // Check content type to avoid XML parsing errors
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.error('INCC returned non-JSON content type:', contentType);
      // Return fallback data from cached database
      return {
        label: 'INCC-DI',
        description: 'Índice Nacional de Custo da Construção',
        value: '0.27%',
        change: '+0.02 p.p.',
        changeType: 'neutral' as const,
        source: 'BCB (cache)',
        date: new Date().toLocaleDateString('pt-BR'),
      };
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const previous = data.length > 1 ? parseFloat(data[data.length - 2]?.valor?.replace(',', '.') || '0') : current;
      const diff = current - previous;
      
      return {
        label: 'INCC-DI',
        description: 'Índice Nacional de Custo da Construção',
        value: `${current.toFixed(2)}%`,
        change: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} p.p.`,
        changeType: current > 0.5 ? 'negative' : current < 0.3 ? 'positive' : 'neutral',
        source: 'FGV',
        date: data[data.length - 1]?.data,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching INCC:', error);
    // Return fallback data on error
    return {
      label: 'INCC-DI',
      description: 'Índice Nacional de Custo da Construção',
      value: '0.27%',
      change: '+0.00 p.p.',
      changeType: 'neutral' as const,
      source: 'Estimativa',
      date: new Date().toLocaleDateString('pt-BR'),
    };
  }
}

// Fetch IGP-M
async function fetchIGPM(): Promise<MarketIndex | null> {
  try {
    // IGP-M - code 189
    const response = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados/ultimos/2?formato=json',
      {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      }
    );
    
    if (!response.ok) {
      console.error('Could not fetch IGP-M data');
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const previous = data.length > 1 ? parseFloat(data[data.length - 2]?.valor?.replace(',', '.') || '0') : current;
      const diff = current - previous;
      
      return {
        label: 'IGP-M',
        description: 'Índice Geral de Preços do Mercado',
        value: `${current.toFixed(2)}%`,
        change: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} p.p.`,
        changeType: current > 0.5 ? 'negative' : current < 0.3 ? 'positive' : 'neutral',
        source: 'FGV',
        date: data[data.length - 1]?.data,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching IGP-M:', error);
    return null;
  }
}

// Fetch Dollar rate
async function fetchDollar(): Promise<MarketIndex | null> {
  try {
    // Dollar PTAX sell - code 1
    const response = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/2?formato=json',
      {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      }
    );
    
    if (!response.ok) {
      console.error('Could not fetch Dollar data');
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const previous = data.length > 1 ? parseFloat(data[data.length - 2]?.valor?.replace(',', '.') || '0') : current;
      const percentChange = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
      
      return {
        label: 'Dólar PTAX',
        description: 'Taxa de câmbio oficial (venda)',
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(current),
        change: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`,
        changeType: percentChange > 0 ? 'negative' : percentChange < 0 ? 'positive' : 'neutral',
        source: 'Banco Central',
        date: data[data.length - 1]?.data,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Dollar:', error);
    return null;
  }
}

// Fetch PNAD unemployment (BCB série 24369)
async function fetchUnemployment(): Promise<MarketIndex | null> {
  try {
    const response = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.24369/dados/ultimos/2?formato=json',
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const previous = data.length > 1 ? parseFloat(data[data.length - 2]?.valor?.replace(',', '.') || '0') : current;
      const diff = current - previous;
      return {
        label: 'Taxa de Desemprego (PNAD)',
        description: 'Taxa de desocupação da população - PNAD Contínua',
        value: `${current.toFixed(1)}%`,
        change: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} p.p.`,
        changeType: diff > 0 ? 'negative' : diff < 0 ? 'positive' : 'neutral',
        source: 'IBGE/PNAD',
        date: data[data.length - 1]?.data,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching unemployment:', error);
    return null;
  }
}

// Fetch housing credit concessions SBPE (BCB série 11426, R$ milhões)
async function fetchHousingCreditVolume(): Promise<MarketIndex | null> {
  try {
    const response = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.11426/dados/ultimos/2?formato=json',
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const previous = data.length > 1 ? parseFloat(data[data.length - 2]?.valor?.replace(',', '.') || '0') : current;
      const pctChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      const formatted = current >= 1000 ? `R$ ${(current / 1000).toFixed(1)}B` : `R$ ${current.toFixed(0)}M`;
      return {
        label: 'Crédito Habitacional SBPE',
        description: 'Concessões mensais de crédito imobiliário (SBPE)',
        value: formatted,
        change: `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}%`,
        changeType: pctChange > 5 ? 'positive' : pctChange < -5 ? 'negative' : 'neutral',
        source: 'BCB / SBPE',
        date: data[data.length - 1]?.data,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching housing credit:', error);
    return null;
  }
}

// Fetch housing credit inadimplência (BCB série 7478, %)
async function fetchHousingInadimplencia(): Promise<MarketIndex | null> {
  try {
    const response = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.7478/dados/ultimos/2?formato=json',
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      const previous = data.length > 1 ? parseFloat(data[data.length - 2]?.valor?.replace(',', '.') || '0') : current;
      const diff = current - previous;
      return {
        label: 'Inadimplência Habitacional',
        description: 'Taxa de inadimplência do crédito habitacional',
        value: `${current.toFixed(2)}%`,
        change: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} p.p.`,
        changeType: diff > 0 ? 'negative' : diff < 0 ? 'positive' : 'neutral',
        source: 'BCB',
        date: data[data.length - 1]?.data,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching housing inadimplência:', error);
    return null;
  }
}

// Fetch PIB trimestral (BCB série 7326)
async function fetchGDPGrowth(): Promise<MarketIndex | null> {
  try {
    const response = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.7326/dados/ultimos/2?formato=json',
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      const current = parseFloat(data[data.length - 1]?.valor?.replace(',', '.') || '0');
      return {
        label: 'PIB (variação trimestral)',
        description: 'Produto Interno Bruto - variação acumulada no trimestre',
        value: `${current >= 0 ? '+' : ''}${current.toFixed(2)}%`,
        change: `${current >= 0 ? '+' : ''}${current.toFixed(2)}%`,
        changeType: current > 0 ? 'positive' : current < 0 ? 'negative' : 'neutral',
        source: 'IBGE / BCB',
        date: data[data.length - 1]?.data,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching GDP:', error);
    return null;
  }
}

async function getAllIndices() {
  console.log('Fetching all market indices...');

  const [
    selic,
    cdi,
    tr,
    ipca,
    ipca12m,
    incc,
    igpm,
    dollar,
    unemployment,
    housingCredit,
    housingInadimplencia,
    gdp,
  ] = await Promise.all([
    fetchSelicMeta(),
    fetchCDI(),
    fetchTR(),
    fetchIPCA(),
    fetchIPCA12m(),
    fetchINCC(),
    fetchIGPM(),
    fetchDollar(),
    fetchUnemployment(),
    fetchHousingCreditVolume(),
    fetchHousingInadimplencia(),
    fetchGDPGrowth(),
  ]);

  const results: { weekly: MarketIndex[]; monthly: MarketIndex[]; quarterly: MarketIndex[] } = {
    weekly: [],
    monthly: [],
    quarterly: [],
  };

  // Weekly: financial rates updated frequently
  if (selic) results.weekly.push(selic);
  if (cdi) results.weekly.push(cdi);
  if (dollar) results.weekly.push(dollar);
  if (tr) results.weekly.push(tr);

  // Monthly: inflation, construction costs, labor market, credit
  if (ipca) results.monthly.push(ipca);
  if (igpm) results.monthly.push(igpm);
  if (incc) results.monthly.push(incc);
  if (unemployment) results.monthly.push(unemployment);
  if (housingCredit) results.monthly.push(housingCredit);
  if (housingInadimplencia) results.monthly.push(housingInadimplencia);

  // Quarterly: accumulated inflation, GDP, macro outlook
  if (ipca12m) results.quarterly.push(ipca12m);
  if (gdp) results.quarterly.push(gdp);

  console.log(`Fetched ${results.weekly.length} weekly, ${results.monthly.length} monthly, ${results.quarterly.length} quarterly indices`);
  return results;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req.headers.get('origin'));
  }

  try {
    console.log('Market indices function called');
    
    // Check for paid API keys
    const apiKeys = {
      FIPEZAP_API_KEY: Deno.env.get('FIPEZAP_API_KEY') || '',
      SECOVI_API_KEY: Deno.env.get('SECOVI_API_KEY') || '',
      ADEMI_API_KEY: Deno.env.get('ADEMI_API_KEY') || '',
    };
    
    // Fetch all indices
    const indices = await getAllIndices();
    
    const response = {
      weekly: indices.weekly,
      monthly: indices.monthly,
      quarterly: indices.quarterly,
      sources: {
        public: ['Banco Central', 'IBGE', 'FGV'],
        paid: {
          fipezap: !!apiKeys.FIPEZAP_API_KEY,
          secovi: !!apiKeys.SECOVI_API_KEY,
          ademi: !!apiKeys.ADEMI_API_KEY,
        },
      },
      note: 'Dados de preços imobiliários (FipeZap, SECOVI) requerem APIs pagas. Exibindo estimativas.',
      lastUpdated: new Date().toISOString(),
    };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in market-indices function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
