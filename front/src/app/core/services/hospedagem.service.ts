import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import {
  Hospedagem,
  HospedagemEntradaRequest,
  HospedagemFiltro,
  HospedagemSaidaRequest,
  Ocupacao,
  RelatorioHospedagens,
} from '../models/hospedagem.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class HospedagemService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/hospedagens`;

  listar(filtro: HospedagemFiltro): Observable<PageResponse<Hospedagem>> {
    let params = new HttpParams()
      .set('page', String(filtro.page))
      .set('size', String(filtro.size))
      .set('sort', filtro.sort);

    if (filtro.colaboradorId != null) params = params.set('colaboradorId', String(filtro.colaboradorId));
    if (filtro.localId != null) params = params.set('localId', String(filtro.localId));
    if (filtro.status) params = params.set('status', filtro.status);
    if (filtro.entradaDe) params = params.set('entradaDe', filtro.entradaDe);
    if (filtro.entradaAte) params = params.set('entradaAte', filtro.entradaAte);

    return this.http.get<PageResponse<Hospedagem>>(this.resource, { params });
  }

  /** Ocupação atual por local (para o resumo e o select de entrada). */
  ocupacao(): Observable<Ocupacao[]> {
    return this.http.get<Ocupacao[]>(`${this.resource}/ocupacao`);
  }

  /** Relatório detalhado de hospedagens do local (respeitando status/período). */
  relatorio(
    localId: number,
    status?: string | null,
    entradaDe?: string | null,
    entradaAte?: string | null,
  ): Observable<RelatorioHospedagens> {
    let params = new HttpParams().set('localId', String(localId));
    if (status) params = params.set('status', status);
    if (entradaDe) params = params.set('entradaDe', entradaDe);
    if (entradaAte) params = params.set('entradaAte', entradaAte);
    return this.http.get<RelatorioHospedagens>(`${this.resource}/relatorio`, { params });
  }

  /** Exporta as hospedagens filtradas (detalhe do local) em Excel. */
  exportar(filtro: HospedagemFiltro): Observable<Blob> {
    let params = new HttpParams();
    if (filtro.colaboradorId != null) params = params.set('colaboradorId', String(filtro.colaboradorId));
    if (filtro.localId != null) params = params.set('localId', String(filtro.localId));
    if (filtro.status) params = params.set('status', filtro.status);
    if (filtro.entradaDe) params = params.set('entradaDe', filtro.entradaDe);
    if (filtro.entradaAte) params = params.set('entradaAte', filtro.entradaAte);
    return this.http.get(`${this.resource}/exportar`, { params, responseType: 'blob' });
  }

  /** Exporta a grade de locais com a ocupação (respeita o filtro de nome). */
  exportarLocais(nome?: string | null): Observable<Blob> {
    let params = new HttpParams();
    const n = nome?.trim();
    if (n) params = params.set('nome', n);
    return this.http.get(`${this.resource}/exportar-locais`, { params, responseType: 'blob' });
  }

  obter(id: number): Observable<Hospedagem> {
    return this.http.get<Hospedagem>(`${this.resource}/${id}`);
  }

  darEntrada(req: HospedagemEntradaRequest): Observable<Hospedagem> {
    return this.http.post<Hospedagem>(this.resource, req);
  }

  darSaida(id: number, req: HospedagemSaidaRequest): Observable<Hospedagem> {
    return this.http.put<Hospedagem>(`${this.resource}/${id}/saida`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
