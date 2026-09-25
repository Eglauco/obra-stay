export interface Empresa {
  id: number;
  nome: string;
}

export interface EmpresaRequest {
  nome: string;
}

export type EmpresaSortField = 'id' | 'nome';

export interface EmpresaFiltro {
  id?: number | null;
  nome?: string | null;
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}
