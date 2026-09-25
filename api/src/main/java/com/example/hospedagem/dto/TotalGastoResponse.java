package com.example.hospedagem.dto;

import java.math.BigDecimal;

/**
 * Total de gastos por local (card do mestre).
 */
public record TotalGastoResponse(
        Long localId,
        BigDecimal total
) {
}
