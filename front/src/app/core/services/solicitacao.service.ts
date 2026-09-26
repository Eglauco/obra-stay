import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import {
  HistoricoStatus,
  LocaisColaborador,
  Solicitacao,
  SolicitacaoFiltro,
  SolicitacaoRequest,
} from '../models/solicitacao.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class SolicitacaoService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/solicitacoes`;

  listar(filtro: SolicitacaoFiltro): Observable<PageResponse<Solicitacao>> {
    let params = new HttpParams()
      .set('page', String(filtro.page))
      .set('size', String(filtro.size))
      .set('sort', filtro.sort);

    if (filtro.status) params = params.set('status', filtro.status);
    if (filtro.tipoSolicitacaoId != null) {
      params = params.set('tipoSolicitacaoId', String(filtro.tipoSolicitacaoId));
    }
    if (filtro.colaboradorId != null) {
      params = params.set('colaboradorId', String(filtro.colaboradorId));
    }
    if (filtro.localId != null) params = params.set('localId', String(filtro.localId));
    if (filtro.aberturaDe) params = params.set('aberturaDe', filtro.aberturaDe);
    if (filtro.aberturaAte) params = params.set('aberturaAte', filtro.aberturaAte);

    return this.http.get<PageResponse<Solicitacao>>(this.resource, { params });
  }

  obter(id: number): Observable<Solicitacao> {
    return this.http.get<Solicitacao>(`${this.resource}/${id}`);
  }

  criar(req: SolicitacaoRequest): Observable<Solicitacao> {
    return this.http.post<Solicitacao>(this.resource, req);
  }

  atualizar(id: number, req: SolicitacaoRequest): Observable<Solicitacao> {
    return this.http.put<Solicitacao>(`${this.resource}/${id}`, req);
  }

  iniciar(id: number, observacao?: string): Observable<Solicitacao> {
    return this.http.put<Solicitacao>(`${this.resource}/${id}/iniciar`, { observacao: observacao ?? null });
  }

  finalizar(id: number, observacao?: string): Observable<Solicitacao> {
    return this.http.put<Solicitacao>(`${this.resource}/${id}/finalizar`, { observacao: observacao ?? null });
  }

  cancelar(id: number, observacao?: string): Observable<Solicitacao> {
    return this.http.put<Solicitacao>(`${this.resource}/${id}/cancelar`, { observacao: observacao ?? null });
  }

  reabrir(id: number, observacao?: string): Observable<Solicitacao> {
    return this.http.put<Solicitacao>(`${this.resource}/${id}/reabrir`, { observacao: observacao ?? null });
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }

  /** Linha do tempo (histórico de status) de uma solicitação. */
  historico(id: number): Observable<HistoricoStatus[]> {
    return this.http.get<HistoricoStatus[]>(`${this.resource}/${id}/historico`);
  }

  /** Locais em que o colaborador está/esteve hospedado (restringe/sugere o Local). */
  locaisDoColaborador(colaboradorId: number): Observable<LocaisColaborador> {
    return this.http.get<LocaisColaborador>(
      `${API_BASE}/hospedagens/locais-colaborador/${colaboradorId}`,
    );
  }
}
