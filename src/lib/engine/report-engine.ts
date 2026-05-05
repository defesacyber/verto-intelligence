/**
 * Report Engine — Verto Intelligence
 * Gera dados estruturados para relatórios completos de viabilidade
 * incluindo DRE, fluxo de caixa, análise de sensibilidade, SWOT e velocidade de vendas.
 */

export interface ProjectInputForReport {
  // Características do empreendimento
  nome: string;
  cidade: string;
  estado: string;
  bairro?: string;
  tipoImovel: string;
  publicoAlvo: string;

  // Produto
  unidades: number;
  areaPrivativa: number; // m² por unidade
  areaTerreno?: number;  // m² total do lote
  pavimentos?: number;

  // Preços
  precoVendaUnitario: number; // R$ por unidade

  // Custos
  custoTerrenoTotal: number;
  custoConstrucaoPorM2: number; // R$/m² (já inclui BDI)
  custosIndiretos?: number; // projetos, aprovações (% do custo construção)
  marketingVendas?: number; // % do VGV
  despesasAdministrativas?: number; // % da receita
  impostosAliquota?: number; // % da receita (padrão 8%)
  despesasFinanceiras?: number; // % da receita (padrão 3%)

  // Cronograma
  prazoMeses: number; // duração total

  // Fluxo de recebimento (% do VGV)
  entradaPercentual?: number; // % na assinatura (padrão 0)
  duranteObraPercentual?: number; // % durante obra (padrão 25%)
  chavePercentual?: number; // % na entrega (padrão 75%)

  // Fluxo de desembolso
  desembolsoAno0Percentual?: number; // padrão 30%
  desembolsoAno1Percentual?: number; // padrão 40%
  desembolsoAno2Percentual?: number; // padrão 25%
  desembolsoAno3Percentual?: number; // padrão 5%

  // Referências de mercado
  cubEstadual?: number; // CUB/m² do estado
  taxaDesconto?: number; // TMA (% a.a.) para VPL

  // Indicadores econômicos
  ipca?: number; // % a.a.
  selic?: number; // % a.a.
  cdi?: number; // % a.a. (referência para comparação)
  incc?: number; // % a.m. para correção de saldo
}

export interface DRELine {
  descricao: string;
  valor: number;
  percentualReceita: number;
  tipo: 'receita' | 'custo_direto' | 'custo_indireto' | 'despesa' | 'resultado';
  bold?: boolean;
}

export interface DREData {
  linhas: DRELine[];
  receitaBruta: number;
  custosDiretos: number;
  margemBruta: number;
  margemBrutaPercentual: number;
  custosIndiretos: number;
  despesasOperacionais: number;
  lucroLiquido: number;
  margemLiquidaPercentual: number;
}

export interface FluxoCaixaPeriodo {
  periodo: string; // "Ano 0", "Ano 1", etc.
  recebimentos: number;
  desembolsos: number;
  fluxoLiquido: number;
  fluxoAcumulado: number;
}

export interface SensibilidadeScenario {
  nome: string;
  precoUnitario: number;
  vgvTotal: number;
  lucroLiquido: number;
  roi: number;
  margemLiquida: number;
  viavel: boolean;
  classificacao: 'excepcional' | 'excelente' | 'viavel' | 'limite' | 'inviavel';
}

export interface VelocidadeVendas {
  meta90Dias: {
    conservador: { percentual: number; unidades: number };
    base: { percentual: number; unidades: number };
    otimista: { percentual: number; unidades: number };
  };
  ticketMedio: number;
  vgvPorCenario: {
    conservador: number;
    base: number;
    otimista: number;
  };
}

export interface AnaliseViabilidadeCompleta {
  // Inputs processados
  vgvTotal: number;
  custoTotalConstrucao: number;
  custoTotalEmpreendimento: number;

  // DRE
  dre: DREData;

  // Indicadores principais
  roi: number;
  margemBruta: number;
  margemLiquida: number;
  lucroLiquido: number;
  necessidadeCapital: number;
  picoNegativo: string;

  // Fluxo de caixa
  fluxoCaixa: FluxoCaixaPeriodo[];

  // Sensibilidade
  sensibilidade: SensibilidadeScenario[];

