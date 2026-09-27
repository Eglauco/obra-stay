package com.example.hospedagem.service;

import com.example.hospedagem.domain.ItemMobiliaLocal;
import com.example.hospedagem.domain.Local;
import com.example.hospedagem.domain.LocalStatusHistorico;
import com.example.hospedagem.domain.StatusLocal;
import com.example.hospedagem.dto.ItemMobiliaLocalRequest;
import com.example.hospedagem.dto.ItemMobiliaLocalResponse;
import com.example.hospedagem.dto.LocalFiltro;
import com.example.hospedagem.dto.LocalRequest;
import com.example.hospedagem.dto.LocalResponse;
import com.example.hospedagem.dto.LocalStatusHistoricoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.TrocarStatusLocalRequest;
import com.example.hospedagem.exception.DuplicateCodigoException;
import com.example.hospedagem.exception.RegraNegocioException;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.exception.StorageException;
import com.example.hospedagem.repository.LocalRepository;
import com.example.hospedagem.repository.LocalStatusHistoricoRepository;
import com.example.hospedagem.repository.StatusLocalRepository;
import com.example.hospedagem.repository.UsuarioRepository;
import com.example.hospedagem.specification.LocalSpecifications;
import com.example.hospedagem.util.PlanilhaExcel;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import org.springframework.util.StringUtils;
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
import java.math.BigDecimal;

/**
 * Regras de negócio do módulo Locais.
 */
@Service
public class LocalService {

