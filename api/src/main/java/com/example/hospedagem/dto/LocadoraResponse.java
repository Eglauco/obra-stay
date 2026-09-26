package com.example.hospedagem.dto;

/**
 * Representação de saída de uma locadora.
 */
public record LocadoraResponse(
        Long id,
        String nome,
        String telefone
) {
}
