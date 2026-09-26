package com.example.hospedagem.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Relatório detalhado de hospedagens de um local (uma linha por estadia/colaborador),
 * com resumos por EPC, empresa, função e origem, além de indicadores gerais.
 */
public record RelatorioHospedagensResponse(
        ResumoRef local,
        String localCodigo,
        String localEndereco,
        Integer capacidade,
        long ocupadosAtuais,
        String statusFiltro,
        LocalDate dataDe,
        LocalDate dataAte,
        LocalDateTime geradoEm,
        List<ItemRelatorioHospedagem> itens,
        List<TotalCategoriaRelatorio> porEpc,
        List<TotalCategoriaRelatorio> porEmpresa,
        List<TotalCategoriaRelatorio> porFuncao,
        List<TotalCategoriaRelatorio> porOrigem,
        int totalRegistros,
        long totalAtivas,
        long totalEncerradas,
        int totalPessoas,
        long somaDias,
        double mediaDias) {
}
