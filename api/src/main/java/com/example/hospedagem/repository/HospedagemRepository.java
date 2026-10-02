package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Hospedagem;
import com.example.hospedagem.dto.DistribuicaoEpcResponse;
import com.example.hospedagem.dto.OcupacaoResponse;
import java.math.BigDecimal;
import java.util.ArrayList;
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

    /** Total de hospedagens ativas (sem data de saída) em todos os locais — KPI do Painel. */
    long countByDataSaidaIsNull();

    /**
     * Ocupação por local: para CADA local, sua capacidade e o número de hospedagens ativas.
     * Usa LEFT JOIN para incluir locais sem nenhuma hospedagem ativa (ocupados = 0).
     */
    @Query("select new com.example.hospedagem.dto.OcupacaoResponse(l.id, l.nome, l.capacidade, count(h)) "
            + "from Local l left join Hospedagem h on h.local = l and h.dataSaida is null "
            + "group by l.id, l.nome, l.capacidade order by l.nome asc")
    List<OcupacaoResponse> ocupacaoPorLocal();

    /**
     * Distribuição por EPC dos colaboradores ATIVOS (hospedados) em um local, base do rateio.
     * Como o colaborador pode ter vários EPCs, cada pessoa é dividida igualmente entre os seus
     * EPCs: peso = soma de 1/(qtde de EPCs da pessoa). pessoas = colaboradores distintos por EPC.
     * Query nativa (usa a tabela de junção colaborador_epc). Colunas: epcId, epcNome, pessoas, peso.
     */
    @Query(value = "SELECT ce.epc_id AS epcId, e.nome AS epcNome, "
            + "COUNT(DISTINCT c.id) AS pessoas, SUM(1.0 / nq.n) AS peso "
            + "FROM hospedagem h "
            + "JOIN colaborador c ON c.id = h.colaborador_id "
            + "JOIN colaborador_epc ce ON ce.colaborador_id = c.id "
            + "JOIN epc e ON e.id = ce.epc_id "
            + "JOIN (SELECT colaborador_id, COUNT(*) AS n FROM colaborador_epc GROUP BY colaborador_id) nq "
            + "ON nq.colaborador_id = c.id "
            + "WHERE h.local_id = :localId AND h.data_saida IS NULL "
            + "GROUP BY ce.epc_id, e.nome "
            + "ORDER BY SUM(1.0 / nq.n) DESC, e.nome ASC", nativeQuery = true)
    List<Object[]> distribuicaoEpcAtivaPorLocalRaw(@Param("localId") Long localId);

    /** Mapeia o resultado nativo da distribuição por EPC para o DTO. */
    default List<DistribuicaoEpcResponse> distribuicaoEpcAtivaPorLocal(Long localId) {
        List<DistribuicaoEpcResponse> out = new ArrayList<>();
        for (Object[] r : distribuicaoEpcAtivaPorLocalRaw(localId)) {
            BigDecimal peso = r[3] instanceof BigDecimal bd ? bd : new BigDecimal(r[3].toString());
            out.add(new DistribuicaoEpcResponse(
                    ((Number) r[0]).longValue(),
                    (String) r[1],
                    ((Number) r[2]).longValue(),
                    peso));
        }
        return out;
    }
}
