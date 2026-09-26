package com.example.hospedagem.controller;

import com.example.hospedagem.dto.GastoFiltro;
import com.example.hospedagem.dto.GastoRequest;
import com.example.hospedagem.dto.GastoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.RateioGastoResponse;
import com.example.hospedagem.dto.RelatorioGastosResponse;
import com.example.hospedagem.dto.ResumoGastoResponse;
import com.example.hospedagem.dto.TotalGastoResponse;
import com.example.hospedagem.service.GastoService;
import com.example.hospedagem.util.PlanilhaExcel;
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

    /** Exporta os gastos do local (detalhe) para Excel, respeitando os filtros de período. */
    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false) Long localId,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataAte) {

        byte[] conteudo = service.exportar(new GastoFiltro(localId, nome, dataDe, dataAte));
        return PlanilhaExcel.resposta(conteudo, "gastos");
    }

    /** Exporta a grade de locais com o total gasto (respeita o filtro de nome). */
    @GetMapping("/exportar-locais")
    public ResponseEntity<byte[]> exportarLocais(@RequestParam(required = false) String nome) {
        return PlanilhaExcel.resposta(service.exportarLocais(nome), "gastos-locais");
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
     * Relatório de gastos do local (respeitando o período), com rateio por EPC e totais.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/relatorio")
    public RelatorioGastosResponse relatorio(
            @RequestParam Long localId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataAte) {

        return service.relatorio(localId, dataDe, dataAte);
    }

    /**
     * Busca um gasto por id.
     */
    @GetMapping("/{id}")
    public GastoResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Rateio do gasto por EPC (lista de divisão do custo).
     */
    @GetMapping("/{id}/rateio")
    public List<RateioGastoResponse> rateio(@PathVariable Long id) {
        return service.rateio(id);
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
