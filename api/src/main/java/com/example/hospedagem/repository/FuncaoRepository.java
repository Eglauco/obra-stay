package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Funcao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FuncaoRepository
        extends JpaRepository<Funcao, Long>, JpaSpecificationExecutor<Funcao> {
}
