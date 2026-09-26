package com.example.hospedagem.dto;

import java.util.List;

/**
 * Locais em que um colaborador está ou já esteve hospedado, para restringir/sugerir
 * o local ao abrir uma solicitação. {@code localAtivoId} é o local da hospedagem
 * ativa (quando houver), usado para pré-seleção.
 */
public record LocaisColaboradorResponse(
        List<ResumoRef> locais,
        Long localAtivoId
) {
}
