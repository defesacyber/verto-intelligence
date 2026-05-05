import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { GraphSkeleton } from '@/components/ui/chart';

interface IDIEvolutionChartProps {
  className?: string;
}

interface CityOption {
  cidade: string;
  uf: string;
  score_idi: number | null;
}

interface HistoricalData {
  mes: string;
  mesLabel: string;
  score_idi: number;
  score_variacao: number | null;
  score_preco: number | null;
  score_demanda: number | null;
}

export function IDIEvolutionChart({ className }: IDIEvolutionChartProps) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Carregar lista de cidades disponíveis
  useEffect(() => {
    async function fetchCities() {
      setIsLoading(true);
      const { data } = await supabase
        .from('idi_score_cache')
        .select('cidade, uf, score_idi')
        .order('score_idi', { ascending: false });

      if (data) {
        // Remover duplicatas
        const uniqueCities = data.reduce((acc: CityOption[], curr) => {
          const exists = acc.find(c => c.cidade === curr.cidade && c.uf === curr.uf);
          if (!exists) {
            acc.push(curr);
          }
          return acc;
        }, []);
        setCities(uniqueCities);
        
        // Selecionar primeira cidade automaticamente
        if (uniqueCities.length > 0 && !selectedCity) {
          setSelectedCity(`${uniqueCities[0].cidade}|${uniqueCities[0].uf}`);
        }
      }
      setIsLoading(false);
    }

    fetchCities();
  }, [selectedCity]);

  // Carregar histórico da cidade selecionada
  useEffect(() => {
    async function fetchHistory() {
      if (!selectedCity) return;
      
      setIsLoadingHistory(true);
      const [cidade, uf] = selectedCity.split('|');

      // Buscar scores históricos
      const { data: scoreData } = await supabase
        .from('idi_score_cache')
        .select('mes, score_idi, score_variacao, score_preco, score_demanda')
        .eq('cidade', cidade)
        .eq('uf', uf)
        .order('mes', { ascending: true });

      // Buscar histórico FipeZap para mais contexto
      const { data: fipezapData } = await supabase
        .from('idi_fipezap_historico')
        .select('mes, variacao_venda_12m, preco_m2_venda')
        .eq('cidade', cidade)
        .eq('uf', uf)
        .order('mes', { ascending: true });

      // Combinar dados
      const history: HistoricalData[] = [];
      
      if (scoreData && scoreData.length > 0) {
        scoreData.forEach(s => {
          const date = new Date(s.mes);
          history.push({
            mes: s.mes,
            mesLabel: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            score_idi: s.score_idi || 0,
            score_variacao: s.score_variacao,
            score_preco: s.score_preco,
            score_demanda: s.score_demanda,
          });
        });
      } else if (fipezapData && fipezapData.length > 0) {
        // Fallback: simular scores baseado em FipeZap
        fipezapData.forEach(f => {
          const date = new Date(f.mes);
          const estimatedScore = 50 + (f.variacao_venda_12m || 0) * 2;
          history.push({
            mes: f.mes,
            mesLabel: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            score_idi: Math.min(100, Math.max(0, estimatedScore)),
            score_variacao: null,
            score_preco: null,
            score_demanda: null,
          });
        });
      }

      setHistoricalData(history);
      setIsLoadingHistory(false);
    }

    fetchHistory();
  }, [selectedCity]);

  const selectedCityInfo = selectedCity ? cities.find(c => `${c.cidade}|${c.uf}` === selectedCity) : null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Evolução IDI</CardTitle>
          </div>
          {selectedCityInfo && (
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{selectedCityInfo.score_idi?.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground ml-1">atual</span>
            </div>
          )}
        </div>
        <CardDescription>Histórico do Índice de Desenvolvimento Imobiliário</CardDescription>
        
        {/* Seletor de cidade */}
        <div className="mt-3">
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma cidade" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {isLoading ? (
                <div className="p-2 text-sm text-muted-foreground">Carregando...</div>
              ) : (
                cities.map(city => (
                  <SelectItem 
                    key={`${city.cidade}-${city.uf}`} 
                    value={`${city.cidade}|${city.uf}`}
                  >
                    {city.cidade} - {city.uf} (IDI: {city.score_idi?.toFixed(1)})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingHistory ? (
          <GraphSkeleton height={300} legendItems={3} />
        ) : historicalData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Selecione uma cidade para ver a evolução do IDI
            </p>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="mesLabel" 
                  tick={{ fontSize: 11 }} 
                  className="fill-muted-foreground"
                />
                <YAxis 
                  domain={[40, 100]} 
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
                      score_variacao: 'Variação',
                      score_preco: 'Preço',
                      score_demanda: 'Demanda'
                    };
                    return [value?.toFixed(1), labels[name] || name];
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      score_idi: 'IDI Total',
                      score_variacao: 'Variação',
                      score_preco: 'Preço',
                      score_demanda: 'Demanda'
                    };
                    return labels[value] || value;
                  }}
                />
                <ReferenceLine y={70} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                <Line 
                  type="monotone" 
                  dataKey="score_idi" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 6 }}
                />
                {historicalData[0]?.score_variacao !== null && (
                  <Line 
                    type="monotone" 
                    dataKey="score_variacao" 
                    stroke="hsl(142 76% 36%)" 
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                )}
                {historicalData[0]?.score_demanda !== null && (
                  <Line 
                    type="monotone" 
                    dataKey="score_demanda" 
                    stroke="hsl(221 83% 53%)" 
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
