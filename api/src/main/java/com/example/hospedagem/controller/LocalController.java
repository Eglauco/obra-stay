package com.example.hospedagem.controller;

import com.example.hospedagem.dto.LocalFiltro;
import com.example.hospedagem.dto.LocalRequest;
import com.example.hospedagem.dto.LocalResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.service.LocalService;
import com.example.hospedagem.util.PlanilhaExcel;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
 * Endpoints REST do módulo Locais (ObraStay).
 */
@RestController
@RequestMapping("/api/locais")
public class LocalController {

    private final LocalService service;

    public LocalController(LocalService service) {
        this.service = service;
    }

    /**
     * Lista locais com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<LocalResponse> listar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String codigo,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cidade,
            @PageableDefault(size = 10, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {

        LocalFiltro filtro = new LocalFiltro(id, codigo, nome, cidade);
        return service.buscar(filtro, pageable);
    }

    /**
     * Exporta os locais filtrados (sem paginação) para Excel.
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String codigo,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cidade) {

        byte[] conteudo = service.exportar(new LocalFiltro(id, codigo, nome, cidade));
        return PlanilhaExcel.resposta(conteudo, "locais");
    }

    /**
     * Busca um local por id.
     */
    @GetMapping("/{id}")
    public LocalResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Cria um local. Multipart: parte "dados" (JSON do LocalRequest) + "foto" (opcional).
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LocalResponse> criar(
            @Valid @RequestPart("dados") LocalRequest request,
            @RequestPart(value = "foto", required = false) MultipartFile foto,
            UriComponentsBuilder uriBuilder) {

        LocalResponse criado = service.criar(request, foto);
        URI location = uriBuilder.path("/api/locais/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Atualiza um local. Multipart: parte "dados" (JSON) + "foto" (opcional) e o
     * campo "removerFoto" (quando o usuário remove a foto existente sem enviar outra).
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public LocalResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestPart("dados") LocalRequest request,
            @RequestPart(value = "foto", required = false) MultipartFile foto,
            @RequestParam(value = "removerFoto", defaultValue = "false") boolean removerFoto) {
        return service.atualizar(id, request, foto, removerFoto);
    }

    /**
     * Remove um local (hard delete).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
