import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PriceAlert {
  id: string;
  city: string;
  uf: string;
  alert_type: 'increase' | 'decrease' | 'any';
  threshold: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function usePriceAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts((data || []).map(d => ({
        ...d,
        alert_type: d.alert_type as 'increase' | 'decrease' | 'any'
      })));
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      toast.error('Erro ao carregar alertas');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addAlert = async (alert: {
    city: string;
    uf: string;
    alert_type: 'increase' | 'decrease' | 'any';
    threshold: number;
  }) => {
    if (!user) {
      toast.error('Faça login para criar alertas');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          city: alert.city,
          uf: alert.uf,
          alert_type: alert.alert_type,
          threshold: alert.threshold,
        })
        .select()
        .single();

      if (error) throw error;
      
      const typedData = { ...data, alert_type: data.alert_type as 'increase' | 'decrease' | 'any' };
      setAlerts(prev => [typedData, ...prev]);
      toast.success('Alerta criado com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
      toast.error('Erro ao criar alerta');
      return null;
    }
  };

  const updateAlert = async (id: string, updates: Partial<Pick<PriceAlert, 'enabled' | 'threshold' | 'alert_type'>>) => {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const typedData = { ...data, alert_type: data.alert_type as 'increase' | 'decrease' | 'any' };
      setAlerts(prev => prev.map(a => a.id === id ? typedData : a));
      return typedData;
    } catch (error) {
      console.error('Erro ao atualizar alerta:', error);
      toast.error('Erro ao atualizar alerta');
      return null;
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success('Alerta removido');
      return true;
    } catch (error) {
      console.error('Erro ao remover alerta:', error);
      toast.error('Erro ao remover alerta');
      return false;
    }
  };

  const toggleAlert = async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      return updateAlert(id, { enabled: !alert.enabled });
    }
    return null;
  };

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    isLoading,
    addAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    refetch: fetchAlerts,
  };
}
