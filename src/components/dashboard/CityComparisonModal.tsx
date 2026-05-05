import { useState, useMemo } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus, ChevronDown, MapPin, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GraphSkeleton } from '@/components/ui/chart';
import type { DashboardSummaryResponse, MetricCard } from '@/lib/dashboard-types';

const CITIES = [
  'Brasil (Nacional)', 'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília',
  'Curitiba', 'Porto Alegre', 'Florianópolis', 'Goiânia', 'Salvador',
  'Recife', 'Fortaleza', 'Manaus', 'Belém', 'Vitória',
  'Campinas', 'Santos', 'Niterói', 'Balneário Camboriú', 'Joinville',
];

interface CityComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCity?: string;
}

async function fetchCityData(city: string): Promise<DashboardSummaryResponse> {
  const { data, error } = await supabase.functions.invoke('dashboard-summary', {
    body: { city },
  });
  if (error) throw new Error(error.message);
  return data;
}

function CitySelector({ 
  value, 
  onChange, 
  label,
  excludeCity 
}: { 
  value: string; 
  onChange: (city: string) => void; 
  label: string;
  excludeCity?: string;
}) {
  const [open, setOpen] = useState(false);
  const cities = excludeCity ? CITIES.filter(c => c !== excludeCity) : CITIES;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {value}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 bg-card border border-border shadow-lg z-50" align="start">
          <ScrollArea className="h-[300px]">
            <div className="py-1">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => { onChange(city); setOpen(false); }}
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-sm transition-colors",
                    value === city ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ComparisonRow({ 
  label, 
  value1, 
  value2, 
  unit,
  higherIsBetter = true 
}: { 
  label: string; 
  value1: number; 
  value2: number;
  unit?: string;
  higherIsBetter?: boolean;
}) {
  const diff = value2 - value1;
  const diffPct = value1 !== 0 ? ((diff / value1) * 100) : 0;
  
  const formatValue = (val: number) => {
    if (unit === 'R$' || unit === 'R$/m²') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
    }
    if (unit === '%') return `${val.toFixed(1)}%`;
    if (val >= 1000) return new Intl.NumberFormat('pt-BR').format(val);
    return val.toFixed(1);
  };

  const isCity1Better = higherIsBetter ? value1 > value2 : value1 < value2;
  const isCity2Better = higherIsBetter ? value2 > value1 : value2 < value1;
  const isEqual = Math.abs(diff) < 0.01;

  return (
    <div className="grid grid-cols-4 gap-2 py-2.5 border-b border-border/50 items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn(
        "text-sm font-medium text-center",
        isCity1Better && !isEqual ? "text-green-600 dark:text-green-400" : ""
      )}>
        {formatValue(value1)}
      </span>
      <span className={cn(
        "text-sm font-medium text-center",
        isCity2Better && !isEqual ? "text-green-600 dark:text-green-400" : ""
      )}>
        {formatValue(value2)}
      </span>
      <div className="flex items-center justify-center gap-1">
        {isEqual ? (
          <Minus className="h-4 w-4 text-muted-foreground" />
        ) : diff > 0 ? (
          <TrendingUp className={cn("h-4 w-4", higherIsBetter ? "text-green-500" : "text-red-500")} />
        ) : (
          <TrendingDown className={cn("h-4 w-4", higherIsBetter ? "text-red-500" : "text-green-500")} />
        )}
        <span className={cn(
          "text-xs",
          isEqual ? "text-muted-foreground" : diff > 0 
            ? (higherIsBetter ? "text-green-600" : "text-red-600")
            : (higherIsBetter ? "text-red-600" : "text-green-600")
        )}>
          {isEqual ? '=' : `${diff > 0 ? '+' : ''}${diffPct.toFixed(0)}%`}
        </span>
      </div>
    </div>
  );
}

function getMetricValue(metrics: MetricCard[] | undefined, metricId: string): number {
  return metrics?.find(m => m.metric_id === metricId)?.value?.num || 0;
}

interface ChartDataItem {
  name: string;
  city1: number;
  city2: number;
  unit?: string;
}

