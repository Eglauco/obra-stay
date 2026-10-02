package com.example.hospedagem.dto;

import java.math.BigDecimal;

/**
 * KPIs do Painel (cabeçalho): totais consolidados calculados no banco, sem depender
 * das listas paginadas dos blocos.
 */
public record ResumoPainelResponse(
        long totalColaboradores,
        long totalLocais,
        long totalOcupados,
        long totalVagas,
        int percentOcupacao,
        long contratosVigentes,
        long vencendo30,
        long semContrato,
        BigDecimal gastoTotal
) {
}
