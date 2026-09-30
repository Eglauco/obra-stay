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
import { FormField, form, maxLength, readonly, required } from '@angular/forms/signals';
import { StatusLocalService } from '../../../core/services/status-local.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/colaborador.model';
import { StatusLocalRequest } from '../../../core/models/status-local.model';

interface CadastroModel {
  nome: string;
  hospedagemLiberada: boolean;
}

const NOME_MAX = 80;

/** Tela dedicada de criar/editar Status do Local (padrão de CRUD: sempre em nova tela). */
@Component({
  selector: 'app-status-local-cadastro',
  imports: [FormField],
  templateUrl: './status-local-cadastro.html',
  styleUrl: './status-local-cadastro.css',
})
export class StatusLocalCadastro {
  private readonly service = inject(StatusLocalService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly nomeMax = NOME_MAX;

  private readonly id = signal<number | null>(this.lerId());
  protected readonly editMode = computed(() => this.id() != null);
  protected readonly somenteLeitura = signal(this.route.snapshot.data['modo'] === 'visualizar');

  protected readonly saving = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erroCarregar = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly model = signal<CadastroModel>({ nome: '', hospedagemLiberada: false });
  protected readonly f = form(this.model, (p) => {
    required(p.nome, { message: 'O nome é obrigatório.' });
    readonly(p.nome, { when: () => this.somenteLeitura() });
    maxLength(p.nome, NOME_MAX, {
      message: `Use no máximo ${NOME_MAX} caracteres.`,
    });
  });

  protected readonly nomeCount = computed(() => this.model().nome.length);
  protected readonly hospedagemLiberada = computed(() => this.model().hospedagemLiberada);

  protected readonly nomeError = computed(() => {
    const server = this.serverErrors()['nome'];
    if (server) return server;
    const st = this.f.nome();
    return st.touched() ? (st.errors()[0]?.message ?? null) : null;
  });

  constructor() {
    afterNextRender(() => {
      const id = this.id();
      if (id != null) this.carregar(id);
      else document.getElementById('status-nome')?.focus();
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
      next: (status) => {
        this.model.set({ nome: status.nome, hospedagemLiberada: status.hospedagemLiberada });
        this.carregando.set(false);
        queueMicrotask(() => document.getElementById('status-nome')?.focus());
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroCarregar.set(
          e.status === 404 ? 'Status não encontrado.' : this.mensagemErro(e),
        );
      },
    });
  }

  protected toggleHospedagem(): void {
    this.model.update((m) => ({ ...m, hospedagemLiberada: !m.hospedagemLiberada }));
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
    this.f.nome().markAsTouched();
    this.serverErrors.set({});

    if (!this.f().valid() || this.saving()) return;

    const req: StatusLocalRequest = {
      nome: this.model().nome.trim(),
      hospedagemLiberada: this.model().hospedagemLiberada,
    };
    const id = this.id();
    this.saving.set(true);

    const op$ = id != null ? this.service.atualizar(id, req) : this.service.criar(req);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          id != null ? 'Status atualizado' : 'Status cadastrado',
          `${req.nome} foi ${id != null ? 'atualizado' : 'cadastrado'} com sucesso.`,
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
    else this.router.navigateByUrl('/status-locais');
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
