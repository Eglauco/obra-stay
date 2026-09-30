import {
  Component,
  DestroyRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Location, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormField, form, maxLength, readonly, required } from '@angular/forms/signals';
import { LocalService } from '../../../core/services/local.service';
import { StatusLocalService } from '../../../core/services/status-local.service';
import { OrcamentoMobiliarioService } from '../../../core/services/orcamento-mobiliario.service';
import { ViaCepService } from '../../../core/services/via-cep.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/colaborador.model';
import { Local, LocalRequest, LocalStatusHistorico } from '../../../core/models/local.model';
import { StatusLocal } from '../../../core/models/status-local.model';
import { OrcamentoOpcao } from '../../../core/models/orcamento-mobiliario.model';
import { TrocarStatusDialog } from '../trocar-status-dialog/trocar-status-dialog';
import { ConfirmDialog } from '../../../core/components/confirm-dialog/confirm-dialog';
import { PodeDirective } from '../../../core/directives/pode.directive';
import { formatarDataHora } from '../../../core/util/format';

interface LocalModel {
  codigo: string;
  nome: string;
  capacidade: number | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  statusId: number | null;
}

/** Linha editável de item de mobília (valores como texto; convertidos no submit). */
interface MobiliaRow {
  key: number;
  nome: string;
  preco: string;
  quantidade: string;
}

type AbaLocal = 'dados' | 'status' | 'mobilia' | 'resumo';

/** Tela dedicada de criar/editar local (padrão de CRUD: sempre em nova tela). */
@Component({
  selector: 'app-local-cadastro',
  imports: [FormField, TrocarStatusDialog, ConfirmDialog, PodeDirective],
  templateUrl: './local-cadastro.html',
  styleUrl: './local-cadastro.css',
})
export class LocalCadastro {
  private readonly service = inject(LocalService);
  private readonly statusService = inject(StatusLocalService);
  private readonly orcamentoService = inject(OrcamentoMobiliarioService);
  private readonly viaCep = inject(ViaCepService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);

  private readonly id = signal<number | null>(this.lerId());
  protected readonly editMode = computed(() => this.id() != null);
  protected readonly somenteLeitura = signal(this.route.snapshot.data['modo'] === 'visualizar');
  protected readonly localIdAtual = computed(() => this.id());
  protected readonly statusAtualId = computed(() => this.statusInfo()?.id ?? null);

  protected readonly saving = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erroCarregar = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly submetido = signal(false);

  // Abas do cadastro
  protected readonly aba = signal<AbaLocal>('dados');

  // Nº de quartos (signal próprio: alimenta a regra de mobiliário em tempo real)
  protected readonly quartos = signal<number | null>(null);

  // Valor do aluguel mensal (signal próprio: alimenta o Resumo Financeiro em tempo real)
  protected readonly valorAluguel = signal<number | null>(null);

  // Mobília do local
  protected readonly itensMobilia = signal<MobiliaRow[]>([]);
  protected readonly orcamentoOpcoes = signal<OrcamentoOpcao[]>([]);
  protected readonly orcamentoSelId = signal<number | null>(null);
  protected readonly aplicandoOrcamento = signal(false);
  protected readonly confirmarAplicar = signal<OrcamentoOpcao | null>(null);
  private seqMobilia = 0;

  // Estado do CEP (tratado manualmente por causa da máscara + ViaCEP)
  protected readonly cepBuscando = signal(false);
  protected readonly cepErro = signal<string | null>(null);

  // Foto do local (só vai pro S3 no Salvar)
  protected readonly fotoPreview = signal<string | null>(null);
  protected readonly fotoArquivo = signal<File | null>(null);
  protected readonly removerFoto = signal(false);
  protected readonly fotoErro = signal<string | null>(null);
  private readonly tinhaFoto = signal(false);
  private fotoObjectUrl: string | null = null;

  protected readonly model = signal<LocalModel>({
    codigo: '',
    nome: '',
    capacidade: null,
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    statusId: null,
  });

