import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const jwtSecret = Deno.env.get('JWT_SECRET')!;

interface JWTPayload {
  user_id: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'POST') {
      const body = await req.json();

      switch (action) {
        case 'login-custom': {
          if (typeof body?.email !== 'string' || typeof body?.password !== 'string') {
            return errorResponse('Invalid payload', 400, corsHeaders);
          }

          // Verificar credenciais no Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: body.email,
            password: body.password,
          });

          if (authError) {
            return errorResponse('Invalid credentials', 401, corsHeaders);
          }

          // Buscar informações do usuário na tabela users
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, name, role')
            .eq('email', body.email)
            .single();

          if (userError) {
            return errorResponse('User not found in database', 404, corsHeaders);
          }

          // Gerar JWT customizado
          const payload: JWTPayload = {
            user_id: userData.id,
            email: userData.email,
            role: userData.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 horas
            iat: Math.floor(Date.now() / 1000),
          };

          const jwt = await create({ alg: "HS256", typ: "JWT" }, payload, jwtSecret);

          console.log(`JWT customizado gerado para: ${userData.email} (role: ${userData.role})`);

          return jsonResponse({
            result: {
              data: {
                user: {
                  id: userData.id,
                  email: userData.email,
                  name: userData.name,
                  role: userData.role,
                },
                token: jwt,
                expires_in: 86400, // 24 horas em segundos
              }
            }
          }, corsHeaders);
        }

        case 'verify-token': {
          const authHeader = req.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse('Missing or invalid authorization header', 401, corsHeaders);
          }

          const token = authHeader.replace('Bearer ', '');

          try {
            const payload = await verify(token, jwtSecret, "HS256") as JWTPayload;

            // Verificar se o token não expirou
            if (payload.exp < Math.floor(Date.now() / 1000)) {
              return errorResponse('Token expired', 401, corsHeaders);
            }

            // Buscar dados atualizados do usuário
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id, email, name, role')
              .eq('id', payload.user_id)
              .single();

            if (userError) {
              return errorResponse('User not found', 404, corsHeaders);
            }

            return jsonResponse({
              result: {
                data: {
                  user: userData,
                  valid: true,
                }
              }
            }, corsHeaders);

          } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return errorResponse('Invalid token', 401, corsHeaders);
          }
        }

        case 'refresh-token': {
          const authHeader = req.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse('Missing or invalid authorization header', 401, corsHeaders);
          }

          const token = authHeader.replace('Bearer ', '');

          try {
            const payload = await verify(token, jwtSecret, "HS256") as JWTPayload;

            // Gerar novo token com expiração atualizada
            const newPayload: JWTPayload = {
              user_id: payload.user_id,
              email: payload.email,
              role: payload.role,
              exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 horas
              iat: Math.floor(Date.now() / 1000),
            };

            const newJwt = await create({ alg: "HS256", typ: "JWT" }, newPayload, jwtSecret);

            return jsonResponse({
              result: {
                data: {
                  token: newJwt,
                  expires_in: 86400,
                }
              }
            }, corsHeaders);

          } catch (jwtError) {
            return errorResponse('Invalid token', 401, corsHeaders);
          }
        }

        default: {
          return errorResponse('Invalid action', 400, corsHeaders);
        }
      }
    }

    return errorResponse('Method not allowed', 405, corsHeaders);

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500, corsHeaders);
  }
});