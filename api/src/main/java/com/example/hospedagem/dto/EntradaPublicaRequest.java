package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Payload do auto check-in: local (do QR Code) + CPF digitado pelo colaborador.
 */
public record EntradaPublicaRequest(

        @NotNull(message = "Local não informado.")
        Long localId,

        @NotBlank(message = "Informe o CPF.")
        String cpf
) {
}
