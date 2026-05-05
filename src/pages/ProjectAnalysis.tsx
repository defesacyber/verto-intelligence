import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useViabilityAnalysis } from '@/hooks/useViabilityAnalysis';
import { ViabilityKPICard } from '@/components/viability/ViabilityKPICard';
const CashFlowChart = lazy(() => import('@/components/viability/CashFlowChart').then(m => ({ default: m.CashFlowChart })));
import { MarketMetricsCard } from '@/components/viability/MarketMetricsCard';
import { MarketResearchWizard } from '@/components/market-research/MarketResearchWizard';
import { supabase } from '@/integrations/supabase/client';
import { GraphSkeleton } from '@/components/ui/chart';
import { useProjectCompetitors, useProjectSWOT } from '@/hooks/useProjectAnalysis';
import { downloadRelatorioViabilidade } from '@/lib/pdf/viability-report-pdf';
import type { SWOTData, Competitor } from '@/lib/pdf/viability-report-pdf';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Calculator,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Search,
  FileDown,
  Plus,
  Trash2,
  Shield,
  Zap,
  Eye,
  Swords
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisResult } from '@/lib/viability-types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

interface Project {
  id: string;
  name: string;
  city: string;
  uf: string;
  location: string;
  property_type: string;
  status: string;
  vgv: number;
  roi: number;
  margin: number;
  neighborhood?: string | null;
  bairro?: string | null;
  total_units?: number | null;
}

