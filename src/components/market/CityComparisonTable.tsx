import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpRight, ArrowDownRight, X, BarChart3, FileDown, FileSpreadsheet } from 'lucide-react';
import { calculateAbsorptionMonths } from '@/lib/engine/financial-engine';

interface CityData {
  city: string;
  uf: string;
  avg_price_m2: number;
  price_variation_12m: number;
  demand_index: number;
  absorption_rate: number;
  supply_units: number;
}

interface CityComparisonTableProps {
  cities: CityData[];
  selectedCities: string[];
  onToggleCity: (cityKey: string) => void;
  onClearSelection: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function CityComparisonTable({ 
  cities, 
  selectedCities, 
  onToggleCity, 
  onClearSelection 
}: CityComparisonTableProps) {
  const comparisonCities = useMemo(() => 
    cities.filter(c => selectedCities.includes(`${c.city}-${c.uf}`)),
    [cities, selectedCities]
  );

  const stats = useMemo(() => {
    if (comparisonCities.length === 0) return null;
    
    return {
      maxPrice: Math.max(...comparisonCities.map(c => c.avg_price_m2)),
      minPrice: Math.min(...comparisonCities.map(c => c.avg_price_m2)),
      maxDemand: Math.max(...comparisonCities.map(c => c.demand_index)),
      maxAbsorption: Math.max(...comparisonCities.map(c => c.absorption_rate)),
      avgPrice: comparisonCities.reduce((sum, c) => sum + c.avg_price_m2, 0) / comparisonCities.length,
      avgVariation: comparisonCities.reduce((sum, c) => sum + c.price_variation_12m, 0) / comparisonCities.length,
      avgDemand: comparisonCities.reduce((sum, c) => sum + c.demand_index, 0) / comparisonCities.length,
      avgAbsorption: comparisonCities.reduce((sum, c) => sum + c.absorption_rate, 0) / comparisonCities.length,
    };
  }, [comparisonCities]);

  if (comparisonCities.length === 0 || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Comparar Cidades
          </CardTitle>
          <CardDescription>
            Selecione cidades na tabela abaixo para comparar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma cidade selecionada para comparação</p>
            <p className="text-sm mt-2">Marque as cidades que deseja comparar na lista</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { maxPrice, minPrice, maxDemand, maxAbsorption, avgPrice, avgVariation, avgDemand, avgAbsorption } = stats;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Comparação de {comparisonCities.length} Cidades
            </CardTitle>
            <CardDescription>
              Análise comparativa detalhada dos mercados selecionados
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                const { exportComparisonToPdf } = await import('@/lib/comparison-pdf-export');
                exportComparisonToPdf(comparisonCities);
              }}
            >
              <FileDown className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                const { exportComparisonToExcel } = await import('@/lib/comparison-excel-export');
                await exportComparisonToExcel(comparisonCities);
              }}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cidade</TableHead>
                <TableHead className="text-right">Preço/m²</TableHead>
                <TableHead className="text-right">Variação 12m</TableHead>
                <TableHead className="text-right">Demanda</TableHead>
                <TableHead className="text-right">Absorção</TableHead>
                <TableHead className="text-right">Oferta</TableHead>
                <TableHead className="text-right">Tempo Venda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonCities.map((city) => {
                const cityKey = `${city.city}-${city.uf}`;
                const isHighestPrice = city.avg_price_m2 === maxPrice;
                const isLowestPrice = city.avg_price_m2 === minPrice;
                const isHighestDemand = city.demand_index === maxDemand;
                const isHighestAbsorption = city.absorption_rate === maxAbsorption;
                const estimatedSaleMonths = calculateAbsorptionMonths(city.absorption_rate);

                return (
                  <TableRow key={cityKey}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked 
                          onCheckedChange={() => onToggleCity(cityKey)}
                        />
                        {city.city}
                        <Badge variant="secondary" className="text-xs">{city.uf}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {formatCurrency(city.avg_price_m2)}
                        {isHighestPrice && <Badge className="ml-1 text-xs">Maior</Badge>}
                        {isLowestPrice && comparisonCities.length > 1 && (
                          <Badge variant="outline" className="ml-1 text-xs">Menor</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {city.price_variation_12m > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={city.price_variation_12m > 0 ? 'text-green-500' : 'text-red-500'}>
                          {city.price_variation_12m > 0 ? '+' : ''}{city.price_variation_12m.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-12 rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${city.demand_index}%` }}
                          />
                        </div>
                        <span>{city.demand_index}</span>
                        {isHighestDemand && <Badge variant="default" className="text-xs">Alto</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {city.absorption_rate.toFixed(1)}%
                        {isHighestAbsorption && <Badge variant="default" className="text-xs">Melhor</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {city.supply_units.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {estimatedSaleMonths} meses
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Média Preço/m²</p>
            <p className="text-lg font-semibold">
              {formatCurrency(avgPrice)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Média Variação</p>
            <p className="text-lg font-semibold">
              {avgVariation.toFixed(1)}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Média Demanda</p>
            <p className="text-lg font-semibold">
              {Math.round(avgDemand)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Média Absorção</p>
            <p className="text-lg font-semibold">
              {avgAbsorption.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
