package com.example.hospedagem.dto;

import com.example.hospedagem.domain.OrigemHospedagem;
import java.time.LocalDateTime;

/**
 * Representação de saída de uma hospedagem, com colaborador e local aninhados ({id, nome}),
 * data/hora de entrada e saída, o status derivado ("ATIVA"/"ENCERRADA") e a origem do registro.
 */
public record HospedagemResponse(
        Long id,
        ResumoRef colaborador,
        ResumoRef local,
        LocalDateTime dataEntrada,
        LocalDateTime dataSaida,
        String status,
        String observacao,
        OrigemHospedagem origem
) {
}
