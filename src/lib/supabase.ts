import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://azmzmlcvzatfduejddeu.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXptbGN2emF0ZmR1ZWpkZGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDg0NjEsImV4cCI6MjA4NTI4NDQ2MX0.zCYJYV6I4bPaJp3HFv_xJKQVd5U1EnI-1GPHlBKDujU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
