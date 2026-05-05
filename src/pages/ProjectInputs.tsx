import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronLeft, ChevronRight, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { LandAcquisitionStep } from '@/components/inputs/LandAcquisitionStep';
import { CostsStep } from '@/components/inputs/CostsStep';
import { UnitDistributionStep } from '@/components/inputs/UnitDistributionStep';
import { FinancialParametersStep } from '@/components/inputs/FinancialParametersStep';
import { SustainabilityStep } from '@/components/inputs/SustainabilityStep';
import { StepProgressIndicator } from '@/components/inputs/StepProgressIndicator';
import { FormSummaryStep } from '@/components/inputs/FormSummaryStep';
import type { Json } from '@/integrations/supabase/types';

import { projectFormSchema, type ProjectFormData } from '@/lib/project-schema';

// Removed local formSchema definition
// const formSchema = ...

type FormData = ProjectFormData;


// Normalize padrão string to edge-function key
function normalizePadrao(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('baixo') || lower.includes('econom')) return 'baixo';
  if (lower.includes('luxo') || lower.includes('super')) return 'luxo';
  if (lower.includes('alto')) return 'alto';
  if (lower.includes('medio') || lower.includes('médio') || lower.includes('normal')) return 'medio';
  // already a key value
  if (['baixo','medio','alto','luxo','economic','standard','high','luxury'].includes(lower)) return lower;
  return 'medio'; // fallback
}

const STEPS = [
  { id: 'land', title: 'Terreno', description: 'Aquisição do terreno' },
  { id: 'costs', title: 'Custos', description: 'Custos do projeto' },
  { id: 'units', title: 'Unidades', description: 'Distribuição' },
  { id: 'financial', title: 'Financeiro', description: 'Parâmetros' },
  { id: 'sustainability', title: 'Sustentabilidade', description: 'Certificações' },
  { id: 'summary', title: 'Resumo', description: 'Revisão final' },
];

// Validation requirements per step
const getStepValidation = (values: FormData) => {
  return {
    0: { // Land
      isValid: values.land_acquisition_type !== null && (
        (values.land_acquisition_type === 'compra' && values.land_cost > 0) ||
        (values.land_acquisition_type === 'permuta' && values.permuta_units > 0) ||
        (values.land_acquisition_type === 'usufruto' && values.usufruto_years > 0)
      ),
      message: 'Selecione o tipo de aquisição e preencha o campo correspondente',
    },
    1: { // Costs
      isValid: values.approval_costs > 0 || values.infrastructure_costs > 0 || values.project_costs > 0,
      message: 'Preencha pelo menos um custo do projeto',
    },
    2: { // Units
      isValid: Object.values(values.unit_distribution).some(v => v > 0),
      message: 'Adicione pelo menos uma unidade ao projeto',
    },
    3: { // Financial
      isValid: values.construction_months >= 6 && values.sales_velocity > 0,
      message: 'Defina o prazo de construção e a velocidade de vendas',
    },
    4: { // Sustainability - optional, always valid
      isValid: true,
      message: '',
    },
  };
};

