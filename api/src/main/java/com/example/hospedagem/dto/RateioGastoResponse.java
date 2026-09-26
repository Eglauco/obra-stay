package com.example.hospedagem.dto;

import java.math.BigDecimal;

/**
 * Linha do rateio de um gasto por EPC (para exibição).
 */
public record RateioGastoResponse(
        Long epcId,
        String epcNome,
        Integer pessoas,
        BigDecimal percentual,
        BigDecimal valor
) {
}
