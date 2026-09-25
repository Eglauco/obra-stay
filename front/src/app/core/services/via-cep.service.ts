import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ViaCepResponse } from '../models/local.model';

/** Consulta de endereço pelo CEP usando o serviço público ViaCEP. */
@Injectable({ providedIn: 'root' })
export class ViaCepService {
  private readonly http = inject(HttpClient);

  /** Só os 8 dígitos do CEP. */
  static digitos(cep: string): string {
    return (cep ?? '').replace(/\D/g, '').slice(0, 8);
  }

  /** Formata para "00000-000". */
  static formatar(cep: string): string {
    const d = ViaCepService.digitos(cep);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  }

  consultar(cep: string): Observable<ViaCepResponse> {
    const d = ViaCepService.digitos(cep);
    return this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${d}/json/`);
  }
}
