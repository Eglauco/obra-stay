package com.example.hospedagem.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Orçamento de Mobiliário: um conjunto nomeado de itens (móveis/eletros) usado para
 * mobiliar uma casa. Cada {@link ItemOrcamentoMobiliario} define quanto é fixo na casa
 * e quanto é por quarto, base para a simulação de custo por nº de quartos (regra futura).
 */
@Entity
@Table(name = "orcamento_mobiliario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrcamentoMobiliario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false, length = 120)
    private String nome;

    @Column(name = "descricao", length = 500)
    private String descricao;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC, id ASC")
    @Builder.Default
    private List<ItemOrcamentoMobiliario> itens = new ArrayList<>();

    /** Adiciona um item mantendo os dois lados da associação em sincronia. */
    public void addItem(ItemOrcamentoMobiliario item) {
        item.setOrcamento(this);
        this.itens.add(item);
    }

    /** Remove todos os itens (usado ao recadastrar a lista em uma edição). */
    public void limparItens() {
        this.itens.clear();
    }
}
