package com.example.hospedagem.dto;

import com.example.hospedagem.domain.StatusSolicitacao;
import java.time.LocalDateTime;

/**
 * Evento da linha do tempo de uma solicitação.
 */
public record HistoricoResponse(
        StatusSolicitacao status,
        String observacao,
        LocalDateTime dataHora
) {
}
