package com.example.hospedagem.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * Notificação de uma ação principal (Entrada, Saída, Nova Solicitação). É "broadcast":
 * fica visível para todo usuário que tem permissão de Ver a {@code tela} de origem, exceto
 * o {@code autorUsuarioId} (quem executou). A leitura é controlada por {@link NotificacaoLeitura}
 * e pela marca {@code notificacoes_lidas_em} do usuário.
 */
@Entity
@Table(name = "notificacao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoNotificacao tipo;

    @Column(name = "tela", nullable = false, length = 40)
    private String tela;

    @Column(name = "titulo", nullable = false, length = 200)
    private String titulo;

    @Column(name = "rota", nullable = false, length = 200)
    private String rota;

    /** Quem executou a ação; nulo para autoatendimento/kiosk. Não recebe a própria notificação. */
    @Column(name = "autor_usuario_id")
    private Long autorUsuarioId;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;
}
