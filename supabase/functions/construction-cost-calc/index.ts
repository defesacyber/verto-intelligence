/**
 * Construction Cost Calculator — Verto Intelligence
 * Calcula automaticamente o custo de construção por m² sem entrada do cliente.
 * Usa: CUB do estado, INCC, padrão do empreendimento, tipo, localização regional.
 *
 * O cliente NÃO alimenta o custo de obra — a IA calcula.
 */

import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ─── CUB base por UF (R$/m² — referência mai/2026, atualizar via BCB/CBIC) ──────
// Fonte: CBIC — Câmara Brasileira da Indústria da Construção
const CUB_BASE_UF: Record<string, number> = {
  SP: 2_389, RJ: 2_180, MG: 2_045, RS: 2_198, PR: 2_142, SC: 2_251,
  DF: 2_312, GO: 1_980, BA: 1_890, CE: 1_850, PE: 1_870, AM: 1_980,
  PA: 1_820, ES: 2_080, MT: 1_950, MS: 1_960, RN: 1_810, PB: 1_790,
  SE: 1_780, AL: 1_750, MA: 1_720, PI: 1_700, TO: 1_740, AC: 1_680,
  RO: 1_750, RR: 1_690, AP: 1_670,
};

const CUB_DEFAULT = 2_000; // fallback nacional

// ─── Fatores multiplicadores por padrão ───────────────────────────────────────
// CUB base = residencial padrão normal (R8-N)
const FATOR_PADRAO: Record<string, number> = {
  baixo:   0.75,  // Residencial Econômico
  medio:   1.00,  // Residencial Normal (base CUB)
  alto:    1.35,  // Residencial Alto Padrão
  luxo:    1.80,  // Residencial Luxo / Super Alto
  // legados
  economic: 0.75,
  standard: 1.00,
  high:     1.35,
  luxury:   1.80,
};

// ─── Fatores por tipo de empreendimento ──────────────────────────────────────
const FATOR_TIPO: Record<string, number> = {
  apartamentos:       1.00,  // Multi-familiar padrão
  condominio_casas:   0.90,  // Casas em série — melhor escala
  condominio_lotes:   0.25,  // Lotes: infra + muros (muito menos construção)
  loteamento_aberto:  0.18,  // Loteamento: só infraestrutura viária
  residential:        1.00,
  commercial:         1.15,  // Comercial tem acabamento mais caro
  mixed:              1.05,
  land:               0.20,
};

// ─── Fator regional (custo relativo ao CUB do estado) ────────────────────────
// Cidades com custo acima da média estadual
const FATOR_CIDADE: Record<string, number> = {
  'São Paulo':        1.12,
  'Rio de Janeiro':   1.08,
  'Florianópolis':    1.10,
  'Brasília':         1.05,
  'Manaus':           1.15,  // Zona Franca — logística cara
  'Curitiba':         1.02,
  'Belo Horizonte':   1.02,
  'Porto Alegre':     1.03,
  'Goiânia':          0.98,
  'Salvador':         0.97,
  'Fortaleza':        0.96,
  'Recife':           0.97,
};

// ─── INCC acumulado (estimado) ────────────────────────────────────────────────
// Fonte: FGV IBRE — INCC-M acumulado 12 meses
const INCC_ACUMULADO_12M = 0.062; // 6.2% ao ano (estimativa mai/2026)

// ─── Fator BDI (Bonificação e Despesas Indiretas) ────────────────────────────
const BDI_POR_PADRAO: Record<string, number> = {
  baixo:   0.18,
  medio:   0.20,
  alto:    0.22,
  luxo:    0.25,
  economic: 0.18,
  standard: 0.20,
  high:    0.22,
  luxury:  0.25,
};

// ─── Cálculo principal ────────────────────────────────────────────────────────

interface CalcInput {
  uf: string;
  cidade?: string;
  tipoEmpreendimento: string;
  padrao: string;
  prazoMeses?: number; // para estimar correção INCC
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
  composicao: Array<{ descricao: string; fator: number; resultado: number }>;
  referencias: string[];
  observacoes: string[];
  fonte: 'banco' | 'calculado';
}

