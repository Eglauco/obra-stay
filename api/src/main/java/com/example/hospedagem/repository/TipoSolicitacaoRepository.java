package com.example.hospedagem.repository;

import com.example.hospedagem.domain.TipoSolicitacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoSolicitacaoRepository
        extends JpaRepository<TipoSolicitacao, Long>, JpaSpecificationExecutor<TipoSolicitacao> {
}
