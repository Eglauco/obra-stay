import { Component, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { baixarBlob } from '../../util/baixar-arquivo';

/**
 * Botão reutilizável de "Exportar Excel". Recebe uma `acao` que retorna o Blob do .xlsx
 * (o backend gera respeitando os filtros) e um `nome` base para o arquivo.
 */
@Component({
  selector: 'app-exportar-excel',
  template: `
    <button
      type="button"
      (click)="disparar()"
      [disabled]="desabilitado() || exportando()"
      title="Exportar para Excel (respeita os filtros aplicados)"
      class="inline-flex h-11 items-center gap-2 rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      @if (exportando()) {
        <svg viewBox="0 0 24 24" fill="none" class="size-4.5 animate-spin text-accent" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
      } @else {
        <svg viewBox="0 0 20 20" fill="none" class="size-4.5" aria-hidden="true"><path d="M6 2.5h5l3.5 3.5V16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" /><path d="M11 2.5V6h3.5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" /><path d="m7.5 11 1.5 2.2L10.5 11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" /></svg>
      }
      {{ rotulo() }}
    </button>
  `,
})
export class ExportarExcel {
  private readonly toast = inject(ToastService);

  /** Nome base do arquivo (ex.: "colaboradores" → colaboradores-2026-09-26.xlsx). */
  readonly nome = input.required<string>();
  /** Função que dispara a requisição e retorna o Blob do .xlsx. */
  readonly acao = input.required<() => Observable<Blob>>();
  readonly desabilitado = input(false);
  readonly rotulo = input('Exportar Excel');

  protected readonly exportando = signal(false);

  protected disparar(): void {
    if (this.exportando() || this.desabilitado()) return;
    this.exportando.set(true);
    this.acao()().subscribe({
      next: (blob) => {
        this.exportando.set(false);
        const data = new Date().toISOString().slice(0, 10);
        baixarBlob(blob, `${this.nome()}-${data}.xlsx`);
      },
      error: (_e: HttpErrorResponse) => {
        this.exportando.set(false);
        this.toast.error('Não foi possível exportar', 'Tente novamente em instantes.');
      },
    });
  }
}
