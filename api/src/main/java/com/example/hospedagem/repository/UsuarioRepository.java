package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Usuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    /** Usuário com perfil e permissões já carregados (login, /me e filtro JWT). */
    @Query("select distinct u from Usuario u "
            + "join fetch u.perfil p left join fetch p.permissoes "
            + "where lower(u.email) = lower(:email)")
    Optional<Usuario> findComPermissoesByEmail(@Param("email") String email);

    /** Há algum usuário usando este perfil? (bloqueia a exclusão do perfil). */
    boolean existsByPerfilId(Long perfilId);

    /** Quantos usuários têm um perfil de acesso total (proteção contra ficar sem administrador). */
    long countByPerfil_AcessoTotalTrue();
}
