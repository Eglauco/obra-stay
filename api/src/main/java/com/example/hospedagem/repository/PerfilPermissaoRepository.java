package com.example.hospedagem.repository;

import com.example.hospedagem.domain.PerfilPermissao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PerfilPermissaoRepository extends JpaRepository<PerfilPermissao, Long> {

    boolean existsByPerfilId(Long perfilId);
}
