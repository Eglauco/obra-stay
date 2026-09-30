package com.example.hospedagem.controller;

import com.example.hospedagem.dto.AtualizarUsuarioRequest;
import com.example.hospedagem.dto.RegisterRequest;
import com.example.hospedagem.dto.UsuarioResponse;
import com.example.hospedagem.service.UsuarioService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

/** Gestão de usuários. Restrita pela tela "usuarios" do RBAC. */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@perm.can('usuarios','VER')")
    public List<UsuarioResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    @PreAuthorize("@perm.can('usuarios','VER')")
    public UsuarioResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    @PostMapping
    @PreAuthorize("@perm.can('usuarios','CRIAR')")
    public ResponseEntity<UsuarioResponse> criar(
            @Valid @RequestBody RegisterRequest request, UriComponentsBuilder uriBuilder) {
        UsuarioResponse criado = service.registrar(request);
        URI location = uriBuilder.path("/api/usuarios/{id}").buildAndExpand(criado.id()).toUri();
        return ResponseEntity.created(location).body(criado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.can('usuarios','EDITAR')")
    public UsuarioResponse atualizar(
            @PathVariable Long id, @Valid @RequestBody AtualizarUsuarioRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.can('usuarios','EXCLUIR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id, Authentication authentication) {
        service.excluir(id, authentication.getName());
    }
}
