import { Progress } from '@/components/ui/progress';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepProgress {
  id: string;
  title: string;
  filledFields: number;
  totalFields: number;
}

interface StepProgressIndicatorProps {
  steps: StepProgress[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export function StepProgressIndicator({
  steps,
  currentStep,
  onStepClick,
}: StepProgressIndicatorProps) {
  const totalFilled = steps.reduce((sum, s) => sum + s.filledFields, 0);
  const totalFields = steps.reduce((sum, s) => sum + s.totalFields, 0);
  const overallProgress = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Progresso Total</span>
          <span className="text-sm font-bold text-primary">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          {totalFilled} de {totalFields} campos preenchidos
        </p>
      </div>

      {/* Step Progress */}
      <div className="grid gap-2">
        {steps.map((step, index) => {
          const percentage = step.totalFields > 0
            ? Math.round((step.filledFields / step.totalFields) * 100)
            : 0;
          const isComplete = percentage === 100;
          const isCurrent = index === currentStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(index)}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:bg-accent/50',
                isCurrent && 'border-primary bg-primary/5',
                isComplete && !isCurrent && 'border-green-500/30 bg-green-500/5',
                !isCurrent && !isComplete && 'border-border'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                  isComplete && 'bg-green-500 text-white',
                  isCurrent && !isComplete && 'bg-primary text-primary-foreground',
                  !isCurrent && !isComplete && 'bg-muted text-muted-foreground'
                )}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    'text-sm font-medium truncate',
                    isCurrent && 'text-primary'
                  )}>
                    {step.title}
                  </span>
                  <span className={cn(
                    'text-xs shrink-0',
                    isComplete ? 'text-green-500 font-medium' : 'text-muted-foreground'
                  )}>
                    {step.filledFields}/{step.totalFields}
                  </span>
                </div>
                <div className="mt-1.5">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        isComplete ? 'bg-green-500' : 'bg-primary'
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
