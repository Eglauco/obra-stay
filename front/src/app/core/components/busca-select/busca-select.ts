import {
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, of } from 'rxjs';
import { catchError, debounceTime, switchMap, tap } from 'rxjs/operators';

/** Item genérico exibido/selecionado no autocomplete. */
export interface BuscaOpcao {
  id: number;
  nome: string;
}

/**
 * Autocomplete reutilizável com **busca no backend enquanto digita**.
 *
 * O consumidor injeta a função `buscar` (que faz a chamada paginada no back e
 * devolve os itens) e recebe a seleção via `selecionadoChange`. SSR-safe: só
 * consulta o back mediante interação do usuário. Combina com o padrão de
 * signals do projeto e o design system (tokens Tailwind, claro/escuro).
 */
@Component({
  selector: 'app-busca-select',
  host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-1.5">
      <label [for]="idBase()" class="text-sm font-medium text-fg">
        {{ label() }}
        @if (obrigatorio()) {
          <span class="text-danger" aria-hidden="true">*</span>
        }
      </label>

      <div class="relative">
        <input
          #inp
          [id]="idBase()"
          type="text"
          role="combobox"
          autocomplete="off"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          [attr.aria-expanded]="aberto()"
          [attr.aria-controls]="idBase() + '-list'"
          [attr.aria-activedescendant]="
            aberto() && destaque() >= 0 ? idBase() + '-opt-' + destaque() : null
          "
          [value]="texto()"
          [placeholder]="placeholder()"
          (input)="onInput(inp.value)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown)="onKeydown($event)"
          class="h-11 w-full rounded-control border bg-canvas pl-3.5 pr-10 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
          [style.border-color]="erro() ? 'var(--color-danger)' : null"
          [attr.aria-invalid]="erro() ? 'true' : null"
          [attr.aria-describedby]="erro() ? idBase() + '-error' : null"
        />

        @if (carregando()) {
          <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-accent">
            <svg viewBox="0 0 24 24" fill="none" class="size-4.5 animate-spin" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            </svg>
          </span>
        } @else if (selecionadoId() != null) {
          <button
            type="button"
            (click)="limpar()"
            aria-label="Limpar seleção"
            class="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-faint transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <svg viewBox="0 0 20 20" fill="none" class="size-4" aria-hidden="true">
              <path d="m6 6 8 8M14 6l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </button>
        } @else {
          <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint">
            <svg viewBox="0 0 20 20" fill="none" class="size-4.5" aria-hidden="true">
              <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6" />
              <path d="m17 17-3.2-3.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </span>
        }

        @if (aberto()) {
          <ul
            [id]="idBase() + '-list'"
            role="listbox"
            class="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-auto rounded-control border bg-surface py-1 shadow-card"
          >
            @if (carregando() && opcoes().length === 0) {
              <li class="px-3.5 py-2.5 text-sm text-muted">Buscando…</li>
            } @else if (opcoes().length === 0) {
              <li class="px-3.5 py-2.5 text-sm text-muted">Nenhum resultado.</li>
            } @else {
              @for (op of opcoes(); track op.id; let i = $index) {
                <li
                  [id]="idBase() + '-opt-' + i"
                  role="option"
                  [attr.aria-selected]="op.id === selecionadoId()"
                  (mousedown)="$event.preventDefault()"
                  (click)="selecionar(op)"
                  (mouseenter)="destaque.set(i)"
                  [class]="optClass(i === destaque())"
                >
                  {{ op.nome }}
                </li>
              }
            }
          </ul>
        }
      </div>

      @if (erro()) {
        <p [id]="idBase() + '-error'" class="text-[0.8125rem] text-danger">{{ erro() }}</p>
      }
    </div>
  `,
})
export class BuscaSelect {
  readonly label = input('');
  readonly placeholder = input('Digite para buscar…');
  readonly idBase = input('busca');
  readonly obrigatorio = input(false);
  readonly erro = input<string | null>(null);
  /** Valor inicial (modo edição): mostra o rótulo sem nova consulta. */
  readonly inicial = input<BuscaOpcao | null>(null);
  /** Função de busca no backend (recebe o termo, devolve os itens). */
  readonly buscar = input.required<(termo: string) => Observable<BuscaOpcao[]>>();

  readonly selecionadoChange = output<BuscaOpcao | null>();
  readonly tocado = output<void>();

  protected readonly selecionado = linkedSignal<BuscaOpcao | null>(() => this.inicial());
  protected readonly texto = linkedSignal<string>(() => this.inicial()?.nome ?? '');
  protected readonly aberto = signal(false);
  protected readonly carregando = signal(false);
  protected readonly opcoes = signal<BuscaOpcao[]>([]);
  protected readonly destaque = signal(-1);
  protected readonly selecionadoId = computed(() => this.selecionado()?.id ?? null);

  private readonly termo$ = new Subject<string>();

  constructor() {
    this.termo$
      .pipe(
        debounceTime(280),
        tap(() => this.carregando.set(true)),
        switchMap((t) => this.buscar()(t).pipe(catchError(() => of<BuscaOpcao[]>([])))),
        takeUntilDestroyed(),
      )
      .subscribe((lista) => {
        this.opcoes.set(lista);
        this.carregando.set(false);
        this.destaque.set(lista.length ? 0 : -1);
      });
  }

  protected onFocus(): void {
    this.aberto.set(true);
    if (this.opcoes().length === 0) {
      this.termo$.next(this.selecionado() ? '' : this.texto().trim());
    }
  }

  protected onInput(valor: string): void {
    this.texto.set(valor);
    if (this.selecionado()) {
      this.selecionado.set(null);
      this.selecionadoChange.emit(null);
    }
    this.aberto.set(true);
    this.termo$.next(valor.trim());
  }

  protected selecionar(op: BuscaOpcao): void {
    this.selecionado.set(op);
    this.texto.set(op.nome);
    this.aberto.set(false);
    this.selecionadoChange.emit(op);
    this.tocado.emit();
  }

  protected limpar(): void {
    this.selecionado.set(null);
    this.texto.set('');
    this.opcoes.set([]);
    this.aberto.set(false);
    this.selecionadoChange.emit(null);
    this.tocado.emit();
  }

  protected onBlur(): void {
    // Aguarda um clique em opção (mousedown preventDefault) antes de fechar.
    setTimeout(() => {
      this.aberto.set(false);
      const sel = this.selecionado();
      if (sel) this.texto.set(sel.nome);
      this.tocado.emit();
    }, 160);
  }

  protected onKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.aberto.set(true);
      const n = this.opcoes().length;
      if (n) this.destaque.set(Math.min(this.destaque() + 1, n - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.destaque.set(Math.max(this.destaque() - 1, 0));
    } else if (e.key === 'Enter') {
      const op = this.opcoes()[this.destaque()];
      if (this.aberto() && op) {
        e.preventDefault();
        this.selecionar(op);
      }
    } else if (e.key === 'Escape') {
      this.aberto.set(false);
    }
  }

  protected optClass(ativo: boolean): string {
    const base = 'flex cursor-pointer items-center px-3.5 py-2.5 text-sm transition-colors';
    return ativo ? `${base} bg-accent-soft text-accent` : `${base} text-fg hover:bg-surface-2`;
  }
}
