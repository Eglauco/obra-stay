import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialog } from '../../../core/components/confirm-dialog/confirm-dialog';
import { ApiError } from '../../../core/models/colaborador.model';
import { Usuario } from '../../../core/models/usuario.model';
import { formatarDataHora } from '../../../core/util/format';

/** Lista de usuários do sistema com cadastro (novo) e exclusão. */
@Component({
  selector: 'app-usuario-pesquisa',
  imports: [RouterLink, ConfirmDialog],
  template: `
    <section class="flex flex-col gap-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="font-display text-2xl font-semibold tracking-tight text-fg">Usuários</h2>
          <p class="mt-1 text-sm text-muted">Quem tem acesso ao sistema.</p>
        </div>
        <a routerLink="/usuarios/novo"
          class="inline-flex h-11 items-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover">
          <svg viewBox="0 0 20 20" fill="none" class="size-4.5" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
          Novo usuário
        </a>
      </div>

      <div class="overflow-hidden rounded-card border bg-surface shadow-card">
        <div class="flex items-center justify-between gap-3 border-b px-4 py-3">
          <span class="text-[0.8125rem] text-muted" aria-live="polite">
            @if (loading()) { Carregando… } @else { <strong class="tabular text-fg">{{ usuarios().length }}</strong> {{ usuarios().length === 1 ? 'usuário' : 'usuários' }} }
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
            <caption class="sr-only">Usuários do sistema</caption>
            <thead>
              <tr class="border-b bg-surface-2/50 text-[0.75rem] uppercase tracking-wide text-muted">
                <th scope="col" class="px-4 py-3 font-semibold uppercase tracking-wide">Nome</th>
                <th scope="col" class="px-4 py-3 font-semibold uppercase tracking-wide">E-mail</th>
                <th scope="col" class="w-44 px-4 py-3 font-semibold uppercase tracking-wide">Criado em</th>
                <th scope="col" class="w-20 px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (r of [0,1,2,3]; track r) {
                  <tr class="border-b border-border/70 last:border-0">
                    <td class="px-4 py-3.5"><span class="sk block h-4 w-40 max-w-full"></span></td>
                    <td class="px-4 py-3.5"><span class="sk block h-4 w-48 max-w-full"></span></td>
                    <td class="px-4 py-3.5"><span class="sk block h-4 w-24"></span></td>
                    <td class="px-4 py-3.5"><span class="sk ml-auto block h-4 w-8"></span></td>
                  </tr>
                }
              } @else {
                @for (u of usuarios(); track u.id) {
                  <tr class="border-b border-border/70 transition-colors last:border-0 hover:bg-surface-2/50">
                    <td class="px-4 py-3.5 font-medium text-fg">
                      {{ u.nome }}
                      @if (u.id === meuId()) { <span class="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-accent">você</span> }
                    </td>
                    <td class="px-4 py-3.5 text-muted">{{ u.email }}</td>
                    <td class="tabular px-4 py-3.5 text-muted">{{ fmtData(u.criadoEm ?? null) }}</td>
                    <td class="px-4 py-3.5">
                      <div class="flex items-center justify-end">
                        <button type="button" (click)="pedirExclusao(u)" [disabled]="u.id === meuId()"
                          [attr.aria-label]="'Excluir ' + u.nome" title="Excluir usuário"
                          class="grid size-8 place-items-center rounded-control text-muted transition-colors hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted">
                          <svg viewBox="0 0 20 20" fill="none" class="size-4.5" aria-hidden="true"><path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2 0v9.5A1.5 1.5 0 0 1 12.5 17h-5A1.5 1.5 0 0 1 6 15.5V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        @if (!loading() && usuarios().length === 0) {
          <div class="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <p class="text-sm text-muted">Nenhum usuário cadastrado.</p>
          </div>
        }

        @if (erro() && !loading()) {
          <div class="flex items-center gap-2 border-t px-4 py-3 text-sm text-danger">
            <svg viewBox="0 0 20 20" fill="none" class="size-4 shrink-0" aria-hidden="true"><path d="M10 6.5v4m0 3h.01M10 2.5 1.5 17h17L10 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            {{ erro() }}
          </div>
        }
      </div>
    </section>

    @if (aExcluir(); as alvo) {
      <app-confirm-dialog
        title="Excluir usuário"
        [message]="'Excluir o usuário ' + alvo.nome + '? Esta ação não pode ser desfeita.'"
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        [loading]="excluindo()"
        (confirmed)="confirmarExclusao()"
        (cancelled)="cancelarExclusao()"
      />
    }
  `,
})
export class UsuarioPesquisa {
  private readonly service = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly aExcluir = signal<Usuario | null>(null);
  protected readonly excluindo = signal(false);

  protected readonly meuId = computed(() => this.auth.usuario()?.id ?? null);
  protected readonly fmtData = formatarDataHora;

  constructor() {
    afterNextRender(() => this.carregar());
  }

  private carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    this.service.listar().subscribe({
      next: (us) => {
        this.usuarios.set(us);
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.loading.set(false);
        this.erro.set(this.mensagemErro(e));
      },
    });
  }

  protected pedirExclusao(u: Usuario): void {
    if (u.id === this.meuId()) return;
    this.aExcluir.set(u);
  }
  protected cancelarExclusao(): void {
    if (!this.excluindo()) this.aExcluir.set(null);
  }
  protected confirmarExclusao(): void {
    const u = this.aExcluir();
    if (!u || this.excluindo()) return;
    this.excluindo.set(true);
    this.service.excluir(u.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.aExcluir.set(null);
        this.toast.success('Usuário excluído', `${u.nome} foi removido.`);
        this.carregar();
      },
      error: (e: HttpErrorResponse) => {
        this.excluindo.set(false);
        this.aExcluir.set(null);
        const body = e.error as ApiError | null;
        this.toast.error('Não foi possível excluir', body?.message ?? this.mensagemErro(e));
      },
    });
  }

  private mensagemErro(e: HttpErrorResponse): string {
    if (e.status === 0) return 'Sem conexão com o servidor. Verifique se a API está no ar (porta 8080).';
    const body = e.error as ApiError | null;
    return body?.message ?? 'Ocorreu um erro inesperado ao falar com o servidor.';
  }
}
