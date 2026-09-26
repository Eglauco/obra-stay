import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsultaEntrada,
  EntradaResultado,
  LocalEntrada,
} from '../models/entrada.model';
import { HistoricoStatus, Solicitacao } from '../models/solicitacao.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

/** Auto check-in público (tela por QR Code): consulta e confirma entrada/saída por CPF. */
@Injectable({ providedIn: 'root' })
export class EntradaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/hospedagens`;

  infoLocal(localId: number): Observable<LocalEntrada> {
    return this.http.get<LocalEntrada>(`${this.base}/local-entrada/${localId}`);
  }

  consultar(localId: number, cpf: string): Observable<ConsultaEntrada> {
    return this.http.post<ConsultaEntrada>(`${this.base}/entrada-publica/consulta`, { localId, cpf });
  }

  confirmar(localId: number, cpf: string): Observable<EntradaResultado> {
    return this.http.post<EntradaResultado>(`${this.base}/entrada-publica/confirmar`, { localId, cpf });
  }

  /** Tipos de solicitação (para o menu do quiosque). */
  tiposSolicitacao(): Observable<{ id: number; nome: string }[]> {
    return this.http.get<{ id: number; nome: string }[]>(`${API_BASE}/tipos-solicitacao/opcoes`);
  }

  /** Solicitações em aberto do colaborador (acompanhamento pelo quiosque). */
  acompanharSolicitacoes(cpf: string): Observable<Solicitacao[]> {
    return this.http.post<Solicitacao[]>(`${API_BASE}/solicitacoes/publica/acompanhar`, { cpf });
  }

  /** Linha do tempo de uma solicitação do colaborador (valida o CPF no backend). */
  historicoSolicitacao(cpf: string, solicitacaoId: number): Observable<HistoricoStatus[]> {
    return this.http.post<HistoricoStatus[]>(`${API_BASE}/solicitacoes/publica/historico`, {
      cpf,
      solicitacaoId,
    });
  }

  /** Abre uma solicitação pelo quiosque (identifica o colaborador por CPF). */
  abrirSolicitacao(
    localId: number,
    cpf: string,
    tipoSolicitacaoId: number,
    observacao: string,
  ): Observable<unknown> {
    return this.http.post(`${API_BASE}/solicitacoes/publica`, {
      localId,
      cpf,
      tipoSolicitacaoId,
      observacao,
    });
  }
}
