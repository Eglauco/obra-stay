package com.example.hospedagem.dto;

/**
 * Filtros opcionais para a listagem de Orçamentos de Mobiliário.
 * Todos os campos são opcionais e combinados com AND no backend.
 */
public record OrcamentoMobiliarioFiltro(
        Long id,
        String nome
) {
}
