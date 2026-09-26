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
import { ActivatedRoute } from '@angular/router';
import { EntradaService } from '../../../core/services/entrada.service';
import { ApiError } from '../../../core/models/colaborador.model';
import {
  ConsultaEntrada,
  EntradaResultado,
  LocalEntrada,
} from '../../../core/models/entrada.model';
import {
  HistoricoStatus,
  SOLICITACAO_STATUS_LABEL,
  Solicitacao,
  StatusSolicitacao,
} from '../../../core/models/solicitacao.model';
import { HistoricoTimeline } from '../../../core/components/historico-timeline/historico-timeline';
import {
  apenasDigitosCpf,
  formatarCpf,
  formatarData,
  formatarDataHora,
} from '../../../core/util/format';

type Etapa = 'cpf' | 'menu' | 'solicitacao' | 'acompanhar' | 'ok';
const OBS_MAX = 1000;

/** Quiosque público (mobile) por QR Code: CPF -> menu (entrada/saída ou solicitação). Sem menu/login. */
@Component({
  selector: 'app-entrada-publica',
  imports: [HistoricoTimeline],
  templateUrl: './entrada-publica.html',
  styleUrl: './entrada-publica.css',
})
export class EntradaPublica {
  private readonly service = inject(EntradaService);
  private readonly route = inject(ActivatedRoute);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly localId = this.lerLocalId();
  protected readonly obsMax = OBS_MAX;

  protected readonly local = signal<LocalEntrada | null>(null);
  protected readonly carregandoLocal = signal(true);
  protected readonly erroLocal = signal<string | null>(null);

  protected readonly etapa = signal<Etapa>('cpf');
  protected readonly cpf = signal('');
  protected readonly consulta = signal<ConsultaEntrada | null>(null);
  protected readonly processando = signal(false);
  protected readonly erro = signal<string | null>(null);

  // Resultado (entrada/saída)
  protected readonly resultado = signal<EntradaResultado | null>(null);
  // Sucesso de solicitação
  protected readonly solSucesso = signal<{ tipoNome: string } | null>(null);

  // Solicitação
  protected readonly tipos = signal<{ id: number; nome: string }[]>([]);
  protected readonly carregandoTipos = signal(false);
  protected readonly solTipoId = signal<number | null>(null);
  protected readonly solObs = signal('');
  protected readonly enviandoSol = signal(false);
  protected readonly solErro = signal<string | null>(null);

  // Acompanhamento
  protected readonly solicitacoes = signal<Solicitacao[]>([]);
  protected readonly carregandoAcomp = signal(false);
  protected readonly acompErro = signal<string | null>(null);
  // Timeline expansível por solicitação
  protected readonly expandidoId = signal<number | null>(null);
  protected readonly historicoMap = signal<Record<number, HistoricoStatus[]>>({});
  protected readonly carregandoHistId = signal<number | null>(null);

  protected readonly cpfDisplay = computed(() => formatarCpf(this.cpf()));
  protected readonly cpfCompleto = computed(() => this.cpf().length === 11);
  protected readonly endereco = computed(() => {
    const l = this.local();
    if (!l) return '';
    const compl = l.complemento ? ` - ${l.complemento}` : '';
    return `${l.logradouro}, ${l.numero}${compl} · ${l.bairro} · ${l.cidade}/${l.uf}`;
  });
  protected readonly vagasRestantes = computed(() => {
    const l = this.local();
    return l ? Math.max(0, l.capacidade - l.ocupados) : 0;
  });

  // Menu (a partir da consulta)
  protected readonly nome = computed(() => this.consulta()?.colaboradorNome ?? '');
  protected readonly podeEntrada = computed(
    () => this.consulta()?.acao === 'ENTRADA' && !!this.consulta()?.localTemVaga,
  );
  protected readonly entradaSemVaga = computed(
    () => this.consulta()?.acao === 'ENTRADA' && !this.consulta()?.localTemVaga,
  );
  protected readonly podeSaida = computed(() => this.consulta()?.acao === 'SAIDA');
  protected readonly bloqueado = computed(() => this.consulta()?.acao === 'BLOQUEADO');

  protected readonly obsCount = computed(() => this.solObs().length);
  protected readonly solValido = computed(
    () => this.solTipoId() != null && this.solObs().trim().length > 0,
  );

  constructor() {
    afterNextRender(() => this.carregarLocal());
  }

  private lerLocalId(): number | null {
    const raw = this.route.snapshot.paramMap.get('localId');
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
  }

  private carregarLocal(): void {
    if (this.localId == null) {
      this.carregandoLocal.set(false);
      this.erroLocal.set('QR Code inválido. Peça ajuda à administração.');
      return;
    }
    this.carregandoLocal.set(true);
    this.erroLocal.set(null);
    this.service.infoLocal(this.localId).subscribe({
      next: (l) => {
        this.local.set(l);
        this.carregandoLocal.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregandoLocal.set(false);
        this.erroLocal.set(
          e.status === 404
            ? 'Local não encontrado. Verifique o QR Code com a administração.'
            : this.mensagemErro(e),
        );
      },
    });
  }

  protected onCpfInput(valor: string): void {
    this.cpf.set(apenasDigitosCpf(valor));
    this.erro.set(null);
  }

