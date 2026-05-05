import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CityData {
  city: string;
  uf: string;
  avg_price_m2: number;
  price_variation_12m: number;
  demand_index: number;
  absorption_rate: number;
  supply_units: number;
}

interface CitySelectionListProps {
  cities: CityData[];
  selectedCities: string[];
  onToggleCity: (cityKey: string) => void;
  searchQuery: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function CitySelectionList({ 
  cities, 
  selectedCities, 
  onToggleCity,
  searchQuery 
}: CitySelectionListProps) {
  const filteredCities = cities.filter(
    (item) =>
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.uf.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4 text-primary" />
          Cidades Disponíveis
        </CardTitle>
        <CardDescription>
          {selectedCities.length > 0 
            ? `${selectedCities.length} cidade(s) selecionada(s) para comparação`
            : 'Selecione cidades para comparar'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4 pt-0">
            {filteredCities.map((city) => {
              const cityKey = `${city.city}-${city.uf}`;
              const isSelected = selectedCities.includes(cityKey);
              
              return (
                <div
                  key={cityKey}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onToggleCity(cityKey)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => onToggleCity(cityKey)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{city.city}</span>
                        <Badge variant="secondary" className="text-xs">{city.uf}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{formatCurrency(city.avg_price_m2)}/m²</span>
                        <span className="flex items-center gap-0.5">
                          {city.price_variation_12m > 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-500" />
                          )}
                          <span className={city.price_variation_12m > 0 ? 'text-green-500' : 'text-red-500'}>
                            {city.price_variation_12m > 0 ? '+' : ''}{city.price_variation_12m.toFixed(1)}%
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Demanda:</span>
                      <span className="font-medium">{city.demand_index}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Absorção: {city.absorption_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
