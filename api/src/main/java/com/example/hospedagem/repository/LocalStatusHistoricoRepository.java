package com.example.hospedagem.repository;

import com.example.hospedagem.domain.LocalStatusHistorico;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LocalStatusHistoricoRepository extends JpaRepository<LocalStatusHistorico, Long> {

    /** Histórico de status de um local (mais recente primeiro). */
    List<LocalStatusHistorico> findByLocalIdOrderByCriadoEmDescIdDesc(Long localId);
}
