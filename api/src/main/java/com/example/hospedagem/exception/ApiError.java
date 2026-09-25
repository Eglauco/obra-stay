package com.example.hospedagem.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Corpo padronizado de erro retornado pela API (pt-BR).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        @JsonInclude(JsonInclude.Include.NON_EMPTY)
        List<FieldErrorItem> fieldErrors
) {

    public record FieldErrorItem(String field, String message) {
    }

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(LocalDateTime.now(), status, error, message, path, List.of());
    }

    public static ApiError of(int status, String error, String message, String path,
                              List<FieldErrorItem> fieldErrors) {
        return new ApiError(LocalDateTime.now(), status, error, message, path, fieldErrors);
    }
}
