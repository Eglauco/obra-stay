package com.example.hospedagem.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Dados de entrada para criação/atualização de um gasto (lançamento de despesa).
 * O {@code valor} é UNITÁRIO; o total é calculado como quantidade x valor.
 */
public record GastoRequest(
        @NotBlank(message = "Informe o nome.")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.")
        String nome,

        @NotNull(message = "Informe a quantidade.")
        @DecimalMin(value = "0.001", message = "A quantidade deve ser maior que zero.")
        BigDecimal quantidade,

        @NotNull(message = "Informe o valor.")
        @DecimalMin(value = "0.00", message = "O valor não pode ser negativo.")
        BigDecimal valor,

        @NotNull(message = "Informe a data.")
        LocalDate data,

        @NotNull(message = "Selecione o local.")
        Long localId
) {
}
