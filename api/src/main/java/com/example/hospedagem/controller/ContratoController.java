package com.example.hospedagem.controller;

import com.example.hospedagem.dto.ContratoFiltro;
import com.example.hospedagem.dto.ContratoRequest;
import com.example.hospedagem.dto.ContratoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.VigenciaResponse;
import com.example.hospedagem.service.ContratoService;
import com.example.hospedagem.util.PlanilhaExcel;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Endpoints REST do módulo Gestão de Contratos (locação de locais por locadoras).
 */
@RestController
@RequestMapping("/api/contratos")
public class ContratoController {

    private final ContratoService service;

    public ContratoController(ContratoService service) {
        this.service = service;
    }

    /**
     * Lista contratos com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<ContratoResponse> listar(
            @RequestParam(required = false) Long localId,
            @RequestParam(required = false) String codigo,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10) Pageable pageable) {

        ContratoFiltro filtro = new ContratoFiltro(localId, codigo, status);
        return service.buscar(filtro, pageable);
    }

    /**
     * Contratos vigentes hoje (um por local com contrato vigente), usado pelo card do local.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/vigencia")
    public List<VigenciaResponse> vigencia() {
        return service.vigencia();
    }

    /** Exporta os contratos do local (detalhe) para Excel, respeitando os filtros. */
    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false) Long localId,
            @RequestParam(required = false) String codigo,
            @RequestParam(required = false) String status) {
        byte[] conteudo = service.exportar(new ContratoFiltro(localId, codigo, status));
        return PlanilhaExcel.resposta(conteudo, "contratos");
    }

    /** Exporta a grade de locais com o contrato vigente (respeita o filtro de nome). */
    @GetMapping("/exportar-locais")
    public ResponseEntity<byte[]> exportarLocais(@RequestParam(required = false) String nome) {
        return PlanilhaExcel.resposta(service.exportarLocais(nome), "contratos-locais");
    }

    /**
     * Busca um contrato por id.
     */
    @GetMapping("/{id}")
    public ContratoResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Cria um contrato. Multipart: parte "dados" (JSON) + "arquivo" (PDF, opcional).
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ContratoResponse> criar(
            @Valid @RequestPart("dados") ContratoRequest request,
            @RequestPart(value = "arquivo", required = false) MultipartFile arquivo,
            UriComponentsBuilder uriBuilder) {

        ContratoResponse criado = service.criar(request, arquivo);
        URI location = uriBuilder.path("/api/contratos/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Atualiza um contrato. Multipart: parte "dados" (JSON) + "arquivo" (PDF, opcional) e
     * o campo "removerArquivo" (quando o usuário remove o PDF existente sem enviar outro).
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ContratoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestPart("dados") ContratoRequest request,
            @RequestPart(value = "arquivo", required = false) MultipartFile arquivo,
            @RequestParam(value = "removerArquivo", defaultValue = "false") boolean removerArquivo) {
        return service.atualizar(id, request, arquivo, removerArquivo);
    }

    /**
     * Remove um contrato (hard delete).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
