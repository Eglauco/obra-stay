package com.example.hospedagem.dto;

import com.example.hospedagem.domain.StatusSolicitacao;
import java.time.LocalDateTime;

/**
 * Representação de saída de uma solicitação.
 */
public record SolicitacaoResponse(
        Long id,
        ResumoRef tipoSolicitacao,
        ResumoRef colaborador,
        ResumoRef local,
        String observacao,
        StatusSolicitacao status,
        LocalDateTime dataHoraAbertura,
        LocalDateTime dataHoraEncerramento
) {
}
