package com.example.hospedagem.controller;

import com.example.hospedagem.dto.HospedagemEntradaRequest;
import com.example.hospedagem.dto.HospedagemFiltro;
import com.example.hospedagem.dto.HospedagemResponse;
import com.example.hospedagem.dto.HospedagemSaidaRequest;
import com.example.hospedagem.dto.OcupacaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.service.HospedagemService;
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
 * Endpoints REST do módulo Gestão de Hospedagem (entradas e saídas de colaboradores).
 */
@RestController
@RequestMapping("/api/hospedagens")
public class HospedagemController {

    private final HospedagemService service;

    public HospedagemController(HospedagemService service) {
        this.service = service;
    }

    /**
     * Lista hospedagens com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<HospedagemResponse> listar(
            @RequestParam(required = false) Long colaboradorId,
            @RequestParam(required = false) Long localId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entradaDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entradaAte,
            @PageableDefault(size = 10) Pageable pageable) {

        HospedagemFiltro filtro = new HospedagemFiltro(colaboradorId, localId, status, entradaDe, entradaAte);
        return service.buscar(filtro, pageable);
    }

    /**
     * Ocupação atual de cada local (capacidade x hospedagens ativas).
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/ocupacao")
    public List<OcupacaoResponse> ocupacao() {
        return service.ocupacao();
    }

    /**
     * Busca uma hospedagem por id.
     */
    @GetMapping("/{id}")
    public HospedagemResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Registra a entrada de um colaborador em um local.
     */
    @PostMapping
    public ResponseEntity<HospedagemResponse> darEntrada(
            @Valid @RequestBody HospedagemEntradaRequest request,
            UriComponentsBuilder uriBuilder) {

        HospedagemResponse criado = service.darEntrada(request);
        URI location = uriBuilder.path("/api/hospedagens/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Registra a saída (encerra) de uma hospedagem ativa.
     */
    @PutMapping("/{id}/saida")
    public HospedagemResponse darSaida(
            @PathVariable Long id,
            @Valid @RequestBody HospedagemSaidaRequest request) {
        return service.darSaida(id, request);
    }

    /**
     * Remove uma hospedagem (hard delete).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
