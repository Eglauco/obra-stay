import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Local } from '../../models/local.model';

/**
 * Diálogo que gera, no navegador, o QR Code de auto check-in de um local
 * (aponta para a URL pública atual + /auto-atendimento/{localId}) e permite imprimir.
 */
@Component({
  selector: 'app-qr-entrada-dialog',
  host: { '(keydown.escape)': 'fechar.emit()' },
  template: `
    <div class="dlg-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" (click)="onBackdrop($event)">
      <div
        #panel
        class="dlg-panel w-full max-w-sm rounded-card border bg-surface p-6 text-center shadow-pop"
        role="dialog"
        aria-modal="true"
        aria-label="QR Code de autoatendimento"
        tabindex="-1"
      >
        <h2 class="font-display text-lg font-semibold text-fg">QR de autoatendimento</h2>
        <p class="mt-0.5 text-sm text-muted">{{ local().nome }} · {{ local().codigo }}</p>

        <div class="mx-auto mt-5 grid aspect-square w-56 place-items-center rounded-card border bg-white p-2">
          @if (qrDataUrl(); as src) {
            <img [src]="src" alt="QR Code de autoatendimento do local" class="h-full w-full" />
          } @else if (erro()) {
            <span class="px-4 text-sm text-danger">Não foi possível gerar o QR Code.</span>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" class="size-8 animate-spin text-accent" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            </svg>
          }
        </div>

        <p class="mt-4 break-all text-[0.75rem] text-faint">{{ link() }}</p>
        <p class="mt-3 text-[0.8125rem] text-muted">
          Imprima e cole na porta do local. O colaborador escaneia e faz entrada, saída ou solicitações pelo CPF.
        </p>

        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
            (click)="fechar.emit()"
          >
            Fechar
          </button>
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="!qrDataUrl()"
            (click)="imprimir()"
          >
            <svg viewBox="0 0 20 20" fill="none" class="size-4" aria-hidden="true">
              <path d="M6 7V3h8v4M6 14H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2M6 12h8v5H6v-5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Imprimir
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .dlg-backdrop {
      background: color-mix(in srgb, #0b1120 55%, transparent);
      backdrop-filter: blur(2px);
      animation: dlg-fade 0.15s ease both;
    }
    .dlg-panel { animation: dlg-pop 0.15s ease both; }
    @keyframes dlg-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes dlg-pop {
      from { opacity: 0; transform: translateY(6px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) { .dlg-backdrop, .dlg-panel { animation: none; } }
  `,
})
export class QrEntradaDialog {
  readonly local = input.required<Local>();
  readonly fechar = output<void>();

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  protected readonly qrDataUrl = signal<string | null>(null);
  protected readonly erro = signal(false);
  protected readonly link = signal('');

  protected readonly endereco = computed(() => {
    const l = this.local();
    const compl = l.complemento ? ` - ${l.complemento}` : '';
    return `${l.logradouro}, ${l.numero}${compl} · ${l.bairro} · ${l.cidade}/${l.uf}`;
  });

  constructor() {
    afterNextRender(async () => {
      const url = `${window.location.origin}/auto-atendimento/${this.local().id}`;
      this.link.set(url);
      try {
        const mod: any = await import('qrcode');
        const qr = mod.toDataURL ? mod : mod.default;
        const dataUrl: string = await qr.toDataURL(url, {
          width: 320,
          margin: 1,
          errorCorrectionLevel: 'M',
        });
        this.qrDataUrl.set(dataUrl);
        queueMicrotask(() => this.panel().nativeElement.focus());
      } catch {
        this.erro.set(true);
      }
    });
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.fechar.emit();
  }

  protected imprimir(): void {
    const img = this.qrDataUrl();
    if (!img) return;
    const l = this.local();
    const win = window.open('', '_blank', 'width=480,height=720');
    if (!win) return;
    const nome = this.esc(l.nome);
    const codigo = this.esc(l.codigo);
    const endereco = this.esc(this.endereco());
    win.document.write(
      '<!doctype html><html><head><meta charset="utf-8" />' +
        '<title>QR de autoatendimento - ' + nome + '</title>' +
        '<style>' +
        '*{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-sizing:border-box}' +
        'body{margin:0;padding:36px 28px;text-align:center;color:#0f172a}' +
        'h1{font-size:22px;margin:0 0 2px}.cod{color:#64748b;font-size:13px;margin-bottom:20px}' +
        'img{width:320px;height:320px}.cta{margin-top:14px;font-weight:700;font-size:16px}' +
        '.end{margin:14px auto 0;font-size:13px;color:#334155;max-width:360px}' +
        '</style></head><body>' +
        '<h1>' + nome + '</h1><div class="cod">Código: ' + codigo + '</div>' +
        '<img src="' + img + '" alt="QR Code de autoatendimento" />' +
        '<div class="cta">Escaneie para entrada, saída ou solicitações</div>' +
        '<div class="end">' + endereco + '</div>' +
        '<scr' + 'ipt>window.onload=function(){window.print()}</scr' + 'ipt>' +
        '</body></html>',
    );
    win.document.close();
  }

  private esc(s: string): string {
    return (s ?? '').replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string,
    );
  }
}
