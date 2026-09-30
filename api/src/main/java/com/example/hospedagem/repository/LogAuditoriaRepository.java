package com.example.hospedagem.repository;

import com.example.hospedagem.domain.LogAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LogAuditoriaRepository
        extends JpaRepository<LogAuditoria, Long>, JpaSpecificationExecutor<LogAuditoria> {
}
