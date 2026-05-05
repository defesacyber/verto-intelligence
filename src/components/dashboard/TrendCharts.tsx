import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraphSkeleton } from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { ChartData } from '@/lib/dashboard-types';
import { memo } from 'react';

interface TrendChartProps {
  title: string;
  description: string;
  chartData: ChartData;
  isLoading?: boolean;
}

const COLORS = {
  'Baixo Padrão': 'hsl(187 85% 43%)',   // Cyan
  'Médio Padrão': 'hsl(25 95% 53%)',    // Orange
  'Alto Padrão': 'hsl(142 76% 36%)',    // Green
};

export const TrendChart = memo(({ title, description, chartData, isLoading }: TrendChartProps) => {
  if (isLoading) {
    return <GraphSkeleton height={250} />;
  }

  // Transform data for recharts
  const data = chartData.labels.map((label, index) => {
    const point: Record<string, string | number> = { month: label };
    chartData.series.forEach((series) => {
      point[series.name] = series.values[index];
    });
    return point;
  });

  const formatValue = (value: number) => {
    if (chartData.unit === 'R$/m²') {
      return `R$ ${value.toLocaleString('pt-BR')}`;
    }
    if (chartData.unit === 'unidades') {
      return value.toLocaleString('pt-BR');
    }
    return `${value} ${chartData.unit}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                  return value;
                }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value: unknown, name: string) => {
                  if (typeof value === 'number') {
                    return [formatValue(value), name];
                  }
                  return [value, name];
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px' }}
                iconType="circle"
                iconSize={8}
              />
              {chartData.series.map((series) => (
                <Line
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stroke={COLORS[series.name as keyof typeof COLORS] || 'hsl(var(--primary))'}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

TrendChart.displayName = 'TrendChart';

// ... rest of the file ...

// Skeleton chart data for loading states
const createSkeletonChartData = (unit: string): ChartData => ({
  chart_id: 'skeleton',
  city: '',
  months: 12,
  labels: [],
  series: [],
  unit,
  updated_at: new Date().toISOString(),
});

// Pre-configured chart components
export function PriceM2TrendChart({ chartData, isLoading }: { chartData?: ChartData; isLoading?: boolean }) {
  if (isLoading || !chartData) {
    return (
      <TrendChart
        title="Evolução do Preço do m² por Faixa"
        description="Últimos 12 meses"
        chartData={createSkeletonChartData('R$/m²')}
        isLoading={true}
      />
    );
  }
  return (
    <TrendChart
      title="Evolução do Preço do m² por Faixa"
      description="Últimos 12 meses"
      chartData={chartData}
      isLoading={false}
    />
  );
}

export function DemandIndexTrendChart({ chartData, isLoading }: { chartData?: ChartData; isLoading?: boolean }) {
  if (isLoading || !chartData) {
    return (
      <TrendChart
        title="Índice de Demanda (0-100) por Faixa"
        description="Últimos 12 meses"
        chartData={createSkeletonChartData('pontos')}
        isLoading={true}
      />
    );
  }
  return (
    <TrendChart
      title="Índice de Demanda (0-100) por Faixa"
      description="Últimos 12 meses"
      chartData={chartData}
      isLoading={false}
    />
  );
}

export function StockTrendChart({ chartData, isLoading }: { chartData?: ChartData; isLoading?: boolean }) {
  if (isLoading || !chartData) {
    return (
      <TrendChart
        title="Estoque Disponível por Faixa"
        description="Últimos 12 meses"
        chartData={createSkeletonChartData('unidades')}
        isLoading={true}
      />
    );
  }
  return (
    <TrendChart
      title="Estoque Disponível por Faixa"
      description="Últimos 12 meses"
      chartData={chartData}
      isLoading={false}
    />
  );
}

export function AttractivenessIndexChart({ chartData, isLoading }: { chartData?: ChartData; isLoading?: boolean }) {
  if (isLoading || !chartData) {
    return (
      <TrendChart
        title="Índice de Atratividade (0-100) por Faixa"
        description="Últimos 12 meses"
        chartData={createSkeletonChartData('pontos')}
        isLoading={true}
      />
    );
  }
  return (
    <TrendChart
      title="Índice de Atratividade (0-100) por Faixa"
      description="Últimos 12 meses"
      chartData={chartData}
      isLoading={false}
    />
  );
}
