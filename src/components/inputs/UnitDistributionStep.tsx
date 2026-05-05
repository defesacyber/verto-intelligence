import { Control, useWatch, Path } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, Home, Check, AlertCircle } from 'lucide-react';
import { ValidatedInput } from './ValidatedInput';
import { cn } from '@/lib/utils';
import { ProjectFormData } from '@/lib/project-schema';

interface UnitDistributionStepProps {
  control: Control<ProjectFormData>;
}

export function UnitDistributionStep({ control }: UnitDistributionStepProps) {
  const unitDistribution = useWatch({ control, name: 'unit_distribution' });
  
  const totalUnits = Object.values(unitDistribution || {}).reduce(
    (sum: number, val) => sum + (Number(val) || 0),
    0
  );

  const hasUnits = totalUnits > 0;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <LayoutGrid className="h-5 w-5 text-primary" />
          Distribuição de Unidades
        </CardTitle>
        <CardDescription>
          Configure a quantidade de unidades por tipologia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[
            { name: 'unit_distribution.studio', label: 'Studio', showIcon: true },
            { name: 'unit_distribution.1q', label: '1 Quarto' },
            { name: 'unit_distribution.2q', label: '2 Quartos' },
            { name: 'unit_distribution.3q', label: '3 Quartos' },
            { name: 'unit_distribution.4q', label: '4+ Quartos' },
          ].map((item) => (
            <FormField
              key={item.name}
              control={control}
              name={item.name as Path<ProjectFormData>}
              render={({ field, fieldState }) => {
                const value = Number(field.value) || 0;
                const hasValue = value > 0;
                const isTouched = fieldState.isTouched || hasValue;
                
                return (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {item.showIcon && <Home className="h-4 w-4 text-muted-foreground" />}
                      {item.label}
                    </FormLabel>
                    <FormControl>
                      <ValidatedInput
                        type="number"
                        placeholder="0"
                        min={0}
                        isValid={hasValue}
                        isTouched={isTouched}
                        showValidation={hasValue}
                        {...field}
                        value={field.value || 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          ))}
        </div>

        <div className={cn(
          "rounded-lg p-4 transition-colors duration-300",
          hasUnits ? "bg-green-500/10 border border-green-500/30" : "bg-muted/50"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Total de Unidades</span>
              {hasUnits ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <span className={cn(
              "text-2xl font-bold transition-colors duration-300",
              hasUnits ? "text-green-500" : "text-primary"
            )}>
              {totalUnits}
            </span>
          </div>
          {!hasUnits && (
            <p className="text-xs text-muted-foreground mt-2">
              Adicione pelo menos uma unidade para continuar
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
