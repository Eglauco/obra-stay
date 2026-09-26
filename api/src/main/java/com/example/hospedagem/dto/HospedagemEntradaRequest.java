package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * Payload de entrada para registrar a chegada (dar entrada) de um colaborador em um local.
 */
public record HospedagemEntradaRequest(

        @NotNull(message = "Selecione o colaborador.")
        Long colaboradorId,

        @NotNull(message = "Selecione o local.")
        Long localId,

        @NotNull(message = "Informe a data e hora de entrada.")
        LocalDateTime dataEntrada,

        @Size(max = 255, message = "A observação deve ter no máximo 255 caracteres.")
        String observacao
) {
}
