package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface EmpresaRepository
        extends JpaRepository<Empresa, Long>, JpaSpecificationExecutor<Empresa> {
}
