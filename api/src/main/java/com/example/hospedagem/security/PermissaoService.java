package com.example.hospedagem.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Avaliador de permissões usado nas anotações {@code @PreAuthorize} dos controllers,
 * por exemplo {@code @PreAuthorize("@perm.can('colaboradores','CRIAR')")}.
 *
 * <p>Lê as authorities do usuário autenticado (populadas pelo {@link JwtAuthenticationFilter}
 * a partir do perfil). {@code ACESSO_TOTAL} concede tudo; caso contrário, procura a authority
 * exata {@code tela:acao}.
 */
@Component("perm")
public class PermissaoService {

    /** Authority especial que concede acesso a tudo (perfil Administrador). */
    public static final String ACESSO_TOTAL = "ACESSO_TOTAL";

    public boolean can(String tela, String acao) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        String alvo = tela + ":" + acao;
        for (GrantedAuthority ga : auth.getAuthorities()) {
            String authority = ga.getAuthority();
            if (ACESSO_TOTAL.equals(authority) || alvo.equals(authority)) {
                return true;
            }
        }
        return false;
    }
}
