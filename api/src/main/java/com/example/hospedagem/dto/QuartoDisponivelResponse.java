package com.example.hospedagem.dto;

/**
 * Quarto com vaga, para escolher no check-in (admin e autoatendimento).
 * Vagas = {@code lotacaoMaxima - ocupados}.
 */
public record QuartoDisponivelResponse(
        Long id,
        String nome,
        Integer lotacaoMaxima,
        long ocupados
) {
}
