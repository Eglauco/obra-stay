package com.example.hospedagem.controller;

import com.example.hospedagem.dto.EpcFiltro;
import com.example.hospedagem.dto.EpcRequest;
import com.example.hospedagem.dto.EpcResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.service.EpcService;
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
 * Endpoints REST do módulo EPC (ObraStay).
 */
@RestController
@RequestMapping("/api/epcs")
public class EpcController {

    private final EpcService service;

    public EpcController(EpcService service) {
        this.service = service;
    }

    /**
     * Lista EPCs com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<EpcResponse> listar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @PageableDefault(size = 10, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {

        EpcFiltro filtro = new EpcFiltro(id, nome);
        return service.buscar(filtro, pageable);
    }

    /**
     * Todos os EPCs (ordenados por nome) para popular selects.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/opcoes")
    public List<EpcResponse> opcoes() {
        return service.listarOpcoes();
    }

    /**
     * Exporta os EPCs filtrados (sem paginação) para Excel.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome) {

        byte[] conteudo = service.exportar(new EpcFiltro(id, nome));
        return PlanilhaExcel.resposta(conteudo, "epcs");
    }

    /**
     * Busca um EPC por id.
     */
    @GetMapping("/{id}")
    public EpcResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Cria um EPC.
     */
    @PostMapping
    public ResponseEntity<EpcResponse> criar(
            @Valid @RequestBody EpcRequest request,
            UriComponentsBuilder uriBuilder) {

        EpcResponse criado = service.criar(request);
        URI location = uriBuilder.path("/api/epcs/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Atualiza um EPC existente.
     */
    @PutMapping("/{id}")
    public EpcResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody EpcRequest request) {
        return service.atualizar(id, request);
    }

    /**
     * Remove um EPC (hard delete).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
