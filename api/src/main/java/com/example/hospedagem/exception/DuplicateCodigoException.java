package com.example.hospedagem.exception;

/**
 * Lançada quando se tenta criar/atualizar um local com código já existente.
 */
public class DuplicateCodigoException extends RuntimeException {

    public DuplicateCodigoException(String message) {
        super(message);
    }
}