function calcularCustoObra(input: CalcInput): CalcResult {
  const { uf, cidade, tipoEmpreendimento, padrao, prazoMeses = 24 } = input;

  // 1. CUB base do estado
  const cubBase = CUB_BASE_UF[uf?.toUpperCase()] ?? CUB_DEFAULT;

  // 2. Fator padrão
  const fPadrao = FATOR_PADRAO[padrao] ?? 1.0;

  // 3. Fator tipo de empreendimento
  const fTipo = FATOR_TIPO[tipoEmpreendimento] ?? 1.0;

  // 4. Fator regional (cidade)
  const cidadeKey = Object.keys(FATOR_CIDADE).find(
    c => cidade?.toLowerCase().includes(c.toLowerCase())
  );
  const fRegional = cidadeKey ? FATOR_CIDADE[cidadeKey] : 1.0;

  // 5. Custo base por m² (sem BDI)
  const custoM2Base = cubBase * fPadrao * fTipo * fRegional;

  // 6. BDI
  const bdi = BDI_POR_PADRAO[padrao] ?? 0.20;
  const custoM2ComBDI = custoM2Base * (1 + bdi);

  // 7. Fator INCC — corrige para o período de obra (metade do prazo)
  const anosObra = (prazoMeses / 12) / 2; // incc incide gradualmente
  const fINCC = Math.pow(1 + INCC_ACUMULADO_12M, anosObra);
  const custoM2Final = Math.round(custoM2ComBDI * fINCC / 10) * 10; // arredonda p/ R$10

  // Composição detalhada
  const composicao = [
    { descricao: `CUB ${uf?.toUpperCase()} (base mai/2026)`, fator: 1.0, resultado: cubBase },
    { descricao: `Fator padrão (${padrao})`, fator: fPadrao, resultado: cubBase * fPadrao },
    { descricao: `Fator tipo (${tipoEmpreendimento})`, fator: fTipo, resultado: cubBase * fPadrao * fTipo },
    { descricao: `Fator regional (${cidade ?? uf})`, fator: fRegional, resultado: custoM2Base },
    { descricao: `BDI (${(bdi * 100).toFixed(0)}%)`, fator: 1 + bdi, resultado: custoM2ComBDI },
    { descricao: `Correção INCC (${(INCC_ACUMULADO_12M * 100).toFixed(1)}%a.a. × ${anosObra.toFixed(1)}a)`, fator: fINCC, resultado: custoM2Final },
  ];

  const referencias = [
    `CUB ${uf?.toUpperCase()}: R$ ${cubBase.toLocaleString('pt-BR')}/m² (CBIC mai/2026)`,
    `INCC-M acumulado 12 meses: ${(INCC_ACUMULADO_12M * 100).toFixed(1)}% (FGV IBRE mai/2026)`,
    `BDI adotado para padrão ${padrao}: ${(bdi * 100).toFixed(0)}%`,
  ];

  const observacoes: string[] = [];
  if (tipoEmpreendimento === 'condominio_lotes' || tipoEmpreendimento === 'loteamento_aberto') {
    observacoes.push('Para loteamentos/condomínios de lotes, o custo representa apenas infraestrutura viária, drenagem, água e esgoto. Não inclui construção de casas.');
  }
  if (fPadrao >= 1.35) {
    observacoes.push('Empreendimentos de alto padrão e luxo têm maior variabilidade no custo final — recomenda-se orçamento específico com construtora parceira.');
  }
  if (!FATOR_CIDADE[cidadeKey ?? '']) {
    observacoes.push(`Não há fator regional específico para ${cidade ?? uf}. Usando média estadual do ${uf?.toUpperCase()}.`);
  }

  return {
    custoM2Base: Math.round(custoM2Base),
    custoM2ComBDI: Math.round(custoM2ComBDI),
    custoM2Final,
    bdi,
    cubBase,
    fatorPadrao: fPadrao,
    fatorTipo: fTipo,
    fatorRegional: fRegional,
    fatorINCC: fINCC,
    composicao,
    referencias,
    observacoes,
    fonte: 'calculado',
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req.headers.get('origin'));

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Unauthorized', 401, corsHeaders);

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return errorResponse('Unauthorized', 401, corsHeaders);

    let body: CalcInput;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Body JSON inválido', 400, corsHeaders);
    }

    const { uf, cidade, tipoEmpreendimento, padrao, prazoMeses } = body;

    if (!uf || !tipoEmpreendimento || !padrao) {
      return errorResponse('Campos obrigatórios: uf, tipoEmpreendimento, padrao', 400, corsHeaders);
    }

    // Tentar buscar CUB atualizado do banco (se tiver integração com BCB/CBIC)
    const { data: cubDB } = await supabase
      .from('idi_macro_dados')
      .select('cub_m2')
      .eq('cidade_id', `${cidade ?? uf}-${uf}`.replace(/\s/g, '_'))
      .maybeSingle();

    const result = calcularCustoObra({ uf, cidade, tipoEmpreendimento, padrao, prazoMeses });

    // Sobrescrever CUB com dado do banco se disponível
    if (cubDB?.cub_m2) {
      result.cubBase = parseFloat(cubDB.cub_m2);
      result.fonte = 'banco';
    }

    // Salvar resultado no project_inputs se projectId informado
    const projectId = new URL(req.url).searchParams.get('projectId');
    if (projectId) {
      await supabase
        .from('project_inputs')
        .update({
          construction_cost_m2_calculated: result.custoM2Final,
          construction_cost_source: result.fonte,
        })
        .eq('project_id', projectId);
    }

    return jsonResponse({
      resultado: result,
      resumo: {
        custoM2Recomendado: result.custoM2Final,
        descricao: `R$ ${result.custoM2Final.toLocaleString('pt-BR')}/m² — ${tipoEmpreendimento} padrão ${padrao} em ${cidade ?? uf}`,
        confianca: cubDB?.cub_m2 ? 'alta' : 'media',
      },
    }, corsHeaders);

  } catch (err) {
    console.error('construction-cost-calc error:', err);
    return errorResponse('Erro interno no cálculo', 500, {});
  }
});
