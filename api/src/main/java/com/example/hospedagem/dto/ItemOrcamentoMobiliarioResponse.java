package com.example.hospedagem.dto;

import java.math.BigDecimal;

/**
 * Item de um Orçamento de Mobiliário (para exibição).
 */
public record ItemOrcamentoMobiliarioResponse(
        Long id,
        String nome,
        BigDecimal precoUnitario,
        Integer quantidadeFixa,
        Integer quantidadePorQuarto
) {
}
