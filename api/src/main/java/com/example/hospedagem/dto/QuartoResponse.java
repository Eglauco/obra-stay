package com.example.hospedagem.dto;

/**
 * Quarto na resposta do Local (lista editável do cadastro).
 */
public record QuartoResponse(
        Long id,
        String nome,
        Integer lotacaoMaxima,
        Integer ordem
) {
}
