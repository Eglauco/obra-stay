package com.example.hospedagem.dto;

/**
 * Filtros opcionais para a listagem de Status dos Locais.
 * Todos os campos são opcionais e combinados com AND no backend.
 */
public record StatusLocalFiltro(
        Long id,
        String nome,
        Boolean hospedagemLiberada
) {
}
