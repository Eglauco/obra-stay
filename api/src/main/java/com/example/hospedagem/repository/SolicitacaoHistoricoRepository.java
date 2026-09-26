package com.example.hospedagem.repository;

import com.example.hospedagem.domain.SolicitacaoHistorico;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SolicitacaoHistoricoRepository extends JpaRepository<SolicitacaoHistorico, Long> {

    /** Linha do tempo de uma solicitação (mais antigos primeiro). */
    List<SolicitacaoHistorico> findBySolicitacaoIdOrderByDataHoraAscIdAsc(Long solicitacaoId);
}
