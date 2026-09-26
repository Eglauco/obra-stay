package com.example.hospedagem.dto;

/**
 * Filtros opcionais para a listagem de tipos de solicitação.
 * Todos os campos são opcionais e combinados com AND no backend.
 */
public record TipoSolicitacaoFiltro(
        Long id,
        String nome
) {
}
