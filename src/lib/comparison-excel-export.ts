interface CityData {
  city: string;
  uf: string;
  avg_price_m2: number;
  price_variation_12m: number;
  demand_index: number;
  absorption_rate: number;
}

export async function exportComparisonToExcel(cities: CityData[], filename?: string) {
  // Dynamic import for ExcelJS
  const ExcelJS = await import('exceljs').then(m => m.default);
  
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Verto Intelligence';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet('Comparação de Cidades');

  // Set column widths
  worksheet.columns = [
    { width: 20 }, // Cidade
    { width: 8 },  // UF
    { width: 15 }, // Preço/m²
    { width: 18 }, // Variação
    { width: 18 }, // Demanda
    { width: 20 }, // Absorção
  ];

  // Add title row
  worksheet.addRow(['Comparação de Cidades - Verto Intelligence']);
  worksheet.addRow(['Data de exportação:', new Date().toLocaleDateString('pt-BR')]);
  worksheet.addRow([]); // Empty row

  // Add header row
  const headerRow = worksheet.addRow(['Cidade', 'UF', 'Preço/m² (R$)', 'Variação 12m (%)', 'Índice de Demanda', 'Taxa de Absorção (%)']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  cities.forEach(city => {
    worksheet.addRow([
      city.city,
      city.uf,
      city.avg_price_m2,
      city.price_variation_12m,
      city.demand_index,
      city.absorption_rate,
    ]);
  });

  worksheet.addRow([]); // Empty row

  // Add summary section
  const avgPrice = cities.reduce((sum, c) => sum + c.avg_price_m2, 0) / cities.length;
  const avgVariation = cities.reduce((sum, c) => sum + c.price_variation_12m, 0) / cities.length;
  const maxPriceCity = cities.reduce((max, c) => c.avg_price_m2 > max.avg_price_m2 ? c : max, cities[0]);
  const minPriceCity = cities.reduce((min, c) => c.avg_price_m2 < min.avg_price_m2 ? c : min, cities[0]);

  const summaryTitleRow = worksheet.addRow(['Resumo Estatístico']);
  summaryTitleRow.font = { bold: true };
  
  worksheet.addRow(['Total de cidades:', cities.length]);
  worksheet.addRow(['Preço médio/m²:', `R$ ${avgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]);
  worksheet.addRow(['Variação média:', `${avgVariation.toFixed(2)}%`]);
  worksheet.addRow(['Maior preço:', maxPriceCity?.city || '-']);
  worksheet.addRow(['Menor preço:', minPriceCity?.city || '-']);

  // Generate file and download
  const fileName = filename || `comparacao-cidades-${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // Generate buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}
