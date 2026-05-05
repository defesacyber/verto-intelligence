import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  DollarSign,
  BarChart3,
  PieChart,
  Clock,
  Target,
  ArrowRight,
  Plus,
  FileText,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useEffect } from 'react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  analise: 'Em Análise',
  aprovado: 'Aprovado',
  em_construcao: 'Em Construção',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export default function Viability() {
  const navigate = useNavigate();
  const { projects, isLoading, fetchProjects } = useProjects();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  const totalVGV = projects.reduce((sum, p) => sum + (p.estimatedPrice || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Estudo de Viabilidade</h1>
            <p className="text-muted-foreground">
              Análise econômico-financeira de empreendimentos imobiliários
            </p>
          </div>
          <Button onClick={() => navigate('/projects/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Estudo
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Estudos Realizados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">projetos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">VGV Total Estimado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalVGV)}
              </div>
              <p className="text-xs text-muted-foreground">em projetos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Unidades</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.reduce((sum, p) => sum + (p.totalUnits || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">unidades projetadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Área Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.reduce((sum, p) => sum + (p.totalArea || 0), 0).toLocaleString('pt-BR')} m²
              </div>
              <p className="text-xs text-muted-foreground">de construção</p>
            </CardContent>
          </Card>
        </div>

        {/* Methodology */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Metodologia de Análise
            </CardTitle>
            <CardDescription>
              Nosso estudo de viabilidade segue as melhores práticas do mercado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <h4 className="font-semibold">Análise de Mercado</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Estudo da demanda, oferta e preços praticados na região do empreendimento.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <h4 className="font-semibold">Projeção de Custos</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Estimativa detalhada de todos os custos envolvidos no projeto.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <h4 className="font-semibold">Fluxo de Caixa</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Projeção de receitas e despesas ao longo do ciclo do empreendimento.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">4</span>
                  </div>
                  <h4 className="font-semibold">Indicadores</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cálculo de VPL, TIR, Payback e outros indicadores financeiros.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Studies */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Estudos Recentes</CardTitle>
                <CardDescription>Seus últimos estudos de viabilidade</CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate('/projects')}>
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}/analysis`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.city}/{project.state}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">VGV Estimado</p>
                        <p className="font-medium">{formatCurrency(project.estimatedPrice)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Unidades</p>
                        <p className="font-medium">{project.totalUnits || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Área</p>
                        <p className="font-medium">{(project.totalArea || 0).toLocaleString('pt-BR')} m²</p>
                      </div>
                      <Badge variant={
                        project.status === 'aprovado' ? 'default' :
                        project.status === 'concluido' ? 'secondary' :
                        'outline'
                      }>
                        {statusLabels[project.status] || project.status}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calculator className="h-12 w-12 mb-4 opacity-50" />
                <p className="mb-4">Nenhum estudo de viabilidade realizado</p>
                <Button onClick={() => navigate('/projects/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeiro estudo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Indicators Explanation */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-primary" />
                VPL - Valor Presente Líquido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Indica o valor presente de todos os fluxos de caixa futuros, descontados a uma taxa definida. 
                VPL positivo indica viabilidade econômica.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="h-5 w-5 text-primary" />
                TIR - Taxa Interna de Retorno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Taxa de desconto que torna o VPL igual a zero. Representa o retorno percentual do investimento. 
                TIR maior que o custo de capital indica viabilidade.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-primary" />
                Payback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tempo necessário para recuperar o investimento inicial. 
                Quanto menor o payback, mais rápido o retorno do capital investido.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
