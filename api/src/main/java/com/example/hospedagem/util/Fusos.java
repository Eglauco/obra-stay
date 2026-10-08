package com.example.hospedagem.util;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * Conversões de fuso horário. O banco guarda tudo em UTC (operação multi-região: SP = UTC-3,
 * MS = UTC-4). Quando o backend precisa produzir um horário de parede (exportação Excel) ou
 * filtrar por "dia local" (filtros de data), ele recebe o fuso do navegador do usuário e
 * converte com estes utilitários. O front envia o fuso IANA (ex.: "America/Sao_Paulo").
 */
public final class Fusos {

    /** Fuso usado quando o cliente não informa um válido (maioria dos usuários). */
    private static final ZoneId PADRAO = ZoneId.of("America/Sao_Paulo");

    private Fusos() {
    }

    /** Resolve o ZoneId a partir do identificador IANA; cai no padrão se nulo/ inválido. */
    public static ZoneId zona(String tz) {
        if (tz == null || tz.isBlank()) {
            return PADRAO;
        }
        try {
            return ZoneId.of(tz.trim());
        } catch (DateTimeException e) {
            return PADRAO;
        }
    }

    /** LocalDateTime gravado em UTC -> horário de parede no fuso informado (exibir/exportar). */
    public static LocalDateTime utcParaLocal(LocalDateTime utc, ZoneId zona) {
        if (utc == null) {
            return null;
        }
        return utc.atZone(ZoneOffset.UTC).withZoneSameInstant(zona).toLocalDateTime();
    }

    /** Início do dia local (no fuso) convertido para o LocalDateTime UTC equivalente (filtros). */
    public static LocalDateTime inicioDiaUtc(LocalDate dia, ZoneId zona) {
        if (dia == null) {
            return null;
        }
        return dia.atStartOfDay(zona).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }
}
