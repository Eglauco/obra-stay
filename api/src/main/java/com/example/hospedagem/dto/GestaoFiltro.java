package com.example.hospedagem.dto;

/**
 * Filtros opcionais para a listagem de gestões.
 * Todos os campos são opcionais e combinados com AND no backend.
 */
public record GestaoFiltro(
        Long id,
        String nome
) {
}
