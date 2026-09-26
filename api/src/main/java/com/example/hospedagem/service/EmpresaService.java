package com.example.hospedagem.service;

import com.example.hospedagem.domain.Empresa;
import com.example.hospedagem.dto.EmpresaFiltro;
import com.example.hospedagem.dto.EmpresaRequest;
import com.example.hospedagem.dto.EmpresaResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.EmpresaRepository;
import com.example.hospedagem.specification.EmpresaSpecifications;
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
 * Regras de negócio do módulo Empresas.
 */
@Service
public class EmpresaService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "nome");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.ASC, "nome");

    private final EmpresaRepository repository;

    public EmpresaService(EmpresaRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<EmpresaResponse> buscar(EmpresaFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Empresa> pagina = repository.findAll(
                EmpresaSpecifications.comFiltro(filtro), saneado);

        List<EmpresaResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public EmpresaResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    /**
     * Todas as empresas ordenadas por nome (asc), para popular selects.
     */
    @Transactional(readOnly = true)
    public List<EmpresaResponse> listarOpcoes() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public EmpresaResponse criar(EmpresaRequest request) {
        Empresa empresa = Empresa.builder()
                .nome(request.nome().trim())
                .build();
        return toResponse(repository.save(empresa));
    }

    @Transactional
    public EmpresaResponse atualizar(Long id, EmpresaRequest request) {
        Empresa empresa = buscarEntidade(id);
        empresa.setNome(request.nome().trim());
        return toResponse(repository.save(empresa));
    }

    @Transactional
    public void excluir(Long id) {
        Empresa empresa = buscarEntidade(id);
        repository.delete(empresa);
    }

    /** Exporta as empresas filtradas (sem paginação) para Excel (.xlsx). */
    @Transactional(readOnly = true)
    public byte[] exportar(EmpresaFiltro filtro) {
        List<Empresa> lista = repository.findAll(
                EmpresaSpecifications.comFiltro(filtro), Sort.by(Sort.Direction.ASC, "nome"));

        List<String> cabecalhos = List.of("ID", "Nome");

        List<List<Object>> linhas = new ArrayList<>();
        for (Empresa e : lista) {
            linhas.add(Arrays.asList(
                    e.getId(),
                    e.getNome()));
        }
        return PlanilhaExcel.gerar("Empresas", cabecalhos, linhas);
    }

    // ----- auxiliares -----

    private Empresa buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada."));
    }

    private EmpresaResponse toResponse(Empresa empresa) {
        return new EmpresaResponse(
                empresa.getId(),
                empresa.getNome());
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
