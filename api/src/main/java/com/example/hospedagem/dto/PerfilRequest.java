package com.example.hospedagem.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Payload de criação/atualização de Perfil. As permissões são o conjunto de pares
 * (tela, ação) concedidos; a ausência de um par significa negado.
 */
public record PerfilRequest(

        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 80, message = "Use no máximo 80 caracteres.")
        String nome,

        @Size(max = 240, message = "Use no máximo 240 caracteres.")
        String descricao,

        @Valid
        List<PermissaoDto> permissoes) {
}
