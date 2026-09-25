package com.example.hospedagem.dto;

import java.math.BigDecimal;

/**
 * Cabeçalho do detalhe de gastos de um local:
 * total geral e total do período filtrado.
 */
public record ResumoGastoResponse(
        BigDecimal totalGeral,
        BigDecimal totalPeriodo
) {
}
