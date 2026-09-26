import { Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  key: string;
  label: string;
  route: string | null;
}

@Component({
  selector: 'app-sidebar',
  host: { class: 'contents' },
  imports: [RouterLink, RouterLinkActive, NgTemplateOutlet],
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        (click)="close.emit()"
        aria-hidden="true"
      ></div>
    }

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-surface transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:translate-x-0"
      [class.-translate-x-full]="!open()"
      [class.translate-x-0]="open()"
    >
      <!-- Marca -->
      <div class="flex h-16 items-center gap-2.5 border-b px-4">
        <span
          class="grid size-9 place-items-center rounded-xl bg-accent font-display text-sm font-bold text-accent-fg"
          aria-hidden="true"
          >OS</span
        >
        <div class="leading-tight">
          <p class="font-display text-base font-bold text-fg">
            Obra<span class="text-accent">Stay</span>
          </p>
          <p class="text-[0.6875rem] text-faint">Hospedagem em obras</p>
        </div>
      </div>

      <!-- Navegação -->
      <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
        <p class="px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-faint">
          Menu
        </p>
        <div class="flex flex-col gap-0.5">
          @for (item of navItens; track item.key) {
            @if (item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive
                #rla="routerLinkActive"
                (click)="close.emit()"
                [attr.aria-current]="rla.isActive ? 'page' : null"
                [class]="linkCls(rla.isActive)"
              >
                @if (rla.isActive) {
                  <span class="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" aria-hidden="true"></span>
                }
                <ng-container [ngTemplateOutlet]="icone" [ngTemplateOutletContext]="{ $implicit: item.key }" />
                <span class="flex-1">{{ item.label }}</span>
              </a>
            } @else {
              <div [class]="disabledCls" aria-disabled="true">
                <ng-container [ngTemplateOutlet]="icone" [ngTemplateOutletContext]="{ $implicit: item.key }" />
                <span class="flex-1">{{ item.label }}</span>
                <span
                  class="rounded-full bg-surface-2 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-faint"
                  >em breve</span
                >
              </div>
            }
          }
        </div>
      </nav>

      <!-- Rodapé -->
      <div class="border-t px-4 py-3">
        <p class="text-[0.6875rem] text-faint">ObraStay · v0.1</p>
      </div>
    </aside>

    <ng-template #icone let-key>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        class="size-5 shrink-0"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        @switch (key) {
          @case ('painel') {
            <path d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
          }
          @case ('colaboradores') {
            <path d="M15 19.13a9.38 9.38 0 0 0 2.63.37 9.34 9.34 0 0 0 4.12-.95 4.13 4.13 0 0 0-7.53-2.5M15 19.13v-.01c0-1.11-.29-2.16-.79-3.07M15 19.13v.1A12.32 12.32 0 0 1 8.62 21c-2.33 0-4.51-.64-6.37-1.77v-.11a6.38 6.38 0 0 1 11.96-3.07M12 6.38a3.38 3.38 0 1 1-6.75 0 3.38 3.38 0 0 1 6.75 0Zm8.25 2.25a2.63 2.63 0 1 1-5.25 0 2.63 2.63 0 0 1 5.25 0Z" />
          }
          @case ('funcoes') {
            <path d="M4 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
            <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8M3 12.5h18" />
          }
          @case ('epc') {
            <path d="M12 3 4.5 6v5c0 4.55 3.15 7.53 7.5 9 4.35-1.47 7.5-4.45 7.5-9V6L12 3Z" />
            <path d="m8.75 12 2.25 2.25L15.5 9.75" />
          }
          @case ('empresas') {
            <path d="M3 21h18M5 21V4.5A1.5 1.5 0 0 1 6.5 3h7A1.5 1.5 0 0 1 15 4.5V21M18 21V9.5h1.5A1.5 1.5 0 0 1 21 11v10M8 7h3M8 10.5h3M8 14h3" />
          }
          @case ('gestoes') {
            <path d="M9 4h6a1 1 0 0 1 1 1v2.5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM3.5 15h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1ZM16.5 15h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1ZM12 8.5v3.5M5.5 15v-1.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1V15" />
          }
          @case ('locais') {
            <path d="M4 21V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M14 21V10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11M3 21h18M7.5 8.5h.01M10.5 8.5h.01M7.5 12h.01M10.5 12h.01M8 21v-3h2v3" />
          }
          @case ('locadoras') {
            <path d="M4 9.5 5.2 5.4A1.5 1.5 0 0 1 6.63 4.3h10.74a1.5 1.5 0 0 1 1.43 1.1L20 9.5M4 9.5v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9M4 9.5a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0M9.5 19.5v-4h5v4" />
          }
          @case ('tipos-solicitacao') {
            <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V16H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
            <path d="M8 9h8M8 12h5" />
          }
          @case ('hospedagens') {
            <path d="M2 5v14M2 10h16a3 3 0 0 1 3 3v6M21 19v-3M2 16h19M6.5 10V8.5A1.5 1.5 0 0 1 8 7h3a1.5 1.5 0 0 1 1.5 1.5V10" />
          }
          @case ('contratos') {
            <path d="M6 3h7l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
            <path d="M13 3v4h4M8.5 13h7M8.5 16h5" />
          }
          @case ('gastos') {
            <path d="M6 3h12a1 1 0 0 1 1 1v16l-2.5-1.4L14 20l-2-1.4L10 20l-2.5-1.4L5 20V4a1 1 0 0 1 1-1Z" />
            <path d="M9 8h6M9 11h6M9 14h4" />
          }
          @case ('solicitacoes') {
            <path d="M9 4.5h6M8 4.5a1 1 0 0 0-1 1V6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-.5a1 1 0 0 0-1-1M7 5.5H5.5A1.5 1.5 0 0 0 4 7v12a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19V7a1.5 1.5 0 0 0-1.5-1.5H17M8.5 13l1.75 1.75L14 11" />
          }
          @case ('obras') {
            <path d="M2.25 21h19.5M3.75 21V6.75A1.5 1.5 0 0 1 5.25 5.25h6a1.5 1.5 0 0 1 1.5 1.5V21M12.75 21V10.5a1.5 1.5 0 0 1 1.5-1.5h4.5a1.5 1.5 0 0 1 1.5 1.5V21M6.75 8.25h1.5m-1.5 3h1.5m-1.5 3h1.5m8.25-3h.75m-.75 3h.75" />
          }
          @case ('alojamentos') {
            <path d="M2.25 12 11.2 3.04a1.13 1.13 0 0 1 1.6 0L21.75 12M4.5 9.75V19.5A1.5 1.5 0 0 0 6 21h3.75v-5.25a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5V21H18a1.5 1.5 0 0 0 1.5-1.5V9.75" />
          }
          @case ('relatorios') {
            <path d="M3 13.13C3 12.5 3.5 12 4.13 12h2.25c.62 0 1.12.5 1.12 1.13v6.75c0 .62-.5 1.12-1.13 1.12H4.13A1.13 1.13 0 0 1 3 19.88v-6.75ZM9.75 8.63c0-.63.5-1.13 1.13-1.13h2.25c.62 0 1.12.5 1.12 1.13v11.25c0 .62-.5 1.12-1.13 1.12h-2.25a1.13 1.13 0 0 1-1.12-1.12V8.63ZM16.5 4.13c0-.63.5-1.13 1.13-1.13h2.25C20.5 3 21 3.5 21 4.13v15.75c0 .62-.5 1.12-1.13 1.12h-2.25a1.13 1.13 0 0 1-1.12-1.12V4.13Z" />
          }
        }
      </svg>
    </ng-template>
  `,
})
export class Sidebar {
  readonly open = input(false);
  readonly close = output<void>();

  protected readonly navItens: NavItem[] = [
    { key: 'painel', label: 'Painel', route: '/painel' },
    { key: 'colaboradores', label: 'Colaboradores', route: '/colaboradores' },
    { key: 'funcoes', label: 'Funções', route: '/funcoes' },
    { key: 'epc', label: 'EPC', route: '/epcs' },
    { key: 'empresas', label: 'Empresas', route: '/empresas' },
    { key: 'gestoes', label: 'Gestão', route: '/gestoes' },
    { key: 'locais', label: 'Locais', route: '/locais' },
    { key: 'locadoras', label: 'Locadoras', route: '/locadoras' },
    { key: 'tipos-solicitacao', label: 'Tipos de Solicitação', route: '/tipos-solicitacao' },
    { key: 'hospedagens', label: 'Hospedagens', route: '/hospedagens' },
    { key: 'contratos', label: 'Contratos', route: '/contratos' },
    { key: 'gastos', label: 'Gastos', route: '/gastos' },
    { key: 'solicitacoes', label: 'Solicitações', route: '/solicitacoes' },
    { key: 'obras', label: 'Obras', route: null },
    { key: 'relatorios', label: 'Relatórios', route: null },
  ];

  protected readonly disabledCls =
    'relative flex cursor-not-allowed items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-faint';

  protected linkCls(active: boolean): string {
    const base =
      'group relative flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors';
    return active
      ? `${base} bg-accent-soft text-accent`
      : `${base} text-muted hover:bg-surface-2 hover:text-fg`;
  }
}
