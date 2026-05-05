import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GraphSkeleton } from '@/components/ui/chart';
import { 
  GitCompare, 
  TrendingUp, 
  X, 
  Building2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type EconomicSegment = 'all' | 'economico' | 'medio' | 'alto';

interface CityComparisonChartsProps {
  className?: string;
  initialSegment?: EconomicSegment;
}

const SEGMENT_LABELS: Record<EconomicSegment, string> = {
  all: 'Todos os Segmentos',
  economico: 'Econômico',
  medio: 'Médio Padrão',
  alto: 'Alto Padrão',
};

const SEGMENT_PRICE_RANGES: Record<EconomicSegment, { min: number; max: number } | null> = {
  all: null,
  economico: { min: 0, max: 6000 },
  medio: { min: 6000, max: 12000 },
  alto: { min: 12000, max: Infinity },
};

interface CityOption {
  key: string;
  cidade: string;
  uf: string;
  score_idi: number;
}

interface HistoricalData {
  mes: string;
  mesLabel: string;
  [key: string]: string | number | null;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(262 83% 58%)',
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function CityComparisonCharts({ className, initialSegment = 'all' }: CityComparisonChartsProps) {
  const [availableCities, setAvailableCities] = useState<CityOption[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [priceData, setPriceData] = useState<HistoricalData[]>([]);
  const [demandData, setDemandData] = useState<HistoricalData[]>([]);
  const [segment, setSegment] = useState<EconomicSegment>(initialSegment);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);

  // Load available cities
  useEffect(() => {
    async function fetchCities() {
      setIsLoading(true);
      const { data } = await supabase
        .from('idi_score_cache')
        .select('cidade, uf, score_idi')
        .order('score_idi', { ascending: false });

      if (data) {
        const uniqueCities: CityOption[] = [];
        const seen = new Set<string>();
        
        data.forEach(item => {
          const key = `${item.cidade}|${item.uf}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueCities.push({
              key,
              cidade: item.cidade,
              uf: item.uf,
              score_idi: item.score_idi || 0,
            });
          }
        });
        
        setAvailableCities(uniqueCities);
        
        // Select top 2 by default
        if (uniqueCities.length >= 2) {
          setSelectedCities([uniqueCities[0].key, uniqueCities[1].key]);
        }
      }
      setIsLoading(false);
    }

    fetchCities();
  }, []);

  // Load historical data for selected cities with segment filter
  useEffect(() => {
    async function fetchHistoricalData() {
      if (selectedCities.length === 0) {
        setPriceData([]);
        setDemandData([]);
        return;
      }

      setIsLoadingCharts(true);

      // Create date map for synchronized data
      const priceMap = new Map<string, HistoricalData>();
      const demandMap = new Map<string, HistoricalData>();
      const segmentRange = SEGMENT_PRICE_RANGES[segment];

      for (const cityKey of selectedCities) {
        const [cidade, uf] = cityKey.split('|');
        const cityLabel = `${cidade}`;

        // Fetch price data
        const query = supabase
          .from('idi_fipezap_historico')
          .select('mes, preco_m2_venda, variacao_venda_12m')
          .eq('cidade', cidade)
          .eq('uf', uf)
          .order('mes', { ascending: true })
          .limit(24);

        const { data: fipezapData } = await query;

        // Fetch IDI scores
        const { data: idiData } = await supabase
          .from('idi_score_cache')
          .select('mes, score_idi, score_demanda')
          .eq('cidade', cidade)
          .eq('uf', uf)
          .order('mes', { ascending: true });

        // Process price data with segment filter
        if (fipezapData) {
          fipezapData.forEach(item => {
            // Apply segment filter
            if (segmentRange && item.preco_m2_venda) {
              const price = Number(item.preco_m2_venda);
              if (price < segmentRange.min || price >= segmentRange.max) {
                return; // Skip this data point
              }
            }

            const date = new Date(item.mes);
            const mesLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            
            if (!priceMap.has(item.mes)) {
              priceMap.set(item.mes, { mes: item.mes, mesLabel });
            }
            const entry = priceMap.get(item.mes)!;
            entry[`price_${cityLabel}`] = item.preco_m2_venda;
            entry[`var_${cityLabel}`] = item.variacao_venda_12m;
          });
        }

        // Process demand data
        if (idiData) {
          idiData.forEach(item => {
            const date = new Date(item.mes);
            const mesLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            
            if (!demandMap.has(item.mes)) {
              demandMap.set(item.mes, { mes: item.mes, mesLabel });
            }
            const entry = demandMap.get(item.mes)!;
            entry[`idi_${cityLabel}`] = item.score_idi;
            entry[`demand_${cityLabel}`] = item.score_demanda;
          });
        }
      }

      // Convert maps to sorted arrays
      const sortedPriceData = Array.from(priceMap.values()).sort((a, b) => 
        new Date(a.mes).getTime() - new Date(b.mes).getTime()
      );
      const sortedDemandData = Array.from(demandMap.values()).sort((a, b) => 
        new Date(a.mes).getTime() - new Date(b.mes).getTime()
      );

      setPriceData(sortedPriceData);
      setDemandData(sortedDemandData);
      setIsLoadingCharts(false);
    }

    fetchHistoricalData();
  }, [selectedCities, segment]);

  const addCity = (cityKey: string) => {
    if (selectedCities.length < 5 && !selectedCities.includes(cityKey)) {
      setSelectedCities([...selectedCities, cityKey]);
    }
  };

  const removeCity = (cityKey: string) => {
    setSelectedCities(selectedCities.filter(c => c !== cityKey));
  };

  const selectedCityData = useMemo(() => {
    return selectedCities.map((key, index) => {
      const city = availableCities.find(c => c.key === key);
      return {
        key,
        cidade: city?.cidade || '',
        uf: city?.uf || '',
        score_idi: city?.score_idi || 0,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
  }, [selectedCities, availableCities]);

  const unselectedCities = availableCities.filter(c => !selectedCities.includes(c.key));

  if (isLoading) {
    return <GraphSkeleton className={className} height={400} />;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-secondary" />
              Comparativo de Cidades
            </CardTitle>
            <CardDescription>Compare até 5 cidades lado a lado</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* City selection */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
        {selectedCityData.map((city) => (
              <Badge 
                key={city.key} 
                variant="outline" 
                className="py-1.5 px-3 text-sm"
                style={{ borderColor: city.color, backgroundColor: `${city.color}15` }}
              >
                <span 
                  className="w-2 h-2 rounded-full mr-2" 
                  style={{ backgroundColor: city.color }}
                />
                {city.cidade} - {city.uf}
                <span className="ml-2 text-muted-foreground">
                  IDI: {city.score_idi.toFixed(0)}
                </span>
                <button 
                  onClick={() => removeCity(city.key)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedCities.length < 5 && (
              <Select onValueChange={addCity}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Adicionar cidade..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {unselectedCities.map(city => (
                    <SelectItem key={city.key} value={city.key}>
                      {city.cidade} - {city.uf} (IDI: {city.score_idi.toFixed(0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Segment filter */}
            <Select value={segment} onValueChange={(v) => setSegment(v as EconomicSegment)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Segmento econômico" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SEGMENT_LABELS) as EconomicSegment[]).map(seg => (
                  <SelectItem key={seg} value={seg}>
                    {SEGMENT_LABELS[seg]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoadingCharts ? (
          <div className="space-y-4">
            <GraphSkeleton height={300} />
            <GraphSkeleton height={300} />
          </div>
        ) : (
          <>
            {/* Price Evolution Chart */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Evolução de Preços (R$/m²)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <defs>
                      {selectedCityData.map((city, index) => (
                        <linearGradient key={city.key} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={city.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={city.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis 
                      dataKey="mesLabel" 
                      tick={{ fontSize: 10 }} 
                      className="fill-muted-foreground"
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
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
                        const cityName = name.replace('price_', '');
                        return [value ? formatCurrency(value) : 'N/D', cityName];
                      }}
                    />
                    <Legend 
                      formatter={(value) => value.replace('price_', '')}
                    />
                    {selectedCityData.map((city, index) => (
                      <Area
                        key={city.key}
                        type="monotone"
                        dataKey={`price_${city.cidade}`}
                        stroke={city.color}
                        strokeWidth={2}
                        fill={`url(#gradient-${index})`}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* IDI Evolution Chart */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-secondary" />
                Evolução do IDI
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={demandData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis 
                      dataKey="mesLabel" 
                      tick={{ fontSize: 10 }} 
                      className="fill-muted-foreground"
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={[30, 100]} 
                      tick={{ fontSize: 10 }} 
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
                        const cityName = name.replace('idi_', '');
                        return [value?.toFixed(1) || 'N/D', cityName];
                      }}
                    />
                    <Legend 
                      formatter={(value) => value.replace('idi_', '')}
                    />
                    {selectedCityData.map((city) => (
                      <Line
                        key={city.key}
                        type="monotone"
                        dataKey={`idi_${city.cidade}`}
                        stroke={city.color}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary table */}
            {selectedCityData.length >= 2 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3">Cidade</th>
                      <th className="text-right py-2 px-3">IDI Atual</th>
                      <th className="text-right py-2 px-3">Preço/m²</th>
                      <th className="text-right py-2 px-3">Var. 12m</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCityData.map(city => {
                      const latestPrice = priceData[priceData.length - 1];
                      const price = latestPrice?.[`price_${city.cidade}`] as number | undefined;
                      const variation = latestPrice?.[`var_${city.cidade}`] as number | undefined;
                      
                      return (
                        <tr key={city.key} className="border-b border-border/50">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: city.color }}
                              />
                              {city.cidade} - {city.uf}
                            </div>
                          </td>
                          <td className="text-right py-2 px-3 font-medium">
                            {city.score_idi.toFixed(1)}
                          </td>
                          <td className="text-right py-2 px-3">
                            {price ? formatCurrency(price) : '-'}
                          </td>
                          <td className={cn(
                            "text-right py-2 px-3",
                            variation && variation > 0 ? "text-success" : variation && variation < 0 ? "text-destructive" : ""
                          )}>
                            {variation !== undefined ? `${variation > 0 ? '+' : ''}${variation.toFixed(1)}%` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
