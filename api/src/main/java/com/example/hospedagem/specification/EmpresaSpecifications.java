package com.example.hospedagem.specification;

import com.example.hospedagem.domain.Empresa;
import com.example.hospedagem.dto.EmpresaFiltro;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Predicados dinâmicos para filtrar empresas no banco.
 * Cada filtro é opcional; os presentes são combinados com AND.
 */
public final class EmpresaSpecifications {

    private EmpresaSpecifications() {
    }

    public static Specification<Empresa> comFiltro(EmpresaFiltro filtro) {
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
            }

            return cb.and(predicados.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
}
