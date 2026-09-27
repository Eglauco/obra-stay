export interface ItemOrcamentoMobiliario {
  id?: number;
  nome: string;
  precoUnitario: number;
  quantidadeFixa: number;
  quantidadePorQuarto: number;
}

export interface OrcamentoMobiliario {
  id: number;
  nome: string;
  descricao: string | null;
  criadoEm: string;
  totalItens: number;
  itens: ItemOrcamentoMobiliario[];
}

export interface ItemOrcamentoMobiliarioRequest {
  nome: string;
  precoUnitario: number | null;
  quantidadeFixa: number;
  quantidadePorQuarto: number;
}

export interface OrcamentoMobiliarioRequest {
  nome: string;
  descricao: string | null;
  itens: ItemOrcamentoMobiliarioRequest[];
}

/** Opção enxuta (id + nome) para selects. */
export interface OrcamentoOpcao {
  id: number;
  nome: string;
}

export type OrcamentoMobiliarioSortField = 'id' | 'nome' | 'criadoEm';

export interface OrcamentoMobiliarioFiltro {
  id?: number | null;
  nome?: string | null;
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}
