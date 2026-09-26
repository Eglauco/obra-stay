import { Component, input } from '@angular/core';
import {
  HistoricoStatus,
  SOLICITACAO_STATUS_LABEL,
  StatusSolicitacao,
} from '../../models/solicitacao.model';
import { formatarDataHora } from '../../util/format';

/** Linha do tempo (reutilizável) do histórico de status de uma solicitação. */
@Component({
  selector: 'app-historico-timeline',
  template: `
    <ol class="flex flex-col">
      @for (h of itens(); track $index; let last = $last) {
        <li class="flex gap-3">
          <div class="flex flex-col items-center">
            <span class="mt-1 size-3 shrink-0 rounded-full" [style.background-color]="cor(h.status)"></span>
            @if (!last) {
              <span class="w-px flex-1 bg-border"></span>
            }
          </div>
          <div [class]="last ? 'pb-0' : 'pb-5'">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span class="text-sm font-semibold" [style.color]="cor(h.status)">{{ rotulo(h.status) }}</span>
              <span class="tabular text-[0.75rem] text-faint">{{ dataHora(h.dataHora) }}</span>
            </div>
            @if (h.observacao) {
              <p class="mt-1 whitespace-pre-line text-[0.8125rem] text-muted">{{ h.observacao }}</p>
            }
          </div>
        </li>
      }
    </ol>
  `,
})
export class HistoricoTimeline {
  readonly itens = input.required<HistoricoStatus[]>();

  protected rotulo(s: StatusSolicitacao): string {
    return SOLICITACAO_STATUS_LABEL[s];
  }
  protected dataHora(iso: string): string {
    return formatarDataHora(iso);
  }
  protected cor(s: StatusSolicitacao): string {
    switch (s) {
      case 'AGUARDANDO_ANALISE':
        return 'var(--color-warning)';
      case 'EM_PROCESSAMENTO':
        return 'var(--color-accent)';
      case 'FINALIZADA':
        return 'var(--color-success)';
      default:
        return 'var(--color-muted)';
    }
  }
}
