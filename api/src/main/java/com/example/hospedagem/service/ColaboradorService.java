package com.example.hospedagem.service;

import com.example.hospedagem.domain.Colaborador;
import com.example.hospedagem.domain.Funcao;
import com.example.hospedagem.dto.ColaboradorFiltro;
import com.example.hospedagem.dto.ColaboradorRequest;
import com.example.hospedagem.dto.ColaboradorResponse;
import com.example.hospedagem.dto.FuncaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.ColaboradorRepository;
import com.example.hospedagem.repository.FuncaoRepository;
import com.example.hospedagem.specification.ColaboradorSpecifications;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regras de negócio do módulo Colaboradores.
 */
@Service
public class ColaboradorService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "nome", "sexo");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.ASC, "nome");

    private final ColaboradorRepository repository;
    private final FuncaoRepository funcaoRepository;

    public ColaboradorService(ColaboradorRepository repository, FuncaoRepository funcaoRepository) {
        this.repository = repository;
        this.funcaoRepository = funcaoRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ColaboradorResponse> buscar(ColaboradorFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Colaborador> pagina = repository.findAll(
                ColaboradorSpecifications.comFiltro(filtro), saneado);

        List<ColaboradorResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public ColaboradorResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    /**
     * Lista todos os colaboradores (ordenados por nome asc) para popular selects/dropdowns.
     */
    @Transactional(readOnly = true)
    public List<ColaboradorResponse> listarOpcoes() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ColaboradorResponse criar(ColaboradorRequest request) {
        Colaborador colaborador = Colaborador.builder()
                .nome(request.nome().trim())
                .sexo(request.sexo())
                .funcao(buscarFuncao(request.funcaoId()))
                .build();
        return toResponse(repository.save(colaborador));
    }

    @Transactional
    public ColaboradorResponse atualizar(Long id, ColaboradorRequest request) {
        Colaborador colaborador = buscarEntidade(id);
        colaborador.setNome(request.nome().trim());
        colaborador.setSexo(request.sexo());
        colaborador.setFuncao(buscarFuncao(request.funcaoId()));
        return toResponse(repository.save(colaborador));
    }

    @Transactional
    public void excluir(Long id) {
        Colaborador colaborador = buscarEntidade(id);
        repository.delete(colaborador);
    }

    // ----- auxiliares -----

    private Colaborador buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado."));
    }

    private Funcao buscarFuncao(Long funcaoId) {
        return funcaoRepository.findById(funcaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Função não encontrada."));
    }

    private ColaboradorResponse toResponse(Colaborador colaborador) {
        Funcao funcao = colaborador.getFuncao();
        return new ColaboradorResponse(
                colaborador.getId(),
                colaborador.getNome(),
                colaborador.getSexo(),
                new FuncaoResponse(funcao.getId(), funcao.getNome()));
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
