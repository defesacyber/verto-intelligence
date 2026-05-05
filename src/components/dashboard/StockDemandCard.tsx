import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import type { StockDemandData } from '@/lib/dashboard-types';

interface StockDemandCardProps {
  data?: StockDemandData;
  isLoading?: boolean;
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'Mercado aquecido':
      return {
        color: 'bg-success text-success-foreground',
        icon: CheckCircle,
        bgClass: 'bg-success/10',
      };
    case 'Mercado equilibrado':
      return {
        color: 'bg-warning text-warning-foreground',
        icon: TrendingDown,
        bgClass: 'bg-warning/10',
      };
    case 'Mercado saturado':
    default:
      return {
        color: 'bg-destructive text-destructive-foreground',
        icon: AlertTriangle,
        bgClass: 'bg-destructive/10',
      };
  }
}

function getProgressColor(months: number): string {
  if (months < 8) return 'bg-success';
  if (months < 12) return 'bg-warning';
  return 'bg-destructive';
}

function getProgressPercent(months: number, max: number = 24): number {
  return Math.min((months / max) * 100, 100);
}

export function StockDemandCard({ data, isLoading }: StockDemandCardProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const statusConfig = getStatusConfig(data.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Relação Estoque x Demanda
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Análise de absorção do mercado - {data.city}
            </CardDescription>
          </div>
          <Badge className={statusConfig.color}>
            <StatusIcon className="h-3.5 w-3.5 mr-1" />
            {data.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Summary metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Estoque Total</p>
            <p className="text-lg font-semibold">{data.total_stock_units.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">unidades</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Demanda Mensal</p>
            <p className="text-lg font-semibold">{data.monthly_total_demand_units.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">unidades/mês</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Meses de Estoque</p>
            <p className="text-lg font-semibold">{(data.avg_months_of_stock ?? 0).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">média</p>
          </div>
        </div>

        {/* Segment breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Meses de Estoque por Segmento</p>
          <div className="space-y-3">
            {(data.by_segment ?? []).map((segment) => (
              <div key={segment.segment} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{segment.segment}</span>
                  <span className="font-medium">{(segment.months_of_stock ?? 0).toFixed(1)} meses</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${getProgressColor(segment.months_of_stock)}`}
                    style={{ width: `${getProgressPercent(segment.months_of_stock)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span>&lt; 8 meses (aquecido)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <span>8-12 meses (equilibrado)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span>&gt; 12 meses (saturado)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
