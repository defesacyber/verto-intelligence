/**
 * Dashboard Page Tests
 * Testa a página principal do dashboard com dados reais e loading states
 */

import { screen, waitFor } from '@testing-library/react';
import {
  renderWithProviders,
  mockDashboardData,
  mockAuthUser,
} from '@/test/utils/test-utils';
import Dashboard from '../Dashboard';

// Mock do hook de autenticação
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    logout: vi.fn(),
    isAuthenticated: true,
  }),
}));

// Mock do useDashboardSummary hook
vi.mock('@/hooks/useDashboardSummary', () => ({
  useDashboardSummary: (city: string) => ({
    data: mockDashboardData,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dashboard with all sections', async () => {
      renderWithProviders(<Dashboard />);

      // Verifica se os títulos das seções estão presentes
      expect(screen.getByText('Indicadores Macroeconômicos')).toBeInTheDocument();
      expect(screen.getByText('Índices de Mercado')).toBeInTheDocument();
      expect(screen.getByText(/Séries Históricas/i)).toBeInTheDocument();
    });

    it('should render city filter', () => {
      renderWithProviders(<Dashboard />);

      // Verifica se o filtro de cidade está presente
      const cityFilter = screen.getByRole('combobox');
      expect(cityFilter).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderWithProviders(<Dashboard />);

      expect(screen.getByRole('button', { name: /comparar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /novo projeto/i })).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display macro indicators data', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Taxa Selic')).toBeInTheDocument();
        expect(screen.getByText('10,75%')).toBeInTheDocument();
      });
    });

    it('should display all three index cards', () => {
      renderWithProviders(<Dashboard />);

      expect(screen.getByText('Índices Semanais')).toBeInTheDocument();
      expect(screen.getByText('Índices Mensais')).toBeInTheDocument();
      expect(screen.getByText('Índices Trimestrais')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading skeletons when data is loading', () => {
      // Override mock para estado de loading
      vi.mock('@/hooks/useDashboardSummary', () => ({
        useDashboardSummary: () => ({
          data: undefined,
          isLoading: true,
          isError: false,
          refetch: vi.fn(),
          isFetching: false,
        }),
      }));

      renderWithProviders(<Dashboard />);

      // Verifica se há elementos de loading
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error States', () => {
    it('should display error alert when data fetch fails', () => {
      vi.mock('@/hooks/useDashboardSummary', () => ({
        useDashboardSummary: () => ({
          data: undefined,
          isLoading: false,
          isError: true,
          refetch: vi.fn(),
          isFetching: false,
        }),
      }));

      renderWithProviders(<Dashboard />);

      expect(screen.getByText(/erro ao carregar dados/i)).toBeInTheDocument();
    });
  });

  describe('Responsiveness', () => {
    it('should stack buttons vertically on mobile', () => {
      // Simula mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 375,
      });

      renderWithProviders(<Dashboard />);

      const buttonsContainer = screen.getByRole('button', {
        name: /novo projeto/i,
      }).parentElement;

      // Verifica se tem classes de flex-col (mobile)
      expect(buttonsContainer?.className).toContain('flex-col');
    });
  });

  describe('User Interactions', () => {
    it('should refresh data when refresh button is clicked', async () => {
      const mockRefetch = vi.fn();

      vi.mock('@/hooks/useDashboardSummary', () => ({
        useDashboardSummary: () => ({
          data: mockDashboardData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        }),
      }));

      const { user } = renderWithProviders(<Dashboard />);

      const refreshButton = screen.getByRole('button', {
        name: /atualizar/i,
      });

      await user.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
