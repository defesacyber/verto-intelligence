import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

interface DemandData {
  population?: number;
  households?: number;
  qualified_demand_12m?: number;
  segment_demand_12m?: number;
  analysis?: string;
}

export function DemandBlock({ data }: { data: DemandData | null }) {
  if (!data) return <Card><CardContent className="py-8"><Skeleton className="h-48" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-secondary" />Análise de Demanda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg"><div className="text-lg font-bold">{data.population?.toLocaleString()}</div><div className="text-xs text-muted-foreground">População</div></div>
          <div className="p-3 bg-muted/50 rounded-lg"><div className="text-lg font-bold">{data.households?.toLocaleString()}</div><div className="text-xs text-muted-foreground">Domicílios</div></div>
          <div className="p-3 bg-muted/50 rounded-lg"><div className="text-lg font-bold">{data.qualified_demand_12m?.toLocaleString()}</div><div className="text-xs text-muted-foreground">Demanda Qualificada 12m</div></div>
          <div className="p-3 bg-secondary/10 rounded-lg"><div className="text-lg font-bold text-secondary">{data.segment_demand_12m?.toLocaleString()}</div><div className="text-xs text-muted-foreground">Demanda do Segmento</div></div>
        </div>
        <p className="text-sm text-muted-foreground">{data.analysis}</p>
      </CardContent>
    </Card>
  );
}
