package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Payload de entrada para criação e atualização de locadora.
 */
public record LocadoraRequest(

        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 120, message = "Use no máximo 120 caracteres.")
        String nome,

        @NotBlank(message = "O telefone de contato é obrigatório.")
        @Pattern(regexp = "\\d{10,11}", message = "Informe um telefone válido com DDD (10 ou 11 dígitos).")
        String telefone
) {
}
