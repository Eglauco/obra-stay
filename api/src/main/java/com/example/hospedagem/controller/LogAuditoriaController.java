package com.example.hospedagem.controller;

import com.example.hospedagem.dto.LogAuditoriaFiltro;
import com.example.hospedagem.dto.LogAuditoriaResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.service.LogAuditoriaService;
import com.example.hospedagem.util.PlanilhaExcel;
import java.time.LocalDate;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Consulta e exportação da trilha de auditoria (somente leitura; append-only). */
@RestController
@RequestMapping("/api/logs-acesso")
public class LogAuditoriaController {

    private final LogAuditoriaService service;

    public LogAuditoriaController(LogAuditoriaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@perm.can('logs-acesso','VER')")
    public PageResponse<LogAuditoriaResponse> listar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String evento,
            @RequestParam(required = false) Boolean sucesso,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate,
            @PageableDefault(size = 20, sort = "dataHora", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.buscar(new LogAuditoriaFiltro(q, evento, sucesso, de, ate), pageable);
    }

    @GetMapping("/exportar")
    @PreAuthorize("@perm.can('logs-acesso','EXPORTAR')")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String evento,
            @RequestParam(required = false) Boolean sucesso,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate) {
        byte[] conteudo = service.exportar(new LogAuditoriaFiltro(q, evento, sucesso, de, ate));
        return PlanilhaExcel.resposta(conteudo, "logs-acesso");
    }
}
