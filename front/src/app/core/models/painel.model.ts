/** Modelos do Painel (KPIs + blocos paginados). */

/** KPIs do cabeçalho do Painel. */
export interface ResumoPainel {
  totalColaboradores: number;
  totalLocais: number;
  totalOcupados: number;
  totalVagas: number;
  percentOcupacao: number;
  contratosVigentes: number;
  vencendo30: number;
  semContrato: number;
  gastoTotal: number;
}

/** Linha do bloco "Ocupação por local". */
export interface OcupacaoPainel {
  localId: number;
  localNome: string;
  capacidade: number;
  ocupados: number;
}

/** Linha do bloco "Gastos por local". */
export interface GastoLocalPainel {
  localId: number;
  nome: string;
  total: number;
  ocupados: number;
}

/** Linha do bloco "Colaboradores por função". */
export interface FuncaoContagem {
  funcao: string;
  qtd: number;
}

/** Linha do bloco "Atenção — contratos". */
export interface AlertaContrato {
  localId: number;
  localNome: string;
  tipo: 'sem' | 'vencendo';
  dias: number;
  codigo: string;
}
