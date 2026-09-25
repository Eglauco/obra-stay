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
import { GastoService } from '../../../core/services/gasto.service';
import { LocalService } from '../../../core/services/local.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/colaborador.model';
import { Local } from '../../../core/models/local.model';
import { GastoRequest } from '../../../core/models/gasto.model';
import { formatarBRL } from '../../../core/util/format';

/** Tela de criar / editar gasto, com o local travado. */
@Component({
  selector: 'app-gasto-cadastro',
  templateUrl: './gasto-cadastro.html',
  styleUrl: './gasto-cadastro.css',
})
export class GastoCadastro {
  private readonly service = inject(GastoService);
  private readonly localService = inject(LocalService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly modo = this.route.snapshot.data['modo'] as 'novo' | 'editar';
  private readonly paramId = this.lerId();

  protected readonly editMode = this.modo === 'editar';
  protected readonly gastoId = signal<number | null>(this.editMode ? this.paramId : null);
  protected readonly localId = signal<number | null>(this.editMode ? null : this.paramId);
  protected readonly localNome = signal('');
  protected readonly localInfo = signal('');

  protected readonly carregando = signal(false);
  protected readonly erroCarregar = signal<string | null>(null);

  protected readonly nome = signal('');
  protected readonly quantidade = signal('');
  protected readonly valor = signal('');
  protected readonly data = signal('');

  protected readonly submetido = signal(false);
  protected readonly saving = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly totalPreview = computed(() => {
    const q = this.parseNum(this.quantidade());
    const v = this.parseNum(this.valor());
    if (q == null || v == null) return null;
    return formatarBRL(q * v);
  });

  protected readonly nomeError = computed(() => {
    const s = this.serverErrors()['nome'];
    if (s) return s;
    return this.submetido() && !this.nome().trim() ? 'Informe o nome.' : null;
  });
  protected readonly quantidadeError = computed(() => {
    const s = this.serverErrors()['quantidade'];
    if (s) return s;
    if (!this.submetido()) return null;
    const q = this.parseNum(this.quantidade());
    if (q == null) return 'Informe a quantidade.';
    if (q <= 0) return 'A quantidade deve ser maior que zero.';
    return null;
  });
  protected readonly valorError = computed(() => {
    const s = this.serverErrors()['valor'];
    if (s) return s;
    if (!this.submetido()) return null;
    const v = this.parseNum(this.valor());
    if (v == null) return 'Informe o valor.';
    if (v < 0) return 'O valor não pode ser negativo.';
    return null;
  });
  protected readonly dataError = computed(() => {
    const s = this.serverErrors()['data'];
    if (s) return s;
    return this.submetido() && !this.data() ? 'Informe a data.' : null;
  });

  constructor() {
    afterNextRender(() => {
      if (this.editMode) {
        if (this.paramId == null) {
          this.erroCarregar.set('Gasto inválido.');
          return;
        }
        this.carregarGasto(this.paramId);
      } else {
        if (this.paramId == null) {
          this.erroCarregar.set('Local inválido.');
          return;
        }
        this.carregarLocal(this.paramId);
        this.data.set(this.hoje());
      }
    });
  }

  private lerId(): number | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private carregarLocal(id: number): void {
    this.localService.obter(id).subscribe({
      next: (l) => this.setLocal(l),
      error: (e: HttpErrorResponse) =>
        this.erroCarregar.set(e.status === 404 ? 'Local não encontrado.' : this.mensagemErro(e)),
    });
  }

  private setLocal(l: Local): void {
    this.localId.set(l.id);
    this.localNome.set(l.nome);
    this.localInfo.set(`${l.codigo} · ${l.cidade}/${l.uf}`);
  }

  private carregarGasto(id: number): void {
    this.carregando.set(true);
    this.service.obter(id).subscribe({
      next: (g) => {
        this.carregando.set(false);
        this.nome.set(g.nome);
        this.quantidade.set(String(g.quantidade));
        this.valor.set(String(g.valor));
        this.data.set(g.data);
        this.localId.set(g.local.id);
        this.localNome.set(g.local.nome);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroCarregar.set(e.status === 404 ? 'Gasto não encontrado.' : this.mensagemErro(e));
      },
    });
  }

  protected onNome(v: string): void {
    this.nome.set(v);
    this.limparServer('nome');
  }
  protected onQuantidade(v: string): void {
    this.quantidade.set(v);
    this.limparServer('quantidade');
  }
  protected onValor(v: string): void {
    this.valor.set(v);
    this.limparServer('valor');
  }
  protected onData(v: string): void {
    this.data.set(v);
    this.limparServer('data');
  }

  private limparServer(field: string): void {
    if (this.serverErrors()[field]) {
      this.serverErrors.update((e) => {
        const next = { ...e };
        delete next[field];
        return next;
      });
    }
  }

  protected submit(): void {
    this.submetido.set(true);
    this.serverErrors.set({});

    const q = this.parseNum(this.quantidade());
    const v = this.parseNum(this.valor());
    const invalido =
      !this.nome().trim() ||
      q == null ||
      q <= 0 ||
      v == null ||
      v < 0 ||
      !this.data() ||
      this.localId() == null;

    if (invalido || this.saving()) return;

    const req: GastoRequest = {
      localId: this.localId(),
      nome: this.nome().trim(),
      quantidade: q,
      valor: v,
      data: this.data(),
    };
    this.saving.set(true);

    const id = this.gastoId();
    const op$ = this.editMode && id != null ? this.service.atualizar(id, req) : this.service.criar(req);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          this.editMode ? 'Gasto atualizado' : 'Gasto lançado',
          `${req.nome} salvo com sucesso.`,
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
    else if (this.localId() != null) this.router.navigate(['/gastos/local', this.localId()]);
    else this.router.navigateByUrl('/gastos');
  }

  private parseNum(s: string): number | null {
    const t = (s ?? '').trim().replace(',', '.');
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }

  private handleError(err: HttpErrorResponse): void {
    const body = err.error as ApiError | null;
    if (body?.fieldErrors?.length) {
      const map: Record<string, string> = {};
      for (const fe of body.fieldErrors) map[fe.field] = fe.message;
      this.serverErrors.set(map);
      this.toast.error('Não foi possível salvar', body.message ?? 'Verifique os campos destacados.');
      return;
    }
    const msg =
      err.status === 0
        ? 'Sem conexão com o servidor. Verifique se a API está no ar (porta 8080).'
        : (body?.message ?? 'Ocorreu um erro inesperado.');
    this.toast.error('Não foi possível salvar', msg);
  }

  private mensagemErro(e: HttpErrorResponse): string {
    if (e.status === 0) return 'Sem conexão com o servidor. Verifique se a API está no ar (porta 8080).';
    const body = e.error as ApiError | null;
    return body?.message ?? 'Ocorreu um erro inesperado ao falar com o servidor.';
  }

  private hoje(): string {
    if (!this.isBrowser) return '';
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
}
