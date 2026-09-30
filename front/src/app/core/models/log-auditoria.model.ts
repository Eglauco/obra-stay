export interface LogAuditoria {
  id: number;
  usuarioId: number | null;
  usuarioEmail: string | null;
  evento: string; // LOGIN, LOGOUT, ACAO
  tela: string | null;
  acao: string | null;
  detalhe: string | null;
  sucesso: boolean;
  statusHttp: number | null;
  ip: string | null;
  userAgent: string | null;
  dataHora: string;
}

export type LogAuditoriaSortField = 'id' | 'dataHora';

export interface LogAuditoriaFiltro {
  q?: string | null;
  evento?: string | null;
  sucesso?: boolean | null;
  de?: string | null; // yyyy-MM-dd
  ate?: string | null; // yyyy-MM-dd
  page: number;
  size: number;
  sort: string; // "campo,direcao" (padrão Spring)
}
