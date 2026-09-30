package com.example.hospedagem.controller;

import com.example.hospedagem.dto.NotificacaoFeedResponse;
import com.example.hospedagem.service.NotificacaoService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Feed de notificações do usuário logado. Não há @PreAuthorize por tela: o serviço já filtra
 * pelo que o usuário pode Ver (quem não tem acesso a nada recebe feed vazio).
 */
@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {

    private final NotificacaoService service;

    public NotificacaoController(NotificacaoService service) {
        this.service = service;
    }

    @GetMapping
    public NotificacaoFeedResponse listar() {
        return service.feed();
    }

    @PostMapping("/{id}/lida")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void marcarLida(@PathVariable Long id) {
        service.marcarLida(id);
    }

    @PostMapping("/marcar-todas-lidas")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void marcarTodasLidas() {
        service.marcarTodasLidas();
    }
}
