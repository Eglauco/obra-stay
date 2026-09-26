package com.example.hospedagem.dto;

import java.time.LocalDateTime;

public record UsuarioResponse(Long id, String nome, String email, LocalDateTime criadoEm) {
}
