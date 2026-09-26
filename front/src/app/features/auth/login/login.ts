import { Component, PLATFORM_ID, afterNextRender, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ApiError } from '../../../core/models/colaborador.model';

/** Tela de login (pública, sem shell). Layout "split": painel de marca + formulário. */
@Component({
  selector: 'app-login',
  template: `
    <div class="grid min-h-dvh lg:grid-cols-2">
      <!-- Painel de marca (desktop) -->
      <div
        class="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-white"
        style="background-image: linear-gradient(140deg, var(--color-accent) 0%, #4338ca 52%, #1e1b4b 100%)"
      >
        <!-- brilhos decorativos -->
        <div class="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl"></div>
        <div class="pointer-events-none absolute -bottom-32 right-0 size-[28rem] rounded-full bg-black/20 blur-3xl"></div>

        <div class="relative flex items-center gap-3">
          <span class="grid size-11 place-items-center rounded-2xl bg-white/15 font-display text-base font-bold backdrop-blur">OS</span>
          <span class="font-display text-xl font-bold">ObraStay</span>
        </div>

        <div class="relative max-w-md">
          <h1 class="font-display text-4xl font-semibold leading-tight tracking-tight">
            Gestão de hospedagem em obras, do jeito certo.
          </h1>
          <p class="mt-4 text-base text-white/80">
            Colaboradores, locais, contratos, gastos e solicitações — tudo centralizado, com auto-atendimento por QR Code.
          </p>
          <ul class="mt-8 flex flex-col gap-3 text-sm text-white/90">
            @for (item of destaques; track item) {
              <li class="flex items-center gap-3">
                <span class="grid size-6 shrink-0 place-items-center rounded-full bg-white/15" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" class="size-3.5"><path d="m5 10.5 3 3 7-7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </span>
                {{ item }}
              </li>
            }
          </ul>
        </div>

        <p class="relative text-[0.8125rem] text-white/60">© {{ ano }} ObraStay · Hospedagem em obras</p>
      </div>

      <!-- Formulário -->
      <div class="relative flex items-center justify-center bg-canvas px-5 py-10 sm:px-8">
        <button
          type="button"
          (click)="theme.toggle()"
          aria-label="Alternar tema claro e escuro"
          class="absolute right-4 top-4 grid size-9 place-items-center rounded-control border text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <svg viewBox="0 0 24 24" fill="none" class="size-5 dark:hidden" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="3.75" />
            <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36-1.42-1.42M7.05 7.05 5.64 5.64m12.72 0-1.42 1.42M7.05 16.95l-1.41 1.41" stroke-linecap="round" />
          </svg>
          <svg viewBox="0 0 24 24" fill="none" class="hidden size-5 dark:block" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <div class="w-full max-w-sm">
          <!-- Marca (mobile) -->
          <div class="mb-8 flex items-center gap-2.5 lg:hidden">
            <span class="grid size-10 place-items-center rounded-xl bg-accent font-display text-sm font-bold text-accent-fg">OS</span>
            <span class="font-display text-lg font-bold text-fg">Obra<span class="text-accent">Stay</span></span>
          </div>

          <h2 class="font-display text-2xl font-semibold tracking-tight text-fg">Bem-vindo de volta</h2>
          <p class="mt-1.5 text-sm text-muted">Entre com sua conta para acessar o sistema.</p>

          @if (erro()) {
            <div class="mt-5 flex items-start gap-2 rounded-control border px-3.5 py-2.5 text-sm" style="border-color: var(--color-danger); background-color: var(--color-danger-soft); color: var(--color-danger)" role="alert">
              <svg viewBox="0 0 20 20" fill="none" class="mt-0.5 size-4 shrink-0" aria-hidden="true"><path d="M10 6.5v4m0 3h.01M10 2.5 1.5 17h17L10 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
              <span>{{ erro() }}</span>
            </div>
          }

          <form class="mt-6 flex flex-col gap-4" (submit)="$event.preventDefault(); entrar()" novalidate>
            <div class="flex flex-col gap-1.5">
              <label for="login-email" class="text-sm font-medium text-fg">E-mail</label>
              <div class="relative">
                <svg viewBox="0 0 20 20" fill="none" class="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-faint" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h11A1.5 1.5 0 0 1 17 6.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 13.5v-7Z" stroke="currentColor" stroke-width="1.4" /><path d="m3.5 7 6.5 4.5L16.5 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>
                <input
                  #emailInput
                  id="login-email"
                  type="email"
                  autocomplete="email"
                  inputmode="email"
                  [value]="email()"
                  (input)="email.set(emailInput.value); erro.set(null)"
                  placeholder="voce@empresa.com"
                  class="h-11 w-full rounded-control border bg-surface pl-10 pr-3.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="login-senha" class="text-sm font-medium text-fg">Senha</label>
              <div class="relative">
                <svg viewBox="0 0 20 20" fill="none" class="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-faint" aria-hidden="true"><path d="M6 9V6.5a4 4 0 0 1 8 0V9M5 9h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
                <input
                  #senhaInput
                  id="login-senha"
                  [type]="mostrarSenha() ? 'text' : 'password'"
                  autocomplete="current-password"
                  [value]="senha()"
                  (input)="senha.set(senhaInput.value); erro.set(null)"
                  placeholder="Sua senha"
                  class="h-11 w-full rounded-control border bg-surface pl-10 pr-10 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
                />
                <button
                  type="button"
                  (click)="mostrarSenha.set(!mostrarSenha())"
                  [attr.aria-label]="mostrarSenha() ? 'Ocultar senha' : 'Mostrar senha'"
                  class="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-control text-faint transition-colors hover:text-fg"
                >
                  @if (mostrarSenha()) {
                    <svg viewBox="0 0 20 20" fill="none" class="size-4.5" aria-hidden="true"><path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" stroke-width="1.4" /><circle cx="10" cy="10" r="2.25" stroke="currentColor" stroke-width="1.4" /><path d="m3 3 14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>
                  } @else {
                    <svg viewBox="0 0 20 20" fill="none" class="size-4.5" aria-hidden="true"><path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" stroke-width="1.4" /><circle cx="10" cy="10" r="2.25" stroke="currentColor" stroke-width="1.4" /></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              [disabled]="enviando()"
              class="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              @if (enviando()) {
                <svg viewBox="0 0 24 24" fill="none" class="size-4 animate-spin" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
                Entrando…
              } @else {
                Entrar
              }
            </button>
          </form>

          <p class="mt-8 text-center text-[0.8125rem] text-faint">
            Não tem acesso? Fale com o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly theme = inject(ThemeService);

  protected readonly ano = new Date().getFullYear();
  protected readonly destaques = [
    'Controle de entradas e saídas em tempo real',
    'Contratos, gastos e rateio por EPC',
    'Auto-atendimento do colaborador por QR Code',
  ];

  protected readonly email = signal('');
  protected readonly senha = signal('');
  protected readonly mostrarSenha = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly enviando = signal(false);

  constructor() {
    afterNextRender(() => {
      if (this.auth.autenticado()) {
        this.router.navigateByUrl('/painel');
      }
    });
  }

  protected entrar(): void {
    const email = this.email().trim();
    const senha = this.senha();
    if (!email || !senha) {
      this.erro.set('Informe e-mail e senha.');
      return;
    }
    if (this.enviando()) return;
    this.enviando.set(true);
    this.erro.set(null);
    this.auth.login(email, senha).subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigateByUrl('/painel');
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        const body = e.error as ApiError | null;
        this.erro.set(
          e.status === 0
            ? 'Sem conexão com o servidor. Tente novamente.'
            : (body?.message ?? 'Não foi possível entrar. Verifique os dados.'),
        );
      },
    });
  }
}
