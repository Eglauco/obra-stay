import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import { TipoSolicitacao, TipoSolicitacaoFiltro, TipoSolicitacaoRequest } from '../models/tipo-solicitacao.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class TipoSolicitacaoService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/tipos-solicitacao`;

  listar(filtro: TipoSolicitacaoFiltro): Observable<PageResponse<TipoSolicitacao>> {
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

    return this.http.get<PageResponse<TipoSolicitacao>>(this.resource, { params });
  }

  /** Todos os tipos de solicitação (para selects). */
  opcoes(): Observable<TipoSolicitacao[]> {
    return this.http.get<TipoSolicitacao[]>(`${this.resource}/opcoes`);
  }

  obter(id: number): Observable<TipoSolicitacao> {
    return this.http.get<TipoSolicitacao>(`${this.resource}/${id}`);
  }

  criar(req: TipoSolicitacaoRequest): Observable<TipoSolicitacao> {
    return this.http.post<TipoSolicitacao>(this.resource, req);
  }

  atualizar(id: number, req: TipoSolicitacaoRequest): Observable<TipoSolicitacao> {
    return this.http.put<TipoSolicitacao>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
