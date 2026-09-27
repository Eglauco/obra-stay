package com.example.hospedagem.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Status de um {@link Local}. Só é possível liberar novas hospedagens em um local
 * cujo status tenha {@code hospedagemLiberada = true}.
 */
@Entity
@Table(name = "status_local")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusLocal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false, length = 80)
    private String nome;

    @Column(name = "hospedagem_liberada", nullable = false)
    private boolean hospedagemLiberada;
}
