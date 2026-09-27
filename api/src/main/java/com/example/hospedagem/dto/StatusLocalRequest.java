package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload de entrada para criação e atualização de Status do Local.
 */
public record StatusLocalRequest(

        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 80, message = "Use no máximo 80 caracteres.")
        String nome,

        boolean hospedagemLiberada
) {
}
