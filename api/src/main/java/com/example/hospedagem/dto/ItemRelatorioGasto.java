package com.example.hospedagem.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Item do relatório de gastos: a linha do gasto + suas divisões por EPC (filhas).
 */
public record ItemRelatorioGasto(
        Long id,
        String nome,
        LocalDate data,
        BigDecimal quantidade,
        BigDecimal valor,
        BigDecimal total,
        List<RateioGastoResponse> rateio
) {
}
