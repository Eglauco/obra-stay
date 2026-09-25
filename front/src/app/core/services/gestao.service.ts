import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import { Gestao, GestaoFiltro, GestaoRequest } from '../models/gestao.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class GestaoService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/gestoes`;

  listar(filtro: GestaoFiltro): Observable<PageResponse<Gestao>> {
    let params = new HttpParams()
      .set('page', String(filtro.page))
      .set('size', String(filtro.size))
      .set('sort', filtro.sort);

    if (filtro.id != null && !Number.isNaN(filtro.id)) {
      params = params.set('id', String(filtro.id));
    }
    const nome = filtro.nome?.trim();
    if (nome) {
      params = params.set('nome', nome);
    }

    return this.http.get<PageResponse<Gestao>>(this.resource, { params });
  }

  /** Todas as gestões (para selects). */
  opcoes(): Observable<Gestao[]> {
    return this.http.get<Gestao[]>(`${this.resource}/opcoes`);
  }

  obter(id: number): Observable<Gestao> {
    return this.http.get<Gestao>(`${this.resource}/${id}`);
  }

  criar(req: GestaoRequest): Observable<Gestao> {
    return this.http.post<Gestao>(this.resource, req);
  }

  atualizar(id: number, req: GestaoRequest): Observable<Gestao> {
    return this.http.put<Gestao>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
