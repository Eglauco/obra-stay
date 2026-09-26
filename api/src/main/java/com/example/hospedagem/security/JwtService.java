package com.example.hospedagem.security;

import com.example.hospedagem.domain.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Geração e validação de tokens JWT (HS256). */
@Component
public class JwtService {

    private final SecretKey key;
    private final long expSegundos;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.exp-horas:8}") long expHoras) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expSegundos = expHoras * 3600;
    }

    public String gerar(Usuario usuario) {
        Instant agora = Instant.now();
        return Jwts.builder()
                .subject(usuario.getEmail())
                .claim("uid", usuario.getId())
                .claim("nome", usuario.getNome())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(agora.plusSeconds(expSegundos)))
                .signWith(key)
                .compact();
    }

    public String extrairEmail(String token) {
        return parse(token).getSubject();
    }

    public boolean valido(String token) {
        try {
            parse(token);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    private Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
