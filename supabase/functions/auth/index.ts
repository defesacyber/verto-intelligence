import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return 'invalid-email';
  if (localPart.length < 3) return `***@${domain}`;
  return `${localPart.slice(0, 2)}***@${domain}`;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req.headers.get('origin'));
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1] || 'auth';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get authorization header for authenticated requests
    const authHeader = req.headers.get('Authorization');
    
    if (req.method === 'POST') {
      const body = await req.json();
      
      switch (action) {
        case 'login': {
          if (typeof body?.email !== 'string' || typeof body?.password !== 'string') {
            return new Response(
              JSON.stringify({ error: 'Invalid payload' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Login attempt for:', maskEmail(body.email));
          const { data, error } = await supabase.auth.signInWithPassword({
            email: body.email,
            password: body.password,
          });
          
          if (error) {
            console.error('Login error:', error.message);
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          console.log('Login successful for:', maskEmail(body.email));
          return new Response(
            JSON.stringify({
              result: {
                data: {
                  user: {
                    id: data.user?.id,
                    email: data.user?.email,
                    name: data.user?.user_metadata?.name || data.user?.email?.split('@')[0],
                  },
                  token: data.session?.access_token,
                }
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        case 'register': {
          if (typeof body?.email !== 'string' || typeof body?.password !== 'string' || typeof body?.name !== 'string') {
            return new Response(
              JSON.stringify({ error: 'Invalid payload' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Register attempt for:', maskEmail(body.email));
          const { data, error } = await supabase.auth.signUp({
            email: body.email,
            password: body.password,
            options: {
              data: {
                name: body.name,
              },
              emailRedirectTo: body.redirectTo || `${req.headers.get('origin')}/`,
            },
          });
          
          if (error) {
            console.error('Register error:', error.message);
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          console.log('Register successful for:', maskEmail(body.email));
          return new Response(
            JSON.stringify({
              result: {
                data: {
                  user: {
                    id: data.user?.id,
                    email: data.user?.email,
                    name: body.name,
                  },
                  token: data.session?.access_token,
                }
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        case 'logout': {
          console.log('Logout attempt');
          if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const authedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
              global: { headers: { Authorization: `Bearer ${token}` } }
            });
            await authedSupabase.auth.signOut();
          }
          
          return new Response(
            JSON.stringify({ result: { data: { success: true } } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        case 'update-profile': {
          console.log('Update profile attempt');
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: 'Unauthorized' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          const token = authHeader.replace('Bearer ', '');
          const authedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
          });
          
          // Security: Only allow specific metadata fields to be updated
          const { name, avatar_url } = body;
          const updateData: Record<string, string> = {};
          if (name) updateData.name = name;
          if (avatar_url) updateData.avatar_url = avatar_url;

          const { data, error } = await authedSupabase.auth.updateUser({
            data: updateData,
          });
          
          if (error) {
            console.error('Update profile error:', error.message);
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          return new Response(
            JSON.stringify({
              result: {
                data: {
                  id: data.user?.id,
                  email: data.user?.email,
                  name: data.user?.user_metadata?.name,
                }
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }
    
    if (req.method === 'GET') {
      // Get current user profile
      if (action === 'profile' || action === 'me') {
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const token = authHeader.replace('Bearer ', '');
        const authedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });
        
        const { data: { user }, error } = await authedSupabase.auth.getUser();
        
        if (error || !user) {
          console.error('Get profile error:', error?.message);
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({
            result: {
              data: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email?.split('@')[0],
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Auth function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