    private static final Logger log = LoggerFactory.getLogger(LocalService.class);

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS =
            Set.of("id", "codigo", "nome", "capacidade", "cidade");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.ASC, "nome");

    // Foto do local
    private static final String PREFIXO_FOTO = "locais";
    private static final int MAX_LADO = 1600;
    private static final double QUALIDADE = 0.85;
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Set<String> TIPOS_PERMITIDOS =
            Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");
    private static final Duration URL_TTL = Duration.ofHours(1);

    private final LocalRepository repository;
    private final StatusLocalRepository statusRepository;
    private final LocalStatusHistoricoRepository historicoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectProvider<StorageService> storageProvider;
    private final ProcessadorImagem processador;

    public LocalService(LocalRepository repository,
                        StatusLocalRepository statusRepository,
                        LocalStatusHistoricoRepository historicoRepository,
                        UsuarioRepository usuarioRepository,
                        ObjectProvider<StorageService> storageProvider,
                        ProcessadorImagem processador) {
        this.repository = repository;
        this.statusRepository = statusRepository;
        this.historicoRepository = historicoRepository;
        this.usuarioRepository = usuarioRepository;
        this.storageProvider = storageProvider;
        this.processador = processador;
    }

    @Transactional(readOnly = true)
    public PageResponse<LocalResponse> buscar(LocalFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Local> pagina = repository.findAll(
                LocalSpecifications.comFiltro(filtro), saneado);

        // Lista não carrega os itens de mobília (evita N+1 e payload pesado).
        List<LocalResponse> conteudo = pagina.getContent().stream()
                .map(l -> toResponse(l, false))
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public LocalResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public LocalResponse criar(LocalRequest request, MultipartFile foto, String usuarioEmail) {
        String codigo = request.codigo().trim();
        if (repository.existsByCodigoIgnoreCase(codigo)) {
            throw new DuplicateCodigoException("Já existe um local com este código.");
        }

        StatusLocal status = carregarStatus(request.statusId());

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
                .quartos(request.quartos())
                .valorAluguel(request.valorAluguel() != null ? request.valorAluguel() : BigDecimal.ZERO)
                .status(status)
                .build();
        aplicarItensMobilia(local, request.itensMobilia());

        if (temFoto(foto)) {
            local.setFotoKey(subirFoto(foto));
        }

        Local salvo = repository.save(local);
        // Registro inicial do histórico (sem status anterior).
        registrarHistorico(salvo, null, status, null, usuarioEmail);
        return toResponse(salvo);
    }

    @Transactional
    public LocalResponse atualizar(Long id, LocalRequest request, MultipartFile foto, boolean removerFoto) {
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
        local.setQuartos(request.quartos());
        local.setValorAluguel(request.valorAluguel() != null ? request.valorAluguel() : BigDecimal.ZERO);
        // Substitui a lista de itens de mobília do local (orphanRemoval apaga os antigos).
        local.limparItensMobilia();
        aplicarItensMobilia(local, request.itensMobilia());

        String keyAntiga = local.getFotoKey();
        boolean apagarAntiga = false;
        if (temFoto(foto)) {
            // Troca de foto: sobe a nova; a antiga é apagada após salvar.
            local.setFotoKey(subirFoto(foto));
            apagarAntiga = keyAntiga != null;
        } else if (removerFoto && keyAntiga != null) {
            local.setFotoKey(null);
            apagarAntiga = true;
        }

        Local salvo = repository.save(local);
        if (apagarAntiga) {
            apagarFotoSilencioso(keyAntiga);
        }
        return toResponse(salvo);
    }

    @Transactional
    public void excluir(Long id) {
        Local local = buscarEntidade(id);
        String key = local.getFotoKey();
        repository.delete(local);
        if (key != null) {
            apagarFotoSilencioso(key);
        }
    }

    /**
     * Troca o status atual do local e registra a mudança no histórico (aplicação imediata).
     * A observação é opcional; o autor é o usuário logado.
     */
    @Transactional
    public LocalResponse trocarStatus(Long id, TrocarStatusLocalRequest request, String usuarioEmail) {
        Local local = buscarEntidade(id);
        StatusLocal novo = carregarStatus(request.statusId());
        StatusLocal atual = local.getStatus();

        if (atual != null && atual.getId().equals(novo.getId())) {
            throw new RegraNegocioException("statusId", "O local já está com este status.");
        }

        local.setStatus(novo);
        Local salvo = repository.save(local);
        registrarHistorico(salvo, atual, novo, request.observacao(), usuarioEmail);
        return toResponse(salvo);
    }

    /** Histórico de mudanças de status do local (mais recente primeiro). */
    @Transactional(readOnly = true)
    public List<LocalStatusHistoricoResponse> historicoStatus(Long id) {
        buscarEntidade(id);
        return historicoRepository.findByLocalIdOrderByCriadoEmDescIdDesc(id).stream()
                .map(h -> new LocalStatusHistoricoResponse(
                        h.getId(), h.getStatusAnteriorNome(), h.getStatusNovoNome(),
                        h.getObservacao(), h.getUsuarioNome(), h.getCriadoEm()))
                .toList();
    }

    /** Exporta os locais filtrados (sem paginação) para Excel (.xlsx). */
    @Transactional(readOnly = true)
    public byte[] exportar(LocalFiltro filtro) {
        List<Local> lista = repository.findAll(
                LocalSpecifications.comFiltro(filtro), Sort.by(Sort.Direction.ASC, "nome"));

        List<String> cabecalhos = List.of("ID", "Código", "Nome", "Capacidade", "Quartos", "Valor aluguel",
                "CEP", "Logradouro", "Número", "Complemento", "Bairro", "Cidade", "UF",
                "Status", "Hospedagem liberada", "Tem foto");

        List<List<Object>> linhas = new ArrayList<>();
        for (Local l : lista) {
            StatusLocal status = l.getStatus();
            linhas.add(Arrays.asList(
                    l.getId(),
                    l.getCodigo(),
                    l.getNome(),
                    l.getCapacidade(),
                    l.getQuartos(),
                    l.getValorAluguel(),
                    l.getCep(),
                    l.getLogradouro(),
                    l.getNumero(),
                    l.getComplemento(),
                    l.getBairro(),
                    l.getCidade(),
                    l.getUf(),
                    status != null ? status.getNome() : "",
                    status != null && status.isHospedagemLiberada() ? "Sim" : "Não",
                    l.getFotoKey() != null));
        }
        return PlanilhaExcel.gerar("Locais", cabecalhos, linhas);
    }

    // ----- foto -----

    private boolean temFoto(MultipartFile foto) {
        return foto != null && !foto.isEmpty();
    }

    private String subirFoto(MultipartFile foto) {
        validarFoto(foto);
        byte[] bytes;
        try {
            bytes = foto.getBytes();
        } catch (IOException e) {
            throw new StorageException("Falha ao ler o arquivo enviado.", e);
        }
        ProcessadorImagem.ImagemProcessada img =
                processador.processar(bytes, foto.getContentType(), MAX_LADO, QUALIDADE);
        return storage().upload(PREFIXO_FOTO, "foto" + img.extensao(), img.contentType(), img.bytes()).key();
    }

    private void validarFoto(MultipartFile foto) {
        String ct = foto.getContentType();
        if (ct == null || !TIPOS_PERMITIDOS.contains(ct.toLowerCase())) {
            throw new RegraNegocioException("foto", "Formato inválido. Envie JPG, PNG ou WebP.");
        }
        if (foto.getSize() > MAX_BYTES) {
            throw new RegraNegocioException("foto", "A imagem deve ter no máximo 5 MB.");
        }
    }

    private StorageService storage() {
        StorageService s = storageProvider.getIfAvailable();
        if (s == null) {
            throw new RegraNegocioException("foto",
                    "Armazenamento de arquivos não está configurado no servidor.");
        }
        return s;
    }

    /** Apaga a foto no storage sem propagar erro (best-effort). */
    private void apagarFotoSilencioso(String key) {
        StorageService s = storageProvider.getIfAvailable();
        if (s == null) {
            return;
        }
        try {
            s.delete(key);
        } catch (RuntimeException e) {
            log.warn("Não foi possível apagar a foto '{}': {}", key, e.getMessage());
        }
    }

    // ----- auxiliares -----

    private Local buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Local não encontrado."));
    }

    private StatusLocal carregarStatus(Long statusId) {
        return statusRepository.findById(statusId)
                .orElseThrow(() -> new ResourceNotFoundException("Status não encontrado."));
    }

    /** Grava uma linha de auditoria no histórico de status (snapshot de nomes e autor). */
    private void registrarHistorico(Local local, StatusLocal anterior, StatusLocal novo,
                                    String observacao, String usuarioEmail) {
        historicoRepository.save(LocalStatusHistorico.builder()
                .local(local)
                .statusAnteriorId(anterior != null ? anterior.getId() : null)
                .statusAnteriorNome(anterior != null ? anterior.getNome() : null)
                .statusNovoId(novo.getId())
                .statusNovoNome(novo.getNome())
                .observacao(normalizarOpcional(observacao))
                .usuarioNome(resolverNomeUsuario(usuarioEmail))
                .criadoEm(LocalDateTime.now())
                .build());
    }

    /** Nome do usuário logado a partir do e-mail (para snapshot no histórico). */
    private String resolverNomeUsuario(String email) {
        if (!StringUtils.hasText(email)) {
            return null;
        }
        return usuarioRepository.findByEmailIgnoreCase(email)
                .map(u -> u.getNome())
                .orElse(email);
    }

    private LocalResponse toResponse(Local local) {
        return toResponse(local, true);
    }

    private LocalResponse toResponse(Local local, boolean incluirMobilia) {
        StatusLocal status = local.getStatus();
        List<ItemMobiliaLocalResponse> mobilia = incluirMobilia
                ? local.getItensMobilia().stream()
                        .map(i -> new ItemMobiliaLocalResponse(
                                i.getId(), i.getNome(), i.getPrecoUnitario(), i.getQuantidade()))
                        .toList()
                : List.of();
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
                local.getUf(),
                urlFoto(local.getFotoKey()),
                status != null ? status.getId() : null,
                status != null ? status.getNome() : null,
                status != null && status.isHospedagemLiberada(),
                local.getQuartos(),
                local.getValorAluguel(),
                mobilia);
    }

    /** Copia os itens de mobília do request para o local (define a ordem pela posição). */
    private void aplicarItensMobilia(Local local, List<ItemMobiliaLocalRequest> itens) {
        if (itens == null) {
            return;
        }
        int ordem = 0;
        for (ItemMobiliaLocalRequest it : itens) {
            local.addItemMobilia(ItemMobiliaLocal.builder()
                    .nome(it.nome().trim())
                    .precoUnitario(it.precoUnitario())
                    .quantidade(it.quantidade())
                    .ordem(ordem++)
                    .build());
        }
    }

    /** URL pré-assinada (válida por 1h) da foto, ou null quando não há foto/storage. */
    private String urlFoto(String fotoKey) {
        if (fotoKey == null) {
            return null;
        }
        StorageService s = storageProvider.getIfAvailable();
        if (s == null) {
            return null;
        }
        try {
            return s.presignedGetUrl(fotoKey, URL_TTL);
        } catch (RuntimeException e) {
            log.warn("Falha ao gerar URL da foto '{}': {}", fotoKey, e.getMessage());
            return null;
        }
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
