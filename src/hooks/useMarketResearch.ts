import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MacroIndicators {
  selic: { current: number | null; previous_12m: number | null; variation_12m: number | null; trend: string; source: string };
  ipca: { current: number | null; previous_12m: number | null; trend: string; source: string };
  incc: { monthly: number | null; accumulated_12m: number | null; source: string };
  igpm: { monthly: number | null; accumulated_12m: number | null; source: string };
  pib: { quarterly_variation: number | null; trend: string; source: string };
  unemployment: { rate: number | null; source: string };
  consumer_confidence: { index: number | null; source: string };
  business_confidence: { index: number | null; source: string };
  dollar: { rate: number | null; source: string };
  financing_rate: { caixa_estimate: number; sbpe_estimate: number; fgts_estimate: number; source: string };
}

export interface MacroData {
  indicators: MacroIndicators;
  summary: string;
  impact_analysis: Record<string, unknown>;
  projections: Record<string, unknown>;
  data_sources: { name: string; url: string }[];
  fetched_at: string;
}

export interface CityData {
  city: string;
  uf: string;
  population: number;
  households: number;
  price_data: {
    current_price_m2: number | null;
    rent_price_m2: number | null;
    variation_12m: number | null;
    variation_24m: number | null;
    historical: { month: string; price_m2: number; rent_m2: number }[];
  };
  market_snapshot: Record<string, unknown>;
  idi_score: Record<string, unknown>;
  segments: Array<Record<string, unknown>>;
  best_neighborhoods: Array<Record<string, unknown>>;
  economic_drivers: string[];
  data_sources: string[];
  fetched_at: string;
}

export interface NeighborhoodData {
  neighborhood: string;
  city: string;
  uf: string;
  price_data: {
    avg_price_m2: number | null;
    min_price_m2: number | null;
    max_price_m2: number | null;
    vs_city_avg: number | null;
  } | null;
  market_data: Record<string, unknown>;
  infrastructure: Record<string, unknown>;
  socioeconomic_profile: Record<string, unknown>;
  growth_trends: Record<string, unknown>;
  data_sources: string[];
  fetched_at: string;
}

export interface AdequacyData {
  score: number;
  verdict: 'ADEQUADO' | 'PARCIALMENTE_ADEQUADO' | 'INADEQUADO';
  verdict_class: string;
  factors: { factor: string; status: string; detail: string }[];
  justification: string;
}

export interface DemandData {
  population: number;
  households: number;
  potential_demand_24m: number;
  potential_demand_12m: number;
  qualified_demand_24m: number;
  qualified_demand_12m: number;
  segment_demand_24m: number;
  segment_demand_12m: number;
  methodology: Record<string, unknown>;
  buyer_profile: Record<string, unknown>;
  analysis: string;
}

export interface VelocityData {
  market_share_required: number;
  competitor_avg_vso: number;
  scenarios: {
    pessimista: { vso_monthly: number; units_per_month: number; months_to_sell: number; justification: string };
    realista: { vso_monthly: number; units_per_month: number; months_to_sell: number; justification: string };
    otimista: { vso_monthly: number; units_per_month: number; months_to_sell: number; justification: string };
  };
  client_expectation_months: number;
  client_alignment: string;
  recommendation: string;
}

export interface ConclusionData {
  synthesis: {
    macro: string;
    city: string;
    neighborhood: string;
    adequacy: string;
    demand: string;
    velocity: string;
  };
  final_verdict: 'FAVORAVEL' | 'FAVORAVEL_COM_RESSALVAS' | 'DESFAVORAVEL';
  verdict_class: string;
  full_conclusion: string;
  recommendations: string[];
  risks: string[];
  generated_at: string;
}

export interface MarketResearchState {
  macroData: MacroData | null;
  cityData: CityData | null;
  neighborhoodData: NeighborhoodData | null;
  adequacyData: AdequacyData | null;
  demandData: DemandData | null;
  velocityData: VelocityData | null;
  conclusionData: ConclusionData | null;
  competitors: Array<Record<string, unknown>>;
}

