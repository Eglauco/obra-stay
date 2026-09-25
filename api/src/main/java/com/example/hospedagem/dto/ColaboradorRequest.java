package com.example.hospedagem.dto;

import com.example.hospedagem.domain.Mdo;
import com.example.hospedagem.domain.Sexo;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CPF;

/**
 * Payload de entrada para criação e atualização de colaborador.
 */
public record ColaboradorRequest(

        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.")
        String nome,

        @NotNull(message = "O sexo é obrigatório.")
        Sexo sexo,

        @NotNull(message = "Selecione a classificação da mão de obra.")
        Mdo mdo,

        @NotBlank(message = "O CPF é obrigatório.")
        @CPF(message = "CPF inválido.")
        String cpf,

        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "E-mail inválido.")
        @Size(max = 160, message = "O e-mail deve ter no máximo 160 caracteres.")
        String email,

        @NotNull(message = "Selecione a função.")
        Long funcaoId,

        @NotNull(message = "Selecione o EPC.")
        Long epcId,

        @NotNull(message = "Selecione a empresa.")
        Long empresaId,

        @NotNull(message = "Selecione a gestão.")
        Long gestaoId
) {
}
