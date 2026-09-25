import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

const AUTO_DISMISS_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private seq = 0;

  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(title: string, message?: string): void {
    this.push('success', title, message);
  }

  error(title: string, message?: string): void {
    this.push('error', title, message);
  }

  info(title: string, message?: string): void {
    this.push('info', title, message);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, title: string, message?: string): void {
    const id = ++this.seq;
    this._toasts.update((list) => [...list, { id, kind, title, message }]);
    if (this.isBrowser) {
      setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
    }
  }
}
