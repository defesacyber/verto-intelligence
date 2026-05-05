import { useState, lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarketResearch, type MarketResearchState } from '@/hooks/useMarketResearch';
const MacroAnalysisBlock = lazy(() => import('./blocks/MacroAnalysisBlock').then(module => ({ default: module.MacroAnalysisBlock })));
const CityAnalysisBlock = lazy(() => import('./blocks/CityAnalysisBlock').then(module => ({ default: module.CityAnalysisBlock })));
const NeighborhoodBlock = lazy(() => import('./blocks/NeighborhoodBlock').then(module => ({ default: module.NeighborhoodBlock })));
const CompetitorBlock = lazy(() => import('./blocks/CompetitorBlock').then(module => ({ default: module.CompetitorBlock })));
const DemandBlock = lazy(() => import('./blocks/DemandBlock').then(module => ({ default: module.DemandBlock })));
const VelocityBlock = lazy(() => import('./blocks/VelocityBlock').then(module => ({ default: module.VelocityBlock })));
const ConclusionBlock = lazy(() => import('./blocks/ConclusionBlock').then(module => ({ default: module.ConclusionBlock })));
import {
  Play,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Building2,
  MapPin,
  Users,
  Target,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GraphSkeleton } from '@/components/ui/chart';

interface BasicProject {
  name: string;
  city: string;
  uf: string;
  neighborhood?: string | null;
  bairro?: string | null;
  property_type?: string | null;
  vgv?: number | null;
  total_units?: number | null;
}

interface MarketResearchWizardProps {
  project: BasicProject;
  onComplete?: (data: MarketResearchState) => void;
}

const STEPS = [
  { id: 1, label: 'Macroeconômico', icon: TrendingUp },
  { id: 2, label: 'Cidade', icon: Building2 },
  { id: 3, label: 'Bairro', icon: MapPin },
  { id: 4, label: 'Concorrência', icon: Target },
  { id: 5, label: 'Demanda', icon: Users },
  { id: 6, label: 'Velocidade', icon: BarChart3 },
  { id: 7, label: 'Conclusão', icon: FileText },
];

