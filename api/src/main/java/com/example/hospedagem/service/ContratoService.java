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
import com.example.hospedagem.exception.StorageException;
import com.example.hospedagem.repository.ContratoRepository;
import com.example.hospedagem.repository.LocadoraRepository;
import com.example.hospedagem.repository.LocalRepository;
import com.example.hospedagem.specification.ContratoSpecifications;
import com.example.hospedagem.util.PlanilhaExcel;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Regras de negócio do módulo Gestão de Contratos (locação de locais por locadoras).
 */
@Service
public class ContratoService {

    private static final Logger log = LoggerFactory.getLogger(ContratoService.class);

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

    // Arquivo (PDF) do contrato
    private static final String PREFIXO_ARQUIVO = "contratos";
    private static final long MAX_BYTES = 15L * 1024 * 1024;
    private static final Set<String> TIPOS_PERMITIDOS = Set.of("application/pdf");
    private static final Duration URL_TTL = Duration.ofHours(1);

    private final ContratoRepository repository;
    private final LocalRepository localRepository;
    private final LocadoraRepository locadoraRepository;
    private final ObjectProvider<StorageService> storageProvider;

    public ContratoService(ContratoRepository repository,
                           LocalRepository localRepository,
                           LocadoraRepository locadoraRepository,
                           ObjectProvider<StorageService> storageProvider) {
        this.repository = repository;
        this.localRepository = localRepository;
        this.locadoraRepository = locadoraRepository;
        this.storageProvider = storageProvider;
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
    public ContratoResponse criar(ContratoRequest request, MultipartFile arquivo) {
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

        if (temArquivo(arquivo)) {
            contrato.setArquivoKey(subirArquivo(arquivo));
        }

        return toResponse(repository.save(contrato));
    }

    @Transactional
    public ContratoResponse atualizar(Long id, ContratoRequest request, MultipartFile arquivo, boolean removerArquivo) {
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

        String keyAntiga = contrato.getArquivoKey();
        boolean apagarAntiga = false;
        if (temArquivo(arquivo)) {
            contrato.setArquivoKey(subirArquivo(arquivo));
            apagarAntiga = keyAntiga != null;
        } else if (removerArquivo && keyAntiga != null) {
            contrato.setArquivoKey(null);
            apagarAntiga = true;
        }

        Contrato salvo = repository.save(contrato);
        if (apagarAntiga) {
            apagarArquivoSilencioso(keyAntiga);
        }
        return toResponse(salvo);
    }

    @Transactional
    public void excluir(Long id) {
        Contrato contrato = buscarEntidade(id);
        String key = contrato.getArquivoKey();
        repository.delete(contrato);
        if (key != null) {
            apagarArquivoSilencioso(key);
        }
    }

    @Transactional(readOnly = true)
    public List<VigenciaResponse> vigencia() {
        return repository.vigentesEm(LocalDate.now());
    }

    /** Exporta os contratos filtrados (detalhe do local) para Excel. */
    @Transactional(readOnly = true)
    public byte[] exportar(ContratoFiltro filtro) {
        List<Contrato> lista = repository.findAll(
                ContratoSpecifications.comFiltro(filtro, LocalDate.now()),
                Sort.by(Sort.Direction.DESC, "dataInicio"));

        List<String> cabecalhos = List.of("Código", "Locadora", "Início", "Fim", "Status", "PDF");
        List<List<Object>> linhas = new ArrayList<>();
        for (Contrato c : lista) {
            String s = derivarStatus(c);
            String rotulo = s.equals(STATUS_VIGENTE) ? "Vigente"
                    : s.equals(STATUS_AGENDADO) ? "Agendado" : "Encerrado";
            linhas.add(Arrays.asList(
                    c.getCodigo(), c.getLocadora().getNome(),
                    c.getDataInicio(), c.getDataFim(), rotulo, c.getArquivoKey() != null));
        }
        return PlanilhaExcel.gerar("Contratos", cabecalhos, linhas);
    }

    /** Exporta a grade de locais com o contrato vigente (respeita o filtro de nome). */
    @Transactional(readOnly = true)
    public byte[] exportarLocais(String nome) {
        List<Local> locais = localRepository.findAll(Sort.by(Sort.Direction.ASC, "nome"));
        String termo = nome == null ? "" : nome.trim().toLowerCase();

        Map<Long, VigenciaResponse> vigencias = new HashMap<>();
        for (VigenciaResponse v : repository.vigentesEm(LocalDate.now())) {
            vigencias.put(v.localId(), v);
        }

        List<String> cabecalhos = List.of("Código", "Nome", "Cidade/UF",
                "Contrato vigente", "Locadora", "Início", "Fim");
        List<List<Object>> linhas = new ArrayList<>();
        for (Local l : locais) {
            if (!termo.isEmpty() && !l.getNome().toLowerCase().contains(termo)) {
                continue;
            }
            VigenciaResponse v = vigencias.get(l.getId());
            linhas.add(Arrays.asList(
                    l.getCodigo(), l.getNome(), l.getCidade() + "/" + l.getUf(),
                    v != null ? v.codigo() : null,
                    v != null ? v.locadoraNome() : null,
                    v != null ? v.dataInicio() : null,
                    v != null ? v.dataFim() : null));
        }
        return PlanilhaExcel.gerar("Locais - contratos", cabecalhos, linhas);
    }

    // ----- arquivo (PDF) -----

    private boolean temArquivo(MultipartFile arquivo) {
        return arquivo != null && !arquivo.isEmpty();
    }

    private String subirArquivo(MultipartFile arquivo) {
        validarArquivo(arquivo);
        byte[] bytes;
        try {
            bytes = arquivo.getBytes();
        } catch (IOException e) {
            throw new StorageException("Falha ao ler o arquivo enviado.", e);
        }
        return storage().upload(PREFIXO_ARQUIVO, "contrato.pdf", "application/pdf", bytes).key();
    }

    private void validarArquivo(MultipartFile arquivo) {
        String ct = arquivo.getContentType();
        if (ct == null || !TIPOS_PERMITIDOS.contains(ct.toLowerCase())) {
            throw new RegraNegocioException("arquivo", "Envie o contrato em PDF.");
        }
        if (arquivo.getSize() > MAX_BYTES) {
            throw new RegraNegocioException("arquivo", "O PDF deve ter no máximo 15 MB.");
        }
    }

    private StorageService storage() {
        StorageService s = storageProvider.getIfAvailable();
        if (s == null) {
            throw new RegraNegocioException("arquivo",
                    "Armazenamento de arquivos não está configurado no servidor.");
        }
        return s;
    }

    /** Apaga o arquivo no storage sem propagar erro (best-effort). */
    private void apagarArquivoSilencioso(String key) {
        StorageService s = storageProvider.getIfAvailable();
        if (s == null) {
            return;
        }
        try {
            s.delete(key);
        } catch (RuntimeException e) {
            log.warn("Não foi possível apagar o arquivo '{}': {}", key, e.getMessage());
        }
    }

    private String urlArquivo(String arquivoKey) {
        if (arquivoKey == null) {
            return null;
        }
        StorageService s = storageProvider.getIfAvailable();
        if (s == null) {
            return null;
        }
        try {
            return s.presignedGetUrl(arquivoKey, URL_TTL);
        } catch (RuntimeException e) {
            log.warn("Falha ao gerar URL do arquivo '{}': {}", arquivoKey, e.getMessage());
            return null;
        }
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
                derivarStatus(contrato),
                urlArquivo(contrato.getArquivoKey()));
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
