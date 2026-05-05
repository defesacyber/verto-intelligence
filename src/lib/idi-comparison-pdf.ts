import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

interface CityScore {
  cidade: string;
  uf: string;
  score_idi: number | null;
  score_variacao: number | null;
  score_preco: number | null;
  score_demanda: number | null;
  score_liquidez: number | null;
  score_macro: number | null;
  ranking_nacional: number | null;
  preco_m2?: number | null;
}

interface ComparisonOptions {
  city1: CityScore;
  city2: CityScore;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getScoreLabel(score: number): string {
  if (score >= 85) return 'Excelente';
  if (score >= 75) return 'Muito Bom';
  if (score >= 65) return 'Bom';
  if (score >= 55) return 'Regular';
  return 'Baixo';
}

export function generateIDIComparisonPdf(options: ComparisonOptions): void {
  const { city1, city2 } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
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
  
  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Comparativo IDI', 14, 55);
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${city1.cidade}/${city1.uf} vs ${city2.cidade}/${city2.uf}`, 14, 63);
  doc.text(`Gerado em: ${formatDate(new Date())}`, 14, 70);
  
  // Comparison boxes
  const boxY = 80;
  const boxWidth = (pageWidth - 42) / 2;
  const boxHeight = 70;
  
  // City 1 box
  const winner = (city1.score_idi || 0) > (city2.score_idi || 0) ? 1 : 2;
  
  if (winner === 1) {
    doc.setFillColor(220, 252, 231); // emerald-100
  } else {
    doc.setFillColor(248, 250, 252); // slate-50
  }
  doc.roundedRect(14, boxY, boxWidth, boxHeight, 3, 3, 'F');
  
  if (winner === 1) {
    doc.setDrawColor(34, 197, 94); // emerald-500
    doc.setLineWidth(2);
    doc.roundedRect(14, boxY, boxWidth, boxHeight, 3, 3, 'S');
  }
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(city1.cidade, 20, boxY + 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(city1.uf, 20, boxY + 23);
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`${city1.score_idi?.toFixed(1) || '-'}`, 20, boxY + 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${city1.ranking_nacional || '-'} Nacional`, 20, boxY + 55);
  if (city1.preco_m2) {
    doc.text(`${formatCurrency(city1.preco_m2)}/m²`, 20, boxY + 63);
  }
  
  // City 2 box
  const box2X = 14 + boxWidth + 14;
  if (winner === 2) {
    doc.setFillColor(220, 252, 231);
  } else {
    doc.setFillColor(248, 250, 252);
  }
  doc.roundedRect(box2X, boxY, boxWidth, boxHeight, 3, 3, 'F');
  
  if (winner === 2) {
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(2);
    doc.roundedRect(box2X, boxY, boxWidth, boxHeight, 3, 3, 'S');
  }
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(city2.cidade, box2X + 6, boxY + 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(city2.uf, box2X + 6, boxY + 23);
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`${city2.score_idi?.toFixed(1) || '-'}`, box2X + 6, boxY + 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${city2.ranking_nacional || '-'} Nacional`, box2X + 6, boxY + 55);
  if (city2.preco_m2) {
    doc.text(`${formatCurrency(city2.preco_m2)}/m²`, box2X + 6, boxY + 63);
  }
  
  // Comparison table
  const tableY = boxY + boxHeight + 15;
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPARAÇÃO DETALHADA', 14, tableY);
  
  const scoreData = [
    ['Variação de Preços', city1.score_variacao?.toFixed(1) || '-', city2.score_variacao?.toFixed(1) || '-'],
    ['Nível de Preço', city1.score_preco?.toFixed(1) || '-', city2.score_preco?.toFixed(1) || '-'],
    ['Demanda', city1.score_demanda?.toFixed(1) || '-', city2.score_demanda?.toFixed(1) || '-'],
    ['Liquidez', city1.score_liquidez?.toFixed(1) || '-', city2.score_liquidez?.toFixed(1) || '-'],
    ['Cenário Macro', city1.score_macro?.toFixed(1) || '-', city2.score_macro?.toFixed(1) || '-'],
    ['IDI TOTAL', city1.score_idi?.toFixed(1) || '-', city2.score_idi?.toFixed(1) || '-'],
  ];
  
  const table = autoTable(doc, {
    startY: tableY + 5,
    head: [['Indicador', `${city1.cidade}/${city1.uf}`, `${city2.cidade}/${city2.uf}`]],
    body: scoreData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 50, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
    didDrawCell: (data) => {
      // Highlight winner in each row
      if (data.section === 'body' && data.column.index > 0) {
        const value1 = parseFloat(scoreData[data.row.index][1]) || 0;
        const value2 = parseFloat(scoreData[data.row.index][2]) || 0;
        
        if (data.column.index === 1 && value1 > value2) {
          doc.setTextColor(34, 197, 94);
        } else if (data.column.index === 2 && value2 > value1) {
          doc.setTextColor(34, 197, 94);
        }
      }
    },
  });
  
  // Verdict section
  const verdictY = table.finalY + 15;
  
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.roundedRect(14, verdictY, pageWidth - 28, 40, 3, 3, 'F');
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('MELHOR OPÇÃO PARA INVESTIMENTO:', 20, verdictY + 12);
  
  const winnerCity = winner === 1 ? city1 : city2;
  const winnerScore = winnerCity.score_idi || 0;
  const diff = Math.abs((city1.score_idi || 0) - (city2.score_idi || 0));
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94); // emerald-500
  doc.text(`${winnerCity.cidade}/${winnerCity.uf}`, 20, verdictY + 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`IDI: ${winnerScore.toFixed(1)} (${getScoreLabel(winnerScore)}) | Diferença: ${diff.toFixed(1)} pontos`, 20, verdictY + 35);
  
  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Verto Intelligence | Comparativo IDI`, 14, pageHeight - 12);
  doc.text(`Gerado em ${formatDate(new Date())}`, pageWidth - 14, pageHeight - 12, { align: 'right' });
  
  // Download
  const filename = `comparativo-idi-${city1.cidade}-vs-${city2.cidade}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
