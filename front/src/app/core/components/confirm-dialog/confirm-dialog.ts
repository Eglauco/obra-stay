import {
  Component,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  host: {
    '(keydown.escape)': 'onCancel()',
  },
  template: `
    <div
      class="dlg-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      (click)="onBackdrop($event)"
    >
      <div
        #panel
        class="dlg-panel w-full max-w-md rounded-card border bg-surface p-6 shadow-pop"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="descId"
        tabindex="-1"
      >
        <div class="flex items-start gap-4">
          <span
            class="grid size-11 shrink-0 place-items-center rounded-full"
            style="background-color: var(--color-danger-soft); color: var(--color-danger)"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" class="size-5">
              <path d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <div class="min-w-0">
            <h2 [id]="titleId" class="font-display text-lg font-semibold text-fg">
              {{ title() }}
            </h2>
            <p [id]="descId" class="mt-1.5 text-sm leading-relaxed text-muted">
              {{ message() }}
            </p>
          </div>
        </div>

        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
            (click)="onCancel()"
          >
            {{ cancelLabel() }}
          </button>
          <button
            #confirmBtn
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold text-[var(--color-danger-fg)] shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            style="background-color: var(--color-danger)"
            [disabled]="loading()"
            (click)="onConfirm()"
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
    .dlg-panel {
      animation: dlg-pop 0.15s ease both;
    }
    @keyframes dlg-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes dlg-pop {
      from { opacity: 0; transform: translateY(6px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .dlg-backdrop, .dlg-panel { animation: none; }
    }
  `,
})
export class ConfirmDialog {
  readonly title = input('Confirmar');
  readonly message = input('Tem certeza?');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly loading = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly confirmBtn = viewChild.required<ElementRef<HTMLButtonElement>>('confirmBtn');

  protected readonly titleId = `confirm-title-${Math.random().toString(36).slice(2, 8)}`;
  protected readonly descId = `confirm-desc-${Math.random().toString(36).slice(2, 8)}`;

  constructor() {
    afterNextRender(() => this.confirmBtn().nativeElement.focus());
    effect((onCleanup) => {
      const el = this.panel().nativeElement;
      const handler = (e: KeyboardEvent) => this.trap(e, el);
      el.addEventListener('keydown', handler);
      onCleanup(() => el.removeEventListener('keydown', handler));
    });
  }

  protected onConfirm(): void {
    if (!this.loading()) this.confirmed.emit();
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.onCancel();
  }

  private trap(e: KeyboardEvent, root: HTMLElement): void {
    if (e.key !== 'Tab') return;
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
}
