import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraphSkeleton } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, LineChart as LineChartIcon } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PriceEvolutionChartProps {
  cidade: string;
  uf: string;
  className?: string;
}

interface HistoricalPrice {
  mes: string;
  mesLabel: string;
  preco_m2_venda: number | null;
  preco_m2_locacao: number | null;
  variacao_venda_mes: number | null;
  variacao_venda_12m: number | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function PriceEvolutionChart({ cidade, uf, className }: PriceEvolutionChartProps) {
  const [data, setData] = useState<HistoricalPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [variation12m, setVariation12m] = useState<number | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!cidade || !uf) return;
      
      setIsLoading(true);
      
      const { data: fipezapData, error } = await supabase
        .from('idi_fipezap_historico')
        .select('mes, preco_m2_venda, preco_m2_locacao, variacao_venda_mes, variacao_venda_12m')
        .eq('cidade', cidade)
        .eq('uf', uf)
        .order('mes', { ascending: true })
        .limit(24);

      if (error) {
        console.error('Error fetching price history:', error);
        setIsLoading(false);
        return;
      }

      if (fipezapData && fipezapData.length > 0) {
        const history: HistoricalPrice[] = fipezapData.map(item => {
          const date = new Date(item.mes);
          return {
            mes: item.mes,
            mesLabel: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            preco_m2_venda: item.preco_m2_venda,
            preco_m2_locacao: item.preco_m2_locacao,
            variacao_venda_mes: item.variacao_venda_mes,
            variacao_venda_12m: item.variacao_venda_12m,
          };
        });

        setData(history);
        
        // Get latest values
        const latest = fipezapData[fipezapData.length - 1];
        setLatestPrice(latest.preco_m2_venda);
        setVariation12m(latest.variacao_venda_12m);
      }
      
      setIsLoading(false);
    }

    fetchHistory();
  }, [cidade, uf]);

  if (isLoading) {
    return (
      <GraphSkeleton className={className} height={280} legendItems={2} />
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-secondary" />
            Evolução de Preços
          </CardTitle>
          <CardDescription>{cidade}, {uf}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <LineChartIcon className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">Dados históricos não disponíveis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-secondary" />
              Evolução de Preços
            </CardTitle>
            <CardDescription>{cidade}, {uf} - Últimos 24 meses</CardDescription>
          </div>
          {latestPrice && (
            <div className="text-right">
              <div className="text-xl font-bold">{formatCurrency(latestPrice)}/m²</div>
              {variation12m !== null && (
                <div className={cn(
                  "flex items-center justify-end text-sm",
                  variation12m > 0 ? "text-success" : "text-destructive"
                )}>
                  {variation12m > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {variation12m > 0 ? '+' : ''}{variation12m.toFixed(1)}% (12m)
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="mesLabel" 
                tick={{ fontSize: 11 }} 
                className="fill-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                className="fill-muted-foreground"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    preco_m2_venda: 'Venda/m²',
                    preco_m2_locacao: 'Aluguel/m²'
                  };
                  return [value ? formatCurrency(value) : 'N/D', labels[name] || name];
                }}
              />
              <Legend 
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    preco_m2_venda: 'Preço Venda/m²',
                    preco_m2_locacao: 'Preço Aluguel/m²'
                  };
                  return labels[value] || value;
                }}
              />
              <Area
                type="monotone"
                dataKey="preco_m2_venda"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
              />
              {data.some(d => d.preco_m2_locacao) && (
                <Area
                  type="monotone"
                  dataKey="preco_m2_locacao"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  fill="url(#rentGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--secondary))' }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Variação mensal */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Mínimo</div>
            <div className="font-semibold">
              {formatCurrency(Math.min(...data.filter(d => d.preco_m2_venda).map(d => d.preco_m2_venda!)))}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Média</div>
            <div className="font-semibold">
              {formatCurrency(
                data.filter(d => d.preco_m2_venda).reduce((acc, d) => acc + d.preco_m2_venda!, 0) / 
                data.filter(d => d.preco_m2_venda).length
              )}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Máximo</div>
            <div className="font-semibold">
              {formatCurrency(Math.max(...data.filter(d => d.preco_m2_venda).map(d => d.preco_m2_venda!)))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
