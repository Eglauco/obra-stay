package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload de entrada para criação e atualização de EPC.
 */
public record EpcRequest(

        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 120, message = "Use no máximo 120 caracteres.")
        String nome
) {
}
