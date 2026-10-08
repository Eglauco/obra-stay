package com.example.hospedagem.dto;

import com.example.hospedagem.domain.StatusSolicitacao;
import java.time.LocalDate;

/**
 * Filtros opcionais para a listagem de solicitações (combinados com AND no backend).
 */
public record SolicitacaoFiltro(
        StatusSolicitacao status,
        Long tipoSolicitacaoId,
        Long colaboradorId,
        Long localId,
        LocalDate aberturaDe,
        LocalDate aberturaAte,
        String tz   // fuso IANA do navegador (ex.: America/Sao_Paulo) p/ limites de dia e export
) {
}
