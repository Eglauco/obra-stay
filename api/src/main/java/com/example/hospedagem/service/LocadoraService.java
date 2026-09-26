package com.example.hospedagem.service;

import com.example.hospedagem.domain.Locadora;
import com.example.hospedagem.dto.LocadoraFiltro;
import com.example.hospedagem.dto.LocadoraRequest;
import com.example.hospedagem.dto.LocadoraResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.LocadoraRepository;
import com.example.hospedagem.specification.LocadoraSpecifications;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regras de negócio do módulo Locadoras.
 */
@Service
public class LocadoraService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "nome");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.ASC, "nome");

    private final LocadoraRepository repository;

    public LocadoraService(LocadoraRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<LocadoraResponse> buscar(LocadoraFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Locadora> pagina = repository.findAll(
                LocadoraSpecifications.comFiltro(filtro), saneado);

        List<LocadoraResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public LocadoraResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    /**
     * Todas as locadoras ordenadas por nome (asc), para popular selects.
     */
    @Transactional(readOnly = true)
    public List<LocadoraResponse> listarOpcoes() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public LocadoraResponse criar(LocadoraRequest request) {
        Locadora locadora = Locadora.builder()
                .nome(request.nome().trim())
                .telefone(normalizarTelefone(request.telefone()))
                .build();
        return toResponse(repository.save(locadora));
    }

    @Transactional
    public LocadoraResponse atualizar(Long id, LocadoraRequest request) {
        Locadora locadora = buscarEntidade(id);
        locadora.setNome(request.nome().trim());
        locadora.setTelefone(normalizarTelefone(request.telefone()));
        return toResponse(repository.save(locadora));
    }

    @Transactional
    public void excluir(Long id) {
        Locadora locadora = buscarEntidade(id);
        repository.delete(locadora);
    }

    // ----- auxiliares -----

    private Locadora buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Locadora não encontrada."));
    }

    private LocadoraResponse toResponse(Locadora locadora) {
        return new LocadoraResponse(
                locadora.getId(),
                locadora.getNome(),
                locadora.getTelefone());
    }

    /** Mantém apenas os dígitos do telefone (o front pode enviar com máscara). */
    private String normalizarTelefone(String telefone) {
        return telefone == null ? null : telefone.replaceAll("\\D", "");
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
