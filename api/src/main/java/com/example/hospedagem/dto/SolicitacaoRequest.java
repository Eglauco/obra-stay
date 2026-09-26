package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload de entrada para abertura e edição de uma solicitação.
 * Status e datas são controlados pelo backend (não vêm no payload).
 */
public record SolicitacaoRequest(

        @NotNull(message = "Selecione o tipo de solicitação.")
        Long tipoSolicitacaoId,

        @NotNull(message = "Selecione o colaborador solicitante.")
        Long colaboradorId,

        @NotNull(message = "Selecione o local da solicitação.")
        Long localId,

        @NotBlank(message = "Descreva a solicitação.")
        @Size(max = 1000, message = "A descrição deve ter no máximo 1000 caracteres.")
        String observacao
) {
}
