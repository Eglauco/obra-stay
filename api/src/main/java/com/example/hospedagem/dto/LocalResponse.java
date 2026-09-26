package com.example.hospedagem.dto;

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
        String fotoUrl
) {
}
