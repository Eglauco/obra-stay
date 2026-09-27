package com.example.hospedagem.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Representação de saída de um Orçamento de Mobiliário (com seus itens).
 */
public record OrcamentoMobiliarioResponse(
        Long id,
        String nome,
        String descricao,
        LocalDateTime criadoEm,
        int totalItens,
        List<ItemOrcamentoMobiliarioResponse> itens
) {
}
