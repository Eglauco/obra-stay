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
import { EpcService } from '../../../core/services/epc.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/colaborador.model';
import { EpcRequest } from '../../../core/models/epc.model';

interface CadastroModel {
  nome: string;
}

const NOME_MAX = 120;

/** Tela dedicada de criar/editar EPC (padrão de CRUD: sempre em nova tela). */
@Component({
  selector: 'app-epc-cadastro',
  imports: [FormField],
  templateUrl: './epc-cadastro.html',
  styleUrl: './epc-cadastro.css',
})
export class EpcCadastro {
  private readonly service = inject(EpcService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly nomeMax = NOME_MAX;

  private readonly id = signal<number | null>(this.lerId());
  protected readonly editMode = computed(() => this.id() != null);

  protected readonly saving = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erroCarregar = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly model = signal<CadastroModel>({ nome: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.nome, { message: 'O nome é obrigatório.' });
    maxLength(p.nome, NOME_MAX, {
      message: `Use no máximo ${NOME_MAX} caracteres.`,
    });
  });

  protected readonly nomeCount = computed(() => this.model().nome.length);

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
      else document.getElementById('epc-nome')?.focus();
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
      next: (epc) => {
        this.model.set({ nome: epc.nome });
        this.carregando.set(false);
        queueMicrotask(() => document.getElementById('epc-nome')?.focus());
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroCarregar.set(
          e.status === 404 ? 'EPC não encontrado.' : this.mensagemErro(e),
        );
      },
    });
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
    this.serverErrors.set({});

    if (!this.f().valid() || this.saving()) return;

    const req: EpcRequest = { nome: this.model().nome.trim() };
    const id = this.id();
    this.saving.set(true);

    const op$ = id != null ? this.service.atualizar(id, req) : this.service.criar(req);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          id != null ? 'EPC atualizado' : 'EPC cadastrado',
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
    else this.router.navigateByUrl('/epcs');
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
