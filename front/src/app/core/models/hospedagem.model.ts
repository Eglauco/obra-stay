export interface RefItem {
  id: number;
  nome: string;
}

export type HospedagemStatus = 'ATIVA' | 'ENCERRADA';

export interface Hospedagem {
  id: number;
  colaborador: RefItem;
  local: RefItem;
  dataEntrada: string; // ISO date "YYYY-MM-DD"
  dataSaida: string | null;
  status: HospedagemStatus;
  observacao: string | null;
}

export interface HospedagemEntradaRequest {
  colaboradorId: number | null;
  localId: number | null;
  dataEntrada: string | null;
  observacao: string | null;
}

export interface HospedagemSaidaRequest {
  dataSaida: string | null;
}

export type HospedagemSortField = 'id' | 'dataEntrada' | 'dataSaida';
export type StatusFiltro = HospedagemStatus | '';

export interface HospedagemFiltro {
  colaboradorId?: number | null;
  localId?: number | null;
  status?: StatusFiltro;
  entradaDe?: string | null;
  entradaAte?: string | null;
  page: number;
  size: number;
  sort: string;
}

export interface Ocupacao {
  localId: number;
  localNome: string;
  capacidade: number;
  ocupados: number;
}
