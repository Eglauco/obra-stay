package com.example.hospedagem.domain;

/**
 * Ação resultante do auto check-in por CPF em um local:
 * ENTRADA (registrar entrada), SAIDA (encerrar a hospedagem ativa neste local)
 * ou BLOQUEADO (não é possível agir aqui — ex.: hospedado em outro local).
 */
public enum AcaoEntrada {
    ENTRADA,
    SAIDA,
    BLOQUEADO
}
