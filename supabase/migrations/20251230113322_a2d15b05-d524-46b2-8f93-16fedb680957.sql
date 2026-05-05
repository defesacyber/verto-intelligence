-- Create reports table for storing generated reports
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type VARCHAR NOT NULL DEFAULT 'viability',
  title VARCHAR NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Scenario fields for viability reports
  pessimistic_vgv NUMERIC,
  pessimistic_roi NUMERIC,
  pessimistic_tir NUMERIC,
  pessimistic_payback NUMERIC,
  projected_vgv NUMERIC,
  projected_roi NUMERIC,
  projected_tir NUMERIC,
  projected_payback NUMERIC,
  optimistic_vgv NUMERIC,
  optimistic_roi NUMERIC,
  optimistic_tir NUMERIC,
  optimistic_payback NUMERIC,
  
  -- Market analysis fields
  absorption_time NUMERIC,
  market_infrastructure JSONB,
  competitors JSONB,
  neighborhood_trends JSONB,
  swot_analysis JSONB,
  strategic_recommendations JSONB,
  market_risk JSONB,
  sensitivity_analysis JSONB,
  cash_flow_projection JSONB,
  supply_demand_analysis JSONB,
  financial_risk_score NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own reports" 
  ON public.reports 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports" 
  ON public.reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" 
  ON public.reports 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" 
  ON public.reports 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create recurring_reports table for weekly/monthly/quarterly market reports
CREATE TABLE public.recurring_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type VARCHAR NOT NULL,
  week_number INTEGER,
  month INTEGER,
  quarter INTEGER,
  year INTEGER NOT NULL,
  title VARCHAR NOT NULL,
  summary TEXT,
  news JSONB DEFAULT '[]'::jsonb,
  indicators JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public read, admin write)
ALTER TABLE public.recurring_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can view recurring reports
CREATE POLICY "Anyone can view recurring reports" 
  ON public.recurring_reports 
  FOR SELECT 
  USING (true);