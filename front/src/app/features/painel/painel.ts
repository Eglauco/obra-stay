import { Component, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PainelService } from '../../core/services/painel.service';
import {
  AlertaContrato,
  GastoLocalPainel,
  OcupacaoPainel,
  ResumoPainel,
} from '../../core/models/painel.model';
import { formatarBRL } from '../../core/util/format';
import { PainelLista } from './painel-lista/painel-lista';

/** Painel consolidado: KPIs + 4 blocos paginados (ocupação, contratos, gastos, funções). */
@Component({
  selector: 'app-painel',
  imports: [RouterLink, PainelLista],
  templateUrl: './painel.html',
  styleUrl: './painel.css',
})
export class Painel {
  private readonly painel = inject(PainelService);

  protected readonly fmtBRL = formatarBRL;

  // ---- KPIs (cabeçalho) ----
  protected readonly resumo = signal<ResumoPainel | null>(null);
  protected readonly carregandoResumo = signal(true);
  protected readonly erroResumo = signal(false);

  // ---- Carregadores dos blocos (scroll infinito) ----
  protected readonly carregarOcupacao = (page: number, size: number) =>
    this.painel.ocupacao(page, size);
  protected readonly carregarAlertas = (page: number, size: number) =>
    this.painel.contratosAlertas(page, size);
  protected readonly carregarGastos = (page: number, size: number) =>
    this.painel.gastos(page, size);
  protected readonly carregarFuncoes = (page: number, size: number) =>
    this.painel.colaboradoresPorFuncao(page, size);

  constructor() {
    afterNextRender(() => this.carregarResumo());
  }

  protected carregarResumo(): void {
    this.carregandoResumo.set(true);
    this.erroResumo.set(false);
    this.painel.resumo().subscribe({
      next: (r) => {
        this.resumo.set(r);
        this.carregandoResumo.set(false);
      },
      error: () => {
        this.erroResumo.set(true);
        this.carregandoResumo.set(false);
      },
    });
  }

  // ---- Helpers de apresentação ----
  protected pct(o: OcupacaoPainel): number {
    return o.capacidade ? Math.min(100, Math.round((o.ocupados / o.capacidade) * 100)) : 0;
  }

  protected corOcup(o: OcupacaoPainel): string {
    return o.ocupados >= o.capacidade ? 'var(--color-danger)' : 'var(--color-accent)';
  }

  /** Largura da barra relativa ao primeiro item carregado (que é o maior, pois a lista vem ordenada). */
  protected larguraRel(valor: number, max: number): number {
    return max > 0 ? Math.max(4, Math.round((valor / max) * 100)) : 0;
  }

  protected custoPorColab(g: GastoLocalPainel): number | null {
    return g.ocupados > 0 ? g.total / g.ocupados : null;
  }

  protected rotuloVence(a: AlertaContrato): string {
    if (a.dias <= 0) return 'Vence hoje';
    if (a.dias === 1) return 'Vence amanhã';
    return 'Vence em ' + a.dias + ' dias';
  }
}
