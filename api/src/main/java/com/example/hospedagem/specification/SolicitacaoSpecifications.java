package com.example.hospedagem.specification;

import com.example.hospedagem.domain.Solicitacao;
import com.example.hospedagem.dto.SolicitacaoFiltro;
import com.example.hospedagem.util.Fusos;
import jakarta.persistence.criteria.Predicate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

/**
 * Predicados dinâmicos para filtrar solicitações no banco.
 * Cada filtro é opcional; os presentes são combinados com AND.
 */
public final class SolicitacaoSpecifications {

    private SolicitacaoSpecifications() {
    }

    public static Specification<Solicitacao> comFiltro(SolicitacaoFiltro filtro) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();

            if (filtro != null) {
                if (filtro.status() != null) {
                    predicados.add(cb.equal(root.get("status"), filtro.status()));
                }
                if (filtro.tipoSolicitacaoId() != null) {
                    predicados.add(cb.equal(root.get("tipoSolicitacao").get("id"), filtro.tipoSolicitacaoId()));
                }
                if (filtro.colaboradorId() != null) {
                    predicados.add(cb.equal(root.get("colaborador").get("id"), filtro.colaboradorId()));
                }
                if (filtro.localId() != null) {
                    predicados.add(cb.equal(root.get("local").get("id"), filtro.localId()));
                }
                ZoneId zona = Fusos.zona(filtro.tz());
                if (filtro.aberturaDe() != null) {
                    predicados.add(cb.greaterThanOrEqualTo(
                            root.get("dataHoraAbertura"), Fusos.inicioDiaUtc(filtro.aberturaDe(), zona)));
                }
                if (filtro.aberturaAte() != null) {
                    predicados.add(cb.lessThan(
                            root.get("dataHoraAbertura"), Fusos.inicioDiaUtc(filtro.aberturaAte().plusDays(1), zona)));
                }
            }

            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
