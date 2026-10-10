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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Quarto de um Local. A hospedagem passa a ser num quarto (não direto no local), e cada quarto
 * tem a sua lotação máxima. A capacidade do Local é a soma das lotações dos seus quartos.
 */
@Entity
@Table(name = "quarto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quarto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "local_id", nullable = false)
    private Local local;

    @Column(name = "nome", nullable = false, length = 60)
    private String nome;

    @Column(name = "lotacao_maxima", nullable = false)
    private Integer lotacaoMaxima;

    /** Ordem de exibição dentro do local. */
    @Column(name = "ordem", nullable = false)
    private Integer ordem;
}
