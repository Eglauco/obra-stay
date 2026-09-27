import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { Location, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { OrcamentoMobiliarioService } from '../../../core/services/orcamento-mobiliario.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/colaborador.model';
import { OrcamentoMobiliarioRequest } from '../../../core/models/orcamento-mobiliario.model';

/** Linha editável de item (valores como texto; convertidos no submit). */
interface ItemRow {
  key: number;
  nome: string;
  preco: string;
  fixa: string;
  porQuarto: string;
}

/** Tela dedicada de criar/editar Orçamento de Mobiliário (mestre + itens dinâmicos). */
@Component({
  selector: 'app-orcamento-cadastro',
  template: `
    <section class="mx-auto flex max-w-3xl flex-col gap-6">
      <div class="flex items-center gap-3">
        <button type="button" (click)="voltar()" aria-label="Voltar para a lista"
          class="grid size-10 shrink-0 place-items-center rounded-control border text-muted transition-colors hover:bg-surface-2 hover:text-fg">
          <svg viewBox="0 0 20 20" fill="none" class="size-5" aria-hidden="true"><path d="M12 5l-5 5 5 5M7 10h9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
        <div>
          <p class="text-[0.6875rem] font-semibold uppercase tracking-wider text-accent">{{ editMode() ? 'Editar' : 'Novo' }}</p>
          <h2 class="font-display text-2xl font-semibold tracking-tight text-fg">{{ editMode() ? 'Editar orçamento' : 'Novo orçamento' }}</h2>
        </div>
      </div>

      @if (carregando()) {
        <div class="flex items-center justify-center gap-3 rounded-card border bg-surface p-10 text-sm text-muted shadow-card">
          <svg viewBox="0 0 24 24" fill="none" class="size-5 animate-spin text-accent" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
          Carregando orçamento…
        </div>
      } @else if (erroCarregar()) {
        <div class="flex flex-col items-center gap-4 rounded-card border bg-surface p-10 text-center shadow-card">
          <p class="text-sm text-muted">{{ erroCarregar() }}</p>
          <button type="button" (click)="voltar()" class="inline-flex h-10 items-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2">Voltar para a lista</button>
        </div>
      } @else {
        <form class="flex flex-col gap-6" (submit)="$event.preventDefault(); salvar()" novalidate>
          <!-- Dados do orçamento -->
          <fieldset class="form-card flex flex-col gap-5 rounded-card border bg-surface p-6 shadow-card sm:p-7">
            <legend class="text-[0.6875rem] font-semibold uppercase tracking-wider text-faint">Orçamento</legend>
            <div class="flex flex-col gap-1.5">
              <label for="orc-nome" class="text-sm font-medium text-fg">Nome <span class="text-danger" aria-hidden="true">*</span></label>
              <input #nomeInput id="orc-nome" type="text" autocomplete="off" [value]="nome()" (input)="nome.set(nomeInput.value); clearServerError('nome')"
                placeholder="Ex.: Padrão econômico"
                class="h-11 w-full rounded-control border bg-canvas px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
                [style.border-color]="nomeError() ? 'var(--color-danger)' : null" [attr.aria-invalid]="nomeError() ? 'true' : null" />
              @if (nomeError()) { <p class="text-[0.8125rem] text-danger">{{ nomeError() }}</p> }
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="orc-desc" class="text-sm font-medium text-fg">Descrição</label>
              <textarea #descInput id="orc-desc" rows="2" [value]="descricao()" (input)="descricao.set(descInput.value); clearServerError('descricao')"
                placeholder="Opcional"
                class="w-full resize-y rounded-control border bg-canvas px-3.5 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
                [style.border-color]="descricaoError() ? 'var(--color-danger)' : null"
                [attr.aria-invalid]="descricaoError() ? 'true' : null"
                [attr.aria-describedby]="descricaoError() ? 'orc-desc-erro' : null"></textarea>
              @if (descricaoError()) { <p id="orc-desc-erro" class="text-[0.8125rem] text-danger">{{ descricaoError() }}</p> }
            </div>
          </fieldset>

          <!-- Itens -->
          <fieldset class="form-card flex flex-col gap-4 rounded-card border bg-surface p-6 shadow-card sm:p-7">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <legend class="text-[0.6875rem] font-semibold uppercase tracking-wider text-faint">Itens</legend>
              <button type="button" (click)="adicionarItem()"
                class="inline-flex h-9 items-center gap-2 rounded-control border border-border-strong px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-2">
                <svg viewBox="0 0 20 20" fill="none" class="size-4" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
                Adicionar item
              </button>
            </div>

            <p class="text-[0.8125rem] text-muted">
              <strong class="text-fg">Fixa</strong> = unidades por casa (independem de quartos). <strong class="text-fg">Por quarto</strong> = multiplicam pelo nº de quartos na simulação.
            </p>

            @if (itens().length === 0) {
              <p class="rounded-control border border-dashed border-border-strong px-4 py-6 text-center text-sm text-muted">Nenhum item. Clique em “Adicionar item”.</p>
            }

            @for (row of itens(); track row.key; let i = $index) {
              <div class="rounded-control border bg-canvas p-3.5">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-[0.75rem] font-semibold uppercase tracking-wide text-faint">Item {{ i + 1 }}</span>
                  <button type="button" (click)="removerItem(row.key)" [attr.aria-label]="'Remover item ' + (i + 1)" title="Remover item"
                    class="grid size-8 place-items-center rounded-control text-muted transition-colors hover:bg-danger-soft hover:text-danger">
                    <svg viewBox="0 0 20 20" fill="none" class="size-4.5" aria-hidden="true"><path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2 0v9.5A1.5 1.5 0 0 1 12.5 17h-5A1.5 1.5 0 0 1 6 15.5V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </button>
                </div>
                <div class="grid gap-3 sm:grid-cols-12">
                  <div class="flex flex-col gap-1 sm:col-span-6">
                    <label class="text-[0.8125rem] font-medium text-muted" [for]="'it-nome-' + row.key">Item <span class="text-danger" aria-hidden="true">*</span></label>
                    <input [id]="'it-nome-' + row.key" type="text" autocomplete="off" [value]="row.nome" (input)="atualizarItem(row.key, 'nome', $event)"
                      placeholder="Ex.: Geladeira 332L"
                      class="h-11 w-full rounded-control border bg-surface px-3 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
                      [style.border-color]="submetido() && !row.nome.trim() ? 'var(--color-danger)' : null"
                      [attr.aria-invalid]="submetido() && !row.nome.trim() ? 'true' : null"
                      [attr.aria-describedby]="erroLinha(row) ? 'it-erro-' + row.key : null" />
                  </div>
                  <div class="flex flex-col gap-1 sm:col-span-3">
                    <label class="text-[0.8125rem] font-medium text-muted" [for]="'it-preco-' + row.key">Preço unit. (R$) <span class="text-danger" aria-hidden="true">*</span></label>
                    <input [id]="'it-preco-' + row.key" type="number" inputmode="decimal" min="0" step="0.01" [value]="row.preco" (input)="atualizarItem(row.key, 'preco', $event)"
                      placeholder="0,00"
                      class="tabular h-11 w-full rounded-control border bg-surface px-3 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
                      [style.border-color]="submetido() && !precoValido(row) ? 'var(--color-danger)' : null"
                      [attr.aria-invalid]="submetido() && !precoValido(row) ? 'true' : null"
                      [attr.aria-describedby]="erroLinha(row) ? 'it-erro-' + row.key : null" />
                  </div>
                  <div class="flex flex-col gap-1 sm:col-span-3 sm:grid sm:grid-cols-2 sm:gap-2">
                    <div class="flex flex-col gap-1">
                      <label class="text-[0.8125rem] font-medium text-muted" [for]="'it-fixa-' + row.key">Fixa</label>
                      <input [id]="'it-fixa-' + row.key" type="number" inputmode="numeric" min="0" step="1" [value]="row.fixa" (input)="atualizarItem(row.key, 'fixa', $event)"
                        class="tabular h-11 w-full rounded-control border bg-surface px-3 text-sm text-fg outline-none transition-colors focus:border-accent"
                        [style.border-color]="submetido() && !qtdValida(row) ? 'var(--color-danger)' : null"
                        [attr.aria-invalid]="submetido() && !qtdValida(row) ? 'true' : null"
                        [attr.aria-describedby]="erroLinha(row) ? 'it-erro-' + row.key : null" />
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="text-[0.8125rem] font-medium text-muted" [for]="'it-pq-' + row.key">Por quarto</label>
                      <input [id]="'it-pq-' + row.key" type="number" inputmode="numeric" min="0" step="1" [value]="row.porQuarto" (input)="atualizarItem(row.key, 'porQuarto', $event)"
                        class="tabular h-11 w-full rounded-control border bg-surface px-3 text-sm text-fg outline-none transition-colors focus:border-accent"
                        [style.border-color]="submetido() && !qtdValida(row) ? 'var(--color-danger)' : null"
                        [attr.aria-invalid]="submetido() && !qtdValida(row) ? 'true' : null"
                        [attr.aria-describedby]="erroLinha(row) ? 'it-erro-' + row.key : null" />
                    </div>
                  </div>
                </div>
                @if (erroLinha(row); as e) { <p [id]="'it-erro-' + row.key" class="mt-1.5 text-[0.8125rem] text-danger">{{ e }}</p> }
              </div>
            }

            @if (itensError()) { <p class="text-[0.8125rem] text-danger">{{ itensError() }}</p> }
          </fieldset>

          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" (click)="voltar()" [disabled]="saving()"
              class="inline-flex h-11 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2">Cancelar</button>
            <button type="submit" [disabled]="saving()"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70">
              @if (saving()) { <svg viewBox="0 0 24 24" fill="none" class="size-4 animate-spin" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg> }
              {{ editMode() ? 'Salvar alterações' : 'Cadastrar' }}
            </button>
          </div>
        </form>
      }
    </section>
  `,
})
export class OrcamentoCadastro {
  private readonly service = inject(OrcamentoMobiliarioService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly id = signal<number | null>(this.lerId());
  protected readonly editMode = computed(() => this.id() != null);

  protected readonly nome = signal('');
  protected readonly descricao = signal('');
  protected readonly itens = signal<ItemRow[]>([]);

  protected readonly submetido = signal(false);
  protected readonly saving = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erroCarregar = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  private seq = 0;

  protected readonly nomeError = computed(
    () => this.serverErrors()['nome'] ?? (this.submetido() && !this.nome().trim() ? 'Informe o nome.' : null),
  );
  protected readonly descricaoError = computed(() => this.serverErrors()['descricao'] ?? null);
  protected readonly itensError = computed(
    () => this.serverErrors()['itens'] ?? (this.submetido() && this.itens().length === 0 ? 'Adicione ao menos um item.' : null),
  );

  constructor() {
    afterNextRender(() => {
      const id = this.id();
      if (id != null) {
        this.carregar(id);
      } else {
        this.itens.set([this.novaLinha()]);
        document.getElementById('orc-nome')?.focus();
      }
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
      next: (o) => {
        this.nome.set(o.nome);
        this.descricao.set(o.descricao ?? '');
        this.itens.set(
          (o.itens ?? []).map((it) => ({
            key: this.seq++,
            nome: it.nome,
            preco: String(it.precoUnitario ?? ''),
            fixa: String(it.quantidadeFixa ?? 0),
            porQuarto: String(it.quantidadePorQuarto ?? 0),
          })),
        );
        if (this.itens().length === 0) this.itens.set([this.novaLinha()]);
        this.carregando.set(false);
        queueMicrotask(() => document.getElementById('orc-nome')?.focus());
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroCarregar.set(e.status === 404 ? 'Orçamento não encontrado.' : this.mensagemErro(e));
      },
    });
  }

  private novaLinha(): ItemRow {
    return { key: this.seq++, nome: '', preco: '', fixa: '1', porQuarto: '0' };
  }

  protected adicionarItem(): void {
    this.itens.update((rows) => [...rows, this.novaLinha()]);
  }

  protected removerItem(key: number): void {
    this.itens.update((rows) => rows.filter((r) => r.key !== key));
  }

  protected atualizarItem(key: number, campo: keyof ItemRow, e: Event): void {
    const valor = (e.target as HTMLInputElement).value;
    this.itens.update((rows) => rows.map((r) => (r.key === key ? { ...r, [campo]: valor } : r)));
    this.clearServerError('itens');
  }

  // ----- validação de linha -----
  protected precoValido(row: ItemRow): boolean {
    const v = row.preco.trim().replace(',', '.');
    if (v === '') return false;
    // Preço não-negativo com no máximo 2 casas decimais (alinha com o backend).
    if (!/^\d+(\.\d{1,2})?$/.test(v)) return false;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0;
  }

  protected qtdValida(row: ItemRow): boolean {
    return this.inteiro(row.fixa) + this.inteiro(row.porQuarto) >= 1;
  }

  protected erroLinha(row: ItemRow): string | null {
    if (!this.submetido()) return null;
    if (!row.nome.trim()) return 'Informe o nome do item.';
    if (!this.precoValido(row)) return 'Informe um preço válido (≥ 0).';
    if (!this.qtdValida(row)) return 'Quantidade fixa ou por quarto deve ser ≥ 1.';
    return null;
  }

  private inteiro(s: string): number {
    const n = Number(s.trim().replace(',', '.'));
    return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
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

  protected salvar(): void {
    this.submetido.set(true);
    this.serverErrors.set({});

    const linhas = this.itens();
    const linhasValidas = linhas.length > 0 && linhas.every((r) => !this.erroLinha(r));
    if (!this.nome().trim() || linhas.length === 0 || !linhasValidas || this.saving()) {
      return;
    }

    const req: OrcamentoMobiliarioRequest = {
      nome: this.nome().trim(),
      descricao: this.descricao().trim() || null,
      itens: linhas.map((r) => ({
        nome: r.nome.trim(),
        precoUnitario: Number(r.preco.trim().replace(',', '.')),
        quantidadeFixa: this.inteiro(r.fixa),
        quantidadePorQuarto: this.inteiro(r.porQuarto),
      })),
    };

    const id = this.id();
    this.saving.set(true);
    const op$ = id != null ? this.service.atualizar(id, req) : this.service.criar(req);
    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          id != null ? 'Orçamento atualizado' : 'Orçamento cadastrado',
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

  protected voltar(): void {
    const navId = this.isBrowser ? ((history.state?.navigationId as number | undefined) ?? 1) : 1;
    if (navId > 1) this.location.back();
    else this.router.navigateByUrl('/orcamentos-mobiliario');
  }

  private handleError(err: HttpErrorResponse): void {
    const body = err.error as ApiError | null;
    if (body?.fieldErrors?.length) {
      const map: Record<string, string> = {};
      for (const fe of body.fieldErrors) {
        // Erros de itens aninhados (ex.: "itens[0].nome") são agrupados em uma mensagem geral.
        const campo = fe.field.startsWith('itens') ? 'itens' : fe.field;
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
