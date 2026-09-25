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
