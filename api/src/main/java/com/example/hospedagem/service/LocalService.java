package com.example.hospedagem.service;

import com.example.hospedagem.domain.Local;
import com.example.hospedagem.dto.LocalFiltro;
import com.example.hospedagem.dto.LocalRequest;
import com.example.hospedagem.dto.LocalResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.exception.DuplicateCodigoException;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.LocalRepository;
import com.example.hospedagem.specification.LocalSpecifications;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regras de negócio do módulo Locais.
 */
@Service
public class LocalService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS =
            Set.of("id", "codigo", "nome", "capacidade", "cidade");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.ASC, "nome");

    private final LocalRepository repository;

    public LocalService(LocalRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<LocalResponse> buscar(LocalFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Local> pagina = repository.findAll(
                LocalSpecifications.comFiltro(filtro), saneado);

        List<LocalResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public LocalResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public LocalResponse criar(LocalRequest request) {
        String codigo = request.codigo().trim();
        if (repository.existsByCodigoIgnoreCase(codigo)) {
            throw new DuplicateCodigoException("Já existe um local com este código.");
        }

        Local local = Local.builder()
                .codigo(codigo)
                .nome(request.nome().trim())
                .capacidade(request.capacidade())
                .cep(request.cep().trim())
                .logradouro(request.logradouro().trim())
                .numero(request.numero().trim())
                .complemento(normalizarOpcional(request.complemento()))
                .bairro(request.bairro().trim())
                .cidade(request.cidade().trim())
                .uf(request.uf().trim().toUpperCase())
                .build();

        return toResponse(repository.save(local));
    }

    @Transactional
    public LocalResponse atualizar(Long id, LocalRequest request) {
        Local local = buscarEntidade(id);

        String codigo = request.codigo().trim();
        if (repository.existsByCodigoIgnoreCaseAndIdNot(codigo, id)) {
            throw new DuplicateCodigoException("Já existe um local com este código.");
        }

        local.setCodigo(codigo);
        local.setNome(request.nome().trim());
        local.setCapacidade(request.capacidade());
        local.setCep(request.cep().trim());
        local.setLogradouro(request.logradouro().trim());
        local.setNumero(request.numero().trim());
        local.setComplemento(normalizarOpcional(request.complemento()));
        local.setBairro(request.bairro().trim());
        local.setCidade(request.cidade().trim());
        local.setUf(request.uf().trim().toUpperCase());

        return toResponse(repository.save(local));
    }

    @Transactional
    public void excluir(Long id) {
        Local local = buscarEntidade(id);
        repository.delete(local);
    }

    // ----- auxiliares -----

    private Local buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Local não encontrado."));
    }

    private LocalResponse toResponse(Local local) {
        return new LocalResponse(
                local.getId(),
                local.getCodigo(),
                local.getNome(),
                local.getCapacidade(),
                local.getCep(),
                local.getLogradouro(),
                local.getNumero(),
                local.getComplemento(),
                local.getBairro(),
                local.getCidade(),
                local.getUf());
    }

    /** Normaliza campo opcional: vazio/espaços viram null. */
    private String normalizarOpcional(String valor) {
        if (valor == null) {
            return null;
        }
        String limpo = valor.trim();
        return limpo.isEmpty() ? null : limpo;
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
