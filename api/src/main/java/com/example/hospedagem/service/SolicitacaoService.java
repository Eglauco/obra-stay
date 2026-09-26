package com.example.hospedagem.service;

import com.example.hospedagem.domain.Colaborador;
import com.example.hospedagem.domain.Local;
import com.example.hospedagem.domain.Solicitacao;
import com.example.hospedagem.domain.SolicitacaoHistorico;
import com.example.hospedagem.domain.StatusSolicitacao;
import com.example.hospedagem.domain.TipoSolicitacao;
import com.example.hospedagem.dto.HistoricoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.ResumoRef;
import com.example.hospedagem.dto.SolicitacaoFiltro;
import com.example.hospedagem.dto.SolicitacaoPublicaRequest;
import com.example.hospedagem.dto.SolicitacaoRequest;
import com.example.hospedagem.dto.SolicitacaoResponse;
import com.example.hospedagem.exception.RegraNegocioException;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.ColaboradorRepository;
import com.example.hospedagem.repository.HospedagemRepository;
import com.example.hospedagem.repository.LocalRepository;
import com.example.hospedagem.repository.SolicitacaoHistoricoRepository;
import com.example.hospedagem.repository.SolicitacaoRepository;
import com.example.hospedagem.repository.TipoSolicitacaoRepository;
import com.example.hospedagem.specification.SolicitacaoSpecifications;
import com.example.hospedagem.util.PlanilhaExcel;
import java.time.LocalDateTime;
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
 * Regras de negócio do módulo Solicitações.
 *
 * Ciclo de vida (máquina de estados): AGUARDANDO_ANALISE -> EM_PROCESSAMENTO -> FINALIZADA;
 * CANCELADA a partir de aguardando/processamento; FINALIZADA/CANCELADA podem ser reabertas.
 * Regra de vínculo: o colaborador só pode abrir solicitação em local onde está/esteve hospedado.
 */
