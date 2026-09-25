package com.example.hospedagem.dto;

/**
 * Ocupação atual de um local: capacidade total e número de hospedagens ativas.
 */
public record OcupacaoResponse(
        Long localId,
        String localNome,
        Integer capacidade,
        long ocupados
) {
}
