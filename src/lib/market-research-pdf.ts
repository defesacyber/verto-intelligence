import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { MarketResearchState } from '@/hooks/useMarketResearch';
import type { AnalysisResult } from '@/lib/viability-types';

interface MarketResearchPDFOptions {
  project: {
    name: string;
    city: string;
    uf: string;
    neighborhood?: string;
    property_type: string;
    vgv: number;
    total_units?: number;
  };
  marketResearch: MarketResearchState;
  viabilityResult?: AnalysisResult | null;
}

interface BestNeighborhood {
  name?: string;
  neighborhood?: string;
  price_m2?: number | null;
}

interface CompetitorEntry {
  name?: string;
  developer?: string;
  avg_price_m2?: number | null;
  total_units?: number | null;
  source?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export function generateMarketResearchPDF(options: MarketResearchPDFOptions): void {
  const { project, marketResearch, viabilityResult } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 0;

  // ===== CAPA =====
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 297, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('Verto Intelligence', pageWidth / 2, 60, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('INTELIGÊNCIA IMOBILIÁRIA', pageWidth / 2, 70, { align: 'center' });
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PESQUISA DE MERCADO', pageWidth / 2, 120, { align: 'center' });
  
  doc.setFontSize(18);
  doc.text(project.name.toUpperCase(), pageWidth / 2, 135, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${project.city}/${project.uf}`, pageWidth / 2, 150, { align: 'center' });
  
  if (project.neighborhood) {
    doc.text(`Bairro: ${project.neighborhood}`, pageWidth / 2, 160, { align: 'center' });
  }
  
  // Verdict badge
  if (marketResearch.conclusionData) {
    const verdict = marketResearch.conclusionData.final_verdict;
    const verdictLabel = verdict === 'FAVORAVEL' ? 'FAVORÁVEL' :
      verdict === 'FAVORAVEL_COM_RESSALVAS' ? 'FAVORÁVEL COM RESSALVAS' : 'DESFAVORÁVEL';
    const color = verdict === 'FAVORAVEL' ? [34, 197, 94] :
      verdict === 'FAVORAVEL_COM_RESSALVAS' ? [234, 179, 8] : [239, 68, 68];
    
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(pageWidth / 2 - 50, 180, 100, 25, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(verdictLabel, pageWidth / 2, 196, { align: 'center' });
  }
  
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em ${formatDate(new Date().toISOString())}`, pageWidth / 2, 270, { align: 'center' });
  
  // ===== SUMÁRIO EXECUTIVO =====
  doc.addPage();
  yPos = 20;
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMÁRIO EXECUTIVO', 14, yPos);
  
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  
  if (marketResearch.conclusionData?.full_conclusion) {
    const lines = doc.splitTextToSize(marketResearch.conclusionData.full_conclusion, pageWidth - 28);
    doc.text(lines, 14, yPos);
    yPos += lines.length * 5 + 10;
  }
  
  // Key metrics
  if (yPos < 200) {
    yPos += 10;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, yPos, pageWidth - 28, 50, 3, 3, 'F');
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INDICADORES CHAVE', 20, yPos + 12);
    
    const metrics = [
      { label: 'VGV Projetado', value: formatCurrency(project.vgv) },
      { label: 'Preço/m² Mercado', value: marketResearch.cityData?.price_data?.current_price_m2 
        ? formatCurrency(marketResearch.cityData.price_data.current_price_m2) : 'N/D' },
      { label: 'Demanda Qualificada (12m)', value: marketResearch.demandData?.qualified_demand_12m?.toLocaleString('pt-BR') || 'N/D' },
      { label: 'Score IDI', value: marketResearch.cityData?.idi_score?.score_idi_normalizado?.toFixed(0) || 'N/D' }
    ];
    
    const colWidth = (pageWidth - 48) / 4;
    metrics.forEach((m, i) => {
      const x = 20 + i * colWidth;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(m.label, x, yPos + 28);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(m.value, x, yPos + 40);
    });
    
    yPos += 60;
  }
  
  // ===== ANÁLISE MACROECONÔMICA =====
  doc.addPage();
  yPos = 20;
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('1. CENÁRIO MACROECONÔMICO', 14, yPos);
  
  if (marketResearch.macroData) {
    yPos += 15;
    
    const macro = marketResearch.macroData.indicators;
    const macroTable = [
      ['SELIC', `${macro.selic?.current?.toFixed(2) || 'N/D'}%`, macro.selic?.trend || 'N/D'],
      ['IPCA (12m)', `${macro.ipca?.previous_12m?.toFixed(2) || 'N/D'}%`, macro.ipca?.trend || 'N/D'],
      ['INCC (12m)', `${macro.incc?.accumulated_12m?.toFixed(2) || 'N/D'}%`, 'Impacta custo construção'],
      ['IGP-M (12m)', `${macro.igpm?.accumulated_12m?.toFixed(2) || 'N/D'}%`, 'Correção contratos'],
      ['Desemprego', `${macro.unemployment?.rate?.toFixed(1) || 'N/D'}%`, 'Capacidade de compra'],
      ['Confiança Consumidor', `${macro.consumer_confidence?.index?.toFixed(0) || 'N/D'}`, 'Propensão à compra']
    ];
    
    const macroAuto = autoTable(doc, {
      startY: yPos,
      head: [['Indicador', 'Valor', 'Impacto']],
      body: macroTable,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 }
    });
    
    yPos = macroAuto.finalY + 15;
    
    if (marketResearch.macroData.summary) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const summaryLines = doc.splitTextToSize(marketResearch.macroData.summary, pageWidth - 28);
      doc.text(summaryLines, 14, yPos);
    }
  }
  
  // ===== ANÁLISE DA CIDADE =====
  doc.addPage();
  yPos = 20;
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`2. ANÁLISE DE MERCADO - ${project.city.toUpperCase()}/${project.uf}`, 14, yPos);
  
  if (marketResearch.cityData) {
    yPos += 15;
    
    const city = marketResearch.cityData;
    
    // Price data
    const cityTable = [
      ['Preço/m² Venda', formatCurrency(city.price_data?.current_price_m2 || 0)],
      ['Preço/m² Locação', city.price_data?.rent_price_m2 ? formatCurrency(city.price_data.rent_price_m2) : 'N/D'],
      ['Variação 12 meses', `${(city.price_data?.variation_12m || 0).toFixed(1)}%`],
      ['Variação 24 meses', `${(city.price_data?.variation_24m || 0).toFixed(1)}%`],
      ['População', city.population?.toLocaleString('pt-BR') || 'N/D'],
      ['Domicílios', city.households?.toLocaleString('pt-BR') || 'N/D']
    ];
    
    const cityAuto = autoTable(doc, {
      startY: yPos,
      head: [['Indicador', 'Valor']],
      body: cityTable,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80, halign: 'right' } },
      margin: { left: 14, right: 14 }
    });
    
    yPos = cityAuto.finalY + 15;
    
    // Best neighborhoods
    if (city.best_neighborhoods && city.best_neighborhoods.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Melhores Bairros', 14, yPos);
      yPos += 8;
      
      const neighborhoodData = city.best_neighborhoods.slice(0, 5).map((item, i) => {
        const neighborhood = item as BestNeighborhood;
        return [
          `${i + 1}º`,
          neighborhood.name || neighborhood.neighborhood || 'N/D',
          neighborhood.price_m2 ? formatCurrency(neighborhood.price_m2) : 'N/D'
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'Bairro', 'Preço/m²']],
        body: neighborhoodData,
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });
    }
  }
  
  // ===== CONCORRÊNCIA =====
  if (marketResearch.competitors && marketResearch.competitors.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('3. ANÁLISE DA CONCORRÊNCIA', 14, yPos);
    
    yPos += 15;
    
    const compData = marketResearch.competitors.map((item) => {
      const competitor = item as CompetitorEntry;
      return [
        competitor.name || 'N/D',
        competitor.developer || 'N/I',
        competitor.avg_price_m2 ? formatCurrency(competitor.avg_price_m2) : 'N/D',
        competitor.total_units?.toString() || 'N/D',
        competitor.source || 'Manual'
      ];
    });
    
      autoTable(doc, {
      startY: yPos,
      head: [['Empreendimento', 'Incorporadora', 'Preço/m²', 'Unidades', 'Fonte']],
      body: compData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 }
    });
  }
  
  // ===== DEMANDA E VELOCIDADE =====
  if (marketResearch.demandData || marketResearch.velocityData) {
    doc.addPage();
    yPos = 20;
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('4. DEMANDA E PROJEÇÃO DE VENDAS', 14, yPos);
    
    yPos += 15;
    
    if (marketResearch.demandData) {
      const demand = marketResearch.demandData;
      
      const demandTable = [
        ['Demanda Potencial (24m)', demand.potential_demand_24m?.toLocaleString('pt-BR') || 'N/D'],
        ['Demanda Potencial (12m)', demand.potential_demand_12m?.toLocaleString('pt-BR') || 'N/D'],
        ['Demanda Qualificada (24m)', demand.qualified_demand_24m?.toLocaleString('pt-BR') || 'N/D'],
        ['Demanda Qualificada (12m)', demand.qualified_demand_12m?.toLocaleString('pt-BR') || 'N/D'],
        ['Demanda p/ Segmento (12m)', demand.segment_demand_12m?.toLocaleString('pt-BR') || 'N/D']
      ];
      
      const demandAuto = autoTable(doc, {
        startY: yPos,
        head: [['Métrica', 'Valor']],
        body: demandTable,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });
      
      yPos = demandAuto.finalY + 15;
    }
    
    if (marketResearch.velocityData) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Cenários de Velocidade de Vendas', 14, yPos);
      yPos += 8;
      
      const scenarios = marketResearch.velocityData.scenarios;
      const velocityTable = [
        ['Pessimista', `${scenarios.pessimista.vso_monthly?.toFixed(1)}%`, 
          `${scenarios.pessimista.units_per_month?.toFixed(1)} un/mês`, 
          `${scenarios.pessimista.months_to_sell} meses`],
        ['Realista', `${scenarios.realista.vso_monthly?.toFixed(1)}%`, 
          `${scenarios.realista.units_per_month?.toFixed(1)} un/mês`, 
          `${scenarios.realista.months_to_sell} meses`],
        ['Otimista', `${scenarios.otimista.vso_monthly?.toFixed(1)}%`, 
          `${scenarios.otimista.units_per_month?.toFixed(1)} un/mês`, 
          `${scenarios.otimista.months_to_sell} meses`]
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Cenário', 'VSO Mensal', 'Vendas/Mês', 'Tempo Total']],
        body: velocityTable,
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });
    }
  }
  
  // ===== VIABILIDADE (se disponível) =====
  if (viabilityResult) {
    doc.addPage();
    yPos = 20;
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('5. ANÁLISE DE VIABILIDADE ECONÔMICA', 14, yPos);
    
    yPos += 15;
    
    const viabilityTable = [
      ['VPL (Valor Presente Líquido)', formatCurrency(viabilityResult.vpl)],
      ['TIR (Taxa Interna de Retorno)', formatPercent(viabilityResult.tir)],
      ['Payback', `${viabilityResult.payback_months} meses`],
      ['Margem de Lucro', formatPercent(viabilityResult.profit_margin)],
      ['Investimento Total', formatCurrency(viabilityResult.total_investment)],
      ['Receita Bruta', formatCurrency(viabilityResult.gross_revenue)],
      ['Lucro Líquido', formatCurrency(viabilityResult.net_profit)],
      ['Score de Risco', `${(viabilityResult.risk_score * 100).toFixed(0)}% (${viabilityResult.risk_level})`]
    ];
    
    const viabilityAuto = autoTable(doc, {
      startY: yPos,
      head: [['Indicador', 'Valor']],
      body: viabilityTable,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80, halign: 'right' } },
      margin: { left: 14, right: 14 }
    });
    
    yPos = viabilityAuto.finalY + 15;
    
    // Status de viabilidade
    const status = viabilityResult.viability_status;
    const statusLabel = status === 'viavel' ? 'VIÁVEL' :
      status === 'viavel_com_ressalvas' ? 'VIÁVEL COM RESSALVAS' : 'INVIÁVEL';
    const statusColor = status === 'viavel' ? [34, 197, 94] :
      status === 'viavel_com_ressalvas' ? [234, 179, 8] : [239, 68, 68];
    
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(14, yPos, 80, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(statusLabel, 54, yPos + 13, { align: 'center' });
    
    yPos += 35;
    
    // Recommendations
    if (viabilityResult.recommendations && viabilityResult.recommendations.length > 0) {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Recomendações', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      
      viabilityResult.recommendations.forEach((rec: string) => {
        doc.text(`• ${rec}`, 18, yPos);
        yPos += 6;
      });
    }
  }
  
  // ===== CONCLUSÃO E RECOMENDAÇÕES =====
  if (marketResearch.conclusionData) {
    doc.addPage();
    yPos = 20;
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CONCLUSÃO E RECOMENDAÇÕES', 14, yPos);
    
    yPos += 15;
    
    // Recommendations
    if (marketResearch.conclusionData.recommendations && marketResearch.conclusionData.recommendations.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Recomendações', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      
      marketResearch.conclusionData.recommendations.forEach((rec: string) => {
        const lines = doc.splitTextToSize(`• ${rec}`, pageWidth - 32);
        doc.text(lines, 18, yPos);
        yPos += lines.length * 5 + 3;
      });
      
      yPos += 10;
    }
    
    // Risks
    if (marketResearch.conclusionData.risks && marketResearch.conclusionData.risks.length > 0) {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Riscos Identificados', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(239, 68, 68);
      
      marketResearch.conclusionData.risks.forEach((risk: string) => {
        const lines = doc.splitTextToSize(`⚠ ${risk}`, pageWidth - 32);
        doc.text(lines, 18, yPos);
        yPos += lines.length * 5 + 3;
      });
    }
  }
  
  // ===== FOOTER EM TODAS AS PÁGINAS =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Verto Intelligence | ${project.name}`, 14, pageHeight - 12);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 12, { align: 'right' });
  }
  
  // Download
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `pesquisa-mercado-${project.name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}.pdf`;
  doc.save(filename);
}
