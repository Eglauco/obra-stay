package com.example.hospedagem.dto;

/** Filtros opcionais para a listagem de Perfis (combinados com AND). */
public record PerfilFiltro(
        Long id,
        String nome) {
}
