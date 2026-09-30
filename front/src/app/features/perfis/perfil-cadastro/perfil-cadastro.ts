import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { Location, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { PerfilService } from '../../../core/services/perfil.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/colaborador.model';
import { PerfilRequest, Permissao, TelaCatalogo } from '../../../core/models/perfil.model';

interface DadosPerfil {
  nome: string;
  descricao: string;
}

const NOME_MAX = 80;
const DESCRICAO_MAX = 240;

/** Tela dedicada de criar/editar Perfil (nome/descrição + matriz de permissões por tela/ação). */
@Component({
  selector: 'app-perfil-cadastro',
  imports: [FormField],
  template: `
    <section class="mx-auto flex max-w-3xl flex-col gap-6">
      <div class="flex items-center gap-3">
        <button type="button" (click)="voltar()" aria-label="Voltar para a lista"
          class="grid size-10 shrink-0 place-items-center rounded-control border text-muted transition-colors hover:bg-surface-2 hover:text-fg">
          <svg viewBox="0 0 20 20" fill="none" class="size-5" aria-hidden="true"><path d="M12 5l-5 5 5 5M7 10h9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
        <div>
          <p class="text-[0.6875rem] font-semibold uppercase tracking-wider text-accent">{{ somenteLeitura() ? 'Visualizar' : (editMode() ? (sistema() ? 'Detalhes' : 'Editar') : 'Novo') }}</p>
          <h2 class="font-display text-2xl font-semibold tracking-tight text-fg">{{ editMode() ? 'Perfil' : 'Novo perfil' }}</h2>
        </div>
      </div>

      @if (carregando()) {
        <div class="flex items-center justify-center gap-3 rounded-card border bg-surface p-10 text-sm text-muted shadow-card">
          <svg viewBox="0 0 24 24" fill="none" class="size-5 animate-spin text-accent" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
          Carregando perfil…
        </div>
      } @else if (erroCarregar()) {
        <div class="flex flex-col items-center gap-4 rounded-card border bg-surface p-10 text-center shadow-card">
          <p class="text-sm text-muted">{{ erroCarregar() }}</p>
          <button type="button" (click)="voltar()" class="inline-flex h-10 items-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2">Voltar para a lista</button>
        </div>
      } @else {
        <form class="flex flex-col gap-6" (submit)="$event.preventDefault(); submit()" novalidate>
          @if (sistema()) {
            <div class="flex items-start gap-2 rounded-card border bg-surface p-4 text-sm text-muted shadow-card">
              <svg viewBox="0 0 20 20" fill="none" class="mt-0.5 size-4.5 shrink-0 text-accent" aria-hidden="true"><path d="M10 2.5 4 5v4.5c0 3.6 2.5 5.9 6 7 3.5-1.1 6-3.4 6-7V5l-6-2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" /></svg>
              <span>Perfil do sistema: não pode ser editado nem excluído. Exibido apenas para consulta.</span>
            </div>
          } @else if (somenteLeitura()) {
            <div class="flex items-start gap-2 rounded-card border bg-surface p-4 text-sm text-muted shadow-card">
              <svg viewBox="0 0 20 20" fill="none" class="mt-0.5 size-4.5 shrink-0 text-accent" aria-hidden="true"><path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10Z" stroke="currentColor" stroke-width="1.5" /><circle cx="10" cy="10" r="2.25" stroke="currentColor" stroke-width="1.5" /></svg>
              <span>Somente leitura: você pode visualizar e copiar os dados, mas não alterar.</span>
            </div>
          }

          <!-- Dados do perfil -->
          <fieldset class="form-card flex flex-col gap-5 rounded-card border bg-surface p-6 shadow-card sm:p-7" [disabled]="bloqueado()">
            <legend class="text-[0.6875rem] font-semibold uppercase tracking-wider text-faint">Perfil</legend>
            <div class="flex flex-col gap-1.5">
              <div class="flex items-baseline justify-between">
                <label for="perfil-nome" class="text-sm font-medium text-fg">Nome <span class="text-danger" aria-hidden="true">*</span></label>
                <span class="tabular text-[0.75rem] text-faint">{{ nomeCount() }}/{{ nomeMax }}</span>
              </div>
              <input id="perfil-nome" type="text" [formField]="f.nome" (input)="clearServerError('nome')"
                autocomplete="off" placeholder="Ex.: Gestor de obra"
                class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent disabled:opacity-60"
                [style.border-color]="nomeError() ? 'var(--color-danger)' : null"
                [attr.aria-invalid]="nomeError() ? 'true' : null"
                [attr.aria-describedby]="nomeError() ? 'perfil-nome-error' : null" />
              @if (nomeError()) { <p id="perfil-nome-error" class="text-[0.8125rem] text-danger">{{ nomeError() }}</p> }
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="perfil-desc" class="text-sm font-medium text-fg">Descrição</label>
              <textarea id="perfil-desc" rows="2" [formField]="f.descricao" (input)="clearServerError('descricao')"
                placeholder="Opcional"
                class="w-full resize-y rounded-control border bg-canvas px-3.5 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent disabled:opacity-60"
                [style.border-color]="descricaoError() ? 'var(--color-danger)' : null"
                [attr.aria-invalid]="descricaoError() ? 'true' : null"></textarea>
              @if (descricaoError()) { <p class="text-[0.8125rem] text-danger">{{ descricaoError() }}</p> }
            </div>
          </fieldset>

          <!-- Permissões -->
          <fieldset class="form-card flex flex-col gap-4 rounded-card border bg-surface p-6 shadow-card sm:p-7">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <legend class="text-[0.6875rem] font-semibold uppercase tracking-wider text-faint">Permissões</legend>
              @if (!acessoTotal()) {
                <span class="tabular text-[0.75rem] text-muted">{{ totalSelecionadas() }} selecionada(s)</span>
              }
            </div>

            @if (acessoTotal()) {
              <div class="flex items-center gap-2 rounded-control border bg-accent-soft/40 px-4 py-3 text-sm text-fg">
                <svg viewBox="0 0 20 20" fill="none" class="size-4.5 shrink-0 text-accent" aria-hidden="true"><path d="m5 10.5 3.5 3.5 7-7.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" /></svg>
                Acesso total a todas as telas e ações.
              </div>
            } @else {
              <p class="text-[0.8125rem] text-muted">
                Marque uma tela para liberá-la e escolha as ações. Marcar qualquer ação libera automaticamente <strong class="text-fg">Ver</strong>.
              </p>

              <div class="flex flex-col gap-3">
                @for (t of catalogo(); track t.tela) {
                  <div class="rounded-control border bg-canvas p-3.5">
                    <label class="flex items-center gap-2 text-sm font-medium text-fg">
                      <input type="checkbox" [checked]="linhaToda(t.tela)" (change)="toggleLinha(t.tela)" [disabled]="bloqueado()"
                        class="size-4 rounded border-border-strong text-accent focus-visible:ring-2 focus-visible:ring-accent"
                        [attr.aria-label]="'Marcar todas as ações de ' + t.rotulo" />
                      {{ t.rotulo }}
                    </label>
                    <div class="mt-2.5 flex flex-wrap gap-x-5 gap-y-2 pl-6">
                      @for (a of t.acoes; track a.acao) {
                        <label class="flex items-center gap-1.5 text-[0.8125rem] text-muted">
                          <input type="checkbox" [checked]="marcada(t.tela, a.acao)" (change)="toggle(t.tela, a.acao)" [disabled]="bloqueado()"
                            class="size-4 rounded border-border-strong text-accent focus-visible:ring-2 focus-visible:ring-accent"
                            [attr.aria-label]="a.rotulo + ' — ' + t.rotulo" />
                          {{ a.rotulo }}
                        </label>
                      }
                    </div>
                  </div>
                }
              </div>

              @if (matrizError()) { <p class="text-[0.8125rem] text-danger">{{ matrizError() }}</p> }
            }
          </fieldset>

          @if (!bloqueado()) {
            <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" (click)="voltar()" [disabled]="saving()"
                class="inline-flex h-11 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2">Cancelar</button>
              <button type="submit" [disabled]="saving()"
                class="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70">
                @if (saving()) { <svg viewBox="0 0 24 24" fill="none" class="size-4 animate-spin" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg> }
                {{ editMode() ? 'Salvar alterações' : 'Cadastrar' }}
              </button>
            </div>
          } @else {
            <div class="flex justify-end">
              <button type="button" (click)="voltar()"
                class="inline-flex h-11 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2">Voltar</button>
            </div>
          }
        </form>
      }
    </section>
  `,
})
export class PerfilCadastro {
  private readonly service = inject(PerfilService);
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
  protected readonly submetido = signal(false);

  protected readonly sistema = signal(false);
  protected readonly acessoTotal = signal(false);
  protected readonly somenteLeitura = signal(this.route.snapshot.data['modo'] === 'visualizar');
  protected readonly bloqueado = computed(() => this.sistema() || this.somenteLeitura());

  protected readonly catalogo = signal<TelaCatalogo[]>([]);
  /** Permissões selecionadas: chave da tela -> conjunto de ações (nomes). */
  protected readonly matriz = signal<Record<string, Set<string>>>({});

  protected readonly dados = signal<DadosPerfil>({ nome: '', descricao: '' });
  protected readonly f = form(this.dados, (p) => {
    required(p.nome, { message: 'O nome é obrigatório.' });
    maxLength(p.nome, NOME_MAX, { message: `Use no máximo ${NOME_MAX} caracteres.` });
    maxLength(p.descricao, DESCRICAO_MAX, { message: `Use no máximo ${DESCRICAO_MAX} caracteres.` });
  });

  protected readonly nomeCount = computed(() => this.dados().nome.length);

  protected readonly nomeError = computed(() => {
    const server = this.serverErrors()['nome'];
    if (server) return server;
    const st = this.f.nome();
    return st.touched() ? (st.errors()[0]?.message ?? null) : null;
  });
  protected readonly descricaoError = computed(() => {
    const server = this.serverErrors()['descricao'];
    if (server) return server;
    const st = this.f.descricao();
    return st.touched() ? (st.errors()[0]?.message ?? null) : null;
  });

  protected readonly totalSelecionadas = computed(() =>
    Object.values(this.matriz()).reduce((acc, set) => acc + set.size, 0),
  );
  protected readonly matrizError = computed(
    () =>
      this.serverErrors()['permissoes'] ??
      (this.submetido() && this.totalSelecionadas() === 0
        ? 'Selecione ao menos uma permissão.'
        : null),
  );

  constructor() {
    afterNextRender(() => this.iniciar());
  }

  private iniciar(): void {
    this.carregando.set(true);
    this.erroCarregar.set(null);
    this.service.catalogo().subscribe({
      next: (cat) => {
        this.catalogo.set(cat);
        this.matriz.set(this.matrizVazia(cat));
        const id = this.id();
        if (id != null) {
          this.carregarPerfil(id);
        } else {
          this.carregando.set(false);
          document.getElementById('perfil-nome')?.focus();
        }
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroCarregar.set(this.mensagemErro(e));
      },
    });
  }

  private carregarPerfil(id: number): void {
    this.service.obter(id).subscribe({
      next: (p) => {
        this.dados.set({ nome: p.nome, descricao: p.descricao ?? '' });
        this.sistema.set(p.sistema);
        this.acessoTotal.set(p.acessoTotal);
        const m = this.matrizVazia(this.catalogo());
        for (const perm of p.permissoes) {
          (m[perm.tela] ??= new Set<string>()).add(perm.acao);
        }
        this.matriz.set(m);
        this.carregando.set(false);
        queueMicrotask(() => document.getElementById('perfil-nome')?.focus());
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroCarregar.set(e.status === 404 ? 'Perfil não encontrado.' : this.mensagemErro(e));
      },
    });
  }

  private matrizVazia(cat: TelaCatalogo[]): Record<string, Set<string>> {
    const m: Record<string, Set<string>> = {};
    for (const t of cat) m[t.tela] = new Set<string>();
    return m;
  }

  private acoesDaTela(tela: string): string[] {
    return this.catalogo().find((t) => t.tela === tela)?.acoes.map((a) => a.acao) ?? [];
  }

  protected marcada(tela: string, acao: string): boolean {
    return this.matriz()[tela]?.has(acao) ?? false;
  }

  protected toggle(tela: string, acao: string): void {
    if (this.bloqueado()) return;
    this.matriz.update((m) => {
      const next = { ...m };
      const set = new Set(next[tela] ?? []);
      if (set.has(acao)) {
        set.delete(acao);
        if (acao === 'VER') set.clear(); // remover "Ver" fecha a tela inteira
      } else {
        set.add(acao);
        set.add('VER'); // qualquer ação implica poder ver a tela
      }
      next[tela] = set;
      return next;
    });
    this.clearServerError('permissoes');
  }

  protected linhaToda(tela: string): boolean {
    const acoes = this.acoesDaTela(tela);
    return acoes.length > 0 && acoes.every((a) => this.marcada(tela, a));
  }

  protected toggleLinha(tela: string): void {
    if (this.bloqueado()) return;
    const marcarTudo = !this.linhaToda(tela);
    this.matriz.update((m) => ({
      ...m,
      [tela]: marcarTudo ? new Set(this.acoesDaTela(tela)) : new Set<string>(),
    }));
    this.clearServerError('permissoes');
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
    if (this.bloqueado() || this.saving()) return;
    this.f.nome().markAsTouched();
    this.f.descricao().markAsTouched();
    this.submetido.set(true);
    this.serverErrors.set({});

    if (!this.f().valid() || this.totalSelecionadas() === 0) return;

    const permissoes: Permissao[] = [];
    for (const [tela, set] of Object.entries(this.matriz())) {
      for (const acao of set) permissoes.push({ tela, acao });
    }

    const req: PerfilRequest = {
      nome: this.dados().nome.trim(),
      descricao: this.dados().descricao.trim() || null,
      permissoes,
    };

    const id = this.id();
    this.saving.set(true);
    const op$ = id != null ? this.service.atualizar(id, req) : this.service.criar(req);
    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(id != null ? 'Perfil atualizado' : 'Perfil cadastrado', `${req.nome} foi salvo com sucesso.`);
        this.voltar();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.handleError(e);
      },
    });
  }

  protected voltar(): void {
    const navId = this.isBrowser ? ((history.state?.navigationId as number | undefined) ?? 1) : 1;
    if (navId > 1) this.location.back();
    else this.router.navigateByUrl('/perfis');
  }

  private lerId(): number | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private handleError(err: HttpErrorResponse): void {
    const body = err.error as ApiError | null;
    if (body?.fieldErrors?.length) {
      const map: Record<string, string> = {};
      for (const fe of body.fieldErrors) {
        const campo = fe.field.startsWith('permissoes') ? 'permissoes' : fe.field;
        map[campo] = map[campo] ?? fe.message;
      }
      this.serverErrors.set(map);
      this.toast.error('Não foi possível salvar', body?.message ?? 'Verifique os campos destacados.');
      return;
    }
    this.toast.error('Não foi possível salvar', body?.message ?? this.mensagemErro(err));
  }

  private mensagemErro(e: HttpErrorResponse): string {
    if (e.status === 0) return 'Sem conexão com o servidor. Verifique se a API está no ar (porta 8080).';
    const body = e.error as ApiError | null;
    return body?.message ?? 'Ocorreu um erro inesperado ao falar com o servidor.';
  }
}
