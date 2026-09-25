package com.example.hospedagem.exception;

/**
 * Lançada quando um recurso solicitado não existe.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
