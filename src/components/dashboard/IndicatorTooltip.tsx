import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, ExternalLink } from 'lucide-react';
import { INDICATOR_FORMULAS } from '@/lib/data-service';

// Interface para uso com indicatorId (busca automática)
interface IndicatorTooltipByIdProps {
  indicatorId: string;
  children: React.ReactNode;
}

// Interface para uso direto com formula/source
interface IndicatorTooltipDirectProps {
  formula: string;
  source: string;
  description?: string;
  sourceUrl?: string;
  children: React.ReactNode;
}

export type IndicatorTooltipProps = IndicatorTooltipByIdProps | IndicatorTooltipDirectProps;

function isDirectProps(props: IndicatorTooltipProps): props is IndicatorTooltipDirectProps {
  return 'formula' in props && 'source' in props;
}

export function IndicatorTooltip(props: IndicatorTooltipProps) {
  const { children } = props;

  // Determina os dados do tooltip
  let formulaData: { name?: string; formula: string; source: string; sourceUrl?: string | null; description?: string } | null = null;

  if (isDirectProps(props)) {
    formulaData = {
      formula: props.formula,
      source: props.source,
      description: props.description,
      sourceUrl: props.sourceUrl,
    };
  } else {
    const formula = INDICATOR_FORMULAS[props.indicatorId];
    if (formula) {
      formulaData = {
        name: formula.name,
        formula: formula.formula,
        source: formula.source,
        sourceUrl: formula.sourceUrl,
      };
    }
  }

  if (!formulaData) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3">
          <div className="space-y-2">
            {formulaData.name && (
              <p className="font-medium text-sm">{formulaData.name}</p>
            )}
            <div className="text-xs space-y-1">
              {formulaData.description && (
                <p className="text-muted-foreground">{formulaData.description}</p>
              )}
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Fórmula:</span> {formulaData.formula}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Fonte:</span> {formulaData.source}
              </p>
            </div>
            {formulaData.sourceUrl && (
              <a
                href={formulaData.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ver fonte <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente simplificado para uso inline
interface FormulaHintProps {
  formula: string;
  source: string;
  sourceUrl?: string | null;
}

export function FormulaHint({ formula, source, sourceUrl }: FormulaHintProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3">
          <div className="space-y-2">
            <div className="text-xs space-y-1">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Fórmula:</span> {formula}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Fonte:</span> {source}
              </p>
            </div>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ver fonte <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
