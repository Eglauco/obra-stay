package com.example.hospedagem.dto;

import java.math.BigDecimal;

/**
 * Item de mobília de um Local (para exibição).
 */
public record ItemMobiliaLocalResponse(
        Long id,
        String nome,
        BigDecimal precoUnitario,
        Integer quantidade
) {
}
