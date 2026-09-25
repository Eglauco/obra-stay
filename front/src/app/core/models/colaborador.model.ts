export type Sexo = 'MASCULINO' | 'FEMININO';

/** Função (cargo) do colaborador. */
export interface Funcao {
  id: number;
  nome: string;
}

export interface FuncaoRequest {
  nome: string;
}

export type FuncaoSortField = 'id' | 'nome';

export interface FuncaoFiltro {
  id?: number | null;
  nome?: string | null;
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}

export interface Colaborador {
  id: number;
  nome: string;
  sexo: Sexo;
  funcao: Funcao;
}

export interface ColaboradorRequest {
  nome: string;
  sexo: Sexo | null;
  funcaoId: number | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export type SortDir = 'asc' | 'desc';
export type SortField = 'id' | 'nome' | 'sexo';

export interface ColaboradorFiltro {
  id?: number | null;
  nome?: string | null;
  sexo?: Sexo | null;
  funcaoId?: number | null;
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}

/** Estrutura de erro padronizada retornada pela API. */
export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: ApiFieldError[];
}

export const SEXO_LABEL: Record<Sexo, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
};
