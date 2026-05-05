import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, Receipt, LayoutGrid, Calculator, Leaf, 
  Check, AlertCircle, Pencil, FileDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  land_acquisition_type?: string | null;
  land_cost?: number;
  permuta_units?: number;
  usufruto_years?: number;
  approval_costs?: number;
  infrastructure_costs?: number;
  project_costs?: number;
  contingency_percent?: number;
  sales_velocity?: number;
  launch_date?: string | null;
  construction_months?: number;
  financing_rate?: number;
  discount_rate?: number;
  certifications?: string[];
  sustainability_initiatives?: string[];
  unit_distribution?: {
    studio?: number;
    '1q'?: number;
    '2q'?: number;
    '3q'?: number;
    '4q'?: number;
  };
}

interface FormSummaryStepProps {
  data: FormData;
  stepsProgress: Array<{ id: string; title: string; filledFields: number; totalFields: number }>;
  onEditStep?: (stepIndex: number) => void;
  projectName?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Não definida';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

const getAcquisitionLabel = (type: string | null) => {
  switch (type) {
    case 'compra': return 'Compra Direta';
    case 'permuta': return 'Permuta';
    case 'usufruto': return 'Usufruto';
    default: return 'Não selecionado';
  }
};

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  stepIndex: number;
  onEdit?: (stepIndex: number) => void;
}

function SectionHeader({ icon, title, stepIndex, onEdit }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="flex items-center gap-2 font-medium text-sm">
        {icon}
        {title}
      </h4>
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(stepIndex)}
        >
          <Pencil className="h-3 w-3 mr-1" />
          Editar
        </Button>
      )}
    </div>
  );
}

