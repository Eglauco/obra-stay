package com.example.hospedagem.dto;

/**
 * Referência enxuta {id, nome} usada para aninhar entidades relacionadas
 * (colaborador, local) nas respostas.
 */
public record ResumoRef(
        Long id,
        String nome
) {
}
