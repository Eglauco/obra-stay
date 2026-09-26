package com.example.hospedagem.controller;

import com.example.hospedagem.dto.ConsultaEntradaResponse;
import com.example.hospedagem.dto.EntradaPublicaRequest;
import com.example.hospedagem.dto.EntradaPublicaResultado;
import com.example.hospedagem.dto.HospedagemEntradaRequest;
import com.example.hospedagem.dto.HospedagemFiltro;
import com.example.hospedagem.dto.HospedagemResponse;
import com.example.hospedagem.dto.HospedagemSaidaRequest;
import com.example.hospedagem.dto.LocaisColaboradorResponse;
import com.example.hospedagem.dto.LocalEntradaResponse;
import com.example.hospedagem.dto.OcupacaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.RelatorioHospedagensResponse;
import com.example.hospedagem.service.HospedagemService;
import com.example.hospedagem.util.PlanilhaExcel;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Endpoints REST do módulo Gestão de Hospedagem (entradas e saídas de colaboradores).
 */
@RestController
@RequestMapping("/api/hospedagens")
public class HospedagemController {

    private final HospedagemService service;

    public HospedagemController(HospedagemService service) {
        this.service = service;
    }

    /**
     * Lista hospedagens com paginação e filtros aplicados no backend.
     */
    @GetMapping
    public PageResponse<HospedagemResponse> listar(
            @RequestParam(required = false) Long colaboradorId,
            @RequestParam(required = false) Long localId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entradaDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entradaAte,
            @PageableDefault(size = 10) Pageable pageable) {

        HospedagemFiltro filtro = new HospedagemFiltro(colaboradorId, localId, status, entradaDe, entradaAte);
        return service.buscar(filtro, pageable);
    }

    /**
     * Ocupação atual de cada local (capacidade x hospedagens ativas).
     * Declarado antes de "/{id}" para não ser capturado como path variable.
     */
    @GetMapping("/ocupacao")
    public List<OcupacaoResponse> ocupacao() {
        return service.ocupacao();
    }

    /** Exporta as hospedagens do local (detalhe) para Excel, respeitando os filtros. */
    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false) Long colaboradorId,
            @RequestParam(required = false) Long localId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entradaDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entradaAte) {

        byte[] conteudo = service.exportar(
                new HospedagemFiltro(colaboradorId, localId, status, entradaDe, entradaAte));
        return PlanilhaExcel.resposta(conteudo, "hospedagens");
    }

    /** Exporta a grade de locais com a ocupação atual (respeita o filtro de nome). */
    @GetMapping("/exportar-locais")
    public ResponseEntity<byte[]> exportarLocais(@RequestParam(required = false) String nome) {
        return PlanilhaExcel.resposta(service.exportarLocais(nome), "hospedagens-locais");
    }

    /**
     * Relatório detalhado das hospedagens do local (uma linha por colaborador), respeitando
     * o filtro de status e período. Declarado antes de "/{id}" para não virar path variable.
     */
    @GetMapping("/relatorio")
    public RelatorioHospedagensResponse relatorio(
            @RequestParam Long localId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entradaDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entradaAte) {
        return service.relatorio(localId, status, entradaDe, entradaAte);
    }

    /**
     * Locais em que o colaborador está/esteve hospedado (para restringir/sugerir o local
     * ao abrir uma solicitação). Declarado antes de "/{id}".
     */
    @GetMapping("/locais-colaborador/{colaboradorId}")
    public LocaisColaboradorResponse locaisDoColaborador(@PathVariable Long colaboradorId) {
        return service.locaisDoColaborador(colaboradorId);
    }

    // ----- Auto check-in público (tela por QR Code) -----

    /** Dados do local + vagas para a tela pública de auto check-in. */
    @GetMapping("/local-entrada/{localId}")
    public LocalEntradaResponse infoEntrada(@PathVariable Long localId) {
        return service.infoEntrada(localId);
    }

    /** Consulta pelo CPF a ação disponível (entrada/saída/bloqueado) no local. */
    @PostMapping("/entrada-publica/consulta")
    public ConsultaEntradaResponse consultarEntrada(@Valid @RequestBody EntradaPublicaRequest request) {
        return service.consultarEntrada(request);
    }

    /** Efetiva o auto check-in (entrada ou saída) pelo CPF. */
    @PostMapping("/entrada-publica/confirmar")
    public EntradaPublicaResultado confirmarEntrada(@Valid @RequestBody EntradaPublicaRequest request) {
        return service.confirmarEntrada(request);
    }

    /**
     * Busca uma hospedagem por id.
     */
    @GetMapping("/{id}")
    public HospedagemResponse obter(@PathVariable Long id) {
        return service.obter(id);
    }

    /**
     * Registra a entrada de um colaborador em um local.
     */
    @PostMapping
    public ResponseEntity<HospedagemResponse> darEntrada(
            @Valid @RequestBody HospedagemEntradaRequest request,
            UriComponentsBuilder uriBuilder) {

        HospedagemResponse criado = service.darEntrada(request);
        URI location = uriBuilder.path("/api/hospedagens/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    /**
     * Registra a saída (encerra) de uma hospedagem ativa.
     */
    @PutMapping("/{id}/saida")
    public HospedagemResponse darSaida(
            @PathVariable Long id,
            @Valid @RequestBody HospedagemSaidaRequest request) {
        return service.darSaida(id, request);
    }

    /**
     * Remove uma hospedagem (hard delete).
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
