package com.example.hospedagem.dto;

import java.util.List;

/** Feed do sino: quantidade de não-lidas + itens recentes. */
public record NotificacaoFeedResponse(
        long naoLidas,
        List<NotificacaoItemResponse> itens) {
}
