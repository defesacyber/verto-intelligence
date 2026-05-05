import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, TrendingUp, Scale, MapPin, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisResult } from '@/lib/viability-types';

interface MarketMetricsCardProps {
  result: AnalysisResult;
  className?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function MarketMetricsCard({ result, className }: MarketMetricsCardProps) {
  const demandScore = Math.min(100, (result.market_demand / 1000) * 100);
  const competitionLevel = result.competitors_count < 3 ? 'baixa' : result.competitors_count < 7 ? 'média' : 'alta';
  const supplyDemandStatus = result.supply_demand_ratio < 0.8 ? 'subofertado' : result.supply_demand_ratio > 1.2 ? 'superofertado' : 'equilibrado';

  const getCompetitionConfig = () => {
    switch (competitionLevel) {
      case 'baixa':
        return { color: 'text-success', bg: 'bg-success/10', label: 'Concorrência Baixa' };
      case 'média':
        return { color: 'text-warning', bg: 'bg-warning/10', label: 'Concorrência Média' };
      default:
        return { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Concorrência Alta' };
    }
  };

  const getMarketBalanceConfig = () => {
    switch (supplyDemandStatus) {
      case 'subofertado':
        return { color: 'text-success', label: 'Mercado Subofertado', icon: TrendingUp };
      case 'equilibrado':
        return { color: 'text-secondary', label: 'Mercado Equilibrado', icon: Scale };
      default:
        return { color: 'text-destructive', label: 'Mercado Superofertado', icon: TrendingUp };
    }
  };

  const competitionConfig = getCompetitionConfig();
  const marketConfig = getMarketBalanceConfig();
  const MarketIcon = marketConfig.icon;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-secondary" />
          Indicadores de Mercado
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Análise da região e concorrência
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price per m² */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="font-medium">Preço Médio/m²</span>
          </div>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(result.avg_price_m2)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Média praticada na região
          </p>
        </div>

        {/* Demand Index */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Índice de Demanda</span>
            </div>
            <span className="text-sm font-bold">{result.market_demand}</span>
          </div>
          <Progress value={demandScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {demandScore > 70 ? 'Demanda alta' : demandScore > 40 ? 'Demanda moderada' : 'Demanda baixa'}
          </p>
        </div>

        {/* Competition */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Concorrentes na região</span>
            </div>
            <Badge className={cn(competitionConfig.bg, competitionConfig.color, 'border-0')}>
              {result.competitors_count} empreendimentos
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {competitionConfig.label} - {result.competitors_count < 3 ? 'Oportunidade de diferenciação' : 'Mercado competitivo'}
          </p>
        </div>

        {/* Supply/Demand Ratio */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MarketIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Relação Oferta/Demanda</span>
            </div>
            <span className={cn('text-sm font-bold', marketConfig.color)}>
              {result.supply_demand_ratio.toFixed(2)}
            </span>
          </div>
          <p className={cn('text-xs mt-2', marketConfig.color)}>
            {marketConfig.label}
          </p>
        </div>

        {/* Market Score Summary */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Atratividade do Mercado</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={cn(
                    'w-2 h-6 rounded-sm',
                    star <= Math.ceil((demandScore / 100) * 5) ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
