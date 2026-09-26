package com.example.hospedagem.dto;

import java.time.LocalDateTime;

/**
 * Resumo da hospedagem ativa de um colaborador, para exibir/linkar no cadastro do colaborador.
 * {@code localId} permite montar o link "/hospedagens/local/{localId}".
 */
public record HospedagemAtivaResumo(
        Long hospedagemId,
        Long localId,
        String localNome,
        LocalDateTime dataEntrada) {
}
