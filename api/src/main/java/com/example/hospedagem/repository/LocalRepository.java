package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Local;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LocalRepository
        extends JpaRepository<Local, Long>, JpaSpecificationExecutor<Local> {

    boolean existsByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, Long id);
}
