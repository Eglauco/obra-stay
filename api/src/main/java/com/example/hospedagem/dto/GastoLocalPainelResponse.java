package com.example.hospedagem.dto;

import java.math.BigDecimal;

/**
 * Linha do bloco "Gastos por local" do Painel: total gasto no local e nº de hospedados
 * ativos (o custo por colaborador é derivado no front).
 */
public record GastoLocalPainelResponse(
        Long localId,
        String nome,
        BigDecimal total,
        long ocupados
) {
}
