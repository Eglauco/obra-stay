package com.example.hospedagem.exception;

/** Erro ao falar com o storage de arquivos (S3/MinIO). */
public class StorageException extends RuntimeException {

    public StorageException(String message, Throwable cause) {
        super(message, cause);
    }

    public StorageException(String message) {
        super(message);
    }
}
