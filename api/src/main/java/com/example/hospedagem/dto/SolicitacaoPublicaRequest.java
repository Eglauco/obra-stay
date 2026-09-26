package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Abertura de solicitação pelo quiosque (QR Code): local do QR + CPF + tipo + observação.
 */
public record SolicitacaoPublicaRequest(

        @NotNull(message = "Local não informado.")
        Long localId,

        @NotBlank(message = "Informe o CPF.")
        String cpf,

        @NotNull(message = "Selecione o tipo de solicitação.")
        Long tipoSolicitacaoId,

        @NotBlank(message = "Descreva a solicitação.")
        @Size(max = 1000, message = "A descrição deve ter no máximo 1000 caracteres.")
        String observacao
) {
}
