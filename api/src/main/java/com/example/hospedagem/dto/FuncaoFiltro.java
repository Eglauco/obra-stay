package com.example.hospedagem.dto;

/**
 * Filtros opcionais para a listagem de funções.
 * Todos os campos são opcionais e combinados com AND no backend.
 */
public record FuncaoFiltro(
        Long id,
        String nome
) {
}
