package com.example.hospedagem.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * Colaborador hospedado em obras (módulo Colaboradores do ObraStay).
 */
@Entity
@Table(name = "colaborador")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Colaborador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false, length = 120)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(name = "sexo", nullable = false, length = 20)
    private Sexo sexo;

    @Enumerated(EnumType.STRING)
    @Column(name = "mdo", nullable = false, length = 30)
    private Mdo mdo;

    @Column(name = "cpf", nullable = false, length = 11, unique = true)
    private String cpf;

    @Column(name = "email", nullable = false, length = 160)
    private String email;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "funcao_id", nullable = false)
    private Funcao funcao;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "epc_id", nullable = false)
    private Epc epc;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "gestao_id", nullable = false)
    private Gestao gestao;
}
