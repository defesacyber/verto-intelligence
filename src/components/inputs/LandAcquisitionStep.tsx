import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, DollarSign, Users, Clock, Check } from 'lucide-react';
import { FieldTooltip } from './FieldTooltip';
import { ValidatedFormField } from './ValidatedFormField';
import { cn } from '@/lib/utils';
import { ProjectFormData } from '@/lib/project-schema';

interface LandAcquisitionStepProps {
  control: Control<ProjectFormData>;
  watchAcquisitionType: string | null;
}

export function LandAcquisitionStep({ control, watchAcquisitionType }: LandAcquisitionStepProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Aquisição do Terreno
        </CardTitle>
        <CardDescription>
          Defina como o terreno será adquirido para o empreendimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name="land_acquisition_type"
          render={({ field, fieldState }) => {
            const hasValue = field.value !== null && field.value !== '';
            const isTouched = fieldState.isTouched || hasValue;
            
            return (
              <FormItem>
                <FormLabel className="flex items-center">
                  Tipo de Aquisição
                  <FieldTooltip content="Compra Direta: pagamento integral pelo terreno. Permuta: troca de unidades do empreendimento pelo terreno. Usufruto: direito de uso temporário do terreno." />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger className={cn(
                      "transition-colors duration-200",
                      isTouched && hasValue && "border-green-500",
                      isTouched && !hasValue && "border-destructive"
                    )}>
                      <div className="flex items-center justify-between w-full">
                        <SelectValue placeholder="Selecione o tipo de aquisição" />
                        {isTouched && hasValue && (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        )}
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-popover border border-border z-50">
                    <SelectItem value="compra">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Compra Direta
                      </div>
                    </SelectItem>
                    <SelectItem value="permuta">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Permuta
                      </div>
                    </SelectItem>
                    <SelectItem value="usufruto">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Usufruto
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Escolha como o terreno será incorporado ao projeto
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {watchAcquisitionType === 'compra' && (
          <ValidatedFormField
            control={control}
            name="land_cost"
            label="Valor do Terreno (R$)"
            tooltip="Valor total de compra do terreno, incluindo todas as taxas e impostos de transferência (ITBI, escritura, registro)."
            description="Valor total de aquisição do terreno"
            placeholder="0"
            min={0}
          />
        )}

        {watchAcquisitionType === 'permuta' && (
          <ValidatedFormField
            control={control}
            name="permuta_units"
            label="Unidades em Permuta"
            tooltip="Número de unidades que serão entregues ao proprietário do terreno como pagamento. Essas unidades não entrarão no VGV vendável do projeto."
            description="Quantidade de unidades a serem entregues ao proprietário do terreno"
            placeholder="0"
            min={0}
          />
        )}

        {watchAcquisitionType === 'usufruto' && (
          <ValidatedFormField
            control={control}
            name="usufruto_years"
            label="Anos de Usufruto"
            tooltip="Período durante o qual você terá direito de uso do terreno sem ser proprietário. Após esse período, o terreno volta ao proprietário original."
            description="Período de usufruto acordado com o proprietário"
            placeholder="0"
            min={0}
          />
        )}
      </CardContent>
    </Card>
  );
}
