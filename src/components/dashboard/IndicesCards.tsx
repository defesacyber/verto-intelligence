import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Calendar, FileText, BarChart3, Info } from 'lucide-react';
import { IndicatorTooltip } from './IndicatorTooltip';
import type { MetricCard } from '@/lib/dashboard-types';
import { memo } from 'react';

interface IndicesCardProps {
  title: string;
  period: string;
  metrics: MetricCard[];
  icon: React.ReactNode;
  isLoading?: boolean;
}

const getFormulaInfo = (metricId: string): { formula: string; source: string; description: string } => {
  const formulas: Record<string, { formula: string; source: string; description: string }> = {
    weekly_price_m2: {
      formula: 'priceM2 (base cidade)',
      source: 'FipeZap / idi_fipezap_historico',
      description: 'Preço médio do metro quadrado na região selecionada'
    },
    weekly_price_m2_variation: {
      formula: 'priceM2Delta / 52',
      source: 'Cálculo baseado na variação anual',
      description: 'Variação semanal estimada do preço do m²'
    },
    weekly_sales_velocity: {
      formula: 'Valor base × sazonalidade',
      source: 'ADEMI / SECOVI',
      description: 'Velocidade de vendas semanal em unidades'
    },
    weekly_market_status: {
      formula: 'Baseado em meses de estoque',
      source: 'Análise de mercado',
      description: '≥12 meses: Saturado / 8-12: Equilibrado / <8: Aquecido'
    },
    monthly_launches_count: {
      formula: 'launchesPeriod × sazonalidade',
      source: 'ADEMI / CBIC',
      description: 'Número de lançamentos no mês'
    },
    monthly_stock_available: {
      formula: 'stockTotal (base região)',
      source: 'SECOVI / DataStore',
      description: 'Unidades disponíveis em estoque'
    },
    monthly_absorption_rate: {
      formula: 'vendas / estoque × 100',
      source: 'Cálculo Verto Intelligence',
      description: 'Taxa de absorção do mercado'
    },
    monthly_absorption_time_months: {
      formula: 'estoque / vendas_mensais',
      source: 'Cálculo Verto Intelligence',
      description: 'Tempo estimado para absorver o estoque atual'
    },
    monthly_demand_index: {
      formula: 'demandIndex (base cidade)',
      source: 'IDI Brasil / FipeZap',
      description: 'Índice de demanda imobiliária'
    },
    monthly_price_variation_12m: {
      formula: 'priceM2Delta (12 meses)',
      source: 'FipeZap / IBGE',
      description: 'Variação acumulada do preço em 12 meses'
    },
    quarterly_vgv_launched: {
      formula: 'unitsLaunched × priceM2 × 55',
      source: 'ADEMI / CBIC',
      description: 'Valor Geral de Vendas dos lançamentos do trimestre'
    },
    quarterly_new_units: {
      formula: 'launchesPeriod × 3 meses',
      source: 'ADEMI / SECOVI',
      description: 'Total de novas unidades lançadas no trimestre'
    },
    quarterly_sold_units: {
      formula: 'absorptionRate × stockTotal / 100 × 3',
      source: 'SECOVI / DataStore',
      description: 'Unidades vendidas no trimestre'
    },
    quarterly_investment_attractiveness: {
      formula: 'score composto IDI',
      source: 'IDI Brasil / Cálculo Verto Intelligence',
      description: 'Índice de atratividade para investimento imobiliário'
    },
  };

  return formulas[metricId] || {
    formula: 'Não especificado',
    source: 'Múltiplas fontes',
    description: 'Indicador de mercado imobiliário'
  };
};

const MetricRow = memo(({ metric }: { metric: MetricCard }) => {
  const getDeltaColor = () => {
    if (!metric.delta.num) return 'text-muted-foreground';
    const invertedMetrics = ['monthly_absorption_time_months'];
    const isInverted = invertedMetrics.includes(metric.metric_id);
    const isPositive = metric.delta.num > 0;
    
    if (isInverted) {
      return isPositive ? 'text-destructive' : 'text-success';
    }
    return isPositive ? 'text-success' : 'text-destructive';
  };

  const getDeltaIcon = () => {
    if (!metric.delta.num || metric.delta.num === 0) {
      return <Minus className="h-3.5 w-3.5" />;
    }
    return metric.delta.num > 0 
      ? <TrendingUp className="h-3.5 w-3.5" />
      : <TrendingDown className="h-3.5 w-3.5" />;
  };

  const formulaInfo = getFormulaInfo(metric.metric_id);

  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium leading-tight">{metric.label}</p>
          <IndicatorTooltip
            formula={formulaInfo.formula}
            source={formulaInfo.source}
            description={formulaInfo.description}
          >
            <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help" />
          </IndicatorTooltip>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{metric.description}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">Fonte: {metric.source}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">{metric.value.raw}</p>
        {metric.delta.raw && (
          <div className={`flex items-center justify-end gap-1 mt-0.5 ${getDeltaColor()}`}>
            {getDeltaIcon()}
            <span className="text-xs font-medium">{metric.delta.raw}</span>
          </div>
        )}
      </div>
    </div>
  );
});

MetricRow.displayName = 'MetricRow';

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start justify-between py-2">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="text-right space-y-1.5">
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-3 w-12 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const IndicesCard = memo(({ title, period, metrics, icon, isLoading }: IndicesCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{period}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[280px] pr-2">
          {isLoading ? (
            <SkeletonRows />
          ) : (
            <div className="space-y-0">
              {metrics.map((metric) => (
                <MetricRow key={metric.metric_id} metric={metric} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

IndicesCard.displayName = 'IndicesCard';

export const WeeklyIndicesCard = memo(({ metrics, period, isLoading }: { metrics: MetricCard[]; period: string; isLoading?: boolean }) => {
  return (
    <IndicesCard
      title="Índices Semanais"
      period={period}
      metrics={metrics}
      icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
      isLoading={isLoading}
    />
  );
});

WeeklyIndicesCard.displayName = 'WeeklyIndicesCard';

export const MonthlyIndicesCard = memo(({ metrics, period, isLoading }: { metrics: MetricCard[]; period: string; isLoading?: boolean }) => {
  return (
    <IndicesCard
      title="Índices Mensais"
      period={period}
      metrics={metrics}
      icon={<FileText className="h-5 w-5 text-muted-foreground" />}
      isLoading={isLoading}
    />
  );
});

MonthlyIndicesCard.displayName = 'MonthlyIndicesCard';

export const QuarterlyIndicesCard = memo(({ metrics, period, isLoading }: { metrics: MetricCard[]; period: string; isLoading?: boolean }) => {
  return (
    <IndicesCard
      title="Índices Trimestrais"
      period={period}
      metrics={metrics}
      icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
      isLoading={isLoading}
    />
  );
});

QuarterlyIndicesCard.displayName = 'QuarterlyIndicesCard';
