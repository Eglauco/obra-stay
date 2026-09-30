package com.example.hospedagem.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Uma permissão (par tela + ação). {@code tela} é a chave kebab-case (ex.: "status-locais")
 * e {@code acao} é o nome da constante {@link com.example.hospedagem.domain.Acao} (ex.: "VER").
 */
public record PermissaoDto(
        @NotBlank(message = "A tela é obrigatória.") String tela,
        @NotBlank(message = "A ação é obrigatória.") String acao) {
}
