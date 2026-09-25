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
import { ColaboradorService } from '../../../core/services/colaborador.service';
import { FuncaoService } from '../../../core/services/funcao.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ApiError,
  ColaboradorRequest,
  Funcao,
  Sexo,
} from '../../../core/models/colaborador.model';

interface CadastroModel {
  nome: string;
  sexo: Sexo | null;
  funcaoId: number | null;
}

const NOME_MAX = 120;

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
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly nomeMax = NOME_MAX;
  protected readonly sexoOpcoes: { value: Sexo; label: string }[] = [
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'FEMININO', label: 'Feminino' },
  ];
  protected readonly funcoes = signal<Funcao[]>([]);

  private readonly id = signal<number | null>(this.lerId());
  protected readonly editMode = computed(() => this.id() != null);

  protected readonly saving = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erroCarregar = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly model = signal<CadastroModel>({ nome: '', sexo: null, funcaoId: null });
  protected readonly f = form(this.model, (p) => {
    required(p.nome, { message: 'O nome é obrigatório.' });
    maxLength(p.nome, NOME_MAX, {
      message: `Use no máximo ${NOME_MAX} caracteres.`,
    });
    required(p.sexo, { message: 'Selecione o sexo.' });
    required(p.funcaoId, { message: 'Selecione a função.' });
  });

  protected readonly nomeCount = computed(() => this.model().nome.length);

  protected readonly nomeError = computed(() => {
    const server = this.serverErrors()['nome'];
    if (server) return server;
    const st = this.f.nome();
    return st.touched() ? (st.errors()[0]?.message ?? null) : null;
  });

  protected readonly sexoError = computed(() => {
    const server = this.serverErrors()['sexo'];
    if (server) return server;
    const st = this.f.sexo();
    return st.touched() ? (st.errors()[0]?.message ?? null) : null;
  });

  protected readonly funcaoError = computed(() => {
    const server = this.serverErrors()['funcaoId'];
    if (server) return server;
    const st = this.f.funcaoId();
    return st.touched() ? (st.errors()[0]?.message ?? null) : null;
  });

  constructor() {
    afterNextRender(() => {
      this.carregarFuncoes();
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

  private carregarFuncoes(): void {
    this.funcaoService.opcoes().subscribe({
      next: (fs) => this.funcoes.set(fs),
      error: () =>
        this.toast.error('Funções indisponíveis', 'Não foi possível carregar a lista de funções.'),
    });
  }

  private carregar(id: number): void {
    this.carregando.set(true);
    this.erroCarregar.set(null);
    this.service.obter(id).subscribe({
      next: (c) => {
        this.model.set({ nome: c.nome, sexo: c.sexo, funcaoId: c.funcao?.id ?? null });
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

  protected selectSexo(value: Sexo): void {
    this.model.update((m) => ({ ...m, sexo: value }));
    this.f.sexo().markAsTouched();
    this.clearServerError('sexo');
  }

  protected selectFuncao(value: string): void {
    const n = value === '' ? null : Number(value);
    this.model.update((m) => ({ ...m, funcaoId: Number.isFinite(n as number) ? n : null }));
    this.f.funcaoId().markAsTouched();
    this.clearServerError('funcaoId');
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
    this.f.funcaoId().markAsTouched();
    this.serverErrors.set({});

    if (!this.f().valid() || this.saving()) return;

    const value = this.model();
    const req: ColaboradorRequest = {
      nome: value.nome.trim(),
      sexo: value.sexo,
      funcaoId: value.funcaoId,
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
