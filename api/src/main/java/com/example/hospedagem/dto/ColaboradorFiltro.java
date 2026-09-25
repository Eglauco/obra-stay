package com.example.hospedagem.dto;

import com.example.hospedagem.domain.Sexo;

/**
 * Filtros opcionais para a listagem de colaboradores.
 * Todos os campos são opcionais e combinados com AND no backend.
 */
public record ColaboradorFiltro(
        Long id,
        String nome,
        Sexo sexo,
        Long funcaoId
) {
}
