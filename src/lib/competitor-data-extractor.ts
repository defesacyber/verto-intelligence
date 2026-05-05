/**
 * Utilitário para extração automática de dados de concorrentes a partir de texto scrapeado
 */

interface ExtractedCompetitorData {
  name?: string;
  developer?: string;
  avg_price_m2?: number;
  min_ticket?: number;
  max_ticket?: number;
  total_units?: number;
  unit_types?: string[];
  amenities?: string[];
  neighborhood?: string;
  launch_date?: string;
  delivery_date?: string;
  confidence: 'high' | 'medium' | 'low';
}

// Regex patterns for Brazilian real estate data
const PATTERNS = {
  // Preço por m² - "R$ 12.500/m²", "12500 por m2", "R$12.500,00/m²"
  priceM2: [
    /R\$\s*([\d.,]+)\s*(?:\/|por)\s*m[²2]/gi,
    /([\d.,]+)\s*(?:reais|R\$)?\s*(?:\/|por)\s*m[²2]/gi,
    /preço\s*(?:do\s*)?m[²2]\s*:?\s*R?\$?\s*([\d.,]+)/gi,
  ],
  
  // Ticket/Valor do imóvel - "A partir de R$ 450.000", "R$ 850 mil", "de R$ 500.000 a R$ 1.200.000"
  price: [
    /(?:a\s*partir\s*de|desde)\s*R?\$?\s*([\d.,]+)\s*(mil|milhão|milhões)?/gi,
    /R\$\s*([\d.,]+)\s*(mil|milhão|milhões)?/gi,
    /de\s*R?\$?\s*([\d.,]+)\s*(?:mil|milhão|milhões)?\s*(?:a|até)\s*R?\$?\s*([\d.,]+)\s*(mil|milhão|milhões)?/gi,
  ],
  
  // Total de unidades - "120 unidades", "350 apartamentos", "200 unids"
  units: [
    /([\d.,]+)\s*(?:unidade|apartamento|unid|apto|casa)s?/gi,
    /total\s*(?:de)?\s*([\d.,]+)\s*(?:unidade|apartamento|unid)?s?/gi,
    /empreendimento\s*(?:com)?\s*([\d.,]+)\s*(?:unidade|apartamento)?s?/gi,
  ],
  
  // Tipologias - "2 e 3 dormitórios", "Studios de 25m²", "1, 2 e 3 quartos"
  unitTypes: [
    /(\d+)\s*(?:e\s*\d+\s*)?(?:dormitório|quarto|suíte|dorm)s?/gi,
    /studio?s?\s*(?:de\s*)?([\d]+)\s*m[²2]?/gi,
    /(?:apartamento|apto)s?\s*(?:de)?\s*([\d]+)\s*(?:a\s*[\d]+\s*)?m[²2]/gi,
  ],
  
  // Construtora/Incorporadora
  developer: [
    /(?:construtora|incorporadora|por|desenvolvido\s*por|lançamento\s*da?)\s*:?\s*([A-Z][a-zA-ZÀ-ú\s&]+?)(?:\.|,|\n|$)/gi,
    /(?:^|\n)([A-Z][a-zA-ZÀ-ú]+(?:\s+[A-Z][a-zA-ZÀ-ú]+)?)\s*(?:lança|apresenta|anuncia)/gi,
  ],
  
  // Bairro
  neighborhood: [
    /(?:no|bairro|localizado\s*(?:no|em)|região\s*(?:do|da)?)\s+([A-ZÀ-Ú][a-zA-ZÀ-ú\s]+?)(?:\.|,|\n|em\s|na\s)/gi,
    /([A-ZÀ-Ú][a-zA-ZÀ-ú\s]+?)\s*[-–]\s*(?:SP|RJ|MG|BA|PR|RS|SC|PE|CE|GO|DF|ES|PB|RN|AL|SE|MA|PI|MT|MS|PA|AM|TO|RO|AC|RR|AP)/gi,
  ],
  
  // Data de lançamento
  launchDate: [
    /lançamento\s*(?:em|previsto\s*para)?\s*:?\s*([\w]+\s*(?:de\s*)?(?:20\d{2}|\d{2}))/gi,
    /(?:lança(?:do)?|lançamento)\s*(?:em)?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
    /(?:lança(?:do)?|lançamento)\s*(?:em)?\s*(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*(?:de\s*)?(20\d{2})/gi,
  ],
  
  // Data de entrega
  deliveryDate: [
    /(?:entrega|previsão\s*de\s*entrega|pronto\s*para\s*morar)\s*(?:em|prevista?\s*para)?\s*:?\s*([\w]+\s*(?:de\s*)?(?:20\d{2}|\d{2}))/gi,
    /(?:entrega|conclusão)\s*(?:em)?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
    /(?:entrega|pronto)\s*(?:em)?\s*(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*(?:de\s*)?(20\d{2})/gi,
  ],
  
  // Amenidades/Diferenciais
  amenities: [
    /(?:piscina|academia|salão\s*de\s*festas|playground|churrasqueira|coworking|rooftop|pet\s*place|bicicletário|lavanderia)/gi,
  ],
};

function parseNumber(text: string): number | null {
  if (!text) return null;
  
  // Remove currency symbol and spaces
  let cleaned = text.replace(/[R$\s]/g, '');
  
  // Handle "mil" and "milhão"
  const lowerText = text.toLowerCase();
  if (lowerText.includes('milhão') || lowerText.includes('milhões')) {
    cleaned = cleaned.replace(/[.,]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num * 1000000;
  }
  if (lowerText.includes('mil')) {
    cleaned = cleaned.replace(/[.,]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num * 1000;
  }
  
  // Handle Brazilian number format (1.234,56 -> 1234.56)
  if (cleaned.includes(',')) {
    // Check if it's decimal or thousand separator
    const parts = cleaned.split(',');
    if (parts[1] && parts[1].length <= 2) {
      // It's a decimal separator
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // It's a thousand separator
      cleaned = cleaned.replace(/[.,]/g, '');
    }
  } else {
    cleaned = cleaned.replace(/\./g, '');
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function extractWithPatterns(text: string, patterns: RegExp[]): string[] {
  const results: string[] = [];
  
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        results.push(match[1].trim());
      }
      if (match[2]) {
        results.push(match[2].trim());
      }
    }
  }
  
  return results;
}

export function extractCompetitorData(text: string, url?: string): ExtractedCompetitorData {
  const result: ExtractedCompetitorData = {
    confidence: 'low',
  };
  
  if (!text || text.length < 50) {
    return result;
  }
  
  let matchCount = 0;
  
  // Extract price per m²
  const priceM2Matches = extractWithPatterns(text, PATTERNS.priceM2);
  if (priceM2Matches.length > 0) {
    const prices = priceM2Matches.map(parseNumber).filter((p): p is number => p !== null && p > 1000 && p < 50000);
    if (prices.length > 0) {
      // Get median price
      prices.sort((a, b) => a - b);
      result.avg_price_m2 = prices[Math.floor(prices.length / 2)];
      matchCount++;
    }
  }
  
  // Extract ticket prices
  const priceMatches = extractWithPatterns(text, PATTERNS.price);
  if (priceMatches.length > 0) {
    const prices = priceMatches.map(parseNumber).filter((p): p is number => p !== null && p > 100000 && p < 50000000);
    if (prices.length > 0) {
      prices.sort((a, b) => a - b);
      result.min_ticket = prices[0];
      result.max_ticket = prices[prices.length - 1];
      matchCount++;
    }
  }
  
  // Extract total units
  const unitMatches = extractWithPatterns(text, PATTERNS.units);
  if (unitMatches.length > 0) {
    const units = unitMatches.map(parseNumber).filter((u): u is number => u !== null && u > 10 && u < 5000);
    if (units.length > 0) {
      // Get most common/reasonable value
      result.total_units = units[0];
      matchCount++;
    }
  }
  
  // Extract developer
  const developerMatches = extractWithPatterns(text, PATTERNS.developer);
  if (developerMatches.length > 0) {
    // Filter out common false positives
    const validDevelopers = developerMatches.filter(d => 
      d.length > 3 && 
      d.length < 50 && 
      !d.toLowerCase().includes('apartamento') &&
      !d.toLowerCase().includes('empreendimento')
    );
    if (validDevelopers.length > 0) {
      result.developer = validDevelopers[0];
      matchCount++;
    }
  }
  
  // Extract neighborhood
  const neighborhoodMatches = extractWithPatterns(text, PATTERNS.neighborhood);
  if (neighborhoodMatches.length > 0) {
    const validNeighborhoods = neighborhoodMatches.filter(n => 
      n.length > 3 && 
      n.length < 40 &&
      !n.toLowerCase().includes('apartamento')
    );
    if (validNeighborhoods.length > 0) {
      result.neighborhood = validNeighborhoods[0];
      matchCount++;
    }
  }
  
  // Extract unit types
  const unitTypeMatches = extractWithPatterns(text, PATTERNS.unitTypes);
  if (unitTypeMatches.length > 0) {
    result.unit_types = [...new Set(unitTypeMatches)].slice(0, 5);
    matchCount++;
  }
  
  // Extract amenities
  const amenityMatches = text.match(PATTERNS.amenities[0]);
  if (amenityMatches) {
    result.amenities = [...new Set(amenityMatches.map(a => a.toLowerCase()))];
    matchCount++;
  }
  
  // Extract launch date
  const launchMatches = extractWithPatterns(text, PATTERNS.launchDate);
  if (launchMatches.length > 0) {
    result.launch_date = launchMatches[0];
    matchCount++;
  }
  
  // Extract delivery date
  const deliveryMatches = extractWithPatterns(text, PATTERNS.deliveryDate);
  if (deliveryMatches.length > 0) {
    result.delivery_date = deliveryMatches[0];
    matchCount++;
  }
  
  // Try to extract project name from URL or title
  if (url) {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    if (lastPart && lastPart.length > 3) {
      const cleanName = lastPart
        .replace(/[-_]/g, ' ')
        .replace(/\.[a-z]+$/i, '')
        .replace(/\b(lancamento|empreendimento|apartamento|residencial)\b/gi, '')
        .trim();
      if (cleanName.length > 3) {
        result.name = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }
    }
  }
  
  // Set confidence based on match count
  if (matchCount >= 5) {
    result.confidence = 'high';
  } else if (matchCount >= 3) {
    result.confidence = 'medium';
  } else {
    result.confidence = 'low';
  }
  
  return result;
}

// Helper to convert extracted data to competitor format
export function extractedToCompetitor(
  extracted: ExtractedCompetitorData,
  defaults: { city: string; uf: string; project_id: string }
): Partial<{
  name: string;
  city: string;
  uf: string;
  neighborhood: string;
  developer: string;
  avg_price_m2: number;
  min_ticket: number;
  max_ticket: number;
  avg_ticket: number;
  total_units: number;
  unit_types: { type: string }[];
  amenities: string[];
  project_id: string;
  confidence_level: string;
}> {
  const result: Partial<{
    name: string;
    city: string;
    uf: string;
    neighborhood: string;
    developer: string;
    avg_price_m2: number;
    min_ticket: number;
    max_ticket: number;
    avg_ticket: number;
    total_units: number;
    unit_types: { type: string }[];
    amenities: string[];
    project_id: string;
    confidence_level: string;
  }> = {
    city: defaults.city,
    uf: defaults.uf,
    project_id: defaults.project_id,
    confidence_level: extracted.confidence,
  };
  
  if (extracted.name) result.name = extracted.name;
  if (extracted.developer) result.developer = extracted.developer;
  if (extracted.neighborhood) result.neighborhood = extracted.neighborhood;
  if (extracted.avg_price_m2) result.avg_price_m2 = extracted.avg_price_m2;
  if (extracted.min_ticket) result.min_ticket = extracted.min_ticket;
  if (extracted.max_ticket) result.max_ticket = extracted.max_ticket;
  if (extracted.min_ticket && extracted.max_ticket) {
    result.avg_ticket = (extracted.min_ticket + extracted.max_ticket) / 2;
  }
  if (extracted.total_units) result.total_units = extracted.total_units;
  if (extracted.unit_types) {
    result.unit_types = extracted.unit_types.map(t => ({ type: t }));
  }
  if (extracted.amenities) result.amenities = extracted.amenities;
  
  return result;
}
