package com.example.hospedagem.service;

import com.example.hospedagem.domain.LogAuditoria;
import com.example.hospedagem.dto.LogAuditoriaFiltro;
import com.example.hospedagem.dto.LogAuditoriaResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.repository.LogAuditoriaRepository;
import com.example.hospedagem.repository.UsuarioRepository;
import com.example.hospedagem.specification.LogAuditoriaSpecifications;
import com.example.hospedagem.util.PlanilhaExcel;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Registro (append-only) e consulta da trilha de auditoria. */
@Service
public class LogAuditoriaService {

    private static final Logger log = LoggerFactory.getLogger(LogAuditoriaService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "dataHora");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.DESC, "dataHora");

    public static final String EVENTO_LOGIN = "LOGIN";
    public static final String EVENTO_LOGOUT = "LOGOUT";
    public static final String EVENTO_ACAO = "ACAO";

    private final LogAuditoriaRepository repository;
    private final UsuarioRepository usuarioRepository;

    public LogAuditoriaService(LogAuditoriaRepository repository, UsuarioRepository usuarioRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    /** Login (sucesso ou falha). Nunca lança — auditoria não pode quebrar o fluxo. */
    public void registrarLogin(Long usuarioId, String email, boolean sucesso, String motivo, HttpServletRequest req) {
        try {
            salvar(LogAuditoria.builder()
                    .usuarioId(usuarioId)
                    .usuarioEmail(cortar(email, 160))
                    .evento(EVENTO_LOGIN)
                    .detalhe(cortar(motivo, 255))
                    .sucesso(sucesso)
                    .ip(ip(req))
                    .userAgent(userAgent(req))
                    .dataHora(LocalDateTime.now())
                    .build());
        } catch (RuntimeException e) {
            log.warn("Falha ao registrar login na auditoria: {}", e.getMessage());
        }
    }

    /** Logout do usuário autenticado. */
    public void registrarLogout(String email, HttpServletRequest req) {
        try {
            salvar(LogAuditoria.builder()
                    .usuarioId(idPorEmail(email))
                    .usuarioEmail(cortar(email, 160))
                    .evento(EVENTO_LOGOUT)
                    .sucesso(true)
                    .ip(ip(req))
                    .userAgent(userAgent(req))
                    .dataHora(LocalDateTime.now())
                    .build());
        } catch (RuntimeException e) {
            log.warn("Falha ao registrar logout na auditoria: {}", e.getMessage());
        }
    }

    /** Ação sensível (criar/editar/excluir e ações especiais). */
    public void registrarAcao(String email, String tela, String acao, String detalhe,
                              boolean sucesso, Integer statusHttp, HttpServletRequest req) {
        try {
            salvar(LogAuditoria.builder()
                    .usuarioId(idPorEmail(email))
                    .usuarioEmail(cortar(email, 160))
                    .evento(EVENTO_ACAO)
                    .tela(cortar(tela, 40))
                    .acao(cortar(acao, 30))
                    .detalhe(cortar(detalhe, 255))
                    .sucesso(sucesso)
                    .statusHttp(statusHttp)
                    .ip(ip(req))
                    .userAgent(userAgent(req))
                    .dataHora(LocalDateTime.now())
                    .build());
        } catch (RuntimeException e) {
            log.warn("Falha ao registrar ação na auditoria: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<LogAuditoriaResponse> buscar(LogAuditoriaFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<LogAuditoria> pagina = repository.findAll(LogAuditoriaSpecifications.comFiltro(filtro), saneado);
        List<LogAuditoriaResponse> conteudo = pagina.getContent().stream().map(this::toResponse).toList();
        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public byte[] exportar(LogAuditoriaFiltro filtro) {
        List<LogAuditoria> lista = repository.findAll(
                LogAuditoriaSpecifications.comFiltro(filtro), Sort.by(Sort.Direction.DESC, "dataHora"));

        List<String> cabecalhos = List.of(
                "Data/hora", "Usuário", "Evento", "Tela", "Ação", "Detalhe", "Sucesso", "Status", "IP", "Navegador");
        List<List<Object>> linhas = new ArrayList<>();
        for (LogAuditoria l : lista) {
            linhas.add(java.util.Arrays.asList(
                    l.getDataHora() == null ? "" : l.getDataHora().format(FMT),
                    l.getUsuarioEmail() == null ? "" : l.getUsuarioEmail(),
                    l.getEvento(),
                    l.getTela() == null ? "" : l.getTela(),
                    l.getAcao() == null ? "" : l.getAcao(),
                    l.getDetalhe() == null ? "" : l.getDetalhe(),
                    l.isSucesso() ? "Sim" : "Não",
                    l.getStatusHttp() == null ? "" : l.getStatusHttp(),
                    l.getIp() == null ? "" : l.getIp(),
                    l.getUserAgent() == null ? "" : l.getUserAgent()));
        }
        return PlanilhaExcel.gerar("Logs de Acesso", cabecalhos, linhas);
    }

    // ----- auxiliares -----

    private void salvar(LogAuditoria log) {
        repository.save(log);
    }

    private Long idPorEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return usuarioRepository.findByEmailIgnoreCase(email).map(u -> u.getId()).orElse(null);
    }

    private LogAuditoriaResponse toResponse(LogAuditoria l) {
        return new LogAuditoriaResponse(
                l.getId(), l.getUsuarioId(), l.getUsuarioEmail(), l.getEvento(),
                l.getTela(), l.getAcao(), l.getDetalhe(), l.isSucesso(), l.getStatusHttp(),
                l.getIp(), l.getUserAgent(), l.getDataHora());
    }

    private static String ip(HttpServletRequest req) {
        if (req == null) {
            return null;
        }
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return cortar(xff.split(",")[0].trim(), 45);
        }
        return cortar(req.getRemoteAddr(), 45);
    }

    private static String userAgent(HttpServletRequest req) {
        return req == null ? null : cortar(req.getHeader("User-Agent"), 255);
    }

    private static String cortar(String valor, int max) {
        if (valor == null) {
            return null;
        }
        return valor.length() <= max ? valor : valor.substring(0, max);
    }

    private Pageable sanitizar(Pageable pageable) {
        int size = Math.min(Math.max(pageable.getPageSize(), SIZE_MIN), SIZE_MAX);
        int page = Math.max(pageable.getPageNumber(), 0);
        List<Sort.Order> ordens = pageable.getSort().stream()
                .filter(o -> CAMPOS_ORDENAVEIS.contains(o.getProperty()))
                .toList();
        Sort sort = ordens.isEmpty() ? ORDENACAO_PADRAO : Sort.by(ordens);
        return PageRequest.of(page, size, sort);
    }
}
