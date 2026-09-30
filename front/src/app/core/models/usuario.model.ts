import { Permissao } from './perfil.model';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  criadoEm?: string;
  ultimoLogin?: string | null;
  perfilId?: number | null;
  perfilNome?: string | null;
  /** Concede tudo (perfil Administrador). Quando true, ignora a lista de permissões. */
  acessoTotal?: boolean;
  permissoes?: Permissao[];
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface TrocarSenhaRequest {
  senhaAtual: string;
  senhaNova: string;
  repetirSenha: string;
}

export interface RegistrarUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  repetirSenha: string;
  perfilId: number;
}

export interface AtualizarUsuarioRequest {
  nome: string;
  perfilId: number;
}
