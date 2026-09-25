package com.example.hospedagem.dto;

import com.example.hospedagem.domain.Mdo;
import com.example.hospedagem.domain.Sexo;

/**
 * Representação de saída de um colaborador.
 */
public record ColaboradorResponse(
        Long id,
        String nome,
        Sexo sexo,
        Mdo mdo,
        String cpf,
        String email,
        FuncaoResponse funcao,
        EpcResponse epc,
        EmpresaResponse empresa,
        GestaoResponse gestao
) {
}
