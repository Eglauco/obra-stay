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
import { ContratoService } from '../../../core/services/contrato.service';
import { LocalService } from '../../../core/services/local.service';
import { LocadoraService } from '../../../core/services/locadora.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/colaborador.model';
import { Local } from '../../../core/models/local.model';
import { Locadora } from '../../../core/models/locadora.model';
import { ContratoRequest } from '../../../core/models/contrato.model';

/** Tela de criar / editar / renovar contrato, com o local travado. */
@Component({
  selector: 'app-contrato-cadastro',
  templateUrl: './contrato-cadastro.html',
  styleUrl: './contrato-cadastro.css',
})
export class ContratoCadastro {
  private readonly service = inject(ContratoService);
  private readonly localService = inject(LocalService);
  private readonly locadoraService = inject(LocadoraService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly modo = this.route.snapshot.data['modo'] as 'novo' | 'editar';
  private readonly paramId = this.lerId();

  protected readonly editMode = this.modo === 'editar';
  protected readonly contratoId = signal<number | null>(this.editMode ? this.paramId : null);
  protected readonly localId = signal<number | null>(this.editMode ? null : this.paramId);
  protected readonly localNome = signal('');
  protected readonly localInfo = signal('');
  protected readonly renovando = signal(false);

  protected readonly locadoras = signal<Locadora[]>([]);
  protected readonly carregando = signal(false);
  protected readonly erroCarregar = signal<string | null>(null);

  protected readonly codigo = signal('');
  protected readonly locadoraId = signal<number | null>(null);
  protected readonly dataInicio = signal('');
  protected readonly dataFim = signal('');

  protected readonly submetido = signal(false);
  protected readonly saving = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly codigoError = computed(() => {
    const s = this.serverErrors()['codigo'];
    if (s) return s;
    return this.submetido() && !this.codigo().trim() ? 'Informe o código.' : null;
  });
  protected readonly locadoraError = computed(() => {
    const s = this.serverErrors()['locadoraId'];
    if (s) return s;
    return this.submetido() && this.locadoraId() == null ? 'Selecione a locadora.' : null;
  });
  protected readonly inicioError = computed(() => {
    const s = this.serverErrors()['dataInicio'];
    if (s) return s;
    return this.submetido() && !this.dataInicio() ? 'Informe a data de início.' : null;
  });
  protected readonly fimError = computed(() => {
    const s = this.serverErrors()['dataFim'];
    if (s) return s;
    if (this.submetido() && !this.dataFim()) return 'Informe a data de fim.';
    if (this.dataInicio() && this.dataFim() && this.dataFim() < this.dataInicio()) {
      return 'A data de fim não pode ser anterior ao início.';
    }
    return null;
  });

  constructor() {
    afterNextRender(() => {
      this.carregarLocadoras();
      if (this.editMode) {
        if (this.paramId == null) {
          this.erroCarregar.set('Contrato inválido.');
          return;
        }
        this.carregarContrato(this.paramId);
      } else {
        if (this.paramId == null) {
          this.erroCarregar.set('Local inválido.');
          return;
        }
        this.carregarLocal(this.paramId);
        this.dataInicio.set(this.hoje());
        this.dataFim.set(this.addAnos(this.hoje(), 1));
        const renovarDe = Number(this.route.snapshot.queryParamMap.get('renovarDe'));
        if (Number.isFinite(renovarDe) && renovarDe > 0) this.prefillRenovacao(renovarDe);
      }
    });
  }

  private lerId(): number | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private carregarLocadoras(): void {
    this.locadoraService.opcoes().subscribe({
      next: (ls) => this.locadoras.set(ls),
      error: () => this.toast.error('Locadoras indisponíveis', 'Não foi possível carregar a lista.'),
    });
  }

  private carregarLocal(id: number): void {
    this.localService.obter(id).subscribe({
      next: (l) => this.setLocal(l),
      error: (e: HttpErrorResponse) =>
        this.erroCarregar.set(e.status === 404 ? 'Local não encontrado.' : this.mensagemErro(e)),
    });
  }

  private setLocal(l: Local): void {
    this.localId.set(l.id);
    this.localNome.set(l.nome);
    this.localInfo.set(`${l.codigo} · ${l.cidade}/${l.uf}`);
  }

  private carregarContrato(id: number): void {
    this.carregando.set(true);
    this.service.obter(id).subscribe({
      next: (c) => {
        this.carregando.set(false);
        this.codigo.set(c.codigo);
        this.locadoraId.set(c.locadora.id);
        this.dataInicio.set(c.dataInicio);
        this.dataFim.set(c.dataFim);
        this.localId.set(c.local.id);
        this.localNome.set(c.local.nome);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroCarregar.set(e.status === 404 ? 'Contrato não encontrado.' : this.mensagemErro(e));
      },
    });
  }

  private prefillRenovacao(contratoId: number): void {
    this.service.obter(contratoId).subscribe({
      next: (c) => {
        this.renovando.set(true);
        this.locadoraId.set(c.locadora.id);
        const inicio = this.addDias(c.dataFim, 1);
        this.dataInicio.set(inicio);
        this.dataFim.set(this.addAnos(inicio, 1));
        this.toast.info('Renovação', `Preenchido a partir do contrato ${c.codigo}. Informe o novo código.`);
      },
      error: () => {},
    });
  }

  protected onCodigo(v: string): void {
    this.codigo.set(v);
    this.limparServer('codigo');
  }
  protected selecionarLocadora(v: string): void {
    this.locadoraId.set(v ? Number(v) : null);
    this.limparServer('locadoraId');
  }
  protected onInicio(v: string): void {
    this.dataInicio.set(v);
    this.limparServer('dataInicio');
  }
  protected onFim(v: string): void {
    this.dataFim.set(v);
    this.limparServer('dataFim');
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

    const invalidoData = this.dataInicio() && this.dataFim() && this.dataFim() < this.dataInicio();
    if (
      !this.codigo().trim() ||
      this.locadoraId() == null ||
      !this.dataInicio() ||
      !this.dataFim() ||
      invalidoData ||
      this.localId() == null ||
      this.saving()
    ) {
      return;
    }

    const req: ContratoRequest = {
      codigo: this.codigo().trim(),
      localId: this.localId(),
      locadoraId: this.locadoraId(),
      dataInicio: this.dataInicio(),
      dataFim: this.dataFim(),
    };
    this.saving.set(true);

    const id = this.contratoId();
    const op$ = this.editMode && id != null ? this.service.atualizar(id, req) : this.service.criar(req);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          this.editMode ? 'Contrato atualizado' : 'Contrato cadastrado',
          `${req.codigo} salvo com sucesso.`,
        );
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
    else if (this.localId() != null) this.router.navigate(['/contratos/local', this.localId()]);
    else this.router.navigateByUrl('/contratos');
  }

