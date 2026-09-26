package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Consulta pública (quiosque) da linha do tempo de uma solicitação: CPF do dono + id.
 */
public record HistoricoPublicaRequest(

        @NotBlank(message = "Informe o CPF.")
        String cpf,

        @NotNull(message = "Solicitação não informada.")
        Long solicitacaoId
) {
}
