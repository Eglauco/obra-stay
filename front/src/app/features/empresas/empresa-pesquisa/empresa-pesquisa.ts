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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { EmpresaService } from '../../../core/services/empresa.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialog } from '../../../core/components/confirm-dialog/confirm-dialog';
import { ExportarExcel } from '../../../core/components/exportar-excel/exportar-excel';
import { ApiError, PageResponse, SortDir } from '../../../core/models/colaborador.model';
import { Empresa, EmpresaFiltro, EmpresaSortField } from '../../../core/models/empresa.model';

@Component({
  selector: 'app-empresa-pesquisa',
  imports: [ConfirmDialog, RouterLink, ExportarExcel],
  templateUrl: './empresa-pesquisa.html',
  styleUrl: './empresa-pesquisa.css',
})
export class EmpresaPesquisa {
  private readonly service = inject(EmpresaService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly tamanhos = [10, 20, 50];

  // Filtros (batem no backend)
  protected readonly filtroId = signal<number | null>(null);
  protected readonly filtroNome = signal('');

  // Paginação / ordenação
  protected readonly page = signal(0);
  protected readonly size = signal(10);
  protected readonly sortField = signal<EmpresaSortField>('nome');
  protected readonly sortDir = signal<SortDir>('asc');

  // Resultado / estado
  protected readonly resultado = signal<PageResponse<Empresa> | null>(null);
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);

  // Exclusão
  protected readonly aExcluir = signal<Empresa | null>(null);
  protected readonly excluindo = signal(false);

  // Derivados
  protected readonly total = computed(() => this.resultado()?.totalElements ?? 0);
  protected readonly totalPaginas = computed(() => this.resultado()?.totalPages ?? 0);
  protected readonly itens = computed(() => this.resultado()?.content ?? []);
  protected readonly temItens = computed(() => this.itens().length > 0);
  protected readonly paginaAtual = computed(() => this.resultado()?.page ?? 0);

  protected readonly filtrosAtivos = computed(
    () => this.filtroId() != null || this.filtroNome().trim() !== '',
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

  /** Fonte da exportação Excel (respeita os filtros atuais, sem paginação). */
  protected readonly exportarExcel = () => this.service.exportar(this.filtroAtual());

  private readonly buscar$ = new Subject<void>();
  private readonly digitar$ = new Subject<void>();

  constructor() {
    this.hidratarDaUrl();

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
              return of<PageResponse<Empresa> | null>(null);
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
      this.aplicar();
    });

    afterNextRender(() => this.buscar$.next());
  }

  private filtroAtual(): EmpresaFiltro {
    return {
      id: this.filtroId(),
      nome: this.filtroNome().trim() || null,
      page: this.page(),
      size: this.size(),
      sort: `${this.sortField()},${this.sortDir()}`,
    };
  }

  private hidratarDaUrl(): void {
    const q = this.route.snapshot.queryParamMap;
    const id = q.get('id');
    if (id) {
      const n = Number(id);
      if (Number.isFinite(n) && n > 0) this.filtroId.set(Math.trunc(n));
    }
    const nome = q.get('nome');
    if (nome) this.filtroNome.set(nome);
    const page = Number(q.get('page'));
    if (Number.isFinite(page) && page > 0) this.page.set(Math.trunc(page));
    const size = Number(q.get('size'));
    if (this.tamanhos.includes(size)) this.size.set(size);
    const sort = q.get('sort');
    if (sort) {
      const [campo, dir] = sort.split(',');
      if (campo === 'id' || campo === 'nome') this.sortField.set(campo);
      if (dir === 'asc' || dir === 'desc') this.sortDir.set(dir);
    }
  }

  private sincronizarUrl(): void {
    if (!this.isBrowser) return;
    const sort = `${this.sortField()},${this.sortDir()}`;
    const queryParams: Record<string, string | null> = {
      id: this.filtroId() != null ? String(this.filtroId()) : null,
      nome: this.filtroNome().trim() || null,
      page: this.page() > 0 ? String(this.page()) : null,
      size: this.size() !== 10 ? String(this.size()) : null,
      sort: sort !== 'nome,asc' ? sort : null,
    };
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }

  private aplicar(): void {
    this.sincronizarUrl();
    this.buscar$.next();
  }

  // ----- Filtros -----
  protected onNomeInput(valor: string): void {
    this.filtroNome.set(valor);
    this.digitar$.next();
  }

  protected onIdInput(valor: string): void {
    const limpo = valor.trim();
    const n = limpo === '' ? null : Number(limpo);
    this.filtroId.set(n != null && Number.isFinite(n) && n > 0 ? Math.trunc(n) : null);
    this.digitar$.next();
  }

  protected buscar(): void {
    this.page.set(0);
    this.aplicar();
  }

  protected limpar(): void {
    this.filtroId.set(null);
    this.filtroNome.set('');
    this.page.set(0);
    this.aplicar();
  }

  // ----- Ordenação -----
  protected ordenarPor(campo: EmpresaSortField): void {
    if (this.sortField() === campo) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(campo);
      this.sortDir.set('asc');
    }
    this.aplicar();
  }

  protected ariaSort(campo: EmpresaSortField): 'ascending' | 'descending' | 'none' {
    if (this.sortField() !== campo) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
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

  // ----- Exclusão -----
  protected pedirExclusao(e: Empresa): void {
    this.aExcluir.set(e);
  }

  protected cancelarExclusao(): void {
    if (!this.excluindo()) this.aExcluir.set(null);
  }

  protected confirmarExclusao(): void {
    const e = this.aExcluir();
    if (!e || this.excluindo()) return;
    this.excluindo.set(true);
    this.service.excluir(e.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.aExcluir.set(null);
        this.toast.success('Empresa excluída', `${e.nome} foi removida.`);
        const r = this.resultado();
        if (r && r.numberOfElements === 1 && r.page > 0) this.page.set(r.page - 1);
        this.aplicar();
      },
      error: (err: HttpErrorResponse) => {
        this.excluindo.set(false);
        this.aExcluir.set(null);
        this.toast.error('Não foi possível excluir', this.mensagemErro(err));
      },
    });
  }

  // ----- Auxiliares -----
  protected mensagemExclusao(nome: string): string {
    return `Tem certeza que deseja excluir a empresa ${nome}? Esta ação não pode ser desfeita.`;
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
