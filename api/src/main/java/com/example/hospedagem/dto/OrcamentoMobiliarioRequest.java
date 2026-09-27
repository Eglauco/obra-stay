package com.example.hospedagem.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Payload de entrada para criação e atualização de um Orçamento de Mobiliário (com itens).
 */
public record OrcamentoMobiliarioRequest(

        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 120, message = "Use no máximo 120 caracteres.")
        String nome,

        @Size(max = 500, message = "Use no máximo 500 caracteres.")
        String descricao,

        @NotEmpty(message = "Adicione ao menos um item.")
        @Valid
        List<ItemOrcamentoMobiliarioRequest> itens
) {
}
