import { useMemo } from 'react';
import { Calendar, FileText, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import { MarketIndexCard, MarketIndex } from './MarketIndexCard';
import { useMarketIndices } from '@/hooks/useMarketIndices';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}


// Fallback simulated data when API fails
const getSimulatedData = (): { weekly: MarketIndex[]; monthly: MarketIndex[]; quarterly: MarketIndex[] } => {
  return {
    weekly: [
      {
        label: 'Taxa SELIC',
        description: 'Taxa básica de juros da economia',
        value: '14.25%',
        change: '+0.00 p.p.',
        changeType: 'neutral' as const,
        source: 'BCB',
      },
      {
        label: 'TR (Taxa Referencial)',
        description: 'Taxa usada em financiamentos imobiliários',
        value: '0.12%',
        change: '+0.01 p.p.',
        changeType: 'positive' as const,
        source: 'BCB',
      },
    ],
    monthly: [
      {
        label: 'IPCA',
        description: 'Índice de Preços ao Consumidor Amplo',
        value: '0.46%',
        change: '+0.10 p.p.',
        changeType: 'negative' as const,
        source: 'IBGE',
      },
      {
        label: 'IGP-M',
        description: 'Índice Geral de Preços do Mercado',
        value: '0.52%',
        change: '+0.08 p.p.',
        changeType: 'negative' as const,
        source: 'FGV',
      },
      {
        label: 'INCC-DI',
        description: 'Índice Nacional de Custo da Construção',
        value: '0.38%',
        change: '-0.05 p.p.',
        changeType: 'positive' as const,
        source: 'FGV',
      },
      {
        label: 'Custo Médio m² (CUB)',
        description: 'Custo Unitário Básico da Construção Civil',
        value: 'R$ 2.150,00',
        change: '+1.2%',
        changeType: 'neutral' as const,
        source: 'SINDUSCON',
      },
    ],
    quarterly: [
      {
        label: 'IPCA Acumulado 12m',
        description: 'Inflação acumulada nos últimos 12 meses',
        value: '4.23%',
        change: '-0.15 p.p.',
        changeType: 'positive' as const,
        source: 'IBGE',
      },
      {
        label: 'IGP-M Acumulado 12m',
        description: 'IGP-M acumulado nos últimos 12 meses',
        value: '3.89%',
        change: '-0.22 p.p.',
        changeType: 'positive' as const,
        source: 'FGV',
      },
    ],
  };
};

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MarketIndices() {
  const { data, isLoading, isError, refetch, isFetching } = useMarketIndices();
  
  const periods = useMemo(() => {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const quarter = Math.ceil((now.getMonth() + 1) / 3);

    return {
      weekly: `Semana ${weekNumber} de ${now.getFullYear()}`,
      monthly: `${monthNames[now.getMonth()]} de ${now.getFullYear()}`,
      quarterly: `${quarter}º Trimestre de ${now.getFullYear()}`,
    };
  }, []);

  // Use API data or fallback to simulated
  const marketData = useMemo(() => {
    if (data) {
      return {
        weekly: data.weekly,
        monthly: data.monthly,
        quarterly: data.quarterly,
      };
    }
    return getSimulatedData();
  }, [data]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Erro ao carregar índices. Exibindo dados simulados.
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isFetching}
              className="ml-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {data?.lastUpdated && (
            <span>Atualizado: {new Date(data.lastUpdated).toLocaleString('pt-BR')}</span>
          )}
          {data?.sources && (
            <span className="ml-2">
              • Fontes: {data.sources.public.join(', ')}
              {(data.sources.paid.fipezap || data.sources.paid.secovi || data.sources.paid.ademi) && 
                ' + APIs Premium'
              }
            </span>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MarketIndexCard
          title="Índices Semanais"
          period={periods.weekly}
          icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
          indices={marketData.weekly}
        />
        <MarketIndexCard
          title="Índices Mensais"
          period={periods.monthly}
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          indices={marketData.monthly}
        />
        <MarketIndexCard
          title="Índices Trimestrais"
          period={periods.quarterly}
          icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
          indices={marketData.quarterly}
        />
      </div>
    </div>
  );
}