  private handleError(err: HttpErrorResponse): void {
    const body = err.error as ApiError | null;
    if (body?.fieldErrors?.length) {
      const map: Record<string, string> = {};
      for (const fe of body.fieldErrors) map[fe.field] = fe.message;
      this.serverErrors.set(map);
      this.toast.error('Não foi possível salvar', body.message ?? 'Verifique os campos destacados.');
      return;
    }
    const msg =
      err.status === 0
        ? 'Sem conexão com o servidor. Verifique se a API está no ar (porta 8080).'
        : (body?.message ?? 'Ocorreu um erro inesperado.');
    this.toast.error('Não foi possível salvar', msg);
  }

  private mensagemErro(e: HttpErrorResponse): string {
    if (e.status === 0) return 'Sem conexão com o servidor. Verifique se a API está no ar (porta 8080).';
    const body = e.error as ApiError | null;
    return body?.message ?? 'Ocorreu um erro inesperado ao falar com o servidor.';
  }

  private hoje(): string {
    if (!this.isBrowser) return '';
    return this.fmt(new Date());
  }
  private addDias(iso: string, n: number): string {
    const d = this.parse(iso);
    if (!d) return iso;
    d.setDate(d.getDate() + n);
    return this.fmt(d);
  }
  private addAnos(iso: string, n: number): string {
    const d = this.parse(iso);
    if (!d) return iso;
    d.setFullYear(d.getFullYear() + n);
    return this.fmt(d);
  }
  private parse(iso: string): Date | null {
    const [y, m, d] = (iso ?? '').split('-').map(Number);
    return y && m && d ? new Date(y, m - 1, d) : null;
  }
  private fmt(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
}
