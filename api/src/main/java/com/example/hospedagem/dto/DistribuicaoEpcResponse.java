package com.example.hospedagem.dto;

/**
 * Contagem de colaboradores hospedados (ativos) em um local por EPC — base do rateio de gastos.
 */
public record DistribuicaoEpcResponse(
        Long epcId,
        String epcNome,
        long pessoas
) {
}
