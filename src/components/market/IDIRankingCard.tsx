import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp, TrendingDown, MapPin, Medal, Award, Star, DollarSign, Filter } from 'lucide-react';
import { useIDIRanking } from '@/hooks/useIDIPublicData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IDIRankingCardProps {
  limit?: number;
  uf?: string;
  className?: string;
}

interface CityWithPrice {
  cidade: string;
  uf: string;
  score_idi: number;
  score_idi_normalizado: number | null;
  score_variacao: number | null;
  score_demanda: number | null;
  score_liquidez: number | null;
  ranking_nacional: number | null;
  preco_m2?: number | null;
  mes: string;
}

// Mapeamento de estados por região
const REGIOES = {
  'Norte': ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'],
  'Nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'Centro-Oeste': ['DF', 'GO', 'MS', 'MT'],
  'Sudeste': ['ES', 'MG', 'RJ', 'SP'],
  'Sul': ['PR', 'RS', 'SC'],
} as const;

type Regiao = keyof typeof REGIOES;

function getRankIcon(position: number) {
  if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (position === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (position === 3) return <Award className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{position}</span>;
}

function getScoreColor(score: number) {
  if (score >= 85) return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40';
  if (score >= 75) return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
  if (score >= 65) return 'bg-blue-500/15 text-blue-600 border-blue-500/30';
  if (score >= 55) return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
  if (score >= 45) return 'bg-orange-500/15 text-orange-600 border-orange-500/30';
  return 'bg-red-500/15 text-red-600 border-red-500/30';
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function IDIRankingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function IDIRankingCard({ limit = 10, uf, className }: IDIRankingCardProps) {
  const [selectedRegiao, setSelectedRegiao] = useState<Regiao | 'all'>('all');
  const [selectedUF, setSelectedUF] = useState<string | 'all'>(uf || 'all');
  
  // Buscar mais dados para permitir filtragem
  const { data: ranking, isLoading, error } = useIDIRanking(500); 
  const [citiesWithPrices, setCitiesWithPrices] = useState<CityWithPrice[]>([]);

  // Buscar preços m² para as cidades do ranking
  useEffect(() => {
    async function fetchPrices() {
      if (!ranking || ranking.length === 0) return;

      const { data: pricesData } = await supabase
        .from('idi_fipezap_historico')
        .select('cidade, uf, preco_m2_venda')
        .order('mes', { ascending: false });

      const priceMap = new Map<string, number>();
      pricesData?.forEach((p) => {
        const key = `${p.cidade}-${p.uf}`;
        if (!priceMap.has(key) && p.preco_m2_venda) {
          priceMap.set(key, p.preco_m2_venda);
        }
      });

      const enriched = ranking.map((city) => ({
        ...city,
        preco_m2: priceMap.get(`${city.cidade}-${city.uf}`) || null,
      }));

      setCitiesWithPrices(enriched);
    }

    fetchPrices();
  }, [ranking]);

interface CityWithRank extends CityWithPrice {
  ranking_filtrado: number;
}

// ... inside component ...

  // Filtrar dados por região e UF
  const filteredData = useMemo<CityWithRank[]>(() => {
    const data = citiesWithPrices.length > 0 ? citiesWithPrices : ranking || [];
    
    let filtered = data;
    
    // Filtrar por região
    if (selectedRegiao !== 'all') {
      const ufsRegiao = REGIOES[selectedRegiao] as readonly string[];
      filtered = filtered.filter(city => ufsRegiao.includes(city.uf));
    }
    
    // Filtrar por UF específico
    if (selectedUF !== 'all') {
      filtered = filtered.filter(city => city.uf === selectedUF);
    }
    
    // Recalcular ranking dentro do filtro
    return filtered
      .sort((a, b) => (b.score_idi || 0) - (a.score_idi || 0))
      .slice(0, limit)
      .map((city, index) => ({
        ...city,
        ranking_filtrado: index + 1
      }));
  }, [citiesWithPrices, ranking, selectedRegiao, selectedUF, limit]);

  // Lista de UFs disponíveis baseada na região selecionada
  const availableUFs = useMemo(() => {
    if (selectedRegiao === 'all') {
      return Object.values(REGIOES).flat().sort();
    }
    return [...REGIOES[selectedRegiao]].sort();
  }, [selectedRegiao]);

  // Reset UF quando mudar região
  useEffect(() => {
    if (selectedRegiao !== 'all' && selectedUF !== 'all') {
      const ufsRegiao = REGIOES[selectedRegiao] as readonly string[];
      if (!ufsRegiao.includes(selectedUF)) {
        setSelectedUF('all');
      }
    }
  }, [selectedRegiao, selectedUF]);

  const getTitle = () => {
    if (selectedUF !== 'all') return `Top ${limit} - ${selectedUF}`;
    if (selectedRegiao !== 'all') return `Top ${limit} - ${selectedRegiao}`;
    return `Top ${limit} Nacional`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Ranking IDI Brasil</CardTitle>
          </div>
        </div>
        <CardDescription>
          Índice de Desenvolvimento Imobiliário - {getTitle()}
        </CardDescription>
        
        {/* Filtros */}
        <div className="flex items-center gap-2 mt-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedRegiao} onValueChange={(v) => setSelectedRegiao(v as Regiao | 'all')}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Região" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Regiões</SelectItem>
              {(Object.keys(REGIOES) as Regiao[]).map(regiao => (
                <SelectItem key={regiao} value={regiao}>{regiao}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedUF} onValueChange={setSelectedUF}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos UFs</SelectItem>
              {availableUFs.map(uf => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <IDIRankingSkeleton />
        ) : error || !filteredData?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {error ? 'Erro ao carregar ranking' : 'Nenhum dado disponível para esta região'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedRegiao !== 'all' || selectedUF !== 'all' 
                ? 'Tente selecionar outra região ou estado' 
                : 'Os scores IDI serão calculados após importação de dados'
              }
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-3">
            <div className="space-y-2">
              {filteredData.map((city) => (
                <div 
                  key={`${city.cidade}-${city.uf}-${city.mes}`}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-6">
                    {getRankIcon(city.ranking_filtrado)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{city.cidade}</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {city.uf}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {(city as CityWithPrice).preco_m2 && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCurrency((city as CityWithPrice).preco_m2!)}/m²</span>
                        </div>
                      )}
                      {city.score_variacao !== null && (
                        <div className="flex items-center gap-1">
                          {city.score_variacao > 70 ? (
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-amber-500" />
                          )}
                          <span>Var: {city.score_variacao?.toFixed(0)}</span>
                        </div>
                      )}
                      {city.score_demanda !== null && (
                        <span>Dem: {city.score_demanda?.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className={`font-bold min-w-[60px] justify-center ${getScoreColor(city.score_idi || 0)}`}
                  >
                    {city.score_idi?.toFixed(1) || '-'}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}