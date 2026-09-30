package com.example.hospedagem.dto;

import java.time.LocalDateTime;

/** Representação de saída de um registro da trilha de auditoria. */
public record LogAuditoriaResponse(
        Long id,
        Long usuarioId,
        String usuarioEmail,
        String evento,
        String tela,
        String acao,
        String detalhe,
        boolean sucesso,
        Integer statusHttp,
        String ip,
        String userAgent,
        LocalDateTime dataHora) {
}