export function FormSummaryStep({ data, stepsProgress, onEditStep, projectName }: FormSummaryStepProps) {
  const unitDist = data.unit_distribution || { studio: 0, '1q': 0, '2q': 0, '3q': 0, '4q': 0 };
  const totalUnits = Object.values(unitDist).reduce((sum, val) => sum + (val || 0), 0);
  const overallProgress = stepsProgress.reduce((sum, step) => sum + step.filledFields, 0);
  const overallTotal = stepsProgress.reduce((sum, step) => sum + step.totalFields, 0);
  const progressPercent = Math.round((overallProgress / overallTotal) * 100);
  const isComplete = progressPercent === 100;

  const handleExportPdf = async () => {
    const { generateInputsSummaryPdf } = await import('@/lib/pdf-inputs-export');
    generateInputsSummaryPdf({
      projectName: projectName || 'Projeto',
      data,
      stepsProgress,
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Check className="h-5 w-5 text-primary" />
              Resumo dos Parâmetros
            </CardTitle>
            <CardDescription>
              Revise os dados antes de salvar e iniciar a análise
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              className="text-xs"
            >
              <FileDown className="h-4 w-4 mr-1" />
              Exportar PDF
            </Button>
            <Badge 
              variant={isComplete ? "default" : "secondary"}
              className={cn(
                "text-sm px-3 py-1",
                isComplete && "bg-green-500 hover:bg-green-600"
              )}
            >
              {progressPercent}% Completo
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status por Etapa */}
        <div className="grid gap-2 md:grid-cols-5">
          {stepsProgress.map((step, index) => {
            const isStepComplete = step.filledFields === step.totalFields;
            return (
              <button 
                key={step.id}
                type="button"
                onClick={() => onEditStep?.(index)}
                className={cn(
                  "rounded-lg p-3 text-center transition-all cursor-pointer hover:scale-105",
                  isStepComplete 
                    ? "bg-green-500/10 border border-green-500/30 hover:bg-green-500/20" 
                    : "bg-muted/50 border border-border/50 hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {isStepComplete ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium">{step.title}</span>
                </div>
                <span className={cn(
                  "text-xs",
                  isStepComplete ? "text-green-600" : "text-muted-foreground"
                )}>
                  {step.filledFields}/{step.totalFields}
                </span>
              </button>
            );
          })}
        </div>

        <Separator />

        {/* Terreno */}
        <div className="space-y-3">
          <SectionHeader
            icon={<MapPin className="h-4 w-4 text-primary" />}
            title="Aquisição do Terreno"
            stepIndex={0}
            onEdit={onEditStep}
          />
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="flex justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Tipo de Aquisição</span>
              <span className="font-medium">{getAcquisitionLabel(data.land_acquisition_type ?? null)}</span>
            </div>
            {data.land_acquisition_type === 'compra' && (
              <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Valor do Terreno</span>
                <span className="font-medium">{formatCurrency(data.land_cost ?? 0)}</span>
              </div>
            )}
            {data.land_acquisition_type === 'permuta' && (
              <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Unidades em Permuta</span>
                <span className="font-medium">{data.permuta_units ?? 0} unidades</span>
              </div>
            )}
            {data.land_acquisition_type === 'usufruto' && (
              <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Anos de Usufruto</span>
                <span className="font-medium">{data.usufruto_years ?? 0} anos</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Custos */}
        <div className="space-y-3">
          <SectionHeader
            icon={<Receipt className="h-4 w-4 text-primary" />}
            title="Custos do Projeto"
            stepIndex={1}
            onEdit={onEditStep}
          />
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="flex justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Custos de Aprovação</span>
              <span className="font-medium">{formatCurrency(data.approval_costs ?? 0)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Infraestrutura</span>
              <span className="font-medium">{formatCurrency(data.infrastructure_costs ?? 0)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Custos de Projeto</span>
              <span className="font-medium">{formatCurrency(data.project_costs ?? 0)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Contingência</span>
              <span className="font-medium">{data.contingency_percent ?? 0}%</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Unidades */}
        <div className="space-y-3">
          <SectionHeader
            icon={<LayoutGrid className="h-4 w-4 text-primary" />}
            title="Distribuição de Unidades"
            stepIndex={2}
            onEdit={onEditStep}
          />
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6 text-sm">
            {[
              { key: 'studio', label: 'Studio' },
              { key: '1q', label: '1 Quarto' },
              { key: '2q', label: '2 Quartos' },
              { key: '3q', label: '3 Quartos' },
              { key: '4q', label: '4+ Quartos' },
            ].map((item) => (
              <div key={item.key} className="flex flex-col items-center p-3 rounded-lg bg-muted/30">
                <span className="text-muted-foreground text-xs">{item.label}</span>
                <span className="font-medium text-lg">{unitDist[item.key as keyof typeof unitDist] ?? 0}</span>
              </div>
            ))}
            <div className="flex flex-col items-center p-3 rounded-lg bg-primary/10 border border-primary/30">
              <span className="text-primary text-xs font-medium">Total</span>
              <span className="font-bold text-lg text-primary">{totalUnits}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Parâmetros Financeiros */}
        <div className="space-y-3">
          <SectionHeader
            icon={<Calculator className="h-4 w-4 text-primary" />}
            title="Parâmetros Financeiros"
            stepIndex={3}
            onEdit={onEditStep}
          />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 text-sm">
            <div className="flex justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Data de Lançamento</span>
              <span className="font-medium">{formatDate(data.launch_date ?? null)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Prazo de Construção</span>
              <span className="font-medium">{data.construction_months ?? 0} meses</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Velocidade de Vendas</span>
              <span className="font-medium">{data.sales_velocity ?? 0}% ao mês</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Taxa de Desconto</span>
              <span className="font-medium">{data.discount_rate ?? 0}% a.a.</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Taxa de Financiamento</span>
              <span className="font-medium">{data.financing_rate ?? 0}% a.a.</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sustentabilidade */}
        <div className="space-y-3">
          <SectionHeader
            icon={<Leaf className="h-4 w-4 text-primary" />}
            title="Sustentabilidade"
            stepIndex={4}
            onEdit={onEditStep}
          />
          <div className="space-y-2 text-sm">
            <div className="p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block mb-2">Certificações</span>
              <div className="flex flex-wrap gap-2">
                {(data.certifications ?? []).length > 0 ? (
                  (data.certifications ?? []).map((cert) => (
                    <Badge key={cert} variant="outline" className="text-xs">
                      {cert}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs">Nenhuma certificação selecionada</span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block mb-2">Iniciativas</span>
              <div className="flex flex-wrap gap-2">
                {(data.sustainability_initiatives ?? []).length > 0 ? (
                  (data.sustainability_initiatives ?? []).map((init) => (
                    <Badge key={init} variant="outline" className="text-xs">
                      {init}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs">Nenhuma iniciativa selecionada</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isComplete && (
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h5 className="font-medium text-sm text-yellow-700 dark:text-yellow-400">
                  Campos pendentes
                </h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Alguns campos ainda não foram preenchidos. Clique nos cards acima ou nos botões "Editar" para completá-los.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
