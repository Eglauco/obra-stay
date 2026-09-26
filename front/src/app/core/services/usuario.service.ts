import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistrarUsuarioRequest, Usuario } from '../models/usuario.model';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

/** Gestão de usuários (cadastro restrito: exige estar logado). */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${API_BASE}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.resource);
  }

  criar(req: RegistrarUsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.resource, req);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
