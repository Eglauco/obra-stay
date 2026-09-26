package com.example.hospedagem.dto;

import com.example.hospedagem.domain.Mdo;
import com.example.hospedagem.domain.OrigemHospedagem;
import com.example.hospedagem.domain.Sexo;
import java.time.LocalDateTime;

/**
 * Linha do relatório de hospedagens: uma estadia com os dados completos do colaborador
 * e o tempo de permanência calculado (dataEntrada → dataSaida ou "hoje" quando ativa).
 */
public record ItemRelatorioHospedagem(
        Long id,
        Long colaboradorId,
        String colaboradorNome,
        String cpf,
        Sexo sexo,
        Mdo mdo,
        String email,
        String funcao,
        String epc,
        String empresa,
        String gestao,
        LocalDateTime dataEntrada,
        LocalDateTime dataSaida,
        String status,
        OrigemHospedagem origem,
        long diasHospedados,
        String observacao) {
}
