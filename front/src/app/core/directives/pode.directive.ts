import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Diretiva estrutural que renderiza o elemento apenas se o usuário tiver a permissão.
 * Uso: `<a *appPode="'colaboradores:CRIAR'" ...>`. É apenas UX — a autorização real fica no backend.
 * Reage a mudanças do usuário logado (ex.: após o /me atualizar as permissões).
 */
@Directive({
  selector: '[appPode]',
})
export class PodeDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  /** Chave no formato "tela:ACAO", ex.: "status-locais:EXCLUIR". */
  readonly appPode = input<string>('');

  private visivel = false;

  constructor() {
    effect(() => {
      const [tela, acao] = (this.appPode() ?? '').split(':');
      const permitido = !!tela && !!acao && this.auth.pode(tela, acao);
      if (permitido && !this.visivel) {
        this.vcr.createEmbeddedView(this.tpl);
        this.visivel = true;
      } else if (!permitido && this.visivel) {
        this.vcr.clear();
        this.visivel = false;
      }
    });
  }
}
