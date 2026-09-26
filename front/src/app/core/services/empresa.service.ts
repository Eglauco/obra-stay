import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import { Empresa, EmpresaFiltro, EmpresaRequest } from '../models/empresa.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/empresas`;

  listar(filtro: EmpresaFiltro): Observable<PageResponse<Empresa>> {
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

    return this.http.get<PageResponse<Empresa>>(this.resource, { params });
  }

  /** Todas as empresas (para selects). */
  opcoes(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.resource}/opcoes`);
  }

  /** Exporta as empresas filtradas (sem paginação) em Excel. */
  exportar(filtro: EmpresaFiltro): Observable<Blob> {
    let params = new HttpParams();
    if (filtro.id != null && !Number.isNaN(filtro.id)) params = params.set('id', String(filtro.id));
    const nome = filtro.nome?.trim();
    if (nome) params = params.set('nome', nome);
    return this.http.get(`${this.resource}/exportar`, { params, responseType: 'blob' });
  }

  obter(id: number): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.resource}/${id}`);
  }

  criar(req: EmpresaRequest): Observable<Empresa> {
    return this.http.post<Empresa>(this.resource, req);
  }

  atualizar(id: number, req: EmpresaRequest): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
