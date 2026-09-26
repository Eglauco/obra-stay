package com.example.hospedagem.dto;

import jakarta.validation.constraints.Size;

/**
 * Corpo (opcional) das transições de status: observação que o colaborador poderá ver.
 */
public record TransicaoStatusRequest(

        @Size(max = 1000, message = "A observação deve ter no máximo 1000 caracteres.")
        String observacao
) {
}
