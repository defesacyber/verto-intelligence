import { getEnv } from './env';
const { VITE_SUPABASE_URL } = getEnv();
const SUPABASE_URL = VITE_SUPABASE_URL;

export const getApiUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TRPC_URL) {
    return import.meta.env.VITE_TRPC_URL;
  }
  // Default to Supabase Edge Functions endpoint
  return `${SUPABASE_URL}/functions/v1`;
};

// Auth helper functions
export const authUtils = {
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },
  
  getToken: () => {
    return localStorage.getItem('auth_token');
  },
  
  removeToken: () => {
    localStorage.removeItem('auth_token');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },
};

// Generic fetch helper for tRPC-like endpoints
export const apiFetch = async <T>(
  endpoint: string,
  options?: {
    method?: 'GET' | 'POST';
    body?: unknown;
    requireAuth?: boolean;
  }
): Promise<T> => {
  const { method = 'GET', body, requireAuth = true } = options || {};
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (requireAuth) {
    const token = authUtils.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  const url = `${getApiUrl()}/${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
};