@Service
public class SolicitacaoService {

    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "dataHoraAbertura", "status");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.DESC, "dataHoraAbertura");

    private final SolicitacaoRepository repository;
    private final SolicitacaoHistoricoRepository historicoRepository;
    private final TipoSolicitacaoRepository tipoSolicitacaoRepository;
    private final ColaboradorRepository colaboradorRepository;
    private final LocalRepository localRepository;
    private final HospedagemRepository hospedagemRepository;

    public SolicitacaoService(SolicitacaoRepository repository,
                              SolicitacaoHistoricoRepository historicoRepository,
                              TipoSolicitacaoRepository tipoSolicitacaoRepository,
                              ColaboradorRepository colaboradorRepository,
                              LocalRepository localRepository,
                              HospedagemRepository hospedagemRepository) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
        this.tipoSolicitacaoRepository = tipoSolicitacaoRepository;
        this.colaboradorRepository = colaboradorRepository;
        this.localRepository = localRepository;
        this.hospedagemRepository = hospedagemRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<SolicitacaoResponse> buscar(SolicitacaoFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Solicitacao> pagina = repository.findAll(
                SolicitacaoSpecifications.comFiltro(filtro), saneado);

        List<SolicitacaoResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public SolicitacaoResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public SolicitacaoResponse criar(SolicitacaoRequest request) {
        TipoSolicitacao tipo = buscarTipo(request.tipoSolicitacaoId());
        Colaborador colaborador = buscarColaborador(request.colaboradorId());
        Local local = buscarLocal(request.localId());
        validarHospedagem(colaborador.getId(), local.getId());

        Solicitacao solicitacao = Solicitacao.builder()
                .tipoSolicitacao(tipo)
                .colaborador(colaborador)
                .local(local)
                .observacao(request.observacao().trim())
                .status(StatusSolicitacao.AGUARDANDO_ANALISE)
                .dataHoraAbertura(LocalDateTime.now())
                .dataHoraEncerramento(null)
                .build();

        Solicitacao salvo = repository.save(solicitacao);
        registrarHistorico(salvo, StatusSolicitacao.AGUARDANDO_ANALISE, null, salvo.getDataHoraAbertura());
        return toResponse(salvo);
    }

    @Transactional
    public SolicitacaoResponse atualizar(Long id, SolicitacaoRequest request) {
        Solicitacao solicitacao = buscarEntidade(id);
        if (encerrada(solicitacao.getStatus())) {
            throw new RegraNegocioException(null,
                    "Não é possível editar uma solicitação encerrada. Reabra-a primeiro.");
        }

        Colaborador colaborador = buscarColaborador(request.colaboradorId());
        Local local = buscarLocal(request.localId());
        validarHospedagem(colaborador.getId(), local.getId());

        solicitacao.setTipoSolicitacao(buscarTipo(request.tipoSolicitacaoId()));
        solicitacao.setColaborador(colaborador);
        solicitacao.setLocal(local);
        solicitacao.setObservacao(request.observacao().trim());
        return toResponse(repository.save(solicitacao));
    }

    /** Abertura de solicitação pelo quiosque (QR Code), identificando o colaborador por CPF. */
    @Transactional
    public SolicitacaoResponse criarPublica(SolicitacaoPublicaRequest request) {
        Colaborador colaborador = buscarColaboradorPorCpf(request.cpf());
        TipoSolicitacao tipo = buscarTipo(request.tipoSolicitacaoId());
        Local local = buscarLocal(request.localId());
        validarHospedagem(colaborador.getId(), local.getId());

        Solicitacao solicitacao = Solicitacao.builder()
                .tipoSolicitacao(tipo)
                .colaborador(colaborador)
                .local(local)
                .observacao(request.observacao().trim())
                .status(StatusSolicitacao.AGUARDANDO_ANALISE)
                .dataHoraAbertura(LocalDateTime.now())
                .dataHoraEncerramento(null)
                .build();
        Solicitacao salvo = repository.save(solicitacao);
        registrarHistorico(salvo, StatusSolicitacao.AGUARDANDO_ANALISE, null, salvo.getDataHoraAbertura());
        return toResponse(salvo);
    }

    /** Todas as solicitações do colaborador (qualquer status), pelo CPF, para acompanhamento. */
    @Transactional(readOnly = true)
    public List<SolicitacaoResponse> acompanharPublica(String cpf) {
        Colaborador colaborador = buscarColaboradorPorCpf(cpf);
        return repository
                .findByColaboradorIdOrderByDataHoraAberturaDesc(colaborador.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SolicitacaoResponse iniciar(Long id, String observacao) {
        Solicitacao s = buscarEntidade(id);
        if (s.getStatus() != StatusSolicitacao.AGUARDANDO_ANALISE) {
            throw new RegraNegocioException(null,
                    "Só é possível iniciar solicitações que estão aguardando análise.");
        }
        LocalDateTime agora = LocalDateTime.now();
        s.setStatus(StatusSolicitacao.EM_PROCESSAMENTO);
        registrarHistorico(s, StatusSolicitacao.EM_PROCESSAMENTO, observacao, agora);
        return toResponse(repository.save(s));
    }

    @Transactional
    public SolicitacaoResponse finalizar(Long id, String observacao) {
        Solicitacao s = buscarEntidade(id);
        if (s.getStatus() != StatusSolicitacao.EM_PROCESSAMENTO) {
            throw new RegraNegocioException(null,
                    "Só é possível finalizar solicitações em processamento.");
        }
        LocalDateTime agora = LocalDateTime.now();
        s.setStatus(StatusSolicitacao.FINALIZADA);
        s.setDataHoraEncerramento(agora);
        registrarHistorico(s, StatusSolicitacao.FINALIZADA, observacao, agora);
        return toResponse(repository.save(s));
    }

    @Transactional
    public SolicitacaoResponse cancelar(Long id, String observacao) {
        Solicitacao s = buscarEntidade(id);
        if (encerrada(s.getStatus())) {
            throw new RegraNegocioException(null, "Esta solicitação já está encerrada.");
        }
        LocalDateTime agora = LocalDateTime.now();
        s.setStatus(StatusSolicitacao.CANCELADA);
        s.setDataHoraEncerramento(agora);
        registrarHistorico(s, StatusSolicitacao.CANCELADA, observacao, agora);
        return toResponse(repository.save(s));
    }

    @Transactional
    public SolicitacaoResponse reabrir(Long id, String observacao) {
        Solicitacao s = buscarEntidade(id);
        if (!encerrada(s.getStatus())) {
            throw new RegraNegocioException(null,
                    "Só é possível reabrir solicitações finalizadas ou canceladas.");
        }
        LocalDateTime agora = LocalDateTime.now();
        s.setStatus(StatusSolicitacao.EM_PROCESSAMENTO);
        s.setDataHoraEncerramento(null);
        registrarHistorico(s, StatusSolicitacao.EM_PROCESSAMENTO, observacao, agora);
        return toResponse(repository.save(s));
    }

    @Transactional
    public void excluir(Long id) {
        Solicitacao s = buscarEntidade(id);
        repository.delete(s);
    }

    /** Exporta as solicitações filtradas (sem paginação) para Excel (.xlsx). */
    @Transactional(readOnly = true)
    public byte[] exportar(SolicitacaoFiltro filtro) {
        List<Solicitacao> lista = repository.findAll(
                SolicitacaoSpecifications.comFiltro(filtro),
                Sort.by(Sort.Direction.DESC, "dataHoraAbertura"));

        List<String> cabecalhos = List.of("ID", "Tipo", "Colaborador", "Local", "Status",
                "Aberta em", "Encerrada em", "Observação");

        List<List<Object>> linhas = new ArrayList<>();
        for (Solicitacao s : lista) {
            linhas.add(Arrays.asList(
                    s.getId(),
                    s.getTipoSolicitacao() != null ? s.getTipoSolicitacao().getNome() : null,
                    s.getColaborador() != null ? s.getColaborador().getNome() : null,
                    s.getLocal() != null ? s.getLocal().getNome() : null,
                    rotuloStatus(s.getStatus()),
                    s.getDataHoraAbertura(),
                    s.getDataHoraEncerramento(),
                    s.getObservacao()));
        }
        return PlanilhaExcel.gerar("Solicitações", cabecalhos, linhas);
    }

    private String rotuloStatus(StatusSolicitacao status) {
        if (status == null) {
            return null;
        }
        return switch (status) {
            case AGUARDANDO_ANALISE -> "Aguardando análise";
            case EM_PROCESSAMENTO -> "Em processamento";
            case FINALIZADA -> "Finalizada";
            case CANCELADA -> "Cancelada";
        };
    }

    /** Linha do tempo (admin) de uma solicitação. */
    @Transactional(readOnly = true)
    public List<HistoricoResponse> historico(Long id) {
        buscarEntidade(id);
        return listarHistorico(id);
    }

    /** Linha do tempo pelo quiosque: só devolve se a solicitação pertence ao CPF informado. */
    @Transactional(readOnly = true)
    public List<HistoricoResponse> historicoPublico(String cpf, Long solicitacaoId) {
        Solicitacao s = buscarEntidade(solicitacaoId);
        String digitos = cpf == null ? "" : cpf.replaceAll("\\D", "");
        if (s.getColaborador().getCpf() == null || !s.getColaborador().getCpf().equals(digitos)) {
            throw new RegraNegocioException(null, "Solicitação não encontrada para este CPF.");
        }
        return listarHistorico(solicitacaoId);
    }

    // ----- auxiliares -----

    private boolean encerrada(StatusSolicitacao status) {
        return status == StatusSolicitacao.FINALIZADA || status == StatusSolicitacao.CANCELADA;
    }

    private void validarHospedagem(Long colaboradorId, Long localId) {
        if (!hospedagemRepository.existsByColaboradorIdAndLocalId(colaboradorId, localId)) {
            throw new RegraNegocioException("localId",
                    "O colaborador não possui hospedagem neste local.");
        }
    }

    private Solicitacao buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação não encontrada."));
    }

    private TipoSolicitacao buscarTipo(Long id) {
        return tipoSolicitacaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de solicitação não encontrado."));
    }

    private Colaborador buscarColaborador(Long id) {
        return colaboradorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado."));
    }

    private Colaborador buscarColaboradorPorCpf(String cpf) {
        String digitos = cpf == null ? "" : cpf.replaceAll("\\D", "");
        return colaboradorRepository.findByCpf(digitos)
                .orElseThrow(() -> new RegraNegocioException("cpf",
                        "CPF não encontrado. Verifique com a administração."));
    }

    private Local buscarLocal(Long id) {
        return localRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Local não encontrado."));
    }

    private void registrarHistorico(Solicitacao solicitacao, StatusSolicitacao status,
                                    String observacao, LocalDateTime dataHora) {
        String obs = (observacao != null && !observacao.isBlank()) ? observacao.trim() : null;
        historicoRepository.save(SolicitacaoHistorico.builder()
                .solicitacao(solicitacao)
                .status(status)
                .observacao(obs)
                .dataHora(dataHora)
                .build());
    }

    private List<HistoricoResponse> listarHistorico(Long solicitacaoId) {
        return historicoRepository.findBySolicitacaoIdOrderByDataHoraAscIdAsc(solicitacaoId).stream()
                .map(h -> new HistoricoResponse(h.getStatus(), h.getObservacao(), h.getDataHora()))
                .toList();
    }

    private SolicitacaoResponse toResponse(Solicitacao s) {
        TipoSolicitacao tipo = s.getTipoSolicitacao();
        Colaborador colaborador = s.getColaborador();
        Local local = s.getLocal();
        return new SolicitacaoResponse(
                s.getId(),
                new ResumoRef(tipo.getId(), tipo.getNome()),
                new ResumoRef(colaborador.getId(), colaborador.getNome()),
                new ResumoRef(local.getId(), local.getNome()),
                s.getObservacao(),
                s.getStatus(),
                s.getDataHoraAbertura(),
                s.getDataHoraEncerramento());
    }

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