  // Status do local
  protected readonly statusOpcoes = signal<StatusLocal[]>([]);
  protected readonly statusInfo = signal<{ id: number; nome: string; hospedagemLiberada: boolean } | null>(null);
  protected readonly historico = signal<LocalStatusHistorico[]>([]);
  protected readonly carregandoHistorico = signal(false);
  protected readonly mostrarTrocaStatus = signal(false);
  protected readonly fmtData = formatarDataHora;

  protected readonly f = form(this.model, (p) => {
    required(p.codigo, { message: 'Informe o código.' });
    maxLength(p.codigo, 30, { message: 'Use no máximo 30 caracteres.' });
    required(p.nome, { message: 'Informe o nome.' });
    maxLength(p.nome, 120, { message: 'Use no máximo 120 caracteres.' });
    required(p.capacidade, { message: 'Informe a capacidade.' });
    required(p.logradouro, { message: 'Informe o logradouro.' });
    required(p.numero, { message: 'Informe o número.' });
    required(p.bairro, { message: 'Informe o bairro.' });
    required(p.statusId, { message: 'Selecione o status.' });
    // cidade e uf são preenchidos pelo ViaCEP (campos travados) e validados no submit.
    // Modo visualizar: trava os campos do formulário permitindo copiar (readonly via schema).
    const bloqueado = () => this.somenteLeitura();
    readonly(p.codigo, { when: bloqueado });
    readonly(p.nome, { when: bloqueado });
    readonly(p.capacidade, { when: bloqueado });
    readonly(p.logradouro, { when: bloqueado });
    readonly(p.numero, { when: bloqueado });
    readonly(p.complemento, { when: bloqueado });
    readonly(p.bairro, { when: bloqueado });
  });

  // Erros por campo (servidor + validação local)
  protected readonly codigoError = computed(() => this.err(this.f.codigo, 'codigo'));
  protected readonly nomeError = computed(() => this.err(this.f.nome, 'nome'));
  protected readonly capacidadeError = computed(() => this.err(this.f.capacidade, 'capacidade'));
  protected readonly logradouroError = computed(() => this.err(this.f.logradouro, 'logradouro'));
  protected readonly numeroError = computed(() => this.err(this.f.numero, 'numero'));
  protected readonly complementoError = computed(() => this.serverErrors()['complemento'] ?? null);
  protected readonly bairroError = computed(() => this.err(this.f.bairro, 'bairro'));
  protected readonly cidadeError = computed(() => this.err(this.f.cidade, 'cidade'));
  protected readonly ufError = computed(() => this.err(this.f.uf, 'uf'));
  protected readonly statusError = computed(() => this.err(this.f.statusId, 'statusId'));
  protected readonly fotoError = computed(() => this.serverErrors()['foto'] ?? this.fotoErro());
  protected readonly quartosError = computed(
    () =>
      this.serverErrors()['quartos'] ??
      (this.submetido() && !((this.quartos() ?? 0) >= 1) ? 'Informe ao menos 1 quarto.' : null),
  );
  protected readonly valorAluguelError = computed(() => this.serverErrors()['valorAluguel'] ?? null);
  protected readonly totalMobilia = computed(() =>
    this.itensMobilia().reduce((soma, r) => soma + this.subtotalMobilia(r), 0),
  );
  protected readonly itensMobiliaServerError = computed(() => this.serverErrors()['itensMobilia'] ?? null);

  /**
   * Valor por residente: ANO = total estimado; MÊS = (total ÷ moradores) ÷ 12.
   * Moradores = capacidade do local (nº de residentes).
   */
  protected readonly cenariosMoradores = computed(() => {
    const moradores = this.model().capacidade ?? 0;
    const total = this.totalMobilia();
    if (moradores <= 0) return [];
    return [{ moradores, ano: total, mes: total / moradores / 12 }];
  });

  // ----- Resumo Financeiro (aluguel + mobiliário) -----
  protected readonly mobiliarioMensal = computed(() => this.totalMobilia() / 12);
  protected readonly custoMensalCasa = computed(() => (this.valorAluguel() ?? 0) + this.mobiliarioMensal());
  protected readonly moradoresFinanceiro = computed(() => this.model().capacidade ?? 0);
  protected readonly custoMensalPorMorador = computed(() => {
    const m = this.moradoresFinanceiro();
    return m > 0 ? this.custoMensalCasa() / m : 0;
  });
  protected readonly custoDiarioPorMorador = computed(() => this.custoMensalPorMorador() / 30);

