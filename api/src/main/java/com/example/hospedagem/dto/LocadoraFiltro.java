package com.example.hospedagem.dto;

/**
 * Filtros opcionais para a listagem de locadoras.
 * Todos os campos são opcionais e combinados com AND no backend.
 */
public record LocadoraFiltro(
        Long id,
        String nome
) {
}
