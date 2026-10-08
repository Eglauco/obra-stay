package com.example.hospedagem.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Chave composta da associação colaborador-EPC (par colaborador_id + epc_id). */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ColaboradorEpcId implements Serializable {

    @Column(name = "colaborador_id")
    private Long colaboradorId;

    @Column(name = "epc_id")
    private Long epcId;
}
