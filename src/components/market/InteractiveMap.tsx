import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraphSkeleton } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Map, Eye, EyeOff, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BRAZIL_CITY_COORDINATES } from '@/lib/brazil-city-coordinates';

interface CityData {
  city: string;
  uf: string;
  avg_price_m2: number;
  price_variation_12m: number;
  demand_index: number;
}

interface InteractiveMapProps {
  cities: CityData[];
  onCitySelect?: (cityKey: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function InteractiveMap({ cities, onCitySelect }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showToken, setShowToken] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-51.9253, -14.2350], // Center of Brazil
        zoom: 3.5,
        pitch: 20,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      map.current.on('load', () => {
        setIsMapLoaded(true);
        setError(null);
        addMarkers();
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setError('Erro ao carregar o mapa. Verifique o token.');
      });
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError('Token inválido ou erro ao inicializar o mapa');
    }
  };

  const addMarkers = useCallback(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    cities.forEach((city) => {
      const cityKey = `${city.city}-${city.uf}`;
      const coords = BRAZIL_CITY_COORDINATES[cityKey];
      
      if (!coords) return;

      // Create marker element
      const el = document.createElement('div');
      el.className = 'city-marker';
      
      // Color based on price variation
      const color = city.price_variation_12m > 0 ? '#22c55e' : '#ef4444';
      const size = Math.max(20, Math.min(40, city.demand_index / 2));
      
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      `;
      
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="padding: 8px; min-width: 150px;">
            <h3 style="font-weight: bold; margin-bottom: 8px;">${city.city} - ${city.uf}</h3>
            <p style="margin: 4px 0;"><strong>Preço/m²:</strong> ${formatCurrency(city.avg_price_m2)}</p>
            <p style="margin: 4px 0; color: ${city.price_variation_12m > 0 ? '#22c55e' : '#ef4444'}">
              <strong>Variação:</strong> ${city.price_variation_12m > 0 ? '+' : ''}${city.price_variation_12m.toFixed(1)}%
            </p>
            <p style="margin: 4px 0;"><strong>Demanda:</strong> ${city.demand_index}</p>
          </div>
        `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onCitySelect?.(cityKey);
      });

      markersRef.current.push(marker);
    });
  }, [cities, onCitySelect]);

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (isMapLoaded && cities.length > 0) {
      addMarkers();
    }
  }, [cities, isMapLoaded, addMarkers]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          Mapa Interativo do Mercado
        </CardTitle>
        <CardDescription>
          Visualização geográfica dos indicadores por cidade
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isMapLoaded && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Para visualizar o mapa, insira seu token público do Mapbox.
                Obtenha em <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showToken ? 'text' : 'password'}
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  placeholder="pk.eyJ1IjoieW91..."
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={initializeMap} disabled={!mapboxToken}>
                Carregar Mapa
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <GraphSkeleton height={360} />
          </div>
        )}

        <div 
          ref={mapContainer} 
          className={`rounded-lg overflow-hidden ${isMapLoaded ? 'h-[500px]' : 'h-0'}`}
        />

        {isMapLoaded && (
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow" />
              <span className="text-sm text-muted-foreground">Variação positiva</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" />
              <span className="text-sm text-muted-foreground">Variação negativa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tamanho = Índice de Demanda</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
