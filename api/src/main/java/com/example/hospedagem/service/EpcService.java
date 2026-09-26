package com.example.hospedagem.service;

import com.example.hospedagem.domain.Epc;
import com.example.hospedagem.dto.EpcFiltro;
import com.example.hospedagem.dto.EpcRequest;
import com.example.hospedagem.dto.EpcResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.EpcRepository;
import com.example.hospedagem.specification.EpcSpecifications;
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
 * Regras de negócio do módulo EPC.
 */
@Service
public class EpcService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "nome");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.ASC, "nome");

    private final EpcRepository repository;

    public EpcService(EpcRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<EpcResponse> buscar(EpcFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Epc> pagina = repository.findAll(
                EpcSpecifications.comFiltro(filtro), saneado);

        List<EpcResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public EpcResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    /**
     * Todos os EPCs ordenados por nome (asc), para popular selects.
     */
    @Transactional(readOnly = true)
    public List<EpcResponse> listarOpcoes() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public EpcResponse criar(EpcRequest request) {
        Epc epc = Epc.builder()
                .nome(request.nome().trim())
                .build();
        return toResponse(repository.save(epc));
    }

    @Transactional
    public EpcResponse atualizar(Long id, EpcRequest request) {
        Epc epc = buscarEntidade(id);
        epc.setNome(request.nome().trim());
        return toResponse(repository.save(epc));
    }

    @Transactional
    public void excluir(Long id) {
        Epc epc = buscarEntidade(id);
        repository.delete(epc);
    }

    /** Exporta os EPCs filtrados (sem paginação) para Excel (.xlsx). */
    @Transactional(readOnly = true)
    public byte[] exportar(EpcFiltro filtro) {
        List<Epc> lista = repository.findAll(
                EpcSpecifications.comFiltro(filtro), Sort.by(Sort.Direction.ASC, "nome"));

        List<String> cabecalhos = List.of("ID", "Nome");

        List<List<Object>> linhas = new ArrayList<>();
        for (Epc e : lista) {
            linhas.add(Arrays.asList(
                    e.getId(),
                    e.getNome()));
        }
        return PlanilhaExcel.gerar("EPCs", cabecalhos, linhas);
    }

    // ----- auxiliares -----

    private Epc buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EPC não encontrado."));
    }

    private EpcResponse toResponse(Epc epc) {
        return new EpcResponse(
                epc.getId(),
                epc.getNome());
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
