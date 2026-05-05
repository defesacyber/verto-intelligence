/**
 * IDI Ranking Page — Verto Intelligence
 * Dashboard do Índice de Dinâmica Imobiliária por cidade
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, MapPin, BarChart3, Building2, Info, ChevronRight,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IDICity {
  cidade_id: string;
  estado: string;
  score_idi: number;
  score_momentum: number;
  score_volume: number;
  score_absorcao: number;
  score_demanda: number;
  score_macro: number;
  score_esg: number;
  preco_medio_m2: number;
  preco_variacao_12m: number;
  volume_transacoes: number;
  dias_venda_media: number;
  ranking_nacional: number;
  classificacao: { label: string; cor: string };
}

interface IDIRankingResponse {
  ranking: IDICity[];
  total: number;
  periodo: string;
  fonte: string;
}

interface IDIDetalhes extends IDICity {
  componentes: Array<{
    nome: string;
    peso: number;
    score: number;
    descricao: string;
  }>;
  bairros: Array<{ nome: string; score_idi: number; preco_medio_m2: number }>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useIDIRanking(estado: string) {
  return useQuery<IDIRankingResponse>({
    queryKey: ['idi-ranking', estado],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const params = new URLSearchParams({ action: 'ranking', limit: '50' });
      if (estado && estado !== 'todos') params.set('estado', estado);

      const { data, error } = await supabase.functions.invoke('idi-ranking', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: null,
      });

      // Fallback: call via fetch if invoke doesn't support query params
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idi-ranking?${params}`,
        { headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } }
      );
      if (!res.ok) throw new Error('Erro ao carregar ranking IDI');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useIDIDetalhes(cidadeId: string | null) {
  return useQuery<{ detalhes: IDIDetalhes }>({
    queryKey: ['idi-detalhes', cidadeId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idi-ranking?action=detalhes&cidade=${encodeURIComponent(cidadeId!)}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (!res.ok) throw new Error('Erro ao carregar detalhes');
      return res.json();
    },
    enabled: !!cidadeId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const color = score >= 80 ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : score >= 65 ? 'bg-blue-100 text-blue-800 border-blue-200'
    : score >= 50 ? 'bg-amber-100 text-amber-800 border-amber-200'
    : score >= 35 ? 'bg-orange-100 text-orange-800 border-orange-200'
    : 'bg-red-100 text-red-800 border-red-200';

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-bold',
      size === 'lg' ? 'text-2xl px-4 py-1' : 'text-sm px-2.5 py-0.5',
      color
    )}>
      {score.toFixed(0)}
    </span>
  );
}

function ScoreBar({ score, color = 'blue' }: { score: number; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500',
    purple: 'bg-purple-500', orange: 'bg-orange-500', red: 'bg-red-500',
  };
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5">
      <div
        className={cn('h-1.5 rounded-full transition-all', colors[color] ?? 'bg-blue-500')}
        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
      />
    </div>
  );
}

// ─── Componente: Painel de Detalhes ───────────────────────────────────────────

function DetalhesPanel({ cidadeId, onClose }: { cidadeId: string; onClose: () => void }) {
  const { data, isLoading } = useIDIDetalhes(cidadeId);
  const d = data?.detalhes;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!d) return null;

  const componentColors = ['blue', 'emerald', 'purple', 'amber', 'orange', 'red'];

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{d.cidade_id}</CardTitle>
            <p className="text-sm text-slate-500">#{d.ranking_nacional} nacional • {d.estado}</p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreBadge score={d.score_idi} size="lg" />
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4 pb-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Preço Médio m²', value: formatBRL(d.preco_medio_m2) },
            { label: 'Variação 12m', value: `${d.preco_variacao_12m >= 0 ? '+' : ''}${d.preco_variacao_12m.toFixed(1)}%` },
            { label: 'Transações/mês', value: d.volume_transacoes?.toLocaleString('pt-BR') ?? '—' },
            { label: 'Absorção', value: `${d.dias_venda_media} dias` },
          ].map(kpi => (
            <div key={kpi.label} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">{kpi.label}</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Componentes IDI */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Composição do IDI</h4>
          <div className="space-y-3">
            {d.componentes.map((c, i) => (
              <div key={c.nome}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-700">{c.nome}</span>
                    <span className="text-xs text-slate-400">({c.peso}%)</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{c.score.toFixed(0)}</span>
                </div>
                <ScoreBar score={c.score} color={componentColors[i]} />
                <p className="text-xs text-slate-400 mt-0.5">{c.descricao}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top bairros */}
        {d.bairros && d.bairros.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Top Bairros</h4>
            <div className="space-y-1.5">
              {d.bairros.slice(0, 5).map(b => (
                <div key={b.nome} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded">
                  <span className="font-medium text-slate-700">{b.nome}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{formatBRL(b.preco_medio_m2)}/m²</span>
                    <ScoreBadge score={b.score_idi} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function IDIRanking() {
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string | null>(null);

  const { data, isLoading, error } = useIDIRanking(estadoFiltro);
  const ranking = data?.ranking ?? [];

  const estados = [...new Set(ranking.map(c => c.estado))].sort();

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  const classColors: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700',
    blue:    'bg-blue-100 text-blue-700',
    amber:   'bg-amber-100 text-amber-700',
    orange:  'bg-orange-100 text-orange-700',
    red:     'bg-red-100 text-red-700',
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-screen-xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-blue-600" />
              IDI — Índice de Dinâmica Imobiliária
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Score 0–100 que mede o aquecimento do mercado imobiliário por cidade
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                {estados.map(uf => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metodologia */}
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <span className="font-semibold">Metodologia IDI:</span>{' '}
                Momentum de Preços (25%) + Volume de Transações (20%) + Taxa de Absorção (20%) + Demanda Potencial (15%) + Macroeconomia (15%) + ESG (5%).
                Dados: FipeZap, IBGE, BCB, Google Trends.
              </div>
            </div>
          </CardContent>
        </Card>

        <div className={cn('grid gap-6', cidadeSelecionada ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1')}>

          {/* Tabela de ranking */}
          <div className={cn(cidadeSelecionada ? 'lg:col-span-3' : '')}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Ranking Nacional {estadoFiltro !== 'todos' ? `— ${estadoFiltro}` : ''}
                  </CardTitle>
                  {data && (
                    <span className="text-xs text-slate-400">
                      {data.total} cidades • {data.periodo}
                      {data.fonte === 'fallback' && ' (dados de referência)'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : error ? (
                  <div className="p-6 text-center text-red-500 text-sm">Erro ao carregar dados</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 w-10">#</th>
                          <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500">Cidade</th>
                          <th className="text-center py-2 px-4 text-xs font-semibold text-slate-500">IDI</th>
                          <th className="text-center py-2 px-4 text-xs font-semibold text-slate-500 hidden md:table-cell">Situação</th>
                          <th className="text-right py-2 px-4 text-xs font-semibold text-slate-500 hidden lg:table-cell">Preço m²</th>
                          <th className="text-right py-2 px-4 text-xs font-semibold text-slate-500 hidden lg:table-cell">Var. 12m</th>
                          <th className="text-right py-2 px-4 text-xs font-semibold text-slate-500 hidden xl:table-cell">Absorção</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.map((cidade, idx) => {
                          const isSelected = cidadeSelecionada === cidade.cidade_id;
                          const varPositive = cidade.preco_variacao_12m >= 0;
                          return (
                            <tr
                              key={cidade.cidade_id}
                              onClick={() => setCidadeSelecionada(isSelected ? null : cidade.cidade_id)}
                              className={cn(
                                'border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50',
                                isSelected && 'bg-blue-50 hover:bg-blue-50'
                              )}
                            >
                              <td className="py-3 px-4 text-slate-400 text-xs">
                                {idx + 1 <= 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-900">{cidade.cidade_id.split('-')[0]}</div>
                                <div className="text-xs text-slate-400">{cidade.estado}</div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <ScoreBadge score={cidade.score_idi} />
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell text-center">
                                <span className={cn(
                                  'text-xs font-medium px-2 py-0.5 rounded-full',
                                  classColors[cidade.classificacao?.cor ?? 'blue']
                                )}>
                                  {cidade.classificacao?.label ?? '—'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-700 hidden lg:table-cell">
                                {formatBRL(cidade.preco_medio_m2)}/m²
                              </td>
                              <td className="py-3 px-4 text-right hidden lg:table-cell">
                                <span className={cn(
                                  'inline-flex items-center gap-0.5 text-xs font-medium',
                                  varPositive ? 'text-emerald-600' : 'text-red-600'
                                )}>
                                  {varPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                  {Math.abs(cidade.preco_variacao_12m).toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-500 text-xs hidden xl:table-cell">
                                {cidade.dias_venda_media} dias
                              </td>
                              <td className="py-3 px-2">
                                <ChevronRight className={cn(
                                  'w-4 h-4 text-slate-300 transition-transform',
                                  isSelected && 'rotate-90 text-blue-500'
                                )} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {ranking.length === 0 && (
                      <div className="p-12 text-center text-slate-400">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhuma cidade encontrada</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Painel de detalhes */}
          {cidadeSelecionada && (
            <div className="lg:col-span-2">
              <DetalhesPanel
                cidadeId={cidadeSelecionada}
                onClose={() => setCidadeSelecionada(null)}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
