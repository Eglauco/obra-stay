package com.example.hospedagem.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Local de acomodação (alojamentos, casas, hotéis) do módulo Locais.
 */
@Entity
@Table(name = "local")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Local {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", nullable = false, length = 30, unique = true)
    private String codigo;

    @Column(name = "nome", nullable = false, length = 120)
    private String nome;

    @Column(name = "capacidade", nullable = false)
    private Integer capacidade;

    @Column(name = "cep", nullable = false, length = 9)
    private String cep;

    @Column(name = "logradouro", nullable = false, length = 150)
    private String logradouro;

    @Column(name = "numero", nullable = false, length = 20)
    private String numero;

    @Column(name = "complemento", length = 100)
    private String complemento;

    @Column(name = "bairro", nullable = false, length = 100)
    private String bairro;

    @Column(name = "cidade", nullable = false, length = 100)
    private String cidade;

    @Column(name = "uf", nullable = false, length = 2)
    private String uf;

    /** Quantidade de quartos do local (base da regra de mobiliário). */
    @Column(name = "quartos", nullable = false)
    private Integer quartos;

    /** Valor do aluguel mensal do local (0 quando não informado). */
    @Column(name = "valor_aluguel", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorAluguel;

    /** Chave do objeto da foto no storage (S3/MinIO). Nulo = sem foto. */
    @Column(name = "foto_key", length = 255)
    private String fotoKey;

    /** Status atual do local (define se novas hospedagens estão liberadas). Obrigatório. */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private StatusLocal status;

    /** Itens de mobília do local (cópia editável, geralmente vinda de um Orçamento). */
    @OneToMany(mappedBy = "local", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC, id ASC")
    @Builder.Default
    private List<ItemMobiliaLocal> itensMobilia = new ArrayList<>();

    /** Adiciona um item de mobília mantendo os dois lados da associação em sincronia. */
    public void addItemMobilia(ItemMobiliaLocal item) {
        item.setLocal(this);
        this.itensMobilia.add(item);
    }

    /** Remove todos os itens de mobília (usado ao recadastrar a lista em uma edição). */
    public void limparItensMobilia() {
        this.itensMobilia.clear();
    }
}
