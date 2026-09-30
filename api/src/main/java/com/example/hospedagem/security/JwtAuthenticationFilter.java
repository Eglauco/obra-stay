package com.example.hospedagem.security;

import com.example.hospedagem.domain.Perfil;
import com.example.hospedagem.domain.PerfilPermissao;
import com.example.hospedagem.domain.Usuario;
import com.example.hospedagem.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Lê o token Bearer, valida e popula o SecurityContext com o e-mail do usuário e as
 * authorities do seu perfil (RBAC). Perfil com acesso total vira a authority
 * {@code ACESSO_TOTAL}; caso contrário, cada permissão vira {@code tela:acao}.
 *
 * <p>O perfil é lido do banco a cada request (não do token), então mudanças de perfil
 * valem imediatamente, sem precisar reemitir o token.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(7);
            if (jwtService.valido(token)) {
                String email = jwtService.extrairEmail(token);
                usuarioRepository.findComPermissoesByEmail(email).ifPresent(usuario -> {
                    var auth = new UsernamePasswordAuthenticationToken(
                            email, null, authorities(usuario));
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
        }
        filterChain.doFilter(request, response);
    }

    private List<GrantedAuthority> authorities(Usuario usuario) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        Perfil perfil = usuario.getPerfil();
        if (perfil == null) {
            return authorities;
        }
        if (perfil.isAcessoTotal()) {
            authorities.add(new SimpleGrantedAuthority(PermissaoService.ACESSO_TOTAL));
            return authorities;
        }
        for (PerfilPermissao pp : perfil.getPermissoes()) {
            authorities.add(new SimpleGrantedAuthority(pp.getTela().getChave() + ":" + pp.getAcao().name()));
        }
        return authorities;
    }
}
