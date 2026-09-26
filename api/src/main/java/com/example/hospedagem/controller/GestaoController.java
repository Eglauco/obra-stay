package com.example.hospedagem.controller;

import com.example.hospedagem.dto.GestaoFiltro;
import com.example.hospedagem.dto.GestaoRequest;
import com.example.hospedagem.dto.GestaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.service.GestaoService;
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
 * Endpoints REST do módulo Gestões (ObraStay).
 */
@RestController
@RequestMapping("/api/gestoes")
public class GestaoController {

    private final GestaoService service;

    public GestaoController(GestaoService service) {
        this.service = service;
    }

    /**
     * Lista gestões com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<GestaoResponse> listar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @PageableDefault(size = 10, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {

        GestaoFiltro filtro = new GestaoFiltro(id, nome);
        return service.buscar(filtro, pageable);
    }

    /**
     * Todas as gestões (ordenadas por nome) para popular selects.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/opcoes")
    public List<GestaoResponse> opcoes() {
        return service.listarOpcoes();
    }

    /**
     * Exporta as gestões filtradas (sem paginação) para Excel.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome) {

        byte[] conteudo = service.exportar(new GestaoFiltro(id, nome));
        return PlanilhaExcel.resposta(conteudo, "gestoes");
    }

    /**
     * Busca uma gestão por id.
     */
    @GetMapping("/{id}")
    public GestaoResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Cria uma gestão.
     */
    @PostMapping
    public ResponseEntity<GestaoResponse> criar(
            @Valid @RequestBody GestaoRequest request,
            UriComponentsBuilder uriBuilder) {

        GestaoResponse criado = service.criar(request);
        URI location = uriBuilder.path("/api/gestoes/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Atualiza uma gestão existente.
     */
    @PutMapping("/{id}")
    public GestaoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody GestaoRequest request) {
        return service.atualizar(id, request);
    }

    /**
     * Remove uma gestão (hard delete).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
