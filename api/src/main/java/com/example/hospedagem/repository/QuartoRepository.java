package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Quarto;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuartoRepository extends JpaRepository<Quarto, Long> {

    List<Quarto> findByLocalIdOrderByOrdemAscIdAsc(Long localId);
}