export interface MarketResearchProgress {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  percentage: number;
}

export function useMarketResearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<MarketResearchProgress>({
    currentStep: 0,
    totalSteps: 7,
    stepLabel: '',
    percentage: 0
  });
  const [state, setState] = useState<MarketResearchState>({
    macroData: null,
    cityData: null,
    neighborhoodData: null,
    adequacyData: null,
    demandData: null,
    velocityData: null,
    conclusionData: null,
    competitors: []
  });

  const updateProgress = (step: number, label: string) => {
    setProgress({
      currentStep: step,
      totalSteps: 7,
      stepLabel: label,
      percentage: Math.round((step / 7) * 100)
    });
  };

  const fetchMacroData = useCallback(async (): Promise<MacroData | null> => {
    try {
      updateProgress(1, 'Buscando dados macroeconômicos...');
      
      const { data, error } = await supabase.functions.invoke('market-research', {
        body: { action: 'fetch-macro' }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar dados macro');

      setState(prev => ({ ...prev, macroData: data.data }));
      return data.data;
    } catch (error) {
      console.error('Error fetching macro data:', error);
      toast.error('Erro ao buscar dados macroeconômicos');
      return null;
    }
  }, []);

  const fetchCityData = useCallback(async (city: string, uf: string): Promise<CityData | null> => {
    try {
      updateProgress(2, `Analisando mercado de ${city}...`);
      
      const { data, error } = await supabase.functions.invoke('market-research', {
        body: { action: 'fetch-city-data', city, uf }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar dados da cidade');

      setState(prev => ({ ...prev, cityData: data.data }));
      return data.data;
    } catch (error) {
      console.error('Error fetching city data:', error);
      toast.error('Erro ao buscar dados da cidade');
      return null;
    }
  }, []);

  const fetchNeighborhoodData = useCallback(async (neighborhood: string, city: string, uf: string): Promise<NeighborhoodData | null> => {
    try {
      updateProgress(3, `Analisando bairro ${neighborhood}...`);
      
      const { data, error } = await supabase.functions.invoke('market-research', {
        body: { action: 'fetch-neighborhood-data', neighborhood, city, uf }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar dados do bairro');

      setState(prev => ({ ...prev, neighborhoodData: data.data }));
      return data.data;
    } catch (error) {
      console.error('Error fetching neighborhood data:', error);
      toast.error('Erro ao buscar dados do bairro');
      return null;
    }
  }, []);

  const evaluateAdequacy = useCallback(async (projectData: unknown, neighborhoodData: unknown, cityData: unknown): Promise<AdequacyData | null> => {
    try {
      updateProgress(4, 'Avaliando adequação do produto...');
      
      const { data, error } = await supabase.functions.invoke('market-research', {
        body: { 
          action: 'evaluate-product-adequacy',
          projectData,
          neighborhoodData,
          cityData
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro na avaliação de adequação');

      setState(prev => ({ ...prev, adequacyData: data.data }));
      return data.data;
    } catch (error) {
      console.error('Error evaluating adequacy:', error);
      toast.error('Erro ao avaliar adequação do produto');
      return null;
    }
  }, []);

  const calculateDemand = useCallback(async (cityData: unknown, projectData: unknown): Promise<DemandData | null> => {
    try {
      updateProgress(5, 'Calculando demanda de mercado...');
      
      const { data, error } = await supabase.functions.invoke('market-research', {
        body: { 
          action: 'calculate-demand',
          cityData,
          projectData
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro no cálculo de demanda');

      setState(prev => ({ ...prev, demandData: data.data }));
      return data.data;
    } catch (error) {
      console.error('Error calculating demand:', error);
      toast.error('Erro ao calcular demanda');
      return null;
    }
  }, []);

  const projectVelocity = useCallback(async (demandData: unknown, projectData: unknown, competitorData: Array<Record<string, unknown>>): Promise<VelocityData | null> => {
    try {
      updateProgress(6, 'Projetando velocidade de vendas...');
      
      const { data, error } = await supabase.functions.invoke('market-research', {
        body: { 
          action: 'project-sales-velocity',
          demandData,
          projectData,
          competitorData
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro na projeção de velocidade');

      setState(prev => ({ ...prev, velocityData: data.data }));
      return data.data;
    } catch (error) {
      console.error('Error projecting velocity:', error);
      toast.error('Erro ao projetar velocidade de vendas');
      return null;
    }
  }, []);

  const generateConclusion = useCallback(async (
    macroData: unknown,
    cityData: unknown,
    neighborhoodData: unknown,
    adequacyData: unknown,
    demandData: unknown,
    velocityData: unknown
  ): Promise<ConclusionData | null> => {
    try {
      updateProgress(7, 'Gerando conclusão da pesquisa...');
      
      const { data, error } = await supabase.functions.invoke('market-research', {
        body: { 
          action: 'generate-conclusion',
          macroData,
          cityData,
          neighborhoodData,
          adequacyData,
          demandData,
          velocityData
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro na geração da conclusão');

      setState(prev => ({ ...prev, conclusionData: data.data }));
      return data.data;
    } catch (error) {
      console.error('Error generating conclusion:', error);
      toast.error('Erro ao gerar conclusão');
      return null;
    }
  }, []);

  type ProjectMinimal = { city: string; uf: string; neighborhood?: string | null; bairro?: string | null };
  const runFullResearch = useCallback(async (project: ProjectMinimal) => {
    setIsLoading(true);
    
    try {
      // Step 1: Macro
      const macro = await fetchMacroData();
      if (!macro) throw new Error('Falha ao buscar dados macro');

      // Step 2: City
      const city = await fetchCityData(project.city, project.uf);
      if (!city) throw new Error('Falha ao buscar dados da cidade');

      // Step 3: Neighborhood
      const neighborhoodName = project.neighborhood || project.bairro;
      const neighborhood = neighborhoodName
        ? await fetchNeighborhoodData(neighborhoodName, project.city, project.uf)
        : null;

      // Step 4: Adequacy
      const adequacy = await evaluateAdequacy(project, neighborhood, city);

      // Step 5: Demand
      const demand = await calculateDemand(city, project);

      // Step 6: Velocity
      const velocity = await projectVelocity(demand, project, state.competitors);

      // Step 7: Conclusion
      const conclusion = await generateConclusion(
        macro,
        city,
        neighborhood,
        adequacy,
        demand,
        velocity
      );

      toast.success('Pesquisa de mercado concluída!');
      
      return {
        macroData: macro,
        cityData: city,
        neighborhoodData: neighborhood,
        adequacyData: adequacy,
        demandData: demand,
        velocityData: velocity,
        conclusionData: conclusion
      };
    } catch (error) {
      console.error('Error in full research:', error);
      toast.error('Erro durante a pesquisa de mercado');
      return null;
    } finally {
      setIsLoading(false);
      setProgress({ currentStep: 0, totalSteps: 7, stepLabel: '', percentage: 0 });
    }
  }, [fetchMacroData, fetchCityData, fetchNeighborhoodData, evaluateAdequacy, calculateDemand, projectVelocity, generateConclusion, state.competitors]);

  const addCompetitor = useCallback((competitor: Record<string, unknown>) => {
    setState(prev => ({
      ...prev,
      competitors: [...prev.competitors, competitor]
    }));
  }, []);

  const removeCompetitor = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      macroData: null,
      cityData: null,
      neighborhoodData: null,
      adequacyData: null,
      demandData: null,
      velocityData: null,
      conclusionData: null,
      competitors: []
    });
    setProgress({ currentStep: 0, totalSteps: 7, stepLabel: '', percentage: 0 });
  }, []);

  return {
    isLoading,
    progress,
    state,
    fetchMacroData,
    fetchCityData,
    fetchNeighborhoodData,
    evaluateAdequacy,
    calculateDemand,
    projectVelocity,
    generateConclusion,
    runFullResearch,
    addCompetitor,
    removeCompetitor,
    resetState
  };
}
