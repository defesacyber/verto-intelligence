import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraphSkeleton } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { CashFlow } from '@/lib/viability-types';

interface CashFlowChartProps {
  data: CashFlow[];
  className?: string;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  return `R$ ${(value / 1000).toFixed(0)}K`;
};

export function CashFlowChart({ data, className, isLoading }: CashFlowChartProps) {
  if (isLoading) {
    return <GraphSkeleton className={className} height={350} legendItems={3} />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Fluxo de Caixa Projetado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Sem dados de fluxo de caixa disponíveis
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find payback point (where cumulative goes positive)
  const paybackMonth = data.find(d => d.cumulative >= 0)?.month;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Fluxo de Caixa Projetado</CardTitle>
        <p className="text-sm text-muted-foreground">
          Projeção mensal de receitas, custos e resultado acumulado
          {paybackMonth && (
            <span className="ml-2 text-success font-medium">
              • Payback no mês {paybackMonth}
            </span>
          )}
        </p>
      </CardHeader>

      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              
              <XAxis
                dataKey="month"
                tickFormatter={(value) => `M${value}`}
                className="text-xs"
              />
              
              <YAxis
                tickFormatter={formatCurrency}
                className="text-xs"
              />
              
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'revenue' ? 'Receita' :
                  name === 'costs' ? 'Custos' :
                  name === 'cumulative' ? 'Acumulado' : name
                ]}
                labelFormatter={(label) => `Mês ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              
              {/* Reference line at zero */}
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              
              {/* Payback reference line */}
              {paybackMonth && (
                <ReferenceLine
                  x={paybackMonth}
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{
                    value: 'Payback',
                    position: 'top',
                    fill: 'hsl(var(--success))',
                    fontSize: 12
                  }}
                />
              )}
              
              <Area
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="hsl(var(--success))"
                fill="url(#revenueGradient)"
                strokeWidth={2}
              />
              
              <Area
                type="monotone"
                dataKey="costs"
                name="costs"
                stroke="hsl(var(--destructive))"
                fill="url(#costsGradient)"
                strokeWidth={2}
              />
              
              <Area
                type="monotone"
                dataKey="cumulative"
                name="cumulative"
                stroke="hsl(var(--primary))"
                fill="url(#cumulativeGradient)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Receita</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-sm text-muted-foreground">Custos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Acumulado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
