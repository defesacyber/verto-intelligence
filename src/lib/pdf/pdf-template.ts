import type { jsPDF as JsPDF } from 'jspdf';
import { formatDate } from '../constants';

export async function getPdfBase(title: string, typeLabel: string) {
  const [jsPDF] = await Promise.all([
    import('jspdf').then(m => m.jsPDF)
  ]);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Verto Intelligence', 14, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Inteligência Imobiliária', 14, 33);
  
  // Report title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 55);
  
  // Report metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Tipo: ${typeLabel}`, 14, 63);
  doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, 14, 69);

  return { doc, pageWidth, pageHeight };
}

export function addFooter(doc: JsPDF, pageWidth: number, pageHeight: number) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Verto Intelligence | www.vertointelligence.com.br`, 14, pageHeight - 12);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 12, { align: 'right' });
  }
}
