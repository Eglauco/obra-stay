package com.example.hospedagem.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Um quarto no payload de criação/edição do Local. {@code id} nulo = quarto novo.
 */
public record QuartoRequest(

        Long id,

        @NotBlank(message = "O nome do quarto é obrigatório.")
        @Size(max = 60, message = "Use no máximo 60 caracteres.")
        String nome,

        @NotNull(message = "Informe a lotação do quarto.")
        @Min(value = 1, message = "A lotação deve ser ao menos 1.")
        Integer lotacaoMaxima
) {
}
