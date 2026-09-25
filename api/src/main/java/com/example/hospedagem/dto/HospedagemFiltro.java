package com.example.hospedagem.dto;

import java.time.LocalDate;

/**
 * Filtros opcionais para a listagem de hospedagens.
 * Todos os campos são opcionais e combinados com AND no backend.
 * O campo {@code status} aceita "ATIVA", "ENCERRADA" ou null.
 */
public record HospedagemFiltro(
        Long colaboradorId,
        Long localId,
        String status,
        LocalDate entradaDe,
        LocalDate entradaAte
) {
}
