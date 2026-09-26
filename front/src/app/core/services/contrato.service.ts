import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import { Contrato, ContratoFiltro, ContratoRequest, Vigencia } from '../models/contrato.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

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

  /** Exporta os contratos filtrados (detalhe do local) em Excel. */
  exportar(filtro: ContratoFiltro): Observable<Blob> {
    let params = new HttpParams();
    if (filtro.localId != null) params = params.set('localId', String(filtro.localId));
    const codigo = filtro.codigo?.trim();
    if (codigo) params = params.set('codigo', codigo);
    if (filtro.status) params = params.set('status', filtro.status);
    return this.http.get(`${this.resource}/exportar`, { params, responseType: 'blob' });
  }

  /** Exporta a grade de locais com o contrato vigente (respeita o filtro de nome). */
  exportarLocais(nome?: string | null): Observable<Blob> {
    let params = new HttpParams();
    const n = nome?.trim();
    if (n) params = params.set('nome', n);
    return this.http.get(`${this.resource}/exportar-locais`, { params, responseType: 'blob' });
  }

  obter(id: number): Observable<Contrato> {
    return this.http.get<Contrato>(`${this.resource}/${id}`);
  }

  criar(req: ContratoRequest, arquivo?: File | null): Observable<Contrato> {
    return this.http.post<Contrato>(this.resource, this.montarFormData(req, arquivo));
  }

  atualizar(id: number, req: ContratoRequest, arquivo?: File | null, removerArquivo = false): Observable<Contrato> {
    const fd = this.montarFormData(req, arquivo);
    if (removerArquivo) fd.append('removerArquivo', 'true');
    return this.http.put<Contrato>(`${this.resource}/${id}`, fd);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }

  /** Monta o multipart: parte "dados" (JSON) + "arquivo" (PDF opcional). */
  private montarFormData(req: ContratoRequest, arquivo?: File | null): FormData {
    const fd = new FormData();
    fd.append('dados', new Blob([JSON.stringify(req)], { type: 'application/json' }));
    if (arquivo) fd.append('arquivo', arquivo, arquivo.name);
    return fd;
  }
}
