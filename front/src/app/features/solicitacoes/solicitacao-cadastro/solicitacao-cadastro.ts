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
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { TipoSolicitacaoService } from '../../../core/services/tipo-solicitacao.service';
import { ColaboradorService } from '../../../core/services/colaborador.service';
import { ToastService } from '../../../core/services/toast.service';
import { BuscaOpcao, BuscaSelect } from '../../../core/components/busca-select/busca-select';
import { MudarStatusDialog } from '../../../core/components/mudar-status-dialog/mudar-status-dialog';
import { SolicitacaoHistoricoDialog } from '../solicitacao-historico-dialog/solicitacao-historico-dialog';
import { ApiError } from '../../../core/models/colaborador.model';
import {
  SOLICITACAO_STATUS_LABEL,
  Solicitacao,
  SolicitacaoRequest,
  StatusSolicitacao,
} from '../../../core/models/solicitacao.model';
import { formatarDataHora } from '../../../core/util/format';

type AcaoStatus = 'iniciar' | 'finalizar' | 'cancelar' | 'reabrir';
interface Mudanca {
  acao: AcaoStatus;
  titulo: string;
  descricao: string;
  confirmLabel: string;
  perigo: boolean;
}

interface CadastroModel {
  tipoSolicitacaoId: number | null;
  colaboradorId: number | null;
  localId: number | null;
  observacao: string;
}

const OBS_MAX = 1000;

/** Tela dedicada de abrir/editar solicitação (padrão de CRUD: sempre em nova tela). */
@Component({
  selector: 'app-solicitacao-cadastro',
  imports: [FormField, BuscaSelect, MudarStatusDialog, SolicitacaoHistoricoDialog],
  templateUrl: './solicitacao-cadastro.html',
  styleUrl: './solicitacao-cadastro.css',
})
export class SolicitacaoCadastro {
  private readonly service = inject(SolicitacaoService);
  private readonly tipoService = inject(TipoSolicitacaoService);
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly obsMax = OBS_MAX;

  // Valores iniciais (modo edição) dos campos de busca.
  protected readonly tipoInicial = signal<BuscaOpcao | null>(null);
  protected readonly colaboradorInicial = signal<BuscaOpcao | null>(null);
  protected readonly localInicial = signal<BuscaOpcao | null>(null);
  // Locais do colaborador selecionado (restringe o campo Local).
  protected readonly locaisColaborador = signal<BuscaOpcao[]>([]);

  protected readonly id = signal<number | null>(this.lerId());
  protected readonly editMode = computed(() => this.id() != null);

  protected readonly saving = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erroCarregar = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  // Situação (só relevante no modo edição) + ações de status.
  protected readonly status = signal<StatusSolicitacao | null>(null);
  /** Solicitação carregada (modo edição = somente leitura + troca de status). */
  protected readonly carregada = signal<Solicitacao | null>(null);
  protected readonly acaoStatus = signal(false);
  protected readonly mudanca = signal<Mudanca | null>(null);
  protected readonly historicoAberto = signal(false);
  protected readonly encerrada = computed(
    () => this.status() === 'FINALIZADA' || this.status() === 'CANCELADA',
  );
  protected readonly podeIniciar = computed(() => this.status() === 'AGUARDANDO_ANALISE');
  protected readonly podeFinalizar = computed(() => this.status() === 'EM_PROCESSAMENTO');
  protected readonly podeCancelar = computed(
    () => this.status() === 'AGUARDANDO_ANALISE' || this.status() === 'EM_PROCESSAMENTO',
  );
  protected readonly podeReabrir = computed(() => this.encerrada());

  protected readonly model = signal<CadastroModel>({
    tipoSolicitacaoId: null,
    colaboradorId: null,
    localId: null,
    observacao: '',
  });

  protected readonly f = form(this.model, (p) => {
    required(p.tipoSolicitacaoId, { message: 'Selecione o tipo de solicitação.' });
    required(p.colaboradorId, { message: 'Selecione o colaborador solicitante.' });
    required(p.localId, { message: 'Selecione o local da solicitação.' });
    required(p.observacao, { message: 'Descreva a solicitação.' });
    maxLength(p.observacao, OBS_MAX, { message: `Use no máximo ${OBS_MAX} caracteres.` });
  });

  protected readonly obsCount = computed(() => this.model().observacao.length);
  protected readonly temColaborador = computed(() => this.model().colaboradorId != null);

