package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Local;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Consultas agregadas e paginadas do Painel. Ancorada em {@link Local} apenas para ser um
 * repositório Spring Data; as queries cruzam vários domínios (locais, hospedagens, gastos,
 * contratos, colaboradores). Cada listagem é nativa, com {@code countQuery} explícito e a
 * ordenação embutida na própria query (o {@link Pageable} recebido não traz sort).
 *
 * <p>Os blocos retornam {@code Object[]} (mapeados no {@code PainelService}), seguindo o
 * mesmo padrão já usado em {@code HospedagemRepository} para projeções nativas.
 */
@Repository
public interface PainelRepository extends JpaRepository<Local, Long> {

    // ----- Blocos paginados -----

    /** Ocupação por local: capacidade e hospedados ativos, do mais ocupado (% ) ao menos. */
    @Query(value = "SELECT l.id, l.nome, l.capacidade, COUNT(h.id) "
            + "FROM local l "
            + "LEFT JOIN hospedagem h ON h.local_id = l.id AND h.data_saida IS NULL "
            + "GROUP BY l.id, l.nome, l.capacidade "
            + "ORDER BY (CASE WHEN l.capacidade > 0 THEN COUNT(h.id) * 1.0 / l.capacidade ELSE 0 END) DESC, "
            + "l.nome ASC, l.id ASC",
            countQuery = "SELECT COUNT(*) FROM local",
            nativeQuery = true)
    Page<Object[]> ocupacaoPorLocal(Pageable pageable);

    /** Gastos por local (soma quantidade x valor) + hospedados ativos, do maior total ao menor. */
    @Query(value = "SELECT l.id, l.nome, SUM(g.quantidade * g.valor), "
            + "(SELECT COUNT(*) FROM hospedagem h WHERE h.local_id = l.id AND h.data_saida IS NULL) "
            + "FROM gasto g "
            + "JOIN local l ON l.id = g.local_id "
            + "GROUP BY l.id, l.nome "
            + "ORDER BY SUM(g.quantidade * g.valor) DESC, l.nome ASC, l.id ASC",
            countQuery = "SELECT COUNT(DISTINCT g.local_id) FROM gasto g",
            nativeQuery = true)
    Page<Object[]> gastosPorLocal(Pageable pageable);

    /** Contagem de colaboradores por função, da maior para a menor. */
    @Query(value = "SELECT f.nome, COUNT(c.id) "
            + "FROM colaborador c "
            + "JOIN funcao f ON f.id = c.funcao_id "
            + "GROUP BY f.nome "
            + "ORDER BY COUNT(c.id) DESC, f.nome ASC",
            countQuery = "SELECT COUNT(DISTINCT f.nome) FROM colaborador c JOIN funcao f ON f.id = c.funcao_id",
            nativeQuery = true)
    Page<Object[]> colaboradoresPorFuncao(Pageable pageable);

    /**
     * Alertas de contrato por local: locais SEM contrato vigente hoje ("sem") ou com contrato
     * vigente terminando até {@code :limite} ("vencendo"). Ordena "sem" primeiro, depois por
     * dias restantes crescente. Colunas: localId, localNome, tipo, dias, codigo.
     */
    @Query(value = "SELECT l.id, l.nome, "
            + "CASE WHEN v.data_fim IS NULL THEN 'sem' ELSE 'vencendo' END, "
            + "CASE WHEN v.data_fim IS NULL THEN 0 ELSE (v.data_fim - CAST(:hoje AS date)) END, "
            + "COALESCE(v.codigo, '') "
            + "FROM local l "
            + "LEFT JOIN LATERAL ("
            + "  SELECT c.data_fim, c.codigo FROM contrato c "
            + "  WHERE c.local_id = l.id AND c.data_inicio <= CAST(:hoje AS date) "
            + "    AND c.data_fim >= CAST(:hoje AS date) "
            + "  ORDER BY c.data_fim DESC LIMIT 1) v ON true "
            + "WHERE v.data_fim IS NULL OR v.data_fim <= CAST(:limite AS date) "
            + "ORDER BY (CASE WHEN v.data_fim IS NULL THEN -1 ELSE (v.data_fim - CAST(:hoje AS date)) END) ASC, "
            + "l.nome ASC, l.id ASC",
            countQuery = "SELECT COUNT(*) FROM local l "
            + "LEFT JOIN LATERAL ("
            + "  SELECT c.data_fim FROM contrato c "
            + "  WHERE c.local_id = l.id AND c.data_inicio <= CAST(:hoje AS date) "
            + "    AND c.data_fim >= CAST(:hoje AS date) "
            + "  ORDER BY c.data_fim DESC LIMIT 1) v ON true "
            + "WHERE v.data_fim IS NULL OR v.data_fim <= CAST(:limite AS date)",
            nativeQuery = true)
    Page<Object[]> alertasContratos(@Param("hoje") LocalDate hoje,
                                    @Param("limite") LocalDate limite,
                                    Pageable pageable);

    // ----- KPIs (agregados do cabeçalho) -----

    /** Soma das capacidades de todos os locais (total de vagas). */
    @Query("select coalesce(sum(l.capacidade), 0) from Local l")
    long somaCapacidade();

    /** Nº de contratos vigentes hoje. */
    @Query("select count(c) from Contrato c where c.dataInicio <= :hoje and c.dataFim >= :hoje")
    long contratosVigentes(@Param("hoje") LocalDate hoje);

    /** Nº de locais que têm pelo menos um contrato vigente hoje. */
    @Query("select count(distinct c.local.id) from Contrato c "
            + "where c.dataInicio <= :hoje and c.dataFim >= :hoje")
    long locaisComVigente(@Param("hoje") LocalDate hoje);

    /** Nº de locais com contrato vigente terminando em até {@code :limite}. */
    @Query("select count(distinct c.local.id) from Contrato c "
            + "where c.dataInicio <= :hoje and c.dataFim >= :hoje and c.dataFim <= :limite")
    long locaisVencendo(@Param("hoje") LocalDate hoje, @Param("limite") LocalDate limite);

    /** Soma geral de gastos (quantidade x valor) de todos os locais. */
    @Query("select coalesce(sum(g.quantidade * g.valor), 0) from Gasto g")
    BigDecimal gastoTotal();
}
