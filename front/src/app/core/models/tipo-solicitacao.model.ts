export interface TipoSolicitacao {
  id: number;
  nome: string;
}

export interface TipoSolicitacaoRequest {
  nome: string;
}

export type TipoSolicitacaoSortField = 'id' | 'nome';

export interface TipoSolicitacaoFiltro {
  id?: number | null;
  nome?: string | null;
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}
