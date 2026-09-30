package com.example.hospedagem.dto;

import java.time.LocalDate;

/** Filtros opcionais para a consulta de logs de auditoria (combinados com AND). */
public record LogAuditoriaFiltro(
        String q,          // busca em e-mail / detalhe
        String evento,     // LOGIN, LOGOUT, ACAO
        Boolean sucesso,
        LocalDate de,      // data inicial (inclusive)
        LocalDate ate) {   // data final (inclusive)
}
