import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  PercentCircle, 
  Building, 
  Banknote,
  Scale,
  Users
} from 'lucide-react';
import { useMacroIndicators } from '@/hooks/useIDIPublicData';

interface IndicatorRowProps {
  icon: React.ReactNode;
  label: string;
  value: number | null | undefined;
  delta?: number | null | undefined;
  suffix?: string;
  description?: string;
  iconBgClass?: string;
  isLoading?: boolean;
}

function IndicatorRow({ 
  icon, 
  label, 
  value, 
  delta, 
  suffix = '%', 
  description,
  iconBgClass = 'bg-primary/10 text-primary',
  isLoading 
}: IndicatorRowProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-3 border-b last:border-0">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    );
  }

  const displayValue = value !== null && value !== undefined 
    ? `${typeof value === 'number' ? value.toFixed(2) : value}${suffix}`
    : '-';

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0 group hover:bg-accent/30 -mx-2 px-2 rounded-lg transition-colors">
      <div className={`p-2.5 rounded-lg ${iconBgClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg">{displayValue}</span>
        {delta !== null && delta !== undefined && (
          <div className="flex items-center gap-0.5">
            {Number(delta) > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : Number(delta) < 0 ? (
              <TrendingDown className="h-4 w-4 text-emerald-500" />
            ) : null}
            {delta !== 0 && (
              <span className={`text-xs font-medium ${Number(delta) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {Number(delta) > 0 ? '+' : ''}{delta}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function MacroDashboardCard() {
  const { data: macro, isLoading, error } = useMacroIndicators();

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Indicadores BCB</CardTitle>
          </div>
          {macro?.data_referencia && (
            <Badge variant="secondary" className="text-xs">
              Ref: {formatDate(macro.data_referencia)}
            </Badge>
          )}
        </div>
        <CardDescription>
          Dados oficiais do Banco Central do Brasil
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Dados temporariamente indisponíveis</p>
            <p className="text-xs mt-1">Tentando reconectar...</p>
          </div>
        ) : (
          <div className="space-y-1">
            <IndicatorRow
              icon={<PercentCircle className="h-5 w-5" />}
              label="Taxa SELIC"
              value={macro?.selic_meta}
              description="Meta anual definida pelo COPOM"
              iconBgClass="bg-orange-500/10 text-orange-600"
              isLoading={isLoading}
            />
            
            <IndicatorRow
              icon={<TrendingUp className="h-5 w-5" />}
              label="IPCA Acumulado"
              value={macro?.ipca_acumulado_12m}
              delta={macro?.ipca_mes}
              description="Inflação oficial - 12 meses"
              iconBgClass="bg-blue-500/10 text-blue-600"
              isLoading={isLoading}
            />
            
            <IndicatorRow
              icon={<Building className="h-5 w-5" />}
              label="INCC Acumulado"
              value={macro?.incc_acumulado_12m}
              delta={macro?.incc_mes}
              description="Custo da construção - 12 meses"
              iconBgClass="bg-violet-500/10 text-violet-600"
              isLoading={isLoading}
            />
            
            <IndicatorRow
              icon={<Scale className="h-5 w-5" />}
              label="IGP-M Acumulado"
              value={macro?.igpm_acumulado_12m}
              delta={macro?.igpm_mes}
              description="Índice geral de preços - 12 meses"
              iconBgClass="bg-emerald-500/10 text-emerald-600"
              isLoading={isLoading}
            />
            
            <IndicatorRow
              icon={<Banknote className="h-5 w-5" />}
              label="Variação PIB"
              value={macro?.pib_variacao_12m}
              description="Crescimento econômico - 12 meses"
              iconBgClass="bg-cyan-500/10 text-cyan-600"
              isLoading={isLoading}
            />
            
            <IndicatorRow
              icon={<Users className="h-5 w-5" />}
              label="Taxa Desemprego"
              value={macro?.taxa_desemprego}
              description="PNAD Contínua - IBGE"
              iconBgClass="bg-amber-500/10 text-amber-600"
              isLoading={isLoading}
            />

            {/* Confidence Indicator */}
            {macro?.confianca_consumidor && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Confiança do Consumidor</span>
                  <span className="text-lg font-bold">{macro.confianca_consumidor.toFixed(1)}</span>
                </div>
                <Progress 
                  value={Math.min(100, macro.confianca_consumidor)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Índice de confiança (0-200)
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
