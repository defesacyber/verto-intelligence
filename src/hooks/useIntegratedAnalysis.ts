import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMarketResearch, MarketResearchState } from './useMarketResearch';
import { useViabilityAnalysis } from './useViabilityAnalysis';
import type { Json } from '@/integrations/supabase/types';
import type { AnalysisResult, ProjectInput } from '@/lib/viability-types';

interface Project {
  id: string;
  name: string;
  city: string;
  uf: string;
  neighborhood?: string | null;
  property_type?: string | null;
  vgv?: number | null;
  total_units?: number | null;
  [key: string]: string | number | boolean | null | undefined;
}

export interface IntegratedAnalysisResult {
  marketResearch: MarketResearchState;
  viabilityResult: AnalysisResult | null;
  savedReportId: string | null;
}

export function useIntegratedAnalysis() {
  const [isSaving, setIsSaving] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  
  const marketResearch = useMarketResearch();
  const viability = useViabilityAnalysis();

  // Salvar pesquisa de mercado no banco
  const saveMarketResearch = useCallback(async (
    projectId: string,
    researchData: MarketResearchState
  ) => {
    try {
      setIsSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se já existe relatório
      const { data: existing } = await supabase
        .from('market_research_reports')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle();

      const reportData = {
        project_id: projectId,
        user_id: user.id,
        status: 'completed',
        macro_data: researchData.macroData as unknown as Json,
        macro_summary: researchData.macroData?.summary || null,
        city_data: researchData.cityData as unknown as Json,
        city_analysis: researchData.cityData ? 
          `Análise de ${researchData.cityData.city}/${researchData.cityData.uf}` : null,
        neighborhood_data: researchData.neighborhoodData as unknown as Json,
        neighborhood_analysis: researchData.neighborhoodData?.neighborhood || null,
        demand_data: researchData.demandData as unknown as Json,
        demand_analysis: researchData.demandData?.analysis || null,
        competitors: researchData.competitors as unknown as Json,
        sales_velocity_scenarios: researchData.velocityData?.scenarios as unknown as Json,
        velocity_analysis: researchData.velocityData?.recommendation || null,
        product_adequacy: researchData.adequacyData?.verdict || null,
        product_adequacy_justification: researchData.adequacyData?.justification || null,
        best_neighborhoods: researchData.cityData?.best_neighborhoods as unknown as Json,
        buyer_profile: researchData.demandData?.buyer_profile as unknown as Json,
        price_by_segment: researchData.cityData?.segments as unknown as Json,
        final_verdict: researchData.conclusionData?.final_verdict || null,
        market_conclusion: researchData.conclusionData?.full_conclusion || null,
        data_sources: researchData.macroData?.data_sources as unknown as Json,
        generation_progress: 100,
        updated_at: new Date().toISOString()
      };

      let savedReport;
      if (existing) {
        savedReport = await supabase
          .from('market_research_reports')
          .update(reportData)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        savedReport = await supabase
          .from('market_research_reports')
          .insert(reportData)
          .select()
          .single();
      }

      if (savedReport.error) throw savedReport.error;

      // Salvar concorrentes na tabela dedicada
      if (researchData.competitors.length > 0) {
        // Deletar concorrentes existentes
        await supabase
          .from('competitor_data')
          .delete()
          .eq('project_id', projectId);

        // Inserir novos
        const competitorInserts = researchData.competitors.map(c => ({
          project_id: projectId,
          market_research_id: savedReport.data.id,
          name: c.name,
          developer: c.developer || null,
          avg_price_m2: c.avg_price_m2 || null,
          total_units: c.total_units || null,
          sold_units: c.sold_units || null,
          source: c.source || 'manual',
          source_url: c.source_url || null,
          city: researchData.cityData?.city || '',
          uf: researchData.cityData?.uf || ''
        }));

        await supabase
          .from('competitor_data')
          .insert(competitorInserts);
      }

      setSavedReportId(savedReport.data.id);
      toast.success('Pesquisa de mercado salva com sucesso!');
      
      return savedReport.data;
    } catch (error) {
      console.error('Error saving market research:', error);
      toast.error('Erro ao salvar pesquisa de mercado');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Carregar pesquisa de mercado existente
  const loadMarketResearch = useCallback(async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('market_research_reports')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSavedReportId(data.id);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error loading market research:', error);
      return null;
    }
  }, []);

  // Rodar análise completa (mercado + viabilidade)
  const runIntegratedAnalysis = useCallback(async (
    project: Project,
    projectInputs: ProjectInput
  ): Promise<IntegratedAnalysisResult | null> => {
    try {
      // 1. Executar pesquisa de mercado
      const marketResult = await marketResearch.runFullResearch(project);
      if (!marketResult) {
        throw new Error('Falha na pesquisa de mercado');
      }

      // 2. Salvar pesquisa
      await saveMarketResearch(project.id, {
        ...marketResult,
        competitors: marketResearch.state.competitors
      });

      // 3. Executar análise de viabilidade com dados de mercado
      if (projectInputs) {
        const viabilityResult = await viability.runAnalysis(project, projectInputs);
        
        return {
          marketResearch: marketResult as MarketResearchState,
          viabilityResult,
          savedReportId
        };
      }

      return {
        marketResearch: marketResult as MarketResearchState,
        viabilityResult: null,
        savedReportId
      };
    } catch (error) {
      console.error('Error in integrated analysis:', error);
      toast.error('Erro na análise integrada');
      return null;
    }
  }, [marketResearch, viability, saveMarketResearch, savedReportId]);

  return {
    // Market research
    isLoadingMarket: marketResearch.isLoading,
    marketProgress: marketResearch.progress,
    marketState: marketResearch.state,
    runMarketResearch: marketResearch.runFullResearch,
    addCompetitor: marketResearch.addCompetitor,
    removeCompetitor: marketResearch.removeCompetitor,
    
    // Viability
    isAnalyzing: viability.isAnalyzing,
    viabilityResult: viability.analysisResult,
    projectInputs: viability.projectInputs,
    fetchProjectInputs: viability.fetchProjectInputs,
    runViabilityAnalysis: viability.runAnalysis,
    getCashFlowProjection: viability.getCashFlowProjection,
    
    // Integrated
    isSaving,
    savedReportId,
    saveMarketResearch,
    loadMarketResearch,
    runIntegratedAnalysis
  };
}
