/**
 * ConstructionCostCard — Verto Intelligence
 * Exibe e recalcula o custo de obra/m² automaticamente via IA (CUB + INCC + perfil + região).
 * O cliente NÃO alimenta esse valor — a IA calcula com base nos dados do empreendimento.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComposicaoItem {
  descricao: string;
  fator: number;
  resultado: number;
}

interface CalcResult {
  custoM2Base: number;
  custoM2ComBDI: number;
  custoM2Final: number;
  bdi: number;
  cubBase: number;
  fatorPadrao: number;
  fatorTipo: number;
  fatorRegional: number;
  fatorINCC: number;
  composicao: ComposicaoItem[];
  referencias: string[];
  observacoes: string[];
  fonte: 'banco' | 'calculado';
}

interface CalcResponse {
  resultado: CalcResult;
  resumo: {
    custoM2Recomendado: number;
    descricao: string;
    confianca: 'alta' | 'media' | 'baixa';
  };
}

export interface ConstructionCostCardProps {
  uf: string;
  cidade?: string;
  tipoEmpreendimento: string;
  padrao: string;
  prazoMeses?: number;
  projectId?: string;
  onCostCalculated?: (custoM2: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(n);

const CONFIANCA_CONFIG = {
  alta: { label: 'Alta confiança', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  media: { label: 'Confiança média', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Info },
  baixa: { label: 'Baixa confiança', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle },
};

const PADRAO_LABELS: Record<string, string> = {
  baixo: 'Baixo Padrão',
  medio: 'Médio Padrão',
  alto: 'Alto Padrão',
  luxo: 'Luxo',
  economic: 'Econômico',
  standard: 'Padrão',
  high: 'Alto Padrão',
  luxury: 'Luxo',
};

const TIPO_LABELS: Record<string, string> = {
  apartamentos: 'Apartamentos',
  condominio_casas: 'Cond. de Casas',
  condominio_lotes: 'Cond. de Lotes',
  loteamento_aberto: 'Loteamento Aberto',
  residential: 'Residencial',
  commercial: 'Comercial',
  mixed: 'Misto',
  land: 'Terreno',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ConstructionCostCard({
  uf,
  cidade,
  tipoEmpreendimento,
  padrao,
  prazoMeses = 24,
  projectId,
  onCostCalculated,
}: ConstructionCostCardProps) {
  const [result, setResult] = useState<CalcResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const calcular = useCallback(async () => {
    if (!uf || !tipoEmpreendimento || !padrao) {
      setError('Dados do projeto insuficientes para calcular. Preencha cidade, UF, tipo e padrão do empreendimento.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada. Faça login novamente.');

      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/construction-cost-calc`
      );
      if (projectId) url.searchParams.set('projectId', projectId);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          uf: uf.toUpperCase(),
          cidade,
          tipoEmpreendimento,
          padrao,
          prazoMeses,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error || `Erro ${response.status}`);
      }

      const data: CalcResponse = await response.json();
      setResult(data);
      setHasCalculated(true);
      onCostCalculated?.(data.resumo.custoM2Recomendado);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao calcular custo de obra';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [uf, cidade, tipoEmpreendimento, padrao, prazoMeses, projectId, onCostCalculated]);

  // Auto-calcular na primeira montagem se dados completos
  useEffect(() => {
    if (uf && tipoEmpreendimento && padrao && !hasCalculated) {
      calcular();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const confianca = result?.resumo.confianca ?? 'media';
  const ConfIcon = CONFIANCA_CONFIG[confianca].icon;

  return (
    <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Calculator className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Custo de Obra — Calculado pela IA</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  CUB {uf?.toUpperCase()} · INCC · BDI · Fator regional
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {result && (
                <Badge
                  variant="outline"
                  className={`text-xs ${CONFIANCA_CONFIG[confianca].color} flex items-center gap-1`}
                >
                  <ConfIcon className="h-3 w-3" />
                  {CONFIANCA_CONFIG[confianca].label}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={calcular}
                disabled={isLoading}
                className="h-7 text-xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 h-3 w-3" />
                    Recalcular
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error state */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Erro no cálculo</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && !result && (
            <div className="space-y-3 animate-pulse">
              <div className="h-12 rounded-lg bg-muted" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-8 rounded bg-muted" />
                <div className="h-8 rounded bg-muted" />
                <div className="h-8 rounded bg-muted" />
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <>
              {/* Main KPI */}
              <div className="flex items-end justify-between rounded-xl border border-primary/20 bg-white/80 px-5 py-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Custo estimado / m²
                  </p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {fmt(result.resumo.custoM2Recomendado)}
                    <span className="text-base font-normal text-muted-foreground ml-1">/m²</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {TIPO_LABELS[tipoEmpreendimento] ?? tipoEmpreendimento} · {PADRAO_LABELS[padrao] ?? padrao}
                    {cidade ? ` · ${cidade}/${uf?.toUpperCase()}` : ` · ${uf?.toUpperCase()}`}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Sem BDI</p>
                    <p className="text-sm font-semibold">{fmt(result.resultado.custoM2Base)}/m²</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Com BDI ({(result.resultado.bdi * 100).toFixed(0)}%)</p>
                    <p className="text-sm font-semibold">{fmt(result.resultado.custoM2ComBDI)}/m²</p>
                  </div>
                </div>
              </div>

              {/* Fonte */}
              {result.resultado.fonte === 'banco' && (
                <p className="text-xs text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  CUB obtido da base de dados atualizada (maior precisão)
                </p>
              )}

              {/* Breakdown toggle */}
              <button
                type="button"
                onClick={() => setShowBreakdown(v => !v)}
                className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <span className="font-medium">Ver composição detalhada</span>
                {showBreakdown ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showBreakdown && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-white/60 p-3">
                  {/* Composition table */}
                  <div className="space-y-1.5">
                    {result.resultado.composicao.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex-1 pr-2">{item.descricao}</span>
                        <span className="text-muted-foreground w-16 text-center">
                          {item.fator !== 1.0 ? `× ${item.fator.toFixed(3)}` : '—'}
                        </span>
                        <span className="font-medium w-24 text-right">{fmt(item.resultado)}/m²</span>
                      </div>
                    ))}
                  </div>

                  {/* References */}
                  <div className="pt-2 border-t border-border/40 space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">Fontes:</p>
                    {result.resultado.referencias.map((ref, i) => (
                      <p key={i} className="text-xs text-muted-foreground pl-2">• {ref}</p>
                    ))}
                  </div>

                  {/* Observations */}
                  {result.resultado.observacoes.length > 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-1">
                      {result.resultado.observacoes.map((obs, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded p-2">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {obs}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Info note */}
          <p className="text-xs text-muted-foreground border-t border-border/40 pt-3">
            <strong>Por que a IA calcula?</strong> O custo de obra depende de CUB estadual (CBIC), INCC
            acumulado, padrão construtivo e localização regional. Esses dados mudam mensalmente e não devem
            ser estimados manualmente pelo cliente.
          </p>
        </CardContent>
    </Card>
  );
}
