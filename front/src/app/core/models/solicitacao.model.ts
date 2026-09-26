import { RefNome } from './colaborador.model';

export type StatusSolicitacao =
  | 'AGUARDANDO_ANALISE'
  | 'EM_PROCESSAMENTO'
  | 'FINALIZADA'
  | 'CANCELADA';

export interface Solicitacao {
  id: number;
  tipoSolicitacao: RefNome;
  colaborador: RefNome;
  local: RefNome;
  observacao: string;
  status: StatusSolicitacao;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
}

export interface SolicitacaoRequest {
  tipoSolicitacaoId: number | null;
  colaboradorId: number | null;
  localId: number | null;
  observacao: string;
}

export type SolicitacaoSortField = 'id' | 'dataHoraAbertura' | 'status';

export interface SolicitacaoFiltro {
  status?: StatusSolicitacao | null;
  tipoSolicitacaoId?: number | null;
  colaboradorId?: number | null;
  localId?: number | null;
  aberturaDe?: string | null;
  aberturaAte?: string | null;
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}

/** Evento da linha do tempo (histórico de status) de uma solicitação. */
export interface HistoricoStatus {
  status: StatusSolicitacao;
  observacao: string | null;
  dataHora: string;
}

/** Locais em que o colaborador está/esteve hospedado (para o campo Local da solicitação). */
export interface LocaisColaborador {
  locais: RefNome[];
  localAtivoId: number | null;
}

export const SOLICITACAO_STATUS_LABEL: Record<StatusSolicitacao, string> = {
  AGUARDANDO_ANALISE: 'Aguardando análise',
  EM_PROCESSAMENTO: 'Em processamento',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};
