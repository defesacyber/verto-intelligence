import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Report, RecurringReport, ReportType } from '@/lib/types';
import type { ProjectInput } from '@/lib/viability-calculator';
import { useToast } from '@/hooks/use-toast';
import { calculateViability } from '@/lib/viability-calculator';

interface UseReportsOptions {
  projectId?: string;
  type?: ReportType;
}

// Supabase row types
interface ReportRow {
  id: string;
  project_id: string;
  user_id: string;
  pessimistic_vgv: number | null;
  pessimistic_roi: number | null;
  pessimistic_tir: number | null;
  pessimistic_payback: number | null;
  projected_vgv: number | null;
  projected_roi: number | null;
  projected_tir: number | null;
  projected_payback: number | null;
  optimistic_vgv: number | null;
  optimistic_roi: number | null;
  optimistic_tir: number | null;
  optimistic_payback: number | null;
  absorption_time: number | null;
  market_infrastructure?: Record<string, unknown> | null;
  competitors?: Record<string, unknown> | null;
  neighborhood_trends?: Record<string, unknown> | null;
  swot_analysis?: Record<string, unknown> | null;
  strategic_recommendations?: Record<string, unknown> | null;
  market_risk?: Record<string, unknown> | null;
  sensitivity_analysis?: Record<string, unknown> | null;
  cash_flow_projection?: Record<string, unknown> | null;
  supply_demand_analysis?: Record<string, unknown> | null;
  financial_risk_score?: number | null;
  created_at: string;
  updated_at: string;
}

interface RecurringReportRow {
  id: string;
  report_type: ReportType;
  week_number?: number | null;
  month?: number | null;
  quarter?: number | null;
  year: number;
  title: string;
  summary?: string | null;
  news?: Record<string, unknown>[] | null;
  indicators?: Record<string, unknown> | null;
  created_at: string;
}

// Transform database row to Report type
function transformReport(row: ReportRow): Report {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    pessimisticVgv: Number(row.pessimistic_vgv),
    pessimisticRoi: Number(row.pessimistic_roi),
    pessimisticTir: Number(row.pessimistic_tir),
    pessimisticPayback: Number(row.pessimistic_payback),
    projectedVgv: Number(row.projected_vgv),
    projectedRoi: Number(row.projected_roi),
    projectedTir: Number(row.projected_tir),
    projectedPayback: Number(row.projected_payback),
    optimisticVgv: Number(row.optimistic_vgv),
    optimisticRoi: Number(row.optimistic_roi),
    optimisticTir: Number(row.optimistic_tir),
    optimisticPayback: Number(row.optimistic_payback),
    absorptionTime: Number(row.absorption_time),
    marketInfrastructure: row.market_infrastructure,
    competitors: row.competitors,
    neighborhoodTrends: row.neighborhood_trends,
    swotAnalysis: row.swot_analysis,
    strategicRecommendations: row.strategic_recommendations,
    marketRisk: row.market_risk,
    sensitivityAnalysis: row.sensitivity_analysis,
    cashFlowProjection: row.cash_flow_projection,
    supplyDemandAnalysis: row.supply_demand_analysis,
    financialRiskScore: row.financial_risk_score ? Number(row.financial_risk_score) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformRecurringReport(row: RecurringReportRow): RecurringReport {
  return {
    id: row.id,
    reportType: row.report_type,
    weekNumber: row.week_number,
    month: row.month,
    quarter: row.quarter,
    year: row.year,
    title: row.title,
    summary: row.summary,
    news: row.news,
    indicators: row.indicators,
    createdAt: row.created_at,
  };
}

export function useReports(options: UseReportsOptions = {}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [recurringReports, setRecurringReports] = useState<RecurringReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchReports = useCallback(async (opts?: UseReportsOptions) => {
    try {
      setIsLoading(true);
      const params = { ...options, ...opts };

      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (params.projectId) {
        query = query.eq('project_id', params.projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReports(((data || []) as ReportRow[]).map(transformReport));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao carregar relatórios',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [options, toast]);

  const fetchRecurringReports = useCallback(async (type?: ReportType, year?: number) => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('recurring_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('report_type', type);
      }
      if (year) {
        query = query.eq('year', year);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRecurringReports(((data || []) as RecurringReportRow[]).map(transformRecurringReport));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao carregar relatórios',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getReport = useCallback(async (id: string): Promise<Report | null> => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return transformReport(data as ReportRow);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao carregar relatório',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const generateReport = useCallback(async (projectId: string): Promise<Report | null> => {
    try {
      setIsLoading(true);

      // Get project data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Convert to ProjectInput for viability calculation
      const projectVGV = project.vgv || 1000000;
      const projectInput: ProjectInput = {
        landArea: Number(project.total_area) || 1000,
        landCost: projectVGV * 0.2,
        constructionCostPerM2: 3500,
        totalUnits: project.total_units || 10,
        averageUnitArea: Number(project.avg_unit_size) || 80,
        averageSalePrice: projectVGV / (project.total_units || 10),
        constructionMonths: 24,
        salesMonths: 18,
        financingRate: 12,
        otherCosts: projectVGV * 0.05,
      };

      // Calculate viability
      const viability = calculateViability(projectInput);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      // Create report
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert([{
          title: `Relatório - ${project.name}`,
          type: 'viability' as const,
          user_id: userData.user.id,
          project_id: projectId,
          pessimistic_vgv: viability.pessimistic.vgv,
          pessimistic_roi: viability.pessimistic.roi,
          pessimistic_tir: viability.pessimistic.tir,
          pessimistic_payback: viability.pessimistic.paybackMonths,
          projected_vgv: viability.projected.vgv,
          projected_roi: viability.projected.roi,
          projected_tir: viability.projected.tir,
          projected_payback: viability.projected.paybackMonths,
          optimistic_vgv: viability.optimistic.vgv,
          optimistic_roi: viability.optimistic.roi,
          optimistic_tir: viability.optimistic.tir,
          optimistic_payback: viability.optimistic.paybackMonths,
          absorption_time: viability.projected.paybackMonths,
        }])
        .select()
        .single();

      if (reportError) throw reportError;

      toast({
        title: 'Relatório gerado!',
        description: 'O relatório foi criado com sucesso.',
      });

      return transformReport(report as ReportRow);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao gerar relatório',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const generateMarketAnalysis = useCallback(async (_projectId: string): Promise<unknown | null> => {
    try {
      setIsLoading(true);

      // Placeholder for AI-powered market analysis
      toast({
        title: 'Análise de mercado',
        description: 'Funcionalidade em desenvolvimento.',
      });

      return null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro na análise de mercado',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const generateQuantitativeAnalysis = useCallback(async (_projectId: string): Promise<unknown | null> => {
    try {
      setIsLoading(true);

      // Placeholder for quantitative analysis
      toast({
        title: 'Análise quantitativa',
        description: 'Funcionalidade em desenvolvimento.',
      });

      return null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro na análise quantitativa',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const exportPdf = useCallback(async (_reportId: string): Promise<string | null> => {
    try {
      setIsLoading(true);

      // Placeholder for PDF export
      toast({
        title: 'Exportar PDF',
        description: 'Funcionalidade em desenvolvimento.',
      });

      return null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao exportar PDF',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    reports,
    recurringReports,
    isLoading,
    fetchReports,
    fetchRecurringReports,
    getReport,
    generateReport,
    generateMarketAnalysis,
    generateQuantitativeAnalysis,
    exportPdf,
  };
}
