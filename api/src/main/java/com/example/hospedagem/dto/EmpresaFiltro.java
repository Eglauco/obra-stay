package com.example.hospedagem.dto;

/**
 * Filtros opcionais para a listagem de empresas.
 * Todos os campos são opcionais e combinados com AND no backend.
 */
public record EmpresaFiltro(
        Long id,
        String nome
) {
}