export default function ProjectAnalysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState('viability');
  const [, setMarketResearchData] = useState<unknown>(null);
  
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  const {
    isAnalyzing,
    analysisResult,
    projectInputs,
    fetchProjectInputs,
    fetchAnalysisResult,
    runAnalysis,
    getCashFlowProjection
  } = useViabilityAnalysis();

  const { competitors, addCompetitor, removeCompetitor } = useProjectCompetitors(id ?? null);
  const { swot, updateSWOT } = useProjectSWOT(id ?? null);

  const handleGeneratePDF = async () => {
    if (!project) return;
    setIsGeneratingPDF(true);
    try {
      const inputs = projectInputs as Record<string, unknown> | null;
      await downloadRelatorioViabilidade({
        input: {
          nome: project.name,
          cidade: project.city,
          estado: project.uf,
          tipoImovel: project.property_type ?? 'Residencial',
          publicoAlvo: (inputs?.target_audience as string) ?? 'Médio Padrão',
          unidades: (inputs?.units as number) ?? 1,
          areaPrivativa: (inputs?.private_area as number) ?? 100,
          precoVendaUnitario: (inputs?.sale_price as number) ?? (project.vgv ?? 0),
          custoTerrenoTotal: (inputs?.land_cost as number) ?? 0,
          custoConstrucaoPorM2: (inputs?.construction_cost_m2 as number) ?? 3500,
          prazoMeses: (inputs?.duration_months as number) ?? 36,
          cubEstadual: (inputs?.cub_value as number) ?? undefined,
          cdi: 10.5,
        },
        swot: swot ? {
          forcas: swot.forcas ?? [],
          fraquezas: swot.fraquezas ?? [],
          oportunidades: swot.oportunidades ?? [],
          ameacas: swot.ameacas ?? [],
        } : undefined,
        competitors: (competitors ?? []) as Competitor[],
      });
      toast({ title: 'Relatório gerado!', description: 'O PDF foi baixado com sucesso.' });
    } catch (err) {
      console.error('PDF error:', err);
      toast({ title: 'Erro ao gerar PDF', description: 'Verifique os inputs do projeto.', variant: 'destructive' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      setIsLoadingProject(true);
      
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (projectData) {
        setProject(projectData);
      }
      
      await Promise.all([
        fetchProjectInputs(id),
        fetchAnalysisResult(id)
      ]);
      
      setIsLoadingProject(false);
    };
    
    loadData();
  }, [id, fetchProjectInputs, fetchAnalysisResult]);

  const handleRunAnalysis = async () => {
    if (!project || !projectInputs) return;
    await runAnalysis(project, projectInputs);
  };

  const getStatusConfig = (status: AnalysisResult['viability_status']) => {
    switch (status) {
      case 'viavel':
        return { label: 'Viável', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' };
      case 'viavel_com_ressalvas':
        return { label: 'Viável com Ressalvas', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' };
      default:
        return { label: 'Inviável', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' };
    }
  };

  if (isLoadingProject) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Projeto não encontrado</p>
          <Button onClick={() => navigate('/projects')}>Voltar aos Projetos</Button>
        </div>
      </DashboardLayout>
    );
  }

  const cashFlowData = analysisResult ? getCashFlowProjection(analysisResult) : [];
  const statusConfig = analysisResult ? getStatusConfig(analysisResult.viability_status) : null;
  const StatusIcon = statusConfig?.icon || Activity;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">{project.city}, {project.uf} • {project.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {statusConfig && (
              <Badge className={cn(statusConfig.bg, statusConfig.color, 'border-0')}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF || !projectInputs}
              className="gap-2"
            >
              {isGeneratingPDF ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              {isGeneratingPDF ? 'Gerando...' : 'Relatório PDF'}
            </Button>
          </div>
        </div>

        {/* Main Tabs: Market Research vs Viability */}
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="market-research" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Pesquisa de Mercado
            </TabsTrigger>
            <TabsTrigger value="viability" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Viabilidade
            </TabsTrigger>
          </TabsList>

          {/* Market Research Tab */}
          <TabsContent value="market-research" className="mt-6">
            <MarketResearchWizard 
              project={project} 
              onComplete={(data) => setMarketResearchData(data)}
            />
          </TabsContent>

          {/* Viability Tab */}
          <TabsContent value="viability" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button 
                onClick={handleRunAnalysis} 
                disabled={isAnalyzing || !projectInputs}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    {analysisResult ? 'Reanalisar' : 'Analisar Viabilidade'}
                  </>
                )}
              </Button>
            </div>

        {!analysisResult && !projectInputs && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma análise disponível</h3>
              <p className="text-muted-foreground mb-4">
                Configure os inputs do projeto e execute a análise de viabilidade
              </p>
              <Button onClick={() => navigate(`/projects/${id}/inputs`)}>
                Configurar Inputs
              </Button>
            </CardContent>
          </Card>
        )}

        {analysisResult && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ViabilityKPICard
                title="VPL"
                value={formatCurrency(analysisResult.vpl)}
                subtitle="Valor Presente Líquido"
                icon={DollarSign}
                trend={analysisResult.vpl > 0 ? 'up' : 'down'}
                trendValue={analysisResult.vpl > 0 ? 'Positivo' : 'Negativo'}
                variant={analysisResult.vpl > 0 ? 'success' : 'destructive'}
              />
              <ViabilityKPICard
                title="TIR"
                value={formatPercent(analysisResult.tir)}
                subtitle="Taxa Interna de Retorno"
                icon={Percent}
                trend={analysisResult.tir > 15 ? 'up' : analysisResult.tir > 10 ? 'neutral' : 'down'}
                trendValue={`Meta: 15%`}
                variant={analysisResult.tir > 15 ? 'success' : analysisResult.tir > 10 ? 'warning' : 'destructive'}
              />
              <ViabilityKPICard
                title="Payback"
                value={`${analysisResult.payback_months} meses`}
                subtitle="Tempo de retorno"
                icon={Calendar}
                trend={analysisResult.payback_months < 24 ? 'up' : analysisResult.payback_months < 36 ? 'neutral' : 'down'}
                trendValue={analysisResult.payback_months < 24 ? 'Excelente' : 'Moderado'}
                variant={analysisResult.payback_months < 24 ? 'success' : 'warning'}
              />
              <ViabilityKPICard
                title="Margem"
                value={formatPercent(analysisResult.profit_margin)}
                subtitle="Margem de lucro"
                icon={Target}
                trend={analysisResult.profit_margin > 20 ? 'up' : analysisResult.profit_margin > 15 ? 'neutral' : 'down'}
                trendValue={`Lucro: ${formatCurrency(analysisResult.net_profit)}`}
                variant={analysisResult.profit_margin > 20 ? 'success' : 'warning'}
              />
            </div>

            {/* Tabs for different views */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Resumo
                </TabsTrigger>
                <TabsTrigger value="cashflow" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Fluxo de Caixa
                </TabsTrigger>
                <TabsTrigger value="scenarios" className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Cenários
                </TabsTrigger>
                <TabsTrigger value="market" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Mercado
                </TabsTrigger>
                <TabsTrigger value="strategy" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Estratégia
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Investment Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Investimento Total</span>
                        <span className="font-bold text-lg">{formatCurrency(analysisResult.total_investment)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Receita Bruta</span>
                        <span className="font-bold text-lg text-secondary">{formatCurrency(analysisResult.gross_revenue)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Lucro Líquido</span>
                        <span className={cn("font-bold text-lg", analysisResult.net_profit > 0 ? "text-success" : "text-destructive")}>
                          {formatCurrency(analysisResult.net_profit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Score de Risco</span>
                        <Badge className={cn(
                          analysisResult.risk_level === 'baixo' ? 'bg-success/10 text-success' :
                          analysisResult.risk_level === 'medio' ? 'bg-warning/10 text-warning' :
                          'bg-destructive/10 text-destructive',
                          'border-0'
                        )}>
                          {analysisResult.risk_level === 'baixo' ? 'Baixo' : analysisResult.risk_level === 'medio' ? 'Médio' : 'Alto'} ({(analysisResult.risk_score * 100).toFixed(0)}%)
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-secondary" />
                        Recomendações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysisResult.recommendations && analysisResult.recommendations.length > 0 ? (
                        <ul className="space-y-3">
                          {analysisResult.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-secondary mt-1">•</span>
                              <span className="text-muted-foreground">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">Sem recomendações disponíveis</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Risk Factors */}
                {analysisResult.risk_factors && analysisResult.risk_factors.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        Fatores de Risco
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.risk_factors.map((factor, i) => (
                          <Badge key={i} variant="outline" className="bg-warning/5 text-warning border-warning/30">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="cashflow" className="mt-6">
                <Suspense fallback={<GraphSkeleton height={350} legendItems={3} />}>
                  <CashFlowChart data={cashFlowData} />
                </Suspense>
              </TabsContent>

              <TabsContent value="scenarios" className="mt-6">
                {analysisResult.scenarios && (
                  <ScenarioComparisonView scenarios={analysisResult.scenarios} />
                )}
              </TabsContent>

              <TabsContent value="market" className="mt-6">
                <MarketMetricsCard result={analysisResult} />
              </TabsContent>

              <TabsContent value="strategy" className="mt-6">
                <StrategyTab
                  projectId={id!}
                  swot={swot}
                  competitors={competitors ?? []}
                  updateSWOT={updateSWOT}
                  addCompetitor={addCompetitor}
                  removeCompetitor={removeCompetitor}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// ─── Strategy Tab: SWOT + Competitors ────────────────────────────────────────

interface StrategyTabProps {
  projectId: string;
  swot: SWOTData | null | undefined;
  competitors: Competitor[];
  updateSWOT: (data: Partial<SWOTData>) => void;
  addCompetitor: (c: Omit<Competitor, 'id'>) => void;
  removeCompetitor: (id: string) => void;
}

function SWOTQuadrant({ label, icon: Icon, items, color, bgColor, onAdd, onRemove }: {
  label: string;
  icon: React.ElementType;
  items: string[];
  color: string;
  bgColor: string;
  onAdd: (text: string) => void;
  onRemove: (i: number) => void;
}) {
  const [input, setInput] = useState('');
  return (
    <div className={cn('rounded-lg border p-4', bgColor)}>
      <div className={cn('flex items-center gap-2 mb-3', color)}>
        <Icon className="h-4 w-4" />
        <span className="font-semibold text-sm">{label}</span>
      </div>
      <ul className="space-y-1.5 mb-3 min-h-[60px]">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm group">
            <span className="mt-0.5 text-slate-400">•</span>
            <span className="flex-1 text-slate-700">{item}</span>
            <button
              onClick={() => onRemove(i)}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-xs text-slate-400 italic">Nenhum item adicionado</li>
        )}
      </ul>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { onAdd(input.trim()); setInput(''); } }}
          placeholder="Adicionar item..."
          className="h-7 text-xs"
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function StrategyTab({ projectId: _pid, swot, competitors, updateSWOT, addCompetitor, removeCompetitor }: StrategyTabProps) {
  const currentSWOT: SWOTData = swot ?? { forcas: [], fraquezas: [], oportunidades: [], ameacas: [] };

  const [newComp, setNewComp] = useState<Omit<Competitor, 'id'>>({
    nome: '', tipo: 'direto', precoMin: undefined, precoMax: undefined, diferencial: '',
  });
  const [showCompForm, setShowCompForm] = useState(false);

  const handleAddComp = () => {
    if (!newComp.nome.trim()) return;
    addCompetitor(newComp);
    setNewComp({ nome: '', tipo: 'direto', precoMin: undefined, precoMax: undefined, diferencial: '' });
    setShowCompForm(false);
  };

  const tipoColors: Record<string, string> = {
    direto: 'bg-red-100 text-red-700',
    indireto: 'bg-amber-100 text-amber-700',
    potencial: 'bg-blue-100 text-blue-700',
  };

  const formatBRL = (v?: number) => v
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
    : '—';

  return (
    <div className="space-y-6">
      {/* SWOT */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            Análise SWOT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SWOTQuadrant
              label="Forças" icon={Zap} items={currentSWOT.forcas}
              color="text-emerald-700" bgColor="bg-emerald-50 border-emerald-200"
              onAdd={text => updateSWOT({ forcas: [...currentSWOT.forcas, text] })}
              onRemove={i => updateSWOT({ forcas: currentSWOT.forcas.filter((_, idx) => idx !== i) })}
            />
            <SWOTQuadrant
              label="Fraquezas" icon={AlertTriangle} items={currentSWOT.fraquezas}
              color="text-red-700" bgColor="bg-red-50 border-red-200"
              onAdd={text => updateSWOT({ fraquezas: [...currentSWOT.fraquezas, text] })}
              onRemove={i => updateSWOT({ fraquezas: currentSWOT.fraquezas.filter((_, idx) => idx !== i) })}
            />
            <SWOTQuadrant
              label="Oportunidades" icon={Eye} items={currentSWOT.oportunidades}
              color="text-blue-700" bgColor="bg-blue-50 border-blue-200"
              onAdd={text => updateSWOT({ oportunidades: [...currentSWOT.oportunidades, text] })}
              onRemove={i => updateSWOT({ oportunidades: currentSWOT.oportunidades.filter((_, idx) => idx !== i) })}
            />
            <SWOTQuadrant
              label="Ameaças" icon={Swords} items={currentSWOT.ameacas}
              color="text-amber-700" bgColor="bg-amber-50 border-amber-200"
              onAdd={text => updateSWOT({ ameacas: [...currentSWOT.ameacas, text] })}
              onRemove={i => updateSWOT({ ameacas: currentSWOT.ameacas.filter((_, idx) => idx !== i) })}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            As alterações são salvas automaticamente no banco de dados.
          </p>
        </CardContent>
      </Card>

      {/* Competitors */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Swords className="h-4 w-4 text-slate-600" />
              Análise de Concorrência
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowCompForm(!showCompForm)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCompForm && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nome do Empreendimento *</label>
                  <Input value={newComp.nome} onChange={e => setNewComp(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Residencial Bella Vista" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo</label>
                  <Select value={newComp.tipo} onValueChange={v => setNewComp(p => ({ ...p, tipo: v as Competitor['tipo'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direto">Direto</SelectItem>
                      <SelectItem value="indireto">Indireto</SelectItem>
                      <SelectItem value="potencial">Potencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Preço Mínimo (R$)</label>
                  <Input type="number" value={newComp.precoMin ?? ''} onChange={e => setNewComp(p => ({ ...p, precoMin: e.target.value ? +e.target.value : undefined }))} placeholder="Ex: 800000" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Preço Máximo (R$)</label>
                  <Input type="number" value={newComp.precoMax ?? ''} onChange={e => setNewComp(p => ({ ...p, precoMax: e.target.value ? +e.target.value : undefined }))} placeholder="Ex: 1200000" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Diferencial</label>
                <Textarea value={newComp.diferencial ?? ''} onChange={e => setNewComp(p => ({ ...p, diferencial: e.target.value }))} placeholder="Ex: Piscina coberta, 3 vagas de garagem, localização privilegiada..." rows={2} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddComp} disabled={!newComp.nome.trim()}>Adicionar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCompForm(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {competitors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-xs font-semibold text-slate-500">Empreendimento</th>
                    <th className="text-center py-2 text-xs font-semibold text-slate-500">Tipo</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500">Preço Mín.</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500">Preço Máx.</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 hidden md:table-cell">Diferencial</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((c: Competitor & { id?: string }) => (
                    <tr key={c.id ?? c.nome} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-slate-900">{c.nome}</td>
                      <td className="py-2 text-center">
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', tipoColors[c.tipo] ?? 'bg-slate-100 text-slate-600')}>
                          {c.tipo === 'direto' ? 'Direto' : c.tipo === 'indireto' ? 'Indireto' : 'Potencial'}
                        </span>
                      </td>
                      <td className="py-2 text-right text-slate-600">{formatBRL(c.precoMin)}</td>
                      <td className="py-2 text-right text-slate-600">{formatBRL(c.precoMax)}</td>
                      <td className="py-2 text-slate-500 text-xs hidden md:table-cell max-w-[200px] truncate">{c.diferencial ?? '—'}</td>
                      <td className="py-2">
                        <button onClick={() => c.id && removeCompetitor(c.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Swords className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum concorrente cadastrado</p>
              <p className="text-xs mt-1">Adicione empreendimentos concorrentes para incluir no relatório PDF</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Scenario Comparison Component
function ScenarioComparisonView({ scenarios }: { scenarios: AnalysisResult['scenarios'] }) {
  const scenarioData = [
    { key: 'pessimista', label: 'Pessimista', color: 'destructive', data: scenarios.pessimista },
    { key: 'realista', label: 'Realista', color: 'secondary', data: scenarios.realista },
    { key: 'otimista', label: 'Otimista', color: 'success', data: scenarios.otimista },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {scenarioData.map(({ key, label, color, data }) => (
        <Card key={key} className={cn('border-l-4', `border-l-${color}`)}>
          <CardHeader>
            <CardTitle className={cn('text-lg', `text-${color}`)}>{label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">VPL</span>
              <span className="font-medium">{formatCurrency(data?.vpl || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">TIR</span>
              <span className="font-medium">{formatPercent(data?.tir || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Payback</span>
              <span className="font-medium">{data?.payback_months || 0} meses</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Margem</span>
              <span className="font-medium">{formatPercent(data?.profit_margin || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Receita</span>
              <span className="font-medium">{formatCurrency(data?.gross_revenue || 0)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
