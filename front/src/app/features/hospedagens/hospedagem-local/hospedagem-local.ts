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
import { HospedagemService } from '../../../core/services/hospedagem.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialog } from '../../../core/components/confirm-dialog/confirm-dialog';
import { QrEntradaDialog } from '../../../core/components/qr-entrada-dialog/qr-entrada-dialog';
import { HospedagemSaidaDialog } from '../hospedagem-saida-dialog/hospedagem-saida-dialog';
import { ApiError, PageResponse } from '../../../core/models/colaborador.model';
import { Local } from '../../../core/models/local.model';
import { Hospedagem, StatusFiltro } from '../../../core/models/hospedagem.model';
import { formatarDataHora } from '../../../core/util/format';
import { gerarRelatorioHospedagensPdf } from '../../../core/util/relatorio-hospedagens-pdf';

/** Detalhe de um local: colaboradores hospedados + dar entrada / dar saída. */
@Component({
  selector: 'app-hospedagem-local',
  imports: [ConfirmDialog, QrEntradaDialog, HospedagemSaidaDialog, RouterLink],
  templateUrl: './hospedagem-local.html',
  styleUrl: './hospedagem-local.css',
})
export class HospedagemLocal {
  private readonly localService = inject(LocalService);
  private readonly service = inject(HospedagemService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly localId = this.lerId();

  protected readonly statusOpcoes: { value: StatusFiltro; label: string }[] = [
    { value: 'ATIVA', label: 'Hospedados' },
    { value: 'ENCERRADA', label: 'Histórico' },
    { value: '', label: 'Todos' },
  ];

  // Local
  protected readonly local = signal<Local | null>(null);
  protected readonly carregandoLocal = signal(false);
  protected readonly erroLocal = signal<string | null>(null);
  protected readonly ocupados = signal(0);

  // Lista de hospedagens do local
  protected readonly filtroStatus = signal<StatusFiltro>('ATIVA');
  protected readonly page = signal(0);
  protected readonly size = signal(10);
  protected readonly resultado = signal<PageResponse<Hospedagem> | null>(null);
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);

  // QR de autoatendimento
  protected readonly qrAberto = signal(false);

  // Relatório PDF
  protected readonly gerandoPdf = signal(false);

  // Ações
  protected readonly aDarSaida = signal<Hospedagem | null>(null);
  protected readonly dandoSaida = signal(false);
  protected readonly saidaErro = signal<string | null>(null);
  protected readonly aExcluir = signal<Hospedagem | null>(null);
  protected readonly excluindo = signal(false);

