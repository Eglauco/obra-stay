export interface NotificacaoItem {
  id: number;
  tipo: string; // ENTRADA, SAIDA, SOLICITACAO
  titulo: string;
  rota: string;
  dataHora: string;
  lida: boolean;
}

export interface NotificacaoFeed {
  naoLidas: number;
  itens: NotificacaoItem[];
}
