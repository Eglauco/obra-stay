export type Sexo = 'MASCULINO' | 'FEMININO';

/** Classificação da mão de obra do colaborador. */
export type Mdo = 'MAO_DE_OBRA_DIRETA' | 'MAO_DE_OBRA_INDIRETA';

/** Referência mínima (id + nome) para vínculos aninhados na resposta. */
export interface RefNome {
  id: number;
  nome: string;
}

/** Função (cargo) do colaborador. */
export interface Funcao {
  id: number;
  nome: string;
}

/** EPC do colaborador na resposta: id, nome e porcentagem de participação. */
export interface ColaboradorEpcView {
  epcId: number;
  nome: string;
  percentual: number;
}

/** EPC do colaborador no envio: id + porcentagem (a soma de todos deve ser 100). */
export interface EpcPercentual {
  epcId: number;
  percentual: number;
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

/** Resumo da hospedagem ativa do colaborador (para link no cadastro). */
export interface HospedagemAtivaResumo {
  hospedagemId: number;
  localId: number;
  localNome: string;
  dataEntrada: string; // ISO datetime
}

export interface Colaborador {
  id: number;
  nome: string;
  sexo: Sexo;
  mdo: Mdo;
  cpf: string;
  /** E-mail é opcional: pode vir nulo quando não informado. */
  email: string | null;
  funcao: Funcao;
  /** EPCs do colaborador, cada um com a sua porcentagem (a soma é 100%). */
  epcs: ColaboradorEpcView[];
  empresa: RefNome;
  gestao: RefNome;
  /** Hospedagem ativa atual, ou null quando não está hospedado. */
  hospedagemAtiva?: HospedagemAtivaResumo | null;
}

export interface ColaboradorRequest {
  nome: string;
  sexo: Sexo | null;
  mdo: Mdo | null;
  cpf: string;
  email: string;
  funcaoId: number | null;
  /** EPCs do colaborador com porcentagem: pelo menos 1, somando 100%. */
  epcs: EpcPercentual[];
  empresaId: number | null;
  gestaoId: number | null;
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
  epcId?: number | null;
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

export const MDO_LABEL: Record<Mdo, string> = {
  MAO_DE_OBRA_DIRETA: 'Mão de Obra Direta',
  MAO_DE_OBRA_INDIRETA: 'Mão de Obra Indireta',
};
