import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIDIRanking } from '@/hooks/useIDIPublicData';
import { memo } from 'react';

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-rose-500';
}

function getScoreBadge(score: number): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (score >= 75) return { label: 'Excelente', variant: 'default' };
  if (score >= 50) return { label: 'Moderado', variant: 'secondary' };
  return { label: 'Baixo', variant: 'destructive' };
}

export const IDIDashboardCard = memo(() => {
  const { data: ranking, isLoading, isError } = useIDIRanking(5);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError || !ranking || ranking.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            IDI - Índice de Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Dados do IDI não disponíveis. Configure a importação de dados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Top 5 Cidades IDI
          </CardTitle>
          <Link to="/market-research">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Ver mais
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {ranking.map((city, index) => {
          const badge = getScoreBadge(city.score_idi_normalizado || 0);
          const variacao = city.score_variacao || 0;
          
          return (
            <div
              key={city.id || `${city.cidade}-${city.uf}`}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground w-5">
                  {index + 1}º
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{city.cidade}</span>
                    <span className="text-xs text-muted-foreground">/ {city.uf}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={badge.variant} className="text-[10px] px-1.5 py-0">
                      {badge.label}
                    </Badge>
                    <span className={`text-xs flex items-center gap-0.5 ${variacao >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {variacao >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${getScoreColor(city.score_idi_normalizado || 0)}`}>
                  {(city.score_idi_normalizado || 0).toFixed(0)}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});

IDIDashboardCard.displayName = 'IDIDashboardCard';
