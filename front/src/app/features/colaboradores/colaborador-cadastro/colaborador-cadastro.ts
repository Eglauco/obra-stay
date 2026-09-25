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
import { FormField, email, form, maxLength, required, validate } from '@angular/forms/signals';
import { ColaboradorService } from '../../../core/services/colaborador.service';
import { FuncaoService } from '../../../core/services/funcao.service';
import { EpcService } from '../../../core/services/epc.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { GestaoService } from '../../../core/services/gestao.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ApiError,
  ColaboradorRequest,
  Funcao,
  MDO_LABEL,
  Mdo,
  Sexo,
} from '../../../core/models/colaborador.model';
import { Epc } from '../../../core/models/epc.model';
import { Empresa } from '../../../core/models/empresa.model';
import { Gestao } from '../../../core/models/gestao.model';
import { apenasDigitosCpf, cpfValido, formatarCpf } from '../../../core/util/format';

interface CadastroModel {
  nome: string;
  sexo: Sexo | null;
  mdo: Mdo | null;
  cpf: string;
  email: string;
  funcaoId: number | null;
  epcId: number | null;
  empresaId: number | null;
  gestaoId: number | null;
}

const NOME_MAX = 120;
const EMAIL_MAX = 160;

/** Tela dedicada de criar/editar colaborador (padrão de CRUD: sempre em nova tela). */
@Component({
  selector: 'app-colaborador-cadastro',
  imports: [FormField],
  templateUrl: './colaborador-cadastro.html',
  styleUrl: './colaborador-cadastro.css',
})
export class ColaboradorCadastro {
  private readonly service = inject(ColaboradorService);
  private readonly funcaoService = inject(FuncaoService);
  private readonly epcService = inject(EpcService);
  private readonly empresaService = inject(EmpresaService);
  private readonly gestaoService = inject(GestaoService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly nomeMax = NOME_MAX;
  protected readonly emailMax = EMAIL_MAX;
  protected readonly sexoOpcoes: { value: Sexo; label: string }[] = [
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'FEMININO', label: 'Feminino' },
  ];
  protected readonly mdoOpcoes: { value: Mdo; label: string }[] = [
    { value: 'MAO_DE_OBRA_DIRETA', label: MDO_LABEL.MAO_DE_OBRA_DIRETA },
    { value: 'MAO_DE_OBRA_INDIRETA', label: MDO_LABEL.MAO_DE_OBRA_INDIRETA },
  ];
  protected readonly funcoes = signal<Funcao[]>([]);
  protected readonly epcs = signal<Epc[]>([]);
  protected readonly empresas = signal<Empresa[]>([]);
  protected readonly gestoes = signal<Gestao[]>([]);

  private readonly id = signal<number | null>(this.lerId());
  protected readonly editMode = computed(() => this.id() != null);

  protected readonly saving = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erroCarregar = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly model = signal<CadastroModel>({
    nome: '',
    sexo: null,
    mdo: null,
    cpf: '',
    email: '',
    funcaoId: null,
    epcId: null,
    empresaId: null,
    gestaoId: null,
  });

  protected readonly f = form(this.model, (p) => {
    required(p.nome, { message: 'O nome é obrigatório.' });
    maxLength(p.nome, NOME_MAX, { message: `Use no máximo ${NOME_MAX} caracteres.` });
    required(p.sexo, { message: 'Selecione o sexo.' });
    required(p.mdo, { message: 'Selecione a classificação da mão de obra.' });
    required(p.cpf, { message: 'O CPF é obrigatório.' });
    validate(p.cpf, ({ value }) => {
      const v = value();
      if (!v) return undefined;
      return cpfValido(v) ? undefined : { kind: 'cpf', message: 'CPF inválido.' };
    });
    required(p.email, { message: 'O e-mail é obrigatório.' });
    email(p.email, { message: 'E-mail inválido.' });
    maxLength(p.email, EMAIL_MAX, { message: `Use no máximo ${EMAIL_MAX} caracteres.` });
    required(p.funcaoId, { message: 'Selecione a função.' });
    required(p.epcId, { message: 'Selecione o EPC.' });
    required(p.empresaId, { message: 'Selecione a empresa.' });
    required(p.gestaoId, { message: 'Selecione a gestão.' });
  });

  protected readonly nomeCount = computed(() => this.model().nome.length);
  protected readonly cpfDisplay = computed(() => formatarCpf(this.model().cpf));

  protected readonly nomeError = computed(() => this.fieldError('nome', this.f.nome));
  protected readonly sexoError = computed(() => this.fieldError('sexo', this.f.sexo));
  protected readonly mdoError = computed(() => this.fieldError('mdo', this.f.mdo));
  protected readonly cpfError = computed(() => this.fieldError('cpf', this.f.cpf));
  protected readonly emailError = computed(() => this.fieldError('email', this.f.email));
  protected readonly funcaoError = computed(() => this.fieldError('funcaoId', this.f.funcaoId));
  protected readonly epcError = computed(() => this.fieldError('epcId', this.f.epcId));
  protected readonly empresaError = computed(() => this.fieldError('empresaId', this.f.empresaId));
  protected readonly gestaoError = computed(() => this.fieldError('gestaoId', this.f.gestaoId));

  constructor() {
    afterNextRender(() => {
      this.carregarListas();
      const id = this.id();
      if (id != null) this.carregar(id);
      else document.getElementById('cad-nome')?.focus();
    });
  }

