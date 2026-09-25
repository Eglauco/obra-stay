package com.example.hospedagem.controller;

import com.example.hospedagem.dto.LocadoraFiltro;
import com.example.hospedagem.dto.LocadoraRequest;
import com.example.hospedagem.dto.LocadoraResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.service.LocadoraService;
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
 * Endpoints REST do módulo Locadoras (ObraStay).
 */
@RestController
@RequestMapping("/api/locadoras")
public class LocadoraController {

    private final LocadoraService service;

    public LocadoraController(LocadoraService service) {
        this.service = service;
    }

    /**
     * Lista locadoras com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<LocadoraResponse> listar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @PageableDefault(size = 10, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {

        LocadoraFiltro filtro = new LocadoraFiltro(id, nome);
        return service.buscar(filtro, pageable);
    }

    /**
     * Todas as locadoras (ordenadas por nome) para popular selects.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/opcoes")
    public List<LocadoraResponse> opcoes() {
        return service.listarOpcoes();
    }

    /**
     * Busca uma locadora por id.
     */
    @GetMapping("/{id}")
    public LocadoraResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Cria uma locadora.
     */
    @PostMapping
    public ResponseEntity<LocadoraResponse> criar(
            @Valid @RequestBody LocadoraRequest request,
            UriComponentsBuilder uriBuilder) {

        LocadoraResponse criado = service.criar(request);
        URI location = uriBuilder.path("/api/locadoras/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Atualiza uma locadora existente.
     */
    @PutMapping("/{id}")
    public LocadoraResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody LocadoraRequest request) {
        return service.atualizar(id, request);
    }

    /**
     * Remove uma locadora (hard delete).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