function ComparisonBarChart({ 
  data, 
  city1Name, 
  city2Name,
  formatValue
}: { 
  data: ChartDataItem[]; 
  city1Name: string; 
  city2Name: string;
  formatValue?: (value: number, unit?: string) => string;
}) {
  const defaultFormatter = (val: number, unit?: string) => {
    if (unit === 'R$' || unit === 'R$/m²') {
      if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
      return `R$ ${val.toFixed(0)}`;
    }
    if (unit === '%') return `${val.toFixed(1)}%`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toFixed(1);
  };

  const formatter = formatValue || defaultFormatter;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart 
        data={data} 
        layout="vertical" 
        margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        barCategoryGap="20%"
      >
        <XAxis 
          type="number" 
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={false}
          tickFormatter={(val) => formatter(val)}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip 
          cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px'
          }}
          formatter={(value: number, name: string, props: { payload: ChartDataItem }) => [
            formatter(value, props.payload.unit),
            name === 'city1' ? city1Name : city2Name
          ]}
        />
        <Legend 
          formatter={(value) => value === 'city1' ? city1Name : city2Name}
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Bar 
          dataKey="city1" 
          fill="hsl(var(--primary))" 
          radius={[0, 4, 4, 0]}
          name="city1"
        />
        <Bar 
          dataKey="city2" 
          fill="hsl(var(--secondary))" 
          radius={[0, 4, 4, 0]}
          name="city2"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CityComparisonModal({ open, onOpenChange, initialCity }: CityComparisonModalProps) {
  const [city1, setCity1] = useState(initialCity || 'São Paulo');
  const [city2, setCity2] = useState('Rio de Janeiro');

  const { data: data1, isLoading: loading1 } = useQuery({
    queryKey: ['dashboard-comparison', city1],
    queryFn: () => fetchCityData(city1),
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  const { data: data2, isLoading: loading2 } = useQuery({
    queryKey: ['dashboard-comparison', city2],
    queryFn: () => fetchCityData(city2),
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = loading1 || loading2;

  const swapCities = () => {
    const temp = city1;
    setCity1(city2);
    setCity2(temp);
  };

  // Chart data preparation
  const monthlyChartData: ChartDataItem[] = useMemo(() => [
    { name: 'Preço m²', city1: getMetricValue(data1?.monthly, 'monthly_price_m2_brl'), city2: getMetricValue(data2?.monthly, 'monthly_price_m2_brl'), unit: 'R$/m²' },
    { name: 'Índice Demanda', city1: getMetricValue(data1?.monthly, 'monthly_demand_index_points'), city2: getMetricValue(data2?.monthly, 'monthly_demand_index_points') },
    { name: 'Absorção (meses)', city1: getMetricValue(data1?.monthly, 'monthly_absorption_time_months'), city2: getMetricValue(data2?.monthly, 'monthly_absorption_time_months') },
    { name: 'Taxa Absorção', city1: getMetricValue(data1?.monthly, 'monthly_absorption_rate_pct'), city2: getMetricValue(data2?.monthly, 'monthly_absorption_rate_pct'), unit: '%' },
  ], [data1, data2]);

  const vgvChartData: ChartDataItem[] = useMemo(() => [
    { name: 'VGV Mensal', city1: getMetricValue(data1?.monthly, 'monthly_vgv_launched_brl'), city2: getMetricValue(data2?.monthly, 'monthly_vgv_launched_brl'), unit: 'R$' },
    { name: 'VGV Trimestral', city1: getMetricValue(data1?.quarterly, 'quarterly_vgv_brl'), city2: getMetricValue(data2?.quarterly, 'quarterly_vgv_brl'), unit: 'R$' },
    { name: 'Unidades Vendidas', city1: getMetricValue(data1?.monthly, 'monthly_units_sold'), city2: getMetricValue(data2?.monthly, 'monthly_units_sold') },
  ], [data1, data2]);

  const stockDemandChartData: ChartDataItem[] = useMemo(() => [
    { name: 'Estoque Total', city1: data1?.stock_demand?.total_stock_units || 0, city2: data2?.stock_demand?.total_stock_units || 0 },
    { name: 'Demanda Mensal', city1: data1?.stock_demand?.monthly_total_demand_units || 0, city2: data2?.stock_demand?.monthly_total_demand_units || 0 },
    { name: 'Meses de Estoque', city1: data1?.stock_demand?.avg_months_of_stock || 0, city2: data2?.stock_demand?.avg_months_of_stock || 0 },
  ], [data1, data2]);

  const investmentChartData: ChartDataItem[] = useMemo(() => [
    { name: 'Atratividade', city1: getMetricValue(data1?.quarterly, 'quarterly_investment_attractiveness_score_10'), city2: getMetricValue(data2?.quarterly, 'quarterly_investment_attractiveness_score_10') },
    { name: 'Confiança Setor', city1: getMetricValue(data1?.quarterly, 'quarterly_sector_confidence_points'), city2: getMetricValue(data2?.quarterly, 'quarterly_sector_confidence_points') },
    { name: 'Rent. Aluguel', city1: getMetricValue(data1?.quarterly, 'quarterly_rental_yield_pct_aa'), city2: getMetricValue(data2?.quarterly, 'quarterly_rental_yield_pct_aa'), unit: '%' },
    { name: 'Var. Preços', city1: getMetricValue(data1?.quarterly, 'quarterly_price_change_pct'), city2: getMetricValue(data2?.quarterly, 'quarterly_price_change_pct'), unit: '%' },
  ], [data1, data2]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Comparativo de Cidades
          </DialogTitle>
        </DialogHeader>

        {/* City Selectors */}
        <div className="flex items-end gap-3 mb-4">
          <div className="flex-1">
            <CitySelector value={city1} onChange={setCity1} label="Cidade 1" excludeCity={city2} />
          </div>
          <Button variant="ghost" size="icon" onClick={swapCities} className="mb-0.5">
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <CitySelector value={city2} onChange={setCity2} label="Cidade 2" excludeCity={city1} />
          </div>
        </div>

        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="charts" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="table">
              Tabela Detalhada
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts">
            <ScrollArea className="h-[450px] pr-4">
              {isLoading ? (
                <div className="space-y-4">
                  <GraphSkeleton height={260} legendItems={2} />
                  <GraphSkeleton height={260} legendItems={2} />
                  <GraphSkeleton height={260} legendItems={2} />
                  <GraphSkeleton height={260} legendItems={2} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Monthly Metrics Chart */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Índices Mensais</h3>
                    <ComparisonBarChart data={monthlyChartData} city1Name={city1} city2Name={city2} />
                  </div>

                  {/* VGV & Sales Chart */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">VGV e Vendas</h3>
                    <ComparisonBarChart data={vgvChartData} city1Name={city1} city2Name={city2} />
                  </div>

                  {/* Stock vs Demand Chart */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Estoque x Demanda</h3>
                    <ComparisonBarChart data={stockDemandChartData} city1Name={city1} city2Name={city2} />
                  </div>

                  {/* Investment Indicators Chart */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Indicadores de Investimento</h3>
                    <ComparisonBarChart data={investmentChartData} city1Name={city1} city2Name={city2} />
                  </div>

                  {/* Market Status Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn(
                      "p-3 rounded-lg border",
                      data1?.stock_demand?.status === 'Mercado aquecido' ? "bg-green-500/10 border-green-500/30" :
                      data1?.stock_demand?.status === 'Mercado saturado' ? "bg-red-500/10 border-red-500/30" :
                      "bg-yellow-500/10 border-yellow-500/30"
                    )}>
                      <p className="text-xs text-muted-foreground">{city1}</p>
                      <p className="text-sm font-semibold">{data1?.stock_demand?.status || 'N/A'}</p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg border",
                      data2?.stock_demand?.status === 'Mercado aquecido' ? "bg-green-500/10 border-green-500/30" :
                      data2?.stock_demand?.status === 'Mercado saturado' ? "bg-red-500/10 border-red-500/30" :
                      "bg-yellow-500/10 border-yellow-500/30"
                    )}>
                      <p className="text-xs text-muted-foreground">{city2}</p>
                      <p className="text-sm font-semibold">{data2?.stock_demand?.status || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="table">
            <ScrollArea className="h-[450px] pr-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="grid grid-cols-4 gap-2 pb-2 border-b-2 border-border sticky top-0 bg-background">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Indicador</span>
                    <span className="text-xs font-semibold text-center text-primary">{city1}</span>
                    <span className="text-xs font-semibold text-center text-secondary">{city2}</span>
                    <span className="text-xs font-semibold text-center text-muted-foreground">Diferença</span>
                  </div>

                  {/* Monthly Metrics */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Índices Mensais</h3>
                    <ComparisonRow 
                      label="Preço m²" 
                      value1={getMetricValue(data1?.monthly, 'monthly_price_m2_brl')}
                      value2={getMetricValue(data2?.monthly, 'monthly_price_m2_brl')}
                      unit="R$/m²"
                      higherIsBetter={true}
                    />
                    <ComparisonRow 
                      label="Índice de Demanda" 
                      value1={getMetricValue(data1?.monthly, 'monthly_demand_index_points')}
                      value2={getMetricValue(data2?.monthly, 'monthly_demand_index_points')}
                      higherIsBetter={true}
                    />
                    <ComparisonRow 
                      label="Tempo de Absorção" 
                      value1={getMetricValue(data1?.monthly, 'monthly_absorption_time_months')}
                      value2={getMetricValue(data2?.monthly, 'monthly_absorption_time_months')}
                      unit="meses"
                      higherIsBetter={false}
                    />
                    <ComparisonRow 
                      label="VGV Lançado" 
                      value1={getMetricValue(data1?.monthly, 'monthly_vgv_launched_brl')}
                      value2={getMetricValue(data2?.monthly, 'monthly_vgv_launched_brl')}
                      unit="R$"
                      higherIsBetter={true}
                    />
                    <ComparisonRow 
                      label="Unidades Vendidas" 
                      value1={getMetricValue(data1?.monthly, 'monthly_units_sold')}
                      value2={getMetricValue(data2?.monthly, 'monthly_units_sold')}
                      higherIsBetter={true}
                    />
                    <ComparisonRow 
                      label="Taxa de Absorção" 
                      value1={getMetricValue(data1?.monthly, 'monthly_absorption_rate_pct')}
                      value2={getMetricValue(data2?.monthly, 'monthly_absorption_rate_pct')}
                      unit="%"
                      higherIsBetter={true}
                    />
                  </div>

                  {/* Quarterly Metrics */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Índices Trimestrais</h3>
                    <ComparisonRow 
                      label="Variação de Preços" 
                      value1={getMetricValue(data1?.quarterly, 'quarterly_price_change_pct')}
                      value2={getMetricValue(data2?.quarterly, 'quarterly_price_change_pct')}
                      unit="%"
                      higherIsBetter={true}
                    />
                    <ComparisonRow 
                      label="VGV Trimestral" 
                      value1={getMetricValue(data1?.quarterly, 'quarterly_vgv_brl')}
                      value2={getMetricValue(data2?.quarterly, 'quarterly_vgv_brl')}
                      unit="R$"
                      higherIsBetter={true}
                    />
                    <ComparisonRow 
                      label="Estoque Total" 
                      value1={getMetricValue(data1?.quarterly, 'quarterly_total_stock_units')}
                      value2={getMetricValue(data2?.quarterly, 'quarterly_total_stock_units')}
                      higherIsBetter={false}
                    />
                    <ComparisonRow 
                      label="Confiança do Setor" 
                      value1={getMetricValue(data1?.quarterly, 'quarterly_sector_confidence_points')}
                      value2={getMetricValue(data2?.quarterly, 'quarterly_sector_confidence_points')}
                      higherIsBetter={true}
                    />
                    <ComparisonRow 
                      label="Rentabilidade Aluguel" 
                      value1={getMetricValue(data1?.quarterly, 'quarterly_rental_yield_pct_aa')}
                      value2={getMetricValue(data2?.quarterly, 'quarterly_rental_yield_pct_aa')}
                      unit="%"
                      higherIsBetter={true}
                    />
                    <ComparisonRow 
                      label="Atratividade (0-10)" 
                      value1={getMetricValue(data1?.quarterly, 'quarterly_investment_attractiveness_score_10')}
                      value2={getMetricValue(data2?.quarterly, 'quarterly_investment_attractiveness_score_10')}
                      higherIsBetter={true}
                    />
                  </div>

                  {/* Stock & Demand */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Estoque x Demanda</h3>
                    <ComparisonRow 
                      label="Estoque Total" 
                      value1={data1?.stock_demand?.total_stock_units || 0}
                      value2={data2?.stock_demand?.total_stock_units || 0}
                      higherIsBetter={false}
                    />
                    <ComparisonRow 
                      label="Demanda Mensal" 
                      value1={data1?.stock_demand?.monthly_total_demand_units || 0}
                      value2={data2?.stock_demand?.monthly_total_demand_units || 0}
                      higherIsBetter={true}
                    />
                    <ComparisonRow 
                      label="Meses de Estoque" 
                      value1={data1?.stock_demand?.avg_months_of_stock || 0}
                      value2={data2?.stock_demand?.avg_months_of_stock || 0}
                      unit="meses"
                      higherIsBetter={false}
                    />
                  </div>

                  {/* Market Status Summary */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className={cn(
                      "p-3 rounded-lg border",
                      data1?.stock_demand?.status === 'Mercado aquecido' ? "bg-green-500/10 border-green-500/30" :
                      data1?.stock_demand?.status === 'Mercado saturado' ? "bg-red-500/10 border-red-500/30" :
                      "bg-yellow-500/10 border-yellow-500/30"
                    )}>
                      <p className="text-xs text-muted-foreground">{city1}</p>
                      <p className="text-sm font-semibold">{data1?.stock_demand?.status || 'N/A'}</p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg border",
                      data2?.stock_demand?.status === 'Mercado aquecido' ? "bg-green-500/10 border-green-500/30" :
                      data2?.stock_demand?.status === 'Mercado saturado' ? "bg-red-500/10 border-red-500/30" :
                      "bg-yellow-500/10 border-yellow-500/30"
                    )}>
                      <p className="text-xs text-muted-foreground">{city2}</p>
                      <p className="text-sm font-semibold">{data2?.stock_demand?.status || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
