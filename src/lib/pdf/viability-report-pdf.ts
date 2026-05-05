/**
 * Viability Report PDF Generator — Verto Intelligence
 * Gera PDF completo de viabilidade com DRE, fluxo de caixa,
 * sensibilidade, SWOT, concorrentes e benchmarks de mercado.
 */

import type { jsPDF as JsPDF } from 'jspdf';
import { getPdfBase, addFooter } from './pdf-template';
import type {
  AnaliseViabilidadeCompleta,
  ProjectInputForReport,
  DRELine,
  FluxoCaixaPeriodo,
  SensibilidadeScenario,
} from '../engine/report-engine';
import { gerarAnaliseCompleta, formatBRL, formatPct } from '../engine/report-engine';

// ─── Tipos adicionais ────────────────────────────────────────────────────────

export interface Competitor {
  nome: string;
  tipo: 'direto' | 'indireto' | 'potencial';
  precoMin?: number;
  precoMax?: number;
  diferencial?: string;
}

export interface SWOTData {
  forcas: string[];
  fraquezas: string[];
  oportunidades: string[];
  ameacas: string[];
}

export interface MarketIndicators {
  precoMedioM2?: number;
  precoVariacao12m?: number;
  diasVendaMedia?: number;
  idiScore?: number;
  idiClassificacao?: string;
}

export interface FullReportOptions {
  input: ProjectInputForReport;
  swot?: SWOTData;
  competitors?: Competitor[];
  market?: MarketIndicators;
  observacoes?: string;
}

// ─── Cores e constantes ──────────────────────────────────────────────────────

const C = {
  slate900: [15, 23, 42] as [number, number, number],
  slate800: [30, 41, 59] as [number, number, number],
  slate600: [71, 85, 105] as [number, number, number],
  slate400: [148, 163, 184] as [number, number, number],
  slate200: [226, 232, 240] as [number, number, number],
  slate50:  [248, 250, 252] as [number, number, number],
  white:    [255, 255, 255] as [number, number, number],
  emerald:  [16, 185, 129] as [number, number, number],
  emeraldLight: [209, 250, 229] as [number, number, number],
  red:      [239, 68, 68] as [number, number, number],
  redLight: [254, 226, 226] as [number, number, number],
  amber:    [245, 158, 11] as [number, number, number],
  amberLight: [254, 243, 199] as [number, number, number],
  blue:     [59, 130, 246] as [number, number, number],
  blueLight: [219, 234, 254] as [number, number, number],
  purple:   [139, 92, 246] as [number, number, number],
  purpleLight: [237, 233, 254] as [number, number, number],
};

const MARGIN = 14;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Utilitários de desenho ──────────────────────────────────────────────────

function setColor(doc: JsPDF, rgb: [number, number, number], type: 'fill' | 'text' | 'draw' = 'text') {
  if (type === 'fill') doc.setFillColor(...rgb);
  else if (type === 'draw') doc.setDrawColor(...rgb);
  else doc.setTextColor(...rgb);
}

function sectionHeader(doc: JsPDF, title: string, y: number): number {
  setColor(doc, C.slate900, 'fill');
  doc.roundedRect(MARGIN, y, CONTENT_W, 9, 1, 1, 'F');
  setColor(doc, C.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), MARGIN + 4, y + 6.2);
  return y + 13;
}

function checkPageBreak(doc: JsPDF, y: number, needed = 20, pageH = 297): number {
  if (y + needed > pageH - 25) {
    doc.addPage();
    return 20;
  }
  return y;
}

function kpiCard(doc: JsPDF, x: number, y: number, w: number, h: number, label: string, value: string, sublabel?: string, color: [number, number, number] = C.slate50) {
  setColor(doc, color, 'fill');
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  setColor(doc, C.slate200, 'draw');
  doc.setDrawColor(...C.slate200);
  doc.roundedRect(x, y, w, h, 2, 2, 'S');

  setColor(doc, C.slate600);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(label, x + w / 2, y + 5.5, { align: 'center' });

  setColor(doc, C.slate900);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(value, x + w / 2, y + 12, { align: 'center' });

  if (sublabel) {
    setColor(doc, C.slate400);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(sublabel, x + w / 2, y + 16.5, { align: 'center' });
  }
}

