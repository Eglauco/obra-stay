import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ColaboradorService } from '../../core/services/colaborador.service';
import { HospedagemService } from '../../core/services/hospedagem.service';
import { ContratoService } from '../../core/services/contrato.service';
import { GastoService } from '../../core/services/gasto.service';
import { Colaborador } from '../../core/models/colaborador.model';
import { Ocupacao } from '../../core/models/hospedagem.model';
import { Vigencia } from '../../core/models/contrato.model';
import { TotalGastoLocal } from '../../core/models/gasto.model';
import { formatarBRL } from '../../core/util/format';

const ALERTA_DIAS = 30;

interface AlertaContrato {
  localId: number;
  localNome: string;
  tipo: 'sem' | 'vencendo';
  dias: number;
  codigo: string;
  ordem: number;
}

interface GastoLocalItem {
  localId: number;
  nome: string;
  total: number;
  ocupados: number;
  custoPorColab: number | null;
}

/** Painel consolidado: ocupação, contratos, gastos e colaboradores. */
@Component({
  selector: 'app-painel',
  imports: [RouterLink],
  templateUrl: './painel.html',
  styleUrl: './painel.css',
})
export class Painel {
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly hospedagemService = inject(HospedagemService);
  private readonly contratoService = inject(ContratoService);
  private readonly gastoService = inject(GastoService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly fmtBRL = formatarBRL;

  protected readonly colaboradores = signal<Colaborador[]>([]);
  protected readonly ocupacoes = signal<Ocupacao[]>([]);
  protected readonly vigencias = signal<Vigencia[]>([]);
  protected readonly gastos = signal<TotalGastoLocal[]>([]);

  protected readonly erroColab = signal(false);
  protected readonly erroOcup = signal(false);
  protected readonly erroVig = signal(false);
  protected readonly erroGasto = signal(false);
  protected readonly carregando = signal(true);
  private pendentes = 4;

  // ---- KPIs ----
  protected readonly totalColaboradores = computed(() => this.colaboradores().length);
  protected readonly totalLocais = computed(() => this.ocupacoes().length);
  protected readonly totalOcupados = computed(() =>
    this.ocupacoes().reduce((s, o) => s + o.ocupados, 0),
  );
  protected readonly totalVagas = computed(() =>
    this.ocupacoes().reduce((s, o) => s + o.capacidade, 0),
  );
  protected readonly percentOcupacao = computed(() => {
    const v = this.totalVagas();
    return v ? Math.round((this.totalOcupados() / v) * 100) : 0;
  });
  protected readonly contratosVigentes = computed(() => this.vigencias().length);
  protected readonly gastoTotal = computed(() => this.gastos().reduce((s, g) => s + g.total, 0));

  private readonly vigenciaMap = computed(() => {
    const map: Record<number, Vigencia> = {};
    for (const v of this.vigencias()) map[v.localId] = v;
    return map;
  });

  protected readonly alertas = computed<AlertaContrato[]>(() => {
    if (this.erroVig() || this.erroOcup()) return [];
    const map = this.vigenciaMap();
    const out: AlertaContrato[] = [];
    for (const o of this.ocupacoes()) {
      const v = map[o.localId];
      if (!v) {
        out.push({ localId: o.localId, localNome: o.localNome, tipo: 'sem', dias: 0, codigo: '', ordem: -1 });
      } else {
        const dias = this.diasAte(v.dataFim);
        if (dias <= ALERTA_DIAS) {
          out.push({ localId: o.localId, localNome: o.localNome, tipo: 'vencendo', dias, codigo: v.codigo, ordem: dias });
        }
      }
    }
    return out.sort((a, b) => a.ordem - b.ordem);
  });

  protected readonly vencendo30 = computed(
    () => this.alertas().filter((a) => a.tipo === 'vencendo').length,
  );
  protected readonly semContrato = computed(
    () => this.alertas().filter((a) => a.tipo === 'sem').length,
  );

  protected readonly ocupacaoOrdenada = computed(() =>
    [...this.ocupacoes()].sort((a, b) => this.pct(b) - this.pct(a)),
  );

  protected readonly gastosPorLocal = computed<GastoLocalItem[]>(() => {
    const nomes: Record<number, string> = {};
    const ocup: Record<number, number> = {};
    for (const o of this.ocupacoes()) {
      nomes[o.localId] = o.localNome;
      ocup[o.localId] = o.ocupados;
    }
    return this.gastos()
      .map((g) => {
        const ocupados = ocup[g.localId] ?? 0;
        return {
          localId: g.localId,
          nome: nomes[g.localId] ?? `Local #${g.localId}`,
          total: g.total,
          ocupados,
          custoPorColab: ocupados > 0 ? g.total / ocupados : null,
        };
      })
      .sort((a, b) => b.total - a.total);
  });

  protected readonly maiorGasto = computed(() =>
    this.gastosPorLocal().reduce((m, g) => Math.max(m, g.total), 0),
  );

  protected readonly colaboradoresPorFuncao = computed(() => {
    const map = new Map<string, number>();
    for (const c of this.colaboradores()) {
      const nome = c.funcao?.nome ?? 'Sem função';
      map.set(nome, (map.get(nome) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([funcao, qtd]) => ({ funcao, qtd }))
      .sort((a, b) => b.qtd - a.qtd);
  });

  protected readonly maiorFuncao = computed(() =>
    this.colaboradoresPorFuncao().reduce((m, f) => Math.max(m, f.qtd), 0),
  );

  constructor() {
    afterNextRender(() => {
      this.colaboradorService.opcoes().subscribe({
        next: (cs) => { this.colaboradores.set(cs); this.concluir(); },
        error: () => { this.erroColab.set(true); this.concluir(); },
      });
      this.hospedagemService.ocupacao().subscribe({
        next: (os) => { this.ocupacoes.set(os); this.concluir(); },
        error: () => { this.erroOcup.set(true); this.concluir(); },
      });
      this.contratoService.vigencia().subscribe({
        next: (vs) => { this.vigencias.set(vs); this.concluir(); },
        error: () => { this.erroVig.set(true); this.concluir(); },
      });
      this.gastoService.totais().subscribe({
        next: (ts) => { this.gastos.set(ts); this.concluir(); },
        error: () => { this.erroGasto.set(true); this.concluir(); },
      });
    });
  }

  private concluir(): void {
    this.pendentes -= 1;
    if (this.pendentes <= 0) this.carregando.set(false);
  }

  protected pct(o: Ocupacao): number {
    return o.capacidade ? Math.min(100, Math.round((o.ocupados / o.capacidade) * 100)) : 0;
  }

  protected corOcup(o: Ocupacao): string {
    return o.ocupados >= o.capacidade ? 'var(--color-danger)' : 'var(--color-accent)';
  }

  protected larguraGasto(total: number): number {
    const max = this.maiorGasto();
    return max > 0 ? Math.max(4, Math.round((total / max) * 100)) : 0;
  }

  protected larguraFuncao(qtd: number): number {
    const max = this.maiorFuncao();
    return max > 0 ? Math.max(4, Math.round((qtd / max) * 100)) : 0;
  }

  private diasAte(dataFimIso: string): number {
    if (!this.isBrowser) return 0;
    const [y, m, d] = dataFimIso.split('-').map(Number);
    if (!y || !m || !d) return 0;
    const fim = new Date(y, m - 1, d);
    const hoje = new Date();
    const h0 = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    return Math.round((fim.getTime() - h0.getTime()) / 86_400_000);
  }
}
