-- ============================================
-- MIGRATION: Subscription & Payment Tables
-- Purpose: Real subscription management with Stripe/PagSeguro integration
-- ============================================

-- ============================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL CHECK (price_monthly >= 0),
  price_yearly DECIMAL(10,2) CHECK (price_yearly >= 0),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON public.subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON public.subscription_plans(sort_order);

COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans for the platform';
COMMENT ON COLUMN public.subscription_plans.features IS 'Array of feature descriptions';
COMMENT ON COLUMN public.subscription_plans.limits IS 'JSON object with usage limits: {projects: N, reports_per_month: N, api_calls_per_day: N}';

-- ============================================
-- USER SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial', 'past_due')),

  -- Payment provider info
  payment_provider VARCHAR(50) CHECK (payment_provider IN ('stripe', 'pagseguro', 'manual', NULL)),
  payment_provider_customer_id VARCHAR(255),
  payment_provider_subscription_id VARCHAR(255),

  -- Billing periods
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,

  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_provider_sub_id ON public.user_subscriptions(payment_provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON public.user_subscriptions(current_period_end);

COMMENT ON TABLE public.user_subscriptions IS 'User subscription records with payment provider integration';
COMMENT ON COLUMN public.user_subscriptions.cancel_at_period_end IS 'If true, subscription will be cancelled at end of current period';

-- ============================================
-- PAYMENT TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,

  -- Transaction details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),

  -- Payment provider info
  payment_provider VARCHAR(50) NOT NULL,
  payment_provider_transaction_id VARCHAR(255),
  payment_provider_customer_id VARCHAR(255),
  payment_method VARCHAR(50) CHECK (payment_method IN ('credit_card', 'debit_card', 'pix', 'boleto', 'bank_transfer', NULL)),

  -- Additional info
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,

  -- Timestamps
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription ON public.payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON public.payment_transactions(payment_provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON public.payment_transactions(created_at DESC);

COMMENT ON TABLE public.payment_transactions IS 'Payment transaction log for audit and reconciliation';
COMMENT ON COLUMN public.payment_transactions.metadata IS 'Additional transaction data from payment provider';

-- ============================================
-- SUBSCRIPTION USAGE TABLE (for tracking limits)
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscription_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,

  -- Usage metrics
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  projects_created INTEGER DEFAULT 0,
  reports_generated INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(subscription_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_user ON public.subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription ON public.subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_period ON public.subscription_usage(period_start, period_end);

COMMENT ON TABLE public.subscription_usage IS 'Track usage against subscription limits for billing periods';

-- ============================================
-- INSERT DEFAULT PLANS
-- ============================================
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, sort_order)
VALUES
  (
    'Gratuito',
    'free',
    'Ideal para testar a plataforma',
    0,
    0,
    '["1 projeto ativo", "Relatórios básicos", "Dados de mercado limitados", "Suporte via email"]'::jsonb,
    '{"projects": 1, "reports_per_month": 5, "api_calls_per_day": 50}'::jsonb,
    1
  ),
  (
    'Profissional',
    'pro',
    'Para incorporadores e corretores profissionais',
    99,
    990,
    '["10 projetos ativos", "Relatórios avançados", "Dados de mercado completos", "Alertas personalizados", "Análise de concorrência", "Suporte prioritário"]'::jsonb,
    '{"projects": 10, "reports_per_month": 100, "api_calls_per_day": 1000}'::jsonb,
    2
  ),
  (
    'Empresarial',
    'enterprise',
    'Para construtoras e empresas de grande porte',
    299,
    2990,
    '["Projetos ilimitados", "Relatórios ilimitados", "API completa", "Dados em tempo real", "White label", "Integração customizada", "Suporte dedicado 24/7", "Gerente de conta"]'::jsonb,
    '{"projects": -1, "reports_per_month": -1, "api_calls_per_day": 10000}'::jsonb,
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

-- Subscription Plans: Anyone can view active plans (needed for pricing page)
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = TRUE);

-- Subscription Plans: Service role can manage
CREATE POLICY "Service role can manage subscription plans"
  ON public.subscription_plans FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- User Subscriptions: Users can view own subscription
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- User Subscriptions: Service role can manage
CREATE POLICY "Service role can manage user subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Payment Transactions: Users can view own transactions
CREATE POLICY "Users can view own payment transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Payment Transactions: Service role can manage
CREATE POLICY "Service role can manage payment transactions"
  ON public.payment_transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Subscription Usage: Users can view own usage
CREATE POLICY "Users can view own subscription usage"
  ON public.subscription_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Subscription Usage: Service role can manage
CREATE POLICY "Service role can manage subscription usage"
  ON public.subscription_usage FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_usage_updated_at
  BEFORE UPDATE ON public.subscription_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has reached subscription limit
CREATE OR REPLACE FUNCTION check_subscription_limit(
  p_user_id UUID,
  p_limit_type VARCHAR,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_limit INTEGER;
  v_current_usage INTEGER;
BEGIN
  -- Get user's active subscription
  SELECT s.*, p.limits
  INTO v_subscription
  FROM public.user_subscriptions s
  JOIN public.subscription_plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id AND s.status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE; -- No active subscription
  END IF;

  -- Get limit from plan
  v_limit := (v_subscription.limits->>p_limit_type)::INTEGER;

  -- -1 means unlimited
  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;

  -- Get current usage for this period
  SELECT *
  INTO v_usage
  FROM public.subscription_usage
  WHERE subscription_id = v_subscription.id
    AND period_start <= NOW()
    AND period_end >= NOW()
  LIMIT 1;

  -- Determine current usage based on limit type
  IF v_usage IS NOT NULL THEN
    CASE p_limit_type
      WHEN 'projects' THEN v_current_usage := v_usage.projects_created;
      WHEN 'reports_per_month' THEN v_current_usage := v_usage.reports_generated;
      WHEN 'api_calls_per_day' THEN v_current_usage := v_usage.api_calls_made;
      ELSE v_current_usage := 0;
    END CASE;
  ELSE
    v_current_usage := 0;
  END IF;

  -- Check if adding increment would exceed limit
  RETURN (v_current_usage + p_increment) <= v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_subscription_limit IS 'Check if user can perform action within subscription limits';
