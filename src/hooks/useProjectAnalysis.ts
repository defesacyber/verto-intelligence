import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Competitor {
  id?: string;
  nome: string;
  tipo: 'direto' | 'indireto';
  localizacao?: string;
  tipologia?: string;
  areaMin?: number;
  areaMax?: number;
  precoMin?: number;
  precoMax?: number;
  diferencial?: string;
}

export interface SWOTData {
  forcas: string[];
  fraquezas: string[];
  oportunidades: string[];
  ameacas: string[];
}

export function useProjectCompetitors(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: competitors = [], isLoading } = useQuery({
    queryKey: ['competitors', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_competitors')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const addCompetitor = useMutation({
    mutationFn: async (competitor: Competitor) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('project_competitors').insert({
        project_id: projectId,
        user_id: user?.id,
        nome: competitor.nome,
        tipo: competitor.tipo,
        localizacao: competitor.localizacao,
        tipologia: competitor.tipologia,
        area_min: competitor.areaMin,
        area_max: competitor.areaMax,
        preco_min: competitor.precoMin,
        preco_max: competitor.precoMax,
        diferencial: competitor.diferencial,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors', projectId] });
      toast({ title: 'Concorrente adicionado' });
    },
  });

  const removeCompetitor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('project_competitors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors', projectId] });
    },
  });

  return { competitors, isLoading, addCompetitor, removeCompetitor };
}

export function useProjectSWOT(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: swot, isLoading } = useQuery({
    queryKey: ['swot', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_swot')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data as SWOTData | null;
    },
    enabled: !!projectId,
  });

  const saveSWOT = useMutation({
    mutationFn: async (swotData: SWOTData) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('project_swot').upsert({
        project_id: projectId,
        user_id: user?.id,
        forcas: swotData.forcas,
        fraquezas: swotData.fraquezas,
        oportunidades: swotData.oportunidades,
        ameacas: swotData.ameacas,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'project_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swot', projectId] });
      toast({ title: 'Análise SWOT salva' });
    },
  });

  return {
    swot: swot ?? { forcas: [], fraquezas: [], oportunidades: [], ameacas: [] },
    isLoading,
    saveSWOT,
  };
}
