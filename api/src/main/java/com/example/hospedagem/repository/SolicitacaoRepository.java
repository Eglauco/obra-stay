package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Solicitacao;
import com.example.hospedagem.domain.StatusSolicitacao;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface SolicitacaoRepository
        extends JpaRepository<Solicitacao, Long>, JpaSpecificationExecutor<Solicitacao> {

    /** Solicitações do colaborador nos status informados (acompanhamento pelo quiosque). */
    List<Solicitacao> findByColaboradorIdAndStatusInOrderByDataHoraAberturaDesc(
            Long colaboradorId, Collection<StatusSolicitacao> status);

    /** Todas as solicitações do colaborador (mais recentes primeiro) para acompanhamento. */
    List<Solicitacao> findByColaboradorIdOrderByDataHoraAberturaDesc(Long colaboradorId);
}
