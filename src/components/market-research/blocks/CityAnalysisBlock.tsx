import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown,
  Users,
  Home,
  MapPin,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CityData } from '@/hooks/useMarketResearch';
import { PriceEvolutionChart } from './PriceEvolutionChart';
import { DemandEvolutionChart } from './DemandEvolutionChart';

interface Segment {
  name: string;
  income_range: string;
  ticket_range: {
    min: number;
    max: number;
  };
  estimated_area_m2: number;
  trend: string;
}

interface Neighborhood {
  name: string;
  price_m2?: number;
}

interface NeighborhoodGroup {
  segment: string;
  neighborhoods: Neighborhood[];
}

interface CityAnalysisBlockProps {
  data: CityData | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

export function CityAnalysisBlock({ data }: CityAnalysisBlockProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise da Cidade</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const variation12m = data.price_data.variation_12m || 0;

  return (
    <div className="space-y-6">
      {/* Header da cidade */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-secondary" />
                {data.city}, {data.uf}
              </CardTitle>
              <CardDescription>
                Dados atualizados em {new Date(data.fetched_at).toLocaleDateString('pt-BR')}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {data.price_data.current_price_m2 
                  ? formatCurrency(data.price_data.current_price_m2) + '/m²'
                  : 'N/D'}
              </div>
              {variation12m !== 0 && (
                <Badge variant="outline" className={cn(
                  variation12m > 0 ? 'text-success border-success/30' : 'text-destructive border-destructive/30'
                )}>
                  {variation12m > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {variation12m > 0 ? '+' : ''}{variation12m.toFixed(1)}% (12m)
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                População
              </div>
              <div className="text-xl font-bold">{formatNumber(data.population)}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Home className="h-4 w-4" />
                Domicílios
              </div>
              <div className="text-xl font-bold">{formatNumber(data.households)}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                Aluguel/m²
              </div>
              <div className="text-xl font-bold">
                {data.price_data.rent_price_m2 
                  ? formatCurrency(data.price_data.rent_price_m2)
                  : 'N/D'}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4" />
                Variação 24m
              </div>
              <div className="text-xl font-bold">
                {data.price_data.variation_24m !== null 
                  ? `${data.price_data.variation_24m > 0 ? '+' : ''}${data.price_data.variation_24m.toFixed(1)}%`
                  : 'N/D'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de Evolução */}
      <div className="grid md:grid-cols-2 gap-6">
        <PriceEvolutionChart cidade={data.city} uf={data.uf} />
        <DemandEvolutionChart cidade={data.city} uf={data.uf} />
      </div>

      {/* IDI Score */}
      {data.idi_score && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Índice IDI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-lg bg-secondary/10 text-center">
                <div className="text-3xl font-bold text-secondary">{data.idi_score.score?.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Score IDI</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-xl font-bold">{data.idi_score.national_rank || '-'}º</div>
                <div className="text-sm text-muted-foreground">Ranking Nacional</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-xl font-bold">{data.idi_score.state_rank || '-'}º</div>
                <div className="text-sm text-muted-foreground">Ranking Estadual</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-xl font-bold">{data.idi_score.demand_score?.toFixed(0) || '-'}</div>
                <div className="text-sm text-muted-foreground">Demanda</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-xl font-bold">{data.idi_score.liquidity_score?.toFixed(0) || '-'}</div>
                <div className="text-sm text-muted-foreground">Liquidez</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise por segmento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análise por Segmento Econômico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Segmento</th>
                  <th className="text-left py-3 px-4">Faixa de Renda</th>
                  <th className="text-left py-3 px-4">Ticket Médio</th>
                  <th className="text-left py-3 px-4">Área Est.</th>
                  <th className="text-left py-3 px-4">Tendência</th>
                </tr>
              </thead>
              <tbody>
                {data.segments?.map((segment: Segment, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{segment.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{segment.income_range}</td>
                    <td className="py-3 px-4">
                      {formatCurrency(segment.ticket_range.min)} - {formatCurrency(segment.ticket_range.max)}
                    </td>
                    <td className="py-3 px-4">{segment.estimated_area_m2}m²</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={cn(
                        segment.trend === 'Alta demanda' ? 'text-success border-success/30' :
                        segment.trend === 'Crescimento moderado' ? 'text-warning border-warning/30' :
                        'text-muted-foreground'
                      )}>
                        {segment.trend}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Melhores bairros */}
      {data.best_neighborhoods && data.best_neighborhoods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-secondary" />
              Melhores Bairros por Segmento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {data.best_neighborhoods.map((group: NeighborhoodGroup, i: number) => (
                <div key={i} className="p-4 rounded-lg border border-border/50">
                  <h4 className="font-medium mb-3 capitalize">{group.segment.replace('_', ' ')}</h4>
                  {group.neighborhoods.length > 0 ? (
                    <ul className="space-y-2">
                      {group.neighborhoods.map((n: Neighborhood, j: number) => (
                        <li key={j} className="flex items-center justify-between text-sm">
                          <span>{n.name}</span>
                          <span className="text-muted-foreground">
                            {n.price_m2 ? formatCurrency(n.price_m2) + '/m²' : '-'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Dados não disponíveis</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drivers econômicos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Principais Drivers Econômicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.economic_drivers?.map((driver: string, i: number) => (
              <Badge key={i} variant="secondary">{driver}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
