import {
  RelatorioHospedagens,
  TotalCategoriaRelatorio,
} from '../models/hospedagem.model';
import { formatarCpf, formatarData, formatarDataHora } from './format';

// Paleta premium (independente do tema — o PDF é um documento).
const INK = '#0F172A';
const MUTED = '#64748B';
const FAINT = '#94A3B8';
const ACCENT = '#6366F1';
const SUCCESS = '#0F9D6B';
const LINE_STRONG = '#CBD5E1';
const LINE_SOFT = '#EEF2F6';
const CHILD_BG = '#F6F7FB';
const TOTAL_BG = '#EEF2FF';
const CAT_CORES = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

/** Gera o PDF do relatório de hospedagens por colaborador e o abre em uma nova aba. */
export async function gerarRelatorioHospedagensPdf(
  rel: RelatorioHospedagens,
  janela?: Window | null,
): Promise<void> {
  const pdfMake: any = (await import('pdfmake/build/pdfmake')).default;
  const vfs: any = (await import('pdfmake/build/vfs_fonts')).default;
  pdfMake.vfs = vfs;

  const pct = rel.capacidade > 0 ? Math.round((rel.ocupadosAtuais / rel.capacidade) * 100) : 0;

  const conteudo: any[] = [
    { text: 'Relatório de Hospedagens', fontSize: 20, bold: true, color: INK, margin: [0, 4, 0, 2] },
    { text: rel.local?.nome ?? '', fontSize: 11, color: ACCENT, margin: [0, 0, 0, 2] },
    {
      text: [
        { text: `${rel.localCodigo}  ·  `, color: FAINT },
        { text: rel.localEndereco ?? '', color: MUTED },
      ],
      fontSize: 8.5,
      margin: [0, 0, 0, 3],
    },
    {
      text: [
        { text: 'Filtro: ', color: FAINT },
        { text: rel.statusFiltro, color: MUTED },
        { text: '        Período: ', color: FAINT },
        { text: periodoTexto(rel.dataDe, rel.dataAte), color: MUTED },
      ],
      fontSize: 9,
      margin: [0, 0, 0, 14],
    },
    kpis(rel, pct),
  ];

  if (rel.itens.length === 0) {
    conteudo.push({
      text: 'Nenhuma hospedagem encontrada para o filtro selecionado.',
      color: MUTED,
      italics: true,
      margin: [0, 18, 0, 0],
    });
  } else {
    conteudo.push({ text: 'Detalhamento por colaborador', fontSize: 13, bold: true, color: INK, margin: [0, 22, 0, 8] });
    conteudo.push({
      table: { headerRows: 1, widths: ['*', 82, 82, 40, 54], body: corpoDetalhe(rel) },
      layout: layoutDetalhe(),
    });

    conteudo.push({ text: 'Resumos', fontSize: 13, bold: true, color: INK, margin: [0, 22, 0, 8] });
    conteudo.push(parResumos('Por EPC', rel.porEpc, 'Por empresa', rel.porEmpresa));
    conteudo.push({ text: '', margin: [0, 0, 0, 10] });
    conteudo.push(parResumos('Por função', rel.porFuncao, 'Por origem', rel.porOrigem));
  }

  const dd: any = {
    pageSize: 'A4',
    pageMargins: [40, 78, 40, 52],
    defaultStyle: { font: 'Roboto', fontSize: 9, color: INK },
    header: () => ({
      margin: [40, 24, 40, 0],
      stack: [
        {
          columns: [
            { text: [{ text: 'Obra', bold: true, color: INK }, { text: 'Stay', bold: true, color: ACCENT }], fontSize: 13 },
            { text: 'Relatório de Hospedagens', alignment: 'right', color: MUTED, fontSize: 9, margin: [0, 3, 0, 0] },
          ],
        },
        { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 515, y2: 8, lineWidth: 0.8, lineColor: LINE_SOFT }] },
      ],
    }),
    footer: (cur: number, total: number) => ({
      margin: [40, 10, 40, 0],
      columns: [
        { text: `Gerado em ${formatarDataHora(rel.geradoEm)}`, color: FAINT, fontSize: 7.5 },
        { text: `Página ${cur} de ${total}`, alignment: 'right', color: FAINT, fontSize: 7.5 },
      ],
    }),
    content: conteudo,
  };

  const doc = pdfMake.createPdf(dd);
  if (janela) doc.open({}, janela);
  else doc.open();
}

/** Faixa de indicadores no topo (6 blocos). */
function kpis(rel: RelatorioHospedagens, pct: number): any {
  const bloco = (rotulo: string, valor: string, cor: string = INK): any => ({
    width: '*',
    stack: [
      { text: rotulo.toUpperCase(), fontSize: 6.5, color: FAINT, characterSpacing: 0.4, margin: [0, 0, 0, 2] },
      { text: valor, fontSize: 14, bold: true, color: cor },
    ],
  });
  return {
    table: {
      widths: ['*', '*', '*', '*', '*', '*'],
      body: [
        [
          bloco('Registros', String(rel.totalRegistros)),
          bloco('Ativas', String(rel.totalAtivas), SUCCESS),
          bloco('Encerradas', String(rel.totalEncerradas)),
          bloco('Colaboradores', String(rel.totalPessoas)),
          bloco('Ocupação atual', `${rel.ocupadosAtuais}/${rel.capacidade}`, pct >= 100 ? '#EF4444' : ACCENT),
          bloco('Permanência média', `${fmtNum(rel.mediaDias)} d`),
        ],
      ],
    },
    layout: {
      fillColor: () => CHILD_BG,
      hLineWidth: () => 0,
      vLineWidth: (i: number) => (i === 0 || i === 6 ? 0 : 0.8),
      vLineColor: () => '#E2E8F0',
      paddingLeft: () => 10,
      paddingRight: () => 8,
      paddingTop: () => 9,
      paddingBottom: () => 9,
    },
  };
}