  protected readonly total = computed(() => this.resultado()?.totalElements ?? 0);
  protected readonly totalPaginas = computed(() => this.resultado()?.totalPages ?? 0);
  protected readonly itens = computed(() => this.resultado()?.content ?? []);
  protected readonly temItens = computed(() => this.itens().length > 0);
  protected readonly paginaAtual = computed(() => this.resultado()?.page ?? 0);
  protected readonly capacidade = computed(() => this.local()?.capacidade ?? 0);
  protected readonly lotado = computed(() => this.ocupados() >= this.capacidade() && this.capacidade() > 0);
  protected readonly percentual = computed(() => {
    const cap = this.capacidade();
    return cap ? Math.min(100, Math.round((this.ocupados() / cap) * 100)) : 0;
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
          if (id == null) return of<PageResponse<Hospedagem> | null>(null);
          this.loading.set(true);
          this.erro.set(null);
          return this.service
            .listar({
              localId: id,
              status: this.filtroStatus() || undefined,
              page: this.page(),
              size: this.size(),
              sort: 'dataEntrada,desc',
            })
            .pipe(
              catchError((e: HttpErrorResponse) => {
                const msg = this.mensagemErro(e);
                this.erro.set(msg);
                this.toast.error('Não foi possível carregar', msg);
                return of<PageResponse<Hospedagem> | null>(null);
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
      this.carregarOcupacao();
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

  private carregarOcupacao(): void {
    this.service.ocupacao().subscribe({
      next: (os) => {
        const o = os.find((x) => x.localId === this.localId);
        this.ocupados.set(o?.ocupados ?? 0);
      },
      error: () => {},
    });
  }

  private recarregar(): void {
    this.carregarOcupacao();
    this.buscar$.next();
  }

  // ----- QR de autoatendimento -----
  protected abrirQr(): void {
    this.qrAberto.set(true);
  }
  protected fecharQr(): void {
    this.qrAberto.set(false);
  }

  // ----- Relatório PDF -----
  protected exportarPdf(): void {
    if (this.localId == null || this.gerandoPdf()) return;
    this.gerandoPdf.set(true);
    // Abre a aba já no gesto do clique para o navegador não bloquear como pop-up.
    const janela = this.isBrowser ? window.open('', '_blank') : null;
    if (janela) {
      janela.document.write(
        '<!doctype html><meta charset="utf-8"><title>Gerando relatório…</title>' +
          '<body style="margin:0;display:grid;place-items:center;height:100vh;font:15px system-ui,sans-serif;color:#64748b">' +
          'Gerando relatório de hospedagens…</body>',
      );
    }
    this.service.relatorio(this.localId, this.filtroStatus() || null).subscribe({
      next: (rel) => {
        gerarRelatorioHospedagensPdf(rel, janela)
          .catch(() => {
            janela?.close();
            this.toast.error('Não foi possível gerar o PDF', 'Tente novamente.');
          })
          .finally(() => this.gerandoPdf.set(false));
      },
      error: (e: HttpErrorResponse) => {
        janela?.close();
        this.gerandoPdf.set(false);
        this.toast.error('Não foi possível gerar o relatório', this.mensagemErro(e));
      },
    });
  }

  // ----- Filtro de status -----
  protected selecionarStatus(valor: StatusFiltro): void {
    if (this.filtroStatus() === valor) return;
    this.filtroStatus.set(valor);
    this.page.set(0);
    this.buscar$.next();
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

  // ----- Dar saída -----
  protected pedirSaida(h: Hospedagem): void {
    this.saidaErro.set(null);
    this.aDarSaida.set(h);
  }

  protected cancelarSaida(): void {
    if (!this.dandoSaida()) this.aDarSaida.set(null);
  }

  protected confirmarSaida(dataSaida: string): void {
    const h = this.aDarSaida();
    if (!h || this.dandoSaida()) return;
    this.dandoSaida.set(true);
    this.saidaErro.set(null);
    this.service.darSaida(h.id, { dataSaida }).subscribe({
      next: () => {
        this.dandoSaida.set(false);
        this.aDarSaida.set(null);
        this.toast.success('Saída registrada', `${h.colaborador.nome} deixou o local.`);
        this.recarregar();
      },
      error: (e: HttpErrorResponse) => {
        this.dandoSaida.set(false);
        const body = e.error as ApiError | null;
        const campo = body?.fieldErrors?.find((fe) => fe.field === 'dataSaida');
        this.saidaErro.set(campo?.message ?? body?.message ?? this.mensagemErro(e));
      },
    });
  }

  // ----- Excluir -----
  protected pedirExclusao(h: Hospedagem): void {
    this.aExcluir.set(h);
  }

  protected cancelarExclusao(): void {
    if (!this.excluindo()) this.aExcluir.set(null);
  }

  protected confirmarExclusao(): void {
    const h = this.aExcluir();
    if (!h || this.excluindo()) return;
    this.excluindo.set(true);
    this.service.excluir(h.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.aExcluir.set(null);
        this.toast.success('Registro excluído', 'A hospedagem foi removida.');
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
    else this.router.navigateByUrl('/hospedagens');
  }

  // ----- Auxiliares -----
  protected fmtData(iso: string | null): string {
    return formatarDataHora(iso);
  }

  protected mensagemExclusao(h: Hospedagem): string {
    return `Excluir o registro de ${h.colaborador.nome}? Esta ação não pode ser desfeita.`;
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
