package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Contrato;
import com.example.hospedagem.dto.VigenciaResponse;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ContratoRepository
        extends JpaRepository<Contrato, Long>, JpaSpecificationExecutor<Contrato> {

    /** Unicidade do código (case-insensitive), usado na criação. */
    boolean existsByCodigoIgnoreCase(String codigo);

    /** Unicidade do código (case-insensitive) ignorando o próprio contrato, usado na edição. */
    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, Long id);

    /**
     * Verifica se existe outro contrato do mesmo local cujo período se sobrepõe a [inicio, fim].
     * Dois períodos [a1,a2] e [b1,b2] se cruzam quando a1 &lt;= b2 AND b1 &lt;= a2.
     * Para criação use {@code id = -1}; para edição passe o id real (exclui a si próprio).
     */
    @Query("select (count(c) > 0) from Contrato c where c.local.id = :localId "
            + "and c.id <> :id and c.dataInicio <= :fim and c.dataFim >= :inicio")
    boolean existeSobreposicao(@Param("localId") Long localId,
                              @Param("inicio") LocalDate inicio,
                              @Param("fim") LocalDate fim,
                              @Param("id") Long id);

    /**
     * Contratos vigentes em uma data (contrato vigente hoje) por local,
     * projetados para o {@link VigenciaResponse} do card do local.
     */
    @Query("select new com.example.hospedagem.dto.VigenciaResponse("
            + "c.local.id, c.id, c.codigo, c.dataInicio, c.dataFim, c.locadora.nome) "
            + "from Contrato c where c.dataInicio <= :hoje and c.dataFim >= :hoje")
    List<VigenciaResponse> vigentesEm(@Param("hoje") LocalDate hoje);
}
