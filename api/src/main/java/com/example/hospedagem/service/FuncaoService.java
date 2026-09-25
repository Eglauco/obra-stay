package com.example.hospedagem.service;

import com.example.hospedagem.domain.Funcao;
import com.example.hospedagem.dto.FuncaoFiltro;
import com.example.hospedagem.dto.FuncaoRequest;
import com.example.hospedagem.dto.FuncaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.FuncaoRepository;
import com.example.hospedagem.specification.FuncaoSpecifications;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regras de negócio do módulo Funções.
 */
@Service
public class FuncaoService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "nome");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.ASC, "nome");

    private final FuncaoRepository repository;

    public FuncaoService(FuncaoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<FuncaoResponse> buscar(FuncaoFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Funcao> pagina = repository.findAll(
                FuncaoSpecifications.comFiltro(filtro), saneado);

        List<FuncaoResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    /**
     * Lista todas as funções ordenadas por nome asc (para selects).
     */
    @Transactional(readOnly = true)
    public List<FuncaoResponse> listarOpcoes() {
        return repository.findAll(ORDENACAO_PADRAO).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FuncaoResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public FuncaoResponse criar(FuncaoRequest request) {
        Funcao funcao = Funcao.builder()
                .nome(request.nome().trim())
                .build();
        return toResponse(repository.save(funcao));
    }

    @Transactional
    public FuncaoResponse atualizar(Long id, FuncaoRequest request) {
        Funcao funcao = buscarEntidade(id);
        funcao.setNome(request.nome().trim());
        return toResponse(repository.save(funcao));
    }

    @Transactional
    public void excluir(Long id) {
        Funcao funcao = buscarEntidade(id);
        repository.delete(funcao);
    }

    // ----- auxiliares -----

    private Funcao buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Função não encontrada."));
    }

    private FuncaoResponse toResponse(Funcao funcao) {
        return new FuncaoResponse(
                funcao.getId(),
                funcao.getNome());
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
