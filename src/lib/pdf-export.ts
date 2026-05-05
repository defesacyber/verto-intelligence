import { formatCurrency } from './constants';
import { getPdfBase, addFooter } from './pdf/pdf-template';

interface Project {
  id: string;
  name: string;
  city: string;
  uf: string;
  location: string;
  property_type: string;
  status: string;
  vgv: number;
  roi: number;
  margin: number;
  created_at: string;
}

interface DashboardSummary {
  total_projects?: number;
  total_vgv?: number;
  avg_roi?: number;
  avg_margin?: number;
}

interface ReportOptions {
  title: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'custom';
  date: string;
  projects: Project[];
  summary?: DashboardSummary;
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  planning: 'Planejamento',
  active: 'Ativo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const typeLabels: Record<string, string> = {
  vertical: 'Vertical',
  horizontal: 'Horizontal',
  misto: 'Misto',
  comercial: 'Comercial',
  loteamento: 'Loteamento',
};

export async function generatePdfReport(options: ReportOptions): Promise<void> {
  const { title, type, projects, summary } = options;
  
  const typeLabel = type === 'weekly' ? 'Semanal' : 
                    type === 'monthly' ? 'Mensal' : 
                    type === 'quarterly' ? 'Trimestral' : 'Personalizado';

  const { doc, pageWidth, pageHeight } = await getPdfBase(title, typeLabel);
  const autoTable = (await import('jspdf-autotable')).default;

  // Summary cards
  if (summary) {
    let yPos = 85;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, yPos, pageWidth - 28, 30, 3, 3, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO DO PORTFÓLIO', 20, yPos + 10);
    
    const summaryData = [
      { label: 'Total Projetos', value: String(summary.total_projects || projects.length) },
      { label: 'VGV Total', value: formatCurrency(summary.total_vgv || 0) },
      { label: 'ROI Médio', value: `${(summary.avg_roi || 0).toFixed(1)}%` },
      { label: 'Margem Média', value: `${(summary.avg_margin || 0).toFixed(1)}%` },
    ];
    
    const colWidth = (pageWidth - 40) / 4;
    summaryData.forEach((item, index) => {
      const x = 20 + (index * colWidth);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(item.label, x, yPos + 18);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, x, yPos + 25);
    });
    
    yPos += 45;
    doc.text('PROJETOS', 14, yPos);
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [['Nome', 'Localização', 'Tipo', 'Status', 'VGV', 'ROI', 'Margem']],
      body: projects.map(p => [
        p.name, `${p.city}/${p.uf}`, typeLabels[p.property_type] || p.property_type,
        statusLabels[p.status] || p.status, formatCurrency(p.vgv), `${p.roi.toFixed(1)}%`, `${p.margin.toFixed(1)}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }
    });
  }

  addFooter(doc, pageWidth, pageHeight);
  doc.save(`relatorio-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function generateDashboardPdf(projects: Project[], summary: DashboardSummary): Promise<void> {
  await generatePdfReport({
    title: 'Relatório do Dashboard',
    type: 'custom',
    date: new Date().toISOString(),
    projects,
    summary,
  });
}
