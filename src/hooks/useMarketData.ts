import { useState, useEffect, useCallback } from 'react';
import { marketDataApi, CityMarketData, State, City, ApiSource } from '@/lib/market-data-api';
import { useToast } from '@/hooks/use-toast';

interface MacroIndicators {
  selic_rate: number;
  ipca_12m: number;
  pib_growth: number;
  last_updated?: string;
}

interface ApiStatus {
  hasDataZAP: boolean;
  hasFipeZAP: boolean;
  hasCommercialApi: boolean;
  availableSources: ApiSource[];
}

// Lista de capitais por estado
const CAPITALS: Record<string, string> = {
  'AC': 'Rio Branco', 'AL': 'Maceió', 'AP': 'Macapá', 'AM': 'Manaus',
  'BA': 'Salvador', 'CE': 'Fortaleza', 'DF': 'Brasília', 'ES': 'Vitória',
  'GO': 'Goiânia', 'MA': 'São Luís', 'MT': 'Cuiabá', 'MS': 'Campo Grande',
  'MG': 'Belo Horizonte', 'PA': 'Belém', 'PB': 'João Pessoa', 'PR': 'Curitiba',
  'PE': 'Recife', 'PI': 'Teresina', 'RJ': 'Rio de Janeiro', 'RN': 'Natal',
  'RS': 'Porto Alegre', 'RO': 'Porto Velho', 'RR': 'Boa Vista', 'SC': 'Florianópolis',
  'SP': 'São Paulo', 'SE': 'Aracaju', 'TO': 'Palmas',
};

export function useMarketData() {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [allCitiesData, setAllCitiesData] = useState<CityMarketData[]>([]);
  const [selectedCityData, setSelectedCityData] = useState<CityMarketData | null>(null);
  const [macroIndicators, setMacroIndicators] = useState<MacroIndicators | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const { toast } = useToast();

  const checkApiStatus = useCallback(async () => {
    const result = await marketDataApi.checkApiStatus();
    if (result.success && result.data) {
      setApiStatus(result.data);
    }
  }, []);

  const loadStates = useCallback(async () => {
    const result = await marketDataApi.listStates();
    if (result.success && result.data) {
      setStates(result.data);
    }
  }, []);

  // Carregar cidades de um estado (com capital primeiro)
  const loadCities = useCallback(async (uf: string) => {
    setIsLoadingCities(true);
    try {
      const result = await marketDataApi.listCities(uf);
      if (result.success && result.data) {
        const capital = CAPITALS[uf];
        // Ordenar com capital primeiro
        const sortedCities = result.data.sort((a, b) => {
          if (a.nome === capital) return -1;
          if (b.nome === capital) return 1;
          return a.nome.localeCompare(b.nome);
        });
        setCities(sortedCities);
      } else {
        setCities([]);
      }
    } finally {
      setIsLoadingCities(false);
    }
  }, []);

  // Carregar dados de todas as cidades principais
  const loadAllCitiesData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await marketDataApi.getAllCitiesData();
      if (result.success && result.data) {
        setAllCitiesData(result.data);
        if (result.macro) {
          setMacroIndicators(result.macro);
        }
      } else {
        toast({
          title: 'Erro ao carregar dados',
          description: result.error || 'Não foi possível carregar os dados de mercado',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Buscar dados de uma cidade específica
  const searchCityData = useCallback(async (city: string, uf: string, neighborhood?: string) => {
    setIsLoading(true);
    try {
      const result = await marketDataApi.getMarketData(city, uf, neighborhood);
      if (result.success && result.data) {
        setSelectedCityData(result.data);
        
        // Mostrar fonte dos dados
        if (result.source && result.source !== 'cache') {
          const sourceNames: Record<string, string> = {
            datazap: 'DataZAP',
            fipezap: 'FipeZAP',
            estimated: 'Estimativas',
          };
          toast({
            title: 'Dados carregados',
            description: `Fonte: ${sourceNames[result.source] || result.source}`,
          });
        }
        
        return result.data;
      } else {
        toast({
          title: 'Erro ao buscar dados',
          description: result.error || 'Não foi possível buscar os dados da cidade',
          variant: 'destructive',
        });
        return null;
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Carregar dados iniciais
  useEffect(() => {
    loadStates();
    loadAllCitiesData();
    checkApiStatus();
  }, [loadStates, loadAllCitiesData, checkApiStatus]);

  return {
    states,
    cities,
    allCitiesData,
    selectedCityData,
    macroIndicators,
    apiStatus,
    isLoading,
    isLoadingCities,
    loadStates,
    loadCities,
    loadAllCitiesData,
    searchCityData,
    checkApiStatus,
    setSelectedCityData,
  };
}
