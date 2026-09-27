package com.example.hospedagem.controller;

import com.example.hospedagem.dto.OrcamentoMobiliarioFiltro;
import com.example.hospedagem.dto.OrcamentoMobiliarioRequest;
import com.example.hospedagem.dto.OrcamentoMobiliarioResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.ResumoRef;
import com.example.hospedagem.service.OrcamentoMobiliarioService;
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
 * Endpoints REST do módulo Orçamento de Mobiliário (ObraStay).
 */
@RestController
@RequestMapping("/api/orcamentos-mobiliario")
public class OrcamentoMobiliarioController {

    private final OrcamentoMobiliarioService service;

    public OrcamentoMobiliarioController(OrcamentoMobiliarioService service) {
        this.service = service;
    }

    /**
     * Lista orçamentos com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<OrcamentoMobiliarioResponse> listar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @PageableDefault(size = 10, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {

        OrcamentoMobiliarioFiltro filtro = new OrcamentoMobiliarioFiltro(id, nome);
        return service.buscar(filtro, pageable);
    }

    /**
     * Exporta os orçamentos filtrados (sem paginação) para Excel.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome) {

        byte[] conteudo = service.exportar(new OrcamentoMobiliarioFiltro(id, nome));
        return PlanilhaExcel.resposta(conteudo, "orcamentos-mobiliario");
    }

    /**
     * Orçamentos (id + nome) para popular selects.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/opcoes")
    public List<ResumoRef> opcoes() {
        return service.listarOpcoes();
    }

    /**
     * Busca um orçamento por id (com seus itens).
     */
    @GetMapping("/{id}")
    public OrcamentoMobiliarioResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Cria um orçamento com seus itens.
     */
    @PostMapping
    public ResponseEntity<OrcamentoMobiliarioResponse> criar(
            @Valid @RequestBody OrcamentoMobiliarioRequest request,
            UriComponentsBuilder uriBuilder) {

        OrcamentoMobiliarioResponse criado = service.criar(request);
        URI location = uriBuilder.path("/api/orcamentos-mobiliario/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Atualiza um orçamento existente (substitui a lista de itens).
     */
    @PutMapping("/{id}")
    public OrcamentoMobiliarioResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody OrcamentoMobiliarioRequest request) {
        return service.atualizar(id, request);
    }

    /**
     * Remove um orçamento (e seus itens, via cascade).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