  // ----- Etapa 1: CPF -> consulta -> menu -----
  protected continuar(): void {
    if (!this.cpfCompleto() || this.processando() || this.localId == null) return;
    this.processando.set(true);
    this.erro.set(null);
    this.service.consultar(this.localId, this.cpf()).subscribe({
      next: (c) => {
        this.processando.set(false);
        this.consulta.set(c);
        this.etapa.set('menu');
      },
      error: (e: HttpErrorResponse) => {
        this.processando.set(false);
        this.erro.set(this.mensagemErro(e));
      },
    });
  }

  // ----- Menu: entrada/saída (executa direto) -----
  protected darEntradaSaida(): void {
    if (this.processando() || this.localId == null) return;
    this.processando.set(true);
    this.erro.set(null);
    this.service.confirmar(this.localId, this.cpf()).subscribe({
      next: (r) => {
        this.processando.set(false);
        this.resultado.set(r);
        this.etapa.set('ok');
      },
      error: (e: HttpErrorResponse) => {
        this.processando.set(false);
        this.erro.set(this.mensagemErro(e));
      },
    });
  }

  // ----- Menu: abrir solicitação -----
  protected irSolicitacao(): void {
    this.solTipoId.set(null);
    this.solObs.set('');
    this.solErro.set(null);
    this.etapa.set('solicitacao');
    if (this.tipos().length === 0) this.carregarTipos();
  }

  private carregarTipos(): void {
    this.carregandoTipos.set(true);
    this.service.tiposSolicitacao().subscribe({
      next: (ts) => {
        this.tipos.set(ts);
        this.carregandoTipos.set(false);
      },
      error: () => {
        this.carregandoTipos.set(false);
        this.solErro.set('Não foi possível carregar os tipos de solicitação.');
      },
    });
  }

  protected selecionarTipo(id: number): void {
    this.solTipoId.set(id);
    this.solErro.set(null);
  }

  protected onObsInput(valor: string): void {
    this.solObs.set(valor.slice(0, OBS_MAX));
    this.solErro.set(null);
  }

  protected enviarSolicitacao(): void {
    if (!this.solValido() || this.enviandoSol() || this.localId == null) return;
    const tipoId = this.solTipoId();
    if (tipoId == null) return;
    this.enviandoSol.set(true);
    this.solErro.set(null);
    this.service.abrirSolicitacao(this.localId, this.cpf(), tipoId, this.solObs().trim()).subscribe({
      next: () => {
        this.enviandoSol.set(false);
        const tipoNome = this.tipos().find((t) => t.id === tipoId)?.nome ?? 'Solicitação';
        this.solSucesso.set({ tipoNome });
        this.etapa.set('ok');
      },
      error: (e: HttpErrorResponse) => {
        this.enviandoSol.set(false);
        this.solErro.set(this.mensagemErro(e));
      },
    });
  }

  // ----- Menu: acompanhar solicitações -----
  protected irAcompanhar(): void {
    this.acompErro.set(null);
    this.etapa.set('acompanhar');
    this.carregarAcompanhamento();
  }

  private carregarAcompanhamento(): void {
    this.carregandoAcomp.set(true);
    this.acompErro.set(null);
    this.service.acompanharSolicitacoes(this.cpf()).subscribe({
      next: (lista) => {
        this.solicitacoes.set(lista);
        this.carregandoAcomp.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregandoAcomp.set(false);
        this.acompErro.set(this.mensagemErro(e));
      },
    });
  }

  protected toggleHistorico(sol: Solicitacao): void {
    if (this.expandidoId() === sol.id) {
      this.expandidoId.set(null);
      return;
    }
    this.expandidoId.set(sol.id);
    if (this.historicoMap()[sol.id]) return;
    this.carregandoHistId.set(sol.id);
    this.service.historicoSolicitacao(this.cpf(), sol.id).subscribe({
      next: (h) => {
        this.historicoMap.update((m) => ({ ...m, [sol.id]: h }));
        this.carregandoHistId.set(null);
      },
      error: () => {
        this.historicoMap.update((m) => ({ ...m, [sol.id]: [] }));
        this.carregandoHistId.set(null);
      },
    });
  }
  protected historicoDe(id: number): HistoricoStatus[] {
    return this.historicoMap()[id] ?? [];
  }

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
  protected fmtDataHora(iso: string | null): string {
    return formatarDataHora(iso);
  }

  // ----- Navegação -----
  protected voltarMenu(): void {
    this.etapa.set('menu');
    this.erro.set(null);
    this.solErro.set(null);
    this.acompErro.set(null);
  }

  protected trocarCpf(): void {
    this.etapa.set('cpf');
    this.consulta.set(null);
    this.erro.set(null);
    this.cpf.set('');
  }

  protected reiniciar(): void {
    this.trocarCpf();
    this.resultado.set(null);
    this.solSucesso.set(null);
    this.carregarLocal();
  }

  protected formatarData(iso: string | null): string {
    return formatarData(iso);
  }

  private mensagemErro(e: HttpErrorResponse): string {
    if (e.status === 0) {
      return 'Sem conexão. Verifique a internet e tente novamente.';
    }
    const body = e.error as ApiError | null;
    return body?.message ?? 'Ocorreu um erro. Tente novamente.';
  }
}
