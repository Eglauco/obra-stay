import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
  protected readonly sidebarOpen = signal(false);
}
