package com.example.hospedagem.service;

import com.example.hospedagem.domain.Contrato;
import com.example.hospedagem.domain.Local;
import com.example.hospedagem.domain.Locadora;
import com.example.hospedagem.dto.ContratoFiltro;
import com.example.hospedagem.dto.ContratoRequest;
import com.example.hospedagem.dto.ContratoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.ResumoRef;
import com.example.hospedagem.dto.VigenciaResponse;
import com.example.hospedagem.exception.RegraNegocioException;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.ContratoRepository;
import com.example.hospedagem.repository.LocadoraRepository;
import com.example.hospedagem.repository.LocalRepository;
import com.example.hospedagem.specification.ContratoSpecifications;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regras de negócio do módulo Gestão de Contratos (locação de locais por locadoras).
 */
@Service
public class ContratoService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "codigo", "dataInicio", "dataFim");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.DESC, "dataInicio");

    private static final String STATUS_VIGENTE = "VIGENTE";
    private static final String STATUS_AGENDADO = "AGENDADO";
    private static final String STATUS_ENCERRADO = "ENCERRADO";

    /** Id sentinela usado na criação (nenhum contrato existente a excluir da sobreposição). */
    private static final long ID_INEXISTENTE = -1L;

    private final ContratoRepository repository;
    private final LocalRepository localRepository;
    private final LocadoraRepository locadoraRepository;

    public ContratoService(ContratoRepository repository,
                           LocalRepository localRepository,
                           LocadoraRepository locadoraRepository) {
        this.repository = repository;
        this.localRepository = localRepository;
        this.locadoraRepository = locadoraRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ContratoResponse> buscar(ContratoFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Contrato> pagina = repository.findAll(
                ContratoSpecifications.comFiltro(filtro, LocalDate.now()), saneado);

        List<ContratoResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public ContratoResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public ContratoResponse criar(ContratoRequest request) {
        validarPeriodo(request);

        if (repository.existsByCodigoIgnoreCase(request.codigo().trim())) {
            throw new RegraNegocioException("codigo", "Já existe um contrato com este código.");
        }

        if (repository.existeSobreposicao(request.localId(), request.dataInicio(),
                request.dataFim(), ID_INEXISTENTE)) {
            throw new RegraNegocioException(null,
                    "Já existe um contrato neste período para este local.");
        }

        Local local = carregarLocal(request.localId());
        Locadora locadora = carregarLocadora(request.locadoraId());

        Contrato contrato = Contrato.builder()
                .codigo(request.codigo().trim())
                .local(local)
                .locadora(locadora)
                .dataInicio(request.dataInicio())
                .dataFim(request.dataFim())
                .build();

        return toResponse(repository.save(contrato));
    }

    @Transactional
    public ContratoResponse atualizar(Long id, ContratoRequest request) {
        Contrato contrato = buscarEntidade(id);
        validarPeriodo(request);

        if (repository.existsByCodigoIgnoreCaseAndIdNot(request.codigo().trim(), id)) {
            throw new RegraNegocioException("codigo", "Já existe um contrato com este código.");
        }

        if (repository.existeSobreposicao(request.localId(), request.dataInicio(),
                request.dataFim(), id)) {
            throw new RegraNegocioException(null,
                    "Já existe um contrato neste período para este local.");
        }

        Local local = carregarLocal(request.localId());
        Locadora locadora = carregarLocadora(request.locadoraId());

        contrato.setCodigo(request.codigo().trim());
        contrato.setLocal(local);
        contrato.setLocadora(locadora);
        contrato.setDataInicio(request.dataInicio());
        contrato.setDataFim(request.dataFim());

        return toResponse(repository.save(contrato));
    }

    @Transactional
    public void excluir(Long id) {
        Contrato contrato = buscarEntidade(id);
        repository.delete(contrato);
    }

    @Transactional(readOnly = true)
    public List<VigenciaResponse> vigencia() {
        return repository.vigentesEm(LocalDate.now());
    }

    // ----- auxiliares -----

    private void validarPeriodo(ContratoRequest request) {
        if (request.dataFim().isBefore(request.dataInicio())) {
            throw new RegraNegocioException("dataFim",
                    "A data de fim não pode ser anterior ao início.");
        }
    }

    private Local carregarLocal(Long localId) {
        return localRepository.findById(localId)
                .orElseThrow(() -> new ResourceNotFoundException("Local não encontrado."));
    }

    private Locadora carregarLocadora(Long locadoraId) {
        return locadoraRepository.findById(locadoraId)
                .orElseThrow(() -> new ResourceNotFoundException("Locadora não encontrada."));
    }

    private Contrato buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contrato não encontrado."));
    }

    private ContratoResponse toResponse(Contrato contrato) {
        Local local = contrato.getLocal();
        Locadora locadora = contrato.getLocadora();

        return new ContratoResponse(
                contrato.getId(),
                contrato.getCodigo(),
                new ResumoRef(local.getId(), local.getNome()),
                new ResumoRef(locadora.getId(), locadora.getNome()),
                contrato.getDataInicio(),
                contrato.getDataFim(),
                derivarStatus(contrato));
    }

    /** Status derivado comparando a data atual com o período do contrato. */
    private String derivarStatus(Contrato contrato) {
        LocalDate hoje = LocalDate.now();
        if (hoje.isBefore(contrato.getDataInicio())) {
            return STATUS_AGENDADO;
        }
        if (hoje.isAfter(contrato.getDataFim())) {
            return STATUS_ENCERRADO;
        }
        return STATUS_VIGENTE;
    }

    /**
     * Garante size dentro de [5,100] e mantém apenas ordenações por campos permitidos,
     * caindo para a ordenação padrão (dataInicio desc) quando nenhuma for válida.
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
