package com.example.hospedagem.specification;

import com.example.hospedagem.domain.Contrato;
import com.example.hospedagem.dto.ContratoFiltro;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Predicados dinâmicos para filtrar contratos no banco.
 * Cada filtro é opcional; os presentes são combinados com AND.
 */
public final class ContratoSpecifications {

    private ContratoSpecifications() {
    }

    public static Specification<Contrato> comFiltro(ContratoFiltro filtro, LocalDate hoje) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicados = new ArrayList<>();

            if (filtro != null) {
                Long localId = filtro.localId();
                if (localId != null) {
                    predicados.add(cb.equal(root.get("local").get("id"), localId));
                }

                String codigo = filtro.codigo();
                if (StringUtils.hasText(codigo)) {
                    String padrao = "%" + codigo.trim().toLowerCase() + "%";
                    predicados.add(cb.like(cb.lower(root.get("codigo")), padrao));
                }

                String status = filtro.status();
                if (StringUtils.hasText(status)) {
                    String normalizado = status.trim().toUpperCase();
                    if ("VIGENTE".equals(normalizado)) {
                        predicados.add(cb.lessThanOrEqualTo(root.get("dataInicio"), hoje));
                        predicados.add(cb.greaterThanOrEqualTo(root.get("dataFim"), hoje));
                    } else if ("AGENDADO".equals(normalizado)) {
                        predicados.add(cb.greaterThan(root.get("dataInicio"), hoje));
                    } else if ("ENCERRADO".equals(normalizado)) {
                        predicados.add(cb.lessThan(root.get("dataFim"), hoje));
                    }
                }
            }

            return cb.and(predicados.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
}
