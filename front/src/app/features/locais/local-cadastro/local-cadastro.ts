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
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { LocalService } from '../../../core/services/local.service';
import { ViaCepService } from '../../../core/services/via-cep.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/colaborador.model';
import { LocalRequest } from '../../../core/models/local.model';

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
}

/** Tela dedicada de criar/editar local (padrão de CRUD: sempre em nova tela). */
@Component({
  selector: 'app-local-cadastro',
  imports: [FormField],
  templateUrl: './local-cadastro.html',
  styleUrl: './local-cadastro.css',
})
export class LocalCadastro {
  private readonly service = inject(LocalService);
  private readonly viaCep = inject(ViaCepService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);

  private readonly id = signal<number | null>(this.lerId());
  protected readonly editMode = computed(() => this.id() != null);

  protected readonly saving = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erroCarregar = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

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
  });

  protected readonly f = form(this.model, (p) => {
    required(p.codigo, { message: 'Informe o código.' });
    maxLength(p.codigo, 30, { message: 'Use no máximo 30 caracteres.' });
    required(p.nome, { message: 'Informe o nome.' });
    maxLength(p.nome, 120, { message: 'Use no máximo 120 caracteres.' });
    required(p.capacidade, { message: 'Informe a capacidade.' });
    required(p.logradouro, { message: 'Informe o logradouro.' });
    required(p.numero, { message: 'Informe o número.' });
    required(p.bairro, { message: 'Informe o bairro.' });
    // cidade e uf são preenchidos pelo ViaCEP (campos travados) e validados no submit.
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
  protected readonly fotoError = computed(() => this.serverErrors()['foto'] ?? this.fotoErro());

  constructor() {
    this.destroyRef.onDestroy(() => this.revogarObjectUrl());
    afterNextRender(() => {
      const id = this.id();
      if (id != null) this.carregar(id);
      else document.getElementById('loc-codigo')?.focus();
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
        });
        this.fotoPreview.set(l.fotoUrl ?? null);
        this.tinhaFoto.set(!!l.fotoUrl);
        this.fotoArquivo.set(null);
        this.removerFoto.set(false);
        this.carregando.set(false);
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
    this.f.codigo().markAsTouched();
    this.f.nome().markAsTouched();
    this.f.capacidade().markAsTouched();
    this.f.logradouro().markAsTouched();
    this.f.numero().markAsTouched();
    this.f.bairro().markAsTouched();
    this.serverErrors.set({});

    const cepDigitos = ViaCepService.digitos(this.model().cep);
    if (cepDigitos.length !== 8) {
      this.cepErro.set('Informe um CEP válido (8 dígitos).');
    } else if (!this.model().cidade.trim() || !this.model().uf.trim()) {
      this.cepErro.set('Consulte um CEP válido para preencher cidade e UF.');
    }

    if (!this.f().valid() || this.cepErro() || this.saving()) return;

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
