package com.example.hospedagem.dto;

import java.time.LocalDate;

/**
 * Representação de saída de um contrato, com local e locadora aninhados ({id, nome})
 * e o status derivado ("VIGENTE", "AGENDADO" ou "ENCERRADO") a partir da data atual.
 */
public record ContratoResponse(
        Long id,
        String codigo,
        ResumoRef local,
        ResumoRef locadora,
        LocalDate dataInicio,
        LocalDate dataFim,
        String status
) {
}
