import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import { LogAuditoria, LogAuditoriaFiltro } from '../models/log-auditoria.model';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class LogAuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/logs-acesso`;

  private montarParams(filtro: LogAuditoriaFiltro, comPaginacao: boolean): HttpParams {
    let params = new HttpParams();
    if (comPaginacao) {
      params = params
        .set('page', String(filtro.page))
        .set('size', String(filtro.size))
        .set('sort', filtro.sort);
    }
    const q = filtro.q?.trim();
    if (q) params = params.set('q', q);
    if (filtro.evento) params = params.set('evento', filtro.evento);
    if (filtro.sucesso != null) params = params.set('sucesso', String(filtro.sucesso));
    if (filtro.de) params = params.set('de', filtro.de);
    if (filtro.ate) params = params.set('ate', filtro.ate);
    return params;
  }

  listar(filtro: LogAuditoriaFiltro): Observable<PageResponse<LogAuditoria>> {
    return this.http.get<PageResponse<LogAuditoria>>(this.resource, {
      params: this.montarParams(filtro, true),
    });
  }

  exportar(filtro: LogAuditoriaFiltro): Observable<Blob> {
    return this.http.get(`${this.resource}/exportar`, {
      params: this.montarParams(filtro, false),
      responseType: 'blob',
    });
  }
}
