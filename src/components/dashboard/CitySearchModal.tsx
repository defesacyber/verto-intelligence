import { useState, useMemo } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Lista de todas as cidades brasileiras principais por estado
const BRAZILIAN_CITIES = [
  // Nacional
  { city: 'Brasil (Nacional)', state: '', region: 'Nacional' },
  
  // Sudeste
  { city: 'São Paulo', state: 'SP', region: 'Sudeste' },
  { city: 'Campinas', state: 'SP', region: 'Sudeste' },
  { city: 'Santos', state: 'SP', region: 'Sudeste' },
  { city: 'São José dos Campos', state: 'SP', region: 'Sudeste' },
  { city: 'Ribeirão Preto', state: 'SP', region: 'Sudeste' },
  { city: 'Sorocaba', state: 'SP', region: 'Sudeste' },
  { city: 'Guarulhos', state: 'SP', region: 'Sudeste' },
  { city: 'Rio de Janeiro', state: 'RJ', region: 'Sudeste' },
  { city: 'Niterói', state: 'RJ', region: 'Sudeste' },
  { city: 'Belo Horizonte', state: 'MG', region: 'Sudeste' },
  { city: 'Uberlândia', state: 'MG', region: 'Sudeste' },
  { city: 'Juiz de Fora', state: 'MG', region: 'Sudeste' },
  { city: 'Vitória', state: 'ES', region: 'Sudeste' },
  
  // Sul
  { city: 'Curitiba', state: 'PR', region: 'Sul' },
  { city: 'Londrina', state: 'PR', region: 'Sul' },
  { city: 'Maringá', state: 'PR', region: 'Sul' },
  { city: 'Porto Alegre', state: 'RS', region: 'Sul' },
  { city: 'Caxias do Sul', state: 'RS', region: 'Sul' },
  { city: 'Florianópolis', state: 'SC', region: 'Sul' },
  { city: 'Joinville', state: 'SC', region: 'Sul' },
  { city: 'Blumenau', state: 'SC', region: 'Sul' },
  { city: 'Balneário Camboriú', state: 'SC', region: 'Sul' },
  
  // Centro-Oeste
  { city: 'Brasília', state: 'DF', region: 'Centro-Oeste' },
  { city: 'Goiânia', state: 'GO', region: 'Centro-Oeste' },
  { city: 'Campo Grande', state: 'MS', region: 'Centro-Oeste' },
  { city: 'Cuiabá', state: 'MT', region: 'Centro-Oeste' },
  
  // Nordeste
  { city: 'Salvador', state: 'BA', region: 'Nordeste' },
  { city: 'Recife', state: 'PE', region: 'Nordeste' },
  { city: 'Fortaleza', state: 'CE', region: 'Nordeste' },
  { city: 'Natal', state: 'RN', region: 'Nordeste' },
  { city: 'João Pessoa', state: 'PB', region: 'Nordeste' },
  { city: 'Maceió', state: 'AL', region: 'Nordeste' },
  { city: 'Aracaju', state: 'SE', region: 'Nordeste' },
  { city: 'Teresina', state: 'PI', region: 'Nordeste' },
  { city: 'São Luís', state: 'MA', region: 'Nordeste' },
  
  // Norte
  { city: 'Manaus', state: 'AM', region: 'Norte' },
  { city: 'Belém', state: 'PA', region: 'Norte' },
  { city: 'Palmas', state: 'TO', region: 'Norte' },
  { city: 'Porto Velho', state: 'RO', region: 'Norte' },
  { city: 'Rio Branco', state: 'AC', region: 'Norte' },
  { city: 'Macapá', state: 'AP', region: 'Norte' },
  { city: 'Boa Vista', state: 'RR', region: 'Norte' },
];

interface CitySearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (city: string) => void;
  currentCity: string;
}

export function CitySearchModal({ open, onOpenChange, onSelect, currentCity }: CitySearchModalProps) {
  const [search, setSearch] = useState('');

  const filteredCities = useMemo(() => {
    if (!search.trim()) {
      return BRAZILIAN_CITIES;
    }
    const searchLower = search.toLowerCase();
    return BRAZILIAN_CITIES.filter(
      (c) =>
        c.city.toLowerCase().includes(searchLower) ||
        c.state.toLowerCase().includes(searchLower) ||
        c.region.toLowerCase().includes(searchLower)
    );
  }, [search]);

  // Agrupa cidades por região
  const groupedCities = useMemo(() => {
    const groups: Record<string, typeof BRAZILIAN_CITIES> = {};
    filteredCities.forEach((city) => {
      const region = city.region || 'Outros';
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(city);
    });
    return groups;
  }, [filteredCities]);

  const handleSelect = (city: string) => {
    onSelect(city);
    setSearch('');
    onOpenChange(false);
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term.trim()) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === term.toLowerCase() 
            ? <span key={i} className="font-bold text-primary">{part}</span> 
            : part
        )}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Buscar Cidade
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Digite o nome da cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {Object.entries(groupedCities).map(([region, cities]) => (
            <div key={region} className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                {region}
              </h3>
              <div className="space-y-1">
                {cities.map((city) => {
                  const displayName = city.state 
                    ? `${city.city} - ${city.state}` 
                    : city.city;
                  const isSelected = currentCity === city.city;
                  
                  return (
                    <button
                      key={`${city.city}-${city.state}`}
                      onClick={() => handleSelect(city.city)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 opacity-60" />
                        {highlightMatch(displayName, search)}
                      </span>
                      {isSelected && (
                        <span className="text-xs">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          
          {filteredCities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mb-2 opacity-50" />
              <p>Nenhuma cidade encontrada</p>
              <p className="text-xs mt-1">Tente buscar por outro termo</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