  private lerId(): number | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private carregarListas(): void {
    this.funcaoService.opcoes().subscribe({
      next: (fs) => this.funcoes.set(fs),
      error: () =>
        this.toast.error('Funções indisponíveis', 'Não foi possível carregar a lista de funções.'),
    });
    this.epcService.opcoes().subscribe({
      next: (xs) => this.epcs.set(xs),
      error: () => this.toast.error('EPCs indisponíveis', 'Não foi possível carregar a lista de EPCs.'),
    });
    this.empresaService.opcoes().subscribe({
      next: (xs) => this.empresas.set(xs),
      error: () =>
        this.toast.error('Empresas indisponíveis', 'Não foi possível carregar a lista de empresas.'),
    });
    this.gestaoService.opcoes().subscribe({
      next: (xs) => this.gestoes.set(xs),
      error: () =>
        this.toast.error('Gestões indisponíveis', 'Não foi possível carregar a lista de gestões.'),
    });
  }

  private carregar(id: number): void {
    this.carregando.set(true);
    this.erroCarregar.set(null);
    this.service.obter(id).subscribe({
      next: (c) => {
        this.model.set({
          nome: c.nome,
          sexo: c.sexo,
          mdo: c.mdo,
          cpf: apenasDigitosCpf(c.cpf),
          email: c.email,
          funcaoId: c.funcao?.id ?? null,
          epcId: c.epc?.id ?? null,
          empresaId: c.empresa?.id ?? null,
          gestaoId: c.gestao?.id ?? null,
        });
        this.carregando.set(false);
        queueMicrotask(() => document.getElementById('cad-nome')?.focus());
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroCarregar.set(
          e.status === 404 ? 'Colaborador não encontrado.' : this.mensagemErro(e),
        );
      },
    });
  }

  private fieldError(campo: string, field: { (): { touched(): boolean; errors(): { message?: string }[] } }): string | null {
    const server = this.serverErrors()[campo];
    if (server) return server;
    const st = field();
    return st.touched() ? (st.errors()[0]?.message ?? null) : null;
  }

  protected selectSexo(value: Sexo): void {
    this.model.update((m) => ({ ...m, sexo: value }));
    this.f.sexo().markAsTouched();
    this.clearServerError('sexo');
  }

  protected selectMdo(value: string): void {
    const v = value === '' ? null : (value as Mdo);
    this.model.update((m) => ({ ...m, mdo: v }));
    this.f.mdo().markAsTouched();
    this.clearServerError('mdo');
  }

  protected onCpfInput(raw: string): void {
    const dig = apenasDigitosCpf(raw);
    this.model.update((m) => ({ ...m, cpf: dig }));
    this.f.cpf().markAsTouched();
    this.clearServerError('cpf');
  }

  protected selectFuncao(value: string): void {
    this.model.update((m) => ({ ...m, funcaoId: this.paraId(value) }));
    this.f.funcaoId().markAsTouched();
    this.clearServerError('funcaoId');
  }

  protected selectEpc(value: string): void {
    this.model.update((m) => ({ ...m, epcId: this.paraId(value) }));
    this.f.epcId().markAsTouched();
    this.clearServerError('epcId');
  }

  protected selectEmpresa(value: string): void {
    this.model.update((m) => ({ ...m, empresaId: this.paraId(value) }));
    this.f.empresaId().markAsTouched();
    this.clearServerError('empresaId');
  }

  protected selectGestao(value: string): void {
    this.model.update((m) => ({ ...m, gestaoId: this.paraId(value) }));
    this.f.gestaoId().markAsTouched();
    this.clearServerError('gestaoId');
  }

  private paraId(value: string): number | null {
    const n = value === '' ? null : Number(value);
    return n != null && Number.isFinite(n) ? n : null;
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
    this.f.nome().markAsTouched();
    this.f.sexo().markAsTouched();
    this.f.mdo().markAsTouched();
    this.f.cpf().markAsTouched();
    this.f.email().markAsTouched();
    this.f.funcaoId().markAsTouched();
    this.f.epcId().markAsTouched();
    this.f.empresaId().markAsTouched();
    this.f.gestaoId().markAsTouched();
    this.serverErrors.set({});

    if (!this.f().valid() || this.saving()) return;

    const value = this.model();
    const req: ColaboradorRequest = {
      nome: value.nome.trim(),
      sexo: value.sexo,
      mdo: value.mdo,
      cpf: value.cpf,
      email: value.email.trim(),
      funcaoId: value.funcaoId,
      epcId: value.epcId,
      empresaId: value.empresaId,
      gestaoId: value.gestaoId,
    };
    const id = this.id();
    this.saving.set(true);

    const op$ = id != null ? this.service.atualizar(id, req) : this.service.criar(req);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          id != null ? 'Colaborador atualizado' : 'Colaborador cadastrado',
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

  /** Volta para a lista preservando os filtros (usa o histórico quando possível). */
  protected voltar(): void {
    const navId = this.isBrowser
      ? ((history.state?.navigationId as number | undefined) ?? 1)
      : 1;
    if (navId > 1) this.location.back();
    else this.router.navigateByUrl('/colaboradores');
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
    this.toast.error(
      'Não foi possível salvar',
      body?.message ?? this.mensagemErro(err),
    );
  }

  private mensagemErro(e: HttpErrorResponse): string {
    if (e.status === 0) {
      return 'Sem conexão com o servidor. Verifique se a API está no ar (porta 8080).';
    }
    const body = e.error as ApiError | null;
    return body?.message ?? 'Ocorreu um erro inesperado ao falar com o servidor.';
  }
}
