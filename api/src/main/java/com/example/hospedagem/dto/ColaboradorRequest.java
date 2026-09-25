package com.example.hospedagem.dto;

import com.example.hospedagem.domain.Sexo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload de entrada para criação e atualização de colaborador.
 */
public record ColaboradorRequest(

        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.")
        String nome,

        @NotNull(message = "O sexo é obrigatório.")
        Sexo sexo,

        @NotNull(message = "Selecione a função.")
        Long funcaoId
) {
}
