export interface RefItem {
  id: number;
  nome: string;
}

export type HospedagemStatus = 'ATIVA' | 'ENCERRADA';

export type OrigemHospedagem = 'ADMINISTRACAO' | 'AUTOATENDIMENTO';

export interface Hospedagem {
  id: number;
  colaborador: RefItem;
  local: RefItem;
  dataEntrada: string; // ISO datetime "YYYY-MM-DDTHH:mm:ss"
  dataSaida: string | null;
  status: HospedagemStatus;
  observacao: string | null;
  origem: OrigemHospedagem;
}

export interface HospedagemEntradaRequest {
  colaboradorId: number | null;
  localId: number | null;
  dataEntrada: string | null; // ISO datetime-local "YYYY-MM-DDTHH:mm"
  observacao: string | null;
}

export interface HospedagemSaidaRequest {
  dataSaida: string | null; // ISO datetime-local "YYYY-MM-DDTHH:mm"
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
