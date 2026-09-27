package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload para trocar o status de um local (com observação opcional para o histórico).
 */
public record TrocarStatusLocalRequest(

        @NotNull(message = "O status é obrigatório.")
        Long statusId,

        @Size(max = 500, message = "Use no máximo 500 caracteres.")
        String observacao
) {
}
