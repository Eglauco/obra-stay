package com.example.hospedagem.controller;

import com.example.hospedagem.dto.EmpresaFiltro;
import com.example.hospedagem.dto.EmpresaRequest;
import com.example.hospedagem.dto.EmpresaResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.service.EmpresaService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Endpoints REST do módulo Empresas (ObraStay).
 */
@RestController
@RequestMapping("/api/empresas")
public class EmpresaController {

    private final EmpresaService service;

    public EmpresaController(EmpresaService service) {
        this.service = service;
    }

    /**
     * Lista empresas com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<EmpresaResponse> listar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @PageableDefault(size = 10, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {

        EmpresaFiltro filtro = new EmpresaFiltro(id, nome);
        return service.buscar(filtro, pageable);
    }

    /**
     * Todas as empresas (ordenadas por nome) para popular selects.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/opcoes")
    public List<EmpresaResponse> opcoes() {
        return service.listarOpcoes();
    }

    /**
     * Busca uma empresa por id.
     */
    @GetMapping("/{id}")
    public EmpresaResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Cria uma empresa.
     */
    @PostMapping
    public ResponseEntity<EmpresaResponse> criar(
            @Valid @RequestBody EmpresaRequest request,
            UriComponentsBuilder uriBuilder) {

        EmpresaResponse criado = service.criar(request);
        URI location = uriBuilder.path("/api/empresas/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Atualiza uma empresa existente.
     */
    @PutMapping("/{id}")
    public EmpresaResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody EmpresaRequest request) {
        return service.atualizar(id, request);
    }

    /**
     * Remove uma empresa (hard delete).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
