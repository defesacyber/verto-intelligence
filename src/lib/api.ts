// ============================================= //
// CENTRALIZED API CLIENT FOR SUPABASE EDGE FUNCTIONS
// ============================================= //

import { authUtils } from './trpc';
import { getEnv } from './env';
import { toast } from 'sonner';

const { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = getEnv();
const SUPABASE_URL = VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = VITE_SUPABASE_PUBLISHABLE_KEY;

// Get base URL for Edge Functions
export const getApiUrl = (): string => {
  return `${SUPABASE_URL}/functions/v1`;
};

interface ApiError {
  message: string;
  code?: string;
}

// Generic API fetch function for Edge Functions
export async function apiFetch<T>(
  functionName: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    requireAuth?: boolean;
  } = {}
): Promise<T> {
  const { method = 'POST', body, requireAuth = true } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };
  
  // Add auth token if available
  if (requireAuth) {
    const token = authUtils.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${getApiUrl()}/${functionName}`;

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let message = 'Erro na requisição';
      
      try {
        const errorData: ApiError = await response.json();
        message = errorData.message || message;
      } catch (_) {
        // Fallback messages based on status code
        if (response.status === 401) message = 'Sessão expirada. Por favor, faça login novamente.';
        else if (response.status === 403) message = 'Você não tem permissão para realizar esta ação.';
        else if (response.status === 404) message = 'Recurso não encontrado.';
        else if (response.status === 500) message = 'Erro interno no servidor. Tente novamente mais tarde.';
        else message = `Erro ${response.status}: ${response.statusText}`;
      }
      
      toast.error(message);
      throw new Error(message);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        toast.error('Erro de conexão. Verifique sua internet.');
      }
      throw error;
    }
    const unknownError = 'Erro desconhecido na requisição';
    toast.error(unknownError);
    throw new Error(unknownError);
  }
}

// Auth-specific API methods
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ user: unknown; token: string }>('auth', {
      method: 'POST',
      body: { action: 'login', email, password },
      requireAuth: false,
    }),

  register: (name: string, email: string, password: string) =>
    apiFetch<{ user: unknown; token: string }>('auth', {
      method: 'POST',
      body: { action: 'register', name, email, password },
      requireAuth: false,
    }),

  logout: () =>
    apiFetch<{ success: boolean }>('auth', {
      method: 'POST',
      body: { action: 'logout' },
    }),

  me: () =>
    apiFetch<unknown>('auth', {
      method: 'POST',
      body: { action: 'me' },
    }),

  updateProfile: (data: { name?: string; email?: string }) =>
    apiFetch<unknown>('auth', {
      method: 'POST',
      body: { action: 'updateProfile', ...data },
    }),
};

// Projects API methods
export const projectsApi = {
  list: (params?: { page?: number; pageSize?: number; status?: string }) =>
    apiFetch<{ items: unknown[]; total: number; page: number; pageSize: number; hasMore: boolean }>(
      'projects',
      { method: 'POST', body: { action: 'list', ...params } }
    ),

  getById: (id: string) =>
    apiFetch<unknown>('projects', { method: 'POST', body: { action: 'getById', id } }),

  create: (data: unknown) =>
    apiFetch<unknown>('projects', {
      method: 'POST',
      body: { action: 'create', ...data },
    }),

  update: (id: string, data: unknown) =>
    apiFetch<unknown>('projects', {
      method: 'POST',
      body: { action: 'update', id, data },
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>('projects', {
      method: 'POST',
      body: { action: 'delete', id },
    }),

  analyze: (id: string) =>
    apiFetch<unknown>('projects', {
      method: 'POST',
      body: { action: 'analyze', id },
    }),
};

// Reports API methods
export const reportsApi = {
  list: (params?: { projectId?: string; type?: string }) =>
    apiFetch<unknown[]>('reports', { method: 'POST', body: { action: 'list', ...params } }),

  getById: (id: string) =>
    apiFetch<unknown>('reports', { method: 'POST', body: { action: 'getById', id } }),

  getRecurring: (params?: { type?: string; year?: number }) =>
    apiFetch<unknown[]>('reports', { method: 'POST', body: { action: 'getRecurring', ...params } }),

  generate: (projectId: string) =>
    apiFetch<unknown>('reports', {
      method: 'POST',
      body: { action: 'generate', projectId },
    }),

  generateMarketAnalysis: (projectId: string) =>
    apiFetch<unknown>('reports', {
      method: 'POST',
      body: { action: 'generateMarketAnalysis', projectId },
    }),

  generateQuantitativeAnalysis: (projectId: string) =>
    apiFetch<unknown>('reports', {
      method: 'POST',
      body: { action: 'generateQuantitativeAnalysis', projectId },
    }),

  exportPdf: (reportId: string) =>
    apiFetch<{ url: string }>('reports', {
      method: 'POST',
      body: { action: 'exportPdf', reportId },
    }),
};

// Market Data API methods (can be expanded later)
export const marketApi = {
  getCities: () =>
    Promise.resolve([
      { id: '1', name: 'São Paulo', state: 'SP' },
      { id: '2', name: 'Rio de Janeiro', state: 'RJ' },
      { id: '3', name: 'Belo Horizonte', state: 'MG' },
    ]),

  getNeighborhoods: (cityId: string) =>
    Promise.resolve([
      { id: '1', name: 'Centro', cityId },
      { id: '2', name: 'Zona Sul', cityId },
    ]),

  getCityData: (cityName: string, state: string) =>
    Promise.resolve({ cityName, state, averagePrice: 8500 }),
};

// Subscriptions API (mock for now)
export const subscriptionsApi = {
  getCurrent: () =>
    Promise.resolve({ plan: 'free', status: 'active' }),

  getPlans: () =>
    Promise.resolve([
      { id: 'free', name: 'Gratuito', price: 0 },
      { id: 'pro', name: 'Profissional', price: 99 },
      { id: 'enterprise', name: 'Empresarial', price: 299 },
    ]),

  subscribe: (planId: string) =>
    Promise.resolve({ success: true, planId }),

  cancel: () =>
    Promise.resolve({ success: true }),
};
