package com.example.hospedagem.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Representação de saída de um gasto, com local aninhado ({id, nome}).
 * O {@code valor} é UNITÁRIO e {@code total} = quantidade x valor.
 */
public record GastoResponse(
        Long id,
        ResumoRef local,
        String nome,
        BigDecimal quantidade,
        BigDecimal valor,
        BigDecimal total,
        LocalDate data
) {
}
