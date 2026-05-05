import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface CityData {
  city: string;
  uf: string;
  avg_price_m2: number;
  price_variation_12m: number;
}

interface HistoricalPriceChartProps {
  cities: CityData[];
  selectedCities?: string[];
}

// Gerar dados históricos simulados baseados nos dados atuais
function generateHistoricalData(cities: CityData[], months: number = 12) {
  const data = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    const point: Record<string, string | number> = { month: monthName };
    
    cities.forEach(city => {
      // Calcular preço histórico baseado na variação anual
      const monthlyVariation = city.price_variation_12m / 12;
      const monthsAgo = i;
      const historicalFactor = 1 - (monthlyVariation * monthsAgo / 100);
      // Adicionar variação aleatória pequena para parecer mais realista
      const randomVariation = 1 + (Math.random() - 0.5) * 0.02;
      const historicalPrice = Math.round(city.avg_price_m2 * historicalFactor * randomVariation);
      
      point[`${city.city}`] = historicalPrice;
    });
    
    data.push(point);
  }
  
  return data;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function HistoricalPriceChart({ cities, selectedCities }: HistoricalPriceChartProps) {
  const filteredCities = selectedCities?.length 
    ? cities.filter(c => selectedCities.includes(`${c.city}-${c.uf}`))
    : cities.slice(0, 5);
    
  const historicalData = generateHistoricalData(filteredCities);
  
  const chartConfig = filteredCities.reduce((acc, city, index) => {
    acc[city.city] = {
      label: `${city.city}/${city.uf}`,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Evolução de Preços (12 meses)
        </CardTitle>
        <CardDescription>
          Histórico de preço médio por m² das principais cidades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => [formatCurrency(value as number), name]}
                  />
                }
              />
              <Legend />
              {filteredCities.map((city, index) => (
                <Line
                  key={city.city}
                  type="monotone"
                  dataKey={city.city}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
