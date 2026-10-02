import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  TemplateRef,
  afterNextRender,
  contentChild,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { PageResponse } from '../../../core/models/colaborador.model';

/** Função que carrega uma página do bloco (chamada a cada rolagem). */
export type CarregadorPagina<T> = (page: number, size: number) => Observable<PageResponse<T>>;

/** Contexto exposto ao template de linha: o item e o primeiro item carregado (maior valor). */
export interface PainelListaContexto<T> {
  $implicit: T;
  primeiro: T;
}

/**
 * Lista de altura fixa com carregamento incremental (scroll infinito): mostra uma página por
 * vez e, ao rolar até o fim da caixa, busca a próxima no backend via {@link CarregadorPagina}.
 * A linha é definida pelo consumidor através de um `<ng-template>` projetado.
 */
@Component({
  selector: 'app-painel-lista',
  imports: [NgTemplateOutlet],
  templateUrl: './painel-lista.html',
})
export class PainelLista<T> {
  /** Carrega uma página (page base-0, size itens). */
  readonly carregador = input.required<CarregadorPagina<T>>();
  /** Tamanho da página. */
  readonly tamanho = input(10);
  /** Mensagem quando não há nenhum item. */
  readonly vazio = input('Nada para exibir.');
  /** Mensagem quando a carga falha. */
  readonly erroMsg = input('Não foi possível carregar.');
  /** Rótulo acessível da região rolável. */
  readonly rotulo = input('');

  /**
   * Margem (px) de disparo do scroll: o observer carrega quando a sentinela entra nesta faixa
   * acima do fundo, e o auto-preenchimento carrega enquanto a folga de rolagem for menor que
   * ela. Usar a MESMA constante nos dois fecha a "zona morta" (conteúdo rolável por menos que
   * a margem não dispara o observer e também não some/volta ao rolar), que travaria em 10 itens.
   */
  private static readonly MARGEM_SCROLL_PX = 120;

  protected readonly itens = signal<T[]>([]);
  protected readonly carregandoInicial = signal(true);
  protected readonly carregando = signal(false);
  protected readonly erro = signal(false);
  protected readonly ultima = signal(false);

  private pagina = 0;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly linha = contentChild.required(TemplateRef);
  private readonly caixa = viewChild.required<ElementRef<HTMLElement>>('caixa');
  private readonly sentinela = viewChild.required<ElementRef<HTMLElement>>('sentinela');

  private observer?: IntersectionObserver;

  /** Permite ao Angular tipar o contexto do `<ng-template>` projetado. */
  static ngTemplateContextGuard<T>(
    _dir: PainelLista<T>,
    _ctx: unknown,
  ): _ctx is PainelListaContexto<T> {
    return true;
  }

  constructor() {
    afterNextRender(() => {
      this.carregar();
      const raiz = this.caixa().nativeElement;
      const alvo = this.sentinela().nativeElement;
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.carregar();
          }
        },
        { root: raiz, rootMargin: `${PainelLista.MARGEM_SCROLL_PX}px` },
      );
      this.observer.observe(alvo);
    });

    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  /** Carrega a próxima página (ignora se já está carregando ou se chegou ao fim). */
  protected carregar(): void {
    if (this.carregando() || this.ultima()) {
      return;
    }
    this.carregando.set(true);
    this.erro.set(false);

    this.carregador()(this.pagina, this.tamanho()).subscribe({
      next: (resp) => {
        this.itens.update((atual) => [...atual, ...resp.content]);
        this.ultima.set(resp.last);
        this.pagina += 1;
        this.carregandoInicial.set(false);
        this.carregando.set(false);
        this.preencherSeNecessario();
      },
      error: () => {
        this.erro.set(true);
        this.carregandoInicial.set(false);
        this.carregando.set(false);
      },
    });
  }

  /**
   * Se, após carregar uma página, a caixa não ficou rolável (conteúdo curto demais para
   * disparar o observer) e ainda há mais páginas, busca a próxima — evita "travar" nos 10
   * primeiros quando as linhas são baixas.
   */
  private preencherSeNecessario(): void {
    if (!this.isBrowser || this.ultima()) {
      return;
    }
    requestAnimationFrame(() => {
      if (this.carregando() || this.ultima()) {
        return;
      }
      const raiz = this.caixa().nativeElement;
      // Enquanto a folga de rolagem for menor que a margem de disparo do observer, a sentinela
      // fica "presa" na zona de disparo sem gerar novo callback — então puxamos a próxima página.
      if (raiz.scrollHeight - raiz.clientHeight <= PainelLista.MARGEM_SCROLL_PX) {
        this.carregar();
      }
    });
  }
}
