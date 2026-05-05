import { useState, lazy, Suspense } from 'react';
import { DashboardLayout, useSidebarContext } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
 

// Dashboard components
import { MacroIndicators } from '@/components/dashboard/MacroIndicators';
const MacroDashboardCard = lazy(() => import('@/components/dashboard/MacroDashboardCard').then(module => ({ default: module.MacroDashboardCard })));
import { WeeklyIndicesCard, MonthlyIndicesCard, QuarterlyIndicesCard } from '@/components/dashboard/IndicesCards';
const IDIDashboardCard = lazy(() => import('@/components/dashboard/IDIDashboardCard').then(module => ({ default: module.IDIDashboardCard })));

const PriceM2TrendChart = lazy(() => import('@/components/dashboard/TrendCharts').then(m => ({ default: m.PriceM2TrendChart })));
const DemandIndexTrendChart = lazy(() => import('@/components/dashboard/TrendCharts').then(m => ({ default: m.DemandIndexTrendChart })));
const StockTrendChart = lazy(() => import('@/components/dashboard/TrendCharts').then(m => ({ default: m.StockTrendChart })));
const AttractivenessIndexChart = lazy(() => import('@/components/dashboard/TrendCharts').then(m => ({ default: m.AttractivenessIndexChart })));
import { StockDemandCard } from '@/components/dashboard/StockDemandCard';
import { MarketInsightsCard } from '@/components/dashboard/MarketInsightsCard';

import { CityFilter } from '@/components/dashboard/CityFilter';
const CityComparisonModal = lazy(() => import('@/components/dashboard/CityComparisonModal').then(module => ({ default: module.CityComparisonModal })));
const CityComparisonCharts = lazy(() => import('@/components/market/CityComparisonCharts').then(module => ({ default: module.CityComparisonCharts })));
import { AlertHistoryCard } from '@/components/dashboard/AlertHistoryCard';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { GraphSkeleton } from '@/components/ui/chart';

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function DashboardContent() {
  const [city, setCity] = useState('Brasil (Nacional)');
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const { data, isLoading, isError, refetch, isFetching } = useDashboardSummary(city);
  const { collapsed } = useSidebarContext();
  
  const now = new Date();
  const weekNumber = getWeekNumber(now);
  const quarter = Math.ceil((now.getMonth() + 1) / 3);

  const periods = {
    weekly: `Semana ${weekNumber} de ${now.getFullYear()}`,
    monthly: `${monthNames[now.getMonth()]} de ${now.getFullYear()}`,
    quarterly: `${quarter}º Trimestre de ${now.getFullYear()}`,
  };

  return (
    <div className="animate-fade-in">
      {/* Header - Fixed no topo (abaixo do top bar) - ajusta com a sidebar */}
      <div className={cn(
        "fixed top-16 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border transition-all duration-300",
        collapsed ? "left-16" : "left-64"
      )}>
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <CityFilter value={city} onChange={setCity} />
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setComparisonOpen(true)}
                  className="gap-2"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Comparar Cidades
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => refetch()} 
                  disabled={isFetching}
                  aria-label="Atualizar dados do dashboard"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
                <Link to="/projects/new">
                  <Button variant="hero" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Projeto
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer para compensar o header fixo */}
        <div className="h-[72px]" />

        <div className="space-y-6">
          <Suspense fallback={<GraphSkeleton height={320} />}>
            <CityComparisonModal 
              open={comparisonOpen} 
              onOpenChange={setComparisonOpen} 
              initialCity={city}
            />
          </Suspense>

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar dados. Exibindo dados de demonstração.
            </AlertDescription>
          </Alert>
        )}

        {/* Macro Indicators */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Indicadores Macroeconômicos</h2>
          <MacroIndicators metrics={data?.macro || []} isLoading={isLoading} />
        </section>

        {/* BCB + IDI Cards */}
        <section>
          <div className="grid gap-4 md:grid-cols-2">
            <Suspense fallback={<GraphSkeleton height={260} />}>
              <MacroDashboardCard />
            </Suspense>
            <Suspense fallback={<GraphSkeleton height={260} />}>
              <IDIDashboardCard />
            </Suspense>
          </div>
        </section>

        {/* Weekly / Monthly / Quarterly Indices */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Índices de Mercado</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <WeeklyIndicesCard metrics={data?.weekly || []} period={periods.weekly} isLoading={isLoading} />
            <MonthlyIndicesCard metrics={data?.monthly || []} period={periods.monthly} isLoading={isLoading} />
            <QuarterlyIndicesCard metrics={data?.quarterly || []} period={periods.quarterly} isLoading={isLoading} />
          </div>
        </section>


        {/* Charts */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Séries Históricas (Últimos 12 meses)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Suspense fallback={<GraphSkeleton height={250} legendItems={3} />}>
              <PriceM2TrendChart chartData={data?.charts?.price_m2_trend} isLoading={isLoading} />
            </Suspense>
            <Suspense fallback={<GraphSkeleton height={250} legendItems={3} />}>
              <DemandIndexTrendChart chartData={data?.charts?.demand_index_trend} isLoading={isLoading} />
            </Suspense>
            <Suspense fallback={<GraphSkeleton height={250} legendItems={3} />}>
              <StockTrendChart chartData={data?.charts?.stock_available_trend} isLoading={isLoading} />
            </Suspense>
            <Suspense fallback={<GraphSkeleton height={250} legendItems={3} />}>
              <AttractivenessIndexChart chartData={data?.charts?.investment_attractiveness_trend} isLoading={isLoading} />
            </Suspense>
          </div>
        </section>


        {/* City Comparison Charts */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Comparativo de Cidades</h2>
          <Suspense fallback={<GraphSkeleton height={320} legendItems={3} />}>
            <CityComparisonCharts />
          </Suspense>
        </section>

        {/* Stock Demand + Insights + Alert History */}
        <section>
          <div className="grid gap-4 md:grid-cols-3">
            <StockDemandCard data={data?.stock_demand} isLoading={isLoading} />
            <MarketInsightsCard insights={data?.insights || []} isLoading={isLoading} />
            <AlertHistoryCard />
          </div>
        </section>

        {/* Footer note */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>
            Fontes: Banco Central do Brasil (BCB), IBGE/SIDRA, FGV. 
            Dados de mercado imobiliário baseados em 423 cidades de todos os 27 estados.
          </p>
          {data?.updated_at && (
            <p className="text-muted-foreground/70">
              Última atualização: {new Date(data.updated_at).toLocaleString('pt-BR')}
              {isFetching && ' • Atualizando...'}
            </p>
          )}
        </div>
        </div>
      </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

