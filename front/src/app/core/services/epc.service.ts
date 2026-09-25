import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import { Epc, EpcFiltro, EpcRequest } from '../models/epc.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class EpcService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/epcs`;

  listar(filtro: EpcFiltro): Observable<PageResponse<Epc>> {
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

    return this.http.get<PageResponse<Epc>>(this.resource, { params });
  }

  /** Todos os EPCs (para selects). */
  opcoes(): Observable<Epc[]> {
    return this.http.get<Epc[]>(`${this.resource}/opcoes`);
  }

  obter(id: number): Observable<Epc> {
    return this.http.get<Epc>(`${this.resource}/${id}`);
  }

  criar(req: EpcRequest): Observable<Epc> {
    return this.http.post<Epc>(this.resource, req);
  }

  atualizar(id: number, req: EpcRequest): Observable<Epc> {
    return this.http.put<Epc>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
