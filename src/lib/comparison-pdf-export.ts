import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

interface CityData {
  city: string;
  uf: string;
  avg_price_m2: number;
  price_variation_12m: number;
  demand_index: number;
  absorption_rate: number;
  supply_units: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export function exportComparisonToPdf(cities: CityData[]): void {
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
  doc.text('Comparação de Mercados', 14, 33);
  
  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Análise Comparativa de Cidades', 14, 55);
  
  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Data de geração: ${formatDate(new Date())}`, 14, 63);
  doc.text(`Cidades comparadas: ${cities.length}`, 14, 69);
  
  // Summary stats
  const avgPrice = cities.reduce((sum, c) => sum + c.avg_price_m2, 0) / cities.length;
  const avgVariation = cities.reduce((sum, c) => sum + c.price_variation_12m, 0) / cities.length;
  const avgDemand = cities.reduce((sum, c) => sum + c.demand_index, 0) / cities.length;
  const avgAbsorption = cities.reduce((sum, c) => sum + c.absorption_rate, 0) / cities.length;
  
  let yPos = 80;
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, yPos, pageWidth - 28, 30, 3, 3, 'F');
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO DA COMPARAÇÃO', 20, yPos + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const summaryData = [
    { label: 'Preço Médio/m²', value: formatCurrency(avgPrice) },
    { label: 'Variação Média', value: `${avgVariation.toFixed(1)}%` },
    { label: 'Demanda Média', value: `${Math.round(avgDemand)}` },
    { label: 'Absorção Média', value: `${avgAbsorption.toFixed(1)}%` },
  ];
  
  const colWidth = (pageWidth - 40) / 4;
  summaryData.forEach((item, index) => {
    const x = 20 + (index * colWidth);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, x, yPos + 18);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x, yPos + 25);
    doc.setFont('helvetica', 'normal');
  });
  
  yPos += 40;
  
  // Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALHAMENTO POR CIDADE', 14, yPos);
  
  const tableData = cities.map((city) => [
    city.city,
    city.uf,
    formatCurrency(city.avg_price_m2),
    `${city.price_variation_12m > 0 ? '+' : ''}${city.price_variation_12m.toFixed(1)}%`,
    String(city.demand_index),
    `${city.absorption_rate.toFixed(1)}%`,
    city.supply_units.toLocaleString('pt-BR'),
    `${Math.round(100 / city.absorption_rate)} meses`,
  ]);
  
  const table = autoTable(doc, {
    startY: yPos + 5,
    head: [['Cidade', 'UF', 'Preço/m²', 'Variação 12m', 'Demanda', 'Absorção', 'Oferta', 'Tempo Venda']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 12 },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });
  
  // Highlights
  const finalY = table.finalY + 15;
  const maxPrice = Math.max(...cities.map(c => c.avg_price_m2));
  const minPrice = Math.min(...cities.map(c => c.avg_price_m2));
  const maxDemand = Math.max(...cities.map(c => c.demand_index));
  const maxAbsorption = Math.max(...cities.map(c => c.absorption_rate));
  
  const highestPriceCity = cities.find(c => c.avg_price_m2 === maxPrice);
  const lowestPriceCity = cities.find(c => c.avg_price_m2 === minPrice);
  const highestDemandCity = cities.find(c => c.demand_index === maxDemand);
  const highestAbsorptionCity = cities.find(c => c.absorption_rate === maxAbsorption);
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DESTAQUES', 14, finalY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  
  const highlights = [
    `• Maior preço/m²: ${highestPriceCity?.city}/${highestPriceCity?.uf} - ${formatCurrency(maxPrice)}`,
    `• Menor preço/m²: ${lowestPriceCity?.city}/${lowestPriceCity?.uf} - ${formatCurrency(minPrice)}`,
    `• Maior demanda: ${highestDemandCity?.city}/${highestDemandCity?.uf} - Índice ${maxDemand}`,
    `• Melhor absorção: ${highestAbsorptionCity?.city}/${highestAbsorptionCity?.uf} - ${maxAbsorption.toFixed(1)}%/mês`,
  ];
  
  highlights.forEach((text, index) => {
    doc.text(text, 14, finalY + 8 + (index * 6));
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
    doc.text(`Verto Intelligence | ${formatDate(new Date())}`, 14, pageHeight - 12);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 12, { align: 'right' });
  }
  
  // Download
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`comparacao-cidades-${dateStr}.pdf`);
}
