package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Colaborador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ColaboradorRepository
        extends JpaRepository<Colaborador, Long>, JpaSpecificationExecutor<Colaborador> {

    /** Verifica se já existe colaborador com o CPF informado (para bloquear duplicidade na criação). */
    boolean existsByCpf(String cpf);

    /** Verifica duplicidade de CPF ignorando o próprio registro (para atualização). */
    boolean existsByCpfAndIdNot(String cpf, Long id);
}
