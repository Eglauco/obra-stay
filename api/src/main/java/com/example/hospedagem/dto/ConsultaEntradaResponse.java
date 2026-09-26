package com.example.hospedagem.dto;

import com.example.hospedagem.domain.AcaoEntrada;
import java.time.LocalDateTime;

/**
 * Resultado da consulta do auto check-in: identifica o colaborador pelo CPF e
 * informa a ação disponível (ENTRADA/SAIDA/BLOQUEADO) para a tela confirmar.
 */
public record ConsultaEntradaResponse(
        Long colaboradorId,
        String colaboradorNome,
        AcaoEntrada acao,
        String mensagem,
        Long hospedagemAtivaId,
        LocalDateTime dataEntradaAtual,
        boolean localTemVaga
) {
}
