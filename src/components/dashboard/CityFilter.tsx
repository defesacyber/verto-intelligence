import { useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CitySearchModal } from './CitySearchModal';

const QUICK_CITIES = [
  { value: 'Brasil (Nacional)', label: 'Brasil (Nacional)' },
  { value: 'São Paulo', label: 'São Paulo' },
  { value: 'Rio de Janeiro', label: 'Rio de Janeiro' },
  { value: 'Belo Horizonte', label: 'Belo Horizonte' },
  { value: 'Brasília', label: 'Brasília' },
  { value: 'Goiânia', label: 'Goiânia' },
  { value: 'Curitiba', label: 'Curitiba' },
  { value: 'Porto Alegre', label: 'Porto Alegre' },
];

interface CityFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function CityFilter({ value, onChange }: CityFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const handleSelect = (cityValue: string) => {
    onChange(cityValue);
    setOpen(false);
  };

  const handleSearchClick = () => {
    setOpen(false);
    setSearchModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          Notícias da Cidade:
        </span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center justify-between gap-2 min-w-[200px] px-4 py-2.5",
                "bg-card border border-border rounded-lg shadow-sm",
                "text-sm font-medium text-foreground",
                "hover:border-primary/50 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary/20"
              )}
            >
              <span>{value}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[220px] p-0 bg-card border border-border shadow-lg z-50" 
            align="start"
            sideOffset={4}
          >
            <div className="py-1">
              {QUICK_CITIES.map((city) => (
                <button
                  key={city.value}
                  onClick={() => handleSelect(city.value)}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-2.5 text-sm",
                    "transition-colors",
                    value === city.value
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span>{city.label}</span>
                  {value === city.value && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
              {/* Search option */}
              <div className="border-t border-border mt-1 pt-1">
                <button
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  onClick={handleSearchClick}
                >
                  <Search className="h-4 w-4" />
                  <span>Buscar outra cidade...</span>
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <CitySearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onSelect={onChange}
        currentCity={value}
      />
    </>
  );
}
