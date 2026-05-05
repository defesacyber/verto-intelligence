import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AlertHistoryItem {
  id: string;
  user_id: string;
  alert_id: string | null;
  cidade: string;
  uf: string;
  alert_type: string;
  threshold_value: number | null;
  triggered_value: number;
  message: string;
  sent_at: string;
  email_sent: boolean;
}

export function useAlertHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AlertHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('alert_history')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching alert history:', error);
    } else {
      setHistory((data as AlertHistoryItem[]) || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    refetch: fetchHistory,
  };
}
