package com.example.hospedagem.service;

import com.example.hospedagem.domain.StatusLocal;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.StatusLocalFiltro;
import com.example.hospedagem.dto.StatusLocalRequest;
import com.example.hospedagem.dto.StatusLocalResponse;
import com.example.hospedagem.exception.RegraNegocioException;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.LocalRepository;
import com.example.hospedagem.repository.StatusLocalRepository;
import com.example.hospedagem.specification.StatusLocalSpecifications;
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
 * Regras de negócio do módulo Status dos Locais.
 */
@Service
public class StatusLocalService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "nome", "hospedagemLiberada");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.ASC, "nome");

    private final StatusLocalRepository repository;
    private final LocalRepository localRepository;

    public StatusLocalService(StatusLocalRepository repository, LocalRepository localRepository) {
        this.repository = repository;
        this.localRepository = localRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<StatusLocalResponse> buscar(StatusLocalFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<StatusLocal> pagina = repository.findAll(
                StatusLocalSpecifications.comFiltro(filtro), saneado);

        List<StatusLocalResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public StatusLocalResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    /** Todos os status ordenados por nome (asc), para popular selects. */
    @Transactional(readOnly = true)
    public List<StatusLocalResponse> listarOpcoes() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public StatusLocalResponse criar(StatusLocalRequest request) {
        String nome = request.nome().trim();
        if (repository.existsByNomeIgnoreCase(nome)) {
            throw new RegraNegocioException("nome", "Já existe um status com este nome.");
        }
        StatusLocal status = StatusLocal.builder()
                .nome(nome)
                .hospedagemLiberada(request.hospedagemLiberada())
                .build();
        return toResponse(repository.save(status));
    }

    @Transactional
    public StatusLocalResponse atualizar(Long id, StatusLocalRequest request) {
        StatusLocal status = buscarEntidade(id);
        String nome = request.nome().trim();
        if (repository.existsByNomeIgnoreCaseAndIdNot(nome, id)) {
            throw new RegraNegocioException("nome", "Já existe um status com este nome.");
        }
        status.setNome(nome);
        status.setHospedagemLiberada(request.hospedagemLiberada());
        return toResponse(repository.save(status));
    }

    @Transactional
    public void excluir(Long id) {
        StatusLocal status = buscarEntidade(id);
        if (localRepository.existsByStatusId(id)) {
            throw new RegraNegocioException(null,
                    "Não é possível excluir: existem locais usando este status.");
        }
        repository.delete(status);
    }

    /** Exporta os status filtrados (sem paginação) para Excel (.xlsx). */
    @Transactional(readOnly = true)
    public byte[] exportar(StatusLocalFiltro filtro) {
        List<StatusLocal> lista = repository.findAll(
                StatusLocalSpecifications.comFiltro(filtro), Sort.by(Sort.Direction.ASC, "nome"));

        List<String> cabecalhos = List.of("ID", "Nome", "Hospedagem liberada");

        List<List<Object>> linhas = new ArrayList<>();
        for (StatusLocal s : lista) {
            linhas.add(Arrays.asList(
                    s.getId(),
                    s.getNome(),
                    s.isHospedagemLiberada() ? "Sim" : "Não"));
        }
        return PlanilhaExcel.gerar("Status dos Locais", cabecalhos, linhas);
    }

    // ----- auxiliares -----

    private StatusLocal buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Status não encontrado."));
    }

    private StatusLocalResponse toResponse(StatusLocal status) {
        return new StatusLocalResponse(
                status.getId(),
                status.getNome(),
                status.isHospedagemLiberada());
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
