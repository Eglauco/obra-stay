package com.example.hospedagem.dto;

/**
 * Linha do bloco "Atenção — contratos" do Painel.
 * {@code tipo}: "sem" (local sem contrato vigente hoje) ou "vencendo" (contrato vigente
 * que termina em até 30 dias). {@code dias} é a quantidade de dias até o fim (0 quando "sem").
 */
public record AlertaContratoResponse(
        Long localId,
        String localNome,
        String tipo,
        int dias,
        String codigo
) {
}
