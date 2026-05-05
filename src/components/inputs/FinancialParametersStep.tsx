import { Control } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Calendar, TrendingUp, Clock, Percent } from 'lucide-react';
import { ValidatedFormField } from './ValidatedFormField';
import { ProjectFormData } from '@/lib/project-schema';

interface FinancialParametersStepProps {
  control: Control<ProjectFormData>;
}

export function FinancialParametersStep({ control }: FinancialParametersStepProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-primary" />
          Parâmetros Financeiros
        </CardTitle>
        <CardDescription>
          Configure as taxas e prazos para a análise de viabilidade
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <ValidatedFormField
            control={control}
            name="launch_date"
            label="Data de Lançamento"
            tooltip="Data prevista para início das vendas. A partir desta data, o sistema calculará o fluxo de caixa considerando a velocidade de vendas definida."
            description="Previsão de início das vendas"
            type="date"
            icon={<Calendar className="mr-2 h-4 w-4 text-muted-foreground" />}
          />

          <ValidatedFormField
            control={control}
            name="construction_months"
            label="Prazo de Construção (meses)"
            tooltip="Duração total da obra, desde o início até a entrega das chaves. Inclui fundação, estrutura, acabamento e habite-se."
            description="Duração estimada da obra"
            placeholder="24"
            min={6}
            max={60}
            icon={<Clock className="mr-2 h-4 w-4 text-muted-foreground" />}
          />

          <ValidatedFormField
            control={control}
            name="sales_velocity"
            label="Velocidade de Vendas (% ao mês)"
            tooltip="Percentual do estoque total vendido por mês. Exemplo: 10% significa que em 10 meses todo o estoque estará vendido. Mercados aquecidos: 8-15%. Mercados normais: 3-7%."
            description="Percentual do estoque vendido por mês"
            placeholder="10"
            min={1}
            max={100}
            icon={<TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />}
          />

          <ValidatedFormField
            control={control}
            name="discount_rate"
            label="Taxa de Desconto (% a.a.)"
            tooltip="Taxa usada para calcular o Valor Presente Líquido (VPL). Representa o custo de oportunidade do capital. Geralmente usa-se a SELIC + prêmio de risco (12-18% a.a.)."
            description="Taxa para cálculo do VPL"
            placeholder="15"
            min={1}
            max={50}
            icon={<Percent className="mr-2 h-4 w-4 text-muted-foreground" />}
          />

          <ValidatedFormField
            control={control}
            name="financing_rate"
            label="Taxa de Financiamento (% a.a.)"
            tooltip="Custo efetivo do capital emprestado para financiar a construção. Inclui juros do financiamento bancário ou custo de capital próprio. Atualmente varia entre 10-14% a.a. para incorporação."
            description="Custo do capital para o projeto"
            placeholder="12"
            min={1}
            max={30}
            className="md:col-span-2"
            icon={<Percent className="mr-2 h-4 w-4 text-muted-foreground" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}
