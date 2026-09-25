package com.example.hospedagem.specification;

import com.example.hospedagem.domain.Hospedagem;
import com.example.hospedagem.dto.HospedagemFiltro;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Predicados dinâmicos para filtrar hospedagens no banco.
 * Cada filtro é opcional; os presentes são combinados com AND.
 */
public final class HospedagemSpecifications {

    private HospedagemSpecifications() {
    }

    public static Specification<Hospedagem> comFiltro(HospedagemFiltro filtro) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicados = new ArrayList<>();

            if (filtro != null) {
                Long colaboradorId = filtro.colaboradorId();
                if (colaboradorId != null) {
                    predicados.add(cb.equal(root.get("colaborador").get("id"), colaboradorId));
                }

                Long localId = filtro.localId();
                if (localId != null) {
                    predicados.add(cb.equal(root.get("local").get("id"), localId));
                }

                String status = filtro.status();
                if (StringUtils.hasText(status)) {
                    String normalizado = status.trim().toUpperCase();
                    if ("ATIVA".equals(normalizado)) {
                        predicados.add(cb.isNull(root.get("dataSaida")));
                    } else if ("ENCERRADA".equals(normalizado)) {
                        predicados.add(cb.isNotNull(root.get("dataSaida")));
                    }
                }

                if (filtro.entradaDe() != null) {
                    predicados.add(cb.greaterThanOrEqualTo(root.get("dataEntrada"), filtro.entradaDe()));
                }

                if (filtro.entradaAte() != null) {
                    predicados.add(cb.lessThanOrEqualTo(root.get("dataEntrada"), filtro.entradaAte()));
                }
            }

            return cb.and(predicados.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
}
