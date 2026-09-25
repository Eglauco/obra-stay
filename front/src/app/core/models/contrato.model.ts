import { RefItem } from './hospedagem.model';

export type ContratoStatus = 'VIGENTE' | 'AGENDADO' | 'ENCERRADO';
export type StatusFiltroContrato = ContratoStatus | '';
export type ContratoSortField = 'id' | 'codigo' | 'dataInicio' | 'dataFim';

export interface Contrato {
  id: number;
  codigo: string;
  local: RefItem;
  locadora: RefItem;
  dataInicio: string; // "YYYY-MM-DD"
  dataFim: string;
  status: ContratoStatus;
}

export interface ContratoRequest {
  codigo: string;
  localId: number | null;
  locadoraId: number | null;
  dataInicio: string | null;
  dataFim: string | null;
}

export interface ContratoFiltro {
  localId?: number | null;
  codigo?: string | null;
  status?: StatusFiltroContrato;
  page: number;
  size: number;
  sort: string;
}

/** Contrato vigente de um local (para o card). */
export interface Vigencia {
  localId: number;
  contratoId: number;
  codigo: string;
  dataInicio: string;
  dataFim: string;
  locadoraNome: string;
}
