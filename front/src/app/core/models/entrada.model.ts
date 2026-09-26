export type AcaoEntrada = 'ENTRADA' | 'SAIDA' | 'BLOQUEADO';

/** Dados do local exibidos na tela pública de auto check-in. */
export interface LocalEntrada {
  id: number;
  codigo: string;
  nome: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  capacidade: number;
  ocupados: number;
  temVaga: boolean;
}

/** Resultado da consulta por CPF (ação disponível antes de confirmar). */
export interface ConsultaEntrada {
  colaboradorId: number;
  colaboradorNome: string;
  acao: AcaoEntrada;
  mensagem: string;
  hospedagemAtivaId: number | null;
  dataEntradaAtual: string | null;
  localTemVaga: boolean;
}

/** Resultado final do auto check-in (entrada ou saída efetivada). */
export interface EntradaResultado {
  acao: AcaoEntrada;
  colaboradorNome: string;
  localNome: string;
  data: string;
  mensagem: string;
}
