package com.example.hospedagem.controller;

import com.example.hospedagem.domain.StatusSolicitacao;
import com.example.hospedagem.dto.AcompanharSolicitacaoRequest;
import com.example.hospedagem.dto.HistoricoPublicaRequest;
import com.example.hospedagem.dto.HistoricoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.SolicitacaoFiltro;
import com.example.hospedagem.dto.SolicitacaoPublicaRequest;
import com.example.hospedagem.dto.SolicitacaoRequest;
import com.example.hospedagem.dto.SolicitacaoResponse;
import com.example.hospedagem.dto.TransicaoStatusRequest;
import com.example.hospedagem.service.SolicitacaoService;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
 * Endpoints REST do módulo Solicitações (ObraStay).
 */
@RestController
@RequestMapping("/api/solicitacoes")
public class SolicitacaoController {

    private final SolicitacaoService service;

    public SolicitacaoController(SolicitacaoService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<SolicitacaoResponse> listar(
            @RequestParam(required = false) StatusSolicitacao status,
            @RequestParam(required = false) Long tipoSolicitacaoId,
            @RequestParam(required = false) Long colaboradorId,
            @RequestParam(required = false) Long localId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate aberturaDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate aberturaAte,
            @PageableDefault(size = 10, sort = "dataHoraAbertura", direction = Sort.Direction.DESC) Pageable pageable) {

        SolicitacaoFiltro filtro = new SolicitacaoFiltro(
                status, tipoSolicitacaoId, colaboradorId, localId, aberturaDe, aberturaAte);
        return service.buscar(filtro, pageable);
    }

    @GetMapping("/{id}")
    public SolicitacaoResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    @PostMapping
    public ResponseEntity<SolicitacaoResponse> criar(
            @Valid @RequestBody SolicitacaoRequest request,
            UriComponentsBuilder uriBuilder) {

        SolicitacaoResponse criado = service.criar(request);
        URI location = uriBuilder.path("/api/solicitacoes/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    @PutMapping("/{id}")
    public SolicitacaoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody SolicitacaoRequest request) {
        return service.atualizar(id, request);
    }

    /** Abertura de solicitação pelo quiosque (QR Code), identificando o colaborador por CPF. */
    @PostMapping("/publica")
    public ResponseEntity<SolicitacaoResponse> criarPublica(
            @Valid @RequestBody SolicitacaoPublicaRequest request,
            UriComponentsBuilder uriBuilder) {

        SolicitacaoResponse criado = service.criarPublica(request);
        URI location = uriBuilder.path("/api/solicitacoes/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /** Acompanhamento pelo quiosque: solicitações em aberto do colaborador (por CPF). */
    @PostMapping("/publica/acompanhar")
    public List<SolicitacaoResponse> acompanharPublica(
            @Valid @RequestBody AcompanharSolicitacaoRequest request) {
        return service.acompanharPublica(request.cpf());
    }

    // ----- transições de status (observação opcional -> histórico) -----

    @PutMapping("/{id}/iniciar")
    public SolicitacaoResponse iniciar(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) TransicaoStatusRequest request) {
        return service.iniciar(id, observacaoDe(request));
    }

    @PutMapping("/{id}/finalizar")
    public SolicitacaoResponse finalizar(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) TransicaoStatusRequest request) {
        return service.finalizar(id, observacaoDe(request));
    }

    @PutMapping("/{id}/cancelar")
    public SolicitacaoResponse cancelar(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) TransicaoStatusRequest request) {
        return service.cancelar(id, observacaoDe(request));
    }

    @PutMapping("/{id}/reabrir")
    public SolicitacaoResponse reabrir(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) TransicaoStatusRequest request) {
        return service.reabrir(id, observacaoDe(request));
    }

    private String observacaoDe(TransicaoStatusRequest request) {
        return request != null ? request.observacao() : null;
    }

    // ----- histórico (linha do tempo) -----

    @GetMapping("/{id}/historico")
    public List<HistoricoResponse> historico(@PathVariable Long id) {
        return service.historico(id);
    }

    @PostMapping("/publica/historico")
    public List<HistoricoResponse> historicoPublico(@Valid @RequestBody HistoricoPublicaRequest request) {
        return service.historicoPublico(request.cpf(), request.solicitacaoId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
