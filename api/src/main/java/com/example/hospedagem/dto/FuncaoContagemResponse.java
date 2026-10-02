package com.example.hospedagem.dto;

/**
 * Linha do bloco "Colaboradores por função" do Painel: nome da função e quantidade.
 */
public record FuncaoContagemResponse(
        String funcao,
        long qtd
) {
}
