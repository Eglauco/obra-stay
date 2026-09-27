package com.example.hospedagem.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Representação de saída de um local.
 */
public record LocalResponse(
        Long id,
        String codigo,
        String nome,
        Integer capacidade,
        String cep,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String uf,
        String fotoUrl,
        Long statusId,
        String statusNome,
        boolean hospedagemLiberada,
        Integer quartos,
        BigDecimal valorAluguel,
        List<ItemMobiliaLocalResponse> itensMobilia
) {
}
