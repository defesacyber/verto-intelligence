import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  User,
  Search,
  TrendingUp,
  Activity,
  WifiOff,
  BarChart3,
  Newspaper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';
import { SystemStatusModal } from '@/components/dashboard/SystemStatusModal';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projetos', href: '/projects', icon: FolderOpen },
  { label: 'Pesquisa de Mercado', href: '/market-research', icon: Search },
  { label: 'Viabilidade', href: '/viability', icon: TrendingUp },
  { label: 'IDI Ranking', href: '/idi-ranking', icon: BarChart3 },
  { label: 'Market Weekly', href: '/market-weekly', icon: Newspaper },
  { label: 'Relatórios', href: '/reports', icon: FileText },
  { label: 'Assinatura', href: '/subscription', icon: CreditCard },
  { label: 'Configurações', href: '/settings', icon: Settings },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed, toggleCollapsed } = useSidebarContext();
  const { logout, user } = useAuth();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // '/' to focus search (if on projects or dashboard)
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        searchInput?.focus();
      }
      
      // 'Esc' to close modals (handled by Radix, but can add custom logic if needed)
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="min-h-screen flex w-full bg-background" style={{ '--sidebar-width': collapsed ? '64px' : '256px' } as React.CSSProperties}>
      {/* Skip to Content for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-br-lg"
      >
        Pular para o conteúdo
      </a>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 border-r border-sidebar-border",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-center p-6 border-b border-sidebar-border">
          <img src="/logo-verto.png" alt="Verto Intelligence" className={collapsed ? "h-10 w-auto" : "h-20 w-auto"} />
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <span className="animate-fade-in font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-200",
              "text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="font-medium">Sair</span>}
          </button>
        </div>
        
        {/* Collapse Toggle */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "absolute -right-3 top-20 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border",
            "flex items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground",
            "transition-all duration-200 hover:scale-110"
          )}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>
      
      {/* Main Content */}
      <main 
        id="main-content"
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={toggleCollapsed}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            {!isOnline && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium animate-pulse">
                <WifiOff className="h-3 w-3" />
                <span>Modo Offline</span>
              </div>
            )}
            {/* Botão Status do Sistema */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusModalOpen(true)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Status</span>
            </Button>
          
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-4 hover:opacity-80 transition-opacity focus:outline-none">
                  <div className="text-right">
                    <p className="text-sm font-medium">{user?.name || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Avatar className="h-10 w-10 border border-border/50">
                    <AvatarImage src={user?.avatarUrl} alt={user?.name || 'Usuário'} />
                    <AvatarFallback className="bg-muted animate-pulse">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Page Content - sem overflow hidden para sticky funcionar */}
        <div className="p-6 min-h-[calc(100vh-64px)]">
          {children}
        </div>
      </main>

      {/* Modal de Status do Sistema */}
      <SystemStatusModal open={statusModalOpen} onOpenChange={setStatusModalOpen} />
    </div>
  );
}

// Wrapper que fornece o contexto da sidebar
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

// Hook para usar o estado da sidebar em componentes filhos
export { useSidebarContext } from '@/contexts/SidebarContext';
