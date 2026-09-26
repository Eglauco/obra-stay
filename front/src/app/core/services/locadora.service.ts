import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import { Locadora, LocadoraFiltro, LocadoraRequest } from '../models/locadora.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class LocadoraService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/locadoras`;

  listar(filtro: LocadoraFiltro): Observable<PageResponse<Locadora>> {
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

    return this.http.get<PageResponse<Locadora>>(this.resource, { params });
  }

  /** Todas as locadoras (para selects). */
  opcoes(): Observable<Locadora[]> {
    return this.http.get<Locadora[]>(`${this.resource}/opcoes`);
  }

  /** Exporta as locadoras filtradas (sem paginação) em Excel. */
  exportar(filtro: LocadoraFiltro): Observable<Blob> {
    let params = new HttpParams();
    if (filtro.id != null && !Number.isNaN(filtro.id)) params = params.set('id', String(filtro.id));
    const nome = filtro.nome?.trim();
    if (nome) params = params.set('nome', nome);
    return this.http.get(`${this.resource}/exportar`, { params, responseType: 'blob' });
  }

  obter(id: number): Observable<Locadora> {
    return this.http.get<Locadora>(`${this.resource}/${id}`);
  }

  criar(req: LocadoraRequest): Observable<Locadora> {
    return this.http.post<Locadora>(this.resource, req);
  }

  atualizar(id: number, req: LocadoraRequest): Observable<Locadora> {
    return this.http.put<Locadora>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
