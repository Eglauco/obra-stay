package com.example.hospedagem.specification;

import com.example.hospedagem.domain.StatusLocal;
import com.example.hospedagem.dto.StatusLocalFiltro;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Predicados dinâmicos para filtrar Status dos Locais no banco.
 * Cada filtro é opcional; os presentes são combinados com AND.
 */
public final class StatusLocalSpecifications {

    private StatusLocalSpecifications() {
    }

    public static Specification<StatusLocal> comFiltro(StatusLocalFiltro filtro) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicados = new ArrayList<>();

            if (filtro != null) {
                Long id = filtro.id();
                if (id != null) {
                    predicados.add(cb.equal(root.get("id"), id));
                }

                String nome = filtro.nome();
                if (StringUtils.hasText(nome)) {
                    String padrao = "%" + nome.trim().toLowerCase() + "%";
                    predicados.add(cb.like(cb.lower(root.get("nome")), padrao));
                }

                Boolean hospedagemLiberada = filtro.hospedagemLiberada();
                if (hospedagemLiberada != null) {
                    predicados.add(cb.equal(root.get("hospedagemLiberada"), hospedagemLiberada));
                }
            }

            return cb.and(predicados.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
}
