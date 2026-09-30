package com.example.hospedagem.dto;

/** Opção enxuta (id + nome) de Perfil, para popular selects (ex.: cadastro de usuário). */
public record PerfilOpcao(
        Long id,
        String nome,
        boolean acessoTotal) {
}