// ─── Seção: Capa / Sumário Executivo ────────────────────────────────────────

function addCoverPage(doc: JsPDF, input: ProjectInputForReport, analise: AnaliseViabilidadeCompleta): void {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Background escuro no topo
  setColor(doc, C.slate900, 'fill');
  doc.rect(0, 0, pw, 80, 'F');

  // Marca
  setColor(doc, C.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Verto Intelligence', MARGIN, 28);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setColor(doc, C.slate400);
  doc.text('Inteligência Imobiliária', MARGIN, 36);

  // Título do relatório
  setColor(doc, C.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Viabilidade Econômico-Financeira', MARGIN, 52);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  setColor(doc, C.slate400);
  doc.text(input.nome, MARGIN, 61);

  // Data e local
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFontSize(9);
  doc.text(`${input.cidade} – ${input.estado} | ${hoje}`, MARGIN, 71);

  // ─── KPIs principais ────────────────────────────────────────────
  let y = 92;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor(doc, C.slate900);
  doc.text('Sumário Executivo', MARGIN, y);
  y += 8;

  const kpiW = (CONTENT_W - 12) / 4;
  const kpiH = 22;
  const gap = 4;

  kpiCard(doc, MARGIN,                  y, kpiW, kpiH, 'VGV Total',         formatBRL(analise.vgvTotal), undefined, C.slate50);
  kpiCard(doc, MARGIN + kpiW + gap,     y, kpiW, kpiH, 'Custo Total',       formatBRL(analise.custoTotalEmpreendimento), undefined, C.slate50);
  kpiCard(doc, MARGIN + (kpiW+gap)*2,   y, kpiW, kpiH, 'Lucro Líquido',     formatBRL(analise.lucroLiquido), undefined, analise.lucroLiquido >= 0 ? C.emeraldLight : C.redLight);
  kpiCard(doc, MARGIN + (kpiW+gap)*3,   y, kpiW, kpiH, 'ROI',               `${analise.roi.toFixed(1)}%`, `Sobre custo total`, analise.roi >= 25 ? C.emeraldLight : analise.roi >= 15 ? C.amberLight : C.redLight);

  y += kpiH + 6;
  kpiCard(doc, MARGIN,                  y, kpiW, kpiH, 'Margem Bruta',      `${analise.margemBruta.toFixed(1)}%`, undefined, C.slate50);
  kpiCard(doc, MARGIN + kpiW + gap,     y, kpiW, kpiH, 'Margem Líquida',    `${analise.margemLiquida.toFixed(1)}%`, undefined, C.slate50);
  kpiCard(doc, MARGIN + (kpiW+gap)*2,   y, kpiW, kpiH, 'Capital Necessário',formatBRL(analise.necessidadeCapital), `Pico: ${analise.picoNegativo}`, C.slate50);
  kpiCard(doc, MARGIN + (kpiW+gap)*3,   y, kpiW, kpiH, 'Prazo',             `${input.prazoMeses} meses`, `${(input.prazoMeses/12).toFixed(1)} anos`, C.slate50);

  y += kpiH + 14;

  // Características do empreendimento
  y = sectionHeader(doc, '📋 Características do Empreendimento', y);

  const cols = [
    ['Tipo',         input.tipoImovel],
    ['Unidades',     `${input.unidades} un`],
    ['Área Privativa', `${input.areaPrivativa} m²/un`],
    ['Ticket Médio', formatBRL(input.precoVendaUnitario)],
    ['Público-Alvo', input.publicoAlvo],
    ['Localização',  `${input.bairro ? input.bairro + ', ' : ''}${input.cidade} – ${input.estado}`],
    ...(input.areaTerreno ? [['Área Terreno', `${input.areaTerreno.toLocaleString('pt-BR')} m²`]] : []),
    ...(input.pavimentos ? [['Pavimentos', `${input.pavimentos}`]] : []),
  ];

  const halfLen = Math.ceil(cols.length / 2);
  cols.forEach(([label, value], i) => {
    const col = i < halfLen ? 0 : 1;
    const row = i < halfLen ? i : i - halfLen;
    const cx = MARGIN + col * (CONTENT_W / 2);
    const cy = y + row * 7;

    setColor(doc, C.slate600);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${label}:`, cx, cy);

    setColor(doc, C.slate900);
    doc.setFont('helvetica', 'bold');
    doc.text(value, cx + 36, cy);
  });

  y += halfLen * 7 + 8;

  // Benchmark CDI
  if (analise.benchmarkMercado) {
    setColor(doc, C.blueLight, 'fill');
    doc.roundedRect(MARGIN, y, CONTENT_W, 14, 2, 2, 'F');
    setColor(doc, C.blue);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Benchmark CDI:', MARGIN + 4, y + 5.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, C.slate900);
    doc.text(`${analise.benchmarkMercado.rentabilidadeEquivalente} → ROI do projeto: ${analise.roi.toFixed(1)}%`, MARGIN + 35, y + 5.5);
    setColor(doc, C.slate600);
    doc.setFontSize(7.5);
    doc.text(analise.benchmarkMercado.avaliacao, MARGIN + 4, y + 11);
    y += 20;
  }
}

// ─── Seção: DRE ──────────────────────────────────────────────────────────────

function addDRESection(doc: JsPDF, dre: AnaliseViabilidadeCompleta['dre'], startY: number): number {
  let y = checkPageBreak(doc, startY, 100);
  y = sectionHeader(doc, '📊 Demonstrativo de Resultados — DRE', y);

  // Cabeçalho da tabela
  setColor(doc, C.slate800, 'fill');
  doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
  setColor(doc, C.white);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Descrição', MARGIN + 3, y + 5);
  doc.text('Valor (R$)', MARGIN + CONTENT_W - 42, y + 5, { align: 'right' });
  doc.text('% Receita', MARGIN + CONTENT_W - 2, y + 5, { align: 'right' });
  y += 7;

  const rowH = 7;
  let stripe = false;

  for (const linha of dre.linhas) {
    y = checkPageBreak(doc, y, rowH + 2);

    const isResult = linha.tipo === 'resultado';
    const bgColor = isResult
      ? (linha.bold && linha.descricao.includes('LUCRO')
          ? (linha.valor >= 0 ? C.emeraldLight : C.redLight)
          : C.slate200)
      : (stripe ? C.slate50 : C.white);

    setColor(doc, bgColor, 'fill');
    doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');

    const valColor = linha.valor < 0 ? C.red : (isResult ? C.emerald : C.slate900);
    const indent = (linha.bold || isResult) ? 3 : 8;

    setColor(doc, linha.bold ? C.slate900 : C.slate600);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', linha.bold ? 'bold' : 'normal');
    doc.text(linha.descricao, MARGIN + indent, y + 5);

    setColor(doc, valColor);
    doc.setFont('helvetica', linha.bold ? 'bold' : 'normal');
    doc.text(formatBRL(linha.valor), MARGIN + CONTENT_W - 42, y + 5, { align: 'right' });

    setColor(doc, C.slate600);
    doc.setFont('helvetica', 'normal');
    doc.text(`${linha.percentualReceita.toFixed(1)}%`, MARGIN + CONTENT_W - 2, y + 5, { align: 'right' });

    y += rowH;
    if (!isResult && !linha.bold) stripe = !stripe;
  }

  // Linha separadora
  setColor(doc, C.slate200, 'draw');
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 6;

  return y;
}

// ─── Seção: Fluxo de Caixa ───────────────────────────────────────────────────

function addFluxoCaixaSection(doc: JsPDF, fluxo: FluxoCaixaPeriodo[], startY: number): number {
  let y = checkPageBreak(doc, startY, 60);
  y = sectionHeader(doc, '💰 Fluxo de Caixa Projetado', y);

  // Cabeçalho
  setColor(doc, C.slate800, 'fill');
  doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
  setColor(doc, C.white);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');

  const cols = ['Período', 'Recebimentos', 'Desembolsos', 'Fluxo Líquido', 'Fluxo Acumulado'];
  const widths = [40, 35, 35, 35, 37];
  let cx = MARGIN + 3;
  cols.forEach((col, i) => {
    doc.text(col, cx, y + 5, { align: i === 0 ? 'left' : 'right' });
    cx += widths[i];
  });
  y += 7;

  fluxo.forEach((periodo, idx) => {
    y = checkPageBreak(doc, y, 8);

    setColor(doc, idx % 2 === 0 ? C.slate50 : C.white, 'fill');
    doc.rect(MARGIN, y, CONTENT_W, 8, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');

    let cx2 = MARGIN + 3;
    const values = [
      { text: periodo.periodo, align: 'left' as const, color: C.slate900, bold: true },
      { text: formatBRL(periodo.recebimentos), align: 'right' as const, color: C.emerald, bold: false },
      { text: `(${formatBRL(periodo.desembolsos)})`, align: 'right' as const, color: C.red, bold: false },
      { text: formatBRL(periodo.fluxoLiquido), align: 'right' as const, color: periodo.fluxoLiquido >= 0 ? C.emerald : C.red, bold: false },
      { text: formatBRL(periodo.fluxoAcumulado), align: 'right' as const, color: periodo.fluxoAcumulado >= 0 ? C.emerald : C.red, bold: true },
    ];

    values.forEach((v, i) => {
      setColor(doc, v.color);
      doc.setFont('helvetica', v.bold ? 'bold' : 'normal');
      doc.text(v.text, v.align === 'left' ? cx2 : cx2 + widths[i] - 3, y + 5.5, { align: v.align });
      cx2 += widths[i];
    });

    y += 8;
  });

  y += 6;
  return y;
}

// ─── Seção: Análise de Sensibilidade ────────────────────────────────────────

function addSensibilidadeSection(doc: JsPDF, sensibilidade: SensibilidadeScenario[], startY: number): number {
  let y = checkPageBreak(doc, startY, 80);
  y = sectionHeader(doc, '📈 Análise de Sensibilidade — Variação no Preço de Venda', y);

  // Cabeçalho
  setColor(doc, C.slate800, 'fill');
  doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
  setColor(doc, C.white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');

  const cols = ['Cenário', 'Preço Unit.', 'VGV Total', 'Lucro Líquido', 'ROI', 'Margem', 'Classificação'];
  const widths = [28, 26, 30, 30, 16, 18, 34];
  let cx = MARGIN + 3;
  cols.forEach((col, i) => {
    doc.text(col, i === 0 ? cx : cx + widths[i] - 2, y + 5, { align: i === 0 ? 'left' : 'right' });
    cx += widths[i];
  });
  y += 7;

  const classColors: Record<string, [number, number, number]> = {
    excepcional: C.emerald,
    excelente: C.blue,
    viavel: C.slate600,
    limite: C.amber,
    inviavel: C.red,
  };

  const classLabel: Record<string, string> = {
    excepcional: '★ Excepcional',
    excelente: '✓ Excelente',
    viavel: '✓ Viável',
    limite: '⚠ Limite',
    inviavel: '✗ Inviável',
  };

  sensibilidade.forEach((s, idx) => {
    y = checkPageBreak(doc, y, 8);

    const isBase = s.nome === 'Base';
    const bg: [number, number, number] = isBase ? C.amberLight : (idx % 2 === 0 ? C.slate50 : C.white);
    setColor(doc, bg, 'fill');
    doc.rect(MARGIN, y, CONTENT_W, 8, 'F');

    doc.setFontSize(7);

    let cx2 = MARGIN + 3;
    const items = [
      { text: s.nome, align: 'left' as const, bold: isBase },
      { text: formatBRL(s.precoUnitario), align: 'right' as const, bold: false },
      { text: formatBRL(s.vgvTotal), align: 'right' as const, bold: false },
      { text: formatBRL(s.lucroLiquido), align: 'right' as const, bold: false, color: s.lucroLiquido >= 0 ? C.emerald : C.red },
      { text: `${s.roi.toFixed(1)}%`, align: 'right' as const, bold: isBase },
      { text: `${s.margemLiquida.toFixed(1)}%`, align: 'right' as const, bold: false },
      { text: classLabel[s.classificacao], align: 'right' as const, bold: true, color: classColors[s.classificacao] },
    ];

    items.forEach((item, i) => {
      const col = item as typeof item & { color?: [number, number, number] };
      setColor(doc, col.color ?? C.slate900);
      doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
      doc.text(item.text, item.align === 'left' ? cx2 : cx2 + widths[i] - 2, y + 5.5, { align: item.align });
      cx2 += widths[i];
    });

    y += 8;
  });

  y += 6;
  return y;
}

// ─── Seção: Velocidade de Vendas ─────────────────────────────────────────────

function addVelocidadeSection(doc: JsPDF, vel: AnaliseViabilidadeCompleta['velocidadeVendas'], unidades: number, startY: number): number {
  let y = checkPageBreak(doc, startY, 55);
  y = sectionHeader(doc, '🏃 Velocidade de Vendas — Meta 90 Dias', y);

  const cenarios = [
    { label: 'Conservador', data: vel.meta90Dias.conservador, vgv: vel.vgvPorCenario.conservador, color: C.amber },
    { label: 'Base',        data: vel.meta90Dias.base,        vgv: vel.vgvPorCenario.base,        color: C.blue },
    { label: 'Otimista',    data: vel.meta90Dias.otimista,    vgv: vel.vgvPorCenario.otimista,    color: C.emerald },
  ];

  const cardW = (CONTENT_W - 8) / 3;
  const cardH = 32;

  cenarios.forEach((c, i) => {
    const cx = MARGIN + i * (cardW + 4);

    // Barra colorida no topo
    setColor(doc, c.color, 'fill');
    doc.roundedRect(cx, y, cardW, 4, 1, 1, 'F');

    setColor(doc, C.slate50, 'fill');
    doc.roundedRect(cx, y + 3, cardW, cardH, 1, 1, 'F');
    setColor(doc, C.slate200, 'draw');
    doc.roundedRect(cx, y + 3, cardW, cardH, 1, 1, 'S');

    setColor(doc, C.slate900);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(c.label, cx + cardW / 2, y + 12, { align: 'center' });

    setColor(doc, c.color);
    doc.setFontSize(16);
    doc.text(`${c.data.percentual}%`, cx + cardW / 2, y + 22, { align: 'center' });

    setColor(doc, C.slate600);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${c.data.unidades} de ${unidades} unidades`, cx + cardW / 2, y + 28, { align: 'center' });

    setColor(doc, C.slate900);
    doc.setFontSize(7);
    doc.text(formatBRL(c.vgv), cx + cardW / 2, y + 33, { align: 'center' });
  });

  y += cardH + 10;

  // Ticket médio
  setColor(doc, C.slate50, 'fill');
  doc.roundedRect(MARGIN, y, CONTENT_W, 10, 1, 1, 'F');
  setColor(doc, C.slate600);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Ticket Médio por Unidade:', MARGIN + 4, y + 7);
  setColor(doc, C.slate900);
  doc.setFont('helvetica', 'bold');
  doc.text(formatBRL(vel.ticketMedio), MARGIN + 55, y + 7);

  y += 16;
  return y;
}

// ─── Seção: Validação CUB ────────────────────────────────────────────────────

function addCUBSection(doc: JsPDF, cub: AnaliseViabilidadeCompleta['validacaoCUB'], startY: number): number {
  if (!cub) return startY;
  let y = checkPageBreak(doc, startY, 30);
  y = sectionHeader(doc, '🏗️ Validação de Custos — CUB', y);

  const isAbove = cub.diferencaPercentual > 0;
  const bgColor = Math.abs(cub.diferencaPercentual) > 20
    ? (isAbove ? C.redLight : C.amberLight)
    : C.emeraldLight;

  setColor(doc, bgColor, 'fill');
  doc.roundedRect(MARGIN, y, CONTENT_W, 22, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(doc, C.slate900);
  doc.text(`CUB de Referência: ${formatBRL(cub.cubReferencia)}/m²`, MARGIN + 4, y + 7);
  doc.text(`Custo Adotado: ${formatBRL(cub.custoAdotado)}/m²`, MARGIN + 80, y + 7);
  doc.text(`Diferença: ${isAbove ? '+' : ''}${cub.diferencaPercentual.toFixed(1)}%`, MARGIN + 145, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setColor(doc, C.slate600);
  const justLines = doc.splitTextToSize(cub.justificativa, CONTENT_W - 8);
  doc.text(justLines, MARGIN + 4, y + 14);

  y += 28;
  return y;
}

// ─── Seção: SWOT ─────────────────────────────────────────────────────────────

function addSWOTSection(doc: JsPDF, swot: SWOTData, startY: number): number {
  let y = checkPageBreak(doc, startY, 80);
  y = sectionHeader(doc, '🎯 Análise SWOT', y);

  const halfW = (CONTENT_W - 4) / 2;
  const quadH = 50;
  const gap = 4;

  const quadrants = [
    { label: 'Forças', icon: '💪', items: swot.forcas, x: MARGIN, y: y, color: C.emeraldLight, titleColor: C.emerald },
    { label: 'Fraquezas', icon: '⚠️', items: swot.fraquezas, x: MARGIN + halfW + gap, y: y, color: C.redLight, titleColor: C.red },
    { label: 'Oportunidades', icon: '🚀', items: swot.oportunidades, x: MARGIN, y: y + quadH + gap, color: C.blueLight, titleColor: C.blue },
    { label: 'Ameaças', icon: '🛡️', items: swot.ameacas, x: MARGIN + halfW + gap, y: y + quadH + gap, color: C.amberLight, titleColor: C.amber },
  ];

  quadrants.forEach(q => {
    y = checkPageBreak(doc, q.y, quadH + gap + 10);

    setColor(doc, q.color, 'fill');
    doc.roundedRect(q.x, q.y, halfW, quadH, 2, 2, 'F');

    setColor(doc, q.titleColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${q.label}`, q.x + 4, q.y + 7);

    setColor(doc, C.slate900);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    let iy = q.y + 13;
    for (const item of q.items.slice(0, 5)) {
      if (iy > q.y + quadH - 4) break;
      const lines = doc.splitTextToSize(`• ${item}`, halfW - 8);
      doc.text(lines[0], q.x + 4, iy);
      iy += 6.5;
    }
  });

  y = y + quadH * 2 + gap * 3;
  return y;
}

// ─── Seção: Concorrentes ─────────────────────────────────────────────────────

function addCompetitorsSection(doc: JsPDF, competitors: Competitor[], startY: number): number {
  if (!competitors.length) return startY;
  let y = checkPageBreak(doc, startY, 50);
  y = sectionHeader(doc, '🏢 Análise de Concorrência', y);

  // Cabeçalho
  setColor(doc, C.slate800, 'fill');
  doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
  setColor(doc, C.white);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');

  const cols = ['Empreendimento', 'Tipo', 'Preço Mín.', 'Preço Máx.', 'Diferencial'];
  const widths = [45, 22, 28, 28, 59];
  let cx = MARGIN + 3;
  cols.forEach((col, i) => {
    doc.text(col, i === 0 ? cx : cx + widths[i] - 2, y + 5, { align: i === 0 ? 'left' : 'right' });
    cx += widths[i];
  });
  y += 7;

  const tipoColors: Record<string, [number, number, number]> = {
    direto: C.red,
    indireto: C.amber,
    potencial: C.blue,
  };
  const tipoLabel: Record<string, string> = {
    direto: 'Direto',
    indireto: 'Indireto',
    potencial: 'Potencial',
  };

  competitors.forEach((c, idx) => {
    y = checkPageBreak(doc, y, 8);

    setColor(doc, idx % 2 === 0 ? C.slate50 : C.white, 'fill');
    doc.rect(MARGIN, y, CONTENT_W, 8, 'F');

    doc.setFontSize(7.5);
    let cx2 = MARGIN + 3;

    setColor(doc, C.slate900);
    doc.setFont('helvetica', 'bold');
    doc.text(c.nome, cx2, y + 5.5);
    cx2 += widths[0];

    setColor(doc, tipoColors[c.tipo] ?? C.slate600);
    doc.setFont('helvetica', 'normal');
    doc.text(tipoLabel[c.tipo] ?? c.tipo, cx2 + widths[1] - 2, y + 5.5, { align: 'right' });
    cx2 += widths[1];

    setColor(doc, C.slate900);
    doc.text(c.precoMin ? formatBRL(c.precoMin) : '—', cx2 + widths[2] - 2, y + 5.5, { align: 'right' });
    cx2 += widths[2];

    doc.text(c.precoMax ? formatBRL(c.precoMax) : '—', cx2 + widths[3] - 2, y + 5.5, { align: 'right' });
    cx2 += widths[3];

    setColor(doc, C.slate600);
    const diferLines = doc.splitTextToSize(c.diferencial ?? '—', widths[4] - 4);
    doc.text(diferLines[0], cx2, y + 5.5);

    y += 8;
  });

  y += 6;
  return y;
}

// ─── Seção: Indicadores de Mercado ───────────────────────────────────────────

function addMarketSection(doc: JsPDF, market: MarketIndicators, cidade: string, startY: number): number {
  let y = checkPageBreak(doc, startY, 35);
  y = sectionHeader(doc, `📍 Indicadores de Mercado — ${cidade}`, y);

  const items = [
    market.precoMedioM2 !== undefined && { label: 'Preço Médio m²', value: formatBRL(market.precoMedioM2) + '/m²', sub: 'FipeZap' },
    market.precoVariacao12m !== undefined && { label: 'Variação 12 meses', value: `${market.precoVariacao12m >= 0 ? '+' : ''}${market.precoVariacao12m.toFixed(1)}%`, sub: 'Últimos 12 meses' },
    market.diasVendaMedia !== undefined && { label: 'Absorção Média', value: `${market.diasVendaMedia} dias`, sub: 'Tempo p/ venda' },
    market.idiScore !== undefined && { label: 'IDI Score', value: market.idiScore.toFixed(0), sub: market.idiClassificacao ?? 'Índice Verto' },
  ].filter(Boolean) as { label: string; value: string; sub: string }[];

  if (!items.length) return startY;

  const cardW = (CONTENT_W - (items.length - 1) * 4) / items.length;
  items.forEach((item, i) => {
    kpiCard(doc, MARGIN + i * (cardW + 4), y, cardW, 22, item.label, item.value, item.sub, C.slate50);
  });

  y += 28;
  return y;
}

// ─── Seção: Observações ──────────────────────────────────────────────────────

function addObservacoesSection(doc: JsPDF, observacoes: string, startY: number): number {
  const lines = doc.splitTextToSize(observacoes, CONTENT_W - 8);
  const boxH = lines.length * 5 + 8;
  let y = checkPageBreak(doc, startY, boxH + 20);
  y = sectionHeader(doc, '📝 Observações e Ressalvas', y);

  setColor(doc, C.slate50, 'fill');
  setColor(doc, C.slate200, 'draw');
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, 'FD');

  setColor(doc, C.slate600);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(lines, MARGIN + 4, y + 6);

  y += boxH + 8;
  return y;
}

// ─── Seção: Disclaimer ───────────────────────────────────────────────────────

function addDisclaimer(doc: JsPDF): void {
  doc.addPage();
  let y = 20;
  y = sectionHeader(doc, '⚠️ Disclaimer e Metodologia', y);

  const text = [
    'Este relatório foi gerado pela plataforma Verto Intelligence com base nas informações e premissas fornecidas pelo usuário.',
    'Os resultados apresentados são projeções baseadas em modelos matemáticos e não constituem garantia de desempenho futuro.',
    '',
    'METODOLOGIA:',
    '• VGV (Valor Geral de Vendas): Calculado como preço unitário × número de unidades.',
    '• DRE: Estrutura conforme práticas contábeis imobiliárias brasileiras (NBC TG 47 / IFRS 15).',
    '• Fluxo de Caixa: Projeção simplificada em 4 períodos anuais com distribuição percentual de desembolsos e recebimentos.',
    '• ROI: Lucro Líquido / Custo Total do Empreendimento × 100.',
    '• Sensibilidade: Variação de -20% a +20% no preço de venda com impacto direto no VGV.',
    '• IDI (Índice de Dinâmica Imobiliária): Score proprietário Verto composto por Momentum (25%), Volume (20%), Absorção (20%), Demanda (15%), Macro (15%) e ESG (5%).',
    '',
    'RESSALVAS:',
    '• Custos de construção podem variar conforme especificações técnicas finais e condições de mercado.',
    '• Projeções de receita dependem das condições macroeconômicas e de mercado no período de vendas.',
    '• Indicadores de mercado (IDI, FipeZap, IBGE) são atualizados periodicamente e podem não refletir condições em tempo real.',
    '• Este relatório não substitui o laudo de avaliação de um perito credenciado pelo IBAPE/CRECI.',
    '',
    'Para mais informações: contato@vertointelligence.com.br | www.vertointelligence.com.br',
  ];

  setColor(doc, C.slate600);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');

  for (const line of text) {
    y = checkPageBreak(doc, y, 7);
    if (line.startsWith('•')) {
      doc.setFont('helvetica', 'normal');
    } else if (line.endsWith(':') && line.length < 30) {
      doc.setFont('helvetica', 'bold');
      setColor(doc, C.slate900);
    } else {
      doc.setFont('helvetica', 'normal');
      setColor(doc, C.slate600);
    }
    const wrapped = doc.splitTextToSize(line, CONTENT_W - 4);
    doc.text(wrapped, MARGIN, y);
    y += wrapped.length * 5.5;
  }
}

// ─── Entry Point Principal ───────────────────────────────────────────────────

/**
 * Gera o PDF completo de viabilidade e retorna o blob para download.
 */
export async function gerarRelatorioViabilidadePDF(options: FullReportOptions): Promise<Blob> {
  const { input, swot, competitors = [], market, observacoes } = options;

  // Gerar análise
  const analise = gerarAnaliseCompleta(input);

  // Inicializar PDF
  const { doc, pageWidth, pageHeight } = await getPdfBase(input.nome, 'Relatório de Viabilidade');

  // ─── Capa (página 1 já criada pelo getPdfBase) ──────────────────
  // Resetar para usar nossa própria capa completa
  // getPdfBase já configurou o doc — vamos apenas sobrescrever o conteúdo
  addCoverPage(doc, input, analise);

  // ─── Página 2+: Conteúdo analítico ──────────────────────────────
  doc.addPage();
  let y = 20;

  // DRE
  y = addDRESection(doc, analise.dre, y);

  // Fluxo de Caixa
  y = addFluxoCaixaSection(doc, analise.fluxoCaixa, y);

  // Sensibilidade
  y = addSensibilidadeSection(doc, analise.sensibilidade, y);

  // Velocidade de Vendas
  y = addVelocidadeSection(doc, analise.velocidadeVendas, input.unidades, y);

  // Validação CUB (se disponível)
  if (analise.validacaoCUB) {
    y = addCUBSection(doc, analise.validacaoCUB, y);
  }

  // ─── Página 3+: Análise estratégica ─────────────────────────────

  // Indicadores de mercado
  if (market && Object.values(market).some(v => v !== undefined)) {
    y = addMarketSection(doc, market, input.cidade, y);
  }

  // SWOT
  if (swot) {
    const hasContent = swot.forcas.length + swot.fraquezas.length + swot.oportunidades.length + swot.ameacas.length > 0;
    if (hasContent) {
      y = addSWOTSection(doc, swot, y);
    }
  }

  // Concorrentes
  if (competitors.length > 0) {
    y = addCompetitorsSection(doc, competitors, y);
  }

  // Observações
  if (observacoes?.trim()) {
    y = addObservacoesSection(doc, observacoes, y);
  }

  // Disclaimer (última página)
  addDisclaimer(doc);

  // Rodapé em todas as páginas
  addFooter(doc, pageWidth, pageHeight);

  return doc.output('blob');
}

/**
 * Trigger de download do PDF no browser.
 */
export async function downloadRelatorioViabilidade(options: FullReportOptions): Promise<void> {
  const blob = await gerarRelatorioViabilidadePDF(options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Relatorio_Viabilidade_${options.input.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
