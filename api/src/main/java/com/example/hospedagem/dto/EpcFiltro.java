package com.example.hospedagem.dto;

/**
 * Filtros opcionais para a listagem de EPCs.
 * Todos os campos são opcionais e combinados com AND no backend.
 */
public record EpcFiltro(
        Long id,
        String nome
) {
}
