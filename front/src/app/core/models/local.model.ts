export interface Local {
  id: number;
  codigo: string;
  nome: string;
  capacidade: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  /** URL pré-assinada (~1h) da foto, ou null quando não há foto. */
  fotoUrl?: string | null;
  statusId?: number | null;
  statusNome?: string | null;
  /** Se o status atual do local libera novas hospedagens. */
  hospedagemLiberada?: boolean;
  quartos?: number;
  valorAluguel?: number;
  itensMobilia?: ItemMobiliaLocal[];
}

/** Item de mobília do Local (cópia editável, com quantidade já resolvida). */
export interface ItemMobiliaLocal {
  id?: number;
  nome: string;
  precoUnitario: number;
  quantidade: number;
}

export interface ItemMobiliaLocalRequest {
  nome: string;
  precoUnitario: number | null;
  quantidade: number;
}

/** Linha do histórico de mudanças de status de um local. */
export interface LocalStatusHistorico {
  id: number;
  statusAnteriorNome: string | null;
  statusNovoNome: string;
  observacao: string | null;
  usuarioNome: string | null;
  criadoEm: string;
}

/** Payload para trocar o status de um local (observação opcional). */
export interface TrocarStatusRequest {
  statusId: number;
  observacao?: string | null;
}

export interface LocalRequest {
  codigo: string;
  nome: string;
  capacidade: number | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  statusId: number | null;
  quartos: number | null;
  valorAluguel: number | null;
  itensMobilia: ItemMobiliaLocalRequest[];
}

export type LocalSortField = 'id' | 'codigo' | 'nome' | 'capacidade' | 'cidade';

export interface LocalFiltro {
  id?: number | null;
  codigo?: string | null;
  nome?: string | null;
  cidade?: string | null;
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}

/** Resposta do serviço público ViaCEP. */
export interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}
