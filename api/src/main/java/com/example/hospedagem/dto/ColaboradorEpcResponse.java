package com.example.hospedagem.dto;

import java.math.BigDecimal;

/**
 * EPC de um colaborador na resposta: id, nome e a porcentagem de participação.
 */
public record ColaboradorEpcResponse(
        Long epcId,
        String nome,
        BigDecimal percentual
) {
}
