package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Epc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface EpcRepository
        extends JpaRepository<Epc, Long>, JpaSpecificationExecutor<Epc> {
}
