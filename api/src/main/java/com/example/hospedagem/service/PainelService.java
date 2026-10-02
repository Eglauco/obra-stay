package com.example.hospedagem.service;

import com.example.hospedagem.dto.AlertaContratoResponse;
import com.example.hospedagem.dto.FuncaoContagemResponse;
import com.example.hospedagem.dto.GastoLocalPainelResponse;
import com.example.hospedagem.dto.OcupacaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.ResumoPainelResponse;
import com.example.hospedagem.repository.ColaboradorRepository;
import com.example.hospedagem.repository.HospedagemRepository;
import com.example.hospedagem.repository.PainelRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dados do Painel (sempre visível a qualquer usuário autenticado). KPIs consolidados e
 * quatro blocos paginados — ocupação, alertas de contrato, gastos e colaboradores por função
 * — para carregamento incremental (scroll infinito) no front.
 */
@Service
public class PainelService {

    /** Janela do alerta "contrato vencendo" (dias). */
    private static final int ALERTA_DIAS = 30;
    private static final int SIZE_MIN = 1;
    private static final int SIZE_MAX = 50;

    private final PainelRepository painelRepository;
    private final HospedagemRepository hospedagemRepository;
    private final ColaboradorRepository colaboradorRepository;

    public PainelService(PainelRepository painelRepository,
                         HospedagemRepository hospedagemRepository,
                         ColaboradorRepository colaboradorRepository) {
        this.painelRepository = painelRepository;
        this.hospedagemRepository = hospedagemRepository;
        this.colaboradorRepository = colaboradorRepository;
    }

    @Transactional(readOnly = true)
    public ResumoPainelResponse resumo() {
        LocalDate hoje = LocalDate.now();
        LocalDate limite = hoje.plusDays(ALERTA_DIAS);

        long totalLocais = painelRepository.count();
        long totalColaboradores = colaboradorRepository.count();
        long totalOcupados = hospedagemRepository.countByDataSaidaIsNull();
        long totalVagas = painelRepository.somaCapacidade();
        int percentOcupacao = totalVagas > 0
                ? (int) Math.round(totalOcupados * 100.0 / totalVagas)
                : 0;

        long contratosVigentes = painelRepository.contratosVigentes(hoje);
        long vencendo30 = painelRepository.locaisVencendo(hoje, limite);
        long semContrato = totalLocais - painelRepository.locaisComVigente(hoje);
        BigDecimal gastoTotal = painelRepository.gastoTotal();

        return new ResumoPainelResponse(totalColaboradores, totalLocais, totalOcupados, totalVagas,
                percentOcupacao, contratosVigentes, vencendo30, semContrato, gastoTotal);
    }

    @Transactional(readOnly = true)
    public PageResponse<OcupacaoResponse> ocupacao(Pageable pageable) {
        Page<Object[]> page = painelRepository.ocupacaoPorLocal(sanitizar(pageable));
        List<OcupacaoResponse> conteudo = page.getContent().stream()
                .map(r -> new OcupacaoResponse(
                        ((Number) r[0]).longValue(),
                        (String) r[1],
                        ((Number) r[2]).intValue(),
                        ((Number) r[3]).longValue()))
                .toList();
        return PageResponse.of(page, conteudo);
    }

    @Transactional(readOnly = true)
    public PageResponse<GastoLocalPainelResponse> gastos(Pageable pageable) {
        Page<Object[]> page = painelRepository.gastosPorLocal(sanitizar(pageable));
        List<GastoLocalPainelResponse> conteudo = page.getContent().stream()
                .map(r -> new GastoLocalPainelResponse(
                        ((Number) r[0]).longValue(),
                        (String) r[1],
                        toBigDecimal(r[2]),
                        ((Number) r[3]).longValue()))
                .toList();
        return PageResponse.of(page, conteudo);
    }

    @Transactional(readOnly = true)
    public PageResponse<FuncaoContagemResponse> colaboradoresPorFuncao(Pageable pageable) {
        Page<Object[]> page = painelRepository.colaboradoresPorFuncao(sanitizar(pageable));
        List<FuncaoContagemResponse> conteudo = page.getContent().stream()
                .map(r -> new FuncaoContagemResponse(
                        (String) r[0],
                        ((Number) r[1]).longValue()))
                .toList();
        return PageResponse.of(page, conteudo);
    }

    @Transactional(readOnly = true)
    public PageResponse<AlertaContratoResponse> alertasContratos(Pageable pageable) {
        LocalDate hoje = LocalDate.now();
        LocalDate limite = hoje.plusDays(ALERTA_DIAS);
        Page<Object[]> page = painelRepository.alertasContratos(hoje, limite, sanitizar(pageable));
        List<AlertaContratoResponse> conteudo = page.getContent().stream()
                .map(r -> new AlertaContratoResponse(
                        ((Number) r[0]).longValue(),
                        (String) r[1],
                        (String) r[2],
                        ((Number) r[3]).intValue(),
                        (String) r[4]))
                .toList();
        return PageResponse.of(page, conteudo);
    }

    // ----- auxiliares -----

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value instanceof BigDecimal bd ? bd : new BigDecimal(value.toString());
    }

    /** Clampa o size em [1,50], page >= 0 e descarta qualquer sort (ordenação é fixa na query). */
    private Pageable sanitizar(Pageable pageable) {
        int size = Math.min(Math.max(pageable.getPageSize(), SIZE_MIN), SIZE_MAX);
        int page = Math.max(pageable.getPageNumber(), 0);
        return PageRequest.of(page, size);
    }
}
