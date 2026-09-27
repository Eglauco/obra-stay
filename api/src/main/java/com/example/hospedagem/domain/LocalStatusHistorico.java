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
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Registro de auditoria de uma mudança de status de um {@link Local}.
 * Guarda o id e um snapshot do nome (de/para) para permanecer legível mesmo se o
 * status for renomeado ou excluído no futuro, além de observação, autor e data/hora.
 */
@Entity
@Table(name = "local_status_historico")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocalStatusHistorico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "local_id", nullable = false)
    private Local local;

    /** Status anterior (nulo no registro inicial do local). */
    @Column(name = "status_anterior_id")
    private Long statusAnteriorId;

    @Column(name = "status_anterior_nome", length = 80)
    private String statusAnteriorNome;

    @Column(name = "status_novo_id", nullable = false)
    private Long statusNovoId;

    @Column(name = "status_novo_nome", nullable = false, length = 80)
    private String statusNovoNome;

    @Column(name = "observacao", length = 500)
    private String observacao;

    /** Nome do usuário que fez a mudança (snapshot; nulo em registros automáticos). */
    @Column(name = "usuario_nome", length = 120)
    private String usuarioNome;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;
}
