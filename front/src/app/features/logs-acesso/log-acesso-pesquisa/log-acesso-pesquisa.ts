import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { LogAuditoriaService } from '../../../core/services/log-auditoria.service';
import { ToastService } from '../../../core/services/toast.service';
import { ExportarExcel } from '../../../core/components/exportar-excel/exportar-excel';
import { PodeDirective } from '../../../core/directives/pode.directive';
import { ApiError, PageResponse, SortDir } from '../../../core/models/colaborador.model';
import { LogAuditoria, LogAuditoriaFiltro } from '../../../core/models/log-auditoria.model';
import { formatarDataHora } from '../../../core/util/format';

@Component({
  selector: 'app-log-acesso-pesquisa',
  imports: [ExportarExcel, PodeDirective],
  templateUrl: './log-acesso-pesquisa.html',
  styleUrl: './log-acesso-pesquisa.css',
})
export class LogAcessoPesquisa {
  private readonly service = inject(LogAuditoriaService);
  private readonly toast = inject(ToastService);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly tamanhos = [20, 50, 100];
  protected readonly fmtData = formatarDataHora;

  protected readonly eventos = [
    { v: '', l: 'Todos os eventos' },
    { v: 'LOGIN', l: 'Login' },
    { v: 'LOGOUT', l: 'Logout' },
    { v: 'ACAO', l: 'Ação' },
  ];
  protected readonly resultados = [
    { v: '', l: 'Todos' },
    { v: 'true', l: 'Sucesso' },
    { v: 'false', l: 'Falha' },
  ];

  // Filtros
  protected readonly filtroQ = signal('');
  protected readonly filtroEvento = signal('');
  protected readonly filtroResultado = signal('');
  protected readonly filtroDe = signal('');
  protected readonly filtroAte = signal('');

  // Paginação / ordenação
  protected readonly page = signal(0);
  protected readonly size = signal(20);
  protected readonly sortDir = signal<SortDir>('desc');

  protected readonly resultado = signal<PageResponse<LogAuditoria> | null>(null);
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly total = computed(() => this.resultado()?.totalElements ?? 0);
  protected readonly totalPaginas = computed(() => this.resultado()?.totalPages ?? 0);
  protected readonly itens = computed(() => this.resultado()?.content ?? []);
  protected readonly temItens = computed(() => this.itens().length > 0);
  protected readonly paginaAtual = computed(() => this.resultado()?.page ?? 0);

  protected readonly filtrosAtivos = computed(
    () =>
      this.filtroQ().trim() !== '' ||
      this.filtroEvento() !== '' ||
      this.filtroResultado() !== '' ||
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
    Array.from({ length: Math.min(this.size(), 10) }, (_, i) => i),
  );

  protected readonly exportarExcel = () => this.service.exportar(this.filtroAtual());

  private readonly buscar$ = new Subject<void>();
  private readonly digitar$ = new Subject<void>();

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
              return of<PageResponse<LogAuditoria> | null>(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (res) this.resultado.set(res);
      });

    this.digitar$.pipe(debounceTime(350), takeUntilDestroyed()).subscribe(() => {
      this.page.set(0);
      this.buscar$.next();
    });

    afterNextRender(() => this.buscar$.next());
  }

  private filtroAtual(): LogAuditoriaFiltro {
    const r = this.filtroResultado();
    return {
      q: this.filtroQ().trim() || null,
      evento: this.filtroEvento() || null,
      sucesso: r === '' ? null : r === 'true',
      de: this.filtroDe() || null,
      ate: this.filtroAte() || null,
      page: this.page(),
      size: this.size(),
      sort: `dataHora,${this.sortDir()}`,
    };
  }

  private aplicar(): void {
    this.page.set(0);
    this.buscar$.next();
  }

  protected onQInput(valor: string): void {
    this.filtroQ.set(valor);
    this.digitar$.next();
  }

  protected onEvento(valor: string): void {
    this.filtroEvento.set(valor);
    this.aplicar();
  }

  protected onResultado(valor: string): void {
    this.filtroResultado.set(valor);
    this.aplicar();
  }

  protected onDe(valor: string): void {
    this.filtroDe.set(valor);
    this.aplicar();
  }

  protected onAte(valor: string): void {
    this.filtroAte.set(valor);
    this.aplicar();
  }

  protected buscar(): void {
    this.aplicar();
  }

  protected limpar(): void {
    this.filtroQ.set('');
    this.filtroEvento.set('');
    this.filtroResultado.set('');
    this.filtroDe.set('');
    this.filtroAte.set('');
    this.aplicar();
  }

  protected alternarOrdem(): void {
    this.sortDir.set(this.sortDir() === 'desc' ? 'asc' : 'desc');
    this.aplicar();
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

  protected mudarTamanho(valor: string): void {
    const s = Number(valor);
    if (!Number.isFinite(s) || s === this.size()) return;
    this.size.set(s);
    this.aplicar();
  }

  // ----- exibição -----
  protected eventoLabel(evento: string): string {
    switch (evento) {
      case 'LOGIN':
        return 'Login';
      case 'LOGOUT':
        return 'Logout';
      case 'ACAO':
        return 'Ação';
      default:
        return evento;
    }
  }

  protected acaoTexto(e: LogAuditoria): string {
    if (e.evento !== 'ACAO') return '—';
    return [e.tela, e.acao].filter((x) => !!x).join(' · ') || '—';
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
