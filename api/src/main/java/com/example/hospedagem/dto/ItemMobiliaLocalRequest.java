package com.example.hospedagem.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Payload de um item de mobília do Local (quantidade única, já resolvida).
 */
public record ItemMobiliaLocalRequest(

        @NotBlank(message = "O nome do item é obrigatório.")
        @Size(max = 160, message = "Use no máximo 160 caracteres.")
        String nome,

        @NotNull(message = "O preço unitário é obrigatório.")
        @DecimalMin(value = "0.0", inclusive = true, message = "O preço não pode ser negativo.")
        @Digits(integer = 10, fraction = 2, message = "Preço inválido.")
        BigDecimal precoUnitario,

        @NotNull(message = "Informe a quantidade.")
        @Min(value = 1, message = "A quantidade deve ser ao menos 1.")
        Integer quantidade
) {
}
