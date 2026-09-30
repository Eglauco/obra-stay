package com.example.hospedagem.security;

import com.example.hospedagem.service.LogAuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Registra na trilha de auditoria as ações sensíveis (POST/PUT/DELETE/PATCH) feitas por
 * usuários autenticados, derivando tela+ação do método e do caminho. Só audita requisições
 * autenticadas (kiosk/público não tem principal e é ignorado). Nunca afeta a requisição.
 * Login/logout/trocar-senha (/api/auth/**) são registrados à parte no AuthController.
 */
@Component
public class AuditoriaInterceptor implements HandlerInterceptor {

    private static final Map<String, String> RECURSO_TELA = Map.ofEntries(
            Map.entry("colaboradores", "colaboradores"),
            Map.entry("funcoes", "funcoes"),
            Map.entry("epcs", "epc"),
            Map.entry("empresas", "empresas"),
            Map.entry("gestoes", "gestoes"),
            Map.entry("locais", "locais"),
            Map.entry("status-locais", "status-locais"),
            Map.entry("orcamentos-mobiliario", "orcamentos-mobiliario"),
            Map.entry("locadoras", "locadoras"),
            Map.entry("tipos-solicitacao", "tipos-solicitacao"),
            Map.entry("hospedagens", "hospedagens"),
            Map.entry("contratos", "contratos"),
            Map.entry("gastos", "gastos"),
            Map.entry("solicitacoes", "solicitacoes"),
            Map.entry("usuarios", "usuarios"),
            Map.entry("perfis", "perfis"));

    private static final Set<String> TRANSICOES = Set.of("iniciar", "finalizar", "cancelar", "reabrir");

    private final LogAuditoriaService logService;

    public AuditoriaInterceptor(LogAuditoriaService logService) {
        this.logService = logService;
    }

    @Override
    public void afterCompletion(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                @NonNull Object handler, Exception ex) {
        try {
            String metodo = request.getMethod();
            if (!("POST".equals(metodo) || "PUT".equals(metodo)
                    || "DELETE".equals(metodo) || "PATCH".equals(metodo))) {
                return;
            }
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return;
            }
            String email = auth.getName();
            if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
                return;
            }
            String[] telaAcao = mapear(metodo, request.getRequestURI());
            if (telaAcao == null) {
                return;
            }
            int status = response.getStatus();
            String detalhe = metodo + " " + request.getRequestURI();
            logService.registrarAcao(email, telaAcao[0], telaAcao[1], detalhe, status < 400, status, request);
        } catch (RuntimeException e) {
            // Auditoria nunca pode afetar a requisição.
        }
    }

    /** Deriva [telaChave, acao] do método + caminho; null quando não é uma ação auditável. */
    private static String[] mapear(String metodo, String uri) {
        String caminho = uri;
        int q = caminho.indexOf('?');
        if (q >= 0) {
            caminho = caminho.substring(0, q);
        }
        List<String> segs = new ArrayList<>();
        for (String s : caminho.split("/")) {
            if (!s.isBlank()) {
                segs.add(s);
            }
        }
        if (segs.size() < 2 || !"api".equals(segs.get(0))) {
            return null;
        }
        String recurso = segs.get(1);
        if ("auth".equals(recurso)) {
            return null; // login/logout/trocar-senha registrados no AuthController
        }
        if (caminho.contains("entrada-publica") || caminho.contains("local-entrada") || caminho.contains("/publica")) {
            return null; // kiosk/público
        }
        String tela = RECURSO_TELA.get(recurso);
        if (tela == null) {
            return null;
        }
        String last = segs.get(segs.size() - 1);

        switch (metodo) {
            case "POST":
                if ("hospedagens".equals(recurso) && segs.size() == 2) {
                    return new String[] {tela, "DAR_ENTRADA"};
                }
                if ("locais".equals(recurso) && "status".equals(last)) {
                    return new String[] {tela, "TROCAR_STATUS"};
                }
                if (segs.size() == 2) {
                    return new String[] {tela, "CRIAR"};
                }
                return null;
            case "PUT":
            case "PATCH":
                if ("hospedagens".equals(recurso) && "saida".equals(last)) {
                    return new String[] {tela, "DAR_SAIDA"};
                }
                if ("solicitacoes".equals(recurso) && TRANSICOES.contains(last)) {
                    return new String[] {tela, "MUDAR_STATUS"};
                }
                if (segs.size() == 3) {
                    return new String[] {tela, "EDITAR"};
                }
                return null;
            case "DELETE":
                if (segs.size() == 3) {
                    return new String[] {tela, "EXCLUIR"};
                }
                return null;
            default:
                return null;
        }
    }
}
