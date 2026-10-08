package com.example.hospedagem.dto;

import com.example.hospedagem.domain.AcaoEntrada;
import java.time.LocalDateTime;

/**
 * Resultado final do auto check-in (entrada ou saída efetivada).
 * {@code data} é o instante completo (UTC); o front converte para o fuso do navegador — assim
 * a data exibida fica correta mesmo à noite (quando o dia em UTC já virou).
 */
public record EntradaPublicaResultado(
        AcaoEntrada acao,
        String colaboradorNome,
        String localNome,
        LocalDateTime data,
        String mensagem
) {
}
