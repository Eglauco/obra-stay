package com.example.hospedagem.controller;

import com.example.hospedagem.domain.Usuario;
import com.example.hospedagem.dto.LoginRequest;
import com.example.hospedagem.dto.LoginResponse;
import com.example.hospedagem.dto.TrocarSenhaRequest;
import com.example.hospedagem.dto.UsuarioResponse;
import com.example.hospedagem.security.JwtService;
import com.example.hospedagem.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Autenticação: login, dados do usuário logado e troca de senha. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioService service;
    private final JwtService jwtService;

    public AuthController(UsuarioService service, JwtService jwtService) {
        this.service = service;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        Usuario usuario = service.autenticar(request.email(), request.senha());
        UsuarioResponse dados = new UsuarioResponse(
                usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getCriadoEm());
        return new LoginResponse(jwtService.gerar(usuario), dados);
    }

    @GetMapping("/me")
    public UsuarioResponse me(Authentication authentication) {
        return service.me(authentication.getName());
    }

    @PostMapping("/trocar-senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void trocarSenha(@Valid @RequestBody TrocarSenhaRequest request, Authentication authentication) {
        service.trocarSenha(authentication.getName(), request);
    }
}
