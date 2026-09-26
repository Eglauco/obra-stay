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
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Linha de rateio de um {@link Gasto} por EPC (snapshot no lançamento):
 * quantas pessoas daquele EPC estavam hospedadas no local, o percentual e o valor rateado.
 */
@Entity
@Table(name = "gasto_rateio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateioGasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "gasto_id", nullable = false)
    private Gasto gasto;

    @Column(name = "epc_id", nullable = false)
    private Long epcId;

    @Column(name = "epc_nome", nullable = false, length = 120)
    private String epcNome;

    @Column(name = "pessoas", nullable = false)
    private Integer pessoas;

    @Column(name = "percentual", nullable = false, precision = 5, scale = 2)
    private BigDecimal percentual;

    @Column(name = "valor", nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;
}
