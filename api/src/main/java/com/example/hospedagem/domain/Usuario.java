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

/** Usuário do sistema (autenticação). A senha é armazenada em hash BCrypt. */
@Entity
@Table(name = "usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false, length = 120)
    private String nome;

    @Column(name = "email", nullable = false, length = 160, unique = true)
    private String email;

    @Column(name = "senha", nullable = false, length = 100)
    private String senha;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "perfil_id", nullable = false)
    private Perfil perfil;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    /** Data/hora do último login bem-sucedido (auditoria). Nulo até o primeiro login. */
    @Column(name = "ultimo_login")
    private LocalDateTime ultimoLogin;

    /** Marca de "notificações lidas até" (para "marcar todas como lidas"). Nulo = nunca marcou. */
    @Column(name = "notificacoes_lidas_em")
    private LocalDateTime notificacoesLidasEm;
}
