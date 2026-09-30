import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../../environments/environment';

/**
 * Injeta o token Bearer nas chamadas da API. Em 401 (sessão expirada/ausente) encerra a
 * sessão e volta para o login; em 403 (sem permissão) mostra um aviso e mantém o usuário
 * na tela. O próprio login (401 = credenciais inválidas) é ignorado para tratar na tela.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const isApi = req.url.startsWith(environment.apiBase);
  const isLogin = req.url.includes('/auth/login');
  const token = auth.token();

  const reqAuth =
    isApi && token && !isLogin
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(reqAuth).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && isApi && !isLogin) {
        auth.encerrarSessao();
        router.navigateByUrl('/login');
      } else if (err.status === 403 && isApi) {
        toast.error('Sem permissão', 'Você não tem permissão para esta ação.');
      }
      return throwError(() => err);
    }),
  );
};
