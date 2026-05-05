import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VelocityData {
  scenarios?: {
    pessimista?: { months_to_sell?: number; units_per_month?: number };
    realista?: { months_to_sell?: number; units_per_month?: number };
    otimista?: { months_to_sell?: number; units_per_month?: number };
  };
  recommendation?: string;
  client_alignment?: string;
}

export function VelocityBlock({ data }: { data: VelocityData | null }) {
  if (!data) return <Card><CardContent className="py-8"><Skeleton className="h-48" /></CardContent></Card>;

  const scenarios = [
    { key: 'pessimista', label: 'Pessimista', color: 'destructive' },
    { key: 'realista', label: 'Realista', color: 'secondary' },
    { key: 'otimista', label: 'Otimista', color: 'success' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-secondary" />Velocidade de Vendas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {scenarios.map(s => {
            const scenario = data.scenarios?.[s.key];
            return (
              <div key={s.key} className={cn("p-3 rounded-lg border-l-4", `border-l-${s.color}`, "bg-muted/50")}>
                <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                <div className="text-lg font-bold">{scenario?.months_to_sell || '-'} meses</div>
                <div className="text-xs text-muted-foreground">{scenario?.units_per_month || '-'} un./mês</div>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground">{data.recommendation}</p>
        <Badge variant="outline">{data.client_alignment}</Badge>
      </CardContent>
    </Card>
  );
}
