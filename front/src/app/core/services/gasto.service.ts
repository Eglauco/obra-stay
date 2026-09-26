import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import {
  Gasto,
  GastoFiltro,
  GastoRequest,
  RateioGasto,
  RelatorioGastos,
  ResumoGasto,
  TotalGastoLocal,
} from '../models/gasto.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class GastoService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/gastos`;

  listar(filtro: GastoFiltro): Observable<PageResponse<Gasto>> {
    let params = new HttpParams()
      .set('page', String(filtro.page))
      .set('size', String(filtro.size))
      .set('sort', filtro.sort);

    if (filtro.localId != null) params = params.set('localId', String(filtro.localId));
    const nome = filtro.nome?.trim();
    if (nome) params = params.set('nome', nome);
    if (filtro.dataDe) params = params.set('dataDe', filtro.dataDe);
    if (filtro.dataAte) params = params.set('dataAte', filtro.dataAte);

    return this.http.get<PageResponse<Gasto>>(this.resource, { params });
  }

  /** Total gasto por local (para os cards do mestre). */
  totais(): Observable<TotalGastoLocal[]> {
    return this.http.get<TotalGastoLocal[]>(`${this.resource}/totais`);
  }

  /** Relatório completo do local no período (itens com rateio + totais por EPC). */
  relatorio(localId: number, dataDe?: string | null, dataAte?: string | null): Observable<RelatorioGastos> {
    let params = new HttpParams().set('localId', String(localId));
    if (dataDe) params = params.set('dataDe', dataDe);
    if (dataAte) params = params.set('dataAte', dataAte);
    return this.http.get<RelatorioGastos>(`${this.resource}/relatorio`, { params });
  }

  /** Total geral e total do período de um local. */
  resumo(localId: number, dataDe?: string | null, dataAte?: string | null): Observable<ResumoGasto> {
    let params = new HttpParams().set('localId', String(localId));
    if (dataDe) params = params.set('dataDe', dataDe);
    if (dataAte) params = params.set('dataAte', dataAte);
    return this.http.get<ResumoGasto>(`${this.resource}/resumo`, { params });
  }

  obter(id: number): Observable<Gasto> {
    return this.http.get<Gasto>(`${this.resource}/${id}`);
  }

  /** Rateio do gasto por EPC (lista de divisão do custo). */
  rateio(id: number): Observable<RateioGasto[]> {
    return this.http.get<RateioGasto[]>(`${this.resource}/${id}/rateio`);
  }

  criar(req: GastoRequest): Observable<Gasto> {
    return this.http.post<Gasto>(this.resource, req);
  }

  atualizar(id: number, req: GastoRequest): Observable<Gasto> {
    return this.http.put<Gasto>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
