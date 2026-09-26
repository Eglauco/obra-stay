import { Component, inject, output, signal } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { TrocarSenhaDialog } from '../../features/auth/trocar-senha-dialog/trocar-senha-dialog';

@Component({
  selector: 'app-topbar',
  host: { class: 'contents' },
  imports: [TrocarSenhaDialog],
  template: `
    <header
      class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-surface/80 px-4 backdrop-blur-md sm:px-6 lg:px-8"
    >
      <button
        type="button"
        (click)="menu.emit()"
        aria-label="Abrir menu de navegação"
        class="grid size-9 shrink-0 place-items-center rounded-control text-muted transition-colors hover:bg-surface-2 hover:text-fg lg:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" class="size-5" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
        </svg>
      </button>

      <span class="font-display text-base font-bold text-fg lg:hidden">
        Obra<span class="text-accent">Stay</span>
      </span>

      <div class="flex-1"></div>

      <button
        type="button"
        (click)="theme.toggle()"
        aria-label="Alternar tema claro e escuro"
        title="Alternar tema"
        class="grid size-9 shrink-0 place-items-center rounded-control border text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <svg viewBox="0 0 24 24" fill="none" class="size-5 dark:hidden" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="3.75" />
          <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36-1.42-1.42M7.05 7.05 5.64 5.64m12.72 0-1.42 1.42M7.05 16.95l-1.41 1.41" stroke-linecap="round" />
        </svg>
        <svg viewBox="0 0 24 24" fill="none" class="hidden size-5 dark:block" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <!-- Usuário logado -->
      @if (usuario(); as u) {
        <div class="relative">
          <button
            type="button"
            (click)="menuAberto.set(!menuAberto())"
            [attr.aria-expanded]="menuAberto()"
            aria-haspopup="menu"
            class="flex h-9 items-center gap-2 rounded-control border pl-1 pr-2 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
          >
            <span class="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-[0.75rem] font-semibold text-accent-fg" aria-hidden="true">{{ iniciais(u.nome) }}</span>
            <span class="hidden max-w-[10rem] truncate sm:block">{{ u.nome }}</span>
            <svg viewBox="0 0 20 20" fill="none" class="size-4 shrink-0 text-faint" aria-hidden="true"><path d="m6 8 4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>

          @if (menuAberto()) {
            <div class="fixed inset-0 z-40" (click)="menuAberto.set(false)" aria-hidden="true"></div>
            <div class="absolute right-0 z-50 mt-2 w-60 rounded-card border bg-surface p-1.5 shadow-pop" role="menu">
              <div class="border-b px-3 py-2.5">
                <p class="truncate text-sm font-semibold text-fg">{{ u.nome }}</p>
                <p class="truncate text-[0.8125rem] text-muted">{{ u.email }}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                (click)="abrirTrocarSenha()"
                class="mt-1 flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-sm font-medium text-fg transition-colors hover:bg-surface-2"
              >
                <svg viewBox="0 0 20 20" fill="none" class="size-4.5 text-muted" aria-hidden="true"><path d="M6 9V6.5a4 4 0 0 1 8 0V9M5 9h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
                Trocar senha
              </button>
              <button
                type="button"
                role="menuitem"
                (click)="sair()"
                class="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
              >
                <svg viewBox="0 0 20 20" fill="none" class="size-4.5" aria-hidden="true"><path d="M13 5l4 5-4 5M17 10H7M9 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                Sair
              </button>
            </div>
          }
        </div>
      }
    </header>

    @if (trocarSenhaAberto()) {
      <app-trocar-senha-dialog (fechar)="trocarSenhaAberto.set(false)" />
    }
  `,
})
export class Topbar {
  readonly menu = output<void>();
  protected readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);

  protected readonly usuario = this.auth.usuario;
  protected readonly menuAberto = signal(false);
  protected readonly trocarSenhaAberto = signal(false);

  protected iniciais(nome: string): string {
    const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  protected abrirTrocarSenha(): void {
    this.menuAberto.set(false);
    this.trocarSenhaAberto.set(true);
  }

  protected sair(): void {
    this.menuAberto.set(false);
    this.auth.logout();
  }
}
