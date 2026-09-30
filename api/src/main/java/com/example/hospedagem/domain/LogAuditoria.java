package com.example.hospedagem.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Registro imutável (append-only) da trilha de auditoria: logins, logout e ações sensíveis.
 * tela/acao/evento são texto denormalizado (não enum/FK), para o histórico nunca quebrar se
 * um enum de código mudar. usuario_email é um snapshot da identidade no momento do evento.
 */
@Entity
@Table(name = "log_auditoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "usuario_email", length = 160)
    private String usuarioEmail;

    @Column(name = "evento", nullable = false, length = 20)
    private String evento;

    @Column(name = "tela", length = 40)
    private String tela;

    @Column(name = "acao", length = 30)
    private String acao;

    @Column(name = "detalhe", length = 255)
    private String detalhe;

    @Column(name = "sucesso", nullable = false)
    private boolean sucesso;

    @Column(name = "status_http")
    private Integer statusHttp;

    @Column(name = "ip", length = 45)
    private String ip;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;
}
