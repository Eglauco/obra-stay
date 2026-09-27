import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import { StatusLocal, StatusLocalFiltro, StatusLocalRequest } from '../models/status-local.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class StatusLocalService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/status-locais`;

  listar(filtro: StatusLocalFiltro): Observable<PageResponse<StatusLocal>> {
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
    if (filtro.hospedagemLiberada != null) {
      params = params.set('hospedagemLiberada', String(filtro.hospedagemLiberada));
    }

    return this.http.get<PageResponse<StatusLocal>>(this.resource, { params });
  }

  /** Todos os status (para selects). */
  opcoes(): Observable<StatusLocal[]> {
    return this.http.get<StatusLocal[]>(`${this.resource}/opcoes`);
  }

  /** Exporta os status filtrados (sem paginação) em Excel. */
  exportar(filtro: StatusLocalFiltro): Observable<Blob> {
    let params = new HttpParams();
    if (filtro.id != null && !Number.isNaN(filtro.id)) params = params.set('id', String(filtro.id));
    const nome = filtro.nome?.trim();
    if (nome) params = params.set('nome', nome);
    if (filtro.hospedagemLiberada != null) {
      params = params.set('hospedagemLiberada', String(filtro.hospedagemLiberada));
    }
    return this.http.get(`${this.resource}/exportar`, { params, responseType: 'blob' });
  }

  obter(id: number): Observable<StatusLocal> {
    return this.http.get<StatusLocal>(`${this.resource}/${id}`);
  }

  criar(req: StatusLocalRequest): Observable<StatusLocal> {
    return this.http.post<StatusLocal>(this.resource, req);
  }

  atualizar(id: number, req: StatusLocalRequest): Observable<StatusLocal> {
    return this.http.put<StatusLocal>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
