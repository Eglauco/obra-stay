package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Colaborador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ColaboradorRepository
        extends JpaRepository<Colaborador, Long>, JpaSpecificationExecutor<Colaborador> {
}