export default function ProjectInputs() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [existingInputId, setExistingInputId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Project context for AI construction cost calculation
  const [projectContext, setProjectContext] = useState<{
    uf: string;
    cidade: string;
    tipoEmpreendimento: string;
    padrao: string;
    prazoMeses: number;
  } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      land_acquisition_type: null,
      land_cost: 0,
      permuta_units: 0,
      usufruto_years: 0,
      approval_costs: 0,
      infrastructure_costs: 0,
      project_costs: 0,
      contingency_percent: 5,
      sales_velocity: 10,
      launch_date: null,
      construction_months: 24,
      launch_months: 3,
      estimated_launch_velocity: 0,
      financing_rate: 12,
      discount_rate: 15,
      certifications: [],
      sustainability_initiatives: [],
      unit_distribution: {
        studio: 0, flat: 0, '1q': 0, '2q': 0, '3q': 0, '4q': 0,
        sobrado: 0, terrea: 0, lote: 0,
      },
      unit_areas: {
        studio: 35, flat: 45, '1q': 45, '2q': 65, '3q': 90, '4q': 130,
        sobrado: 120, terrea: 100, lote: 250,
      },
      unit_prices: {
        studio: 0, flat: 0, '1q': 0, '2q': 0, '3q': 0, '4q': 0,
        sobrado: 0, terrea: 0, lote: 0,
      },
      adjustable_costs: {
        comissao_venda: 5.0, gestao_vendas: 1.5, marketing: 3.0,
        administracao: 5.0, incorporacao: 2.0, engenharia_arquitetura: 3.0,
        impostos: 8.0, outros: 1.0,
      },
    },
  });

  const watchedValues = form.watch();

  // Calculate progress for each step
  const stepsProgress = useMemo(() => {
    const values = watchedValues;
    
    // Step 1: Land Acquisition
    const landFields = {
      filled: [
        values.land_acquisition_type !== null,
        values.land_cost > 0,
        values.land_acquisition_type === 'permuta' ? values.permuta_units > 0 : true,
        values.land_acquisition_type === 'usufruto' ? values.usufruto_years > 0 : true,
      ].filter(Boolean).length,
      total: values.land_acquisition_type === 'permuta' ? 3 : 
             values.land_acquisition_type === 'usufruto' ? 3 : 2,
    };

    // Step 2: Costs
    const costsFields = {
      filled: [
        values.approval_costs > 0,
        values.infrastructure_costs > 0,
        values.project_costs > 0,
        values.contingency_percent > 0,
      ].filter(Boolean).length,
      total: 4,
    };

    // Step 3: Unit Distribution
    const unitDist = values.unit_distribution;
    const hasAnyUnits = Object.values(unitDist).some(v => v > 0);
    const unitsFields = {
      filled: hasAnyUnits ? 1 : 0,
      total: 1,
    };

    // Step 4: Financial Parameters
    const financialFields = {
      filled: [
        values.sales_velocity > 0,
        values.launch_date !== null && values.launch_date !== '',
        values.construction_months > 0,
        values.financing_rate > 0,
        values.discount_rate > 0,
      ].filter(Boolean).length,
      total: 5,
    };

    // Step 5: Sustainability
    const sustainabilityFields = {
      filled: [
        values.certifications.length > 0,
        values.sustainability_initiatives.length > 0,
      ].filter(Boolean).length,
      total: 2,
    };

    return [
      { id: 'land', title: 'Terreno', filledFields: landFields.filled, totalFields: landFields.total },
      { id: 'costs', title: 'Custos', filledFields: costsFields.filled, totalFields: costsFields.total },
      { id: 'units', title: 'Unidades', filledFields: unitsFields.filled, totalFields: unitsFields.total },
      { id: 'financial', title: 'Financeiro', filledFields: financialFields.filled, totalFields: financialFields.total },
      { id: 'sustainability', title: 'Sustentabilidade', filledFields: sustainabilityFields.filled, totalFields: sustainabilityFields.total },
    ];
  }, [watchedValues]);

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      try {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('name, uf, city, property_type, target_audience, padrao_empreendimento, projecao_construcao_meses')
          .eq('id', id)
          .single();

        if (projectError) throw projectError;
        setProjectName(project?.name || 'Projeto');

        // Build project context for AI construction cost calculation
        if (project?.uf && project?.property_type) {
          // Normalize padrão: prefer padrao_empreendimento, fall back to target_audience
          const rawPadrao = project.padrao_empreendimento || project.target_audience || '';
          const padrao = normalizePadrao(rawPadrao);
          setProjectContext({
            uf: project.uf,
            cidade: project.city || '',
            tipoEmpreendimento: project.property_type,
            padrao,
            prazoMeses: project.projecao_construcao_meses || 24,
          });
        }

        const { data: inputs, error: inputsError } = await supabase
          .from('project_inputs')
          .select('*')
          .eq('project_id', id)
          .maybeSingle();

        if (inputsError) throw inputsError;

        if (inputs) {
          setExistingInputId(inputs.id);
          const unitDist = (inputs.unit_distribution as Record<string, number>) || {};
          const unitAreas = (inputs.unit_areas as Record<string, number>) || {};
          const unitPrices = (inputs.unit_prices as Record<string, number>) || {};
          const adjustableCosts = (inputs.adjustable_costs as Record<string, number>) || {};
          form.reset({
            land_acquisition_type: inputs.land_acquisition_type as FormData['land_acquisition_type'],
            land_cost: inputs.land_cost || 0,
            permuta_units: inputs.permuta_units || 0,
            usufruto_years: inputs.usufruto_years || 0,
            approval_costs: inputs.approval_costs || 0,
            infrastructure_costs: inputs.infrastructure_costs || 0,
            project_costs: inputs.project_costs || 0,
            contingency_percent: inputs.contingency_percent || 5,
            sales_velocity: inputs.sales_velocity || 10,
            launch_date: inputs.launch_date,
            construction_months: inputs.construction_months || 24,
            launch_months: inputs.launch_months || 3,
            estimated_launch_velocity: inputs.estimated_launch_velocity || 0,
            financing_rate: inputs.financing_rate || 12,
            discount_rate: inputs.discount_rate || 15,
            certifications: (inputs.certifications as string[]) || [],
            sustainability_initiatives: (inputs.sustainability_initiatives as string[]) || [],
            unit_distribution: {
              studio: unitDist.studio || 0,
              flat: unitDist.flat || 0,
              '1q': unitDist['1q'] || 0,
              '2q': unitDist['2q'] || 0,
              '3q': unitDist['3q'] || 0,
              '4q': unitDist['4q'] || 0,
              sobrado: unitDist.sobrado || 0,
              terrea: unitDist.terrea || 0,
              lote: unitDist.lote || 0,
            },
            unit_areas: {
              studio: unitAreas.studio || 35,
              flat: unitAreas.flat || 45,
              '1q': unitAreas['1q'] || 45,
              '2q': unitAreas['2q'] || 65,
              '3q': unitAreas['3q'] || 90,
              '4q': unitAreas['4q'] || 130,
              sobrado: unitAreas.sobrado || 120,
              terrea: unitAreas.terrea || 100,
              lote: unitAreas.lote || 250,
            },
            unit_prices: {
              studio: unitPrices.studio || 0,
              flat: unitPrices.flat || 0,
              '1q': unitPrices['1q'] || 0,
              '2q': unitPrices['2q'] || 0,
              '3q': unitPrices['3q'] || 0,
              '4q': unitPrices['4q'] || 0,
              sobrado: unitPrices.sobrado || 0,
              terrea: unitPrices.terrea || 0,
              lote: unitPrices.lote || 0,
            },
            adjustable_costs: {
              comissao_venda: adjustableCosts.comissao_venda ?? 5.0,
              gestao_vendas: adjustableCosts.gestao_vendas ?? 1.5,
              marketing: adjustableCosts.marketing ?? 3.0,
              administracao: adjustableCosts.administracao ?? 5.0,
              incorporacao: adjustableCosts.incorporacao ?? 2.0,
              engenharia_arquitetura: adjustableCosts.engenharia_arquitetura ?? 3.0,
              impostos: adjustableCosts.impostos ?? 8.0,
              outros: adjustableCosts.outros ?? 1.0,
            },
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar dados';
        toast({
          title: 'Erro ao carregar dados',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, form, toast]);

  async function onSubmit(data: FormData) {
    if (!id) return;

    setIsSaving(true);
    try {
      const payload = {
        project_id: id,
        land_acquisition_type: data.land_acquisition_type,
        land_cost: data.land_cost,
        permuta_units: data.permuta_units,
        usufruto_years: data.usufruto_years,
        approval_costs: data.approval_costs,
        infrastructure_costs: data.infrastructure_costs,
        project_costs: data.project_costs,
        contingency_percent: data.contingency_percent,
        sales_velocity: data.sales_velocity,
        launch_date: data.launch_date,
        construction_months: data.construction_months,
        launch_months: data.launch_months,
        estimated_launch_velocity: data.estimated_launch_velocity,
        financing_rate: data.financing_rate,
        discount_rate: data.discount_rate,
        certifications: data.certifications as unknown as Json,
        sustainability_initiatives: data.sustainability_initiatives as unknown as Json,
        unit_distribution: data.unit_distribution as unknown as Json,
        unit_areas: (data.unit_areas ?? {}) as unknown as Json,
        unit_prices: (data.unit_prices ?? {}) as unknown as Json,
        adjustable_costs: (data.adjustable_costs ?? {}) as unknown as Json,
      };

      if (existingInputId) {
        const { error } = await supabase
          .from('project_inputs')
          .update(payload)
          .eq('id', existingInputId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_inputs')
          .insert(payload);

        if (error) throw error;
      }

      toast({
        title: 'Dados salvos!',
        description: 'Os parâmetros do projeto foram atualizados.',
      });

      navigate(`/projects/${id}/analysis`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar';
      toast({
        title: 'Erro ao salvar',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  const validateAndNext = () => {
    const stepValidation = getStepValidation(watchedValues);
    const currentValidation = stepValidation[currentStep as keyof typeof stepValidation];
    
    if (currentValidation && !currentValidation.isValid) {
      setValidationError(currentValidation.message);
      toast({
        title: 'Campos obrigatórios',
        description: currentValidation.message,
        variant: 'destructive',
      });
      return;
    }
    
    setValidationError(null);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setValidationError(null);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow going back without validation
    if (stepIndex < currentStep) {
      setValidationError(null);
      setCurrentStep(stepIndex);
      return;
    }
    
    // Validate all steps up to the target
    const stepValidation = getStepValidation(watchedValues);
    for (let i = currentStep; i < stepIndex; i++) {
      const validation = stepValidation[i as keyof typeof stepValidation];
      if (validation && !validation.isValid) {
        setValidationError(validation.message);
        toast({
          title: 'Campos obrigatórios',
          description: `Complete a etapa "${STEPS[i].title}" antes de avançar`,
          variant: 'destructive',
        });
        return;
      }
    }
    
    setValidationError(null);
    setCurrentStep(stepIndex);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const isSummaryStep = currentStep === STEPS.length - 1;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/projects/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{projectName}</h1>
            <p className="text-muted-foreground">Parâmetros de Viabilidade</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Progress Sidebar */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <StepProgressIndicator
              steps={[...stepsProgress, { id: 'summary', title: 'Resumo', filledFields: 0, totalFields: 0 }]}
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
          </div>

          {/* Form Content */}
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {currentStep === 0 && (
                  <LandAcquisitionStep
                    control={form.control}
                    watchAcquisitionType={watchedValues.land_acquisition_type}
                  />
                )}
                {currentStep === 1 && (
                  <CostsStep
                    control={form.control}
                    projectId={id}
                    uf={projectContext?.uf}
                    cidade={projectContext?.cidade}
                    tipoEmpreendimento={projectContext?.tipoEmpreendimento}
                    padrao={projectContext?.padrao}
                    prazoMeses={projectContext?.prazoMeses}
                  />
                )}
                {currentStep === 2 && <UnitDistributionStep control={form.control} />}
                {currentStep === 3 && <FinancialParametersStep control={form.control} />}
                {currentStep === 4 && <SustainabilityStep control={form.control} />}
                {currentStep === 5 && (
                  <FormSummaryStep 
                    data={watchedValues as FormData} 
                    stepsProgress={stepsProgress}
                    onEditStep={handleStepClick}
                    projectName={projectName}
                  />
                )}

                {validationError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {validationError}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>

                  {isSummaryStep ? (
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar e Analisar
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button type="button" onClick={validateAndNext}>
                      Próximo
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
