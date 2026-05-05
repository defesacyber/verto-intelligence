import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraphSkeleton } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IDIBrazilMapProps {
  className?: string;
}

interface StateData {
  uf: string;
  avgScore: number;
  count: number;
  topCity: string;
  topScore: number;
}

// SVG paths for Brazil states (simplified)
const BRAZIL_STATES: Record<string, { path: string; cx: number; cy: number; name: string }> = {
  'AC': { path: 'M45,180 L70,175 L75,190 L55,200 L40,195 Z', cx: 55, cy: 188, name: 'Acre' },
  'AM': { path: 'M60,110 L150,100 L160,150 L120,180 L70,175 L45,180 L50,140 Z', cx: 105, cy: 140, name: 'Amazonas' },
  'RR': { path: 'M100,50 L140,45 L150,80 L130,100 L90,95 Z', cx: 120, cy: 75, name: 'Roraima' },
  'AP': { path: 'M180,50 L210,45 L220,80 L200,100 L170,90 Z', cx: 195, cy: 72, name: 'Amapá' },
  'PA': { path: 'M150,80 L230,70 L260,120 L250,170 L190,180 L160,150 L130,100 Z', cx: 195, cy: 125, name: 'Pará' },
  'MA': { path: 'M260,120 L310,115 L320,160 L280,180 L250,170 Z', cx: 285, cy: 145, name: 'Maranhão' },
  'TO': { path: 'M250,170 L280,180 L290,250 L260,270 L230,240 L220,190 Z', cx: 255, cy: 220, name: 'Tocantins' },
  'PI': { path: 'M310,115 L350,120 L360,180 L320,200 L280,180 L320,160 Z', cx: 325, cy: 155, name: 'Piauí' },
  'CE': { path: 'M350,120 L400,115 L410,155 L380,175 L360,180 Z', cx: 380, cy: 145, name: 'Ceará' },
  'RN': { path: 'M400,115 L430,120 L435,150 L410,155 Z', cx: 420, cy: 135, name: 'Rio Grande do Norte' },
  'PB': { path: 'M410,155 L435,150 L440,175 L410,180 Z', cx: 425, cy: 165, name: 'Paraíba' },
  'PE': { path: 'M380,175 L440,175 L445,200 L370,210 Z', cx: 410, cy: 192, name: 'Pernambuco' },
  'AL': { path: 'M420,200 L445,200 L450,225 L425,230 Z', cx: 438, cy: 215, name: 'Alagoas' },
  'SE': { path: 'M410,230 L435,225 L440,250 L415,255 Z', cx: 425, cy: 240, name: 'Sergipe' },
  'BA': { path: 'M320,200 L410,210 L420,290 L350,340 L280,310 L260,270 L290,250 Z', cx: 345, cy: 270, name: 'Bahia' },
  'MT': { path: 'M150,200 L220,190 L230,240 L260,270 L250,340 L180,350 L140,300 L130,230 Z', cx: 190, cy: 270, name: 'Mato Grosso' },
  'GO': { path: 'M260,270 L280,310 L320,330 L310,380 L260,390 L230,350 L250,340 Z', cx: 275, cy: 345, name: 'Goiás' },
  'DF': { path: 'M295,340 L315,335 L320,355 L300,360 Z', cx: 308, cy: 348, name: 'Distrito Federal' },
  'MS': { path: 'M180,350 L250,340 L260,390 L230,440 L180,450 L150,400 Z', cx: 205, cy: 395, name: 'Mato Grosso do Sul' },
  'MG': { path: 'M280,310 L350,340 L380,400 L340,450 L280,440 L260,390 L310,380 Z', cx: 315, cy: 395, name: 'Minas Gerais' },
  'ES': { path: 'M380,370 L410,365 L420,410 L390,420 Z', cx: 400, cy: 392, name: 'Espírito Santo' },
  'RJ': { path: 'M370,420 L410,410 L425,445 L380,455 Z', cx: 395, cy: 432, name: 'Rio de Janeiro' },
  'SP': { path: 'M260,390 L280,440 L340,450 L350,490 L280,510 L230,490 L230,440 Z', cx: 290, cy: 465, name: 'São Paulo' },
  'PR': { path: 'M230,490 L280,510 L290,550 L230,560 L190,530 Z', cx: 245, cy: 528, name: 'Paraná' },
  'SC': { path: 'M230,560 L290,550 L300,590 L250,600 L220,580 Z', cx: 260, cy: 575, name: 'Santa Catarina' },
  'RS': { path: 'M220,580 L250,600 L260,660 L190,670 L160,630 L180,590 Z', cx: 215, cy: 625, name: 'Rio Grande do Sul' },
  'RO': { path: 'M75,190 L120,180 L130,230 L110,260 L70,250 L55,220 Z', cx: 95, cy: 220, name: 'Rondônia' },
};

function getScoreColor(score: number | null): string {
  if (score === null) return 'hsl(var(--muted))';
  if (score >= 80) return 'hsl(142 76% 36%)'; // emerald-600
  if (score >= 75) return 'hsl(142 71% 45%)'; // emerald-500
  if (score >= 70) return 'hsl(217 91% 60%)'; // blue-500
  if (score >= 65) return 'hsl(38 92% 50%)'; // amber-500
  if (score >= 60) return 'hsl(25 95% 53%)'; // orange-500
  return 'hsl(0 84% 60%)'; // red-500
}

