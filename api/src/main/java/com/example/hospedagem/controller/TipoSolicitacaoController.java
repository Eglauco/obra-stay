package com.example.hospedagem.controller;

import com.example.hospedagem.dto.TipoSolicitacaoFiltro;
import com.example.hospedagem.dto.TipoSolicitacaoRequest;
import com.example.hospedagem.dto.TipoSolicitacaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.service.TipoSolicitacaoService;
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
 * Endpoints REST do módulo Tipos de Solicitação (ObraStay).
 */
@RestController
@RequestMapping("/api/tipos-solicitacao")
public class TipoSolicitacaoController {

    private final TipoSolicitacaoService service;

    public TipoSolicitacaoController(TipoSolicitacaoService service) {
        this.service = service;
    }

    /**
     * Lista tipos de solicitação com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<TipoSolicitacaoResponse> listar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @PageableDefault(size = 10, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {

        TipoSolicitacaoFiltro filtro = new TipoSolicitacaoFiltro(id, nome);
        return service.buscar(filtro, pageable);
    }

    /**
     * Todos os tipos de solicitação (ordenados por nome) para popular selects.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/opcoes")
    public List<TipoSolicitacaoResponse> opcoes() {
        return service.listarOpcoes();
    }

    /**
     * Busca um tipo de solicitação por id.
     */
    @GetMapping("/{id}")
    public TipoSolicitacaoResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Cria um tipo de solicitação.
     */
    @PostMapping
    public ResponseEntity<TipoSolicitacaoResponse> criar(
            @Valid @RequestBody TipoSolicitacaoRequest request,
            UriComponentsBuilder uriBuilder) {

        TipoSolicitacaoResponse criado = service.criar(request);
        URI location = uriBuilder.path("/api/tipos-solicitacao/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Atualiza um tipo de solicitação existente.
     */
    @PutMapping("/{id}")
    public TipoSolicitacaoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody TipoSolicitacaoRequest request) {
        return service.atualizar(id, request);
    }

    /**
     * Remove um tipo de solicitação (hard delete).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
