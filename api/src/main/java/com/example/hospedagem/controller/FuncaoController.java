package com.example.hospedagem.controller;

import com.example.hospedagem.dto.FuncaoFiltro;
import com.example.hospedagem.dto.FuncaoRequest;
import com.example.hospedagem.dto.FuncaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.service.FuncaoService;
import com.example.hospedagem.util.PlanilhaExcel;
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
 * Endpoints REST do módulo Funções (ObraStay).
 */
@RestController
@RequestMapping("/api/funcoes")
public class FuncaoController {

    private final FuncaoService service;

    public FuncaoController(FuncaoService service) {
        this.service = service;
    }

    /**
     * Lista funções com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<FuncaoResponse> listar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @PageableDefault(size = 10, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {

        FuncaoFiltro filtro = new FuncaoFiltro(id, nome);
        return service.buscar(filtro, pageable);
    }

    /**
     * Lista todas as funções ordenadas por nome (para selects).
     * Declarado ANTES de "/{id}" para evitar ambiguidade de rota.
     */
    @GetMapping("/opcoes")
    public List<FuncaoResponse> opcoes() {
        return service.listarOpcoes();
    }

    /**
     * Exporta as funções filtradas (sem paginação) para Excel.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome) {

        byte[] conteudo = service.exportar(new FuncaoFiltro(id, nome));
        return PlanilhaExcel.resposta(conteudo, "funcoes");
    }

    /**
     * Busca uma função por id.
     */
    @GetMapping("/{id}")
    public FuncaoResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Cria uma função.
     */
    @PostMapping
    public ResponseEntity<FuncaoResponse> criar(
            @Valid @RequestBody FuncaoRequest request,
            UriComponentsBuilder uriBuilder) {

        FuncaoResponse criado = service.criar(request);
        URI location = uriBuilder.path("/api/funcoes/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Atualiza uma função existente.
     */
    @PutMapping("/{id}")
    public FuncaoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody FuncaoRequest request) {
        return service.atualizar(id, request);
    }

    /**
     * Remove uma função (hard delete).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
