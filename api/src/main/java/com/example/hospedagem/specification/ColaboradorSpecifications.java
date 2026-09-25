package com.example.hospedagem.specification;

import com.example.hospedagem.domain.Colaborador;
import com.example.hospedagem.domain.Sexo;
import com.example.hospedagem.dto.ColaboradorFiltro;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Predicados dinâmicos para filtrar colaboradores no banco.
 * Cada filtro é opcional; os presentes são combinados com AND.
 */
public final class ColaboradorSpecifications {

    private ColaboradorSpecifications() {
    }

    public static Specification<Colaborador> comFiltro(ColaboradorFiltro filtro) {
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

                Sexo sexo = filtro.sexo();
                if (sexo != null) {
                    predicados.add(cb.equal(root.get("sexo"), sexo));
                }

                Long funcaoId = filtro.funcaoId();
                if (funcaoId != null) {
                    predicados.add(cb.equal(root.get("funcao").get("id"), funcaoId));
                }
            }

            return cb.and(predicados.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
}
