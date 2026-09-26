package com.example.hospedagem.controller;

import com.example.hospedagem.domain.Sexo;
import com.example.hospedagem.dto.ColaboradorFiltro;
import com.example.hospedagem.dto.ColaboradorRequest;
import com.example.hospedagem.dto.ColaboradorResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.service.ColaboradorService;
import com.example.hospedagem.util.PlanilhaExcel;
import jakarta.validation.Valid;
import java.net.URI;
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
 * Endpoints REST do módulo Colaboradores (ObraStay).
 */
@RestController
@RequestMapping("/api/colaboradores")
public class ColaboradorController {

    private final ColaboradorService service;

    public ColaboradorController(ColaboradorService service) {
        this.service = service;
    }

    /**
     * Lista colaboradores com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<ColaboradorResponse> listar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Sexo sexo,
            @RequestParam(required = false) Long funcaoId,
            @PageableDefault(size = 10, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {

        ColaboradorFiltro filtro = new ColaboradorFiltro(id, nome, sexo, funcaoId);
        return service.buscar(filtro, pageable);
    }

    /**
     * Lista todos os colaboradores (ordenados por nome) para popular selects/dropdowns.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/opcoes")
    public java.util.List<ColaboradorResponse> opcoes() {
        return service.listarOpcoes();
    }

    /**
     * Exporta os colaboradores filtrados (sem paginação) para Excel.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Sexo sexo,
            @RequestParam(required = false) Long funcaoId) {

        byte[] conteudo = service.exportar(new ColaboradorFiltro(id, nome, sexo, funcaoId));
        return PlanilhaExcel.resposta(conteudo, "colaboradores");
    }

    /**
     * Busca um colaborador por id.
     */
    @GetMapping("/{id}")
    public ColaboradorResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Cria um colaborador.
     */
    @PostMapping
    public ResponseEntity<ColaboradorResponse> criar(
            @Valid @RequestBody ColaboradorRequest request,
            UriComponentsBuilder uriBuilder) {

        ColaboradorResponse criado = service.criar(request);
        URI location = uriBuilder.path("/api/colaboradores/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Atualiza um colaborador existente.
     */
    @PutMapping("/{id}")
    public ColaboradorResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ColaboradorRequest request) {
        return service.atualizar(id, request);
    }

    /**
     * Remove um colaborador (hard delete).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
