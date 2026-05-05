import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraphSkeleton } from '@/components/ui/chart';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface DemandEvolutionChartProps {
  cidade: string;
  uf: string;
  className?: string;
}

interface DemandData {
  mes: string;
  mesLabel: string;
  score_idi: number | null;
  score_demanda: number | null;
  score_liquidez: number | null;
  variacao_venda_12m: number | null;
}

export function DemandEvolutionChart({ cidade, uf, className }: DemandEvolutionChartProps) {
  const [data, setData] = useState<DemandData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    async function fetchDemandData() {
      if (!cidade || !uf) return;
      
      setIsLoading(true);
      
      // Fetch IDI scores
      const { data: idiData, error: idiError } = await supabase
        .from('idi_score_cache')
        .select('mes, score_idi, score_demanda, score_liquidez')
        .eq('cidade', cidade)
        .eq('uf', uf)
        .order('mes', { ascending: true });

      // Fetch FipeZap variation data
      const { data: fipezapData, error: fipezapError } = await supabase
        .from('idi_fipezap_historico')
        .select('mes, variacao_venda_12m')
        .eq('cidade', cidade)
        .eq('uf', uf)
        .order('mes', { ascending: true });

      if (idiError && fipezapError) {
        console.error('Error fetching demand data:', idiError || fipezapError);
        setIsLoading(false);
        return;
      }

      // Create a map of FipeZap data by month
      const fipezapMap = new Map<string, number>();
      if (fipezapData) {
        fipezapData.forEach(item => {
          fipezapMap.set(item.mes, item.variacao_venda_12m || 0);
        });
      }

      // Combine data
      const combinedData: DemandData[] = [];
      
      if (idiData && idiData.length > 0) {
        idiData.forEach(item => {
          const date = new Date(item.mes);
          combinedData.push({
            mes: item.mes,
            mesLabel: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            score_idi: item.score_idi,
            score_demanda: item.score_demanda,
            score_liquidez: item.score_liquidez,
            variacao_venda_12m: fipezapMap.get(item.mes) || null,
          });
        });

        // Calculate trend
        if (combinedData.length >= 3) {
          const recent = combinedData.slice(-3);
          const avgRecent = recent.reduce((acc, d) => acc + (d.score_idi || 0), 0) / 3;
          const older = combinedData.slice(0, 3);
          const avgOlder = older.reduce((acc, d) => acc + (d.score_idi || 0), 0) / 3;
          
          if (avgRecent > avgOlder * 1.05) setTrend('up');
          else if (avgRecent < avgOlder * 0.95) setTrend('down');
          else setTrend('stable');
        }

        setLatestScore(combinedData[combinedData.length - 1]?.score_idi || null);
      }
      
      setData(combinedData);
      setIsLoading(false);
    }

    fetchDemandData();
  }, [cidade, uf]);

  if (isLoading) {
    return <GraphSkeleton className={className} height={280} />;
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-secondary" />
            Evolução da Demanda
          </CardTitle>
          <CardDescription>{cidade}, {uf}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">Dados de demanda não disponíveis</p>
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
              <Activity className="h-5 w-5 text-secondary" />
              Evolução da Demanda
            </CardTitle>
            <CardDescription>{cidade}, {uf} - Índice IDI</CardDescription>
          </div>
          {latestScore !== null && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{latestScore.toFixed(1)}</div>
              <div className={cn(
                "flex items-center justify-end text-sm",
                trend === 'up' ? "text-success" : trend === 'down' ? "text-destructive" : "text-muted-foreground"
              )}>
                {trend === 'up' && <TrendingUp className="h-4 w-4 mr-1" />}
                {trend === 'down' && <TrendingDown className="h-4 w-4 mr-1" />}
                {trend === 'up' ? 'Tendência de alta' : trend === 'down' ? 'Tendência de queda' : 'Estável'}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="mesLabel" 
                tick={{ fontSize: 11 }} 
                className="fill-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[30, 100]} 
                tick={{ fontSize: 11 }} 
                className="fill-muted-foreground"
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
                    score_idi: 'IDI Total',
                    score_demanda: 'Score Demanda',
                    score_liquidez: 'Score Liquidez'
                  };
                  return [value?.toFixed(1) || 'N/D', labels[name] || name];
                }}
              />
              <Legend 
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    score_idi: 'IDI Total',
                    score_demanda: 'Demanda',
                    score_liquidez: 'Liquidez'
                  };
                  return labels[value] || value;
                }}
              />
              <ReferenceLine y={70} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'Bom', position: 'right', fontSize: 10 }} />
              <Line 
                type="monotone" 
                dataKey="score_idi" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 5 }}
              />
              {data.some(d => d.score_demanda !== null) && (
                <Line 
                  type="monotone" 
                  dataKey="score_demanda" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
              {data.some(d => d.score_liquidez !== null) && (
                <Line 
                  type="monotone" 
                  dataKey="score_liquidez" 
                  stroke="hsl(142 76% 36%)" 
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Score summary */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-primary/10">
            <div className="text-sm text-muted-foreground">Score IDI Atual</div>
            <div className="font-bold text-primary text-lg">{latestScore?.toFixed(1) || '-'}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Média Período</div>
            <div className="font-semibold">
              {(data.reduce((acc, d) => acc + (d.score_idi || 0), 0) / data.length).toFixed(1)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Variação</div>
            <div className={cn(
              "font-semibold",
              trend === 'up' ? "text-success" : trend === 'down' ? "text-destructive" : ""
            )}>
              {data.length >= 2 
                ? `${((data[data.length - 1]?.score_idi || 0) - (data[0]?.score_idi || 0)).toFixed(1)} pts`
                : '-'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
