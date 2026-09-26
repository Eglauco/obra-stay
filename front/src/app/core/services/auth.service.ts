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

/** Sessão do usuário: login, logout, token e troca de senha. Estado em signals + localStorage. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly usuario = signal<Usuario | null>(this.carregarUsuario());
  readonly autenticado = computed(() => this.usuario() !== null);

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE}/auth/login`, { email, senha })
      .pipe(tap((res) => this.armazenar(res)));
  }

  logout(): void {
    this.encerrarSessao();
    this.router.navigateByUrl('/login');
  }

  trocarSenha(req: TrocarSenhaRequest): Observable<void> {
    return this.http.post<void>(`${API_BASE}/auth/trocar-senha`, req);
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
