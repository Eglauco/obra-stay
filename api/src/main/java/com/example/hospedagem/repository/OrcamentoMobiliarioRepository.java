package com.example.hospedagem.repository;

import com.example.hospedagem.domain.OrcamentoMobiliario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface OrcamentoMobiliarioRepository
        extends JpaRepository<OrcamentoMobiliario, Long>, JpaSpecificationExecutor<OrcamentoMobiliario> {

    boolean existsByNomeIgnoreCase(String nome);

    boolean existsByNomeIgnoreCaseAndIdNot(String nome, Long id);
}
