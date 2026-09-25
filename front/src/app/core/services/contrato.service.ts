import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import { Contrato, ContratoFiltro, ContratoRequest, Vigencia } from '../models/contrato.model';

const API_BASE = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class ContratoService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/contratos`;

  listar(filtro: ContratoFiltro): Observable<PageResponse<Contrato>> {
    let params = new HttpParams()
      .set('page', String(filtro.page))
      .set('size', String(filtro.size))
      .set('sort', filtro.sort);

    if (filtro.localId != null) params = params.set('localId', String(filtro.localId));
    const codigo = filtro.codigo?.trim();
    if (codigo) params = params.set('codigo', codigo);
    if (filtro.status) params = params.set('status', filtro.status);

    return this.http.get<PageResponse<Contrato>>(this.resource, { params });
  }

  /** Contratos vigentes hoje (para o card de cada local). */
  vigencia(): Observable<Vigencia[]> {
    return this.http.get<Vigencia[]>(`${this.resource}/vigencia`);
  }

  obter(id: number): Observable<Contrato> {
    return this.http.get<Contrato>(`${this.resource}/${id}`);
  }

  criar(req: ContratoRequest): Observable<Contrato> {
    return this.http.post<Contrato>(this.resource, req);
  }

  atualizar(id: number, req: ContratoRequest): Observable<Contrato> {
    return this.http.put<Contrato>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
