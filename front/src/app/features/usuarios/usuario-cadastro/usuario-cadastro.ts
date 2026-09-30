import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { Location, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../../core/services/usuario.service';
import { PerfilService } from '../../../core/services/perfil.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/colaborador.model';
import { PerfilOpcao } from '../../../core/models/perfil.model';
import { formatarDataHora } from '../../../core/util/format';

/** Tela de cadastro/edição de usuário. No cadastro: nome, e-mail, senha e perfil. Na edição: nome e perfil. */
@Component({
  selector: 'app-usuario-cadastro',
  template: `
    <section class="mx-auto flex max-w-xl flex-col gap-6">
      <div class="flex items-center gap-3">
        <button type="button" (click)="voltar()" aria-label="Voltar"
          class="grid size-10 shrink-0 place-items-center rounded-control border text-muted transition-colors hover:bg-surface-2 hover:text-fg">
          <svg viewBox="0 0 20 20" fill="none" class="size-5" aria-hidden="true"><path d="M12 5l-5 5 5 5M7 10h9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
        <div>
          <p class="text-[0.6875rem] font-semibold uppercase tracking-wider text-accent">{{ somenteLeitura() ? 'Visualizar' : (editMode() ? 'Editar' : 'Novo') }}</p>
          <h2 class="font-display text-2xl font-semibold tracking-tight text-fg">{{ somenteLeitura() ? 'Visualizar usuário' : (editMode() ? 'Editar usuário' : 'Novo usuário') }}</h2>
        </div>
      </div>

      @if (carregando()) {
        <div class="flex items-center justify-center gap-3 rounded-card border bg-surface p-10 text-sm text-muted shadow-card">
          <svg viewBox="0 0 24 24" fill="none" class="size-5 animate-spin text-accent" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
          Carregando usuário…
        </div>
      } @else if (erroCarregar()) {
        <div class="flex flex-col items-center gap-4 rounded-card border bg-surface p-10 text-center shadow-card">
          <p class="text-sm text-muted">{{ erroCarregar() }}</p>
          <button type="button" (click)="voltar()" class="inline-flex h-10 items-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2">Voltar para a lista</button>
        </div>
      } @else {
        <form class="form-card flex flex-col gap-5 rounded-card border bg-surface p-6 shadow-card sm:p-7"
          (submit)="$event.preventDefault(); salvar()" novalidate>
          <div class="flex flex-col gap-1.5">
            <label for="u-nome" class="text-sm font-medium text-fg">Nome <span class="text-danger">*</span></label>
            <input #nome id="u-nome" type="text" autocomplete="off" [value]="nomeS()" (input)="nomeS.set(nome.value); limpar('nome')"
              placeholder="Ex.: Maria Silva" [attr.readonly]="somenteLeitura() ? '' : null"
              class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent read-only:opacity-70"
              [style.border-color]="nomeError() ? 'var(--color-danger)' : null" />
            @if (nomeError()) { <p class="text-[0.8125rem] text-danger">{{ nomeError() }}</p> }
          </div>

          @if (!editMode() || somenteLeitura()) {
            <div class="flex flex-col gap-1.5">
              <label for="u-email" class="text-sm font-medium text-fg">E-mail <span class="text-danger">*</span></label>
              <input #email id="u-email" type="email" autocomplete="off" [value]="emailS()" (input)="emailS.set(email.value); limpar('email')"
                placeholder="Ex.: maria@empresa.com" [attr.readonly]="somenteLeitura() ? '' : null"
                class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent read-only:opacity-70"
                [style.border-color]="emailError() ? 'var(--color-danger)' : null" />
              @if (emailError()) { <p class="text-[0.8125rem] text-danger">{{ emailError() }}</p> }
            </div>
          }

          <div class="flex flex-col gap-1.5">
            <label for="u-perfil" class="text-sm font-medium text-fg">Perfil <span class="text-danger">*</span></label>
            <select #perfil id="u-perfil" [value]="perfilId() ?? ''" (change)="onPerfil(perfil.value)"
              [attr.disabled]="somenteLeitura() ? '' : null"
              class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors focus:border-accent disabled:opacity-70"
              [style.border-color]="perfilError() ? 'var(--color-danger)' : null"
              [attr.aria-invalid]="perfilError() ? 'true' : null">
              <option value="" disabled>Selecione um perfil…</option>
              @for (p of perfis(); track p.id) {
                <option [value]="p.id">{{ p.nome }}</option>
              }
            </select>
            @if (perfilError()) { <p class="text-[0.8125rem] text-danger">{{ perfilError() }}</p> }
          </div>

          @if (editMode()) {
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-fg">Último login</label>
              <div class="tabular flex h-11 items-center rounded-control border border-dashed border-border-strong bg-surface-2/40 px-3.5 text-sm text-muted">
                {{ ultimoLogin() ? fmtData(ultimoLogin()) : 'Nunca acessou' }}
              </div>
              <p class="text-[0.75rem] text-faint">Registro de auditoria (somente leitura).</p>
            </div>
          }

          @if (!editMode()) {
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <label for="u-senha" class="text-sm font-medium text-fg">Senha <span class="text-danger">*</span></label>
                <input #senha id="u-senha" type="password" autocomplete="new-password" [value]="senhaS()" (input)="senhaS.set(senha.value); limpar('senha')"
                  placeholder="Ao menos 8 caracteres"
                  class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
                  [style.border-color]="senhaError() ? 'var(--color-danger)' : null" />
                @if (senhaError()) { <p class="text-[0.8125rem] text-danger">{{ senhaError() }}</p> }
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="u-repetir" class="text-sm font-medium text-fg">Repetir senha <span class="text-danger">*</span></label>
                <input #rep id="u-repetir" type="password" autocomplete="new-password" [value]="repetirS()" (input)="repetirS.set(rep.value); limpar('repetirSenha')"
                  class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors focus:border-accent"
                  [style.border-color]="repetirError() ? 'var(--color-danger)' : null" />
                @if (repetirError()) { <p class="text-[0.8125rem] text-danger">{{ repetirError() }}</p> }
              </div>
            </div>
          }

          <div class="mt-1 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
            @if (somenteLeitura()) {
              <button type="button" (click)="voltar()"
                class="inline-flex h-11 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2">Voltar</button>
            } @else {
              <button type="button" (click)="voltar()" [disabled]="saving()"
                class="inline-flex h-11 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2">Cancelar</button>
              <button type="submit" [disabled]="saving()"
                class="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70">
                @if (saving()) {
                  <svg viewBox="0 0 24 24" fill="none" class="size-4 animate-spin" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
                }
                {{ editMode() ? 'Salvar alterações' : 'Cadastrar' }}
              </button>
            }
          </div>
        </form>
      }
    </section>
  `,
})
export class UsuarioCadastro {
  private readonly service = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly id = signal<number | null>(this.lerId());
  protected readonly editMode = computed(() => this.id() != null);
  protected readonly somenteLeitura = signal(this.route.snapshot.data['modo'] === 'visualizar');

  protected readonly perfis = signal<PerfilOpcao[]>([]);
  protected readonly perfilId = signal<number | null>(null);
  protected readonly ultimoLogin = signal<string | null>(null);
  protected readonly fmtData = formatarDataHora;

  protected readonly nomeS = signal('');
  protected readonly emailS = signal('');
  protected readonly senhaS = signal('');
  protected readonly repetirS = signal('');
  protected readonly submetido = signal(false);
  protected readonly saving = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erroCarregar = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly nomeError = computed(
    () => this.serverErrors()['nome'] ?? (this.submetido() && !this.nomeS().trim() ? 'Informe o nome.' : null),
  );
  protected readonly emailError = computed(() => {
    if (this.serverErrors()['email']) return this.serverErrors()['email'];
    if (!this.submetido() || this.editMode()) return null;
    const v = this.emailS().trim();
    if (!v) return 'Informe o e-mail.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return 'E-mail inválido.';
    return null;
  });
  protected readonly perfilError = computed(
    () => this.serverErrors()['perfilId'] ?? (this.submetido() && this.perfilId() == null ? 'Selecione um perfil.' : null),
  );
  protected readonly senhaError = computed(() => {
    if (this.serverErrors()['senha']) return this.serverErrors()['senha'];
    if (!this.submetido() || this.editMode()) return null;
    if (!this.senhaS()) return 'Informe a senha.';
    if (this.senhaS().length < 8) return 'A senha deve ter ao menos 8 caracteres.';
    return null;
  });
  protected readonly repetirError = computed(() => {
    if (this.serverErrors()['repetirSenha']) return this.serverErrors()['repetirSenha'];
    if (!this.submetido() || this.editMode()) return null;
    if (this.senhaS() && this.repetirS() !== this.senhaS()) return 'As senhas não conferem.';
    return null;
  });

  constructor() {
    afterNextRender(() => this.iniciar());
  }

  private iniciar(): void {
    this.carregando.set(true);
    this.erroCarregar.set(null);
    this.perfilService.opcoes().subscribe({
      next: (ops) => {
        this.perfis.set(ops);
        const id = this.id();
        if (id != null) {
          this.carregarUsuario(id);
        } else {
          this.carregando.set(false);
          document.getElementById('u-nome')?.focus();
        }
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroCarregar.set(this.mensagemErro(e));
      },
    });
  }

  private carregarUsuario(id: number): void {
    this.service.obter(id).subscribe({
      next: (u) => {
        this.nomeS.set(u.nome);
        this.emailS.set(u.email);
        this.perfilId.set(u.perfilId ?? null);
        this.ultimoLogin.set(u.ultimoLogin ?? null);
        this.carregando.set(false);
        queueMicrotask(() => document.getElementById('u-nome')?.focus());
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroCarregar.set(e.status === 404 ? 'Usuário não encontrado.' : this.mensagemErro(e));
      },
    });
  }

  protected onPerfil(valor: string): void {
    this.perfilId.set(valor ? Number(valor) : null);
    this.limpar('perfilId');
  }

  protected limpar(campo: string): void {
    if (this.serverErrors()[campo]) {
      this.serverErrors.update((e) => {
        const next = { ...e };
        delete next[campo];
        return next;
      });
    }
  }

  protected salvar(): void {
    if (this.somenteLeitura()) return;
    this.submetido.set(true);
    this.serverErrors.set({});
    const perfilId = this.perfilId();

    if (!this.nomeS().trim() || perfilId == null || this.saving()) {
      return;
    }

    if (this.editMode()) {
      const id = this.id()!;
      this.saving.set(true);
      this.service.atualizar(id, { nome: this.nomeS().trim(), perfilId }).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Usuário atualizado', `${this.nomeS().trim()} foi atualizado com sucesso.`);
          this.voltar();
        },
        error: (e: HttpErrorResponse) => this.aoErro(e),
      });
      return;
    }

    const email = this.emailS().trim();
    if (
      !email ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      this.senhaS().length < 8 ||
      this.repetirS() !== this.senhaS()
    ) {
      return;
    }
    this.saving.set(true);
    this.service
      .criar({ nome: this.nomeS().trim(), email, senha: this.senhaS(), repetirSenha: this.repetirS(), perfilId })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Usuário cadastrado', `${this.nomeS().trim()} foi adicionado com sucesso.`);
          this.voltar();
        },
        error: (e: HttpErrorResponse) => this.aoErro(e),
      });
  }

  private aoErro(e: HttpErrorResponse): void {
    this.saving.set(false);
    const body = e.error as ApiError | null;
    if (body?.fieldErrors?.length) {
      const map: Record<string, string> = {};
      for (const fe of body.fieldErrors) map[fe.field] = fe.message;
      this.serverErrors.set(map);
    } else {
      this.toast.error('Não foi possível salvar', body?.message ?? 'Tente novamente.');
    }
  }

  protected voltar(): void {
    const navId = this.isBrowser ? ((history.state?.navigationId as number | undefined) ?? 1) : 1;
    if (navId > 1) this.location.back();
    else this.router.navigateByUrl('/usuarios');
  }

  private lerId(): number | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private mensagemErro(e: HttpErrorResponse): string {
    if (e.status === 0) return 'Sem conexão com o servidor. Verifique se a API está no ar (porta 8080).';
    const body = e.error as ApiError | null;
    return body?.message ?? 'Ocorreu um erro inesperado ao falar com o servidor.';
  }
}
