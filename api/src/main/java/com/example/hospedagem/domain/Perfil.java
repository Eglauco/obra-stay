package com.example.hospedagem.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Perfil de acesso (RBAC). Define quais telas e ações um usuário pode usar.
 * {@code acessoTotal = true} concede tudo (Administrador). {@code sistema = true} protege
 * o perfil de edição/exclusão. As permissões concedidas ficam em {@link PerfilPermissao}.
 */
@Entity
@Table(name = "perfil")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Perfil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false, length = 80)
    private String nome;

    @Column(name = "descricao", length = 240)
    private String descricao;

    /** Concede acesso a tudo (inclusive telas futuras). Reservado ao Administrador. */
    @Column(name = "acesso_total", nullable = false)
    private boolean acessoTotal;

    /** Perfil interno do sistema (não pode ser editado nem excluído). */
    @Column(name = "sistema", nullable = false)
    private boolean sistema;

    @OneToMany(mappedBy = "perfil", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PerfilPermissao> permissoes = new ArrayList<>();
}
