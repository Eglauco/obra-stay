package com.example.hospedagem.exception;

/**
 * Lançada quando uma regra de negócio é violada (ex.: colaborador já hospedado,
 * local sem vagas, hospedagem já encerrada). Resulta em HTTP 409 (Conflict).
 * Quando associada a um campo específico, {@code field} identifica-o para o front.
 */
public class RegraNegocioException extends RuntimeException {

    /** Campo relacionado à violação (pode ser null quando a regra não é de um campo específico). */
    private final String field;

    public RegraNegocioException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
