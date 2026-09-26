import { Component, computed, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/colaborador.model';

/** Modal de troca de senha do usuário logado (senha atual + nova + repetir). */
@Component({
  selector: 'app-trocar-senha-dialog',
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" (click)="cancelar()" aria-hidden="true"></div>

      <div
        class="relative w-full max-w-md rounded-card border bg-surface p-6 shadow-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ts-titulo"
      >
        <div class="flex items-start gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" class="size-5"><path d="M6 9V6.5a4 4 0 0 1 8 0V9M5 9h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </span>
          <div class="min-w-0 flex-1">
            <h3 id="ts-titulo" class="font-display text-lg font-semibold text-fg">Trocar senha</h3>
            <p class="mt-0.5 text-sm text-muted">Informe a senha atual e defina a nova.</p>
          </div>
        </div>

        <form class="mt-5 flex flex-col gap-4" (submit)="$event.preventDefault(); salvar()" novalidate>
          <div class="flex flex-col gap-1.5">
            <label for="ts-atual" class="text-sm font-medium text-fg">Senha atual</label>
            <input #atual id="ts-atual" type="password" autocomplete="current-password" [value]="senhaAtual()"
              (input)="senhaAtual.set(atual.value); limpar('senhaAtual')"
              class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors focus:border-accent"
              [style.border-color]="erroAtual() ? 'var(--color-danger)' : null" />
            @if (erroAtual()) { <p class="text-[0.8125rem] text-danger">{{ erroAtual() }}</p> }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="ts-nova" class="text-sm font-medium text-fg">Nova senha</label>
            <input #nova id="ts-nova" type="password" autocomplete="new-password" [value]="senhaNova()"
              (input)="senhaNova.set(nova.value); limpar('senhaNova')"
              placeholder="Ao menos 8 caracteres"
              class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
              [style.border-color]="erroNova() ? 'var(--color-danger)' : null" />
            @if (erroNova()) { <p class="text-[0.8125rem] text-danger">{{ erroNova() }}</p> }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="ts-repetir" class="text-sm font-medium text-fg">Repetir nova senha</label>
            <input #rep id="ts-repetir" type="password" autocomplete="new-password" [value]="repetir()"
              (input)="repetir.set(rep.value); limpar('repetirSenha')"
              class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors focus:border-accent"
              [style.border-color]="erroRepetir() ? 'var(--color-danger)' : null" />
            @if (erroRepetir()) { <p class="text-[0.8125rem] text-danger">{{ erroRepetir() }}</p> }
          </div>

          <div class="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" (click)="cancelar()" [disabled]="salvando()"
              class="inline-flex h-11 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2">
              Cancelar
            </button>
            <button type="submit" [disabled]="salvando()"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70">
              @if (salvando()) {
                <svg viewBox="0 0 24 24" fill="none" class="size-4 animate-spin" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
              }
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class TrocarSenhaDialog {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly fechar = output<void>();

  protected readonly senhaAtual = signal('');
  protected readonly senhaNova = signal('');
  protected readonly repetir = signal('');
  protected readonly salvando = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly submetido = signal(false);

  protected readonly erroAtual = computed(
    () => this.serverErrors()['senhaAtual'] ?? (this.submetido() && !this.senhaAtual() ? 'Informe a senha atual.' : null),
  );
  protected readonly erroNova = computed(() => {
    if (this.serverErrors()['senhaNova']) return this.serverErrors()['senhaNova'];
    if (!this.submetido()) return null;
    if (!this.senhaNova()) return 'Informe a nova senha.';
    if (this.senhaNova().length < 8) return 'A nova senha deve ter ao menos 8 caracteres.';
    return null;
  });
  protected readonly erroRepetir = computed(() => {
    if (this.serverErrors()['repetirSenha']) return this.serverErrors()['repetirSenha'];
    if (!this.submetido()) return null;
    if (this.senhaNova() && this.repetir() !== this.senhaNova()) return 'As senhas não conferem.';
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

  protected cancelar(): void {
    if (!this.salvando()) this.fechar.emit();
  }

  protected salvar(): void {
    this.submetido.set(true);
    this.serverErrors.set({});
    if (
      !this.senhaAtual() ||
      !this.senhaNova() ||
      this.senhaNova().length < 8 ||
      this.repetir() !== this.senhaNova() ||
      this.salvando()
    ) {
      return;
    }
    this.salvando.set(true);
    this.auth
      .trocarSenha({
        senhaAtual: this.senhaAtual(),
        senhaNova: this.senhaNova(),
        repetirSenha: this.repetir(),
      })
      .subscribe({
        next: () => {
          this.salvando.set(false);
          this.toast.success('Senha alterada', 'Sua senha foi atualizada com sucesso.');
          this.fechar.emit();
        },
        error: (e: HttpErrorResponse) => {
          this.salvando.set(false);
          const body = e.error as ApiError | null;
          if (body?.fieldErrors?.length) {
            const map: Record<string, string> = {};
            for (const fe of body.fieldErrors) map[fe.field] = fe.message;
            this.serverErrors.set(map);
          } else {
            this.toast.error('Não foi possível trocar a senha', body?.message ?? 'Tente novamente.');
          }
        },
      });
  }
}
