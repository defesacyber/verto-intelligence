import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Calendar,
  TrendingUp,
  DollarSign,
  Percent,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Target,
  Loader2,
  Settings2,
  LineChart,
  Copy,
  Check
} from 'lucide-react';
import { formatCurrency, formatDate, PROPERTY_TYPES, PROJECT_STATUS, VIABILITY_THRESHOLDS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copiado para a área de transferência');
    setTimeout(() => setCopied(false), 2000);
  };

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Projeto não encontrado');
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <XCircle className="h-16 w-16 text-destructive" />
          <h2 className="text-xl font-semibold">Projeto não encontrado</h2>
          <Button asChild>
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Projetos
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const propertyTypeLabel = PROPERTY_TYPES.find(t => t.value === project.property_type)?.label || project.property_type;
  const statusConfig = PROJECT_STATUS.find(s => s.value === project.status);

  // Calculate viability score based on metrics
  const calculateScore = () => {
    let score = 0;
    
    if (project.roi >= VIABILITY_THRESHOLDS.ROI.excellent) score += 35;
    else if (project.roi >= VIABILITY_THRESHOLDS.ROI.recommended) score += 25;
    else if (project.roi >= VIABILITY_THRESHOLDS.ROI.min) score += 15;
    
    if (project.margin >= VIABILITY_THRESHOLDS.MARGIN.excellent) score += 35;
    else if (project.margin >= VIABILITY_THRESHOLDS.MARGIN.recommended) score += 25;
    else if (project.margin >= VIABILITY_THRESHOLDS.MARGIN.min) score += 15;
    
    // VGV bonus
    if (project.vgv >= 10000000) score += 30;
    else if (project.vgv >= 5000000) score += 20;
    else if (project.vgv >= 1000000) score += 10;
    
    return Math.min(100, score);
  };

  const viabilityScore = calculateScore();
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 45) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Excelente';
    if (score >= 45) return 'Bom';
    return 'Atenção';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <CheckCircle2 className="h-6 w-6 text-success" />;
    if (score >= 45) return <AlertTriangle className="h-6 w-6 text-warning" />;
    return <XCircle className="h-6 w-6 text-destructive" />;
  };

  const getMetricStatus = (value: number, thresholds: { min: number; recommended: number; excellent: number }) => {
    if (value >= thresholds.excellent) return { label: 'Excelente', color: 'text-success', bg: 'bg-success/10' };
    if (value >= thresholds.recommended) return { label: 'Bom', color: 'text-primary', bg: 'bg-primary/10' };
    if (value >= thresholds.min) return { label: 'Aceitável', color: 'text-warning', bg: 'bg-warning/10' };
    return { label: 'Abaixo', color: 'text-destructive', bg: 'bg-destructive/10' };
  };

  const roiStatus = getMetricStatus(project.roi, VIABILITY_THRESHOLDS.ROI);
  const marginStatus = getMetricStatus(project.margin, VIABILITY_THRESHOLDS.MARGIN);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/projects">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{project.location}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar Link'}</span>
            </Button>
            <Badge variant="secondary" className="gap-1">
              <Building className="h-3 w-3" />
              {propertyTypeLabel}
            </Badge>
            <Badge 
              variant={
                statusConfig?.color === 'success' ? 'success' :
                statusConfig?.color === 'destructive' ? 'destructive' :
                statusConfig?.color === 'info' ? 'info' :
                'secondary'
              }
            >
              {statusConfig?.label || project.status}
            </Badge>
          </div>
        </div>

        {/* Viability Score Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Score de Viabilidade
            </CardTitle>
            <CardDescription>
              Avaliação geral baseada nos indicadores do projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4">
                {getScoreIcon(viabilityScore)}
                <div>
                  <div className={cn("text-4xl font-bold", getScoreColor(viabilityScore))}>
                    {viabilityScore}
                  </div>
                  <div className="text-sm text-muted-foreground">de 100 pontos</div>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{getScoreLabel(viabilityScore)}</span>
                  <span className="text-sm text-muted-foreground">{viabilityScore}%</span>
                </div>
                <Progress value={viabilityScore} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                VGV Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(project.vgv)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor Geral de Vendas
              </p>
            </CardContent>
          </Card>

          <Card className={roiStatus.bg}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-bold", roiStatus.color)}>
                {project.roi.toFixed(1)}%
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={roiStatus.color}>
                  {roiStatus.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Mín: {VIABILITY_THRESHOLDS.ROI.min}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={marginStatus.bg}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Margem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-bold", marginStatus.color)}>
                {project.margin.toFixed(1)}%
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={marginStatus.color}>
                  {marginStatus.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Mín: {VIABILITY_THRESHOLDS.MARGIN.min}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informações do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{project.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{propertyTypeLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cidade</p>
                  <p className="font-medium">{project.city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="font-medium">{project.uf}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capital</p>
                  <p className="font-medium">{project.is_capital ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{statusConfig?.label || project.status}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Criado em
                  </p>
                  <p className="font-medium">{formatDate(project.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Atualizado em
                  </p>
                  <p className="font-medium">{formatDate(project.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thresholds Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Parâmetros de Referência
              </CardTitle>
              <CardDescription>
                Valores de referência para análise de viabilidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">ROI</span>
                  <span className={cn("text-sm font-bold", roiStatus.color)}>
                    {project.roi.toFixed(1)}%
                  </span>
                </div>
                <div className="flex gap-1 text-xs">
                  <span className="px-2 py-1 bg-destructive/10 text-destructive rounded">
                    &lt;{VIABILITY_THRESHOLDS.ROI.min}%
                  </span>
                  <span className="px-2 py-1 bg-warning/10 text-warning rounded">
                    {VIABILITY_THRESHOLDS.ROI.min}-{VIABILITY_THRESHOLDS.ROI.recommended}%
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                    {VIABILITY_THRESHOLDS.ROI.recommended}-{VIABILITY_THRESHOLDS.ROI.excellent}%
                  </span>
                  <span className="px-2 py-1 bg-success/10 text-success rounded">
                    &gt;{VIABILITY_THRESHOLDS.ROI.excellent}%
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Margem</span>
                  <span className={cn("text-sm font-bold", marginStatus.color)}>
                    {project.margin.toFixed(1)}%
                  </span>
                </div>
                <div className="flex gap-1 text-xs">
                  <span className="px-2 py-1 bg-destructive/10 text-destructive rounded">
                    &lt;{VIABILITY_THRESHOLDS.MARGIN.min}%
                  </span>
                  <span className="px-2 py-1 bg-warning/10 text-warning rounded">
                    {VIABILITY_THRESHOLDS.MARGIN.min}-{VIABILITY_THRESHOLDS.MARGIN.recommended}%
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                    {VIABILITY_THRESHOLDS.MARGIN.recommended}-{VIABILITY_THRESHOLDS.MARGIN.excellent}%
                  </span>
                  <span className="px-2 py-1 bg-success/10 text-success rounded">
                    &gt;{VIABILITY_THRESHOLDS.MARGIN.excellent}%
                  </span>
                </div>
              </div>

              <Separator />

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Recomendação</h4>
                <div className="flex items-center gap-2">
                  {getScoreIcon(viabilityScore)}
                  <span className={cn("font-semibold", getScoreColor(viabilityScore))}>
                    {viabilityScore >= 70 ? 'Projeto Viável' : viabilityScore >= 45 ? 'Revisar Indicadores' : 'Risco Elevado'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {viabilityScore >= 70 
                    ? 'Os indicadores do projeto estão dentro dos parâmetros recomendados.'
                    : viabilityScore >= 45
                    ? 'Alguns indicadores podem ser otimizados para melhorar a viabilidade.'
                    : 'Recomenda-se revisar os parâmetros do projeto antes de prosseguir.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" asChild>
            <Link to="/projects">Voltar aos Projetos</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to={`/projects/${id}/inputs`}>
              <Settings2 className="h-4 w-4 mr-2" />
              Parâmetros
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/projects/${id}/analysis`}>
              <LineChart className="h-4 w-4 mr-2" />
              Análise Completa
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