function getScoreLabel(score: number | null): string {
  if (score === null) return 'Sem dados';
  if (score >= 80) return 'Excelente';
  if (score >= 75) return 'Muito Bom';
  if (score >= 70) return 'Bom';
  if (score >= 65) return 'Regular';
  if (score >= 60) return 'Baixo';
  return 'Crítico';
}

export function IDIBrazilMap({ className }: IDIBrazilMapProps) {
  const [statesData, setStatesData] = useState<Map<string, StateData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      const { data } = await supabase
        .from('idi_score_cache')
        .select('cidade, uf, score_idi')
        .order('score_idi', { ascending: false });

      if (data) {
        const stateMap = new Map<string, StateData>();
        
        data.forEach(item => {
          const existing = stateMap.get(item.uf);
          if (existing) {
            existing.avgScore = (existing.avgScore * existing.count + (item.score_idi || 0)) / (existing.count + 1);
            existing.count++;
          } else {
            stateMap.set(item.uf, {
              uf: item.uf,
              avgScore: item.score_idi || 0,
              count: 1,
              topCity: item.cidade,
              topScore: item.score_idi || 0,
            });
          }
        });
        
        setStatesData(stateMap);
      }
      
      setIsLoading(false);
    }

    fetchData();
  }, []);

  const sortedStates = useMemo(() => {
    return Array.from(statesData.values()).sort((a, b) => b.avgScore - a.avgScore);
  }, [statesData]);

  const selectedStateData = selectedState ? statesData.get(selectedState) : null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Mapa IDI por Estado</CardTitle>
        </div>
        <CardDescription>Score médio do IDI por unidade federativa</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <GraphSkeleton height={400} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Mapa SVG */}
            <div className="lg:col-span-2">
              <TooltipProvider>
                <svg 
                  viewBox="0 0 480 700" 
                  className="w-full h-auto max-h-[400px]"
                >
                  {Object.entries(BRAZIL_STATES).map(([uf, state]) => {
                    const data = statesData.get(uf);
                    const fillColor = getScoreColor(data?.avgScore ?? null);
                    const isSelected = selectedState === uf;
                    
                    return (
                      <Tooltip key={uf}>
                        <TooltipTrigger asChild>
                          <g 
                            className="cursor-pointer transition-all duration-200"
                            onClick={() => setSelectedState(isSelected ? null : uf)}
                          >
                            <path
                              d={state.path}
                              fill={fillColor}
                              stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                              strokeWidth={isSelected ? 3 : 1}
                              className="hover:opacity-80 transition-opacity"
                            />
                            <text
                              x={state.cx}
                              y={state.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-white text-[10px] font-bold pointer-events-none"
                              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                            >
                              {uf}
                            </text>
                          </g>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p className="font-bold">{state.name} ({uf})</p>
                            {data ? (
                              <>
                                <p>IDI Médio: <span className="font-semibold">{data.avgScore.toFixed(1)}</span></p>
                                <p className="text-xs text-muted-foreground">{data.count} cidades</p>
                                <p className="text-xs">Top: {data.topCity} ({data.topScore.toFixed(1)})</p>
                              </>
                            ) : (
                              <p className="text-muted-foreground">Sem dados disponíveis</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </svg>
              </TooltipProvider>
              
              {/* Legenda */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(142 76% 36%)' }} />
                  <span>≥80</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(142 71% 45%)' }} />
                  <span>75-79</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(217 91% 60%)' }} />
                  <span>70-74</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(38 92% 50%)' }} />
                  <span>65-69</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(25 95% 53%)' }} />
                  <span>60-64</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(0 84% 60%)' }} />
                  <span>&lt;60</span>
                </div>
              </div>
            </div>
            
            {/* Ranking lateral */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold mb-3">Ranking por Estado</h4>
              <div className="max-h-[350px] overflow-y-auto space-y-1 pr-2">
                {sortedStates.map((state, index) => (
                  <div 
                    key={state.uf}
                    className={`flex items-center justify-between p-2 rounded-lg text-sm cursor-pointer transition-colors ${
                      selectedState === state.uf 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedState(selectedState === state.uf ? null : state.uf)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">{index + 1}º</span>
                      <span className="font-medium">{state.uf}</span>
                      <span className="text-xs text-muted-foreground">({state.count})</span>
                    </div>
                    <Badge 
                      variant="outline"
                      className="font-bold"
                      style={{ 
                        backgroundColor: `${getScoreColor(state.avgScore)}20`,
                        borderColor: getScoreColor(state.avgScore),
                        color: getScoreColor(state.avgScore)
                      }}
                    >
                      {state.avgScore.toFixed(1)}
                    </Badge>
                  </div>
                ))}
              </div>
              
              {/* Detalhes do estado selecionado */}
              {selectedStateData && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                  <h5 className="font-semibold text-sm mb-2">
                    {BRAZIL_STATES[selectedState!]?.name || selectedState}
                  </h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IDI Médio:</span>
                      <span className="font-bold">{selectedStateData.avgScore.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Classificação:</span>
                      <span>{getScoreLabel(selectedStateData.avgScore)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cidades:</span>
                      <span>{selectedStateData.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Melhor cidade:</span>
                      <span>{selectedStateData.topCity}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
