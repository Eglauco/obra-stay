import {
  Component,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Diálogo de "dar saída" (check-out): confirma a data de saída de uma hospedagem. */
@Component({
  selector: 'app-hospedagem-saida-dialog',
  host: { '(keydown.escape)': 'onCancel()' },
  template: `
    <div class="dlg-backdrop fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" (click)="onBackdrop($event)">
      <div
        #panel
        class="dlg-panel flex w-full max-w-md flex-col rounded-t-card border bg-surface shadow-pop sm:rounded-card"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        tabindex="-1"
      >
        <header class="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <p class="text-[0.75rem] font-medium uppercase tracking-wide text-accent">Check-out</p>
            <h2 [id]="titleId" class="mt-0.5 font-display text-xl font-semibold text-fg">Dar saída</h2>
          </div>
          <button type="button" class="-m-1.5 grid size-9 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-fg" (click)="onCancel()" aria-label="Fechar">
            <svg viewBox="0 0 20 20" fill="none" class="size-5" aria-hidden="true"><path d="m6 6 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" /></svg>
          </button>
        </header>

        <div class="flex flex-col gap-4 px-6 py-6">
          <p class="text-sm text-muted">
            Encerrar a hospedagem de <span class="font-medium text-fg">{{ colaboradorNome() }}</span>
            em <span class="font-medium text-fg">{{ localNome() }}</span>.
          </p>

          <div class="flex flex-col gap-1.5">
            <label for="saida-data" class="text-sm font-medium text-fg">Data de saída <span class="text-danger" aria-hidden="true">*</span></label>
            <input
              #dataInput
              id="saida-data"
              type="date"
              [value]="dataSaida()"
              [min]="dataEntradaMin()"
              (input)="onData(dataInput.value)"
              class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors focus:border-accent"
              [style.border-color]="erro() ? 'var(--color-danger)' : null"
            />
            @if (erro()) { <p class="text-[0.8125rem] text-danger">{{ erro() }}</p> }
          </div>
        </div>

        <div class="flex flex-col-reverse gap-2 px-6 pb-6 sm:flex-row sm:justify-end">
          <button type="button" class="inline-flex h-11 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2" (click)="onCancel()" [disabled]="loading()">
            Cancelar
          </button>
          <button
            #confirmBtn
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
            [disabled]="loading() || !dataSaida()"
            (click)="onConfirm()"
          >
            @if (loading()) {
              <svg viewBox="0 0 24 24" fill="none" class="size-4 animate-spin" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
            }
            Confirmar saída
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .dlg-backdrop { background: color-mix(in srgb, #0b1120 55%, transparent); backdrop-filter: blur(2px); animation: dlg-fade 0.15s ease both; }
    .dlg-panel { animation: dlg-pop 0.16s ease both; }
    @keyframes dlg-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes dlg-pop { from { opacity: 0; transform: translateY(10px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @media (prefers-reduced-motion: reduce) { .dlg-backdrop, .dlg-panel { animation: none; } }
  `,
})
export class HospedagemSaidaDialog {
  readonly colaboradorNome = input('');
  readonly localNome = input('');
  readonly dataEntradaMin = input<string | null>(null);
  readonly loading = input(false);
  readonly erro = input<string | null>(null);

  readonly confirmar = output<string>();
  readonly cancelar = output<void>();

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly confirmBtn = viewChild.required<ElementRef<HTMLButtonElement>>('confirmBtn');

  protected readonly titleId = 'saida-title';
  protected readonly dataSaida = signal('');

  constructor() {
    afterNextRender(() => {
      this.dataSaida.set(this.hoje());
      this.confirmBtn().nativeElement.focus();
    });
    effect((onCleanup) => {
      const el = this.panel().nativeElement;
      const handler = (e: KeyboardEvent) => this.trap(e, el);
      el.addEventListener('keydown', handler);
      onCleanup(() => el.removeEventListener('keydown', handler));
    });
  }

  protected onData(valor: string): void {
    this.dataSaida.set(valor);
  }

  protected onConfirm(): void {
    if (this.loading() || !this.dataSaida()) return;
    this.confirmar.emit(this.dataSaida());
  }

  protected onCancel(): void {
    if (!this.loading()) this.cancelar.emit();
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.onCancel();
  }

  private hoje(): string {
    if (!this.isBrowser) return '';
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  private trap(e: KeyboardEvent, root: HTMLElement): void {
    if (e.key !== 'Tab') return;
    const focusables = root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
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
}
