import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { getCorsHeaders, jsonResponse, errorResponse, handleCorsPreflightRequest } from "../_shared/cors.ts";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

// Initialize Stripe
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
}) : null;

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return errorResponse('Missing Supabase configuration', 500, origin);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { action, planId, paymentMethod, paymentMethodId } = await req.json();

    // Handle actions that don't require auth
    if (action === 'list-plans') {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching plans:', error);
        return errorResponse('Failed to fetch subscription plans', 500, origin);
      }

      return jsonResponse(plans || [], 200, origin);
    }

    // All other actions require authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401, origin);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse('Unauthorized', 401, origin);
    }

    // Action: Get current subscription
    if (action === 'get-current') {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return errorResponse('Failed to fetch subscription', 500, origin);
      }

      return jsonResponse(subscription, 200, origin);
    }

    // Action: Create subscription
    if (action === 'create-subscription') {
      if (!planId) {
        return errorResponse('Missing planId', 400, origin);
      }

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        console.error('Error fetching plan:', planError);
        return errorResponse('Plan not found', 404, origin);
      }

      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSubscription && existingSubscription.status === 'active') {
        return errorResponse('User already has an active subscription', 400, origin);
      }

      // Handle Stripe payment
      if (paymentMethod === 'stripe') {
        if (!stripe) {
          return errorResponse('Stripe is not configured', 500, origin);
        }

        try {
          // Create Stripe checkout session
          const session = await stripe.checkout.sessions.create({
            customer_email: user.email,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
              price_data: {
                currency: 'brl',
                product_data: {
                  name: plan.name,
                  description: plan.description || '',
                },
                recurring: {
                  interval: 'month',
                },
                unit_amount: Math.round(plan.price_monthly * 100), // Convert to cents
              },
              quantity: 1,
            }],
            success_url: `${origin}/dashboard?subscription=success`,
            cancel_url: `${origin}/dashboard?subscription=cancelled`,
            metadata: {
              user_id: user.id,
              plan_id: planId,
            },
          });

          return jsonResponse({
            success: true,
            checkoutUrl: session.url,
          }, 200, origin);
        } catch (stripeError) {
          console.error('Stripe error:', stripeError);
          return errorResponse(
            stripeError instanceof Error ? stripeError.message : 'Payment processing error',
            500,
            origin
          );
        }
      }

      // Handle PagSeguro payment
      if (paymentMethod === 'pagseguro') {
        // TODO: Implement PagSeguro integration
        return errorResponse('PagSeguro integration not yet implemented', 501, origin);
      }

      return errorResponse('Invalid payment method', 400, origin);
    }

    // Action: Cancel subscription
    if (action === 'cancel-subscription') {
      const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('id, payment_provider, payment_provider_subscription_id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching subscription:', fetchError);
        return errorResponse('Failed to fetch subscription', 500, origin);
      }

      if (!subscription) {
        return errorResponse('No active subscription found', 404, origin);
      }

      if (subscription.status === 'cancelled') {
        return errorResponse('Subscription is already cancelled', 400, origin);
      }

      // Cancel in Stripe if applicable
      if (subscription.payment_provider === 'stripe' && subscription.payment_provider_subscription_id) {
        if (!stripe) {
          return errorResponse('Stripe is not configured', 500, origin);
        }

        try {
          await stripe.subscriptions.cancel(subscription.payment_provider_subscription_id);
        } catch (stripeError) {
          console.error('Stripe cancellation error:', stripeError);
          // Continue with database update even if Stripe fails
        }
      }

      // Update subscription in database
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_at_period_end: true,
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return errorResponse('Failed to cancel subscription', 500, origin);
      }

      return jsonResponse({ success: true }, 200, origin);
    }

    // Action: Update payment method
    if (action === 'update-payment-method') {
      if (!paymentMethodId) {
        return errorResponse('Missing paymentMethodId', 400, origin);
      }

      // TODO: Implement payment method update for Stripe
      return errorResponse('Payment method update not yet implemented', 501, origin);
    }

    return errorResponse('Invalid action', 400, origin);

  } catch (error) {
    console.error('Subscription function error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      req.headers.get('origin')
    );
  }
});
