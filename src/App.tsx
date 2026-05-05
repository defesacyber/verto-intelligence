import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthGuard, GuestGuard } from "@/components/auth/AuthGuard";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { lazy, Suspense, useEffect } from "react";

// ─── Eager loading para rotas críticas (sem custo de code-split, TTI mínimo) ───
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// ─── Lazy loading para rotas autenticadas (code-splitting por rota) ────────────
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const NewProject = lazy(() => import("./pages/NewProject"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const ProjectAnalysis = lazy(() => import("./pages/ProjectAnalysis"));
const ProjectInputs = lazy(() => import("./pages/ProjectInputs"));
const Reports = lazy(() => import("./pages/Reports"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const MarketResearch = lazy(() => import("./pages/MarketResearch"));
const Viability = lazy(() => import("./pages/Viability"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const IDIRanking = lazy(() => import("./pages/IDIRanking"));
const MarketWeekly = lazy(() => import("./pages/MarketWeekly"));

// ─── React Query — configuração otimizada para produção ───────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // dados frescos por 5 min
      gcTime: 30 * 60 * 1000,         // cache por 30 min
      retry: 2,
      retryDelay: (i) => Math.min(1000 * 2 ** i, 30000), // backoff exponencial
      refetchOnWindowFocus: false,     // sem re-fetch ao focar janela
      refetchOnMount: false,           // sem re-fetch se dados frescos
      refetchOnReconnect: true,        // re-fetch ao reconectar
    },
    mutations: { retry: 1 },
  },
});

// ─── ScrollToTop + gestão de document.title por rota ─────────────────────────
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  useEffect(() => {
    const titles: Record<string, string> = {
      "/": "Verto Intelligence | Inteligência Imobiliária",
      "/login": "Login | Verto Intelligence",
      "/signup": "Cadastro | Verto Intelligence",
      "/forgot-password": "Recuperar Senha | Verto Intelligence",
      "/dashboard": "Dashboard | Verto Intelligence",
      "/projects": "Meus Projetos | Verto Intelligence",
      "/projects/new": "Novo Projeto | Verto Intelligence",
      "/market-research": "Pesquisa de Mercado | Verto Intelligence",
      "/viability": "Análise de Viabilidade | Verto Intelligence",
      "/idi-ranking": "IDI Ranking | Verto Intelligence",
      "/market-weekly": "Market Weekly | Verto Intelligence",
      "/reports": "Relatórios | Verto Intelligence",
      "/subscription": "Minha Assinatura | Verto Intelligence",
      "/settings": "Configurações | Verto Intelligence",
      "/profile": "Meu Perfil | Verto Intelligence",
    };

    if (pathname.startsWith("/projects/")) {
      if (pathname.endsWith("/analysis")) document.title = "Análise de Viabilidade | Verto Intelligence";
      else if (pathname.endsWith("/inputs")) document.title = "Parâmetros do Projeto | Verto Intelligence";
      else if (pathname !== "/projects/new") document.title = "Detalhes do Projeto | Verto Intelligence";
    } else {
      document.title = titles[pathname] || "Verto Intelligence | Inteligência Imobiliária";
    }
  }, [pathname]);

  return null;
};

// ─── Loading fallback com Skeleton (melhor UX que spinner puro) ───────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-4 w-full max-w-md px-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="verto-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Públicas */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<GuestGuard><Login /></GuestGuard>} />
                <Route path="/signup" element={<GuestGuard><Signup /></GuestGuard>} />
                <Route path="/forgot-password" element={<GuestGuard><ForgotPassword /></GuestGuard>} />

                {/* Autenticadas */}
                <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
                <Route path="/projects" element={<AuthGuard><Projects /></AuthGuard>} />
                <Route path="/projects/new" element={<AuthGuard><NewProject /></AuthGuard>} />
                <Route path="/projects/:id" element={<AuthGuard><ProjectDetails /></AuthGuard>} />
                <Route path="/projects/:id/analysis" element={<AuthGuard><ProjectAnalysis /></AuthGuard>} />
                <Route path="/projects/:id/inputs" element={<AuthGuard><ProjectInputs /></AuthGuard>} />
                <Route path="/market-research" element={<AuthGuard><MarketResearch /></AuthGuard>} />
                <Route path="/viability" element={<AuthGuard><Viability /></AuthGuard>} />
                <Route path="/idi-ranking" element={<AuthGuard><IDIRanking /></AuthGuard>} />
                <Route path="/market-weekly" element={<AuthGuard><MarketWeekly /></AuthGuard>} />
                <Route path="/reports" element={<AuthGuard><Reports /></AuthGuard>} />
                <Route path="/subscription" element={<AuthGuard><Subscription /></AuthGuard>} />
                <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
                <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
