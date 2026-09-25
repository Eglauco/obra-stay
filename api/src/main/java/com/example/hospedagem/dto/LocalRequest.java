package com.example.hospedagem.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Payload de entrada para criação e atualização de local.
 */
public record LocalRequest(

        @NotBlank(message = "O código é obrigatório.")
        @Size(max = 30, message = "Use no máximo 30 caracteres.")
        String codigo,

        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 120, message = "Use no máximo 120 caracteres.")
        String nome,

        @NotNull(message = "A capacidade é obrigatória.")
        @Min(value = 1, message = "A capacidade deve ser ao menos 1.")
        Integer capacidade,

        @NotBlank(message = "O CEP é obrigatório.")
        @Pattern(regexp = "\\d{5}-?\\d{3}", message = "CEP inválido.")
        String cep,

        @NotBlank(message = "O logradouro é obrigatório.")
        @Size(max = 150, message = "Use no máximo 150 caracteres.")
        String logradouro,

        @NotBlank(message = "O número é obrigatório.")
        @Size(max = 20, message = "Use no máximo 20 caracteres.")
        String numero,

        @Size(max = 100, message = "Use no máximo 100 caracteres.")
        String complemento,

        @NotBlank(message = "O bairro é obrigatório.")
        @Size(max = 100, message = "Use no máximo 100 caracteres.")
        String bairro,

        @NotBlank(message = "A cidade é obrigatória.")
        @Size(max = 100, message = "Use no máximo 100 caracteres.")
        String cidade,

        @NotBlank(message = "A UF é obrigatória.")
        @Size(min = 2, max = 2, message = "UF inválida.")
        String uf
) {
}
