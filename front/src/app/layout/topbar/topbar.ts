import {
  Component,
  DestroyRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificacaoFeed, NotificacaoItem } from '../../core/models/notificacao.model';
import { TrocarSenhaDialog } from '../../features/auth/trocar-senha-dialog/trocar-senha-dialog';
import { formatarDataHora } from '../../core/util/format';

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

      <!-- Notificações (sino) -->
      @if (usuario()) {
        <div class="relative">
          <button
            type="button"
            (click)="toggleNotif()"
            (keydown.escape)="notifAberto.set(false)"
            [attr.aria-expanded]="notifAberto()"
            aria-haspopup="true"
            [attr.aria-label]="'Notificações' + (naoLidas() > 0 ? ' (' + naoLidas() + ' não lidas)' : '')"
            class="relative grid size-9 shrink-0 place-items-center rounded-control border text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <svg viewBox="0 0 24 24" fill="none" class="size-5" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <path d="M6 9a6 6 0 0 1 12 0c0 4.5 1.5 5.5 2 6H4c.5-.5 2-1.5 2-6Z" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke-linecap="round" />
            </svg>
            @if (naoLidas() > 0) {
              <span class="tabular absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-danger px-1 text-[0.625rem] font-bold leading-none text-[var(--color-danger-fg)]" aria-hidden="true">{{ naoLidas() > 9 ? '9+' : naoLidas() }}</span>
            }
          </button>

          @if (notifAberto()) {
            <div class="fixed inset-0 z-40" (click)="notifAberto.set(false)" aria-hidden="true"></div>
            <div class="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-card border bg-surface shadow-pop"
              aria-label="Notificações" (keydown.escape)="notifAberto.set(false)">
              <div class="flex items-center justify-between gap-2 border-b px-3 py-2.5">
                <p class="text-sm font-semibold text-fg">Notificações</p>
                @if (itens().length > 0) {
                  <button type="button" (click)="marcarTodas()" class="text-[0.75rem] font-medium text-accent transition-colors hover:underline">Marcar todas como lidas</button>
                }
              </div>
              <div class="max-h-96 overflow-y-auto">
                @if (itens().length === 0) {
                  <p class="px-3 py-8 text-center text-sm text-muted">Sem notificações.</p>
                } @else {
                  @for (n of itens(); track n.id) {
                    <button
                      type="button"
                      (click)="abrirNotificacao(n)"
                      class="flex w-full items-start gap-2.5 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-surface-2"
                      [class.bg-accent-soft]="!n.lida"
                    >
                      <span class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted" aria-hidden="true">
                        @switch (n.tipo) {
                          @case ('ENTRADA') {
                            <svg viewBox="0 0 20 20" fill="none" class="size-4" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M11 4H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5M8.5 10H16m0 0-2.5-2.5M16 10l-2.5 2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                          }
                          @case ('SAIDA') {
                            <svg viewBox="0 0 20 20" fill="none" class="size-4" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 4h5a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9M11.5 10H4m0 0 2.5-2.5M4 10l2.5 2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                          }
                          @default {
                            <svg viewBox="0 0 20 20" fill="none" class="size-4" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9l-3 2.5V13H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke-linecap="round" stroke-linejoin="round" /></svg>
                          }
                        }
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block text-sm text-fg" [class.font-semibold]="!n.lida">{{ n.titulo }}</span>
                        <span class="tabular mt-0.5 block text-[0.75rem] text-muted">{{ fmtData(n.dataHora) }}</span>
                      </span>
                      @if (!n.lida) {
                        <span class="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-hidden="true"></span>
                      }
                    </button>
                  }
                }
              </div>
            </div>
          }
        </div>
      }

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
  private readonly notificacoes = inject(NotificacaoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly usuario = this.auth.usuario;
  protected readonly menuAberto = signal(false);
  protected readonly trocarSenhaAberto = signal(false);

  protected readonly feed = signal<NotificacaoFeed | null>(null);
  protected readonly notifAberto = signal(false);
  protected readonly naoLidas = computed(() => this.feed()?.naoLidas ?? 0);
  protected readonly itens = computed(() => this.feed()?.itens ?? []);
  protected readonly fmtData = formatarDataHora;

  constructor() {
    afterNextRender(() => {
      this.carregar();
      const intervalo = setInterval(() => this.carregar(), 60000);
      this.destroyRef.onDestroy(() => clearInterval(intervalo));
    });
  }

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

  // ----- notificações -----

  private carregar(): void {
    if (!this.isBrowser || !this.auth.autenticado()) return;
    this.notificacoes.feed().subscribe({
      next: (f) => this.feed.set(f),
      error: () => {},
    });
  }

  protected toggleNotif(): void {
    const abrir = !this.notifAberto();
    this.notifAberto.set(abrir);
    if (abrir) this.carregar();
  }

  protected abrirNotificacao(n: NotificacaoItem): void {
    this.notifAberto.set(false);
    if (!n.lida) {
      this.feed.update((f) =>
        f
          ? {
              naoLidas: Math.max(0, f.naoLidas - 1),
              itens: f.itens.map((i) => (i.id === n.id ? { ...i, lida: true } : i)),
            }
          : f,
      );
      this.notificacoes.marcarLida(n.id).subscribe({ error: () => this.carregar() });
    }
    this.router.navigateByUrl(n.rota);
  }

  protected marcarTodas(): void {
    this.feed.update((f) => (f ? { naoLidas: 0, itens: f.itens.map((i) => ({ ...i, lida: true })) } : f));
    this.notificacoes.marcarTodasLidas().subscribe({
      next: () => this.carregar(),
      error: () => {
        this.carregar();
        this.toast.error('Não foi possível marcar como lidas', 'Tente novamente em instantes.');
      },
    });
  }
}
