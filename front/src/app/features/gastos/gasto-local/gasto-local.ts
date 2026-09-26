import {
  Component,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Location, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { LocalService } from '../../../core/services/local.service';
import { GastoService } from '../../../core/services/gasto.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialog } from '../../../core/components/confirm-dialog/confirm-dialog';
import { RateioDialog } from '../rateio-dialog/rateio-dialog';
import { ApiError, PageResponse } from '../../../core/models/colaborador.model';
import { Local } from '../../../core/models/local.model';
import { Gasto, ResumoGasto } from '../../../core/models/gasto.model';
import { formatarBRL, formatarData } from '../../../core/util/format';
import { gerarRelatorioGastosPdf } from '../../../core/util/relatorio-gastos-pdf';

/** Detalhe de um local: gastos (com filtro de período) + total geral e do período. */
@Component({
  selector: 'app-gasto-local',
  imports: [ConfirmDialog, RateioDialog, RouterLink],
  templateUrl: './gasto-local.html',
  styleUrl: './gasto-local.css',
})
export class GastoLocal {
  private readonly localService = inject(LocalService);
  private readonly service = inject(GastoService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly localId = this.lerId();

  protected readonly local = signal<Local | null>(null);
  protected readonly carregandoLocal = signal(false);
  protected readonly erroLocal = signal<string | null>(null);
  protected readonly resumo = signal<ResumoGasto>({ totalGeral: 0, totalPeriodo: 0 });

  protected readonly filtroDe = signal('');
  protected readonly filtroAte = signal('');
  protected readonly page = signal(0);
  protected readonly size = signal(10);
  protected readonly resultado = signal<PageResponse<Gasto> | null>(null);
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly aExcluir = signal<Gasto | null>(null);
  protected readonly excluindo = signal(false);

  /** Gasto com o modal de rateio aberto. */
  protected readonly rateioAlvo = signal<Gasto | null>(null);

  /** Gerando o PDF do relatório. */
  protected readonly gerandoPdf = signal(false);

  protected readonly total = computed(() => this.resultado()?.totalElements ?? 0);
  protected readonly totalPaginas = computed(() => this.resultado()?.totalPages ?? 0);
  protected readonly itens = computed(() => this.resultado()?.content ?? []);
  protected readonly temItens = computed(() => this.itens().length > 0);
  protected readonly paginaAtual = computed(() => this.resultado()?.page ?? 0);
  protected readonly periodoAtivo = computed(() => this.filtroDe() !== '' || this.filtroAte() !== '');

  protected readonly intervalo = computed(() => {
    const r = this.resultado();
    if (!r || r.numberOfElements === 0) return null;
    const ini = r.page * r.size + 1;
    return { ini, fim: ini + r.numberOfElements - 1 };
  });
  protected readonly paginasVisiveis = computed(() =>
    this.calcularPaginas(this.paginaAtual(), this.totalPaginas()),
  );
  protected readonly skeletonRows = computed(() =>
    Array.from({ length: Math.min(this.size(), 8) }, (_, i) => i),
  );

  protected readonly fmtBRL = formatarBRL;
  protected readonly fmtData = formatarData;

  private readonly buscar$ = new Subject<void>();

  constructor() {
    this.buscar$
      .pipe(
        switchMap(() => {
          const id = this.localId;
          if (id == null) return of<PageResponse<Gasto> | null>(null);
          this.loading.set(true);
          this.erro.set(null);
          return this.service
            .listar({
              localId: id,
              dataDe: this.filtroDe() || null,
              dataAte: this.filtroAte() || null,
              page: this.page(),
              size: this.size(),
              sort: 'data,desc',
            })
            .pipe(
              catchError((e: HttpErrorResponse) => {
                const msg = this.mensagemErro(e);
                this.erro.set(msg);
                this.toast.error('Não foi possível carregar', msg);
                return of<PageResponse<Gasto> | null>(null);
              }),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (res) this.resultado.set(res);
      });

    afterNextRender(() => {
      if (this.localId == null) {
        this.erroLocal.set('Local inválido.');
        return;
      }
      this.carregarLocal(this.localId);
      this.carregarResumo();
      this.buscar$.next();
    });
  }

  private lerId(): number | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private carregarLocal(id: number): void {
    this.carregandoLocal.set(true);
    this.erroLocal.set(null);
    this.localService.obter(id).subscribe({
      next: (l) => {
        this.local.set(l);
        this.carregandoLocal.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregandoLocal.set(false);
        this.erroLocal.set(e.status === 404 ? 'Local não encontrado.' : this.mensagemErro(e));
      },
    });
  }

  private carregarResumo(): void {
    if (this.localId == null) return;
    this.service.resumo(this.localId, this.filtroDe() || null, this.filtroAte() || null).subscribe({
      next: (r) => this.resumo.set(r),
      error: () => {},
    });
  }

  private recarregar(): void {
    this.carregarResumo();
    this.buscar$.next();
  }

  // ----- Período -----
  protected onDe(valor: string): void {
    this.filtroDe.set(valor);
    this.page.set(0);
    this.recarregar();
  }
  protected onAte(valor: string): void {
    this.filtroAte.set(valor);
    this.page.set(0);
    this.recarregar();
  }
  protected limparPeriodo(): void {
    this.filtroDe.set('');
    this.filtroAte.set('');
    this.page.set(0);
    this.recarregar();
  }

  // ----- Paginação -----
  protected irPara(p: number): void {
    if (p < 0 || p >= this.totalPaginas() || p === this.paginaAtual()) return;
    this.page.set(p);
    this.buscar$.next();
  }
  protected anterior(): void {
    const r = this.resultado();
    if (r && !r.first) this.irPara(r.page - 1);
  }
  protected proxima(): void {
    const r = this.resultado();
    if (r && !r.last) this.irPara(r.page + 1);
  }

  // ----- Relatório PDF -----
  protected exportarPdf(): void {
    if (this.localId == null || this.gerandoPdf()) return;
    this.gerandoPdf.set(true);
    this.service.relatorio(this.localId, this.filtroDe() || null, this.filtroAte() || null).subscribe({
      next: (rel) => {
        gerarRelatorioGastosPdf(rel)
          .catch(() => this.toast.error('Não foi possível gerar o PDF', 'Tente novamente.'))
          .finally(() => this.gerandoPdf.set(false));
      },
      error: (e: HttpErrorResponse) => {
        this.gerandoPdf.set(false);
        this.toast.error('Não foi possível gerar o relatório', this.mensagemErro(e));
      },
    });
  }

  // ----- Rateio -----
  protected abrirRateio(g: Gasto): void {
    this.rateioAlvo.set(g);
  }
  protected fecharRateio(): void {
    this.rateioAlvo.set(null);
  }

  // ----- Excluir -----
  protected pedirExclusao(g: Gasto): void {
    this.aExcluir.set(g);
  }
  protected cancelarExclusao(): void {
    if (!this.excluindo()) this.aExcluir.set(null);
  }
  protected confirmarExclusao(): void {
    const g = this.aExcluir();
    if (!g || this.excluindo()) return;
    this.excluindo.set(true);
    this.service.excluir(g.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.aExcluir.set(null);
        this.toast.success('Gasto excluído', `${g.nome} foi removido.`);
        const r = this.resultado();
        if (r && r.numberOfElements === 1 && r.page > 0) this.page.set(r.page - 1);
        this.recarregar();
      },
      error: (e: HttpErrorResponse) => {
        this.excluindo.set(false);
        this.aExcluir.set(null);
        this.toast.error('Não foi possível excluir', this.mensagemErro(e));
      },
    });
  }

  protected voltar(): void {
    const navId = this.isBrowser
      ? ((history.state?.navigationId as number | undefined) ?? 1)
      : 1;
    if (navId > 1) this.location.back();
    else this.router.navigateByUrl('/gastos');
  }

  protected mensagemExclusao(g: Gasto): string {
    return `Excluir o gasto "${g.nome}"? Esta ação não pode ser desfeita.`;
  }

  protected pgClasses(active: boolean): string {
    const base =
      'tabular grid h-9 min-w-9 place-items-center rounded-control px-2 text-[0.8125rem] font-medium transition-colors';
    return active ? `${base} bg-accent text-accent-fg` : `${base} text-muted hover:bg-surface-2 hover:text-fg`;
  }

  private mensagemErro(e: HttpErrorResponse): string {
    if (e.status === 0) {
      return 'Sem conexão com o servidor. Verifique se a API está no ar (porta 8080).';
    }
    const body = e.error as ApiError | null;
    return body?.message ?? 'Ocorreu um erro inesperado ao falar com o servidor.';
  }

  private calcularPaginas(atual: number, total: number): number[] {
    if (total <= 0) return [];
    const janela = 5;
    let fim = Math.min(total - 1, atual + 2);
    let ini = Math.max(0, fim - janela + 1);
    fim = Math.min(total - 1, ini + janela - 1);
    ini = Math.max(0, fim - janela + 1);
    const paginas: number[] = [];
    for (let i = ini; i <= fim; i++) paginas.push(i);
    return paginas;
  }
}
