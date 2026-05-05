import { Control } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, FileCheck, Building2, FolderOpen, Percent, Info } from 'lucide-react';
import { ValidatedFormField } from './ValidatedFormField';
import { ProjectFormData, IMPOSTOS_POR_REGIME } from '@/lib/project-schema';
import { ConstructionCostCard } from './ConstructionCostCard';

interface CostsStepProps {
  control: Control<ProjectFormData>;
  taxRegime?: string;
  // Project context for AI cost calculation
  projectId?: string;
  uf?: string;
  cidade?: string;
  tipoEmpreendimento?: string;
  padrao?: string;
  prazoMeses?: number;
}

// Descrições dos percentuais
const COST_DESCRIPTIONS: Record<string, { label: string; tooltip: string; base: string }> = {
  comissao_venda: {
    label: 'Comissão de Venda (%)',
    tooltip: 'Percentual sobre o VGV pago aos corretores e imobiliárias. Padrão de mercado: 4–6%.',
    base: 'sobre o VGV',
  },
  gestao_vendas: {
    label: 'Taxa de Gestão de Vendas (%)',
    tooltip: 'Percentual cobrado pela gestora de vendas/incorporadora para coordenar o processo comercial. Padrão: 1–2%.',
    base: 'sobre o VGV',
  },
  marketing: {
    label: 'Marketing e Publicidade (%)',
    tooltip: 'Investimento em divulgação, stand de vendas, material promocional, eventos de lançamento. Padrão: 2–4%.',
    base: 'sobre o VGV',
  },
  administracao: {
    label: 'Taxa de Administração (%)',
    tooltip: 'Custos administrativos da incorporadora: equipe, escritório, jurídico, contabilidade. Padrão: 4–6%.',
    base: 'sobre a receita',
  },
  incorporacao: {
    label: 'Taxa de Incorporação (%)',
    tooltip: 'Remuneração pela atividade de incorporação imobiliária (registro de incorporação, patrimônio de afetação, SPE). Padrão: 1–3%.',
    base: 'sobre a receita',
  },
  engenharia_arquitetura: {
    label: 'Engenharia e Arquitetura (%)',
    tooltip: 'Honorários de coordenação de projetos e gestão de obra (separado do custo de construção). Padrão: 2–4%.',
    base: 'sobre custo de obra',
  },
  impostos: {
    label: 'Impostos e Tributos (%)',
    tooltip: 'Carga tributária sobre a receita bruta. Varia conforme o regime tributário adotado.',
    base: 'sobre a receita',
  },
  outros: {
    label: 'Outros Custos (%)',
    tooltip: 'Demais despesas não categorizadas: cartório, seguros, despachantes, etc.',
    base: 'sobre a receita',
  },
};

export function CostsStep({
  control,
  taxRegime,
  projectId,
  uf,
  cidade,
  tipoEmpreendimento,
  padrao,
  prazoMeses = 24,
}: CostsStepProps) {
  // Auto-fill impostos when tax regime changes
  const impostosDefault = taxRegime ? (IMPOSTOS_POR_REGIME[taxRegime] ?? 8.0) : 8.0;

  return (
    <div className="space-y-6">
      {/* IA Construction Cost — shown when project context is available */}
      {uf && tipoEmpreendimento && padrao && (
        <ConstructionCostCard
          uf={uf}
          cidade={cidade}
          tipoEmpreendimento={tipoEmpreendimento}
          padrao={padrao}
          prazoMeses={prazoMeses}
          projectId={projectId}
        />
      )}

      {/* Custos Diretos */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-primary" />
            Custos Diretos do Projeto
          </CardTitle>
          <CardDescription>
            Custos específicos do empreendimento (aprovações, infraestrutura, projetos técnicos)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ValidatedFormField
              control={control}
              name="approval_costs"
              label="Custos de Aprovação (R$)"
              tooltip="Inclui taxas de prefeitura, licenças ambientais, aprovação de projeto arquitetônico, habite-se, registro de incorporação e demais custos legais."
              description="Taxas, licenças e aprovações legais"
              placeholder="0"
              min={0}
              icon={<FileCheck className="mr-2 h-4 w-4 text-muted-foreground" />}
            />

            <ValidatedFormField
              control={control}
              name="infrastructure_costs"
              label="Infraestrutura (R$)"
              tooltip="Custos com redes de água, esgoto, energia elétrica, pavimentação de vias internas, paisagismo, áreas de lazer e equipamentos comuns."
              description="Redes, pavimentação, áreas comuns"
              placeholder="0"
              min={0}
              icon={<Building2 className="mr-2 h-4 w-4 text-muted-foreground" />}
            />

            <ValidatedFormField
              control={control}
              name="project_costs"
              label="Custos de Projeto (R$)"
              tooltip="Honorários de arquitetura, engenharia estrutural, instalações, consultorias técnicas, sondagem, topografia e demais estudos técnicos."
              description="Arquitetura, engenharia, consultorias"
              placeholder="0"
              min={0}
              icon={<FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />}
            />

            <ValidatedFormField
              control={control}
              name="contingency_percent"
              label="Contingência (%)"
              tooltip="Reserva financeira para cobrir imprevistos durante a obra. Recomenda-se 5% para projetos de baixo risco, 10% para médio risco e até 15% para projetos complexos."
              description="Reserva para imprevistos (recomendado: 5-10%)"
              placeholder="5"
              min={0}
              max={30}
              icon={<Percent className="mr-2 h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custos Configuráveis (DRE) */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Percent className="h-5 w-5 text-primary" />
            Custos Configuráveis — DRE
          </CardTitle>
          <CardDescription className="flex items-start gap-1.5">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
            Percentuais utilizados na DRE do relatório de viabilidade. Ajuste conforme a realidade do seu empreendimento e negociações comerciais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(COST_DESCRIPTIONS).map(([key, desc]) => (
              <ValidatedFormField
                key={key}
                control={control}
                name={`adjustable_costs.${key}` as keyof ProjectFormData}
                label={desc.label}
                tooltip={`${desc.tooltip} Base de cálculo: ${desc.base}.`}
                description={desc.base}
                placeholder={key === 'impostos' ? String(impostosDefault) : undefined}
                min={0}
                max={key === 'impostos' ? 50 : 25}
                icon={<Percent className="mr-2 h-3.5 w-3.5 text-muted-foreground" />}
              />
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs text-amber-700">
              <strong>Nota sobre impostos:</strong> Para o regime {taxRegime === 'ret' ? 'RET' : taxRegime === 'scp' ? 'SCP' : taxRegime === 'lucro_presumido' ? 'Lucro Presumido' : taxRegime === 'lucro_real' ? 'Lucro Real' : 'selecionado'},
              a alíquota sugerida é de {impostosDefault}% sobre a receita bruta. Consulte seu contador para confirmação.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
