import {
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { HistoricoStatus } from '../../../core/models/solicitacao.model';
import { HistoricoTimeline } from '../../../core/components/historico-timeline/historico-timeline';

/** Modal (admin) com a linha do tempo do histórico de status de uma solicitação. */
@Component({
  selector: 'app-solicitacao-historico-dialog',
  imports: [HistoricoTimeline],
  host: { '(keydown.escape)': 'fechar.emit()' },
  template: `
    <div class="dlg-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" (click)="onBackdrop($event)">
      <div
        #panel
        class="dlg-panel flex max-h-[85dvh] w-full max-w-md flex-col rounded-card border bg-surface shadow-pop"
        role="dialog"
        aria-modal="true"
        aria-label="Histórico da solicitação"
        tabindex="-1"
      >
        <div class="flex items-start justify-between gap-3 border-b p-5">
          <div class="min-w-0">
            <h2 class="font-display text-lg font-semibold text-fg">Histórico</h2>
            @if (titulo()) {
              <p class="mt-0.5 truncate text-sm text-muted">{{ titulo() }}</p>
            }
          </div>
          <button
            type="button"
            (click)="fechar.emit()"
            aria-label="Fechar"
            class="grid size-9 shrink-0 place-items-center rounded-control text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <svg viewBox="0 0 20 20" fill="none" class="size-5" aria-hidden="true"><path d="m6 6 8 8M14 6l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
          </button>
        </div>

        <div class="overflow-auto p-6">
          @if (carregando()) {
            <div class="flex items-center justify-center gap-2 text-sm text-muted">
              <svg viewBox="0 0 24 24" fill="none" class="size-5 animate-spin text-accent" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
              Carregando…
            </div>
          } @else if (erro()) {
            <p class="text-sm text-danger">{{ erro() }}</p>
          } @else if (itens().length === 0) {
            <p class="text-sm text-muted">Sem histórico registrado.</p>
          } @else {
            <app-historico-timeline [itens]="itens()" />
          }
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
export class SolicitacaoHistoricoDialog {
  readonly solicitacaoId = input.required<number>();
  readonly titulo = input('');
  readonly fechar = output<void>();

  private readonly service = inject(SolicitacaoService);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  protected readonly itens = signal<HistoricoStatus[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      this.panel().nativeElement.focus();
      this.carregar();
    });
  }

  private carregar(): void {
    this.service.historico(this.solicitacaoId()).subscribe({
      next: (h) => {
        this.itens.set(h);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar o histórico.');
      },
    });
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.fechar.emit();
  }
}
