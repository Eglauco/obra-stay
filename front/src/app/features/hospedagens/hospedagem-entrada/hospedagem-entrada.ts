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
import { ActivatedRoute, Router } from '@angular/router';
import { ColaboradorService } from '../../../core/services/colaborador.service';
import { LocalService } from '../../../core/services/local.service';
import { HospedagemService } from '../../../core/services/hospedagem.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError, Colaborador } from '../../../core/models/colaborador.model';
import { Local } from '../../../core/models/local.model';
import { HospedagemEntradaRequest } from '../../../core/models/hospedagem.model';

const OBS_MAX = 255;

/** Tela de "dar entrada" (check-in) de um colaborador, com o LOCAL fixo (vindo do detalhe). */
@Component({
  selector: 'app-hospedagem-entrada',
  templateUrl: './hospedagem-entrada.html',
  styleUrl: './hospedagem-entrada.css',
})
export class HospedagemEntrada {
  private readonly service = inject(HospedagemService);
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly localService = inject(LocalService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly obsMax = OBS_MAX;
  protected readonly localId = this.lerId();

  protected readonly local = signal<Local | null>(null);
  protected readonly erroLocal = signal<string | null>(null);
  protected readonly colaboradores = signal<Colaborador[]>([]);

  protected readonly colaboradorId = signal<number | null>(null);
  protected readonly dataEntrada = signal('');
  protected readonly observacao = signal('');

  protected readonly submetido = signal(false);
  protected readonly saving = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly obsCount = computed(() => this.observacao().length);

  protected readonly colaboradorError = computed(() => {
    const s = this.serverErrors()['colaboradorId'];
    if (s) return s;
    return this.submetido() && this.colaboradorId() == null ? 'Selecione o colaborador.' : null;
  });
  protected readonly dataError = computed(() => {
    const s = this.serverErrors()['dataEntrada'];
    if (s) return s;
    return this.submetido() && !this.dataEntrada() ? 'Informe a data e hora de entrada.' : null;
  });
  /** Erro de local (ex.: lotado) vem do backend no campo localId. */
  protected readonly localError = computed(() => this.serverErrors()['localId'] ?? null);

  constructor() {
    afterNextRender(() => {
      if (this.localId == null) {
        this.erroLocal.set('Local inválido.');
        return;
      }
      this.dataEntrada.set(this.agora());
      this.carregarLocal(this.localId);
      this.carregarColaboradores();
    });
  }

  private lerId(): number | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private carregarLocal(id: number): void {
    this.localService.obter(id).subscribe({
      next: (l) => this.local.set(l),
      error: (e: HttpErrorResponse) =>
        this.erroLocal.set(e.status === 404 ? 'Local não encontrado.' : this.mensagemErro(e)),
    });
  }

  private carregarColaboradores(): void {
    this.colaboradorService.opcoes().subscribe({
      next: (cs) => this.colaboradores.set(cs),
      error: () => this.toast.error('Colaboradores indisponíveis', 'Não foi possível carregar a lista.'),
    });
  }

  protected selecionarColaborador(valor: string): void {
    this.colaboradorId.set(valor ? Number(valor) : null);
    this.limparServer('colaboradorId');
  }

  protected onData(valor: string): void {
    this.dataEntrada.set(valor);
    this.limparServer('dataEntrada');
  }

  protected onObservacao(valor: string): void {
    this.observacao.set(valor.slice(0, OBS_MAX));
  }

  private limparServer(field: string): void {
    if (this.serverErrors()[field]) {
      this.serverErrors.update((e) => {
        const next = { ...e };
        delete next[field];
        return next;
      });
    }
  }

  protected submit(): void {
    this.submetido.set(true);
    this.serverErrors.set({});

    if (this.localId == null || this.colaboradorId() == null || !this.dataEntrada() || this.saving()) {
      return;
    }

    const req: HospedagemEntradaRequest = {
      colaboradorId: this.colaboradorId(),
      localId: this.localId,
      dataEntrada: this.dataEntrada(),
      observacao: this.observacao().trim() || null,
    };
    this.saving.set(true);

    this.service.darEntrada(req).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Entrada registrada', 'Colaborador hospedado com sucesso.');
        this.voltar();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.handleError(e);
      },
    });
  }

  protected voltar(): void {
    const navId = this.isBrowser
      ? ((history.state?.navigationId as number | undefined) ?? 1)
      : 1;
    if (navId > 1) this.location.back();
    else if (this.localId != null) this.router.navigate(['/hospedagens/local', this.localId]);
    else this.router.navigateByUrl('/hospedagens');
  }

  private handleError(err: HttpErrorResponse): void {
    const body = err.error as ApiError | null;
    if (body?.fieldErrors?.length) {
      const map: Record<string, string> = {};
      for (const fe of body.fieldErrors) map[fe.field] = fe.message;
      this.serverErrors.set(map);
      this.toast.error('Não foi possível dar entrada', body.message ?? 'Verifique os campos destacados.');
      return;
    }
    const msg =
      err.status === 0
        ? 'Sem conexão com o servidor. Verifique se a API está no ar (porta 8080).'
        : (body?.message ?? 'Ocorreu um erro inesperado.');
    this.toast.error('Não foi possível dar entrada', msg);
  }

  private mensagemErro(e: HttpErrorResponse): string {
    if (e.status === 0) return 'Sem conexão com o servidor. Verifique se a API está no ar (porta 8080).';
    const body = e.error as ApiError | null;
    return body?.message ?? 'Ocorreu um erro inesperado ao falar com o servidor.';
  }

  private agora(): string {
    if (!this.isBrowser) return '';
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }
}
