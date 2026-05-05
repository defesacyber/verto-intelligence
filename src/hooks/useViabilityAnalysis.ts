import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';
import type { ProjectInput, AnalysisResult, UnitDistribution } from '@/lib/viability-types';
import {
  calculateViabilityMetrics,
  generateScenarios,
  calculateRiskScore,
  generateRecommendations,
  determineViabilityStatus,
  generateCashFlow
} from '@/lib/financial-calculations';

interface Project {
  id: string;
  name: string;
  city: string;
  uf: string;
  location: string;
  property_type: string;
  status: string;
  vgv: number;
  roi: number;
  margin: number;
}

export function useViabilityAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [projectInputs, setProjectInputs] = useState<ProjectInput | null>(null);
  const { toast } = useToast();

  const fetchProjectInputs = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('project_inputs')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const parsed: ProjectInput = {
          id: data.id,
          project_id: data.project_id,
          unit_distribution: (data.unit_distribution as UnitDistribution) || {},
          land_acquisition_type: data.land_acquisition_type as ProjectInput['land_acquisition_type'],
          land_cost: data.land_cost || 0,
          permuta_units: data.permuta_units || 0,
          usufruto_years: data.usufruto_years || 0,
          approval_costs: data.approval_costs || 0,
          infrastructure_costs: data.infrastructure_costs || 0,
          project_costs: data.project_costs || 0,
          contingency_percent: data.contingency_percent || 5,
          sales_velocity: data.sales_velocity || 10,
          launch_date: data.launch_date,
          construction_months: data.construction_months || 24,
          financing_rate: data.financing_rate || 12,
          discount_rate: data.discount_rate || 15,
          certifications: (data.certifications as string[]) || [],
          sustainability_initiatives: (data.sustainability_initiatives as string[]) || []
        };
        setProjectInputs(parsed);
        return parsed;
      }
      return null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error fetching project inputs:', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAnalysisResult = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('project_id', projectId)
        .eq('analysis_type', 'viability')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setAnalysisResult(data as unknown as AnalysisResult);
      }
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error fetching analysis:', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runAnalysis = useCallback(async (project: Project, inputs: ProjectInput) => {
    try {
      setIsAnalyzing(true);

      const avgUnitArea = project.property_type === 'vertical' ? 70 : 100;
      const constructionCostPerM2 = 4000;
      const additionalCosts = (inputs.approval_costs || 0) + (inputs.infrastructure_costs || 0) + (inputs.project_costs || 0);
      const totalUnits = Math.max(1, Math.round(project.vgv / (8500 * avgUnitArea)));

      const metrics = calculateViabilityMetrics(
        totalUnits,
        8500 * avgUnitArea,
        inputs.land_cost || project.vgv * 0.2,
        constructionCostPerM2,
        avgUnitArea,
        additionalCosts,
        inputs.contingency_percent || 5,
        inputs.sales_velocity || 10,
        inputs.construction_months || 24,
        inputs.discount_rate || 15,
        inputs.financing_rate || 12
      );

      const scenarios = generateScenarios(metrics, totalUnits, 8500 * avgUnitArea);
      const risk = calculateRiskScore(metrics, 70, 1.2, 5);
      const recommendations = generateRecommendations(metrics, risk.level, (inputs.certifications || []).length > 0);
      const viabilityStatus = determineViabilityStatus(metrics, risk.level);

      const result = {
        project_id: project.id,
        analysis_type: 'viability',
        vpl: metrics.vpl,
        tir: metrics.tir,
        payback_months: metrics.paybackMonths,
        profit_margin: metrics.profitMargin,
        total_investment: metrics.totalInvestment,
        gross_revenue: metrics.grossRevenue,
        net_profit: metrics.netProfit,
        scenarios: scenarios as unknown as Json,
        market_demand: 700,
        supply_demand_ratio: 1.2,
        competitors_count: 5,
        avg_price_m2: 8500,
        risk_score: risk.score,
        risk_level: risk.level,
        risk_factors: risk.factors as unknown as Json,
        recommendations: recommendations as unknown as Json,
        viability_status: viabilityStatus,
        generated_at: new Date().toISOString()
      };

      const { data: existingAnalysis } = await supabase
        .from('analysis_results')
        .select('id')
        .eq('project_id', project.id)
        .eq('analysis_type', 'viability')
        .maybeSingle();

      let savedResult;
      if (existingAnalysis) {
        savedResult = await supabase
          .from('analysis_results')
          .update(result)
          .eq('id', existingAnalysis.id)
          .select()
          .single();
      } else {
        savedResult = await supabase
          .from('analysis_results')
          .insert(result)
          .select()
          .single();
      }

      if (savedResult.error) throw savedResult.error;

      await supabase
        .from('projects')
        .update({ roi: metrics.roi, margin: metrics.profitMargin, status: 'active' })
        .eq('id', project.id);

      setAnalysisResult(savedResult.data as unknown as AnalysisResult);

      toast({
        title: 'Análise concluída!',
        description: `Viabilidade: ${viabilityStatus === 'viavel' ? 'Viável' : viabilityStatus === 'viavel_com_ressalvas' ? 'Viável com ressalvas' : 'Inviável'}`
      });

      return savedResult.data as unknown as AnalysisResult;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado';
      toast({ title: 'Erro na análise', description: message, variant: 'destructive' });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  const getCashFlowProjection = useCallback((result: AnalysisResult) => {
    if (!result) return [];
    const totalUnits = Math.round(result.gross_revenue / (result.avg_price_m2 * 70));
    return generateCashFlow(totalUnits, result.avg_price_m2 * 70, 10, result.total_investment, 24, 0.01);
  }, []);

  return {
    isLoading,
    isAnalyzing,
    analysisResult,
    projectInputs,
    fetchProjectInputs,
    fetchAnalysisResult,
    runAnalysis,
    getCashFlowProjection,
    setProjectInputs
  };
}
