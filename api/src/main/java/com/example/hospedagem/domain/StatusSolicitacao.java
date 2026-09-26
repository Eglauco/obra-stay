package com.example.hospedagem.domain;

/**
 * Situação de uma solicitação no seu ciclo de vida.
 * Serializado em JSON como o nome da constante; o rótulo amigável fica no front.
 *
 * Fluxo: AGUARDANDO_ANALISE -> EM_PROCESSAMENTO -> FINALIZADA;
 * CANCELADA a partir de aguardando/em processamento; FINALIZADA/CANCELADA podem ser REABERTAS.
 */
public enum StatusSolicitacao {
    AGUARDANDO_ANALISE,
    EM_PROCESSAMENTO,
    FINALIZADA,
    CANCELADA
}
