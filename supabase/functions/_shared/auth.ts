import { createClient } from '@supabase/supabase-js'

/**
 * Verifies JWT token from request and returns authenticated user
 * @param req - The incoming request object
 * @returns The authenticated user object
 * @throws Error if token is missing or invalid
 */
export async function verifyJWT(req: Request) {
  const authHeader = req.headers.get('authorization')

  if (!authHeader) {
    throw new Error('Missing authorization header')
  }

  const token = authHeader.replace('Bearer ', '')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Error('Invalid or expired token')
  }

  return user
}

/**
 * Gets user ID from JWT token without full verification
 * Useful for logging and non-critical operations
 */
export function getUserIdFromToken(req: Request): string | null {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return null

    const token = authHeader.replace('Bearer ', '')
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub || null
  } catch {
    return null
  }
}
