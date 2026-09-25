import { Component, inject, output } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  host: { class: 'contents' },
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

      <!-- Marca (apenas no mobile, onde a sidebar fica oculta) -->
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
    </header>
  `,
})
export class Topbar {
  readonly menu = output<void>();
  protected readonly theme = inject(ThemeService);
}
