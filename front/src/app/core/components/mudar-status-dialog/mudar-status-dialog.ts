import {
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

/**
 * Modal de troca de status: mostra a ação e permite deixar uma observação
 * (opcional) que entra no histórico e fica visível ao colaborador.
 */
@Component({
  selector: 'app-mudar-status-dialog',
  host: { '(keydown.escape)': 'cancelar.emit()' },
  template: `
    <div class="dlg-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" (click)="onBackdrop($event)">
      <div
        #panel
        class="dlg-panel w-full max-w-md rounded-card border bg-surface p-6 shadow-pop"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="titulo()"
        tabindex="-1"
      >
        <h2 class="font-display text-lg font-semibold text-fg">{{ titulo() }}</h2>
        @if (descricao()) {
          <p class="mt-1.5 text-sm text-muted">{{ descricao() }}</p>
        }

        <label for="ms-obs" class="mt-4 block text-sm font-medium text-fg">Observação (opcional)</label>
        <textarea
          #obs
          id="ms-obs"
          rows="3"
          maxlength="1000"
          [value]="texto()"
          (input)="texto.set(obs.value)"
          placeholder="Escreva uma observação que o colaborador poderá ver…"
          class="mt-1.5 w-full resize-y rounded-control border bg-canvas px-3.5 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
        ></textarea>

        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
            (click)="cancelar.emit()"
            [disabled]="loading()"
          >
            Cancelar
          </button>
          <button
            #confirmBtn
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            [style.background-color]="perigo() ? 'var(--color-danger)' : 'var(--color-accent)'"
            [style.color]="perigo() ? 'var(--color-danger-fg)' : 'var(--color-accent-fg)'"
            [disabled]="loading()"
            (click)="onConfirmar()"
          >
            @if (loading()) {
              <svg viewBox="0 0 24 24" fill="none" class="size-4 animate-spin" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
            }
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .dlg-backdrop {
      background: color-mix(in srgb, #0b1120 55%, transparent);
      backdrop-filter: blur(2px);
      animation: dlg-fade 0.15s ease both;
    }
    .dlg-panel { animation: dlg-pop 0.15s ease both; }
    @keyframes dlg-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes dlg-pop {
      from { opacity: 0; transform: translateY(6px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) { .dlg-backdrop, .dlg-panel { animation: none; } }
  `,
})
export class MudarStatusDialog {
  readonly titulo = input('Alterar status');
  readonly descricao = input('');
  readonly confirmLabel = input('Confirmar');
  readonly loading = input(false);
  readonly perigo = input(false);

  readonly confirmar = output<string>();
  readonly cancelar = output<void>();

  private readonly confirmBtn = viewChild.required<ElementRef<HTMLButtonElement>>('confirmBtn');
  protected readonly texto = signal('');

  constructor() {
    afterNextRender(() => this.confirmBtn().nativeElement.focus());
  }

  protected onConfirmar(): void {
    if (!this.loading()) this.confirmar.emit(this.texto());
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget && !this.loading()) this.cancelar.emit();
  }
}
