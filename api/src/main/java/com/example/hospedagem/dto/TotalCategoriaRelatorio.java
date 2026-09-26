package com.example.hospedagem.dto;

/**
 * Linha de resumo do relatório de hospedagens agrupada por uma categoria
 * (EPC, empresa, função ou origem): total de registros e quantos estão ativos.
 */
public record TotalCategoriaRelatorio(String rotulo, long total, long ativas) {
}
