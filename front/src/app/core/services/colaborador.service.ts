import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Colaborador,
  ColaboradorFiltro,
  ColaboradorRequest,
  PageResponse,
} from '../models/colaborador.model';

const API_BASE = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class ColaboradorService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/colaboradores`;

  listar(filtro: ColaboradorFiltro): Observable<PageResponse<Colaborador>> {
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
    if (filtro.sexo) {
      params = params.set('sexo', filtro.sexo);
    }
    if (filtro.funcaoId != null && !Number.isNaN(filtro.funcaoId)) {
      params = params.set('funcaoId', String(filtro.funcaoId));
    }

    return this.http.get<PageResponse<Colaborador>>(this.resource, { params });
  }

  /** Todos os colaboradores (para selects). */
  opcoes(): Observable<Colaborador[]> {
    return this.http.get<Colaborador[]>(`${this.resource}/opcoes`);
  }

  obter(id: number): Observable<Colaborador> {
    return this.http.get<Colaborador>(`${this.resource}/${id}`);
  }

  criar(req: ColaboradorRequest): Observable<Colaborador> {
    return this.http.post<Colaborador>(this.resource, req);
  }

  atualizar(id: number, req: ColaboradorRequest): Observable<Colaborador> {
    return this.http.put<Colaborador>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
