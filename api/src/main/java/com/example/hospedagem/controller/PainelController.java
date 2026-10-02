package com.example.hospedagem.controller;

import com.example.hospedagem.dto.AlertaContratoResponse;
import com.example.hospedagem.dto.FuncaoContagemResponse;
import com.example.hospedagem.dto.GastoLocalPainelResponse;
import com.example.hospedagem.dto.OcupacaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.ResumoPainelResponse;
import com.example.hospedagem.service.PainelService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints do Painel. O Painel é sempre visível a qualquer usuário autenticado, por isso
 * estes endpoints não têm {@code @PreAuthorize} de tela — exigem apenas autenticação
 * (ver {@code SecurityConfig.anyRequest().authenticated()}).
 *
 * <p>Os quatro blocos são paginados para carregamento incremental (scroll infinito); os KPIs
 * do cabeçalho vêm consolidados em {@code /resumo}.
 */
@RestController
@RequestMapping("/api/painel")
public class PainelController {

    private final PainelService service;

    public PainelController(PainelService service) {
        this.service = service;
    }

    @GetMapping("/resumo")
    public ResumoPainelResponse resumo() {
        return service.resumo();
    }

    @GetMapping("/ocupacao")
    public PageResponse<OcupacaoResponse> ocupacao(@PageableDefault(size = 10) Pageable pageable) {
        return service.ocupacao(pageable);
    }

    @GetMapping("/contratos-alertas")
    public PageResponse<AlertaContratoResponse> contratosAlertas(@PageableDefault(size = 10) Pageable pageable) {
        return service.alertasContratos(pageable);
    }

    @GetMapping("/gastos")
    public PageResponse<GastoLocalPainelResponse> gastos(@PageableDefault(size = 10) Pageable pageable) {
        return service.gastos(pageable);
    }

    @GetMapping("/colaboradores-por-funcao")
    public PageResponse<FuncaoContagemResponse> colaboradoresPorFuncao(@PageableDefault(size = 10) Pageable pageable) {
        return service.colaboradoresPorFuncao(pageable);
    }
}
