import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginResponse, TrocarSenhaRequest, Usuario } from '../models/usuario.model';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;
const TOKEN_KEY = 'obrastay.token';
const USER_KEY = 'obrastay.usuario';

/** Sessão do usuário: login, logout, token, troca de senha e permissões (RBAC). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly usuario = signal<Usuario | null>(this.carregarUsuario());
  readonly autenticado = computed(() => this.usuario() !== null);

  /** Estado de permissões derivado do usuário logado. */
  private readonly permissoesInfo = computed(() => {
    const u = this.usuario();
    if (!u) {
      return { legacy: false, total: false, chaves: new Set<string>() };
    }
    // Sessão iniciada antes do RBAC (objeto sem os campos): libera tudo até o /me atualizar.
    const legacy = u.acessoTotal === undefined && u.permissoes === undefined;
    return {
      legacy,
      total: u.acessoTotal === true,
      chaves: new Set((u.permissoes ?? []).map((p) => `${p.tela}:${p.acao}`)),
    };
  });

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE}/auth/login`, { email, senha })
      .pipe(tap((res) => this.armazenar(res)));
  }

  logout(): void {
    // Registra o logout na auditoria (best-effort; o token ainda é anexado pelo interceptor
    // neste momento, antes de encerrarSessao limpar o localStorage).
    if (this.isBrowser && this.token()) {
      this.http.post<void>(`${API_BASE}/auth/logout`, {}).subscribe({ next: () => {}, error: () => {} });
    }
    this.encerrarSessao();
    this.router.navigateByUrl('/login');
  }

  trocarSenha(req: TrocarSenhaRequest): Observable<void> {
    return this.http.post<void>(`${API_BASE}/auth/trocar-senha`, req);
  }

  /** Recarrega os dados do usuário (inclui perfil e permissões) a partir do /me. */
  refreshUsuario(): Observable<Usuario> {
    return this.http
      .get<Usuario>(`${API_BASE}/auth/me`)
      .pipe(tap((u) => this.atualizarUsuario(u)));
  }

  /** Tem a permissão tela:acao? Acesso total ou sessão legada liberam tudo. */
  pode(tela: string, acao: string): boolean {
    const info = this.permissoesInfo();
    if (info.legacy || info.total) {
      return true;
    }
    return info.chaves.has(`${tela}:${acao}`);
  }

  /** A tela está liberada (tem a ação VER)? */
  podeVer(tela: string): boolean {
    return this.pode(tela, 'VER');
  }

  token(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /** Limpa a sessão sem navegar (usado pelo interceptor ao receber 401). */
  encerrarSessao(): void {
    if (this.isBrowser) {
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } catch {
        /* ignore */
      }
    }
    this.usuario.set(null);
  }

  private armazenar(res: LoginResponse): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.usuario));
      } catch {
        /* ignore */
      }
    }
    this.usuario.set(res.usuario);
  }

  private atualizarUsuario(u: Usuario): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      } catch {
        /* ignore */
      }
    }
    this.usuario.set(u);
  }

  private carregarUsuario(): Usuario | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }
}
