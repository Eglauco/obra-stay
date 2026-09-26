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
import { LocalService } from '../../../core/services/local.service';
import { HospedagemService } from '../../../core/services/hospedagem.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError, PageResponse } from '../../../core/models/colaborador.model';
import { Local } from '../../../core/models/local.model';
import { QrEntradaDialog } from '../../../core/components/qr-entrada-dialog/qr-entrada-dialog';
import { ExportarExcel } from '../../../core/components/exportar-excel/exportar-excel';

/** Lista principal da Gestão de Hospedagem: os LOCAIS, com ocupação. Clicar abre o detalhe. */
@Component({
  selector: 'app-hospedagem-locais',
  imports: [RouterLink, QrEntradaDialog, ExportarExcel],
  templateUrl: './hospedagem-locais.html',
  styleUrl: './hospedagem-locais.css',
})
export class HospedagemLocais {
  private readonly localService = inject(LocalService);
  private readonly hospedagemService = inject(HospedagemService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly tamanhos = [12, 24, 48];

  protected readonly filtroNome = signal('');
  protected readonly page = signal(0);
  protected readonly size = signal(12);

  protected readonly resultado = signal<PageResponse<Local> | null>(null);
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);

  /** localId -> ocupados (hospedagens ativas). */
  protected readonly ocupacaoMap = signal<Record<number, number>>({});

  /** Local com o diálogo de QR de autoatendimento aberto (null = fechado). */
  protected readonly qrLocal = signal<Local | null>(null);

  protected readonly total = computed(() => this.resultado()?.totalElements ?? 0);
  protected readonly totalPaginas = computed(() => this.resultado()?.totalPages ?? 0);
  protected readonly itens = computed(() => this.resultado()?.content ?? []);
  protected readonly temItens = computed(() => this.itens().length > 0);
  protected readonly paginaAtual = computed(() => this.resultado()?.page ?? 0);
  protected readonly filtrosAtivos = computed(() => this.filtroNome().trim() !== '');

  protected readonly intervalo = computed(() => {
    const r = this.resultado();
    if (!r || r.numberOfElements === 0) return null;
    const ini = r.page * r.size + 1;
    return { ini, fim: ini + r.numberOfElements - 1 };
  });

  protected readonly paginasVisiveis = computed(() =>
    this.calcularPaginas(this.paginaAtual(), this.totalPaginas()),
  );

  protected readonly skeletonCards = computed(() =>
    Array.from({ length: Math.min(this.size(), 6) }, (_, i) => i),
  );

  /** Exporta a grade de locais (ocupação) respeitando o filtro de nome. */
  protected readonly exportarLocaisExcel = () =>
    this.hospedagemService.exportarLocais(this.filtroNome().trim() || null);

  private readonly buscar$ = new Subject<void>();
  private readonly digitar$ = new Subject<void>();

  constructor() {
    this.hidratarDaUrl();

    this.buscar$
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          this.erro.set(null);
          return this.localService
            .listar({
              nome: this.filtroNome().trim() || null,
              page: this.page(),
              size: this.size(),
              sort: 'nome,asc',
            })
            .pipe(
              catchError((e: HttpErrorResponse) => {
                const msg = this.mensagemErro(e);
                this.erro.set(msg);
                this.toast.error('Não foi possível carregar', msg);
                return of<PageResponse<Local> | null>(null);
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

    afterNextRender(() => {
      this.carregarOcupacao();
      this.buscar$.next();
    });
  }

  private carregarOcupacao(): void {
    this.hospedagemService.ocupacao().subscribe({
      next: (os) => {
        const map: Record<number, number> = {};
        for (const o of os) map[o.localId] = o.ocupados;
        this.ocupacaoMap.set(map);
      },
      error: () => {
        /* ocupação indisponível: cards mostram 0 até a API subir */
      },
    });
  }

  private hidratarDaUrl(): void {
    const q = this.route.snapshot.queryParamMap;
    const nome = q.get('nome');
    if (nome) this.filtroNome.set(nome);
    const page = Number(q.get('page'));
    if (Number.isFinite(page) && page > 0) this.page.set(Math.trunc(page));
    const size = Number(q.get('size'));
    if (this.tamanhos.includes(size)) this.size.set(size);
  }

  private sincronizarUrl(): void {
    if (!this.isBrowser) return;
    const queryParams: Record<string, string | null> = {
      nome: this.filtroNome().trim() || null,
      page: this.page() > 0 ? String(this.page()) : null,
      size: this.size() !== 12 ? String(this.size()) : null,
    };
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }

  private aplicar(): void {
    this.sincronizarUrl();
    this.buscar$.next();
  }

  protected onNomeInput(valor: string): void {
    this.filtroNome.set(valor);
    this.digitar$.next();
  }

  protected limpar(): void {
    this.filtroNome.set('');
    this.page.set(0);
    this.aplicar();
  }

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

  // ----- QR de autoatendimento -----
  protected abrirQr(local: Local): void {
    this.qrLocal.set(local);
  }
  protected fecharQr(): void {
    this.qrLocal.set(null);
  }

  // ----- Auxiliares de ocupação -----
  protected ocupadosDe(local: Local): number {
    return this.ocupacaoMap()[local.id] ?? 0;
  }

  protected percentual(local: Local): number {
    if (!local.capacidade) return 0;
    return Math.min(100, Math.round((this.ocupadosDe(local) / local.capacidade) * 100));
  }

  protected lotado(local: Local): boolean {
    return this.ocupadosDe(local) >= local.capacidade;
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
