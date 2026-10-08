package com.example.hospedagem.specification;

import com.example.hospedagem.domain.LogAuditoria;
import com.example.hospedagem.dto.LogAuditoriaFiltro;
import com.example.hospedagem.util.Fusos;
import jakarta.persistence.criteria.Predicate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Predicados dinâmicos para consultar a trilha de auditoria.
 * Cada filtro é opcional; os presentes são combinados com AND.
 */
public final class LogAuditoriaSpecifications {

    private LogAuditoriaSpecifications() {
    }

    public static Specification<LogAuditoria> comFiltro(LogAuditoriaFiltro filtro) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();

            if (filtro != null) {
                if (StringUtils.hasText(filtro.q())) {
                    String padrao = "%" + filtro.q().trim().toLowerCase() + "%";
                    predicados.add(cb.or(
                            cb.like(cb.lower(root.get("usuarioEmail")), padrao),
                            cb.like(cb.lower(root.get("detalhe")), padrao)));
                }
                if (StringUtils.hasText(filtro.evento())) {
                    predicados.add(cb.equal(root.get("evento"), filtro.evento().trim().toUpperCase()));
                }
                if (filtro.sucesso() != null) {
                    predicados.add(cb.equal(root.get("sucesso"), filtro.sucesso()));
                }
                ZoneId zona = Fusos.zona(filtro.tz());
                if (filtro.de() != null) {
                    predicados.add(cb.greaterThanOrEqualTo(
                            root.get("dataHora"), Fusos.inicioDiaUtc(filtro.de(), zona)));
                }
                if (filtro.ate() != null) {
                    predicados.add(cb.lessThan(
                            root.get("dataHora"), Fusos.inicioDiaUtc(filtro.ate().plusDays(1), zona)));
                }
            }

            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
