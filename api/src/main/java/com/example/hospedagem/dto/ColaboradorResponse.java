package com.example.hospedagem.dto;

import com.example.hospedagem.domain.Sexo;

/**
 * Representação de saída de um colaborador.
 */
public record ColaboradorResponse(
        Long id,
        String nome,
        Sexo sexo,
        FuncaoResponse funcao
) {
}
