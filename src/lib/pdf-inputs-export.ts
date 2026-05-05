import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

interface FormData {
  land_acquisition_type?: string | null;
  land_cost?: number;
  permuta_units?: number;
  usufruto_years?: number;
  approval_costs?: number;
  infrastructure_costs?: number;
  project_costs?: number;
  contingency_percent?: number;
  sales_velocity?: number;
  launch_date?: string | null;
  construction_months?: number;
  financing_rate?: number;
  discount_rate?: number;
  certifications?: string[];
  sustainability_initiatives?: string[];
  unit_distribution?: {
    studio?: number;
    '1q'?: number;
    '2q'?: number;
    '3q'?: number;
    '4q'?: number;
  };
}

interface InputsSummaryOptions {
  projectName: string;
  data: FormData;
  stepsProgress: Array<{ id: string; title: string; filledFields: number; totalFields: number }>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'Não definida';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

const getAcquisitionLabel = (type: string | null | undefined) => {
  switch (type) {
    case 'compra': return 'Compra Direta';
    case 'permuta': return 'Permuta';
    case 'usufruto': return 'Usufruto';
    default: return 'Não selecionado';
  }
};

export function generateInputsSummaryPdf(options: InputsSummaryOptions): void {
  const { projectName, data, stepsProgress } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Verto Intelligence', 14, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Inteligência Imobiliária', 14, 33);
  
  // Project title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Parâmetros: ${projectName}`, 14, 55);
  
  // Generation date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, 14, 63);
  
  // Progress summary
  const overallProgress = stepsProgress.reduce((sum, step) => sum + step.filledFields, 0);
  const overallTotal = stepsProgress.reduce((sum, step) => sum + step.totalFields, 0);
  const progressPercent = Math.round((overallProgress / overallTotal) * 100);
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 70, pageWidth - 28, 20, 3, 3, 'F');
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Progresso: ${progressPercent}% completo`, 20, 82);
  
  let yPos = 100;
  
  // Land Acquisition Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('AQUISIÇÃO DO TERRENO', 14, yPos);
  
  const landData: string[][] = [
    ['Tipo de Aquisição', getAcquisitionLabel(data.land_acquisition_type)],
  ];
  
  if (data.land_acquisition_type === 'compra') {
    landData.push(['Valor do Terreno', formatCurrency(data.land_cost ?? 0)]);
  } else if (data.land_acquisition_type === 'permuta') {
    landData.push(['Unidades em Permuta', `${data.permuta_units ?? 0} unidades`]);
  } else if (data.land_acquisition_type === 'usufruto') {
    landData.push(['Anos de Usufruto', `${data.usufruto_years ?? 0} anos`]);
  }
  
  const landTable = autoTable(doc, {
    startY: yPos + 5,
    head: [['Campo', 'Valor']],
    body: landData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
  yPos = landTable.finalY + 15;
  
  // Costs Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOS DO PROJETO', 14, yPos);
  
  const costsData: string[][] = [
    ['Custos de Aprovação', formatCurrency(data.approval_costs ?? 0)],
    ['Infraestrutura', formatCurrency(data.infrastructure_costs ?? 0)],
    ['Custos de Projeto', formatCurrency(data.project_costs ?? 0)],
    ['Contingência', `${data.contingency_percent ?? 0}%`],
  ];
  
  const costsTable = autoTable(doc, {
    startY: yPos + 5,
    head: [['Campo', 'Valor']],
    body: costsData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
  yPos = costsTable.finalY + 15;
  
  // Units Distribution Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DISTRIBUIÇÃO DE UNIDADES', 14, yPos);
  
  const unitDist = data.unit_distribution || {};
  const totalUnits = Object.values(unitDist).reduce((sum, val) => sum + (val || 0), 0);
  
  const unitsData: string[][] = [
    ['Studio', String(unitDist.studio ?? 0)],
    ['1 Quarto', String(unitDist['1q'] ?? 0)],
    ['2 Quartos', String(unitDist['2q'] ?? 0)],
    ['3 Quartos', String(unitDist['3q'] ?? 0)],
    ['4+ Quartos', String(unitDist['4q'] ?? 0)],
    ['TOTAL', String(totalUnits)],
  ];
  
  const unitsTable = autoTable(doc, {
    startY: yPos + 5,
    head: [['Tipologia', 'Quantidade']],
    body: unitsData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
  yPos = unitsTable.finalY + 15;
  
  // Check if we need a new page
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }
  
  // Financial Parameters Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PARÂMETROS FINANCEIROS', 14, yPos);
  
  const financialData: string[][] = [
    ['Data de Lançamento', formatDate(data.launch_date)],
    ['Prazo de Construção', `${data.construction_months ?? 0} meses`],
    ['Velocidade de Vendas', `${data.sales_velocity ?? 0}% ao mês`],
    ['Taxa de Desconto', `${data.discount_rate ?? 0}% a.a.`],
    ['Taxa de Financiamento', `${data.financing_rate ?? 0}% a.a.`],
  ];
  
  const financialTable = autoTable(doc, {
    startY: yPos + 5,
    head: [['Campo', 'Valor']],
    body: financialData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
  yPos = financialTable.finalY + 15;
  
  // Check if we need a new page
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }
  
  // Sustainability Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SUSTENTABILIDADE', 14, yPos);
  
  const certifications = data.certifications ?? [];
  const initiatives = data.sustainability_initiatives ?? [];
  
  const sustainabilityData: string[][] = [
    ['Certificações', certifications.length > 0 ? certifications.join(', ') : 'Nenhuma'],
    ['Iniciativas', initiatives.length > 0 ? initiatives.join(', ') : 'Nenhuma'],
  ];
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Categoria', 'Selecionados']],
    body: sustainabilityData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: {
      1: { cellWidth: 100 },
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Verto Intelligence - Parâmetros de Viabilidade | ${projectName}`, 14, pageHeight - 12);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 12, { align: 'right' });
  }
  
  // Download
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `parametros-${projectName.toLowerCase().replace(/\s+/g, '-')}-${dateStr}.pdf`;
  
  doc.save(filename);
}
