package com.example.hospedagem.dto;

import java.time.LocalDate;

/**
 * Contrato vigente hoje para um local, usado pelo card do local
 * ("contrato vigente"). Um item por local com contrato vigente na data atual.
 */
public record VigenciaResponse(
        Long localId,
        Long contratoId,
        String codigo,
        LocalDate dataInicio,
        LocalDate dataFim,
        String locadoraNome
) {
}
