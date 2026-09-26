import {
  Component,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { ColaboradorService } from '../../../core/services/colaborador.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialog } from '../../../core/components/confirm-dialog/confirm-dialog';
import { BuscaOpcao, BuscaSelect } from '../../../core/components/busca-select/busca-select';
import { ExportarExcel } from '../../../core/components/exportar-excel/exportar-excel';
import { SolicitacaoHistoricoDialog } from '../solicitacao-historico-dialog/solicitacao-historico-dialog';
import { ApiError, PageResponse } from '../../../core/models/colaborador.model';
import {
  SOLICITACAO_STATUS_LABEL,
  Solicitacao,
  SolicitacaoFiltro,
  StatusSolicitacao,
} from '../../../core/models/solicitacao.model';
import { diasDesde, formatarDataHora } from '../../../core/util/format';

@Component({
  selector: 'app-solicitacao-pesquisa',
  imports: [ConfirmDialog, BuscaSelect, RouterLink, SolicitacaoHistoricoDialog, ExportarExcel],
  templateUrl: './solicitacao-pesquisa.html',
  styleUrl: './solicitacao-pesquisa.css',
})
export class SolicitacaoPesquisa {
  private readonly service = inject(SolicitacaoService);
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly toast = inject(ToastService);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly tamanhos = [10, 20, 50];
  protected readonly statusOpcoes: { value: StatusSolicitacao | ''; label: string }[] = [
    { value: '', label: 'Todos os status' },
    { value: 'AGUARDANDO_ANALISE', label: SOLICITACAO_STATUS_LABEL.AGUARDANDO_ANALISE },
    { value: 'EM_PROCESSAMENTO', label: SOLICITACAO_STATUS_LABEL.EM_PROCESSAMENTO },
    { value: 'FINALIZADA', label: SOLICITACAO_STATUS_LABEL.FINALIZADA },
    { value: 'CANCELADA', label: SOLICITACAO_STATUS_LABEL.CANCELADA },
  ];

  // Filtros
  protected readonly filtroStatus = signal<StatusSolicitacao | ''>('');
  protected readonly filtroColaboradorId = signal<number | null>(null);
  protected readonly filtroDe = signal('');
  protected readonly filtroAte = signal('');

  // Paginação
  protected readonly page = signal(0);
  protected readonly size = signal(10);

  // Estado
  protected readonly resultado = signal<PageResponse<Solicitacao> | null>(null);
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);

  // Exclusão
  protected readonly aExcluir = signal<Solicitacao | null>(null);
  protected readonly excluindo = signal(false);

  // Histórico
  protected readonly historicoAlvo = signal<Solicitacao | null>(null);

  // Derivados
  protected readonly total = computed(() => this.resultado()?.totalElements ?? 0);
  protected readonly totalPaginas = computed(() => this.resultado()?.totalPages ?? 0);
  protected readonly itens = computed(() => this.resultado()?.content ?? []);
  protected readonly temItens = computed(() => this.itens().length > 0);
  protected readonly paginaAtual = computed(() => this.resultado()?.page ?? 0);
  protected readonly filtrosAtivos = computed(
    () =>
      this.filtroStatus() !== '' ||
      this.filtroColaboradorId() != null ||
      this.filtroDe() !== '' ||
      this.filtroAte() !== '',
  );
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

  /** Fonte da exportação Excel (respeita os filtros atuais, sem paginação). */
  protected readonly exportarExcel = () => this.service.exportar(this.filtroAtual());

  private readonly buscar$ = new Subject<void>();

  protected readonly buscarColaborador = (t: string): Observable<BuscaOpcao[]> =>
    this.colaboradorService
      .listar({ id: null, nome: t || null, sexo: null, funcaoId: null, page: 0, size: 8, sort: 'nome,asc' })
      .pipe(map((r) => r.content));

  constructor() {
    this.buscar$
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          this.erro.set(null);
          return this.service.listar(this.filtroAtual()).pipe(
            catchError((e: HttpErrorResponse) => {
              const msg = this.mensagemErro(e);
              this.erro.set(msg);
              this.toast.error('Não foi possível carregar', msg);
              return of<PageResponse<Solicitacao> | null>(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (res) this.resultado.set(res);
      });

    afterNextRender(() => this.buscar$.next());
  }

  private filtroAtual(): SolicitacaoFiltro {
    return {
      status: this.filtroStatus() || null,
      colaboradorId: this.filtroColaboradorId(),
      aberturaDe: this.filtroDe() || null,
      aberturaAte: this.filtroAte() || null,
      page: this.page(),
      size: this.size(),
      sort: 'dataHoraAbertura,desc',
    };
  }

  private aplicar(): void {
    this.buscar$.next();
  }

  // ----- Filtros -----
  protected onStatus(valor: string): void {
    this.filtroStatus.set((valor || '') as StatusSolicitacao | '');
    this.page.set(0);
    this.aplicar();
  }

  protected onColaboradorFiltro(op: BuscaOpcao | null): void {
    this.filtroColaboradorId.set(op?.id ?? null);
    this.page.set(0);
    this.aplicar();
  }

  protected onDe(valor: string): void {
    this.filtroDe.set(valor);
    this.page.set(0);
    this.aplicar();
  }

  protected onAte(valor: string): void {
    this.filtroAte.set(valor);
    this.page.set(0);
    this.aplicar();
  }

  protected limpar(): void {
    this.filtroStatus.set('');
    this.filtroColaboradorId.set(null);
    this.filtroDe.set('');
    this.filtroAte.set('');
    this.page.set(0);
    this.aplicar();
  }

  // ----- Paginação -----
  protected irPara(p: number): void {
    if (p < 0 || p >= this.totalPaginas() || p === this.paginaAtual()) return;
    this.page.set(p);
    this.aplicar();
  }

  protected anterior(): void {
    const r = this.resultado();
    if (r && !r.first) this.irPara(r.page - 1);
  }

  protected proxima(): void {
    const r = this.resultado();
    if (r && !r.last) this.irPara(r.page + 1);
  }

  protected mudarTamanho(valor: string): void {
    const s = Number(valor);
    if (!Number.isFinite(s) || s === this.size()) return;
    this.size.set(s);
    this.page.set(0);
    this.aplicar();
  }

  // ----- Situação -----
  /** Em aberto = ainda pode receber ações (usado para o alerta de tempo). */
  protected emAberto(s: Solicitacao): boolean {
    return s.status === 'AGUARDANDO_ANALISE' || s.status === 'EM_PROCESSAMENTO';
  }

  // ----- Histórico -----
  protected abrirHistorico(s: Solicitacao): void {
    this.historicoAlvo.set(s);
  }
  protected fecharHistorico(): void {
    this.historicoAlvo.set(null);
  }

  // ----- Exclusão (com confirmação) -----
  protected pedirExclusao(s: Solicitacao): void {
    this.aExcluir.set(s);
  }
  protected fecharExclusao(): void {
    if (!this.excluindo()) this.aExcluir.set(null);
  }
  protected confirmarExclusao(): void {
    const s = this.aExcluir();
    if (!s || this.excluindo()) return;
    this.excluindo.set(true);
    this.service.excluir(s.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.aExcluir.set(null);
        this.toast.success('Solicitação excluída', 'O registro foi removido.');
        const r = this.resultado();
        if (r && r.numberOfElements === 1 && r.page > 0) this.page.set(r.page - 1);
        this.aplicar();
      },
      error: (e: HttpErrorResponse) => {
        this.excluindo.set(false);
        this.aExcluir.set(null);
        this.toast.error('Não foi possível excluir', this.mensagemErro(e));
      },
    });
  }

  // ----- Apresentação -----
  protected statusLabel(s: StatusSolicitacao): string {
    return SOLICITACAO_STATUS_LABEL[s];
  }
  protected badgeColor(s: StatusSolicitacao): string {
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
  protected badgeBg(s: StatusSolicitacao): string {
    switch (s) {
      case 'AGUARDANDO_ANALISE':
        return 'var(--color-warning-soft)';
      case 'EM_PROCESSAMENTO':
        return 'var(--color-accent-soft)';
      case 'FINALIZADA':
        return 'var(--color-success-soft)';
      default:
        return 'var(--color-surface-2)';
    }
  }
  protected abertura(s: Solicitacao): string {
    return formatarDataHora(s.dataHoraAbertura);
  }
  protected diasAberta(s: Solicitacao): number {
    return diasDesde(s.dataHoraAbertura);
  }
  protected alertaTempo(s: Solicitacao): boolean {
    return this.emAberto(s) && this.diasAberta(s) >= 7;
  }

  protected mensagemExcluir(s: Solicitacao | null): string {
    return s
      ? `Excluir a solicitação de ${s.colaborador.nome}? Esta ação não pode ser desfeita.`
      : '';
  }

  protected pgClasses(active: boolean): string {
    const base =
      'tabular grid h-9 min-w-9 place-items-center rounded-control px-2 text-[0.8125rem] font-medium transition-colors';
    return active
      ? `${base} bg-accent text-accent-fg`
      : `${base} text-muted hover:bg-surface-2 hover:text-fg`;
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
