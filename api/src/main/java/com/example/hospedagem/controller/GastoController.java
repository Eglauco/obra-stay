package com.example.hospedagem.controller;

import com.example.hospedagem.dto.GastoFiltro;
import com.example.hospedagem.dto.GastoRequest;
import com.example.hospedagem.dto.GastoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.ResumoGastoResponse;
import com.example.hospedagem.dto.TotalGastoResponse;
import com.example.hospedagem.service.GastoService;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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
 * Endpoints REST do módulo Gestão de Gastos (lançamentos de despesa por local).
 */
@RestController
@RequestMapping("/api/gastos")
public class GastoController {

    private final GastoService service;

    public GastoController(GastoService service) {
        this.service = service;
    }

    /**
     * Lista gastos com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<GastoResponse> listar(
            @RequestParam(required = false) Long localId,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataAte,
            @PageableDefault(size = 10) Pageable pageable) {

        GastoFiltro filtro = new GastoFiltro(localId, nome, dataDe, dataAte);
        return service.buscar(filtro, pageable);
    }

    /**
     * Total de gastos por local (card do mestre).
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/totais")
    public List<TotalGastoResponse> totais() {
        return service.totais();
    }

    /**
     * Resumo de gastos de um local: total geral e total do período (cabeçalho do detalhe).
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/resumo")
    public ResumoGastoResponse resumo(
            @RequestParam Long localId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataAte) {

        return service.resumo(localId, dataDe, dataAte);
    }

    /**
     * Busca um gasto por id.
     */
    @GetMapping("/{id}")
    public GastoResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Cria um gasto (lançamento de despesa).
     */
    @PostMapping
    public ResponseEntity<GastoResponse> criar(
            @Valid @RequestBody GastoRequest request,
            UriComponentsBuilder uriBuilder) {

        GastoResponse criado = service.criar(request);
        URI location = uriBuilder.path("/api/gastos/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Atualiza um gasto existente.
     */
    @PutMapping("/{id}")
    public GastoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody GastoRequest request) {
        return service.atualizar(id, request);
    }

    /**
     * Remove um gasto (hard delete).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
