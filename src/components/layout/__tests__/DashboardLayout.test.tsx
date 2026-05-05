/**
 * DashboardLayout Tests
 * Testa o layout responsivo, navegação e estados mobile/desktop
 */

import { screen, waitFor } from '@testing-library/react';
import {
  renderWithProviders,
  mockAuthUser,
  setWindowWidth,
  userEvent,
} from '@/test/utils/test-utils';
import { DashboardLayout } from '../DashboardLayout';

// Mock do useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    logout: vi.fn(),
    isAuthenticated: true,
  }),
}));

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      setWindowWidth(1920);
    });

    it('should render sidebar with logo', () => {
      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const logo = screen.getByAltText('Verto Intelligence');
      expect(logo).toBeInTheDocument();
    });

    it('should render all navigation items', () => {
      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projetos')).toBeInTheDocument();
      expect(screen.getByText('Pesquisa de Mercado')).toBeInTheDocument();
      expect(screen.getByText('Viabilidade')).toBeInTheDocument();
      expect(screen.getByText('Relatórios')).toBeInTheDocument();
      expect(screen.getByText('Assinatura')).toBeInTheDocument();
      expect(screen.getByText('Configurações')).toBeInTheDocument();
    });

    it('should show user information', () => {
      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.getByText(mockAuthUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockAuthUser.email)).toBeInTheDocument();
    });

    it('should show collapse toggle button', () => {
      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const collapseButton = screen.getByRole('button', {
        name: /collapse|expand/i,
      });
      expect(collapseButton).toBeInTheDocument();
    });

    it('should toggle sidebar collapse on button click', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const collapseButton = screen.getByRole('button', {
        name: /collapse|expand/i,
      });

      const sidebar = screen.getByRole('complementary');
      const initialWidth = sidebar.className;

      await user.click(collapseButton);

      await waitFor(() => {
        expect(sidebar.className).not.toBe(initialWidth);
      });
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      setWindowWidth(375);
    });

    it('should hide sidebar by default on mobile', () => {
      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const sidebar = screen.getByRole('complementary');
      expect(sidebar.className).toContain('-translate-x-full');
    });

    it('should show hamburger menu button on mobile', () => {
      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('should show overlay when mobile menu is open', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);

      await waitFor(() => {
        const overlay = document.querySelector('.bg-black\\/50');
        expect(overlay).toBeInTheDocument();
      });
    });

    it('should close mobile menu when clicking overlay', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      // Abrir menu
      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);

      // Clicar no overlay
      const overlay = document.querySelector('.bg-black\\/50');
      await user.click(overlay!);

      await waitFor(() => {
        const sidebar = screen.getByRole('complementary');
        expect(sidebar.className).toContain('-translate-x-full');
      });
    });

    it('should close mobile menu when clicking navigation link', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      // Abrir menu
      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);

      // Clicar em link de navegação
      const dashboardLink = screen.getByText('Dashboard');
      await user.click(dashboardLink);

      await waitFor(() => {
        const sidebar = screen.getByRole('complementary');
        expect(sidebar.className).toContain('-translate-x-full');
      });
    });

    it('should hide user info on very small screens', () => {
      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const userInfo = screen.queryByText(mockAuthUser.email);
      expect(userInfo?.className).toContain('hidden');
    });
  });

  describe('Navigation', () => {
    it('should highlight active navigation item', () => {
      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>,
        { route: '/dashboard' }
      );

      const dashboardLink = screen.getByText('Dashboard');
      expect(dashboardLink.className).toContain('bg-sidebar-primary');
    });
  });

  describe('User Actions', () => {
    it('should call logout when logout button is clicked', async () => {
      const mockLogout = vi.fn();

      vi.mock('@/hooks/useAuth', () => ({
        useAuth: () => ({
          user: mockAuthUser,
          logout: mockLogout,
          isAuthenticated: true,
        }),
      }));

      const user = userEvent.setup();

      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      // Abrir dropdown de usuário
      const userButton = screen.getByRole('button', {
        name: new RegExp(mockAuthUser.name, 'i'),
      });
      await user.click(userButton);

      // Clicar em sair
      const logoutButton = screen.getByText('Sair');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have minimum touch target size on mobile', () => {
      setWindowWidth(375);

      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const navLinks = screen.getAllByRole('link');
      navLinks.forEach((link) => {
        expect(link.className).toContain('min-h-[44px]');
      });
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('should render children content', () => {
      renderWithProviders(
        <DashboardLayout>
          <div data-testid="test-content">Test Content</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });
});
