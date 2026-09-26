import { Mdo, Sexo } from './colaborador.model';

export interface RefItem {
  id: number;
  nome: string;
}

export type HospedagemStatus = 'ATIVA' | 'ENCERRADA';

export type OrigemHospedagem = 'ADMINISTRACAO' | 'AUTOATENDIMENTO';

export interface Hospedagem {
  id: number;
  colaborador: RefItem;
  local: RefItem;
  dataEntrada: string; // ISO datetime "YYYY-MM-DDTHH:mm:ss"
  dataSaida: string | null;
  status: HospedagemStatus;
  observacao: string | null;
  origem: OrigemHospedagem;
}

export interface HospedagemEntradaRequest {
  colaboradorId: number | null;
  localId: number | null;
  dataEntrada: string | null; // ISO datetime-local "YYYY-MM-DDTHH:mm"
  observacao: string | null;
}

export interface HospedagemSaidaRequest {
  dataSaida: string | null; // ISO datetime-local "YYYY-MM-DDTHH:mm"
}

export type HospedagemSortField = 'id' | 'dataEntrada' | 'dataSaida';
export type StatusFiltro = HospedagemStatus | '';

export interface HospedagemFiltro {
  colaboradorId?: number | null;
  localId?: number | null;
  status?: StatusFiltro;
  entradaDe?: string | null;
  entradaAte?: string | null;
  page: number;
  size: number;
  sort: string;
}

export interface Ocupacao {
  localId: number;
  localNome: string;
  capacidade: number;
  ocupados: number;
}

// ----- Relatório de hospedagens (PDF) -----

/** Uma estadia detalhada com os dados completos do colaborador. */
export interface ItemRelatorioHospedagem {
  id: number;
  colaboradorId: number;
  colaboradorNome: string;
  cpf: string;
  sexo: Sexo;
  mdo: Mdo;
  email: string;
  funcao: string;
  epc: string;
  empresa: string;
  gestao: string;
  dataEntrada: string;
  dataSaida: string | null;
  status: HospedagemStatus;
  origem: OrigemHospedagem;
  diasHospedados: number;
  observacao: string | null;
}

/** Linha de resumo agrupada por categoria (EPC, empresa, função, origem). */
export interface TotalCategoriaRelatorio {
  rotulo: string;
  total: number;
  ativas: number;
}

/** Payload completo do relatório de hospedagens do local. */
export interface RelatorioHospedagens {
  local: RefItem;
  localCodigo: string;
  localEndereco: string;
  capacidade: number;
  ocupadosAtuais: number;
  statusFiltro: string;
  dataDe: string | null;
  dataAte: string | null;
  geradoEm: string;
  itens: ItemRelatorioHospedagem[];
  porEpc: TotalCategoriaRelatorio[];
  porEmpresa: TotalCategoriaRelatorio[];
  porFuncao: TotalCategoriaRelatorio[];
  porOrigem: TotalCategoriaRelatorio[];
  totalRegistros: number;
  totalAtivas: number;
  totalEncerradas: number;
  totalPessoas: number;
  somaDias: number;
  mediaDias: number;
}
