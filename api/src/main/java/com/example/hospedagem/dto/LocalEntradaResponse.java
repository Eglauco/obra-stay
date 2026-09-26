package com.example.hospedagem.dto;

/**
 * Dados do local exibidos na tela pública de auto check-in (confirmação de endereço + vagas).
 */
public record LocalEntradaResponse(
        Long id,
        String codigo,
        String nome,
        String cep,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String uf,
        Integer capacidade,
        long ocupados,
        boolean temVaga
) {
}
