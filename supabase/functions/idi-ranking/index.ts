/**
 * IDI Ranking Edge Function — Verto Intelligence
 * Ações: ranking, detalhes, tendencias, comparar, heatmap, filtros
 */

import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ─── IDI Score labels ────────────────────────────────────────────────────────

function classificarIDI(score: number): { label: string; cor: string } {
  if (score >= 80) return { label: 'Aquecido', cor: 'emerald' };
  if (score >= 65) return { label: 'Dinâmico', cor: 'blue' };
  if (score >= 50) return { label: 'Moderado', cor: 'amber' };
  if (score >= 35) return { label: 'Estável', cor: 'orange' };
  return { label: 'Desacelerado', cor: 'red' };
}

// ─── Fallback IDI data (usado quando tabela ainda não tem dados) ──────────────

const IDI_FALLBACK: Record<string, {
  score_idi: number; score_momentum: number; score_volume: number;
  score_absorcao: number; score_demanda: number; score_macro: number; score_esg: number;
  preco_medio_m2: number; preco_variacao_12m: number; volume_transacoes: number;
  dias_venda_media: number; ranking_nacional: number; estado: string;
}> = {
  'Florianópolis-SC': { score_idi: 84, score_momentum: 88, score_volume: 82, score_absorcao: 85, score_demanda: 80, score_macro: 78, score_esg: 90, preco_medio_m2: 12800, preco_variacao_12m: 6.2, volume_transacoes: 1840, dias_venda_media: 38, ranking_nacional: 1, estado: 'SC' },
  'São Paulo-SP':     { score_idi: 81, score_momentum: 82, score_volume: 88, score_absorcao: 78, score_demanda: 85, score_macro: 80, score_esg: 68, preco_medio_m2: 12500, preco_variacao_12m: 5.2, volume_transacoes: 12500, dias_venda_media: 45, ranking_nacional: 2, estado: 'SP' },
  'Curitiba-PR':      { score_idi: 78, score_momentum: 80, score_volume: 75, score_absorcao: 80, score_demanda: 76, score_macro: 74, score_esg: 82, preco_medio_m2: 9800, preco_variacao_12m: 5.5, volume_transacoes: 3200, dias_venda_media: 42, ranking_nacional: 3, estado: 'PR' },
  'Brasília-DF':      { score_idi: 75, score_momentum: 72, score_volume: 70, score_absorcao: 78, score_demanda: 74, score_macro: 82, score_esg: 65, preco_medio_m2: 11200, preco_variacao_12m: 4.2, volume_transacoes: 2100, dias_venda_media: 48, ranking_nacional: 4, estado: 'DF' },
  'Campinas-SP':      { score_idi: 74, score_momentum: 76, score_volume: 70, score_absorcao: 74, score_demanda: 72, score_macro: 76, score_esg: 70, preco_medio_m2: 8900, preco_variacao_12m: 4.8, volume_transacoes: 2800, dias_venda_media: 44, ranking_nacional: 5, estado: 'SP' },
  'Belo Horizonte-MG':{ score_idi: 70, score_momentum: 68, score_volume: 72, score_absorcao: 70, score_demanda: 70, score_macro: 68, score_esg: 72, preco_medio_m2: 8200, preco_variacao_12m: 4.0, volume_transacoes: 3800, dias_venda_media: 52, ranking_nacional: 6, estado: 'MG' },
  'Goiânia-GO':       { score_idi: 72, score_momentum: 74, score_volume: 68, score_absorcao: 72, score_demanda: 70, score_macro: 66, score_esg: 68, preco_medio_m2: 6500, preco_variacao_12m: 5.8, volume_transacoes: 2200, dias_venda_media: 46, ranking_nacional: 7, estado: 'GO' },
  'Rio de Janeiro-RJ':{ score_idi: 68, score_momentum: 65, score_volume: 72, score_absorcao: 68, score_demanda: 68, score_macro: 64, score_esg: 62, preco_medio_m2: 10800, preco_variacao_12m: 4.8, volume_transacoes: 5200, dias_venda_media: 58, ranking_nacional: 8, estado: 'RJ' },
  'Fortaleza-CE':     { score_idi: 66, score_momentum: 68, score_volume: 62, score_absorcao: 66, score_demanda: 64, score_macro: 62, score_esg: 64, preco_medio_m2: 7200, preco_variacao_12m: 4.2, volume_transacoes: 1900, dias_venda_media: 55, ranking_nacional: 9, estado: 'CE' },
  'Salvador-BA':      { score_idi: 64, score_momentum: 62, score_volume: 60, score_absorcao: 64, score_demanda: 65, score_macro: 60, score_esg: 66, preco_medio_m2: 7500, preco_variacao_12m: 3.8, volume_transacoes: 1700, dias_venda_media: 60, ranking_nacional: 10, estado: 'BA' },
  'Recife-PE':        { score_idi: 64, score_momentum: 65, score_volume: 60, score_absorcao: 64, score_demanda: 62, score_macro: 60, score_esg: 64, preco_medio_m2: 7800, preco_variacao_12m: 4.0, volume_transacoes: 1600, dias_venda_media: 58, ranking_nacional: 11, estado: 'PE' },
  'Porto Alegre-RS':  { score_idi: 62, score_momentum: 58, score_volume: 64, score_absorcao: 62, score_demanda: 60, score_macro: 62, score_esg: 68, preco_medio_m2: 8500, preco_variacao_12m: 3.2, volume_transacoes: 2100, dias_venda_media: 62, ranking_nacional: 12, estado: 'RS' },
  'Manaus-AM':        { score_idi: 58, score_momentum: 55, score_volume: 56, score_absorcao: 58, score_demanda: 60, score_macro: 56, score_esg: 52, preco_medio_m2: 5800, preco_variacao_12m: 3.5, volume_transacoes: 980, dias_venda_media: 70, ranking_nacional: 13, estado: 'AM' },
  'Natal-RN':         { score_idi: 58, score_momentum: 60, score_volume: 54, score_absorcao: 58, score_demanda: 58, score_macro: 55, score_esg: 60, preco_medio_m2: 6800, preco_variacao_12m: 3.8, volume_transacoes: 820, dias_venda_media: 65, ranking_natal: 14, ranking_nacional: 14, estado: 'RN' },
  'Maceió-AL':        { score_idi: 54, score_momentum: 52, score_volume: 50, score_absorcao: 54, score_demanda: 56, score_macro: 52, score_esg: 55, preco_medio_m2: 6200, preco_variacao_12m: 3.5, volume_transacoes: 680, dias_venda_media: 72, ranking_nacional: 15, estado: 'AL' },
};

