import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { Sidebar } from './layout/sidebar/sidebar';
import { Topbar } from './layout/topbar/topbar';
import { ToastContainer } from './core/components/toast-container/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, Topbar, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);

  protected readonly sidebarOpen = signal(false);
  private readonly url = signal(this.router.url);

  /** Rotas públicas (quiosque) renderizam sem o menu/topbar. */
  protected readonly layoutLimpo = computed(() => this.url().startsWith('/auto-atendimento'));

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.url.set(e.urlAfterRedirects));
  }
}
