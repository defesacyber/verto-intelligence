import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConclusionData {
  final_verdict: string;
  synthesis?: Record<string, string>;
  recommendations?: string[];
  risk_factors?: string[];
}

export function ConclusionBlock({ data, compact = false }: { data: ConclusionData | null; compact?: boolean }) {
  if (!data) return <Card><CardContent className="py-8"><Skeleton className="h-48" /></CardContent></Card>;

  const getVerdictConfig = (verdict: string) => {
    if (verdict === 'FAVORAVEL') return { label: 'Favorável', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' };
    if (verdict === 'FAVORAVEL_COM_RESSALVAS') return { label: 'Favorável com Ressalvas', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' };
    return { label: 'Desfavorável', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' };
  };

  const config = getVerdictConfig(data.final_verdict);
  const Icon = config.icon;

  if (compact) {
    return (
      <Card className={cn("border-2", config.bg)}>
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <Icon className={cn("h-8 w-8", config.color)} />
            <div>
              <h3 className="font-bold text-lg">{config.label}</h3>
              <p className="text-sm text-muted-foreground mt-2">{data.synthesis?.macro}</p>
              <p className="text-sm text-muted-foreground">{data.synthesis?.city}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className={cn("border-2", config.bg)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={cn("h-6 w-6", config.color)} />
            Parecer Final: {config.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(data.synthesis || {}).map(([key, value]: [string, string]) => (
            <div key={key}>
              <h4 className="font-medium capitalize mb-1">{key.replace('_', ' ')}</h4>
              <p className="text-sm text-muted-foreground">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Recomendações</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recommendations?.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle className="h-4 w-4 text-secondary mt-0.5" />{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Riscos Identificados</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.risks?.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-warning mt-0.5" />{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
