package com.example.hospedagem.dto;

import java.time.LocalDateTime;

/** Um item do feed de notificações do usuário. */
public record NotificacaoItemResponse(
        Long id,
        String tipo,
        String titulo,
        String rota,
        LocalDateTime dataHora,
        boolean lida) {
}
