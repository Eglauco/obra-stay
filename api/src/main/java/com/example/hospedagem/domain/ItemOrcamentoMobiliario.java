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
 * Item de um {@link OrcamentoMobiliario}. A quantidade efetiva para N quartos é
 * {@code quantidadeFixa + quantidadePorQuarto * N} (o cálculo em si é regra futura).
 */
@Entity
@Table(name = "orcamento_mobiliario_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemOrcamentoMobiliario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "orcamento_id", nullable = false)
    private OrcamentoMobiliario orcamento;

    @Column(name = "nome", nullable = false, length = 160)
    private String nome;

    @Column(name = "preco_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precoUnitario;

    /** Unidades fixas na casa (independem do nº de quartos). */
    @Column(name = "quantidade_fixa", nullable = false)
    private Integer quantidadeFixa;

    /** Unidades por quarto (multiplicam pelo nº de quartos na simulação). */
    @Column(name = "quantidade_por_quarto", nullable = false)
    private Integer quantidadePorQuarto;

    @Column(name = "ordem", nullable = false)
    private Integer ordem;
}
