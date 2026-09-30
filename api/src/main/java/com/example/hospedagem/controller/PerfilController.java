package com.example.hospedagem.controller;

import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.PerfilFiltro;
import com.example.hospedagem.dto.PerfilOpcao;
import com.example.hospedagem.dto.PerfilRequest;
import com.example.hospedagem.dto.PerfilResponse;
import com.example.hospedagem.dto.TelaCatalogo;
import com.example.hospedagem.service.PerfilService;
import com.example.hospedagem.util.PlanilhaExcel;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

/** Endpoints REST dos Perfis de acesso (RBAC). */
@RestController
@RequestMapping("/api/perfis")
public class PerfilController {

    private final PerfilService service;

    public PerfilController(PerfilService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@perm.can('perfis','VER')")
    public PageResponse<PerfilResponse> listar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @PageableDefault(size = 10, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.buscar(new PerfilFiltro(id, nome), pageable);
    }

    /**
     * Perfis (id + nome) para selects. Acessível a qualquer usuário autenticado, pois o
     * cadastro de usuários precisa listar perfis mesmo sem permissão sobre a tela Perfis.
     */
    @GetMapping("/opcoes")
    public List<PerfilOpcao> opcoes() {
        return service.listarOpcoes();
    }

    @GetMapping("/catalogo")
    @PreAuthorize("@perm.can('perfis','VER')")
    public List<TelaCatalogo> catalogo() {
        return service.catalogo();
    }

    @GetMapping("/exportar")
    @PreAuthorize("@perm.can('perfis','EXPORTAR')")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome) {
        byte[] conteudo = service.exportar(new PerfilFiltro(id, nome));
        return PlanilhaExcel.resposta(conteudo, "perfis");
    }

    @GetMapping("/{id}")
    @PreAuthorize("@perm.can('perfis','VER')")
    public PerfilResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    @PostMapping
    @PreAuthorize("@perm.can('perfis','CRIAR')")
    public ResponseEntity<PerfilResponse> criar(
            @Valid @RequestBody PerfilRequest request, UriComponentsBuilder uriBuilder) {
        PerfilResponse criado = service.criar(request);
        URI location = uriBuilder.path("/api/perfis/{id}").buildAndExpand(criado.id()).toUri();
        return ResponseEntity.created(location).body(criado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.can('perfis','EDITAR')")
    public PerfilResponse atualizar(@PathVariable Long id, @Valid @RequestBody PerfilRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.can('perfis','EXCLUIR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
