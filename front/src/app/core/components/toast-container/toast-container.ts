import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  host: { class: 'contents' },
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (t of toast.toasts(); track t.id) {
        <div
          role="status"
          class="toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border bg-surface p-3.5 shadow-pop"
          [class.border-border]="t.kind === 'info'"
          [style.border-color]="
            t.kind === 'success'
              ? 'var(--color-success)'
              : t.kind === 'error'
                ? 'var(--color-danger)'
                : null
          "
        >
          <span
            class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full"
            [style.background-color]="
              t.kind === 'success'
                ? 'var(--color-success-soft)'
                : t.kind === 'error'
                  ? 'var(--color-danger-soft)'
                  : 'var(--color-accent-soft)'
            "
            [style.color]="
              t.kind === 'success'
                ? 'var(--color-success)'
                : t.kind === 'error'
                  ? 'var(--color-danger)'
                  : 'var(--color-accent)'
            "
          >
            @switch (t.kind) {
              @case ('success') {
                <svg viewBox="0 0 20 20" fill="none" class="size-3.5" aria-hidden="true">
                  <path d="m5 10.5 3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              }
              @case ('error') {
                <svg viewBox="0 0 20 20" fill="none" class="size-3.5" aria-hidden="true">
                  <path d="M10 6v5m0 3h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              }
              @default {
                <svg viewBox="0 0 20 20" fill="none" class="size-3.5" aria-hidden="true">
                  <path d="M10 9v5m0-8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              }
            }
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-fg">{{ t.title }}</p>
            @if (t.message) {
              <p class="mt-0.5 text-[0.8125rem] leading-snug text-muted">{{ t.message }}</p>
            }
          </div>
          <button
            type="button"
            class="-m-1 grid size-7 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-fg"
            (click)="toast.dismiss(t.id)"
            aria-label="Fechar notificação"
          >
            <svg viewBox="0 0 20 20" fill="none" class="size-4" aria-hidden="true">
              <path d="m6 6 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-in {
      animation: toast-in 0.2s ease both;
    }
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .toast-in {
        animation: none;
      }
    }
  `,
})
export class ToastContainer {
  protected readonly toast = inject(ToastService);
}
