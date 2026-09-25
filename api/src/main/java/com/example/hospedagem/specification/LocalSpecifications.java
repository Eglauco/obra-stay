package com.example.hospedagem.specification;

import com.example.hospedagem.domain.Local;
import com.example.hospedagem.dto.LocalFiltro;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Predicados dinâmicos para filtrar locais no banco.
 * Cada filtro é opcional; os presentes são combinados com AND.
 */
public final class LocalSpecifications {

    private LocalSpecifications() {
    }

    public static Specification<Local> comFiltro(LocalFiltro filtro) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicados = new ArrayList<>();

            if (filtro != null) {
                Long id = filtro.id();
                if (id != null) {
                    predicados.add(cb.equal(root.get("id"), id));
                }

                String codigo = filtro.codigo();
                if (StringUtils.hasText(codigo)) {
                    String padrao = "%" + codigo.trim().toLowerCase() + "%";
                    predicados.add(cb.like(cb.lower(root.get("codigo")), padrao));
                }

                String nome = filtro.nome();
                if (StringUtils.hasText(nome)) {
                    String padrao = "%" + nome.trim().toLowerCase() + "%";
                    predicados.add(cb.like(cb.lower(root.get("nome")), padrao));
                }

                String cidade = filtro.cidade();
                if (StringUtils.hasText(cidade)) {
                    String padrao = "%" + cidade.trim().toLowerCase() + "%";
                    predicados.add(cb.like(cb.lower(root.get("cidade")), padrao));
                }
            }

            return cb.and(predicados.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
}
