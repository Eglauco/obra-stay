package com.example.hospedagem.dto;

import java.math.BigDecimal;

/**
 * Somatória do rateio por EPC no relatório. {@code epcId} nulo = "Não rateado".
 */
public record TotalEpcRelatorio(
        Long epcId,
        String epcNome,
        BigDecimal valor
) {
}
