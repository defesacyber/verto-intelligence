import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitCompare, TrendingUp, DollarSign, Activity, Droplets, Building2, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IDICityComparisonProps {
  className?: string;
}

interface CityScore {
  cidade: string;
  uf: string;
  score_idi: number | null;
  score_variacao: number | null;
  score_preco: number | null;
  score_demanda: number | null;
  score_liquidez: number | null;
  score_macro: number | null;
  ranking_nacional: number | null;
  preco_m2?: number | null;
}

interface CityOption {
  key: string;
  cidade: string;
  uf: string;
  score_idi: number | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 75) return 'text-emerald-500';
  if (score >= 65) return 'text-blue-500';
  if (score >= 55) return 'text-amber-500';
  return 'text-red-500';
}

function getProgressColor(score: number): string {
  if (score >= 85) return 'bg-emerald-600';
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 65) return 'bg-blue-500';
  if (score >= 55) return 'bg-amber-500';
  return 'bg-red-500';
}

function ScoreBar({ label, icon: Icon, score1, score2 }: { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  score1: number | null; 
  score2: number | null;
}) {
  const s1 = score1 ?? 0;
  const s2 = score2 ?? 0;
  const diff = s1 - s2;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-[1fr,60px,1fr] gap-2 items-center">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${getProgressColor(s1)}`}
              style={{ width: `${s1}%`, float: 'right' }}
            />
          </div>
          <span className={`text-sm font-bold w-10 text-right ${getScoreColor(s1)}`}>
            {s1?.toFixed(0) || '-'}
          </span>
        </div>
        <div className="text-center">
          {Math.abs(diff) >= 1 && (
            <Badge 
              variant="outline" 
              className={`text-xs ${diff > 0 ? 'text-emerald-600 border-emerald-600/30' : 'text-red-500 border-red-500/30'}`}
            >
              {diff > 0 ? '+' : ''}{diff.toFixed(0)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold w-10 ${getScoreColor(s2)}`}>
            {s2?.toFixed(0) || '-'}
          </span>
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${getProgressColor(s2)}`}
              style={{ width: `${s2}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function IDICityComparison({ className }: IDICityComparisonProps) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [city1Key, setCity1Key] = useState<string>('');
  const [city2Key, setCity2Key] = useState<string>('');
  const [city1Data, setCity1Data] = useState<CityScore | null>(null);
  const [city2Data, setCity2Data] = useState<CityScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar lista de cidades
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
        
        setCities(uniqueCities);
        
        // Selecionar as duas primeiras por padrão
        if (uniqueCities.length >= 2) {
          setCity1Key(uniqueCities[0].key);
          setCity2Key(uniqueCities[1].key);
        }
      }
      setIsLoading(false);
    }

    fetchCities();
  }, []);

  // Carregar dados da cidade 1
  useEffect(() => {
    async function fetchCity1() {
      if (!city1Key) {
        setCity1Data(null);
        return;
      }
      
      const [cidade, uf] = city1Key.split('|');
      
      const { data: scoreData } = await supabase
        .from('idi_score_cache')
        .select('*')
        .eq('cidade', cidade)
        .eq('uf', uf)
        .order('mes', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: priceData } = await supabase
        .from('idi_fipezap_historico')
        .select('preco_m2_venda')
        .eq('cidade', cidade)
        .eq('uf', uf)
        .order('mes', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scoreData) {
        setCity1Data({
          ...scoreData,
          preco_m2: priceData?.preco_m2_venda || null,
        });
      }
    }

    fetchCity1();
  }, [city1Key]);

  // Carregar dados da cidade 2
  useEffect(() => {
    async function fetchCity2() {
      if (!city2Key) {
        setCity2Data(null);
        return;
      }
      
      const [cidade, uf] = city2Key.split('|');
      
      const { data: scoreData } = await supabase
        .from('idi_score_cache')
        .select('*')
        .eq('cidade', cidade)
        .eq('uf', uf)
        .order('mes', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: priceData } = await supabase
        .from('idi_fipezap_historico')
        .select('preco_m2_venda')
        .eq('cidade', cidade)
        .eq('uf', uf)
        .order('mes', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scoreData) {
        setCity2Data({
          ...scoreData,
          preco_m2: priceData?.preco_m2_venda || null,
        });
      }
    }

    fetchCity2();
  }, [city2Key]);

  const winner = city1Data && city2Data 
    ? (city1Data.score_idi || 0) > (city2Data.score_idi || 0) ? 1 : 2
    : null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Comparador IDI</CardTitle>
        </div>
        <CardDescription>Compare o índice de desenvolvimento imobiliário entre duas cidades</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Seletores */}
            <div className="grid grid-cols-[1fr,60px,1fr] gap-2 items-center">
              <Select value={city1Key} onValueChange={setCity1Key}>
                <SelectTrigger className={winner === 1 ? 'border-emerald-500 ring-1 ring-emerald-500/30' : ''}>
                  <SelectValue placeholder="Cidade 1" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {cities
                    .filter(c => c.key !== city2Key)
                    .map(city => (
                      <SelectItem key={city.key} value={city.key}>
                        {city.cidade} - {city.uf}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <div className="text-center text-muted-foreground font-bold">VS</div>
              
              <Select value={city2Key} onValueChange={setCity2Key}>
                <SelectTrigger className={winner === 2 ? 'border-emerald-500 ring-1 ring-emerald-500/30' : ''}>
                  <SelectValue placeholder="Cidade 2" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {cities
                    .filter(c => c.key !== city1Key)
                    .map(city => (
                      <SelectItem key={city.key} value={city.key}>
                        {city.cidade} - {city.uf}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scores principais */}
            {city1Data && city2Data && (
              <>
                <div className="grid grid-cols-[1fr,60px,1fr] gap-2 items-center py-4 border-y">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(city1Data.score_idi || 0)}`}>
                      {city1Data.score_idi?.toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      #{city1Data.ranking_nacional || '-'} Nacional
                    </p>
                    {city1Data.preco_m2 && (
                      <div className="flex items-center justify-center gap-1 mt-1 text-sm">
                        <DollarSign className="h-3 w-3" />
                        <span>{formatCurrency(city1Data.preco_m2)}/m²</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">IDI</span>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(city2Data.score_idi || 0)}`}>
                      {city2Data.score_idi?.toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      #{city2Data.ranking_nacional || '-'} Nacional
                    </p>
                    {city2Data.preco_m2 && (
                      <div className="flex items-center justify-center gap-1 mt-1 text-sm">
                        <DollarSign className="h-3 w-3" />
                        <span>{formatCurrency(city2Data.preco_m2)}/m²</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comparação detalhada */}
                <div className="space-y-4">
                  <ScoreBar 
                    label="Variação de Preços"
                    icon={TrendingUp}
                    score1={city1Data.score_variacao}
                    score2={city2Data.score_variacao}
                  />
                  <ScoreBar 
                    label="Nível de Preço"
                    icon={DollarSign}
                    score1={city1Data.score_preco}
                    score2={city2Data.score_preco}
                  />
                  <ScoreBar 
                    label="Demanda"
                    icon={Activity}
                    score1={city1Data.score_demanda}
                    score2={city2Data.score_demanda}
                  />
                  <ScoreBar 
                    label="Liquidez"
                    icon={Droplets}
                    score1={city1Data.score_liquidez}
                    score2={city2Data.score_liquidez}
                  />
                  <ScoreBar 
                    label="Cenário Macro"
                    icon={Building2}
                    score1={city1Data.score_macro}
                    score2={city2Data.score_macro}
                  />
                </div>

                {/* Veredito e Export */}
                <div className="p-4 bg-muted/30 rounded-lg border">
                  {winner && (
                    <div className="text-center mb-3">
                      <p className="text-sm text-muted-foreground mb-1">Melhor opção de investimento:</p>
                      <p className="font-bold text-lg text-primary">
                        {winner === 1 ? city1Data.cidade : city2Data.cidade} - {winner === 1 ? city1Data.uf : city2Data.uf}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.abs((city1Data.score_idi || 0) - (city2Data.score_idi || 0)).toFixed(1)} pontos de diferença
                      </p>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={async () => {
                      const { generateIDIComparisonPdf } = await import('@/lib/idi-comparison-pdf');
                      generateIDIComparisonPdf({ city1: city1Data, city2: city2Data });
                      toast.success('PDF exportado com sucesso!');
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Comparativo PDF
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
