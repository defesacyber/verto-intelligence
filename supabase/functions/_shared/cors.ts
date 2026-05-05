/**
 * CORS Helper — Verto Intelligence v3
 * Gerencia Cross-Origin Resource Sharing com segurança.
 * Origens permitidas via variável de ambiente ALLOWED_ORIGINS (CSV).
 *
 * Merge: ALLOWED_ORIGINS dinâmico do R1 + helpers reutilizáveis do R2
 */

// Origens permitidas: env var CSV ou defaults de desenvolvimento
const ALLOWED_ORIGINS: string[] = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Fallback para desenvolvimento local se nenhuma origem configurada
if (ALLOWED_ORIGINS.length === 0) {
  ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000');
}

/**
 * Retorna os headers CORS para a origem da requisição.
 * Somente origens na whitelist recebem Allow-Origin explícito.
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // Cache de preflight por 24h
    'Vary': 'Origin',
  };
}

/**
 * Responde à requisição OPTIONS de preflight CORS (204 sem body).
 */
export function handleCorsPreflightRequest(origin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Cria uma Response JSON com headers CORS e Content-Type correto.
 */
export function jsonResponse(
  data: unknown,
  status: number = 200,
  origin: string | null = null
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getCorsHeaders(origin),
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Cria uma Response de erro JSON com headers CORS.
 */
export function errorResponse(
  message: string,
  status: number = 500,
  origin: string | null = null
): Response {
  return jsonResponse({ error: message }, status, origin);
}
