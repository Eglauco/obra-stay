package com.example.hospedagem.controller;

import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.StatusLocalFiltro;
import com.example.hospedagem.dto.StatusLocalRequest;
import com.example.hospedagem.dto.StatusLocalResponse;
import com.example.hospedagem.service.StatusLocalService;
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
 * Endpoints REST do módulo Status dos Locais (ObraStay).
 */
@RestController
@RequestMapping("/api/status-locais")
public class StatusLocalController {

    private final StatusLocalService service;

    public StatusLocalController(StatusLocalService service) {
        this.service = service;
    }

    /**
     * Lista status com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<StatusLocalResponse> listar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Boolean hospedagemLiberada,
            @PageableDefault(size = 10, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {

        StatusLocalFiltro filtro = new StatusLocalFiltro(id, nome, hospedagemLiberada);
        return service.buscar(filtro, pageable);
    }

    /**
     * Todos os status (ordenados por nome) para popular selects.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/opcoes")
    public List<StatusLocalResponse> opcoes() {
        return service.listarOpcoes();
    }

    /**
     * Exporta os status filtrados (sem paginação) para Excel.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Boolean hospedagemLiberada) {

        byte[] conteudo = service.exportar(new StatusLocalFiltro(id, nome, hospedagemLiberada));
        return PlanilhaExcel.resposta(conteudo, "status-locais");
    }

    /**
     * Busca um status por id.
     */
    @GetMapping("/{id}")
    public StatusLocalResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Cria um status.
     */
    @PostMapping
    public ResponseEntity<StatusLocalResponse> criar(
            @Valid @RequestBody StatusLocalRequest request,
            UriComponentsBuilder uriBuilder) {

        StatusLocalResponse criado = service.criar(request);
        URI location = uriBuilder.path("/api/status-locais/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Atualiza um status existente.
     */
    @PutMapping("/{id}")
    public StatusLocalResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody StatusLocalRequest request) {
        return service.atualizar(id, request);
    }

    /**
     * Remove um status (bloqueado se houver locais usando-o).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
