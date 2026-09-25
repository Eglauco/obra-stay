package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Payload para registrar a saída (encerrar) de uma hospedagem ativa.
 */
public record HospedagemSaidaRequest(

        @NotNull(message = "Informe a data de saída.")
        LocalDate dataSaida
) {
}
