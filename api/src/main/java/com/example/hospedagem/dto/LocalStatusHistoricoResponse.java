package com.example.hospedagem.dto;

import java.time.LocalDateTime;

/**
 * Linha do histórico de mudanças de status de um local (para exibição).
 */
public record LocalStatusHistoricoResponse(
        Long id,
        String statusAnteriorNome,
        String statusNovoNome,
        String observacao,
        String usuarioNome,
        LocalDateTime criadoEm
) {
}
