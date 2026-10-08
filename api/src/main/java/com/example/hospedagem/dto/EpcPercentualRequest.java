package com.example.hospedagem.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Um EPC do colaborador com a sua porcentagem. A soma das porcentagens de um colaborador
 * deve ser 100% (validado no serviço).
 */
public record EpcPercentualRequest(

        @NotNull(message = "Selecione o EPC.")
        Long epcId,

        @NotNull(message = "Informe a porcentagem do EPC.")
        @DecimalMin(value = "0.01", message = "A porcentagem deve ser maior que zero.")
        @DecimalMax(value = "100.00", message = "A porcentagem não pode passar de 100%.")
        @Digits(integer = 3, fraction = 2, message = "A porcentagem aceita no máximo 2 casas decimais.")
        BigDecimal percentual
) {
}
