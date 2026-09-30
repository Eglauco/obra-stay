package com.example.hospedagem.service;

import com.example.hospedagem.domain.Notificacao;
import com.example.hospedagem.domain.NotificacaoLeitura;
import com.example.hospedagem.domain.TipoNotificacao;
import com.example.hospedagem.domain.Usuario;
import com.example.hospedagem.dto.NotificacaoFeedResponse;
import com.example.hospedagem.dto.NotificacaoItemResponse;
import com.example.hospedagem.repository.NotificacaoLeituraRepository;
import com.example.hospedagem.repository.NotificacaoRepository;
import com.example.hospedagem.repository.UsuarioRepository;
import com.example.hospedagem.security.PermissaoService;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Geração e consulta das notificações do sino (feed filtrado por permissão do usuário). */
@Service
public class NotificacaoService {

    public static final String TELA_HOSPEDAGENS = "hospedagens";
    public static final String TELA_SOLICITACOES = "solicitacoes";
    private static final Set<String> TELAS_NOTIFICAVEIS = Set.of(TELA_HOSPEDAGENS, TELA_SOLICITACOES);

    private static final LocalDateTime EPOCH = LocalDateTime.of(1970, 1, 1, 0, 0);
    private static final int LIMITE_FEED = 30;

    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);

    private final NotificacaoRepository repository;
    private final NotificacaoLeituraRepository leituraRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacaoWriter writer;

    public NotificacaoService(NotificacaoRepository repository,
                              NotificacaoLeituraRepository leituraRepository,
                              UsuarioRepository usuarioRepository,
                              NotificacaoWriter writer) {
        this.repository = repository;
        this.leituraRepository = leituraRepository;
        this.usuarioRepository = usuarioRepository;
        this.writer = writer;
    }

    /**
     * Registra uma notificação de ação. O autor (usuário logado) é resolvido do contexto de
     * segurança e NÃO recebe a própria notificação; ações de autoatendimento (sem usuário logado)
     * têm autor nulo e notificam todos os elegíveis. Participa da transação da ação que a gerou.
     */
    public void registrar(TipoNotificacao tipo, String tela, String titulo, String rota) {
        try {
            Notificacao notificacao = Notificacao.builder()
                    .tipo(tipo)
                    .tela(cortar(tela, 40))
                    .titulo(cortar(titulo, 200))
                    .rota(cortar(rota, 200))
                    .autorUsuarioId(autorIdAtual())
                    .dataHora(LocalDateTime.now())
                    .build();
            writer.salvar(notificacao);
        } catch (RuntimeException e) {
            // Auditoria/notificação nunca pode quebrar a ação principal.
            log.warn("Falha ao registrar notificação: {}", e.getMessage());
        }
    }

    private static String cortar(String valor, int max) {
        if (valor == null) {
            return null;
        }
        return valor.length() <= max ? valor : valor.substring(0, max);
    }

    @Transactional(readOnly = true)
    public NotificacaoFeedResponse feed() {
        Usuario usuario = usuarioAtual();
        Set<String> telas = telasVisiveis();
        if (usuario == null || telas.isEmpty()) {
            return new NotificacaoFeedResponse(0, List.of());
        }
        Long uid = usuario.getId();
        LocalDateTime lidasEm = usuario.getNotificacoesLidasEm() != null ? usuario.getNotificacoesLidasEm() : EPOCH;

        List<Notificacao> lista = repository.feed(telas, uid, PageRequest.of(0, LIMITE_FEED));
        List<Long> ids = lista.stream().map(Notificacao::getId).toList();
        Set<Long> lidosIds = ids.isEmpty()
                ? Set.of()
                : leituraRepository.findByUsuarioIdAndNotificacaoIdIn(uid, ids).stream()
                        .map(NotificacaoLeitura::getNotificacaoId)
                        .collect(Collectors.toSet());

        List<NotificacaoItemResponse> itens = lista.stream()
                .map(n -> new NotificacaoItemResponse(
                        n.getId(), n.getTipo().name(), n.getTitulo(), n.getRota(), n.getDataHora(),
                        !n.getDataHora().isAfter(lidasEm) || lidosIds.contains(n.getId())))
                .toList();

        long naoLidas = repository.contarNaoLidas(telas, uid, lidasEm);
        return new NotificacaoFeedResponse(naoLidas, itens);
    }

    @Transactional
    public void marcarLida(Long notificacaoId) {
        Usuario usuario = usuarioAtual();
        if (usuario == null || notificacaoId == null || !repository.existsById(notificacaoId)) {
            return;
        }
        if (!leituraRepository.existsByUsuarioIdAndNotificacaoId(usuario.getId(), notificacaoId)) {
            leituraRepository.save(NotificacaoLeitura.builder()
                    .usuarioId(usuario.getId())
                    .notificacaoId(notificacaoId)
                    .build());
        }
    }

    @Transactional
    public void marcarTodasLidas() {
        Usuario usuario = usuarioAtual();
        if (usuario == null) {
            return;
        }
        usuario.setNotificacoesLidasEm(LocalDateTime.now());
        usuarioRepository.save(usuario);
        // As leituras individuais ficam redundantes (tudo <= marca); limpa para não acumular.
        leituraRepository.deleteByUsuarioId(usuario.getId());
    }

    // ----- auxiliares -----

    private Usuario usuarioAtual() {
        String email = emailAtual();
        return email == null ? null : usuarioRepository.findByEmailIgnoreCase(email).orElse(null);
    }

    private Long autorIdAtual() {
        Usuario u = usuarioAtual();
        return u == null ? null : u.getId();
    }

    private String emailAtual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        String nome = auth.getName();
        if (nome == null || nome.isBlank() || "anonymousUser".equals(nome)) {
            return null;
        }
        return nome;
    }

    private Set<String> telasVisiveis() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return Set.of();
        }
        Set<String> authorities = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        if (authorities.contains(PermissaoService.ACESSO_TOTAL)) {
            return TELAS_NOTIFICAVEIS;
        }
        Set<String> telas = new HashSet<>();
        if (authorities.contains(TELA_HOSPEDAGENS + ":VER")) {
            telas.add(TELA_HOSPEDAGENS);
        }
        if (authorities.contains(TELA_SOLICITACOES + ":VER")) {
            telas.add(TELA_SOLICITACOES);
        }
        return telas;
    }
}
