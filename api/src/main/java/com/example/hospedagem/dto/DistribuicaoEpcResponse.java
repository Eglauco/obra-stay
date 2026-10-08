package com.example.hospedagem.dto;

import java.math.BigDecimal;

/**
 * Distribuição por EPC dos colaboradores hospedados (ativos) em um local — base do rateio.
 * Cada colaborador tem uma porcentagem por EPC (somando 100%): {@code pessoas} = nº de
 * colaboradores distintos com aquele EPC (para exibição); {@code peso} = soma de
 * (percentual/100) dos colaboradores naquele EPC — é o que define a proporção do rateio.
 */
public record DistribuicaoEpcResponse(
        Long epcId,
        String epcNome,
        long pessoas,
        BigDecimal peso
) {
}
