package com.example.hospedagem.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * EPC de um colaborador com a PORCENTAGEM de participação dele nesse EPC.
 * A soma das porcentagens dos EPCs de um colaborador é sempre 100% (validado no serviço).
 * No rateio de gastos por EPC, cada pessoa contribui {@code percentual/100} para o seu EPC.
 */
@Entity
@Table(name = "colaborador_epc")
@Getter
@Setter
@NoArgsConstructor
public class ColaboradorEpc {

    @EmbeddedId
    private ColaboradorEpcId id = new ColaboradorEpcId();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("colaboradorId")
    @JoinColumn(name = "colaborador_id")
    private Colaborador colaborador;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @MapsId("epcId")
    @JoinColumn(name = "epc_id")
    private Epc epc;

    @Column(name = "percentual", nullable = false, precision = 5, scale = 2)
    private BigDecimal percentual;

    public ColaboradorEpc(Colaborador colaborador, Epc epc, BigDecimal percentual) {
        this.colaborador = colaborador;
        this.epc = epc;
        this.percentual = percentual;
    }
}
