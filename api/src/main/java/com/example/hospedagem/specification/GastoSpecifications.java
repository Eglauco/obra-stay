package com.example.hospedagem.specification;

import com.example.hospedagem.domain.Gasto;
import com.example.hospedagem.dto.GastoFiltro;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Predicados dinâmicos para filtrar gastos no banco.
 * Cada filtro é opcional; os presentes são combinados com AND.
 */
public final class GastoSpecifications {

    private GastoSpecifications() {
    }

    public static Specification<Gasto> comFiltro(GastoFiltro filtro) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicados = new ArrayList<>();

            if (filtro != null) {
                Long localId = filtro.localId();
                if (localId != null) {
                    predicados.add(cb.equal(root.get("local").get("id"), localId));
                }

                String nome = filtro.nome();
                if (StringUtils.hasText(nome)) {
                    String padrao = "%" + nome.trim().toLowerCase() + "%";
                    predicados.add(cb.like(cb.lower(root.get("nome")), padrao));
                }

                if (filtro.dataDe() != null) {
                    predicados.add(cb.greaterThanOrEqualTo(root.get("data"), filtro.dataDe()));
                }

                if (filtro.dataAte() != null) {
                    predicados.add(cb.lessThanOrEqualTo(root.get("data"), filtro.dataAte()));
                }
            }

            return cb.and(predicados.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
}
