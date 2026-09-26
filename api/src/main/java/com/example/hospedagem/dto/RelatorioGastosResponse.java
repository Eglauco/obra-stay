package com.example.hospedagem.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Relatório de gastos de um local (respeitando o período do filtro): itens com
 * suas divisões por EPC, somatória por EPC e total geral.
 */
public record RelatorioGastosResponse(
        ResumoRef local,
        LocalDate dataDe,
        LocalDate dataAte,
        LocalDateTime geradoEm,
        List<ItemRelatorioGasto> itens,
        List<TotalEpcRelatorio> totaisPorEpc,
        BigDecimal totalGeral
) {
}
