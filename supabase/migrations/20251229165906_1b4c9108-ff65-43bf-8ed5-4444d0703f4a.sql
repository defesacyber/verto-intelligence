-- Create table for IDI alerts
CREATE TABLE public.idi_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  uf VARCHAR(5) NOT NULL,
  alert_type VARCHAR(50) NOT NULL DEFAULT 'threshold', -- 'threshold', 'increase', 'decrease'
  threshold_value NUMERIC NOT NULL DEFAULT 70,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, cidade, uf, alert_type)
);

-- Enable RLS
ALTER TABLE public.idi_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own IDI alerts"
ON public.idi_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own IDI alerts"
ON public.idi_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own IDI alerts"
ON public.idi_alerts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own IDI alerts"
ON public.idi_alerts
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_idi_alerts_updated_at
BEFORE UPDATE ON public.idi_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();