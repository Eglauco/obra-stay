package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Dados de entrada para criação/atualização de um contrato de locação.
 */
public record ContratoRequest(
        @NotBlank(message = "Informe o código.")
        @Size(max = 40, message = "O código deve ter no máximo 40 caracteres.")
        String codigo,

        @NotNull(message = "Selecione o local.")
        Long localId,

        @NotNull(message = "Selecione a locadora.")
        Long locadoraId,

        @NotNull(message = "Informe a data de início.")
        LocalDate dataInicio,

        @NotNull(message = "Informe a data de fim.")
        LocalDate dataFim
) {
}
