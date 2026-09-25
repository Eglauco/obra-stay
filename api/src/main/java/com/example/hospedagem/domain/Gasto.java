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
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Gasto (lançamento de despesa) de um {@link Local} do módulo Gestão de Gastos.
 * O {@code valor} é UNITÁRIO; o total de cada gasto = quantidade x valor.
 */
@Entity
@Table(name = "gasto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "local_id", nullable = false)
    private Local local;

    @Column(name = "nome", nullable = false, length = 120)
    private String nome;

    @Column(name = "quantidade", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantidade;

    /** Valor UNITÁRIO. O total do gasto é quantidade x valor. */
    @Column(name = "valor", nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    @Column(name = "data", nullable = false)
    private LocalDate data;
}
