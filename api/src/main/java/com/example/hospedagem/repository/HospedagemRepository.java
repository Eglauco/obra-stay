package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Hospedagem;
import com.example.hospedagem.dto.DistribuicaoEpcResponse;
import com.example.hospedagem.dto.OcupacaoResponse;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface HospedagemRepository
        extends JpaRepository<Hospedagem, Long>, JpaSpecificationExecutor<Hospedagem> {

    /** R1: verifica se o colaborador já possui uma hospedagem ativa (sem data de saída). */
    boolean existsByColaboradorIdAndDataSaidaIsNull(Long colaboradorId);

    /** Verifica se o colaborador está/esteve hospedado em um local (regra das Solicitações). */
    boolean existsByColaboradorIdAndLocalId(Long colaboradorId, Long localId);

    /** Hospedagens do colaborador (mais recentes primeiro) para listar seus locais. */
    List<Hospedagem> findByColaboradorIdOrderByDataEntradaDesc(Long colaboradorId);

    /** Hospedagem ativa (sem saída) do colaborador, quando houver (auto check-in). */
    Optional<Hospedagem> findFirstByColaboradorIdAndDataSaidaIsNull(Long colaboradorId);

    /** R2: conta as hospedagens ativas em um local (para validar capacidade). */
    long countByLocalIdAndDataSaidaIsNull(Long localId);

    /**
     * Ocupação por local: para CADA local, sua capacidade e o número de hospedagens ativas.
     * Usa LEFT JOIN para incluir locais sem nenhuma hospedagem ativa (ocupados = 0).
     */
    @Query("select new com.example.hospedagem.dto.OcupacaoResponse(l.id, l.nome, l.capacidade, count(h)) "
            + "from Local l left join Hospedagem h on h.local = l and h.dataSaida is null "
            + "group by l.id, l.nome, l.capacidade order by l.nome asc")
    List<OcupacaoResponse> ocupacaoPorLocal();

    /**
     * Distribuição por EPC dos colaboradores ATIVOS (hospedados) em um local,
     * base para o rateio de gastos. Ordena do EPC com mais pessoas para o menor.
     */
    @Query("select new com.example.hospedagem.dto.DistribuicaoEpcResponse("
            + "c.epc.id, c.epc.nome, count(h)) "
            + "from Hospedagem h join h.colaborador c "
            + "where h.local.id = :localId and h.dataSaida is null "
            + "group by c.epc.id, c.epc.nome "
            + "order by count(h) desc, c.epc.nome asc")
    List<DistribuicaoEpcResponse> distribuicaoEpcAtivaPorLocal(@Param("localId") Long localId);
}
