import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  DollarSign,
  Activity,
  Building,
  Users,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MacroData } from '@/hooks/useMarketResearch';

interface MacroAnalysisBlockProps {
  data: MacroData | null;
}

interface IndicatorCardProps {
  title: string;
  value: string | number | null;
  suffix?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  source?: string;
}

interface ImpactAnalysisEntry {
  impact?: 'positivo' | 'negativo' | 'neutro' | string;
  description?: string;
}

function IndicatorCard({ title, value, suffix = '', trend, trendLabel, icon: Icon, source }: IndicatorCardProps) {
  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold">
          {value !== null && value !== undefined ? `${typeof value === 'number' ? value.toFixed(2) : value}${suffix}` : '-'}
        </span>
        {trend && (
          <Badge variant="outline" className={cn(
            "text-xs",
            trend === 'up' ? 'text-success border-success/30' :
            trend === 'down' ? 'text-destructive border-destructive/30' :
            'text-muted-foreground'
          )}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : 
             trend === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
            {trendLabel}
          </Badge>
        )}
      </div>
      {source && <span className="text-xs text-muted-foreground">Fonte: {source}</span>}
    </div>
  );
}

export function MacroAnalysisBlock({ data }: MacroAnalysisBlockProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise Macroeconômica</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { indicators, summary, impact_analysis, projections, data_sources } = data;

  return (
    <div className="space-y-6">
      {/* Indicadores principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-secondary" />
            Indicadores Macroeconômicos
          </CardTitle>
          <CardDescription>
            Dados atualizados em {new Date(data.fetched_at).toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <IndicatorCard
              title="Taxa Selic"
              value={indicators.selic.current}
              suffix="% a.a."
              trend={indicators.selic.trend === 'up' ? 'up' : 'down'}
              trendLabel={indicators.selic.variation_12m ? `${indicators.selic.variation_12m > 0 ? '+' : ''}${indicators.selic.variation_12m.toFixed(2)} p.p.` : undefined}
              icon={Percent}
              source={indicators.selic.source}
            />
            <IndicatorCard
              title="IPCA 12m"
              value={indicators.ipca.current}
              suffix="%"
              trend={indicators.ipca.trend === 'high' ? 'up' : 'neutral'}
              trendLabel={indicators.ipca.trend === 'high' ? 'Acima da meta' : 'Na meta'}
              icon={TrendingUp}
              source={indicators.ipca.source}
            />
            <IndicatorCard
              title="INCC 12m"
              value={indicators.incc.accumulated_12m}
              suffix="%"
              icon={Building}
              source={indicators.incc.source}
            />
            <IndicatorCard
              title="IGP-M 12m"
              value={indicators.igpm.accumulated_12m}
              suffix="%"
              icon={TrendingUp}
              source={indicators.igpm.source}
            />
            <IndicatorCard
              title="PIB Trimestral"
              value={indicators.pib.quarterly_variation}
              suffix="%"
              trend={indicators.pib.trend === 'growth' ? 'up' : 'down'}
              trendLabel={indicators.pib.trend === 'growth' ? 'Crescimento' : 'Retração'}
              icon={Activity}
              source={indicators.pib.source}
            />
            <IndicatorCard
              title="Desemprego"
              value={indicators.unemployment.rate}
              suffix="%"
              icon={Users}
              source={indicators.unemployment.source}
            />
            <IndicatorCard
              title="Dólar (PTAX)"
              value={indicators.dollar.rate}
              suffix=""
              icon={DollarSign}
              source={indicators.dollar.source}
            />
            <IndicatorCard
              title="Financiamento (est.)"
              value={indicators.financing_rate.caixa_estimate}
              suffix="% a.a."
              icon={Building}
              source={indicators.financing_rate.source}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo executivo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{summary}</p>
        </CardContent>
      </Card>

      {/* Análise de impacto */}
      {impact_analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Impacto no Mercado Imobiliário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(impact_analysis).map(([key, value]) => {
                const analysis = value as ImpactAnalysisEntry;
                return (
                <div key={key} className="p-4 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={cn(
                      analysis.impact === 'positivo' ? 'border-success/30 text-success' :
                      analysis.impact === 'negativo' ? 'border-destructive/30 text-destructive' :
                      'border-warning/30 text-warning'
                    )}>
                      {analysis.impact}
                    </Badge>
                    <span className="font-medium capitalize">{key.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{analysis.description}</p>
                </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projeções e fontes */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projeções 12-24 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(projections || {}).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-secondary mt-0.5" />
                  <div>
                    <span className="font-medium capitalize">{key.replace('_', ' ')}: </span>
                    <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fontes de Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data_sources.map((source, i) => (
                <a 
                  key={i} 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  {source.name}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
