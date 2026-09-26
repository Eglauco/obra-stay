import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Funcao,
  FuncaoFiltro,
  FuncaoRequest,
  PageResponse,
} from '../models/colaborador.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class FuncaoService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/funcoes`;

  listar(filtro: FuncaoFiltro): Observable<PageResponse<Funcao>> {
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

    return this.http.get<PageResponse<Funcao>>(this.resource, { params });
  }

  /** Todas as funções (para selects). */
  opcoes(): Observable<Funcao[]> {
    return this.http.get<Funcao[]>(`${this.resource}/opcoes`);
  }

  /** Exporta as funções filtradas (sem paginação) em Excel. */
  exportar(filtro: FuncaoFiltro): Observable<Blob> {
    let params = new HttpParams();
    if (filtro.id != null && !Number.isNaN(filtro.id)) params = params.set('id', String(filtro.id));
    const nome = filtro.nome?.trim();
    if (nome) params = params.set('nome', nome);
    return this.http.get(`${this.resource}/exportar`, { params, responseType: 'blob' });
  }

  obter(id: number): Observable<Funcao> {
    return this.http.get<Funcao>(`${this.resource}/${id}`);
  }

  criar(req: FuncaoRequest): Observable<Funcao> {
    return this.http.post<Funcao>(this.resource, req);
  }

  atualizar(id: number, req: FuncaoRequest): Observable<Funcao> {
    return this.http.put<Funcao>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
