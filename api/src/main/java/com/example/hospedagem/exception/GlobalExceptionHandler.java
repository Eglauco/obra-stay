package com.example.hospedagem.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Tratamento centralizado de exceções, retornando o corpo padronizado de erro (pt-BR).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Falhas de validação de bean validation (@Valid nos bodies) -> 400 com fieldErrors.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex,
                                                     HttpServletRequest request) {
        List<ApiError.FieldErrorItem> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiError.FieldErrorItem(
                        fe.getField(),
                        fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Valor inválido."))
                .toList();

        ApiError body = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                "Requisição inválida",
                "Há campos inválidos.",
                request.getRequestURI(),
                fieldErrors);

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Código de local já existente -> 400 com fieldErrors no campo "codigo".
     */
    @ExceptionHandler(DuplicateCodigoException.class)
    public ResponseEntity<ApiError> handleDuplicateCodigo(DuplicateCodigoException ex,
                                                          HttpServletRequest request) {
        List<ApiError.FieldErrorItem> fieldErrors = List.of(
                new ApiError.FieldErrorItem("codigo", "Já existe um local com este código."));

        ApiError body = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                "Requisição inválida",
                "Há campos inválidos.",
                request.getRequestURI(),
                fieldErrors);

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Violação de regra de negócio (ex.: colaborador já hospedado, local sem vagas,
     * hospedagem já encerrada) -> 409. Quando associada a um campo, inclui fieldErrors.
     */
    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ApiError> handleRegraNegocio(RegraNegocioException ex,
                                                       HttpServletRequest request) {
        List<ApiError.FieldErrorItem> fieldErrors = ex.getField() != null
                ? List.of(new ApiError.FieldErrorItem(ex.getField(), ex.getMessage()))
                : List.of();

        ApiError body = ApiError.of(
                HttpStatus.CONFLICT.value(),
                "Conflito",
                ex.getMessage(),
                request.getRequestURI(),
                fieldErrors);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * Recurso inexistente -> 404.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex,
                                                   HttpServletRequest request) {
        ApiError body = ApiError.of(
                HttpStatus.NOT_FOUND.value(),
                "Não encontrado",
                ex.getMessage(),
                request.getRequestURI());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    /**
     * Parâmetro com tipo inválido (ex.: sexo=OUTRO, id=abc) -> 400.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                       HttpServletRequest request) {
        String message = "O parâmetro '" + ex.getName() + "' possui um valor inválido.";
        ApiError body = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                "Requisição inválida",
                message,
                request.getRequestURI());

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Parâmetro obrigatório ausente -> 400.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParam(MissingServletRequestParameterException ex,
                                                       HttpServletRequest request) {
        String message = "O parâmetro '" + ex.getParameterName() + "' é obrigatório.";
        ApiError body = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                "Requisição inválida",
                message,
                request.getRequestURI());

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Corpo JSON malformado ou com valor de enum inválido -> 400.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleNotReadable(HttpMessageNotReadableException ex,
                                                      HttpServletRequest request) {
        ApiError body = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                "Requisição inválida",
                "O corpo da requisição está malformado ou possui valores inválidos.",
                request.getRequestURI());

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Violação de integridade referencial (ex.: excluir função com colaboradores vinculados) -> 409.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException ex,
                                                        HttpServletRequest request) {
        ApiError body = ApiError.of(
                HttpStatus.CONFLICT.value(),
                "Conflito",
                "Não é possível excluir: existem colaboradores vinculados a esta função.",
                request.getRequestURI());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * Qualquer erro não tratado -> 500 com mensagem neutra.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex, HttpServletRequest request) {
        ApiError body = ApiError.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Erro interno",
                "Ocorreu um erro inesperado. Tente novamente mais tarde.",
                request.getRequestURI());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
