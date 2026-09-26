import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { GastoService } from '../../../core/services/gasto.service';
import { RateioGasto } from '../../../core/models/gasto.model';
import { formatarBRL } from '../../../core/util/format';

/** Modal com o rateio de um gasto por EPC (proporção de pessoas hospedadas por EPC). */
@Component({
  selector: 'app-rateio-dialog',
  host: { '(keydown.escape)': 'fechar.emit()' },
  template: `
    <div class="dlg-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" (click)="onBackdrop($event)">
      <div
        #panel
        class="dlg-panel flex max-h-[85dvh] w-full max-w-lg flex-col rounded-card border bg-surface shadow-pop"
        role="dialog"
        aria-modal="true"
        aria-label="Rateio do gasto por EPC"
        tabindex="-1"
      >
        <div class="flex items-start justify-between gap-3 border-b p-5">
          <div class="min-w-0">
            <h2 class="font-display text-lg font-semibold text-fg">Rateio por EPC</h2>
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

        <div class="overflow-auto p-5">
          @if (carregando()) {
            <div class="flex items-center justify-center gap-2 py-6 text-sm text-muted">
              <svg viewBox="0 0 24 24" fill="none" class="size-5 animate-spin text-accent" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
              Carregando…
            </div>
          } @else if (erro()) {
            <p class="py-4 text-sm text-danger">{{ erro() }}</p>
          } @else if (itens().length === 0) {
            <div class="rounded-card bg-surface-2 p-5 text-center text-sm text-muted">
              Não havia colaboradores hospedados no local para ratear este gasto.
            </div>
          } @else {
            <table class="w-full border-collapse text-left text-sm">
              <thead>
                <tr class="border-b text-[0.75rem] uppercase tracking-wide text-muted">
                  <th scope="col" class="py-2 pr-3 font-semibold">EPC</th>
                  <th scope="col" class="w-20 py-2 px-3 text-right font-semibold">Pessoas</th>
                  <th scope="col" class="w-20 py-2 px-3 text-right font-semibold">%</th>
                  <th scope="col" class="w-28 py-2 pl-3 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                @for (r of itens(); track r.epcId) {
                  <tr class="border-b border-border/70 last:border-0">
                    <td class="py-2.5 pr-3 font-medium text-fg">{{ r.epcNome }}</td>
                    <td class="tabular py-2.5 px-3 text-right text-muted">{{ r.pessoas }}</td>
                    <td class="tabular py-2.5 px-3 text-right text-muted">{{ r.percentual }}%</td>
                    <td class="tabular py-2.5 pl-3 text-right font-medium text-fg">{{ fmtBRL(r.valor) }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="border-t-2 border-border text-[0.8125rem]">
                  <td class="py-2.5 pr-3 font-semibold text-fg">Total</td>
                  <td class="tabular py-2.5 px-3 text-right font-semibold text-fg">{{ totalPessoas() }}</td>
                  <td class="py-2.5 px-3"></td>
                  <td class="tabular py-2.5 pl-3 text-right font-semibold text-fg">{{ fmtBRL(totalValor()) }}</td>
                </tr>
              </tfoot>
            </table>
            <p class="mt-3 text-[0.75rem] text-faint">
              Divisão proporcional ao número de colaboradores hospedados por EPC no momento do lançamento.
            </p>
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
export class RateioDialog {
  readonly gastoId = input.required<number>();
  readonly titulo = input('');
  readonly fechar = output<void>();

  private readonly service = inject(GastoService);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  protected readonly itens = signal<RateioGasto[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly fmtBRL = formatarBRL;

  protected readonly totalPessoas = computed(() =>
    this.itens().reduce((acc, r) => acc + r.pessoas, 0),
  );
  protected readonly totalValor = computed(() =>
    this.itens().reduce((acc, r) => acc + r.valor, 0),
  );

  constructor() {
    afterNextRender(() => {
      this.panel().nativeElement.focus();
      this.carregar();
    });
  }

  private carregar(): void {
    this.service.rateio(this.gastoId()).subscribe({
      next: (r) => {
        this.itens.set(r);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar o rateio.');
      },
    });
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.fechar.emit();
  }
}