  // Velocidade de vendas
  velocidadeVendas: VelocidadeVendas;

  // Validação de custos
  validacaoCUB?: {
    cubReferencia: number;
    custoAdotado: number;
    diferenca: number;
    diferencaPercentual: number;
    justificativa: string;
  };

  // Comparação com mercado
  benchmarkMercado?: {
    cdi: number;
    rentabilidadeEquivalente: string;
    avaliacao: string;
  };
}

/**
 * Gera análise de viabilidade completa para geração de relatório
 */
export function gerarAnaliseCompleta(input: ProjectInputForReport): AnaliseViabilidadeCompleta {
  // Defaults
  const custosIndiretos = input.custosIndiretos ?? 0.10; // 10% da construção
  const marketingVendas = input.marketingVendas ?? 0.03; // 3% do VGV
  const impostos = input.impostosAliquota ?? 0.08; // 8% da receita
  const despesasAdmin = input.despesasAdministrativas ?? 0.05; // 5%
  const despesasFinanc = input.despesasFinanceiras ?? 0.03; // 3%
  const taxaDesconto = input.taxaDesconto ?? 12; // 12% a.a.
  const cdi = input.cdi ?? 10.5;

  // Cálculos base
  const vgvTotal = input.precoVendaUnitario * input.unidades;
  const areaConstrutiva = input.areaPrivativa * input.unidades;
  const custoConstrucaoTotal = input.custoConstrucaoPorM2 * areaConstrutiva;
  const custoProjetos = custoConstrucaoTotal * custosIndiretos;
  const custoMarketing = vgvTotal * marketingVendas;
  const custoTotalDireto = input.custoTerrenoTotal + custoConstrucaoTotal;
  const custoTotalIndireto = custoProjetos + custoMarketing;
  const custoTotalEmpreendimento = custoTotalDireto + custoTotalIndireto;

  // DRE
  const receitaBruta = vgvTotal;
  const margemBruta = receitaBruta - custoTotalDireto;
  const margemBrutaPerc = (margemBruta / receitaBruta) * 100;

  const totalImpostos = receitaBruta * impostos;
  const totalAdmin = receitaBruta * despesasAdmin;
  const totalFinanc = receitaBruta * despesasFinanc;
  const totalDespesas = totalImpostos + totalAdmin + totalFinanc;

  const lucroLiquido = margemBruta - custoTotalIndireto - totalDespesas;
  const margemLiquidaPerc = (lucroLiquido / receitaBruta) * 100;
  const roi = (lucroLiquido / custoTotalEmpreendimento) * 100;

  const dre: DREData = {
    receitaBruta,
    custosDiretos: custoTotalDireto,
    margemBruta,
    margemBrutaPercentual: margemBrutaPerc,
    custosIndiretos: custoTotalIndireto,
    despesasOperacionais: totalDespesas,
    lucroLiquido,
    margemLiquidaPercentual: margemLiquidaPerc,
    linhas: [
      { descricao: 'Receita Bruta (VGV)', valor: receitaBruta, percentualReceita: 100, tipo: 'receita', bold: true },
      { descricao: 'Terreno e Infraestrutura', valor: -input.custoTerrenoTotal, percentualReceita: -(input.custoTerrenoTotal / receitaBruta * 100), tipo: 'custo_direto' },
      { descricao: `Construção (${input.unidades} un × ${input.areaPrivativa}m² × R$${input.custoConstrucaoPorM2.toLocaleString('pt-BR')}/m²)`, valor: -custoConstrucaoTotal, percentualReceita: -(custoConstrucaoTotal / receitaBruta * 100), tipo: 'custo_direto' },
      { descricao: 'Total Custos Diretos', valor: -custoTotalDireto, percentualReceita: -(custoTotalDireto / receitaBruta * 100), tipo: 'custo_direto', bold: true },
      { descricao: 'Margem Bruta', valor: margemBruta, percentualReceita: margemBrutaPerc, tipo: 'resultado', bold: true },
      { descricao: 'Projetos e Aprovações', valor: -custoProjetos, percentualReceita: -(custoProjetos / receitaBruta * 100), tipo: 'custo_indireto' },
      { descricao: 'Marketing e Vendas', valor: -custoMarketing, percentualReceita: -(custoMarketing / receitaBruta * 100), tipo: 'custo_indireto' },
      { descricao: 'Total Custos Indiretos', valor: -custoTotalIndireto, percentualReceita: -(custoTotalIndireto / receitaBruta * 100), tipo: 'custo_indireto', bold: true },
      { descricao: 'Impostos e Taxas', valor: -totalImpostos, percentualReceita: -(impostos * 100), tipo: 'despesa' },
      { descricao: 'Despesas Administrativas', valor: -totalAdmin, percentualReceita: -(despesasAdmin * 100), tipo: 'despesa' },
      { descricao: 'Despesas Financeiras', valor: -totalFinanc, percentualReceita: -(despesasFinanc * 100), tipo: 'despesa' },
      { descricao: 'Total Despesas', valor: -totalDespesas, percentualReceita: -(totalDespesas / receitaBruta * 100), tipo: 'despesa', bold: true },
      { descricao: 'LUCRO LÍQUIDO', valor: lucroLiquido, percentualReceita: margemLiquidaPerc, tipo: 'resultado', bold: true },
    ],
  };

  // Fluxo de Caixa
  const prazoAnos = Math.ceil(input.prazoMeses / 12);
  const d0 = input.desembolsoAno0Percentual ?? 0.30;
  const d1 = input.desembolsoAno1Percentual ?? 0.40;
  const d2 = input.desembolsoAno2Percentual ?? 0.25;
  const d3 = input.desembolsoAno3Percentual ?? 0.05;

  // Recebimentos: entrada + durante obra + chave
  const entradaPerc = input.entradaPercentual ?? 0;
  const duranteObraPerc = input.duranteObraPercentual ?? 0.25;
  const chavePerc = input.chavePercentual ?? 0.75;

  const recAnos = prazoAnos === 3 ? [
    vgvTotal * (entradaPerc + duranteObraPerc / 3),
    vgvTotal * (duranteObraPerc / 3),
    vgvTotal * (duranteObraPerc / 3 + chavePerc),
  ] : [
    vgvTotal * entradaPerc,
    vgvTotal * duranteObraPerc,
    vgvTotal * chavePerc,
  ];

  const despAno = [d0, d1, d2, d3].map(p => custoTotalEmpreendimento * p);

  let acumulado = 0;
  const fluxoCaixa: FluxoCaixaPeriodo[] = [
    { periodo: 'Ano 0 (Lançamento)', recebimentos: 0, desembolsos: despAno[0], fluxoLiquido: -despAno[0], fluxoAcumulado: acumulado = -despAno[0] },
    { periodo: 'Ano 1', recebimentos: recAnos[0], desembolsos: despAno[1], fluxoLiquido: recAnos[0] - despAno[1], fluxoAcumulado: acumulado = acumulado + recAnos[0] - despAno[1] },
    { periodo: 'Ano 2', recebimentos: recAnos[1] || 0, desembolsos: despAno[2], fluxoLiquido: (recAnos[1] || 0) - despAno[2], fluxoAcumulado: acumulado = acumulado + (recAnos[1] || 0) - despAno[2] },
    { periodo: 'Ano 3 (Entrega)', recebimentos: recAnos[2], desembolsos: despAno[3], fluxoLiquido: recAnos[2] - despAno[3], fluxoAcumulado: acumulado = acumulado + recAnos[2] - despAno[3] },
  ];

  const necessidadeCapital = Math.abs(Math.min(...fluxoCaixa.map(f => f.fluxoAcumulado)));
  const picoNegativo = fluxoCaixa.find(f => f.fluxoAcumulado === -necessidadeCapital)?.periodo ?? 'Ano 2';

  // Análise de Sensibilidade (variações de -20% a +20% no preço)
  const variacoes = [-0.20, -0.10, -0.05, 0, 0.05, 0.10, 0.20];
  const sensibilidade: SensibilidadeScenario[] = variacoes.map(v => {
    const preco = input.precoVendaUnitario * (1 + v);
    const vgv = preco * input.unidades;
    const mBruta = vgv - custoTotalDireto;
    const lLiquido = mBruta - custoTotalIndireto - (vgv * (impostos + despesasAdmin + despesasFinanc));
    const roiS = (lLiquido / custoTotalEmpreendimento) * 100;
    const margemS = (lLiquido / vgv) * 100;

    let classificacao: SensibilidadeScenario['classificacao'] = 'inviavel';
    if (roiS >= 50) classificacao = 'excepcional';
    else if (roiS >= 40) classificacao = 'excelente';
    else if (roiS >= 25) classificacao = 'viavel';
    else if (roiS >= 15) classificacao = 'limite';

    const pNome = v === 0 ? 'Base' : v > 0 ? `Aumento ${Math.abs(v*100).toFixed(0)}%` : `Redução ${Math.abs(v*100).toFixed(0)}%`;

    return {
      nome: pNome,
      precoUnitario: preco,
      vgvTotal: vgv,
      lucroLiquido: lLiquido,
      roi: roiS,
      margemLiquida: margemS,
      viavel: roiS >= 15,
      classificacao,
    };
  });

  // Velocidade de vendas
  const velocidadeVendas: VelocidadeVendas = {
    meta90Dias: {
      conservador: { percentual: 65, unidades: Math.round(input.unidades * 0.65) },
      base: { percentual: 75, unidades: Math.round(input.unidades * 0.75) },
      otimista: { percentual: 83, unidades: Math.round(input.unidades * 0.83) },
    },
    ticketMedio: input.precoVendaUnitario,
    vgvPorCenario: {
      conservador: input.precoVendaUnitario * Math.round(input.unidades * 0.65),
      base: input.precoVendaUnitario * Math.round(input.unidades * 0.75),
      otimista: input.precoVendaUnitario * Math.round(input.unidades * 0.83),
    },
  };

  // Validação CUB
  const validacaoCUB = input.cubEstadual ? {
    cubReferencia: input.cubEstadual,
    custoAdotado: input.custoConstrucaoPorM2,
    diferenca: input.custoConstrucaoPorM2 - input.cubEstadual,
    diferencaPercentual: ((input.custoConstrucaoPorM2 - input.cubEstadual) / input.cubEstadual) * 100,
    justificativa: input.custoConstrucaoPorM2 < input.cubEstadual
      ? `Custo ${(((input.cubEstadual - input.custoConstrucaoPorM2) / input.cubEstadual) * 100).toFixed(1)}% abaixo do CUB — justificado por economia de escala, projeto padronizado e compra em volume`
      : `Custo ${(((input.custoConstrucaoPorM2 - input.cubEstadual) / input.cubEstadual) * 100).toFixed(1)}% acima do CUB — padrão de acabamento superior ao residencial normal`,
  } : undefined;

  // Benchmark CDI
  const anosEquivalente = input.prazoMeses / 12;
  const cdiAcumulado = ((1 + cdi / 100) ** anosEquivalente - 1) * 100;
  let avaliacao = 'Rentabilidade excelente';
  if (roi < cdiAcumulado) avaliacao = 'Abaixo do CDI — rever premissas';
  else if (roi < cdiAcumulado * 1.5) avaliacao = 'Acima do CDI — rentabilidade adequada';
  else if (roi < cdiAcumulado * 2) avaliacao = 'Rentabilidade muito boa — supera CDI em 2x';
  else avaliacao = 'Rentabilidade excepcional — supera CDI em mais de 2x';

  return {
    vgvTotal,
    custoTotalConstrucao: custoConstrucaoTotal,
    custoTotalEmpreendimento,
    dre,
    roi,
    margemBruta: margemBrutaPerc,
    margemLiquida: margemLiquidaPerc,
    lucroLiquido,
    necessidadeCapital,
    picoNegativo,
    fluxoCaixa,
    sensibilidade,
    velocidadeVendas,
    validacaoCUB,
    benchmarkMercado: {
      cdi,
      rentabilidadeEquivalente: `CDI ${anosEquivalente.toFixed(0)}a = ${cdiAcumulado.toFixed(1)}%`,
      avaliacao,
    },
  };
}

/**
 * Formata valor monetário em BRL
 */
export function formatBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

/**
 * Formata percentual
 */
export function formatPct(valor: number, casas = 1): string {
  return `${valor >= 0 ? '' : ''}${valor.toFixed(casas)}%`;
}
