import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import {
  AlertaContrato,
  FuncaoContagem,
  GastoLocalPainel,
  OcupacaoPainel,
  ResumoPainel,
} from '../models/painel.model';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

/** Acesso aos dados do Painel: KPIs consolidados + blocos paginados (scroll infinito). */
@Injectable({ providedIn: 'root' })
export class PainelService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/painel`;

  resumo(): Observable<ResumoPainel> {
    return this.http.get<ResumoPainel>(`${this.resource}/resumo`);
  }

  ocupacao(page: number, size: number): Observable<PageResponse<OcupacaoPainel>> {
    return this.http.get<PageResponse<OcupacaoPainel>>(`${this.resource}/ocupacao`, {
      params: this.pageParams(page, size),
    });
  }

  contratosAlertas(page: number, size: number): Observable<PageResponse<AlertaContrato>> {
    return this.http.get<PageResponse<AlertaContrato>>(`${this.resource}/contratos-alertas`, {
      params: this.pageParams(page, size),
    });
  }

  gastos(page: number, size: number): Observable<PageResponse<GastoLocalPainel>> {
    return this.http.get<PageResponse<GastoLocalPainel>>(`${this.resource}/gastos`, {
      params: this.pageParams(page, size),
    });
  }

  colaboradoresPorFuncao(page: number, size: number): Observable<PageResponse<FuncaoContagem>> {
    return this.http.get<PageResponse<FuncaoContagem>>(`${this.resource}/colaboradores-por-funcao`, {
      params: this.pageParams(page, size),
    });
  }

  private pageParams(page: number, size: number): HttpParams {
    return new HttpParams().set('page', String(page)).set('size', String(size));
  }
}
