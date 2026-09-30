import {
  ApplicationConfig,
  PLATFORM_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    // Ao abrir o app com sessão ativa, revalida o usuário (traz perfil/permissões atuais)
    // sem bloquear o bootstrap. Cobre sessões abertas antes do RBAC e mudanças de perfil.
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      if (isPlatformBrowser(inject(PLATFORM_ID)) && auth.token()) {
        auth.refreshUsuario().subscribe({ error: () => {} });
      }
    }),
  ],
};
