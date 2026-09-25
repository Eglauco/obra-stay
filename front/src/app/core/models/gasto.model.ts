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

export interface GastoFiltro {
  localId?: number | null;
  nome?: string | null;
  dataDe?: string | null;
  dataAte?: string | null;
  page: number;
  size: number;
  sort: string;
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