function corpoDetalhe(rel: RelatorioHospedagens): any[] {
  const body: any[] = [
    [
      hcell('Colaborador'),
      hcell('Entrada', 'left'),
      hcell('Saída', 'left'),
      hcell('Dias', 'right'),
      hcell('Status', 'center'),
    ],
  ];

  for (const it of rel.itens) {
    const ativa = it.status === 'ATIVA';
    const mb = it.observacao ? 1 : 6;
    body.push([
      {
        stack: [
          { text: it.colaboradorNome, bold: true, color: INK, fontSize: 9.5 },
          { text: `CPF ${formatarCpf(it.cpf)}`, color: FAINT, fontSize: 7.5, margin: [0, 1, 0, 0] },
        ],
        margin: [0, 6, 0, mb],
      },
      { text: formatarDataHora(it.dataEntrada), color: MUTED, fontSize: 8.5, margin: [0, 6, 0, mb] },
      { text: formatarDataHora(it.dataSaida), color: it.dataSaida ? MUTED : FAINT, fontSize: 8.5, margin: [0, 6, 0, mb] },
      { text: String(it.diasHospedados), color: INK, alignment: 'right', margin: [0, 6, 0, mb] },
      {
        text: ativa ? 'Ativa' : 'Encerrada',
        color: ativa ? SUCCESS : MUTED,
        bold: ativa,
        alignment: 'center',
        fontSize: 8.5,
        margin: [0, 6, 0, mb],
      },
    ]);

    if (it.observacao) {
      body.push([
        {
          colSpan: 5,
          fillColor: CHILD_BG,
          margin: [10, 0, 8, 5],
          text: [
            { text: 'Obs.  ', color: FAINT, italics: true, fontSize: 7.5 },
            { text: it.observacao, color: MUTED, italics: true, fontSize: 8 },
          ],
        },
        {}, {}, {}, {},
      ]);
    }
  }
  return body;
}

/** Duas tabelas de resumo lado a lado. */
function parResumos(
  tituloEsq: string,
  dadosEsq: TotalCategoriaRelatorio[],
  tituloDir: string,
  dadosDir: TotalCategoriaRelatorio[],
): any {
  return {
    columns: [
      { width: '*', stack: [tituloResumo(tituloEsq), tabelaResumo(dadosEsq)] },
      { width: 18, text: '' },
      { width: '*', stack: [tituloResumo(tituloDir), tabelaResumo(dadosDir)] },
    ],
  };
}

function tituloResumo(texto: string): any {
  return { text: texto, fontSize: 9.5, bold: true, color: INK, margin: [0, 0, 0, 5] };
}

function tabelaResumo(dados: TotalCategoriaRelatorio[]): any {
  const body: any[] = [[hcell('Categoria'), hcell('Reg.', 'right'), hcell('Ativas', 'right')]];
  if (dados.length === 0) {
    body.push([{ colSpan: 3, text: '—', color: FAINT, alignment: 'center', margin: [0, 3, 0, 3] }, {}, {}]);
  } else {
    dados.forEach((d, i) => {
      body.push([
        {
          text: [{ text: '●  ', color: CAT_CORES[i % CAT_CORES.length] }, { text: d.rotulo, color: INK }],
          margin: [0, 2.5, 0, 2.5],
        },
        { text: String(d.total), color: MUTED, alignment: 'right', margin: [0, 2.5, 0, 2.5] },
        { text: String(d.ativas), color: d.ativas > 0 ? SUCCESS : FAINT, alignment: 'right', margin: [0, 2.5, 0, 2.5] },
      ]);
    });
  }
  return { table: { headerRows: 1, widths: ['*', 32, 38], body }, layout: layoutResumo() };
}

function layoutDetalhe(): any {
  return {
    hLineWidth: (i: number, node: any) => (i === 0 ? 0 : i === 1 || i === node.table.body.length ? 1 : 0.5),
    hLineColor: (i: number, node: any) => (i === 1 || i === node.table.body.length ? LINE_STRONG : LINE_SOFT),
    vLineWidth: () => 0,
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 1,
    paddingBottom: () => 1,
  };
}

function layoutResumo(): any {
  return {
    hLineWidth: (i: number, node: any) => (i === 0 ? 0 : i === 1 || i === node.table.body.length ? 1 : 0.5),
    hLineColor: () => LINE_SOFT,
    vLineWidth: () => 0,
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 1,
    paddingBottom: () => 1,
  };
}

function hcell(texto: string, alignment: 'left' | 'right' | 'center' = 'left'): any {
  return {
    text: texto.toUpperCase(),
    bold: true,
    fontSize: 7.5,
    color: FAINT,
    alignment,
    characterSpacing: 0.5,
    margin: [0, 0, 0, 5],
  };
}

function fmtNum(n: number): string {
  return Number(n ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function periodoTexto(de: string | null, ate: string | null): string {
  if (de && ate) return `${formatarData(de)} a ${formatarData(ate)}`;
  if (de) return `a partir de ${formatarData(de)}`;
  if (ate) return `até ${formatarData(ate)}`;
  return 'todas as datas';
}
