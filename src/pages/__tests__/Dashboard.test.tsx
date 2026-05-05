/**
 * Dashboard Page Tests
 * Testa a página principal do dashboard com dados reais e loading states
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

let mockRefetch = vi.fn();
const mockUseDashboardSummary = vi.fn((city: string) => ({
  data: mockDashboardData,
  isLoading: false,
  isError: false,
  refetch: mockRefetch,
  isFetching: false,
}));

vi.mock('@/hooks/useDashboardSummary', () => ({
  useDashboardSummary: (city: string) => mockUseDashboardSummary(city),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch = vi.fn();
    mockUseDashboardSummary.mockImplementation((city: string) => ({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    }));
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

      const cityFilter = screen.getByRole('button', { name: /Brasil \(Nacional\)/i });
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
      mockUseDashboardSummary.mockImplementationOnce(() => ({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      }));

      renderWithProviders(<Dashboard />);

      const skeletons = screen.getAllByTestId('dashboard-loading-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error States', () => {
    it('should display error alert when data fetch fails', () => {
      mockUseDashboardSummary.mockImplementationOnce(() => ({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
        isFetching: false,
      }));

      renderWithProviders(<Dashboard />);

      expect(screen.getByText(/erro ao carregar dados/i)).toBeInTheDocument();
    });
  });

  describe('Responsiveness', () => {
    it('should stack buttons vertically on mobile', () => {
      renderWithProviders(<Dashboard />);

      const actionSection = screen
        .getByRole('button', { name: /comparar cidades/i })
        ?.closest('div')
        ?.parentElement;

      expect(actionSection).toHaveClass('flex-col');
    });
  });

  describe('User Interactions', () => {
    it('should refresh data when refresh button is clicked', async () => {
      const localRefetch = vi.fn();
      mockUseDashboardSummary.mockImplementationOnce(() => ({
        data: mockDashboardData,
        isLoading: false,
        isError: false,
        refetch: localRefetch,
        isFetching: false,
      }));

      renderWithProviders(<Dashboard />);

      const refreshButton = screen.getByRole('button', {
        name: /atualizar/i,
      });

      const user = userEvent.setup();
      await user.click(refreshButton);

      expect(localRefetch).toHaveBeenCalled();
    });
  });
});
