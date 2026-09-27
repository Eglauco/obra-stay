import { Component, afterNextRender, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LocalService } from '../../../core/services/local.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/colaborador.model';
import { Local } from '../../../core/models/local.model';

/** Opção de status exibida no seletor do modal. */
export interface StatusOpcao {
  id: number;
  nome: string;
  hospedagemLiberada: boolean;
}

/** Modal para trocar o status de um local (aplicação imediata + observação opcional). */
@Component({
  selector: 'app-trocar-status-dialog',
  host: {
    '(keydown.escape)': 'cancelar()',
  },
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" (click)="cancelar()" aria-hidden="true"></div>

      <div
        class="relative w-full max-w-md rounded-card border bg-surface p-6 shadow-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tst-titulo"
        tabindex="-1"
        (keydown)="trap($event)"
      >
        <div class="flex items-start gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" class="size-5"><path d="M4 7h9m0 0-3-3m3 3-3 3M16 13H7m0 0 3-3m-3 3 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </span>
          <div class="min-w-0 flex-1">
            <h3 id="tst-titulo" class="font-display text-lg font-semibold text-fg">Trocar status</h3>
            <p class="mt-0.5 text-sm text-muted">Escolha o novo status e registre uma observação (opcional).</p>
          </div>
        </div>

        <form class="mt-5 flex flex-col gap-4" (submit)="$event.preventDefault(); salvar()" novalidate>
          <div class="flex flex-col gap-1.5">
            <label for="tst-status" class="text-sm font-medium text-fg">Novo status <span class="text-danger" aria-hidden="true">*</span></label>
            <select #sel id="tst-status" [value]="statusId() ?? ''" (change)="statusId.set(sel.value ? +sel.value : null); limpar('statusId')"
              class="h-11 w-full rounded-control border bg-canvas px-3 text-sm text-fg outline-none transition-colors focus:border-accent"
              [style.border-color]="erroStatus() ? 'var(--color-danger)' : null"
              [attr.aria-invalid]="erroStatus() ? 'true' : null"
              [attr.aria-describedby]="erroStatus() ? 'tst-status-erro' : null">
              <option value="" disabled>Selecione…</option>
              @for (o of opcoes(); track o.id) {
                <option [value]="o.id">{{ o.nome }}{{ o.hospedagemLiberada ? '' : ' (bloqueia hospedagem)' }}</option>
              }
            </select>
            @if (erroStatus()) { <p id="tst-status-erro" class="text-[0.8125rem] text-danger">{{ erroStatus() }}</p> }
            @else if (selecionadoBloqueia()) {
              <p class="flex items-center gap-1.5 text-[0.8125rem]" style="color: var(--color-warning)">
                <svg viewBox="0 0 20 20" fill="none" class="size-4 shrink-0" aria-hidden="true"><path d="M10 6.5v4m0 3h.01M10 2.5 1.5 17h17L10 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                Este status impede novas hospedagens no local.
              </p>
            }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="tst-obs" class="text-sm font-medium text-fg">Observação</label>
            <textarea #obs id="tst-obs" rows="3" [value]="observacao()" (input)="observacao.set(obs.value); limpar('observacao')"
              placeholder="Motivo da mudança (opcional)"
              class="w-full resize-y rounded-control border bg-canvas px-3.5 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
              [style.border-color]="erroObs() ? 'var(--color-danger)' : null"></textarea>
            @if (erroObs()) { <p class="text-[0.8125rem] text-danger">{{ erroObs() }}</p> }
          </div>

          <div class="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" (click)="cancelar()" [disabled]="salvando()"
              class="inline-flex h-11 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2">
              Cancelar
            </button>
            <button type="submit" [disabled]="salvando() || !podeSalvar()"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70">
              @if (salvando()) {
                <svg viewBox="0 0 24 24" fill="none" class="size-4 animate-spin" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
              }
              Trocar status
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class TrocarStatusDialog {
  private readonly service = inject(LocalService);
  private readonly toast = inject(ToastService);

  readonly localId = input.required<number>();
  readonly statusAtualId = input<number | null>(null);
  readonly opcoes = input<StatusOpcao[]>([]);

  readonly trocado = output<Local>();
  readonly fechar = output<void>();

  protected readonly statusId = signal<number | null>(null);
  protected readonly observacao = signal('');
  protected readonly salvando = signal(false);
  protected readonly submetido = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly erroStatus = computed(() => {
    if (this.serverErrors()['statusId']) return this.serverErrors()['statusId'];
    if (!this.submetido()) return null;
    if (this.statusId() == null) return 'Selecione um status.';
    if (this.statusId() === this.statusAtualId()) return 'O local já está com este status.';
    return null;
  });
  protected readonly erroObs = computed(() => this.serverErrors()['observacao'] ?? null);

  protected readonly selecionadoBloqueia = computed(() => {
    const id = this.statusId();
    if (id == null) return false;
    const o = this.opcoes().find((x) => x.id === id);
    return !!o && !o.hospedagemLiberada;
  });

  protected readonly podeSalvar = computed(
    () => this.statusId() != null && this.statusId() !== this.statusAtualId(),
  );

  constructor() {
    // Foco inicial no select assim que o modal é renderizado (browser-only).
    afterNextRender(() => document.getElementById('tst-status')?.focus());
  }

  /** Focus trap (Tab/Shift+Tab) dentro do modal; a raiz é o próprio painel do evento. */
  protected trap(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    const root = e.currentTarget as HTMLElement;
    const focusables = root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  protected limpar(campo: string): void {
    if (this.serverErrors()[campo]) {
      this.serverErrors.update((e) => {
        const next = { ...e };
        delete next[campo];
        return next;
      });
    }
  }

  protected cancelar(): void {
    if (!this.salvando()) this.fechar.emit();
  }

  protected salvar(): void {
    this.submetido.set(true);
    this.serverErrors.set({});
    if (!this.podeSalvar() || this.salvando()) return;

    this.salvando.set(true);
    this.service
      .trocarStatus(this.localId(), {
        statusId: this.statusId()!,
        observacao: this.observacao().trim() || null,
      })
      .subscribe({
        next: (local) => {
          this.salvando.set(false);
          this.toast.success('Status atualizado', `Novo status: ${local.statusNome ?? '—'}.`);
          this.trocado.emit(local);
        },
        error: (e: HttpErrorResponse) => {
          this.salvando.set(false);
          const body = e.error as ApiError | null;
          if (body?.fieldErrors?.length) {
            const map: Record<string, string> = {};
            for (const fe of body.fieldErrors) map[fe.field] = fe.message;
            this.serverErrors.set(map);
          } else {
            this.toast.error('Não foi possível trocar o status', body?.message ?? 'Tente novamente.');
          }
        },
      });
  }
}
