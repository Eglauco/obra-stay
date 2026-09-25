package com.example.hospedagem.service;

import com.example.hospedagem.domain.Colaborador;
import com.example.hospedagem.domain.Empresa;
import com.example.hospedagem.domain.Epc;
import com.example.hospedagem.domain.Funcao;
import com.example.hospedagem.domain.Gestao;
import com.example.hospedagem.dto.ColaboradorFiltro;
import com.example.hospedagem.dto.ColaboradorRequest;
import com.example.hospedagem.dto.ColaboradorResponse;
import com.example.hospedagem.dto.EmpresaResponse;
import com.example.hospedagem.dto.EpcResponse;
import com.example.hospedagem.dto.FuncaoResponse;
import com.example.hospedagem.dto.GestaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.exception.RegraNegocioException;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.ColaboradorRepository;
import com.example.hospedagem.repository.EmpresaRepository;
import com.example.hospedagem.repository.EpcRepository;
import com.example.hospedagem.repository.FuncaoRepository;
import com.example.hospedagem.repository.GestaoRepository;
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
    private final EpcRepository epcRepository;
    private final EmpresaRepository empresaRepository;
    private final GestaoRepository gestaoRepository;

    public ColaboradorService(ColaboradorRepository repository,
                              FuncaoRepository funcaoRepository,
                              EpcRepository epcRepository,
                              EmpresaRepository empresaRepository,
                              GestaoRepository gestaoRepository) {
        this.repository = repository;
        this.funcaoRepository = funcaoRepository;
        this.epcRepository = epcRepository;
        this.empresaRepository = empresaRepository;
        this.gestaoRepository = gestaoRepository;
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
        String cpf = normalizarCpf(request.cpf());
        if (repository.existsByCpf(cpf)) {
            throw new RegraNegocioException("cpf", "Já existe um colaborador com este CPF.");
        }
        Colaborador colaborador = Colaborador.builder()
                .nome(request.nome().trim())
                .sexo(request.sexo())
                .mdo(request.mdo())
                .cpf(cpf)
                .email(request.email().trim().toLowerCase())
                .funcao(buscarFuncao(request.funcaoId()))
                .epc(buscarEpc(request.epcId()))
                .empresa(buscarEmpresa(request.empresaId()))
                .gestao(buscarGestao(request.gestaoId()))
                .build();
        return toResponse(repository.save(colaborador));
    }

    @Transactional
    public ColaboradorResponse atualizar(Long id, ColaboradorRequest request) {
        Colaborador colaborador = buscarEntidade(id);
        String cpf = normalizarCpf(request.cpf());
        if (repository.existsByCpfAndIdNot(cpf, id)) {
            throw new RegraNegocioException("cpf", "Já existe um colaborador com este CPF.");
        }
        colaborador.setNome(request.nome().trim());
        colaborador.setSexo(request.sexo());
        colaborador.setMdo(request.mdo());
        colaborador.setCpf(cpf);
        colaborador.setEmail(request.email().trim().toLowerCase());
        colaborador.setFuncao(buscarFuncao(request.funcaoId()));
        colaborador.setEpc(buscarEpc(request.epcId()));
        colaborador.setEmpresa(buscarEmpresa(request.empresaId()));
        colaborador.setGestao(buscarGestao(request.gestaoId()));
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

    private Epc buscarEpc(Long epcId) {
        return epcRepository.findById(epcId)
                .orElseThrow(() -> new ResourceNotFoundException("EPC não encontrado."));
    }

    private Empresa buscarEmpresa(Long empresaId) {
        return empresaRepository.findById(empresaId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada."));
    }

    private Gestao buscarGestao(Long gestaoId) {
        return gestaoRepository.findById(gestaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Gestão não encontrada."));
    }

    /** Mantém apenas os dígitos do CPF (o front pode enviar com máscara). */
    private String normalizarCpf(String cpf) {
        return cpf == null ? null : cpf.replaceAll("\\D", "");
    }

    private ColaboradorResponse toResponse(Colaborador colaborador) {
        Funcao funcao = colaborador.getFuncao();
        Epc epc = colaborador.getEpc();
        Empresa empresa = colaborador.getEmpresa();
        Gestao gestao = colaborador.getGestao();
        return new ColaboradorResponse(
                colaborador.getId(),
                colaborador.getNome(),
                colaborador.getSexo(),
                colaborador.getMdo(),
                colaborador.getCpf(),
                colaborador.getEmail(),
                new FuncaoResponse(funcao.getId(), funcao.getNome()),
                new EpcResponse(epc.getId(), epc.getNome()),
                new EmpresaResponse(empresa.getId(), empresa.getNome()),
                new GestaoResponse(gestao.getId(), gestao.getNome()));
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
