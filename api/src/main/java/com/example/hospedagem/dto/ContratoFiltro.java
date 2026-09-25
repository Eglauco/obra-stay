package com.example.hospedagem.dto;

/**
 * Filtros opcionais para a listagem de contratos.
 * Todos os campos são opcionais e combinados com AND no backend.
 * O campo {@code status} aceita "VIGENTE", "AGENDADO", "ENCERRADO" ou null.
 */
public record ContratoFiltro(
        Long localId,
        String codigo,
        String status
) {
}
