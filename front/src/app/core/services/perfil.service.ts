import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import {
  Perfil,
  PerfilFiltro,
  PerfilOpcao,
  PerfilRequest,
  TelaCatalogo,
} from '../models/perfil.model';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/perfis`;

  listar(filtro: PerfilFiltro): Observable<PageResponse<Perfil>> {
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
    return this.http.get<PageResponse<Perfil>>(this.resource, { params });
  }

  /** Perfis (id + nome) para selects. */
  opcoes(): Observable<PerfilOpcao[]> {
    return this.http.get<PerfilOpcao[]>(`${this.resource}/opcoes`);
  }

  /** Catálogo de telas e ações para montar a matriz de permissões. */
  catalogo(): Observable<TelaCatalogo[]> {
    return this.http.get<TelaCatalogo[]>(`${this.resource}/catalogo`);
  }

  exportar(filtro: PerfilFiltro): Observable<Blob> {
    let params = new HttpParams();
    if (filtro.id != null && !Number.isNaN(filtro.id)) params = params.set('id', String(filtro.id));
    const nome = filtro.nome?.trim();
    if (nome) params = params.set('nome', nome);
    return this.http.get(`${this.resource}/exportar`, { params, responseType: 'blob' });
  }

  obter(id: number): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.resource}/${id}`);
  }

  criar(req: PerfilRequest): Observable<Perfil> {
    return this.http.post<Perfil>(this.resource, req);
  }

  atualizar(id: number, req: PerfilRequest): Observable<Perfil> {
    return this.http.put<Perfil>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
