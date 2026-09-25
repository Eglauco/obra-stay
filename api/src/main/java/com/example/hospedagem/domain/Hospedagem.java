package com.example.hospedagem.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Registro de hospedagem: entrada e saída de um colaborador em um local
 * (módulo Gestão de Hospedagem do ObraStay).
 * Uma hospedagem sem {@code dataSaida} é considerada ATIVA.
 */
@Entity
@Table(name = "hospedagem")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hospedagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "colaborador_id", nullable = false)
    private Colaborador colaborador;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "local_id", nullable = false)
    private Local local;

    @Column(name = "data_entrada", nullable = false)
    private LocalDate dataEntrada;

    /** Null = hospedagem ativa (colaborador ainda hospedado). */
    @Column(name = "data_saida")
    private LocalDate dataSaida;

    @Column(name = "observacao", length = 255)
    private String observacao;
}
