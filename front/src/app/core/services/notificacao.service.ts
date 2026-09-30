import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificacaoFeed } from '../models/notificacao.model';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/notificacoes`;

  feed(): Observable<NotificacaoFeed> {
    return this.http.get<NotificacaoFeed>(this.resource);
  }

  marcarLida(id: number): Observable<void> {
    return this.http.post<void>(`${this.resource}/${id}/lida`, {});
  }

  marcarTodasLidas(): Observable<void> {
    return this.http.post<void>(`${this.resource}/marcar-todas-lidas`, {});
  }
}
