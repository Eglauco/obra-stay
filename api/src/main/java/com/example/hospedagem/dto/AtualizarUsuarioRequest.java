package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Atualização de um usuário existente: nome e perfil (não altera e-mail nem senha). */
public record AtualizarUsuarioRequest(

        @NotBlank(message = "Informe o nome.")
        @Size(max = 120, message = "Use no máximo 120 caracteres.")
        String nome,

        @NotNull(message = "Selecione um perfil.")
        Long perfilId) {
}
