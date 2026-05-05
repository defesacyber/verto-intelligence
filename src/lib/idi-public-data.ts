import { supabase } from "@/integrations/supabase/client";

// Tipos para dados públicos IDI
export interface MacroIndicators {
  data_referencia: string;
  selic_meta: number | null;
  selic_acumulada_mes: number | null;
  ipca_mes: number | null;
  ipca_acumulado_12m: number | null;
  incc_mes: number | null;
  incc_acumulado_12m: number | null;
  igpm_mes: number | null;
  igpm_acumulado_12m: number | null;
  pib_variacao_trimestre: number | null;
  pib_variacao_12m: number | null;
  taxa_desemprego: number | null;
  confianca_consumidor: number | null;
}

export interface FipeZapHistorico {
  mes: string;
  cidade: string;
  uf: string;
  tipo_imovel: string;
  indice_venda: number | null;
  variacao_venda_mes: number | null;
  variacao_venda_12m: number | null;
  preco_m2_venda: number | null;
  indice_locacao: number | null;
  variacao_locacao_mes: number | null;
  variacao_locacao_12m: number | null;
  preco_m2_locacao: number | null;
}

export interface IDIScore {
  id?: string;
  mes: string;
  cidade: string;
  uf: string;
  tipo_imovel?: string;
  score_preco?: number | null;
  score_variacao: number | null;
  score_demanda: number | null;
  score_liquidez: number | null;
  score_macro?: number | null;
  score_idi: number;
  score_idi_normalizado: number | null;
  ranking_nacional: number | null;
  ranking_estadual: number | null;
  confianca_score?: number;
  fontes_utilizadas?: string[];
  atualizado_em?: string;
}

export interface CityIDIData {
  score: IDIScore | null;
  historico: Pick<FipeZapHistorico, 'mes' | 'indice_venda' | 'variacao_venda_mes' | 'indice_locacao'>[];
  cidade: string;
  uf: string;
}

// API para dados macroeconômicos do BCB
export const bcbMacroApi = {
  // Buscar dados mais recentes do BCB (atualiza cache se necessário)
  async getLatest(): Promise<{ success: boolean; data?: MacroIndicators; source?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('bcb-macro-data', {
        body: { action: 'get-cached' },
      });

      if (error) {
        console.error('Error fetching BCB data:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      console.error('Error in bcbMacroApi.getLatest:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },

  // Forçar atualização dos dados do BCB
  async refresh(): Promise<{ success: boolean; data?: MacroIndicators; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('bcb-macro-data', {
        body: { action: 'fetch-latest' },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },

  // Buscar histórico de indicadores
  async getHistorical(months: number = 12): Promise<{ success: boolean; data?: MacroIndicators[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('bcb-macro-data', {
        body: { action: 'get-historical', months },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },
};

// API para dados FipeZap e IDI Score
export const idiDataApi = {
  // Importar dados históricos do FipeZap (admin)
  async importFipeZapHistorical(months: number = 24): Promise<{ success: boolean; imported?: number; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('idi-data-import', {
        body: { action: 'import-fipezap-historical', months },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },

  // Calcular scores IDI para um mês
  async calculateScores(month?: string): Promise<{ success: boolean; scores_calculated?: number; top_5?: unknown[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('idi-data-import', {
        body: { action: 'calculate-idi-scores', month },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },

  // Buscar score IDI de uma cidade (query direta ao banco, sem auth)
  async getCityIDI(cidade: string, uf: string): Promise<{ success: boolean; data?: CityIDIData; error?: string }> {
    try {
      const [scoreResult, historicoResult] = await Promise.all([
        supabase
          .from('idi_score_cache')
          .select('*')
          .eq('cidade', cidade)
          .eq('uf', uf)
          .order('mes', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('idi_fipezap_historico')
          .select('mes, indice_venda, variacao_venda_mes, indice_locacao')
          .eq('cidade', cidade)
          .eq('uf', uf)
          .order('mes', { ascending: false })
          .limit(12),
      ]);

      if (scoreResult.error) return { success: false, error: scoreResult.error.message };

      const historico = (historicoResult.data ?? []).reverse();
      return {
        success: true,
        data: { score: scoreResult.data as IDIScore | null, historico, cidade, uf },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },

  // Buscar ranking nacional ou estadual (query direta ao banco, sem auth)
  async getRanking(limit: number = 20, uf?: string): Promise<{ success: boolean; data?: IDIScore[]; error?: string }> {
    try {
      // Buscar o mês mais recente disponível
      const { data: latestRow, error: mesError } = await supabase
        .from('idi_score_cache')
        .select('mes')
        .order('mes', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mesError) return { success: false, error: mesError.message };
      if (!latestRow) return { success: true, data: [] };

      let query = supabase
        .from('idi_score_cache')
        .select('cidade, uf, mes, score_idi, score_idi_normalizado, score_variacao, score_demanda, score_liquidez, score_macro, ranking_nacional, ranking_estadual, confianca_score, atualizado_em')
        .eq('mes', latestRow.mes)
        .order('ranking_nacional', { ascending: true })
        .limit(limit);

      if (uf) query = query.eq('uf', uf);

      const { data, error } = await query;
      if (error) return { success: false, error: error.message };

      return { success: true, data: (data as IDIScore[]) || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },

  // Buscar dados FipeZap diretamente do banco (para queries mais complexas)
  async getFipeZapHistorico(cidade?: string, uf?: string, months: number = 12): Promise<FipeZapHistorico[]> {
    let query = supabase
      .from('idi_fipezap_historico')
      .select('*')
      .order('mes', { ascending: false })
      .limit(months);

    if (cidade) query = query.eq('cidade', cidade);
    if (uf) query = query.eq('uf', uf);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching FipeZap historico:', error);
      return [];
    }

    return (data as FipeZapHistorico[]) || [];
  },

  // Buscar scores IDI diretamente do banco
  async getIDIScores(limit: number = 50): Promise<IDIScore[]> {
    const { data, error } = await supabase
      .from('idi_score_cache')
      .select('*')
      .order('ranking_nacional', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching IDI scores:', error);
      return [];
    }

    return (data as IDIScore[]) || [];
  },
};

// Utilitários para formatação
export const formatters = {
  // Formatar variação percentual
  percentage(value: number | null, decimals: number = 2): string {
    if (value === null || value === undefined) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
  },

  // Formatar índice
  index(value: number | null, decimals: number = 2): string {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(decimals);
  },

  // Formatar score IDI (0-100)
  score(value: number | null): string {
    if (value === null || value === undefined) return 'N/A';
    return Math.round(value).toString();
  },

  // Classificar score IDI
  scoreClass(value: number | null): 'excellent' | 'good' | 'moderate' | 'low' | 'unknown' {
    if (value === null || value === undefined) return 'unknown';
    if (value >= 80) return 'excellent';
    if (value >= 65) return 'good';
    if (value >= 50) return 'moderate';
    return 'low';
  },

  // Cor do score
  scoreColor(value: number | null): string {
    const scoreClass = formatters.scoreClass(value);
    switch (scoreClass) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'moderate': return 'text-yellow-500';
      case 'low': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  },

  // Label do score
  scoreLabel(value: number | null): string {
    const scoreClass = formatters.scoreClass(value);
    switch (scoreClass) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'moderate': return 'Moderado';
      case 'low': return 'Baixo';
      default: return 'Indisponível';
    }
  },
};
