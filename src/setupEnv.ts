/**
 * Runtime safety net for Lovable/Vite env variables.
 *
 * The auto-generated Supabase client reads `import.meta.env.VITE_SUPABASE_URL`.
 * In rare cases the value can be missing in the preview runtime, causing:
 *   "Uncaught Error: supabaseUrl is required."
 *
 * We derive the URL from `VITE_SUPABASE_PROJECT_ID` as a fallback.
 */

// Vite injects env at build time, but the object is still mutable at runtime.
const metaAny = import.meta as unknown as { env?: Record<string, string | undefined> };
const env = (metaAny.env ??= {});

if (!env.VITE_SUPABASE_URL) {
  const projectId = env.VITE_SUPABASE_PROJECT_ID;
  if (projectId) {
    env.VITE_SUPABASE_URL = `https://${projectId}.supabase.co`;
  }
}