  protected readonly tipoError = computed(() => this.fieldError('tipoSolicitacaoId', this.f.tipoSolicitacaoId));
  protected readonly colaboradorError = computed(() => this.fieldError('colaboradorId', this.f.colaboradorId));
  protected readonly localError = computed(() => this.fieldError('localId', this.f.localId));
  protected readonly obsError = computed(() => this.fieldError('observacao', this.f.observacao));

  protected readonly buscarTipo = (t: string): Observable<BuscaOpcao[]> =>
    this.tipoService
      .listar({ id: null, nome: t || null, page: 0, size: 8, sort: 'nome,asc' })
      .pipe(map((r) => r.content));

  protected readonly buscarColaborador = (t: string): Observable<BuscaOpcao[]> =>
    this.colaboradorService
      .listar({ id: null, nome: t || null, sexo: null, funcaoId: null, page: 0, size: 8, sort: 'nome,asc' })
      .pipe(map((r) => r.content));

  // Local é filtrado no cliente a partir dos locais do colaborador (regra de vínculo).
  protected readonly buscarLocal = (t: string): Observable<BuscaOpcao[]> => {
    const termo = t.trim().toLowerCase();
    const lista = this.locaisColaborador();
    return of(termo ? lista.filter((l) => l.nome.toLowerCase().includes(termo)) : lista);
  };

  constructor() {
    afterNextRender(() => {
      const id = this.id();
      if (id != null) this.carregar(id);
    });
  }

  private lerId(): number | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private carregar(id: number): void {
    this.carregando.set(true);
    this.erroCarregar.set(null);
    this.service.obter(id).subscribe({
      next: (s) => {
        this.model.set({
          tipoSolicitacaoId: s.tipoSolicitacao?.id ?? null,
          colaboradorId: s.colaborador?.id ?? null,
          localId: s.local?.id ?? null,
          observacao: s.observacao,
        });
        this.tipoInicial.set(s.tipoSolicitacao ?? null);
        this.colaboradorInicial.set(s.colaborador ?? null);
        this.localInicial.set(s.local ?? null);
        this.status.set(s.status);
        this.carregada.set(s);
        if (s.colaborador?.id != null) this.carregarLocais(s.colaborador.id, false);
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroCarregar.set(
          e.status === 404 ? 'Solicitação não encontrada.' : this.mensagemErro(e),
        );
      },
    });
  }

  private carregarLocais(colaboradorId: number, autoSelecionar: boolean): void {
    this.service.locaisDoColaborador(colaboradorId).subscribe({
      next: (res) => {
        this.locaisColaborador.set(res.locais);
        if (autoSelecionar && res.localAtivoId != null) {
          const ativo = res.locais.find((l) => l.id === res.localAtivoId);
          if (ativo) {
            this.localInicial.set(ativo);
            this.model.update((m) => ({ ...m, localId: ativo.id }));
            this.f.localId().markAsTouched();
          }
        }
      },
      error: () =>
        this.toast.error('Locais indisponíveis', 'Não foi possível carregar os locais do colaborador.'),
    });
  }

  private fieldError(
    campo: string,
    field: { (): { touched(): boolean; errors(): { message?: string }[] } },
  ): string | null {
    const server = this.serverErrors()[campo];
    if (server) return server;
    const st = field();
    return st.touched() ? (st.errors()[0]?.message ?? null) : null;
  }

  protected onTipo(op: BuscaOpcao | null): void {
    this.model.update((m) => ({ ...m, tipoSolicitacaoId: op?.id ?? null }));
    this.f.tipoSolicitacaoId().markAsTouched();
    this.clearServerError('tipoSolicitacaoId');
  }

  protected onColaborador(op: BuscaOpcao | null): void {
    // Troca de colaborador reseta o local (a regra de vínculo depende dele).
    this.model.update((m) => ({ ...m, colaboradorId: op?.id ?? null, localId: null }));
    this.localInicial.set(null);
    this.locaisColaborador.set([]);
    this.f.colaboradorId().markAsTouched();
    this.clearServerError('colaboradorId');
    this.clearServerError('localId');
    if (op) this.carregarLocais(op.id, true);
  }

  protected onLocal(op: BuscaOpcao | null): void {
    this.model.update((m) => ({ ...m, localId: op?.id ?? null }));
    this.f.localId().markAsTouched();
    this.clearServerError('localId');
  }

