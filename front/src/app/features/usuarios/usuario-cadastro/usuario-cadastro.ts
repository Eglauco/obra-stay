import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Location, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/colaborador.model';

/** Tela de cadastro de usuário (nome, e-mail, senha + repetir). */
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
          <p class="text-[0.6875rem] font-semibold uppercase tracking-wider text-accent">Novo</p>
          <h2 class="font-display text-2xl font-semibold tracking-tight text-fg">Novo usuário</h2>
        </div>
      </div>

      <form class="form-card flex flex-col gap-5 rounded-card border bg-surface p-6 shadow-card sm:p-7"
        (submit)="$event.preventDefault(); salvar()" novalidate>
        <div class="flex flex-col gap-1.5">
          <label for="u-nome" class="text-sm font-medium text-fg">Nome <span class="text-danger">*</span></label>
          <input #nome id="u-nome" type="text" autocomplete="off" [value]="nomeS()" (input)="nomeS.set(nome.value); limpar('nome')"
            placeholder="Ex.: Maria Silva"
            class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
            [style.border-color]="nomeError() ? 'var(--color-danger)' : null" />
          @if (nomeError()) { <p class="text-[0.8125rem] text-danger">{{ nomeError() }}</p> }
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="u-email" class="text-sm font-medium text-fg">E-mail <span class="text-danger">*</span></label>
          <input #email id="u-email" type="email" autocomplete="off" [value]="emailS()" (input)="emailS.set(email.value); limpar('email')"
            placeholder="Ex.: maria@empresa.com"
            class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
            [style.border-color]="emailError() ? 'var(--color-danger)' : null" />
          @if (emailError()) { <p class="text-[0.8125rem] text-danger">{{ emailError() }}</p> }
        </div>

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

        <div class="mt-1 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <button type="button" (click)="voltar()" [disabled]="saving()"
            class="inline-flex h-11 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2">Cancelar</button>
          <button type="submit" [disabled]="saving()"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70">
            @if (saving()) {
              <svg viewBox="0 0 24 24" fill="none" class="size-4 animate-spin" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
            }
            Cadastrar
          </button>
        </div>
      </form>
    </section>
  `,
})
export class UsuarioCadastro {
  private readonly service = inject(UsuarioService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly nomeS = signal('');
  protected readonly emailS = signal('');
  protected readonly senhaS = signal('');
  protected readonly repetirS = signal('');
  protected readonly submetido = signal(false);
  protected readonly saving = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly nomeError = computed(
    () => this.serverErrors()['nome'] ?? (this.submetido() && !this.nomeS().trim() ? 'Informe o nome.' : null),
  );
  protected readonly emailError = computed(() => {
    if (this.serverErrors()['email']) return this.serverErrors()['email'];
    if (!this.submetido()) return null;
    const v = this.emailS().trim();
    if (!v) return 'Informe o e-mail.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return 'E-mail inválido.';
    return null;
  });
  protected readonly senhaError = computed(() => {
    if (this.serverErrors()['senha']) return this.serverErrors()['senha'];
    if (!this.submetido()) return null;
    if (!this.senhaS()) return 'Informe a senha.';
    if (this.senhaS().length < 8) return 'A senha deve ter ao menos 8 caracteres.';
    return null;
  });
  protected readonly repetirError = computed(() => {
    if (this.serverErrors()['repetirSenha']) return this.serverErrors()['repetirSenha'];
    if (!this.submetido()) return null;
    if (this.senhaS() && this.repetirS() !== this.senhaS()) return 'As senhas não conferem.';
    return null;
  });

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
    this.submetido.set(true);
    this.serverErrors.set({});
    const email = this.emailS().trim();
    if (
      !this.nomeS().trim() ||
      !email ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      this.senhaS().length < 8 ||
      this.repetirS() !== this.senhaS() ||
      this.saving()
    ) {
      return;
    }
    this.saving.set(true);
    this.service
      .criar({ nome: this.nomeS().trim(), email, senha: this.senhaS(), repetirSenha: this.repetirS() })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Usuário cadastrado', `${this.nomeS().trim()} foi adicionado com sucesso.`);
          this.voltar();
        },
        error: (e: HttpErrorResponse) => {
          this.saving.set(false);
          const body = e.error as ApiError | null;
          if (body?.fieldErrors?.length) {
            const map: Record<string, string> = {};
            for (const fe of body.fieldErrors) map[fe.field] = fe.message;
            this.serverErrors.set(map);
          } else {
            this.toast.error('Não foi possível cadastrar', body?.message ?? 'Tente novamente.');
          }
        },
      });
  }

  protected voltar(): void {
    const navId = this.isBrowser ? ((history.state?.navigationId as number | undefined) ?? 1) : 1;
    if (navId > 1) this.location.back();
    else this.router.navigateByUrl('/usuarios');
  }
}
