package com.example.hospedagem.dto;

import java.util.List;

/** Representação de saída de um Perfil. */
public record PerfilResponse(
        Long id,
        String nome,
        String descricao,
        boolean acessoTotal,
        boolean sistema,
        int totalPermissoes,
        List<PermissaoDto> permissoes) {
}
