package com.example.hospedagem.dto;

/**
 * Representação de saída de um Status do Local.
 */
public record StatusLocalResponse(
        Long id,
        String nome,
        boolean hospedagemLiberada
) {
}
