import { RefItem } from './hospedagem.model';

export type GastoSortField = 'id' | 'nome' | 'data' | 'valor';

export interface Gasto {
  id: number;
  local: RefItem;
  nome: string;
  quantidade: number;
  valor: number; // unitário
  total: number; // quantidade × valor
  data: string; // "YYYY-MM-DD"
}

export interface GastoRequest {
  localId: number | null;
  nome: string;
  quantidade: number | null;
  valor: number | null;
  data: string | null;
}

/** Linha do rateio de um gasto por EPC. */
export interface RateioGasto {
  epcId: number;
  epcNome: string;
  pessoas: number;
  percentual: number;
  valor: number;
}

export interface GastoFiltro {
  localId?: number | null;
  nome?: string | null;
  dataDe?: string | null;
  dataAte?: string | null;
  page: number;
  size: number;
  sort: string;
}

/** Item do relatório: a linha do gasto + suas divisões por EPC. */
export interface RelatorioGastoItem {
  id: number;
  nome: string;
  data: string;
  quantidade: number;
  valor: number;
  total: number;
  rateio: RateioGasto[];
}

/** Somatória por EPC no relatório (epcId nulo = "Não rateado"). */
export interface TotalEpcRelatorio {
  epcId: number | null;
  epcNome: string;
  valor: number;
}

/** Relatório de gastos de um local, respeitando o período do filtro. */
export interface RelatorioGastos {
  local: RefItem;
  dataDe: string | null;
  dataAte: string | null;
  geradoEm: string;
  itens: RelatorioGastoItem[];
  totaisPorEpc: TotalEpcRelatorio[];
  totalGeral: number;
}

/** Total gasto por local (card do mestre). */
export interface TotalGastoLocal {
  localId: number;
  total: number;
}

/** Cabeçalho do detalhe: total geral e total do período filtrado. */
export interface ResumoGasto {
  totalGeral: number;
  totalPeriodo: number;
}
