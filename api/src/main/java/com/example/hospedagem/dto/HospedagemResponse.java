package com.example.hospedagem.dto;

import java.time.LocalDate;

/**
 * Representação de saída de uma hospedagem, com colaborador e local aninhados ({id, nome})
 * e o status derivado ("ATIVA" quando não há data de saída, "ENCERRADA" caso contrário).
 */
public record HospedagemResponse(
        Long id,
        ResumoRef colaborador,
        ResumoRef local,
        LocalDate dataEntrada,
        LocalDate dataSaida,
        String status,
        String observacao
) {
}
