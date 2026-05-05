import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bcbMacroApi, idiDataApi, MacroIndicators, IDIScore, CityIDIData } from '@/lib/idi-public-data';
import { toast } from 'sonner';

// Hook para indicadores macroeconômicos do BCB
export function useMacroIndicators() {
  return useQuery({
    queryKey: ['macro-indicators'],
    queryFn: async () => {
      const result = await bcbMacroApi.getLatest();
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar indicadores');
      }
      return result.data as MacroIndicators;
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    refetchInterval: 1000 * 60 * 60 * 6, // Recarregar a cada 6 horas
  });
}

// Hook para histórico de indicadores macro
export function useMacroHistory(months: number = 12) {
  return useQuery({
    queryKey: ['macro-history', months],
    queryFn: async () => {
      const result = await bcbMacroApi.getHistorical(months);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar histórico');
      }
      return result.data as MacroIndicators[];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
  });
}

// Hook para ranking IDI
export function useIDIRanking(limit: number = 20, uf?: string) {
  return useQuery({
    queryKey: ['idi-ranking', limit, uf],
    queryFn: async () => {
      const result = await idiDataApi.getRanking(limit, uf);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar ranking');
      }
      return result.data as IDIScore[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
}

// Hook para score IDI de uma cidade específica
export function useCityIDI(cidade: string, uf: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['city-idi', cidade, uf],
    queryFn: async () => {
      const result = await idiDataApi.getCityIDI(cidade, uf);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar dados da cidade');
      }
      return result.data as CityIDIData;
    },
    enabled: enabled && !!cidade && !!uf,
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
}

// Hook para importação e cálculo de dados (admin)
export function useIDIDataManagement() {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const importFipeZap = useMutation({
    mutationFn: async (months: number = 24) => {
      setIsImporting(true);
      const result = await idiDataApi.importFipeZapHistorical(months);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Importados ${data.imported} registros FipeZap`);
      queryClient.invalidateQueries({ queryKey: ['idi-ranking'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
    onSettled: () => {
      setIsImporting(false);
    },
  });

  const calculateScores = useMutation({
    mutationFn: async (month?: string) => {
      setIsCalculating(true);
      const result = await idiDataApi.calculateScores(month);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Calculados ${data.scores_calculated} scores IDI`);
      queryClient.invalidateQueries({ queryKey: ['idi-ranking'] });
      queryClient.invalidateQueries({ queryKey: ['city-idi'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro no cálculo: ${error.message}`);
    },
    onSettled: () => {
      setIsCalculating(false);
    },
  });

  const refreshMacro = useMutation({
    mutationFn: async () => {
      const result = await bcbMacroApi.refresh();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      toast.success('Indicadores macroeconômicos atualizados');
      queryClient.invalidateQueries({ queryKey: ['macro-indicators'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar macro: ${error.message}`);
    },
  });

  return {
    importFipeZap,
    calculateScores,
    refreshMacro,
    isImporting,
    isCalculating,
  };
}

// Hook combinado para dashboard de mercado
export function useMarketDashboard() {
  const macroQuery = useMacroIndicators();
  const rankingQuery = useIDIRanking(10);

  const isLoading = macroQuery.isLoading || rankingQuery.isLoading;
  const hasError = macroQuery.isError || rankingQuery.isError;

  return {
    macro: macroQuery.data,
    ranking: rankingQuery.data || [],
    isLoading,
    hasError,
    refetch: useCallback(() => {
      macroQuery.refetch();
      rankingQuery.refetch();
    }, [macroQuery, rankingQuery]),
  };
}
