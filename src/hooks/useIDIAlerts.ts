import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface IDIAlert {
  id: string;
  user_id: string;
  cidade: string;
  uf: string;
  alert_type: 'threshold' | 'increase' | 'decrease';
  threshold_value: number;
  enabled: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

interface NewIDIAlert {
  cidade: string;
  uf: string;
  alert_type: 'threshold' | 'increase' | 'decrease';
  threshold_value: number;
}

export function useIDIAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<IDIAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('idi_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching IDI alerts:', error);
      toast.error('Erro ao carregar alertas');
    } else {
      setAlerts((data as IDIAlert[]) || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const addAlert = async (newAlert: NewIDIAlert) => {
    if (!user) {
      toast.error('Faça login para criar alertas');
      return;
    }

    const { data, error } = await supabase
      .from('idi_alerts')
      .insert({
        user_id: user.id,
        cidade: newAlert.cidade,
        uf: newAlert.uf,
        alert_type: newAlert.alert_type,
        threshold_value: newAlert.threshold_value,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast.error('Alerta já existe para esta cidade');
      } else {
        console.error('Error adding alert:', error);
        toast.error('Erro ao criar alerta');
      }
      return;
    }

    setAlerts(prev => [data as IDIAlert, ...prev]);
    toast.success('Alerta criado com sucesso');
  };

  const toggleAlert = async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;

    const { error } = await supabase
      .from('idi_alerts')
      .update({ enabled: !alert.enabled })
      .eq('id', id);

    if (error) {
      console.error('Error toggling alert:', error);
      toast.error('Erro ao atualizar alerta');
      return;
    }

    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase
      .from('idi_alerts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting alert:', error);
      toast.error('Erro ao excluir alerta');
      return;
    }

    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success('Alerta excluído');
  };

  const updateThreshold = async (id: string, threshold_value: number) => {
    const { error } = await supabase
      .from('idi_alerts')
      .update({ threshold_value })
      .eq('id', id);

    if (error) {
      console.error('Error updating threshold:', error);
      toast.error('Erro ao atualizar threshold');
      return;
    }

    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, threshold_value } : a
    ));
    toast.success('Threshold atualizado');
  };

  return {
    alerts,
    isLoading,
    addAlert,
    toggleAlert,
    deleteAlert,
    updateThreshold,
    refetch: fetchAlerts,
  };
}