import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NeighborhoodData {
  neighborhood?: string;
  city?: string;
  price_data?: {
    avg_price_m2?: number;
    min_price_m2?: number;
    max_price_m2?: number;
  };
}

interface AdequacyFactor {
  status: 'adequado' | 'parcial' | 'inadequado';
  factor: string;
  detail: string;
}

interface AdequacyData {
  verdict: string;
  justification: string;
  factors?: AdequacyFactor[];
}

export function NeighborhoodBlock({ data, adequacyData }: { data: NeighborhoodData | null; adequacyData: AdequacyData | null }) {
  if (!data) return <Card><CardContent className="py-8"><Skeleton className="h-32" /></CardContent></Card>;

  const getVerdictIcon = (verdict: string) => {
    if (verdict === 'ADEQUADO') return <CheckCircle className="h-5 w-5 text-success" />;
    if (verdict === 'PARCIALMENTE_ADEQUADO') return <AlertTriangle className="h-5 w-5 text-warning" />;
    return <XCircle className="h-5 w-5 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-secondary" />
            {data.neighborhood}, {data.city}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.price_data && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-xl font-bold">R$ {data.price_data.avg_price_m2?.toLocaleString()}/m²</div>
                <div className="text-sm text-muted-foreground">Preço Médio</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-xl font-bold">R$ {data.price_data.min_price_m2?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Mínimo/m²</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-xl font-bold">R$ {data.price_data.max_price_m2?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Máximo/m²</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {adequacyData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getVerdictIcon(adequacyData.verdict)}
              Adequação do Produto: {adequacyData.verdict.replace('_', ' ')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{adequacyData.justification}</p>
            <div className="space-y-2">
              {adequacyData.factors?.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    f.status === 'adequado' ? 'border-success/30 text-success' :
                    f.status === 'parcial' ? 'border-warning/30 text-warning' :
                    'border-destructive/30 text-destructive'
                  )}>{f.status}</Badge>
                  <span className="font-medium">{f.factor}:</span>
                  <span className="text-muted-foreground">{f.detail}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