// ─── Handler ─────────────────────────────────────────────────────────────────

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

    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? 'ranking';

    // ─── POST body ────────────────────────────────────────────────────────
    let body: Record<string, unknown> = {};
    if (req.method === 'POST') {
      try { body = await req.json(); } catch { /* empty body ok */ }
    }

    switch (action) {

      // ── ranking: lista cidades ordenadas por IDI ───────────────────────
      case 'ranking': {
        const estado = url.searchParams.get('estado') ?? body.estado as string ?? null;
        const tipo = url.searchParams.get('tipo') ?? body.tipo as string ?? null;
        const limit = parseInt(url.searchParams.get('limit') ?? '50');
        const periodo = url.searchParams.get('periodo') ?? new Date().toISOString().slice(0, 7);

        let query = supabase
          .from('idi_ranking')
          .select('*')
          .eq('periodo', periodo)
          .order('score_idi', { ascending: false })
          .limit(limit);

        if (estado) query = query.eq('estado', estado);
        if (tipo) query = query.eq('tipo_imovel', tipo);

        const { data, error } = await query;

        // Se banco vazio, usar fallback
        const ranking = (data && data.length > 0)
          ? data.map((r: Record<string, unknown>) => ({ ...r, classificacao: classificarIDI(r.score_idi as number) }))
          : Object.entries(IDI_FALLBACK)
              .filter(([, d]) => !estado || d.estado === estado)
              .sort(([, a], [, b]) => b.score_idi - a.score_idi)
              .slice(0, limit)
              .map(([cidade_id, d]) => ({
                cidade_id,
                periodo,
                tipo_imovel: tipo ?? 'residencial',
                ...d,
                classificacao: classificarIDI(d.score_idi),
              }));

        if (error) console.warn('idi_ranking query error (using fallback):', error.message);

        return jsonResponse({ ranking, total: ranking.length, periodo, fonte: (data && data.length > 0) ? 'banco' : 'fallback' }, corsHeaders);
      }

      // ── detalhes: breakdown completo de uma cidade ─────────────────────
      case 'detalhes': {
        const cidadeId = url.searchParams.get('cidade') ?? body.cidade as string;
        if (!cidadeId) return errorResponse('cidade obrigatório', 400, corsHeaders);

        const periodo = url.searchParams.get('periodo') ?? new Date().toISOString().slice(0, 7);

        const { data: rankingData } = await supabase
          .from('idi_ranking')
          .select('*')
          .eq('cidade_id', cidadeId)
          .eq('periodo', periodo)
          .maybeSingle();

        const { data: bairrosData } = await supabase
          .from('idi_bairros')
          .select('*')
          .eq('cidade_id', cidadeId)
          .order('score_idi', { ascending: false })
          .limit(10);

        const { data: macroData } = await supabase
          .from('idi_macro_dados')
          .select('*')
          .eq('cidade_id', cidadeId)
          .maybeSingle();

        // Fallback
        const fallback = IDI_FALLBACK[cidadeId];
        const ranking = rankingData ?? (fallback ? { cidade_id: cidadeId, periodo, ...fallback } : null);

        if (!ranking) return errorResponse(`Cidade "${cidadeId}" não encontrada`, 404, corsHeaders);

        const detalhes = {
          ...ranking,
          classificacao: classificarIDI(ranking.score_idi),
          componentes: [
            { nome: 'Momentum de Preços', peso: 25, score: ranking.score_momentum, descricao: 'Variação de preço m² nos últimos 12 meses (FipeZap)' },
            { nome: 'Volume de Transações', peso: 20, score: ranking.score_volume, descricao: 'Número de negócios realizados no mercado primário' },
            { nome: 'Taxa de Absorção', peso: 20, score: ranking.score_absorcao, descricao: `${ranking.dias_venda_media} dias para venda — absorção do estoque disponível` },
            { nome: 'Demanda Potencial', peso: 15, score: ranking.score_demanda, descricao: 'Google Trends + migração populacional + renda crescente' },
            { nome: 'Macroeconomia', peso: 15, score: ranking.score_macro, descricao: 'PIB regional, emprego, crédito imobiliário (BCB), INCC' },
            { nome: 'ESG / Risco Climático', peso: 5, score: ranking.score_esg, descricao: 'Infraestrutura verde, áreas de risco, sustentabilidade' },
          ],
          bairros: bairrosData ?? [],
          macro: macroData ?? null,
        };

        return jsonResponse({ detalhes }, corsHeaders);
      }

      // ── tendencias: histórico de IDI de uma cidade ─────────────────────
      case 'tendencias': {
        const cidadeId = url.searchParams.get('cidade') ?? body.cidade as string;
        if (!cidadeId) return errorResponse('cidade obrigatório', 400, corsHeaders);
        const meses = parseInt(url.searchParams.get('meses') ?? '12');

        const { data, error } = await supabase
          .from('idi_historico')
          .select('*')
          .eq('cidade_id', cidadeId)
          .order('periodo', { ascending: true })
          .limit(meses);

        if (error) return errorResponse(error.message, 500, corsHeaders);

        return jsonResponse({ tendencias: data ?? [], cidade_id: cidadeId }, corsHeaders);
      }

      // ── comparar: compara múltiplas cidades lado a lado ────────────────
      case 'comparar': {
        const cidadesParam = url.searchParams.get('cidades') ?? body.cidades as string;
        if (!cidadesParam) return errorResponse('cidades obrigatório (CSV ou array)', 400, corsHeaders);

        const cidades: string[] = typeof cidadesParam === 'string'
          ? cidadesParam.split(',').map(c => c.trim())
          : (cidadesParam as string[]);

        const periodo = url.searchParams.get('periodo') ?? new Date().toISOString().slice(0, 7);

        const { data: rankingData } = await supabase
          .from('idi_ranking')
          .select('*')
          .in('cidade_id', cidades)
          .eq('periodo', periodo);

        // Completar com fallback para cidades não encontradas no banco
        const result = cidades.map(cidadeId => {
          const fromDB = rankingData?.find((r: Record<string, unknown>) => r.cidade_id === cidadeId);
          const fromFallback = IDI_FALLBACK[cidadeId];
          const dados = fromDB ?? (fromFallback ? { cidade_id: cidadeId, periodo, ...fromFallback } : null);
          if (!dados) return null;
          return { ...dados, classificacao: classificarIDI(dados.score_idi) };
        }).filter(Boolean);

        return jsonResponse({ comparacao: result, periodo }, corsHeaders);
      }

      // ── heatmap: todos os pontos para mapa ────────────────────────────
      case 'heatmap': {
        const periodo = url.searchParams.get('periodo') ?? new Date().toISOString().slice(0, 7);
        const { data, error } = await supabase
          .from('idi_ranking')
          .select('cidade_id, estado, score_idi, preco_medio_m2, ranking_nacional')
          .eq('periodo', periodo)
          .order('score_idi', { ascending: false });

        if (error || !data || data.length === 0) {
          // Fallback
          const heatmap = Object.entries(IDI_FALLBACK).map(([cidade_id, d]) => ({
            cidade_id,
            estado: d.estado,
            score_idi: d.score_idi,
            preco_medio_m2: d.preco_medio_m2,
            ranking_nacional: d.ranking_nacional,
            classificacao: classificarIDI(d.score_idi),
          }));
          return jsonResponse({ heatmap, periodo, fonte: 'fallback' }, corsHeaders);
        }

        const heatmap = data.map((r: Record<string, unknown>) => ({ ...r, classificacao: classificarIDI(r.score_idi as number) }));
        return jsonResponse({ heatmap, periodo, fonte: 'banco' }, corsHeaders);
      }

      // ── filtros: retorna opções disponíveis para filtros ───────────────
      case 'filtros': {
        const { data: estados } = await supabase
          .from('idi_ranking')
          .select('estado')
          .not('estado', 'is', null);

        const { data: periodos } = await supabase
          .from('idi_ranking')
          .select('periodo')
          .order('periodo', { ascending: false })
          .limit(24);

        const estadosUnicos = [...new Set((estados ?? []).map((e: Record<string, unknown>) => e.estado as string))].sort();
        const periodosUnicos = [...new Set((periodos ?? []).map((p: Record<string, unknown>) => p.periodo as string))];

        // Fallback se banco vazio
        const estadosFinal = estadosUnicos.length > 0
          ? estadosUnicos
          : [...new Set(Object.values(IDI_FALLBACK).map(d => d.estado))].sort();

        return jsonResponse({
          estados: estadosFinal,
          periodos: periodosUnicos.length > 0 ? periodosUnicos : [new Date().toISOString().slice(0, 7)],
          tipos: ['residencial', 'comercial', 'industrial', 'misto'],
        }, corsHeaders);
      }

      default:
        return errorResponse(`Ação desconhecida: ${action}`, 400, corsHeaders);
    }

  } catch (err) {
    console.error('idi-ranking error:', err);
    return errorResponse('Erro interno', 500, {});
  }
});
