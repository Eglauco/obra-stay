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
import { ContratoService } from '../../../core/services/contrato.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialog } from '../../../core/components/confirm-dialog/confirm-dialog';
import { ExportarExcel } from '../../../core/components/exportar-excel/exportar-excel';
import { ApiError, PageResponse } from '../../../core/models/colaborador.model';
import { Local } from '../../../core/models/local.model';
import { Contrato, StatusFiltroContrato, Vigencia } from '../../../core/models/contrato.model';

const ALERTA_DIAS = 30;

/** Detalhe de um local: contratos (vigente + histórico) + novo/editar/renovar/excluir. */
@Component({
  selector: 'app-contrato-local',
  imports: [ConfirmDialog, RouterLink, ExportarExcel],
  templateUrl: './contrato-local.html',
  styleUrl: './contrato-local.css',
})
export class ContratoLocal {
  private readonly localService = inject(LocalService);
  private readonly service = inject(ContratoService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly localId = this.lerId();

  protected readonly statusOpcoes: { value: StatusFiltroContrato; label: string }[] = [
    { value: 'VIGENTE', label: 'Vigente' },
    { value: 'ENCERRADO', label: 'Histórico' },
    { value: '', label: 'Todos' },
  ];

  protected readonly local = signal<Local | null>(null);
  protected readonly carregandoLocal = signal(false);
  protected readonly erroLocal = signal<string | null>(null);
  protected readonly vigente = signal<Vigencia | null>(null);

  protected readonly filtroStatus = signal<StatusFiltroContrato>('');
  protected readonly page = signal(0);
  protected readonly size = signal(10);
  protected readonly resultado = signal<PageResponse<Contrato> | null>(null);
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly aExcluir = signal<Contrato | null>(null);
  protected readonly excluindo = signal(false);

  protected readonly total = computed(() => this.resultado()?.totalElements ?? 0);
  protected readonly totalPaginas = computed(() => this.resultado()?.totalPages ?? 0);
  protected readonly itens = computed(() => this.resultado()?.content ?? []);
  protected readonly temItens = computed(() => this.itens().length > 0);
  protected readonly paginaAtual = computed(() => this.resultado()?.page ?? 0);

  /** Exporta os contratos deste local (Excel), respeitando o filtro de status. */
  protected readonly exportarExcel = () =>
    this.service.exportar({ localId: this.localId, status: this.filtroStatus() || undefined, page: 0, size: 0, sort: '' });

  protected readonly diasVigente = computed(() => {
    const v = this.vigente();
    return v ? this.diasAte(v.dataFim) : null;
  });

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

  private readonly buscar$ = new Subject<void>();

  constructor() {
    this.buscar$
      .pipe(
        switchMap(() => {
          const id = this.localId;
          if (id == null) return of<PageResponse<Contrato> | null>(null);
          this.loading.set(true);
          this.erro.set(null);
          return this.service
            .listar({
              localId: id,
              status: this.filtroStatus() || undefined,
              page: this.page(),
              size: this.size(),
              sort: 'dataInicio,desc',
            })
            .pipe(
              catchError((e: HttpErrorResponse) => {
                const msg = this.mensagemErro(e);
                this.erro.set(msg);
                this.toast.error('Não foi possível carregar', msg);
                return of<PageResponse<Contrato> | null>(null);
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
      this.carregarVigencia();
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

  private carregarVigencia(): void {
    this.service.vigencia().subscribe({
      next: (vs) => this.vigente.set(vs.find((v) => v.localId === this.localId) ?? null),
      error: () => {},
    });
  }

  private recarregar(): void {
    this.carregarVigencia();
    this.buscar$.next();
  }

  protected selecionarStatus(valor: StatusFiltroContrato): void {
    if (this.filtroStatus() === valor) return;
    this.filtroStatus.set(valor);
    this.page.set(0);
    this.buscar$.next();
  }

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

  // ----- Excluir -----
  protected pedirExclusao(c: Contrato): void {
    this.aExcluir.set(c);
  }

  protected cancelarExclusao(): void {
    if (!this.excluindo()) this.aExcluir.set(null);
  }

  protected confirmarExclusao(): void {
    const c = this.aExcluir();
    if (!c || this.excluindo()) return;
    this.excluindo.set(true);
    this.service.excluir(c.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.aExcluir.set(null);
        this.toast.success('Contrato excluído', `${c.codigo} foi removido.`);
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
    else this.router.navigateByUrl('/contratos');
  }

  // ----- Auxiliares -----
  protected fmtData(iso: string | null): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return y && m && d ? `${d}/${m}/${y}` : iso;
  }

  protected statusLabel(s: Contrato['status']): string {
    return s === 'VIGENTE' ? 'Vigente' : s === 'AGENDADO' ? 'Agendado' : 'Encerrado';
  }

  protected rotuloVigente(): string {
    const d = this.diasVigente();
    if (d == null) return 'Sem contrato vigente';
    if (d <= 0) return 'Vence hoje';
    if (d === 1) return 'Vence amanhã';
    return `Vence em ${d} dias`;
  }

  protected corVigente(): string {
    const d = this.diasVigente();
    if (d == null) return 'var(--color-danger)';
    if (d <= ALERTA_DIAS) return '#f59e0b';
    return 'var(--color-success)';
  }

  protected corVigenteBg(): string {
    const d = this.diasVigente();
    if (d == null) return 'var(--color-danger-soft)';
    if (d <= ALERTA_DIAS) return 'rgba(245, 158, 11, 0.16)';
    return 'var(--color-success-soft)';
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

  protected segClasses(active: boolean): string {
    const base = 'rounded-[0.5rem] px-3 py-1.5 text-[0.8125rem] font-medium transition-colors';
    return active ? `${base} bg-accent text-accent-fg shadow-sm` : `${base} text-muted hover:text-fg`;
  }

  protected pgClasses(active: boolean): string {
    const base =
      'tabular grid h-9 min-w-9 place-items-center rounded-control px-2 text-[0.8125rem] font-medium transition-colors';
    return active ? `${base} bg-accent text-accent-fg` : `${base} text-muted hover:bg-surface-2 hover:text-fg`;
  }

  protected mensagemExclusao(c: Contrato): string {
    return `Excluir o contrato ${c.codigo}? Esta ação não pode ser desfeita.`;
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
