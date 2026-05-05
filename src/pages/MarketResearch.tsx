import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  MapPin, 
  TrendingUp, 
  Building2, 
  DollarSign,
  BarChart3,
  Target,
  Users,
  Home,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Percent,
  GitCompare,
  Bell,
  Map,
  Star
} from 'lucide-react';
import { useState, useCallback, lazy, Suspense } from 'react';
import { GraphSkeleton } from '@/components/ui/chart';
import { useMarketData } from '@/hooks/useMarketData';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
const HistoricalPriceChart = lazy(() => import('@/components/market/HistoricalPriceChart').then(module => ({ default: module.HistoricalPriceChart })));
const CityComparisonTable = lazy(() => import('@/components/market/CityComparisonTable').then(module => ({ default: module.CityComparisonTable })));
const CitySelectionList = lazy(() => import('@/components/market/CitySelectionList').then(module => ({ default: module.CitySelectionList })));
const PriceAlerts = lazy(() => import('@/components/market/PriceAlerts').then(module => ({ default: module.PriceAlerts })));
const InteractiveMap = lazy(() => import('@/components/market/InteractiveMap').then(module => ({ default: module.InteractiveMap })));
const IDIRankingCard = lazy(() => import('@/components/market/IDIRankingCard').then(module => ({ default: module.IDIRankingCard })));
const IDIEvolutionChart = lazy(() => import('@/components/market/IDIEvolutionChart').then(module => ({ default: module.IDIEvolutionChart })));
const IDIBrazilMap = lazy(() => import('@/components/market/IDIBrazilMap').then(module => ({ default: module.IDIBrazilMap })));
const IDICityComparison = lazy(() => import('@/components/market/IDICityComparison').then(module => ({ default: module.IDICityComparison })));
const IDIAlerts = lazy(() => import('@/components/market/IDIAlerts').then(module => ({ default: module.IDIAlerts })));
const MacroDashboardCard = lazy(() => import('@/components/dashboard/MacroDashboardCard').then(module => ({ default: module.MacroDashboardCard })));

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function MarketResearch() {
  const {
    states,
    cities,
    allCitiesData,
    selectedCityData,
    macroIndicators,
    apiStatus,
    isLoading,
    isLoadingCities,
    loadCities,
    loadAllCitiesData,
    searchCityData,
    setSelectedCityData,
  } = useMarketData();

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCitiesForComparison, setSelectedCitiesForComparison] = useState<string[]>([]);

  const handleToggleCity = useCallback((cityKey: string) => {
    setSelectedCitiesForComparison(prev => 
      prev.includes(cityKey) 
        ? prev.filter(c => c !== cityKey)
        : [...prev, cityKey]
    );
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedCitiesForComparison([]);
  }, []);

  const handleStateChange = (uf: string) => {
    setSelectedState(uf);
    setSelectedCity('');
    loadCities(uf);
  };

  const handleSearch = async () => {
    if (selectedCity && selectedState) {
      await searchCityData(selectedCity, selectedState);
    }
  };

  const filteredData = allCitiesData.filter(
    (item) =>
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.uf.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calcular médias dos dados
  const avgPriceM2 = allCitiesData.length > 0 
    ? Math.round(allCitiesData.reduce((sum, d) => sum + d.avg_price_m2, 0) / allCitiesData.length)
    : 0;
  const avgDemand = allCitiesData.length > 0
    ? Math.round(allCitiesData.reduce((sum, d) => sum + d.demand_index, 0) / allCitiesData.length)
    : 0;
  const totalSupply = allCitiesData.reduce((sum, d) => sum + d.supply_units, 0);
  const avgAbsorption = allCitiesData.length > 0
    ? (allCitiesData.reduce((sum, d) => sum + d.absorption_rate, 0) / allCitiesData.length).toFixed(1)
    : '0';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pesquisa de Mercado</h1>
            <p className="text-muted-foreground">
              Análise de dados do mercado imobiliário por região
            </p>
          </div>
          <Button onClick={loadAllCitiesData} disabled={isLoading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar dados
          </Button>
        </div>

        {/* Macro Indicators */}
        {macroIndicators && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Indicadores Macroeconômicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa SELIC</span>
                  <Badge variant="secondary">{macroIndicators.selic_rate}% a.a.</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">IPCA 12 meses</span>
                  <Badge variant="secondary">{macroIndicators.ipca_12m}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Crescimento PIB</span>
                  <Badge variant="secondary">{macroIndicators.pib_growth}%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Select value={selectedState} onValueChange={handleStateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-popover border border-border">
                  {states.length > 0 ? (
                    states.map((state) => (
                      <SelectItem key={state.sigla} value={state.sigla}>
                        {state.nome} ({state.sigla})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="py-2 px-3 text-sm text-muted-foreground">
                      Carregando estados...
                    </div>
                  )}
                </SelectContent>
              </Select>

              <Select 
                value={selectedCity} 
                onValueChange={setSelectedCity}
                disabled={!selectedState || isLoadingCities}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCities ? "Carregando..." : "Selecione a cidade"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.nome}>
                      {city.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button onClick={handleSearch} disabled={!selectedCity || isLoading}>
                <Search className="mr-2 h-4 w-4" />
                Pesquisar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Market Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Preço Médio/m²</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(avgPriceM2)}</div>
                  <p className="text-xs text-muted-foreground">
                    média das cidades principais
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Índice de Demanda</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{avgDemand}</div>
                  <p className="text-xs text-muted-foreground">média nacional</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unidades em Oferta</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalSupply.toLocaleString('pt-BR')}</div>
                  <p className="text-xs text-muted-foreground">cidades principais</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Absorção</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{avgAbsorption}%</div>
                  <p className="text-xs text-muted-foreground">média mensal</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="ranking">
              <Star className="h-4 w-4 mr-1" />
              Ranking IDI
            </TabsTrigger>
            <TabsTrigger value="historical">
              <TrendingUp className="h-4 w-4 mr-1" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="compare">
              <GitCompare className="h-4 w-4 mr-1" />
              Comparar ({selectedCitiesForComparison.length})
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-1" />
              Alertas
            </TabsTrigger>
            <TabsTrigger value="map">
              <Map className="h-4 w-4 mr-1" />
              Mapa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* City Cards */}
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {filteredData.map((city) => (
                  <Card 
                    key={`${city.city}-${city.uf}`}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedCityData?.city === city.city && selectedCityData?.uf === city.uf 
                        ? 'ring-2 ring-primary' 
                        : ''
                    }`}
                    onClick={() => setSelectedCityData(city)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <CardTitle className="text-lg">{city.city}</CardTitle>
                        </div>
                        <Badge variant="secondary">{city.uf}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Preço/m²</span>
                        <span className="font-semibold">{formatCurrency(city.avg_price_m2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Variação 12m</span>
                        <div className="flex items-center gap-1">
                          {city.price_variation_12m > 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                          <span className={city.price_variation_12m > 0 ? 'text-green-500' : 'text-red-500'}>
                            {city.price_variation_12m > 0 ? '+' : ''}{city.price_variation_12m.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Demanda</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${city.demand_index}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{city.demand_index}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Absorção</span>
                        <span className="font-medium">{city.absorption_rate.toFixed(1)}%/mês</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ranking" className="space-y-4">
            {/* Primeira linha: Ranking + Comparador */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Suspense fallback={<GraphSkeleton height={320} />}>
                <IDIRankingCard limit={15} />
              </Suspense>
              <Suspense fallback={<GraphSkeleton height={320} />}>
                <IDICityComparison />
              </Suspense>
            </div>
            
            {/* Segunda linha: Gráfico de evolução + Alertas */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Suspense fallback={<GraphSkeleton height={280} />}>
                <IDIEvolutionChart />
              </Suspense>
              <Suspense fallback={<GraphSkeleton height={220} />}>
                <IDIAlerts />
              </Suspense>
            </div>
            
            {/* Terceira linha: Mapa + Macro */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Suspense fallback={<GraphSkeleton height={360} />}>
                <IDIBrazilMap />
              </Suspense>
              <Suspense fallback={<GraphSkeleton height={260} />}>
                <MacroDashboardCard />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="historical" className="space-y-4">
            <Suspense fallback={<GraphSkeleton height={320} />}>
              <HistoricalPriceChart 
                cities={allCitiesData} 
                selectedCities={selectedCitiesForComparison.length > 0 ? selectedCitiesForComparison : undefined}
              />
            </Suspense>
            <Suspense fallback={<GraphSkeleton height={220} />}>
              <CitySelectionList
                cities={allCitiesData}
                selectedCities={selectedCitiesForComparison}
                onToggleCity={handleToggleCity}
                searchQuery={searchQuery}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="compare" className="space-y-4">
            <Suspense fallback={<GraphSkeleton height={320} />}>
              <CityComparisonTable
                cities={allCitiesData}
                selectedCities={selectedCitiesForComparison}
                onToggleCity={handleToggleCity}
                onClearSelection={handleClearSelection}
              />
            </Suspense>
            <div className="grid gap-4 md:grid-cols-2">
              <Suspense fallback={<GraphSkeleton height={220} />}>
                <CitySelectionList
                  cities={allCitiesData}
                  selectedCities={selectedCitiesForComparison}
                  onToggleCity={handleToggleCity}
                  searchQuery={searchQuery}
                />
              </Suspense>
              {selectedCitiesForComparison.length > 0 && (
                <Suspense fallback={<GraphSkeleton height={320} />}>
                  <HistoricalPriceChart 
                    cities={allCitiesData} 
                    selectedCities={selectedCitiesForComparison}
                  />
                </Suspense>
              )}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Suspense fallback={<GraphSkeleton height={220} />}>
              <PriceAlerts cities={allCitiesData} />
            </Suspense>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <Suspense fallback={<GraphSkeleton height={360} />}>
              <InteractiveMap 
                cities={allCitiesData} 
                onCitySelect={handleToggleCity}
              />
            </Suspense>
          </TabsContent>
        </Tabs>

        {/* Detailed Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Análise Detalhada
            </CardTitle>
            <CardDescription>
              Selecione uma cidade acima para ver análise detalhada
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCityData ? (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Dados do Mercado
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm">Preço médio/m²</span>
                      <span className="font-semibold">{formatCurrency(selectedCityData.avg_price_m2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm">Variação 12 meses</span>
                      <Badge variant={selectedCityData.price_variation_12m > 0 ? 'default' : 'destructive'}>
                        {selectedCityData.price_variation_12m > 0 ? '+' : ''}
                        {selectedCityData.price_variation_12m.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm">Unidades em oferta</span>
                      <span className="font-semibold">{selectedCityData.supply_units.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Indicadores de Demanda
                  </h4>
                  <div className="space-y-2">
                    <div className="p-3 rounded bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Índice de Demanda</span>
                        <span className="font-semibold">{selectedCityData.demand_index}/100</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
                          style={{ width: `${selectedCityData.demand_index}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm">Taxa de Absorção</span>
                      <span className="font-semibold">{selectedCityData.absorption_rate.toFixed(1)}% ao mês</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm">Tempo estimado de venda</span>
                      <span className="font-semibold">
                        {Math.round(100 / selectedCityData.absorption_rate)} meses
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Indicadores Econômicos
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm">Taxa SELIC</span>
                      <span className="font-semibold">{selectedCityData.selic_rate}% a.a.</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm">IPCA 12 meses</span>
                      <span className="font-semibold">{selectedCityData.ipca_12m}%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm">Crescimento PIB</span>
                      <span className="font-semibold">{selectedCityData.pib_growth}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MapPin className="h-12 w-12 mb-4 opacity-50" />
                <p>Clique em uma cidade para ver a análise detalhada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Status and Data Source */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Fontes de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiStatus && (
              <div className="grid gap-3 md:grid-cols-4">
                {apiStatus.availableSources.map((source) => (
                  <div 
                    key={source.name}
                    className={`p-3 rounded-lg border ${
                      source.status === 'active' 
                        ? 'border-green-500/30 bg-green-500/10' 
                        : 'border-muted bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{source.name}</span>
                      <Badge 
                        variant={source.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {source.status === 'active' ? 'Ativo' : 'Não configurado'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{source.description}</p>
                  </div>
                ))}
              </div>
            )}
            
            {apiStatus && !apiStatus.hasCommercialApi && (
              <Alert className="border-amber-500/30 bg-amber-500/10">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-700 dark:text-amber-400">
                  Ative dados comerciais para maior precisão
                </AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  <p className="mb-2">
                    Para obter dados de mercado mais precisos e atualizados, você pode integrar com APIs comerciais:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>DataZAP:</strong> Contato comercial em <a href="https://www.datazap.com.br/contato" target="_blank" rel="noopener noreferrer" className="text-primary underline">datazap.com.br</a></li>
                    <li><strong>FipeZAP:</strong> Índices de preços em <a href="https://fipezap.zapimoveis.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">fipezap.zapimoveis.com.br</a></li>
                  </ul>
                  <p className="mt-2 text-sm">
                    Após contratar, configure as chaves de API nas configurações do sistema.
                  </p>
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              Dados atuais: API IBGE (demográficos) + Estimativas baseadas em pesquisas de mercado.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
