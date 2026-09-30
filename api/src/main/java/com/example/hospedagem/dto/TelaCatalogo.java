package com.example.hospedagem.dto;

import java.util.List;

/** Item de tela do catálogo de permissões (chave + rótulo + ações disponíveis). */
public record TelaCatalogo(
        String tela,
        String rotulo,
        List<AcaoCatalogo> acoes) {
}
