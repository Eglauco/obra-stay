/** Uma permissão concedida: par tela (chave kebab) + ação (nome da constante, ex.: "VER"). */
export interface Permissao {
  tela: string;
  acao: string;
}

export interface Perfil {
  id: number;
  nome: string;
  descricao: string | null;
  acessoTotal: boolean;
  sistema: boolean;
  totalPermissoes: number;
  permissoes: Permissao[];
}

export interface PerfilRequest {
  nome: string;
  descricao: string | null;
  permissoes: Permissao[];
}

/** Opção enxuta (id + nome) para selects (ex.: cadastro de usuário). */
export interface PerfilOpcao {
  id: number;
  nome: string;
  acessoTotal: boolean;
}

export interface AcaoCatalogo {
  acao: string;
  rotulo: string;
}

export interface TelaCatalogo {
  tela: string;
  rotulo: string;
  acoes: AcaoCatalogo[];
}

export type PerfilSortField = 'id' | 'nome';

export interface PerfilFiltro {
  id?: number | null;
  nome?: string | null;
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}
