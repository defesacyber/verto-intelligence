/**
 * Test Utilities
 * Helpers para renderizar componentes com providers e mocks
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';

/**
 * Cria um QueryClient configurado para testes
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Desabilita retry em testes
        retry: false,
        // Cache mínimo em testes
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      // Silenciar erros em testes
      error: () => {},
    },
  });
}

interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

/**
 * Wrapper com todos os providers necessários
 */
function AllProviders({ children, queryClient }: AllProvidersProps) {
  const testQueryClient = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <BrowserRouter>{children}</BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

/**
 * Render customizado com providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

/**
 * Mock de usuário autenticado
 */
export const mockAuthUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  created_at: '2024-01-01T00:00:00Z',
};

/**
 * Mock de dados do dashboard
 */
export const mockDashboardData = {
  macro: [
    {
      metric_id: 'selic',
      label: 'Taxa Selic',
      value: { raw: '10,75%', num: 10.75 },
      delta: { raw: '+0,5pp', num: 0.5 },
      source: 'BCB',
      updated_at: '2024-01-15T10:00:00Z',
    },
  ],
  weekly: [],
  monthly: [],
  quarterly: [],
  charts: {
    price_m2_trend: {
      chart_id: 'price_m2_trend',
      city: 'São Paulo',
      months: 12,
      labels: ['Jan', 'Fev', 'Mar'],
      series: [
        {
          name: 'Baixo Padrão',
          values: [8000, 8200, 8400],
        },
      ],
      unit: 'R$/m²',
      updated_at: '2024-01-15T10:00:00Z',
    },
  },
  stock_demand: {
    city: 'São Paulo',
    total_stock_units: 15000,
    monthly_total_demand_units: 1200,
    avg_months_of_stock: 12.5,
    status: 'Mercado equilibrado',
    by_segment: [
      {
        segment: 'Baixo Padrão',
        stock_units: 5000,
        monthly_demand: 500,
        months_of_stock: 10.0,
      },
    ],
  },
  insights: [],
};

/**
 * Mock de projetos
 */
export const mockProjects = [
  {
    id: 'project-1',
    name: 'Edifício Exemplo',
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
  },
];

/**
 * Mock de planos de assinatura
 */
export const mockSubscriptionPlans = [
  {
    id: 'plan-free',
    name: 'Gratuito',
    slug: 'free',
    price_monthly: 0,
    price_yearly: 0,
    features: ['1 projeto', 'Relatórios básicos'],
    limits: { projects: 1, reports_per_month: 5 },
  },
  {
    id: 'plan-pro',
    name: 'Profissional',
    slug: 'pro',
    price_monthly: 99,
    price_yearly: 990,
    features: ['10 projetos', 'Relatórios avançados', 'Alertas'],
    limits: { projects: 10, reports_per_month: 100 },
  },
];

/**
 * Helper para simular window resize
 */
export function setWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

/**
 * Helper para aguardar loading states
 */
export function waitForLoadingToFinish() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Re-export tudo do testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
