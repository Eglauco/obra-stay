package com.example.hospedagem.service;

import com.example.hospedagem.domain.TipoSolicitacao;
import com.example.hospedagem.dto.TipoSolicitacaoFiltro;
import com.example.hospedagem.dto.TipoSolicitacaoRequest;
import com.example.hospedagem.dto.TipoSolicitacaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.TipoSolicitacaoRepository;
import com.example.hospedagem.specification.TipoSolicitacaoSpecifications;
import com.example.hospedagem.util.PlanilhaExcel;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regras de negócio do módulo Tipos de Solicitação.
 */
@Service
public class TipoSolicitacaoService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "nome");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.ASC, "nome");

    private final TipoSolicitacaoRepository repository;

    public TipoSolicitacaoService(TipoSolicitacaoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<TipoSolicitacaoResponse> buscar(TipoSolicitacaoFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<TipoSolicitacao> pagina = repository.findAll(
                TipoSolicitacaoSpecifications.comFiltro(filtro), saneado);

        List<TipoSolicitacaoResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public TipoSolicitacaoResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    /**
     * Todos os tipos de solicitação ordenados por nome (asc), para popular selects.
     */
    @Transactional(readOnly = true)
    public List<TipoSolicitacaoResponse> listarOpcoes() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TipoSolicitacaoResponse criar(TipoSolicitacaoRequest request) {
        TipoSolicitacao tipoSolicitacao = TipoSolicitacao.builder()
                .nome(request.nome().trim())
                .build();
        return toResponse(repository.save(tipoSolicitacao));
    }

    @Transactional
    public TipoSolicitacaoResponse atualizar(Long id, TipoSolicitacaoRequest request) {
        TipoSolicitacao tipoSolicitacao = buscarEntidade(id);
        tipoSolicitacao.setNome(request.nome().trim());
        return toResponse(repository.save(tipoSolicitacao));
    }

    @Transactional
    public void excluir(Long id) {
        TipoSolicitacao tipoSolicitacao = buscarEntidade(id);
        repository.delete(tipoSolicitacao);
    }

    /** Exporta os tipos de solicitação filtrados (sem paginação) para Excel (.xlsx). */
    @Transactional(readOnly = true)
    public byte[] exportar(TipoSolicitacaoFiltro filtro) {
        List<TipoSolicitacao> lista = repository.findAll(
                TipoSolicitacaoSpecifications.comFiltro(filtro), Sort.by(Sort.Direction.ASC, "nome"));

        List<String> cabecalhos = List.of("ID", "Nome");

        List<List<Object>> linhas = new ArrayList<>();
        for (TipoSolicitacao t : lista) {
            linhas.add(Arrays.asList(t.getId(), t.getNome()));
        }
        return PlanilhaExcel.gerar("Tipos de Solicitação", cabecalhos, linhas);
    }

    // ----- auxiliares -----

    private TipoSolicitacao buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de solicitação não encontrado."));
    }

    private TipoSolicitacaoResponse toResponse(TipoSolicitacao tipoSolicitacao) {
        return new TipoSolicitacaoResponse(
                tipoSolicitacao.getId(),
                tipoSolicitacao.getNome());
    }

    /**
     * Garante size dentro de [5,100] e mantém apenas ordenações por campos permitidos,
     * caindo para a ordenação padrão (nome asc) quando nenhuma for válida.
     */
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
