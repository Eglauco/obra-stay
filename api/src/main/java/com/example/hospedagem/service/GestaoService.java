package com.example.hospedagem.service;

import com.example.hospedagem.domain.Gestao;
import com.example.hospedagem.dto.GestaoFiltro;
import com.example.hospedagem.dto.GestaoRequest;
import com.example.hospedagem.dto.GestaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.GestaoRepository;
import com.example.hospedagem.specification.GestaoSpecifications;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regras de negócio do módulo Gestões.
 */
@Service
public class GestaoService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "nome");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.ASC, "nome");

    private final GestaoRepository repository;

    public GestaoService(GestaoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<GestaoResponse> buscar(GestaoFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Gestao> pagina = repository.findAll(
                GestaoSpecifications.comFiltro(filtro), saneado);

        List<GestaoResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public GestaoResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    /**
     * Todas as gestões ordenadas por nome (asc), para popular selects.
     */
    @Transactional(readOnly = true)
    public List<GestaoResponse> listarOpcoes() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public GestaoResponse criar(GestaoRequest request) {
        Gestao gestao = Gestao.builder()
                .nome(request.nome().trim())
                .build();
        return toResponse(repository.save(gestao));
    }

    @Transactional
    public GestaoResponse atualizar(Long id, GestaoRequest request) {
        Gestao gestao = buscarEntidade(id);
        gestao.setNome(request.nome().trim());
        return toResponse(repository.save(gestao));
    }

    @Transactional
    public void excluir(Long id) {
        Gestao gestao = buscarEntidade(id);
        repository.delete(gestao);
    }

    // ----- auxiliares -----

    private Gestao buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gestão não encontrada."));
    }

    private GestaoResponse toResponse(Gestao gestao) {
        return new GestaoResponse(
                gestao.getId(),
                gestao.getNome());
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
