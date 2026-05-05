import { supabase } from '@/integrations/supabase/client';
import { extractCompetitorData, extractedToCompetitor } from '@/lib/competitor-data-extractor';

type FirecrawlResponse<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

type ScrapeOptions = {
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links')[];
  onlyMainContent?: boolean;
  waitFor?: number;
};

type SearchOptions = {
  limit?: number;
  lang?: string;
  country?: string;
  scrapeOptions?: { formats?: ('markdown' | 'html')[] };
};

export interface EnrichedSearchResult {
  url: string;
  title: string;
  description?: string;
  markdown?: string;
  extractedData?: ReturnType<typeof extractCompetitorData>;
}

export const firecrawlApi = {
  // Scrape a single URL
  async scrape(url: string, options?: ScrapeOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Search the web for real estate competitors
  async search(query: string, options?: SearchOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-search', {
      body: { query, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Search for competitors in a specific city/neighborhood with auto-extraction
  async searchCompetitors(city: string, uf: string, neighborhood?: string): Promise<FirecrawlResponse<EnrichedSearchResult[]>> {
    const location = neighborhood ? `${neighborhood}, ${city}` : city;
    const query = `lançamentos imobiliários ${location} ${uf} 2024 2025 apartamentos preço`;
    
    const response = await this.search(query, {
      limit: 15,
      lang: 'pt',
      country: 'BR',
      scrapeOptions: { formats: ['markdown'] }
    });

    if (!response.success || !response.data) {
      return response;
    }

    // Enrich results with extracted data
    const baseResults: EnrichedSearchResult[] = Array.isArray(response.data) ? (response.data as EnrichedSearchResult[]) : [];
    const enrichedResults: EnrichedSearchResult[] = baseResults.map(result => {
      const extractedData = extractCompetitorData(
        result.markdown || result.description || '',
        result.url
      );

      return {
        url: result.url,
        title: result.title,
        description: result.description,
        markdown: result.markdown,
        extractedData,
      };
    });

    return {
      success: true,
      data: enrichedResults,
    };
  },

  // Scrape a URL and extract competitor data
  async scrapeAndExtract(url: string, projectContext: { city: string; uf: string; project_id: string }): Promise<FirecrawlResponse> {
    const response = await this.scrape(url, {
      formats: ['markdown'],
      onlyMainContent: true,
    });

    if (!response.success) {
      return response;
    }

    const content = response.data?.markdown || response.data?.data?.markdown || '';
    const extracted = extractCompetitorData(content, url);
    const competitor = extractedToCompetitor(extracted, projectContext);

    return {
      success: true,
      data: {
        raw: response.data,
        extracted,
        competitor,
      },
    };
  },
};
