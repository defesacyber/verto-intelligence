-- Create alert history table
CREATE TABLE public.alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID REFERENCES public.idi_alerts(id) ON DELETE SET NULL,
  cidade TEXT NOT NULL,
  uf TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  threshold_value NUMERIC,
  triggered_value NUMERIC NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_sent BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own alert history"
  ON public.alert_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert alert history"
  ON public.alert_history
  FOR INSERT
  WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_alert_history_user_id ON public.alert_history(user_id);
CREATE INDEX idx_alert_history_sent_at ON public.alert_history(sent_at DESC);