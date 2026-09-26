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
 * Contrato de locação: vincula um {@link Local} a uma {@link Locadora} por um período
 * (módulo Gestão de Contratos do ObraStay).
 * O status (VIGENTE/AGENDADO/ENCERRADO) é derivado da data atual em relação ao período.
 */
@Entity
@Table(name = "contrato")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", nullable = false, length = 40, unique = true)
    private String codigo;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "local_id", nullable = false)
    private Local local;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "locadora_id", nullable = false)
    private Locadora locadora;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim", nullable = false)
    private LocalDate dataFim;

    /** Chave do PDF do contrato no storage (S3/MinIO). Nulo = sem arquivo. */
    @Column(name = "arquivo_key", length = 255)
    private String arquivoKey;
}
