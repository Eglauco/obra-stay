export interface Usuario {
  id: number;
  nome: string;
  email: string;
  criadoEm?: string;
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
}