  constructor() {
    this.destroyRef.onDestroy(() => this.revogarObjectUrl());
    afterNextRender(() => {
      this.carregarStatusOpcoes();
      this.carregarOrcamentoOpcoes();
      const id = this.id();
      if (id != null) this.carregar(id);
      else document.getElementById('loc-codigo')?.focus();
    });
  }

  private carregarStatusOpcoes(): void {
    this.statusService.opcoes().subscribe({
      next: (os) => this.statusOpcoes.set(os),
      error: () => this.statusOpcoes.set([]),
    });
  }

  private carregarOrcamentoOpcoes(): void {
    this.orcamentoService.opcoes().subscribe({
      next: (os) => this.orcamentoOpcoes.set(os),
      error: () => this.orcamentoOpcoes.set([]),
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
      next: (l) => {
        this.model.set({
          codigo: l.codigo,
          nome: l.nome,
          capacidade: l.capacidade,
          cep: ViaCepService.formatar(l.cep),
          logradouro: l.logradouro,
          numero: l.numero,
          complemento: l.complemento ?? '',
          bairro: l.bairro,
          cidade: l.cidade,
          uf: l.uf,
          statusId: l.statusId ?? null,
        });
        this.quartos.set(l.quartos ?? null);
        this.valorAluguel.set(l.valorAluguel ?? null);
        this.itensMobilia.set(
          (l.itensMobilia ?? []).map((it) => ({
            key: this.seqMobilia++,
            nome: it.nome,
            preco: String(it.precoUnitario ?? ''),
            quantidade: String(it.quantidade ?? ''),
          })),
        );
        this.statusInfo.set(
          l.statusId != null
            ? { id: l.statusId, nome: l.statusNome ?? '—', hospedagemLiberada: !!l.hospedagemLiberada }
            : null,
        );
        this.fotoPreview.set(l.fotoUrl ?? null);
        this.tinhaFoto.set(!!l.fotoUrl);
        this.fotoArquivo.set(null);
        this.removerFoto.set(false);
        this.carregando.set(false);
        this.carregarHistorico(l.id);
        queueMicrotask(() => document.getElementById('loc-codigo')?.focus());
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroCarregar.set(e.status === 404 ? 'Local não encontrado.' : this.mensagemErro(e));
      },
    });
  }

  // ----- CEP / ViaCEP -----
  protected onCepInput(valor: string): void {
    const fmt = ViaCepService.formatar(valor);
    this.model.update((m) => ({ ...m, cep: fmt }));
    this.cepErro.set(null);
    this.clearServerError('cep');
    if (ViaCepService.digitos(fmt).length === 8) this.buscarCep(fmt);
  }

  private buscarCep(cep: string): void {
    if (!this.isBrowser) return;
    this.cepBuscando.set(true);
    this.viaCep.consultar(cep).subscribe({
      next: (r) => {
        this.cepBuscando.set(false);
        if (r?.erro) {
          this.cepErro.set('CEP não encontrado.');
          return;
        }
        this.model.update((m) => ({
          ...m,
          logradouro: r.logradouro || m.logradouro,
          bairro: r.bairro || m.bairro,
          cidade: r.localidade ?? '',
          uf: r.uf ?? '',
        }));
        queueMicrotask(() => document.getElementById('loc-numero')?.focus());
      },
      error: () => {
        this.cepBuscando.set(false);
        this.cepErro.set('Não foi possível consultar o CEP agora.');
      },
    });
  }

  protected setCampo(campo: keyof LocalModel, valor: string): void {
    this.model.update((m) => ({ ...m, [campo]: valor }));
  }

  // ----- Status -----
  protected setStatus(valor: string): void {
    const id = valor ? Number(valor) : null;
    this.model.update((m) => ({ ...m, statusId: id }));
    this.f.statusId().markAsTouched();
    this.clearServerError('statusId');
  }

  private carregarHistorico(id: number): void {
    this.carregandoHistorico.set(true);
    this.service.historicoStatus(id).subscribe({
      next: (h) => {
        this.historico.set(h);
        this.carregandoHistorico.set(false);
      },
      error: () => {
        this.historico.set([]);
        this.carregandoHistorico.set(false);
      },
    });
  }

