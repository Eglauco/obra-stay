import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AtualizarUsuarioRequest,
  RegistrarUsuarioRequest,
  Usuario,
} from '../models/usuario.model';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

/** Gestão de usuários (restrita pela tela "usuarios" do RBAC). */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.resource);
  }

  obter(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.resource}/${id}`);
  }

  criar(req: RegistrarUsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.resource, req);
  }

  atualizar(id: number, req: AtualizarUsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.resource}/${id}`, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
