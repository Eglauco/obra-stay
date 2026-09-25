package com.example.hospedagem.dto;

/**
 * Filtros opcionais para a listagem de locais.
 * Todos os campos são opcionais e combinados com AND no backend.
 */
public record LocalFiltro(
        Long id,
        String codigo,
        String nome,
        String cidade
) {
}
