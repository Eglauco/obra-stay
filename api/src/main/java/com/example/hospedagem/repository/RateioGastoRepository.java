package com.example.hospedagem.repository;

import com.example.hospedagem.domain.RateioGasto;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RateioGastoRepository extends JpaRepository<RateioGasto, Long> {

    /** Linhas de rateio de um gasto (maior valor primeiro). */
    List<RateioGasto> findByGastoIdOrderByValorDescIdAsc(Long gastoId);

    /** Remove o rateio de um gasto (para recalcular ao editar). */
    void deleteByGastoId(Long gastoId);
}
