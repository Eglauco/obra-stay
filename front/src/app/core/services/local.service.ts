import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import { Local, LocalFiltro, LocalRequest } from '../models/local.model';

const API_BASE = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class LocalService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/locais`;

  listar(filtro: LocalFiltro): Observable<PageResponse<Local>> {
    let params = new HttpParams()
      .set('page', String(filtro.page))
      .set('size', String(filtro.size))
      .set('sort', filtro.sort);

    if (filtro.id != null && !Number.isNaN(filtro.id)) {
      params = params.set('id', String(filtro.id));
    }
    const codigo = filtro.codigo?.trim();
    if (codigo) params = params.set('codigo', codigo);
    const nome = filtro.nome?.trim();
    if (nome) params = params.set('nome', nome);
    const cidade = filtro.cidade?.trim();
    if (cidade) params = params.set('cidade', cidade);

    return this.http.get<PageResponse<Local>>(this.resource, { params });
  }

  obter(id: number): Observable<Local> {
    return this.http.get<Local>(`${this.resource}/${id}`);
  }

  criar(req: LocalRequest): Observable<Local> {
    return this.http.post<Local>(this.resource, req);
  }

  atualizar(id: number, req: LocalRequest): Observable<Local> {
    return this.http.put<Local>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
