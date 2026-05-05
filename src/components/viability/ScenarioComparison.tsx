import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/constants';
import { ViabilityResult, ScenarioResult } from '@/lib/viability-calculator';
import { cn } from '@/lib/utils';

interface ScenarioComparisonProps {
  result: ViabilityResult;
}

export function ScenarioComparison({ result }: ScenarioComparisonProps) {
  const { pessimistic, projected, optimistic } = result;
  
  const scenarios = [
    { name: 'Pessimista', data: pessimistic, color: 'destructive' as const },
    { name: 'Projetado', data: projected, color: 'primary' as const },
    { name: 'Otimista', data: optimistic, color: 'success' as const },
  ];
  
  type MetricKey = keyof ScenarioResult;
  const metrics: Array<{ key: MetricKey; label: string; format: (v: number) => string }> = [
    { key: 'vgv', label: 'VGV', format: (v: number) => formatCurrency(v) },
    { key: 'totalCost', label: 'Custo Total', format: (v: number) => formatCurrency(v) },
    { key: 'profit', label: 'Lucro', format: (v: number) => formatCurrency(v) },
    { key: 'margin', label: 'Margem', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'roi', label: 'ROI', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'tir', label: 'TIR', format: (v: number) => `${v.toFixed(1)}% a.a.` },
    { key: 'paybackMonths', label: 'Payback', format: (v: number) => `${v} meses` },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparativo de Cenários</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Métrica</th>
                {scenarios.map(scenario => (
                  <th 
                    key={scenario.name} 
                    className={cn(
                      "text-center py-3 px-2 text-sm font-medium",
                      scenario.color === 'destructive' && "text-destructive",
                      scenario.color === 'primary' && "text-primary",
                      scenario.color === 'success' && "text-success"
                    )}
                  >
                    {scenario.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map(metric => (
                <tr key={metric.key} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-2 text-sm font-medium">{metric.label}</td>
                  {scenarios.map(scenario => (
                    <td 
                      key={`${metric.key}-${scenario.name}`}
                      className={cn(
                        "text-center py-3 px-2 text-sm",
                        metric.key === 'profit' && (scenario.data as ScenarioResult).profit < 0 && "text-destructive",
                        metric.key === 'profit' && (scenario.data as ScenarioResult).profit >= 0 && "text-success"
                      )}
                    >
                      {metric.format((scenario.data as ScenarioResult)[metric.key] as number)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
