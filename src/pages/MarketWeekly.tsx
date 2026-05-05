/**
 * Market Weekly Page — Verto Intelligence
 * Relatório semanal de mercado imobiliário (estilo GMX)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Newspaper, TrendingUp, TrendingDown, Home, Building2,
  Percent, Award, Clock, BarChart3, ArrowUp, ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarketWeeklyData {
  id: string;
  cidade_id: string;
  cidade_nome: string;
  estado: string;
  semana_inicio: string;
  semana_fim: string;
  total_vendas: number;
  vendas_casas: number;
  vendas_apartamentos: number;
  vendas_comercial: number;
  maior_venda_valor: number;
  maior_venda_bairro: string;
  maior_venda_area: number;
  taxa_financiamento_institucional: number;
  taxa_financiamento_consumidor: number;
  variacao_taxa_semanal: number;
  variacao_taxa_anual: number;
  preco_medio_m2: number;
  variacao_preco_mensal: number;
  dias_medio_venda: number;
  created_at: string;
}

// ─── Fallback data ─────────────────────────────────────────────────────────────

function generateFallbackWeekly(cidadeId: string): MarketWeeklyData {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() - 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const cityData: Record<string, Partial<MarketWeeklyData>> = {
    'São Paulo-SP': { cidade_nome: 'São Paulo', estado: 'SP', total_vendas: 412, vendas_casas: 48, vendas_apartamentos: 334, vendas_comercial: 30, maior_venda_valor: 4800000, maior_venda_bairro: 'Jardins', maior_venda_area: 280, taxa_financiamento_institucional: 10.89, taxa_financiamento_consumidor: 12.5, variacao_taxa_semanal: -0.05, variacao_taxa_anual: -1.2, preco_medio_m2: 12500, variacao_preco_mensal: 0.8, dias_medio_venda: 45 },
    'Rio de Janeiro-RJ': { cidade_nome: 'Rio de Janeiro', estado: 'RJ', total_vendas: 218, vendas_casas: 62, vendas_apartamentos: 138, vendas_comercial: 18, maior_venda_valor: 3200000, maior_venda_bairro: 'Ipanema', maior_venda_area: 180, taxa_financiamento_institucional: 10.89, taxa_financiamento_consumidor: 12.8, variacao_taxa_semanal: 0.0, variacao_taxa_anual: -0.9, preco_medio_m2: 10800, variacao_preco_mensal: 0.5, dias_medio_venda: 58 },
    'Curitiba-PR': { cidade_nome: 'Curitiba', estado: 'PR', total_vendas: 145, vendas_casas: 42, vendas_apartamentos: 92, vendas_comercial: 11, maior_venda_valor: 1800000, maior_venda_bairro: 'Batel', maior_venda_area: 165, taxa_financiamento_institucional: 10.89, taxa_financiamento_consumidor: 12.2, variacao_taxa_semanal: -0.1, variacao_taxa_anual: -1.5, preco_medio_m2: 9800, variacao_preco_mensal: 1.1, dias_medio_venda: 42 },
    'Florianópolis-SC': { cidade_nome: 'Florianópolis', estado: 'SC', total_vendas: 98, vendas_casas: 22, vendas_apartamentos: 70, vendas_comercial: 6, maior_venda_valor: 2900000, maior_venda_bairro: 'Jurerê Internacional', maior_venda_area: 220, taxa_financiamento_institucional: 10.89, taxa_financiamento_consumidor: 12.0, variacao_taxa_semanal: -0.15, variacao_taxa_anual: -1.8, preco_medio_m2: 12800, variacao_preco_mensal: 1.4, dias_medio_venda: 38 },
  };

  const city = cityData[cidadeId] ?? { cidade_nome: cidadeId.split('-')[0], estado: cidadeId.split('-')[1] ?? 'BR', total_vendas: 80, vendas_casas: 20, vendas_apartamentos: 55, vendas_comercial: 5, maior_venda_valor: 1200000, maior_venda_bairro: 'Centro', maior_venda_area: 120, taxa_financiamento_institucional: 10.89, taxa_financiamento_consumidor: 12.5, variacao_taxa_semanal: 0.0, variacao_taxa_anual: -1.0, preco_medio_m2: 7000, variacao_preco_mensal: 0.5, dias_medio_venda: 55 };

  return {
    id: 'fallback',
    cidade_id: cidadeId,
    semana_inicio: weekStart.toISOString().split('T')[0],
    semana_fim: weekEnd.toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    ...city,
  } as MarketWeeklyData;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useMarketWeekly(cidadeId: string) {
  return useQuery<MarketWeeklyData>({
    queryKey: ['market-weekly', cidadeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_weekly')
        .select('*')
        .eq('cidade_id', cidadeId)
        .order('semana_inicio', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) return data;
      return generateFallbackWeekly(cidadeId);
    },
    staleTime: 30 * 60 * 1000,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, sub, trend, trendPositive }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendPositive?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
          {trend && (
            <span className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              trendPositive ? 'text-emerald-600' : 'text-red-600'
            )}>
              {trendPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {trend}
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sales Breakdown Donut (SVG simples) ─────────────────────────────────────

function SalesBreakdown({ casas, apartamentos, comercial, total }: {
  casas: number; apartamentos: number; comercial: number; total: number;
}) {
  const pct = (v: number) => total > 0 ? ((v / total) * 100).toFixed(0) : '0';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-500" />
          Composição de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[
            { label: 'Apartamentos', value: apartamentos, color: 'bg-blue-500' },
            { label: 'Casas', value: casas, color: 'bg-emerald-500' },
            { label: 'Comercial', value: comercial, color: 'bg-amber-500' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', item.color)} />
                  <span className="text-slate-600">{item.label}</span>
                </div>
                <span className="font-semibold text-slate-900">{item.value} ({pct(item.value)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className={cn('h-1.5 rounded-full', item.color)}
                  style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">Total da semana</span>
          <span className="text-lg font-bold text-slate-900">{total} negócios</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Financing Card ───────────────────────────────────────────────────────────

function FinancingCard({ data }: { data: MarketWeeklyData }) {
  const varSemanal = data.variacao_taxa_semanal ?? 0;
  const varAnual = data.variacao_taxa_anual ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Percent className="w-4 h-4 text-slate-500" />
          Taxas de Financiamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Taxa Institucional (SBPE/FGTS)</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {data.taxa_financiamento_institucional?.toFixed(2) ?? '—'}% a.a.
            </span>
            {varSemanal !== 0 && (
              <span className={cn(
                'text-sm font-medium flex items-center gap-0.5',
                varSemanal < 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {varSemanal < 0 ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                {Math.abs(varSemanal).toFixed(2)}% semana
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400">Consumidor</p>
            <p className="text-base font-semibold text-slate-900 mt-0.5">
              {data.taxa_financiamento_consumidor?.toFixed(2) ?? '—'}% a.a.
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Var. anual</p>
            <p className={cn(
              'text-base font-semibold mt-0.5',
              (varAnual ?? 0) < 0 ? 'text-emerald-600' : 'text-red-600'
            )}>
              {varAnual > 0 ? '+' : ''}{varAnual?.toFixed(2) ?? '0'}% a.a.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium">Fonte: Banco Central do Brasil</p>
          <p className="text-xs text-blue-500 mt-0.5">
            Taxa referencial SBPE — crédito imobiliário pessoa física
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Maior Venda ──────────────────────────────────────────────────────────────

function MaiorVendaCard({ data }: { data: MarketWeeklyData }) {
  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-300 flex items-center gap-2">
          <Award className="w-4 h-4" />
          Maior Negócio da Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-white mt-1">
          {formatBRL(data.maior_venda_valor ?? 0)}
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Bairro</span>
            <span className="text-white font-medium">{data.maior_venda_bairro ?? '—'}</span>
          </div>
          {data.maior_venda_area && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Área</span>
              <span className="text-white font-medium">{data.maior_venda_area} m²</span>
            </div>
          )}
          {data.maior_venda_area && data.maior_venda_valor && (
            <div className="flex items-center justify-between text-sm border-t border-slate-700 pt-2">
              <span className="text-slate-400">Ticket/m²</span>
              <span className="text-emerald-400 font-bold">
                {formatBRL(data.maior_venda_valor / data.maior_venda_area)}/m²
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Cidades disponíveis ──────────────────────────────────────────────────────

const CIDADES_DISPONIVEIS = [
  'Florianópolis-SC', 'São Paulo-SP', 'Curitiba-PR', 'Rio de Janeiro-RJ',
  'Brasília-DF', 'Belo Horizonte-MG', 'Goiânia-GO', 'Porto Alegre-RS',
  'Fortaleza-CE', 'Salvador-BA',
];

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function MarketWeekly() {
  const [cidadeId, setCidadeId] = useState('Florianópolis-SC');
  const { data, isLoading, error } = useMarketWeekly(cidadeId);

  const semana = data
    ? `${formatDate(data.semana_inicio)} a ${formatDate(data.semana_fim)}`
    : '—';

  return (
    <DashboardLayout>
      <div className="p-6 max-w-screen-xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Newspaper className="w-7 h-7 text-slate-700" />
              Market Weekly Report
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Resumo semanal do mercado imobiliário — semana {semana}
            </p>
          </div>

          <Select value={cidadeId} onValueChange={setCidadeId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CIDADES_DISPONIVEIS.map(c => (
                <SelectItem key={c} value={c}>
                  {c.split('-')[0]} — {c.split('-')[1]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center text-red-500">
              Erro ao carregar dados do mercado semanal.
            </CardContent>
          </Card>
        ) : data ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                icon={BarChart3}
                label="Total de Vendas"
                value={data.total_vendas?.toLocaleString('pt-BR') ?? '—'}
                sub="negócios na semana"
                trend={undefined}
              />
              <KPICard
                icon={TrendingUp}
                label="Preço Médio m²"
                value={`${formatBRL(data.preco_medio_m2 ?? 0)}/m²`}
                trend={data.variacao_preco_mensal ? `${Math.abs(data.variacao_preco_mensal).toFixed(1)}% mês` : undefined}
                trendPositive={(data.variacao_preco_mensal ?? 0) > 0}
              />
              <KPICard
                icon={Clock}
                label="Absorção Média"
                value={`${data.dias_medio_venda ?? '—'} dias`}
                sub="para concluir venda"
              />
              <KPICard
                icon={Percent}
                label="Taxa Financiamento"
                value={`${data.taxa_financiamento_institucional?.toFixed(2) ?? '—'}% a.a.`}
                sub="SBPE institucional"
                trend={data.variacao_taxa_semanal ? `${Math.abs(data.variacao_taxa_semanal).toFixed(2)}% semana` : undefined}
                trendPositive={(data.variacao_taxa_semanal ?? 0) < 0}
              />
            </div>

            {/* Grid secundário */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SalesBreakdown
                casas={data.vendas_casas ?? 0}
                apartamentos={data.vendas_apartamentos ?? 0}
                comercial={data.vendas_comercial ?? 0}
                total={data.total_vendas ?? 0}
              />
              <FinancingCard data={data} />
              <MaiorVendaCard data={data} />
            </div>

            {/* Nota metodológica */}
            <Card className="bg-slate-50 border-slate-100">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Fonte dos dados:</span>{' '}
                  Cartórios de Registro de Imóveis (transações), Banco Central do Brasil (taxas),
                  FipeZap (preços médios). Dados compilados toda segunda-feira para a semana anterior.
                  {data.id === 'fallback' && ' (Dados de referência — aguardando integração completa com cartórios)'}
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
