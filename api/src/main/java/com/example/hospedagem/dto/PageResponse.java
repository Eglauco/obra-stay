package com.example.hospedagem.dto;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * DTO de paginação estável (não expõe PageImpl do Spring diretamente).
 * Formato acordado no contrato de API.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last,
        int numberOfElements
) {

    /**
     * Constrói um {@link PageResponse} a partir de uma {@link Page} do Spring
     * e da lista de conteúdo já mapeada para o tipo de saída.
     */
    public static <T> PageResponse<T> of(Page<?> page, List<T> content) {
        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                content.size()
        );
    }
}
