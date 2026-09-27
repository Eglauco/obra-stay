export interface StatusLocal {
  id: number;
  nome: string;
  hospedagemLiberada: boolean;
}

export interface StatusLocalRequest {
  nome: string;
  hospedagemLiberada: boolean;
}

export type StatusLocalSortField = 'id' | 'nome';

export interface StatusLocalFiltro {
  id?: number | null;
  nome?: string | null;
  hospedagemLiberada?: boolean | null;
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}
