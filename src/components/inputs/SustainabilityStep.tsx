import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Award, TrendingUp } from 'lucide-react';
import { CERTIFICATIONS, SUSTAINABILITY_INITIATIVES } from '@/lib/viability-types';
import { ProjectFormData } from '@/lib/project-schema';

interface SustainabilityStepProps {
  control: Control<ProjectFormData>;
}

export function SustainabilityStep({ control }: SustainabilityStepProps) {
  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-primary" />
            Certificações
          </CardTitle>
          <CardDescription>
            Selecione as certificações que o empreendimento irá buscar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="certifications"
            render={({ field }) => (
              <FormItem>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {CERTIFICATIONS.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-start space-x-3 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(cert.id)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, cert.id]);
                            } else {
                              field.onChange(currentValue.filter((id: string) => id !== cert.id));
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel className="cursor-pointer font-medium">
                          {cert.label}
                        </FormLabel>
                        <FormDescription className="flex items-center gap-1 text-xs">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          +{cert.valorization}% valorização
                        </FormDescription>
                      </div>
                    </div>
                  ))}
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Leaf className="h-5 w-5 text-green-500" />
            Iniciativas de Sustentabilidade
          </CardTitle>
          <CardDescription>
            Selecione as práticas sustentáveis que serão implementadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="sustainability_initiatives"
            render={({ field }) => (
              <FormItem>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {SUSTAINABILITY_INITIATIVES.map((initiative) => (
                    <div
                      key={initiative.id}
                      className="flex items-start space-x-3 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(initiative.id)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, initiative.id]);
                            } else {
                              field.onChange(currentValue.filter((id: string) => id !== initiative.id));
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel className="cursor-pointer font-medium">
                          {initiative.label}
                        </FormLabel>
                        <FormDescription className="flex items-center gap-1 text-xs">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          +{initiative.valorization}% valorização
                        </FormDescription>
                      </div>
                    </div>
                  ))}
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