  protected clearServerError(field: string): void {
    if (this.serverErrors()[field]) {
      this.serverErrors.update((e) => {
        const next = { ...e };
        delete next[field];
        return next;
      });
    }
  }

  // ----- Situação / transições de status -----
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

  protected pedirIniciar(): void {
    this.mudanca.set({
      acao: 'iniciar',
      titulo: 'Iniciar solicitação',
      descricao: 'A solicitação passa para "Em processamento".',
      confirmLabel: 'Iniciar',
      perigo: false,
    });
  }
  protected pedirFinalizar(): void {
    this.mudanca.set({
      acao: 'finalizar',
      titulo: 'Finalizar solicitação',
      descricao: 'A solicitação será marcada como concluída.',
      confirmLabel: 'Finalizar',
      perigo: false,
    });
  }
  protected pedirCancelar(): void {
    this.mudanca.set({
      acao: 'cancelar',
      titulo: 'Cancelar solicitação',
      descricao: 'A solicitação será encerrada (é possível reabri-la depois).',
      confirmLabel: 'Cancelar solicitação',
      perigo: true,
    });
  }
  protected pedirReabrir(): void {
    this.mudanca.set({
      acao: 'reabrir',
      titulo: 'Reabrir solicitação',
      descricao: 'A solicitação volta para "Em processamento".',
      confirmLabel: 'Reabrir',
      perigo: false,
    });
  }
  protected fecharMudanca(): void {
    if (!this.acaoStatus()) this.mudanca.set(null);
  }
  protected confirmarMudanca(observacao: string): void {
    const m = this.mudanca();
    const id = this.id();
    if (!m || id == null || this.acaoStatus()) return;
    const op$ =
      m.acao === 'iniciar'
        ? this.service.iniciar(id, observacao)
        : m.acao === 'finalizar'
          ? this.service.finalizar(id, observacao)
          : m.acao === 'cancelar'
            ? this.service.cancelar(id, observacao)
            : this.service.reabrir(id, observacao);
    this.acaoStatus.set(true);
    op$.subscribe({
      next: (s) => {
        this.acaoStatus.set(false);
        this.mudanca.set(null);
        this.status.set(s.status);
        this.toast.success('Status atualizado', 'A solicitação foi atualizada.');
      },
      error: (e: HttpErrorResponse) => {
        this.acaoStatus.set(false);
        this.toast.error('Ação não permitida', this.mensagemErro(e));
      },
    });
  }

  protected abrirHistorico(): void {
    this.historicoAberto.set(true);
  }
  protected fecharHistorico(): void {
    this.historicoAberto.set(false);
  }

  protected fmtDataHora(iso: string | null): string {
    return formatarDataHora(iso);
  }

  protected submit(): void {
    if (this.encerrada()) return;
    this.f.tipoSolicitacaoId().markAsTouched();
    this.f.colaboradorId().markAsTouched();
    this.f.localId().markAsTouched();
    this.f.observacao().markAsTouched();
    this.serverErrors.set({});

    if (!this.f().valid() || this.saving()) return;

    const value = this.model();
    const req: SolicitacaoRequest = {
      tipoSolicitacaoId: value.tipoSolicitacaoId,
      colaboradorId: value.colaboradorId,
      localId: value.localId,
      observacao: value.observacao.trim(),
    };
    const id = this.id();
    this.saving.set(true);

    const op$ = id != null ? this.service.atualizar(id, req) : this.service.criar(req);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          id != null ? 'Solicitação atualizada' : 'Solicitação aberta',
          id != null ? 'As alterações foram salvas.' : 'A solicitação foi registrada com sucesso.',
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
    else this.router.navigateByUrl('/solicitacoes');
  }

  private handleError(err: HttpErrorResponse): void {
    const body = err.error as ApiError | null;
    if (body?.fieldErrors?.length) {
      const map: Record<string, string> = {};
      for (const fe of body.fieldErrors) map[fe.field] = fe.message;
      this.serverErrors.set(map);
      this.toast.error('Não foi possível salvar', 'Verifique os campos destacados.');
      return;
    }
    this.toast.error('Não foi possível salvar', body?.message ?? this.mensagemErro(err));
  }

  private mensagemErro(e: HttpErrorResponse): string {
    if (e.status === 0) {
      return 'Sem conexão com o servidor. Verifique se a API está no ar (porta 8080).';
    }
    const body = e.error as ApiError | null;
    return body?.message ?? 'Ocorreu um erro inesperado ao falar com o servidor.';
  }
}
