package com.example.hospedagem.controller;

import com.example.hospedagem.domain.Usuario;
import com.example.hospedagem.dto.LoginRequest;
import com.example.hospedagem.dto.LoginResponse;
import com.example.hospedagem.dto.TrocarSenhaRequest;
import com.example.hospedagem.dto.UsuarioResponse;
import com.example.hospedagem.security.JwtService;
import com.example.hospedagem.service.LogAuditoriaService;
import com.example.hospedagem.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Autenticação: login, dados do usuário logado, troca de senha e logout (com auditoria). */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioService service;
    private final JwtService jwtService;
    private final LogAuditoriaService logService;

    public AuthController(UsuarioService service, JwtService jwtService, LogAuditoriaService logService) {
        this.service = service;
        this.jwtService = jwtService;
        this.logService = logService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        Usuario usuario;
        try {
            usuario = service.autenticar(request.email(), request.senha());
        } catch (ResponseStatusException e) {
            logService.registrarLogin(null, request.email(), false, "Credenciais inválidas", http);
            throw e;
        }
        logService.registrarLogin(usuario.getId(), usuario.getEmail(), true, null, http);
        return new LoginResponse(jwtService.gerar(usuario), service.resposta(usuario));
    }

    @GetMapping("/me")
    public UsuarioResponse me(Authentication authentication) {
        return service.me(authentication.getName());
    }

    @PostMapping("/trocar-senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void trocarSenha(@Valid @RequestBody TrocarSenhaRequest request,
                            Authentication authentication, HttpServletRequest http) {
        service.trocarSenha(authentication.getName(), request);
        logService.registrarAcao(authentication.getName(), null, "TROCAR_SENHA",
                "Troca da própria senha", true, HttpStatus.NO_CONTENT.value(), http);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(Authentication authentication, HttpServletRequest http) {
        logService.registrarLogout(authentication.getName(), http);
    }
}