export function MarketResearchWizard({ project, onComplete }: MarketResearchWizardProps) {
  const {
    isLoading,
    progress,
    state,
    runFullResearch,
    addCompetitor,
    removeCompetitor
  } = useMarketResearch();

  const [activeTab, setActiveTab] = useState('overview');
  const [hasStarted, setHasStarted] = useState(false);

  const handleStartResearch = async () => {
    setHasStarted(true);
    const result = await runFullResearch(project);
    if (result && onComplete) {
      onComplete(result);
    }
  };

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case 'FAVORAVEL':
        return { label: 'Favorável', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' };
      case 'FAVORAVEL_COM_RESSALVAS':
        return { label: 'Favorável com Ressalvas', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' };
      case 'DESFAVORAVEL':
        return { label: 'Desfavorável', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' };
      default:
        return null;
    }
  };

  const handleExportPDF = async () => {
    const { generateMarketResearchPDF } = await import('@/lib/market-research-pdf');
    generateMarketResearchPDF({
      project: {
        name: project.name,
        city: project.city,
        uf: project.uf,
        neighborhood: project.neighborhood || project.bairro,
        property_type: project.property_type,
        vgv: project.vgv,
        total_units: project.total_units
      },
      marketResearch: state
    });
  };

  // Se ainda não iniciou, mostrar tela inicial
  if (!hasStarted) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-16 w-16 mx-auto text-secondary mb-6" />
          <h2 className="text-2xl font-bold mb-3">Pesquisa de Mercado Completa</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Execute uma análise completa de mercado incluindo cenário macroeconômico, 
            análise da cidade e bairro, concorrência, demanda e projeção de vendas.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <Badge key={step.id} variant="outline" className="px-3 py-1.5">
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {step.label}
                </Badge>
              );
            })}
          </div>

          <Button size="lg" onClick={handleStartResearch}>
            <Play className="h-4 w-4 mr-2" />
            Iniciar Pesquisa de Mercado
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Se está carregando, mostrar progresso
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center mb-8">
            <Loader2 className="h-12 w-12 mx-auto text-secondary animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-2">Gerando Pesquisa de Mercado</h3>
            <p className="text-muted-foreground">{progress.stepLabel}</p>
          </div>
          
          <div className="max-w-md mx-auto space-y-4">
            <Progress value={progress.percentage} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Etapa {progress.currentStep} de {progress.totalSteps}</span>
              <span>{progress.percentage}%</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mt-8 max-w-2xl mx-auto">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isComplete = progress.currentStep > step.id;
              const isCurrent = progress.currentStep === step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors",
                    isComplete ? "bg-success text-success-foreground" :
                    isCurrent ? "bg-secondary text-secondary-foreground animate-pulse" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {isComplete ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs text-center text-muted-foreground">{step.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Resultado final
  const verdictConfig = state.conclusionData ? getVerdictConfig(state.conclusionData.final_verdict) : null;
  const VerdictIcon = verdictConfig?.icon || AlertTriangle;

  return (
    <div className="space-y-6">
      {/* Header com resultado */}
      {state.conclusionData && (
        <Card className={cn("border-2", verdictConfig?.bg)}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-full", verdictConfig?.bg)}>
                  <VerdictIcon className={cn("h-8 w-8", verdictConfig?.color)} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Pesquisa de Mercado Concluída</h2>
                  <p className="text-muted-foreground">
                    Parecer: <span className={cn("font-semibold", verdictConfig?.color)}>
                      {verdictConfig?.label}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline" onClick={() => setHasStarted(false)}>
                  Nova Pesquisa
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs com blocos */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="text-xs">Resumo</TabsTrigger>
          <TabsTrigger value="macro" className="text-xs">Macro</TabsTrigger>
          <TabsTrigger value="city" className="text-xs">Cidade</TabsTrigger>
          <TabsTrigger value="neighborhood" className="text-xs">Bairro</TabsTrigger>
          <TabsTrigger value="competitors" className="text-xs">Concorrência</TabsTrigger>
          <TabsTrigger value="demand" className="text-xs">Demanda</TabsTrigger>
          <TabsTrigger value="conclusion" className="text-xs">Conclusão</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Suspense fallback={<GraphSkeleton height={220} />}>
            <ConclusionBlock data={state.conclusionData} compact />
          </Suspense>
        </TabsContent>

        <TabsContent value="macro" className="mt-6">
          <Suspense fallback={<GraphSkeleton height={320} />}>
            <MacroAnalysisBlock data={state.macroData} />
          </Suspense>
        </TabsContent>

        <TabsContent value="city" className="mt-6">
          <Suspense fallback={<GraphSkeleton height={320} />}>
            <CityAnalysisBlock data={state.cityData} />
          </Suspense>
        </TabsContent>

        <TabsContent value="neighborhood" className="mt-6">
          <Suspense fallback={<GraphSkeleton height={320} />}>
            <NeighborhoodBlock 
              data={state.neighborhoodData} 
              adequacyData={state.adequacyData} 
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="competitors" className="mt-6">
          <Suspense fallback={<GraphSkeleton height={320} />}>
            <CompetitorBlock 
              competitors={state.competitors}
              onAddCompetitor={addCompetitor}
              onRemoveCompetitor={removeCompetitor}
              city={project.city}
              uf={project.uf}
              neighborhood={project.neighborhood || project.bairro}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="demand" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Suspense fallback={<GraphSkeleton height={300} />}>
              <DemandBlock data={state.demandData} />
            </Suspense>
            <Suspense fallback={<GraphSkeleton height={300} />}>
              <VelocityBlock data={state.velocityData} />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="conclusion" className="mt-6">
          <Suspense fallback={<GraphSkeleton height={240} />}>
            <ConclusionBlock data={state.conclusionData} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
