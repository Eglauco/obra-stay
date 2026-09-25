package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Gestao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface GestaoRepository
        extends JpaRepository<Gestao, Long>, JpaSpecificationExecutor<Gestao> {
}
