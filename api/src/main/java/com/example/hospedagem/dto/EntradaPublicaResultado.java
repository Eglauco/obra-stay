package com.example.hospedagem.dto;

import com.example.hospedagem.domain.AcaoEntrada;
import java.time.LocalDate;

/**
 * Resultado final do auto check-in (entrada ou saída efetivada).
 */
public record EntradaPublicaResultado(
        AcaoEntrada acao,
        String colaboradorNome,
        String localNome,
        LocalDate data,
        String mensagem
) {
}
