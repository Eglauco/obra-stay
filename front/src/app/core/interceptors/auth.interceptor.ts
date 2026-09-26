import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Injeta o token Bearer nas chamadas da API e, ao receber 401 (sessão expirada/ausente),
 * encerra a sessão e volta para o login. O próprio login (401 = credenciais inválidas)
 * é ignorado para o erro ser tratado na tela.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

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
      }
      return throwError(() => err);
    }),
  );
};
