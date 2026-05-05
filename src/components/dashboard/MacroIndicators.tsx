import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Landmark,
  PercentCircle,
  DollarSign,
  Home,
  Building
} from 'lucide-react';
import { IndicatorTooltip } from './IndicatorTooltip';
import type { MetricCard } from '@/lib/dashboard-types';
import { memo } from 'react';

interface MacroIndicatorsProps {
  metrics: MetricCard[];
  isLoading?: boolean;
}

// ... iconMap and other constants ...

const iconMap: Record<string, React.ElementType> = {
  macro_selic_rate: PercentCircle,
  macro_ipca_12m_pct: TrendingUp,
  macro_usd_brl: DollarSign,
  macro_financing_avg_rate: Building,
  macro_financing_caixa_rate: Home,
};

const colorMap: Record<string, string> = {
  macro_selic_rate: 'text-orange-500 bg-orange-500/10',
  macro_ipca_12m_pct: 'text-blue-500 bg-blue-500/10',
  macro_usd_brl: 'text-green-500 bg-green-500/10',
  macro_financing_avg_rate: 'text-purple-500 bg-purple-500/10',
  macro_financing_caixa_rate: 'text-cyan-500 bg-cyan-500/10',
};

const formulaMap: Record<string, { formula: string; source: string; description: string }> = {
  macro_selic_rate: {
    formula: 'Valor direto da API BCB',
    source: 'BCB Série 432',
    description: 'Taxa básica de juros da economia brasileira definida pelo COPOM'
  },
  macro_ipca_12m_pct: {
    formula: 'Soma acumulada 12 meses',
    source: 'IBGE SIDRA Tabela 1737',
    description: 'Índice de Preços ao Consumidor Amplo acumulado nos últimos 12 meses'
  },
  macro_usd_brl: {
    formula: 'Cotação PTAX venda',
    source: 'BCB Olinda PTAX',
    description: 'Taxa de câmbio do dólar comercial (venda)'
  },
  macro_financing_avg_rate: {
    formula: 'Média ponderada BCB',
    source: 'BCB Série 25497',
    description: 'Taxa média de financiamento imobiliário praticada no mercado'
  },
  macro_financing_caixa_rate: {
    formula: 'max(Selic - 3.0, 9.99)',
    source: 'Estimativa baseada na Selic',
    description: 'Taxa estimada de financiamento habitacional da Caixa'
  },
};

function MacroCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
  );
}

export const MacroIndicators = memo(({ metrics, isLoading }: MacroIndicatorsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <MacroCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((metric) => {
        const Icon = iconMap[metric.metric_id] || Landmark;
        const colorClass = colorMap[metric.metric_id] || 'text-primary bg-primary/10';
        const formulaInfo = formulaMap[metric.metric_id];
        
        return (
          <IndicatorTooltip
            key={metric.metric_id}
            formula={formulaInfo?.formula || 'Não disponível'}
            source={formulaInfo?.source || metric.source}
            description={formulaInfo?.description || metric.description}
          >
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{metric.label}</p>
                    <p className="text-sm font-semibold truncate">{metric.value.raw}</p>
                    {metric.delta.raw && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {metric.delta.num && metric.delta.num > 0 ? (
                          <TrendingUp className="h-3 w-3 text-destructive" />
                        ) : metric.delta.num && metric.delta.num < 0 ? (
                          <TrendingDown className="h-3 w-3 text-success" />
                        ) : (
                          <Minus className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className={`text-xs ${
                          metric.delta.num && metric.delta.num > 0 
                            ? 'text-destructive' 
                            : metric.delta.num && metric.delta.num < 0 
                              ? 'text-success' 
                              : 'text-muted-foreground'
                        }`}>
                          {metric.delta.raw}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </IndicatorTooltip>
        );
      })}
    </div>
  );
});

MacroIndicators.displayName = 'MacroIndicators';
