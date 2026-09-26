import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/colaborador.model';
import { Local, LocalFiltro, LocalRequest } from '../models/local.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

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

  /** Exporta os locais filtrados (sem paginação) em Excel. */
  exportar(filtro: LocalFiltro): Observable<Blob> {
    let params = new HttpParams();
    if (filtro.id != null && !Number.isNaN(filtro.id)) params = params.set('id', String(filtro.id));
    const codigo = filtro.codigo?.trim();
    if (codigo) params = params.set('codigo', codigo);
    const nome = filtro.nome?.trim();
    if (nome) params = params.set('nome', nome);
    const cidade = filtro.cidade?.trim();
    if (cidade) params = params.set('cidade', cidade);
    return this.http.get(`${this.resource}/exportar`, { params, responseType: 'blob' });
  }

  obter(id: number): Observable<Local> {
    return this.http.get<Local>(`${this.resource}/${id}`);
  }

  criar(req: LocalRequest, foto?: File | null): Observable<Local> {
    return this.http.post<Local>(this.resource, this.montarFormData(req, foto));
  }

  atualizar(id: number, req: LocalRequest, foto?: File | null, removerFoto = false): Observable<Local> {
    const fd = this.montarFormData(req, foto);
    if (removerFoto) fd.append('removerFoto', 'true');
    return this.http.put<Local>(`${this.resource}/${id}`, fd);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }

  /** Monta o multipart: parte "dados" (JSON) + "foto" (opcional). */
  private montarFormData(req: LocalRequest, foto?: File | null): FormData {
    const fd = new FormData();
    fd.append('dados', new Blob([JSON.stringify(req)], { type: 'application/json' }));
    if (foto) fd.append('foto', foto, foto.name);
    return fd;
  }
}
