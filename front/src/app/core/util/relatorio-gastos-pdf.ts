import { RelatorioGastos } from '../models/gasto.model';
import { formatarBRL, formatarData, formatarDataHora } from './format';

// Paleta premium (independente do tema — o PDF é um documento).
const INK = '#0F172A';
const MUTED = '#64748B';
const FAINT = '#94A3B8';
const ACCENT = '#6366F1';
const LINE_STRONG = '#CBD5E1';
const LINE_SOFT = '#EEF2F6';
const CHILD_BG = '#F6F7FB';
const TOTAL_BG = '#EEF2FF';
const EPC_CORES = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

/**
 * Gera o PDF do relatório de gastos (layout premium, minimalista) e o abre em uma
 * nova aba. Para não cair no bloqueador de pop-up, a aba deve ser aberta pelo
 * chamador ainda dentro do gesto de clique e repassada em `janela`.
 */
export async function gerarRelatorioGastosPdf(
  rel: RelatorioGastos,
  janela?: Window | null,
): Promise<void> {
  const pdfMake: any = (await import('pdfmake/build/pdfmake')).default;
  const vfs: any = (await import('pdfmake/build/vfs_fonts')).default;
  pdfMake.vfs = vfs;

  const corPorEpc = new Map<string, string>();
  rel.totaisPorEpc.forEach((t, i) => {
    corPorEpc.set(chaveEpc(t.epcId), t.epcId == null ? FAINT : EPC_CORES[i % EPC_CORES.length]);
  });
  const corDe = (epcId: number | null): string => corPorEpc.get(chaveEpc(epcId)) ?? ACCENT;

  const conteudo: any[] = [
    { text: 'Relatório de Gastos', fontSize: 20, bold: true, color: INK, margin: [0, 4, 0, 2] },
    { text: rel.local?.nome ?? '', fontSize: 11, color: ACCENT, margin: [0, 0, 0, 3] },
    {
      text: [
        { text: 'Período: ', color: FAINT },
        { text: periodoTexto(rel.dataDe, rel.dataAte), color: MUTED },
        { text: '        Lançamentos: ', color: FAINT },
        { text: String(rel.itens.length), color: MUTED },
      ],
      fontSize: 9,
      margin: [0, 0, 0, 14],
    },
  ];

  if (rel.itens.length === 0) {
    conteudo.push({
      text: 'Nenhum gasto encontrado para o período selecionado.',
      color: MUTED,
      italics: true,
      margin: [0, 8, 0, 0],
    });
  } else {
    conteudo.push({
      table: { headerRows: 1, widths: ['*', 58, 44, 66, 72], body: corpoGastos(rel, corDe) },
      layout: layoutGastos(),
    });
    conteudo.push({ text: 'Resumo por EPC', fontSize: 13, bold: true, color: INK, margin: [0, 22, 0, 8] });
    conteudo.push({
      table: { headerRows: 1, widths: ['*', 90, 96], body: corpoResumo(rel, corDe) },
      layout: layoutResumo(),
    });
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
            { text: 'Relatório de Gastos', alignment: 'right', color: MUTED, fontSize: 9, margin: [0, 3, 0, 0] },
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
  // Abre em nova aba. Se a aba já foi aberta no clique (evita bloqueio de pop-up),
  // reaproveita-a; senão o próprio pdfmake abre uma.
  if (janela) doc.open({}, janela);
  else doc.open();
}

function corpoGastos(rel: RelatorioGastos, corDe: (id: number | null) => string): any[] {
  const body: any[] = [
    [hcell('Gasto'), hcell('Data', 'center'), hcell('Qtd', 'right'), hcell('Valor un.', 'right'), hcell('Total', 'right')],
  ];

  for (const it of rel.itens) {
    const semFilha = it.rateio.length === 0;
    body.push([
      { text: it.nome, bold: true, color: INK, margin: [0, 4, 0, semFilha ? 4 : 1] },
      { text: formatarData(it.data), color: MUTED, alignment: 'center', margin: [0, 4, 0, 0] },
      { text: fmtQtd(it.quantidade), color: MUTED, alignment: 'right', margin: [0, 4, 0, 0] },
      { text: formatarBRL(it.valor), color: MUTED, alignment: 'right', margin: [0, 4, 0, 0] },
      { text: formatarBRL(it.total), bold: true, color: INK, alignment: 'right', margin: [0, 4, 0, 0] },
    ]);

    if (semFilha) {
      body.push([
        {
          colSpan: 5,
          text: 'sem rateio — nenhum colaborador hospedado no local no lançamento',
          italics: true,
          color: FAINT,
          fontSize: 8,
          margin: [10, 0, 0, 5],
        },
        {}, {}, {}, {},
      ]);
    } else {
      it.rateio.forEach((r, idx) => {
        const ultima = idx === it.rateio.length - 1;
        const mb = ultima ? 5 : 1;
        body.push([
          {
            colSpan: 4,
            fillColor: CHILD_BG,
            margin: [10, 1, 0, mb],
            text: [
              { text: '●  ', color: corDe(r.epcId) },
              { text: r.epcNome, color: INK, fontSize: 9 },
              { text: `   ${r.pessoas} ${r.pessoas === 1 ? 'pessoa' : 'pessoas'} · ${fmtPct(r.percentual)}`, color: FAINT, fontSize: 8 },
            ],
          },
          {}, {}, {},
          { fillColor: CHILD_BG, text: formatarBRL(r.valor), color: MUTED, alignment: 'right', fontSize: 9, margin: [0, 1, 0, mb] },
        ]);
      });
    }
  }
  return body;
}

function corpoResumo(rel: RelatorioGastos, corDe: (id: number | null) => string): any[] {
  const body: any[] = [[hcell('EPC'), hcell('Participação', 'right'), hcell('Total', 'right')]];

  for (const t of rel.totaisPorEpc) {
    const pct = rel.totalGeral > 0 ? (t.valor / rel.totalGeral) * 100 : 0;
    body.push([
      { text: [{ text: '●  ', color: corDe(t.epcId) }, { text: t.epcNome, color: INK }], margin: [0, 3, 0, 3] },
      { text: `${pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`, color: MUTED, alignment: 'right', margin: [0, 3, 0, 3] },
      { text: formatarBRL(t.valor), bold: true, color: INK, alignment: 'right', margin: [0, 3, 0, 3] },
    ]);
  }

  body.push([
    { text: 'Total geral', bold: true, color: INK, fillColor: TOTAL_BG, margin: [0, 5, 0, 5] },
    { text: '100%', bold: true, color: MUTED, alignment: 'right', fillColor: TOTAL_BG, margin: [0, 5, 0, 5] },
    { text: formatarBRL(rel.totalGeral), bold: true, color: ACCENT, alignment: 'right', fillColor: TOTAL_BG, margin: [0, 5, 0, 5] },
  ]);
  return body;
}

function layoutGastos(): any {
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
    hLineWidth: (i: number, node: any) => (i === 0 ? 0 : i === 1 || i >= node.table.body.length - 1 ? 1 : 0.5),
    hLineColor: () => LINE_STRONG,
    vLineWidth: () => 0,
    paddingLeft: () => 6,
    paddingRight: () => 6,
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

function fmtQtd(q: number): string {
  return Number(q ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

function fmtPct(p: number): string {
  return `${Number(p ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

function periodoTexto(de: string | null, ate: string | null): string {
  if (de && ate) return `${formatarData(de)} a ${formatarData(ate)}`;
  if (de) return `a partir de ${formatarData(de)}`;
  if (ate) return `até ${formatarData(ate)}`;
  return 'todos os lançamentos';
}

function chaveEpc(id: number | null): string {
  return id == null ? 'nao-rateado' : String(id);
}
