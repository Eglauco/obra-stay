export interface Locadora {
  id: number;
  nome: string;
  telefone: string;
}

export interface LocadoraRequest {
  nome: string;
  telefone: string;
}

export type LocadoraSortField = 'id' | 'nome';

export interface LocadoraFiltro {
  id?: number | null;
  nome?: string | null;
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}
