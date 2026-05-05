import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  AlertTriangle, 
  AlertCircle, 
  Info
} from 'lucide-react';
import type { MarketInsight } from '@/lib/dashboard-types';

interface MarketInsightsCardProps {
  insights: MarketInsight[];
  isLoading?: boolean;
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case 'risk':
      return {
        icon: AlertCircle,
        badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
        iconClass: 'text-destructive',
        label: 'Risco',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        badgeClass: 'bg-warning/10 text-warning border-warning/20',
        iconClass: 'text-warning',
        label: 'Atenção',
      };
    case 'info':
    default:
      return {
        icon: Info,
        badgeClass: 'bg-info/10 text-info border-info/20',
        iconClass: 'text-info',
        label: 'Info',
      };
  }
}

function InsightRow({ insight }: { insight: MarketInsight }) {
  const config = getSeverityConfig(insight.severity);
  const Icon = config.icon;

  return (
    <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-2">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium">{insight.title}</h4>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.badgeClass}`}>
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {insight.message}
          </p>
        </div>
      </div>
      {insight.drivers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-7">
          {insight.drivers.map((driver, idx) => (
            <Badge 
              key={idx} 
              variant="secondary" 
              className="text-[10px] font-normal"
            >
              {driver.metric_id.replace(/_/g, ' ').replace('macro ', '')}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function MarketInsightsCard({ insights, isLoading }: MarketInsightsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by severity: risk > warning > info
  const sortedInsights = [...insights].sort((a, b) => {
    const order = { risk: 0, warning: 1, info: 2 };
    return (order[a.severity] || 2) - (order[b.severity] || 2);
  });

  const riskCount = insights.filter(i => i.severity === 'risk').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Análise Interpretativa
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Insights automáticos baseados nos indicadores de mercado
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {riskCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {riskCount} risco{riskCount > 1 ? 's' : ''}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-warning text-warning-foreground text-xs">
                {warningCount} alerta{warningCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-2">
            {sortedInsights.map((insight) => (
              <InsightRow key={insight.insight_id} insight={insight} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
