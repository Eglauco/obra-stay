export interface Epc {
  id: number;
  nome: string;
}

export interface EpcRequest {
  nome: string;
}

export type EpcSortField = 'id' | 'nome';

export interface EpcFiltro {
  id?: number | null;
  nome?: string | null;
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}
