package com.example.hospedagem.dto;

import java.time.LocalDate;

/**
 * Filtros opcionais para a listagem de gastos.
 * Todos os campos são opcionais e combinados com AND no backend.
 */
public record GastoFiltro(
        Long localId,
        String nome,
        LocalDate dataDe,
        LocalDate dataAte
) {
}