  protected abrirTrocaStatus(): void {
    if (this.statusOpcoes().length > 0) this.mostrarTrocaStatus.set(true);
  }

  protected fecharTrocaStatus(): void {
    this.mostrarTrocaStatus.set(false);
  }

  protected onStatusTrocado(local: Local): void {
    this.mostrarTrocaStatus.set(false);
    this.statusInfo.set(
      local.statusId != null
        ? { id: local.statusId, nome: local.statusNome ?? '—', hospedagemLiberada: !!local.hospedagemLiberada }
        : null,
    );
    this.model.update((m) => ({ ...m, statusId: local.statusId ?? m.statusId }));
    const id = this.id();
    if (id != null) this.carregarHistorico(id);
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

  protected submit(): void {
    if (this.somenteLeitura()) return;
    this.submetido.set(true);
    this.f.codigo().markAsTouched();
    this.f.nome().markAsTouched();
    this.f.capacidade().markAsTouched();
    this.f.logradouro().markAsTouched();
    this.f.numero().markAsTouched();
    this.f.bairro().markAsTouched();
    this.f.statusId().markAsTouched();
    this.serverErrors.set({});

    const cepDigitos = ViaCepService.digitos(this.model().cep);
    if (cepDigitos.length !== 8) {
      this.cepErro.set('Informe um CEP válido (8 dígitos).');
    } else if (!this.model().cidade.trim() || !this.model().uf.trim()) {
      this.cepErro.set('Consulte um CEP válido para preencher cidade e UF.');
    }

    const mobiliaErro = this.itensMobilia().some((r) => !!this.erroLinhaMobilia(r));

    // Leva o usuário para a primeira aba que tiver erro.
    const dadosErro = !!(
      this.codigoError() ||
      this.nomeError() ||
      this.capacidadeError() ||
      this.logradouroError() ||
      this.numeroError() ||
      this.bairroError() ||
      this.cepErro() ||
      this.quartosError()
    );
    if (dadosErro) this.aba.set('dados');
    else if (this.statusError()) this.aba.set('status');
    else if (mobiliaErro) this.aba.set('mobilia');

    if (!this.f().valid() || this.cepErro() || this.quartosError() || mobiliaErro || this.saving()) {
      return;
    }

    const v = this.model();
    const req: LocalRequest = {
      codigo: v.codigo.trim(),
      nome: v.nome.trim(),
      capacidade: v.capacidade == null ? null : Number(v.capacidade),
      cep: ViaCepService.formatar(v.cep),
      logradouro: v.logradouro.trim(),
      numero: v.numero.trim(),
      complemento: v.complemento.trim() || null,
      bairro: v.bairro.trim(),
      cidade: v.cidade.trim(),
      uf: v.uf.trim().toUpperCase(),
      statusId: v.statusId,
      quartos: this.quartos(),
      valorAluguel: this.valorAluguel(),
      itensMobilia: this.itensMobilia().map((r) => ({
        nome: r.nome.trim(),
        precoUnitario: Number(r.preco.trim().replace(',', '.')),
        quantidade: this.inteiroMobilia(r.quantidade),
      })),
    };
    const id = this.id();
    this.saving.set(true);

    const foto = this.fotoArquivo();
    const op$ =
      id != null
        ? this.service.atualizar(id, req, foto, this.removerFoto())
        : this.service.criar(req, foto);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          id != null ? 'Local atualizado' : 'Local cadastrado',
          `${req.nome} foi ${id != null ? 'atualizado' : 'adicionado'} com sucesso.`,
        );
        this.voltar();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.handleError(e);
      },
    });
  }

  // ----- Foto -----
  protected onFotoSelecionada(input: HTMLInputElement): void {
    const file = input.files?.[0] ?? null;
    input.value = ''; // permite re-selecionar o mesmo arquivo depois
    if (!file) return;

    const tiposOk = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!tiposOk.includes(file.type)) {
      this.fotoErro.set('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.fotoErro.set('A imagem deve ter no máximo 5 MB.');
      return;
    }

    this.fotoErro.set(null);
    this.clearServerError('foto');
    this.revogarObjectUrl();
    const url = this.isBrowser ? URL.createObjectURL(file) : null;
    this.fotoObjectUrl = url;
    this.fotoArquivo.set(file);
    this.fotoPreview.set(url);
    this.removerFoto.set(false);
  }

  protected removerFotoAtual(): void {
    this.revogarObjectUrl();
    this.fotoArquivo.set(null);
    this.fotoPreview.set(null);
    this.fotoErro.set(null);
    this.clearServerError('foto');
    // Só marca remoção no servidor se o local já tinha foto salva.
    this.removerFoto.set(this.tinhaFoto());
  }

  private revogarObjectUrl(): void {
    if (this.fotoObjectUrl && this.isBrowser) {
      URL.revokeObjectURL(this.fotoObjectUrl);
    }
    this.fotoObjectUrl = null;
  }

  // ----- Abas -----
  protected irParaAba(tab: AbaLocal): void {
    this.aba.set(tab);
  }

  protected abaCls(tab: AbaLocal): string {
    const base =
      'inline-flex h-10 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors -mb-px';
    return this.aba() === tab
      ? `${base} border-accent text-accent`
      : `${base} border-transparent text-muted hover:text-fg`;
  }

  /** Navegação por teclado nas abas (setas / Home / End), padrão ARIA de tabs. */
  protected onTabKeydown(e: KeyboardEvent): void {
    const ordem: AbaLocal[] = ['dados', 'status', 'mobilia', 'resumo'];
    const atual = ordem.indexOf(this.aba());
    let alvo = atual;
    if (e.key === 'ArrowRight') alvo = (atual + 1) % ordem.length;
    else if (e.key === 'ArrowLeft') alvo = (atual - 1 + ordem.length) % ordem.length;
    else if (e.key === 'Home') alvo = 0;
    else if (e.key === 'End') alvo = ordem.length - 1;
    else return;
    e.preventDefault();
    this.aba.set(ordem[alvo]);
    queueMicrotask(() => document.getElementById('tab-' + ordem[alvo])?.focus());
  }

  // ----- Quartos -----
  protected setQuartos(valor: string): void {
    const bruto = valor.trim();
    if (bruto === '') {
      this.quartos.set(null);
    } else {
      const n = Math.trunc(Number(bruto.replace(',', '.')));
      this.quartos.set(Number.isFinite(n) ? n : null);
    }
    this.clearServerError('quartos');
  }

  protected setValorAluguel(valor: string): void {
    const bruto = valor.trim();
    if (bruto === '') {
      this.valorAluguel.set(null);
    } else {
      const n = Number(bruto.replace(',', '.'));
      this.valorAluguel.set(Number.isFinite(n) ? Math.max(0, n) : null);
    }
    this.clearServerError('valorAluguel');
  }

  // ----- Orçamento (cópia de itens para o local) -----
  protected setOrcamentoSel(valor: string): void {
    this.orcamentoSelId.set(valor ? Number(valor) : null);
  }

  protected aplicarOrcamento(): void {
    if ((this.quartos() ?? 0) < 1) {
      this.submetido.set(true);
      this.aba.set('dados');
      this.toast.error('Informe o nº de quartos', 'A quantidade dos itens é calculada pelo nº de quartos.');
      return;
    }
    const id = this.orcamentoSelId();
    if (id == null) {
      this.toast.error('Selecione um orçamento', 'Escolha um orçamento para copiar os itens.');
      return;
    }
    const op = this.orcamentoOpcoes().find((o) => o.id === id) ?? null;
    if (this.itensMobilia().length > 0) {
      this.confirmarAplicar.set(op);
      return;
    }
    this.copiarDoOrcamento(id);
  }

  protected confirmarAplicarSim(): void {
    const op = this.confirmarAplicar();
    if (op) this.copiarDoOrcamento(op.id);
  }

  protected cancelarAplicar(): void {
    if (!this.aplicandoOrcamento()) this.confirmarAplicar.set(null);
  }

  private copiarDoOrcamento(id: number): void {
    this.aplicandoOrcamento.set(true);
    this.orcamentoService.obter(id).subscribe({
      next: (orc) => {
        // Resolve a escala do orçamento numa quantidade única, usando o nº de quartos do local.
        const q = this.quartos() ?? 0;
        this.itensMobilia.set(
          (orc.itens ?? []).map((it) => ({
            key: this.seqMobilia++,
            nome: it.nome,
            preco: String(it.precoUnitario ?? ''),
            quantidade: String((it.quantidadeFixa ?? 0) + (it.quantidadePorQuarto ?? 0) * q),
          })),
        );
        this.aplicandoOrcamento.set(false);
        this.confirmarAplicar.set(null);
        this.toast.success('Itens copiados', `${orc.itens?.length ?? 0} item(ns) de "${orc.nome}" adicionados.`);
      },
      error: (e: HttpErrorResponse) => {
        this.aplicandoOrcamento.set(false);
        this.confirmarAplicar.set(null);
        this.toast.error('Não foi possível copiar', this.mensagemErro(e));
      },
    });
  }

  // ----- Itens de mobília -----
  private novaMobilia(): MobiliaRow {
    return { key: this.seqMobilia++, nome: '', preco: '', quantidade: '1' };
  }

  protected adicionarMobilia(): void {
    this.itensMobilia.update((rows) => [...rows, this.novaMobilia()]);
  }

  protected removerMobilia(key: number): void {
    this.itensMobilia.update((rows) => rows.filter((r) => r.key !== key));
  }

  protected atualizarMobilia(key: number, campo: keyof MobiliaRow, e: Event): void {
    const valor = (e.target as HTMLInputElement).value;
    this.itensMobilia.update((rows) => rows.map((r) => (r.key === key ? { ...r, [campo]: valor } : r)));
  }

  private inteiroMobilia(s: string): number {
    const n = Number(s.trim().replace(',', '.'));
    return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
  }

  protected precoMobiliaValido(row: MobiliaRow): boolean {
    const v = row.preco.trim().replace(',', '.');
    if (v === '') return false;
    // Até 10 dígitos inteiros e 2 casas decimais (alinha com @Digits do backend).
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(v)) return false;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0;
  }

  private precoMobiliaNum(row: MobiliaRow): number {
    return this.precoMobiliaValido(row) ? Number(row.preco.trim().replace(',', '.')) : 0;
  }

  protected qtdMobiliaValida(row: MobiliaRow): boolean {
    return this.inteiroMobilia(row.quantidade) >= 1;
  }

  protected subtotalMobilia(row: MobiliaRow): number {
    return this.precoMobiliaNum(row) * this.inteiroMobilia(row.quantidade);
  }

  protected erroLinhaMobilia(row: MobiliaRow): string | null {
    if (!this.submetido()) return null;
    if (!row.nome.trim()) return 'Informe o nome do item.';
    if (row.nome.trim().length > 160) return 'Nome muito longo (máx. 160 caracteres).';
    if (!this.precoMobiliaValido(row)) return 'Preço inválido (≥ 0, até 2 casas decimais).';
    if (!this.qtdMobiliaValida(row)) return 'A quantidade deve ser ao menos 1.';
    return null;
  }

  protected brl(n: number): string {
    return (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  protected voltar(): void {
    const navId = this.isBrowser
      ? ((history.state?.navigationId as number | undefined) ?? 1)
      : 1;
    if (navId > 1) this.location.back();
    else this.router.navigateByUrl('/locais');
  }

  private err(state: () => { touched(): boolean; errors(): { message?: string }[] }, key: string): string | null {
    const server = this.serverErrors()[key];
    if (server) return server;
    const st = state();
    return st.touched() ? (st.errors()[0]?.message ?? null) : null;
  }

  private handleError(err: HttpErrorResponse): void {
    const body = err.error as ApiError | null;
    if (body?.fieldErrors?.length) {
      const map: Record<string, string> = {};
      for (const fe of body.fieldErrors) {
        const campo = fe.field.startsWith('itensMobilia') ? 'itensMobilia' : fe.field;
        map[campo] = map[campo] ?? fe.message;
      }
      this.serverErrors.set(map);
      if (map['statusId']) this.aba.set('status');
      else if (map['itensMobilia']) this.aba.set('mobilia');
      else this.aba.set('dados');
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
