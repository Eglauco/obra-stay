package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Gasto;
import com.example.hospedagem.dto.TotalGastoResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GastoRepository
        extends JpaRepository<Gasto, Long>, JpaSpecificationExecutor<Gasto> {

    /**
     * Total de gastos (soma de quantidade x valor) agrupado por local,
     * projetado para o {@link TotalGastoResponse} do card do mestre.
     */
    @Query("select new com.example.hospedagem.dto.TotalGastoResponse(g.local.id, "
            + "sum(g.quantidade * g.valor)) from Gasto g group by g.local.id")
    List<TotalGastoResponse> totaisPorLocal();

    /** Soma geral (quantidade x valor) de todos os gastos de um local. */
    @Query("select coalesce(sum(g.quantidade * g.valor), 0) from Gasto g "
            + "where g.local.id = :localId")
    BigDecimal somaGeral(@Param("localId") Long localId);

    /**
     * Soma (quantidade x valor) dos gastos de um local no período [de, ate];
     * cada limite é opcional (null ignora o respectivo lado).
     */
    @Query("select coalesce(sum(g.quantidade * g.valor), 0) from Gasto g "
            + "where g.local.id = :localId "
            + "and (:de is null or g.data >= :de) "
            + "and (:ate is null or g.data <= :ate)")
    BigDecimal somaPeriodo(@Param("localId") Long localId,
                           @Param("de") LocalDate de,
                           @Param("ate") LocalDate ate);
}
