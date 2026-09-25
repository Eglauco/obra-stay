export interface Gestao {
  id: number;
  nome: string;
}

export interface GestaoRequest {
  nome: string;
}

export type GestaoSortField = 'id' | 'nome';

export interface GestaoFiltro {
  id?: number | null;
  nome?: string | null;
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}
