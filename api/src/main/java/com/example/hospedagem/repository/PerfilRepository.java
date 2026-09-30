package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Perfil;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface PerfilRepository
        extends JpaRepository<Perfil, Long>, JpaSpecificationExecutor<Perfil> {

    boolean existsByNomeIgnoreCase(String nome);

    boolean existsByNomeIgnoreCaseAndIdNot(String nome, Long id);

    Optional<Perfil> findByNomeIgnoreCase(String nome);
}
