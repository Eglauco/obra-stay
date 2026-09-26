package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Payload para registrar a saída (encerrar) de uma hospedagem ativa.
 */
public record HospedagemSaidaRequest(

        @NotNull(message = "Informe a data e hora de saída.")
        LocalDateTime dataSaida
) {
}
