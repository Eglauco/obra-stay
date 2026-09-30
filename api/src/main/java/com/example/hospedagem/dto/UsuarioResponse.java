package com.example.hospedagem.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Representação de saída de um usuário. {@code permissoes} só é preenchida no login e no
 * /me (para o front controlar telas e botões); nas listagens vem vazia. Quando
 * {@code acessoTotal = true}, o front libera tudo independentemente de {@code permissoes}.
 */
public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        LocalDateTime criadoEm,
        LocalDateTime ultimoLogin,
        Long perfilId,
        String perfilNome,
        boolean acessoTotal,
        List<PermissaoDto> permissoes) {
}
