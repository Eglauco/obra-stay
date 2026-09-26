package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Consulta pública (quiosque) das solicitações em aberto de um colaborador, pelo CPF.
 */
public record AcompanharSolicitacaoRequest(

        @NotBlank(message = "Informe o CPF.")
        String cpf
) {
}
