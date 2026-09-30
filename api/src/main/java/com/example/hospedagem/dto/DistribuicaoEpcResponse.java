package com.example.hospedagem.dto;

import java.math.BigDecimal;

/**
 * Distribuição por EPC dos colaboradores hospedados (ativos) em um local — base do rateio.
 * Como o colaborador pode ter vários EPCs, cada pessoa é dividida igualmente entre os seus
 * EPCs: {@code pessoas} = nº de colaboradores distintos com aquele EPC (para exibição);
 * {@code peso} = soma de 1/(qtde de EPCs da pessoa) — é o que define a proporção do rateio.
 */
public record DistribuicaoEpcResponse(
        Long epcId,
        String epcNome,
        long pessoas,
        BigDecimal peso
) {
}
