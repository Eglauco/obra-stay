package com.example.hospedagem.repository;

import com.example.hospedagem.domain.StatusLocal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface StatusLocalRepository
        extends JpaRepository<StatusLocal, Long>, JpaSpecificationExecutor<StatusLocal> {

    boolean existsByNomeIgnoreCase(String nome);

    boolean existsByNomeIgnoreCaseAndIdNot(String nome, Long id);
}
