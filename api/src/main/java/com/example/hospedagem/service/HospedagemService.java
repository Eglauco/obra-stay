package com.example.hospedagem.service;

import com.example.hospedagem.domain.AcaoEntrada;
import com.example.hospedagem.domain.Colaborador;
import com.example.hospedagem.domain.Hospedagem;
import com.example.hospedagem.domain.Local;
import com.example.hospedagem.domain.OrigemHospedagem;
import com.example.hospedagem.dto.ConsultaEntradaResponse;
import com.example.hospedagem.dto.EntradaPublicaRequest;
import com.example.hospedagem.dto.EntradaPublicaResultado;
import com.example.hospedagem.dto.HospedagemEntradaRequest;
import com.example.hospedagem.dto.HospedagemFiltro;
import com.example.hospedagem.dto.HospedagemResponse;
import com.example.hospedagem.dto.HospedagemSaidaRequest;
import com.example.hospedagem.dto.LocaisColaboradorResponse;
import com.example.hospedagem.dto.LocalEntradaResponse;
import com.example.hospedagem.dto.OcupacaoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.ResumoRef;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import com.example.hospedagem.exception.RegraNegocioException;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.ColaboradorRepository;
import com.example.hospedagem.repository.HospedagemRepository;
import com.example.hospedagem.repository.LocalRepository;
import com.example.hospedagem.specification.HospedagemSpecifications;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Regras de negócio do módulo Gestão de Hospedagem (entradas e saídas de colaboradores).
 */
@Service
public class HospedagemService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "dataEntrada", "dataSaida");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.DESC, "dataEntrada");

    private static final String STATUS_ATIVA = "ATIVA";
    private static final String STATUS_ENCERRADA = "ENCERRADA";

    private final HospedagemRepository repository;
    private final ColaboradorRepository colaboradorRepository;
    private final LocalRepository localRepository;

    public HospedagemService(HospedagemRepository repository,
                             ColaboradorRepository colaboradorRepository,
                             LocalRepository localRepository) {
        this.repository = repository;
        this.colaboradorRepository = colaboradorRepository;
        this.localRepository = localRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<HospedagemResponse> buscar(HospedagemFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Hospedagem> pagina = repository.findAll(
                HospedagemSpecifications.comFiltro(filtro), saneado);

        List<HospedagemResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public HospedagemResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public HospedagemResponse darEntrada(HospedagemEntradaRequest request) {
        Colaborador colaborador = colaboradorRepository.findById(request.colaboradorId())
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado."));
        Local local = localRepository.findById(request.localId())
                .orElseThrow(() -> new ResourceNotFoundException("Local não encontrado."));

        // R1: um colaborador só pode ter uma hospedagem ativa por vez.
        if (repository.existsByColaboradorIdAndDataSaidaIsNull(colaborador.getId())) {
            throw new RegraNegocioException("colaboradorId",
                    "Este colaborador já possui uma hospedagem ativa.");
        }

        // R2: o local não pode ultrapassar sua capacidade de vagas.
        if (repository.countByLocalIdAndDataSaidaIsNull(local.getId()) >= local.getCapacidade()) {
            throw new RegraNegocioException("localId",
                    "Local sem vagas: capacidade máxima atingida.");
        }

        Hospedagem hospedagem = Hospedagem.builder()
                .colaborador(colaborador)
                .local(local)
                .dataEntrada(request.dataEntrada())
                .dataSaida(null)
                .observacao(normalizar(request.observacao()))
                .origem(OrigemHospedagem.ADMINISTRACAO)
                .build();

        return toResponse(repository.save(hospedagem));
    }

    @Transactional
    public HospedagemResponse darSaida(Long id, HospedagemSaidaRequest request) {
        Hospedagem hospedagem = buscarEntidade(id);

        if (hospedagem.getDataSaida() != null) {
            throw new RegraNegocioException(null, "Esta hospedagem já foi encerrada.");
        }

        if (request.dataSaida().isBefore(hospedagem.getDataEntrada())) {
            throw new RegraNegocioException("dataSaida",
                    "A data de saída não pode ser anterior à entrada.");
        }

        hospedagem.setDataSaida(request.dataSaida());
        return toResponse(repository.save(hospedagem));
    }

    @Transactional
    public void excluir(Long id) {
        Hospedagem hospedagem = buscarEntidade(id);
        repository.delete(hospedagem);
    }

    @Transactional(readOnly = true)
    public List<OcupacaoResponse> ocupacao() {
        return repository.ocupacaoPorLocal();
    }

    /**
     * Locais em que o colaborador está ou já esteve hospedado (distintos, mais recentes
     * primeiro), com o id do local da hospedagem ativa (quando houver). Usado pelo módulo
     * de Solicitações para restringir/sugerir o local.
     */
    @Transactional(readOnly = true)
    public LocaisColaboradorResponse locaisDoColaborador(Long colaboradorId) {
        List<Hospedagem> hospedagens = repository.findByColaboradorIdOrderByDataEntradaDesc(colaboradorId);
        Map<Long, ResumoRef> locais = new LinkedHashMap<>();
        Long localAtivoId = null;
        for (Hospedagem h : hospedagens) {
            Local local = h.getLocal();
            locais.putIfAbsent(local.getId(), new ResumoRef(local.getId(), local.getNome()));
            if (h.getDataSaida() == null && localAtivoId == null) {
                localAtivoId = local.getId();
            }
        }
        return new LocaisColaboradorResponse(new ArrayList<>(locais.values()), localAtivoId);
    }

    // ----- Auto check-in (tela pública por QR Code) -----

    /** Dados do local + vagas para exibir na tela pública de auto check-in. */
    @Transactional(readOnly = true)
    public LocalEntradaResponse infoEntrada(Long localId) {
        Local local = localRepository.findById(localId)
                .orElseThrow(() -> new ResourceNotFoundException("Local não encontrado."));
        long ocupados = repository.countByLocalIdAndDataSaidaIsNull(local.getId());
        boolean temVaga = ocupados < local.getCapacidade();
        return new LocalEntradaResponse(
                local.getId(), local.getCodigo(), local.getNome(),
                local.getCep(), local.getLogradouro(), local.getNumero(), local.getComplemento(),
                local.getBairro(), local.getCidade(), local.getUf(),
                local.getCapacidade(), ocupados, temVaga);
    }

    /** Consulta pelo CPF a ação disponível no local (para a tela confirmar antes de efetivar). */
    @Transactional(readOnly = true)
    public ConsultaEntradaResponse consultarEntrada(EntradaPublicaRequest request) {
        Local local = localRepository.findById(request.localId())
                .orElseThrow(() -> new ResourceNotFoundException("Local não encontrado."));
        Colaborador colaborador = buscarColaboradorPorCpf(request.cpf());

        Optional<Hospedagem> ativaOpt = repository
                .findFirstByColaboradorIdAndDataSaidaIsNull(colaborador.getId());

        if (ativaOpt.isPresent()) {
            Hospedagem ativa = ativaOpt.get();
            if (ativa.getLocal().getId().equals(local.getId())) {
                return new ConsultaEntradaResponse(colaborador.getId(), colaborador.getNome(),
                        AcaoEntrada.SAIDA, "Você está hospedado aqui. Deseja registrar a saída?",
                        ativa.getId(), ativa.getDataEntrada(), false);
            }
            return new ConsultaEntradaResponse(colaborador.getId(), colaborador.getNome(),
                    AcaoEntrada.BLOQUEADO,
                    "Você já está hospedado em " + ativa.getLocal().getNome()
                            + ". Dê saída lá antes de entrar aqui.",
                    null, null, false);
        }

        long ocupados = repository.countByLocalIdAndDataSaidaIsNull(local.getId());
        boolean temVaga = ocupados < local.getCapacidade();
        String mensagem = temVaga
                ? "Confirmar entrada em " + local.getNome() + "?"
                : "Local sem vagas no momento. Procure a administração.";
        return new ConsultaEntradaResponse(colaborador.getId(), colaborador.getNome(),
                AcaoEntrada.ENTRADA, mensagem, null, null, temVaga);
    }

    /** Efetiva o auto check-in: decide no servidor entre entrada e saída e aplica as regras. */
    @Transactional
    public EntradaPublicaResultado confirmarEntrada(EntradaPublicaRequest request) {
        Local local = localRepository.findById(request.localId())
                .orElseThrow(() -> new ResourceNotFoundException("Local não encontrado."));
        Colaborador colaborador = buscarColaboradorPorCpf(request.cpf());

        Optional<Hospedagem> ativaOpt = repository
                .findFirstByColaboradorIdAndDataSaidaIsNull(colaborador.getId());

        if (ativaOpt.isPresent()) {
            Hospedagem ativa = ativaOpt.get();
            if (ativa.getLocal().getId().equals(local.getId())) {
                ativa.setDataSaida(LocalDateTime.now());
                repository.save(ativa);
                return new EntradaPublicaResultado(AcaoEntrada.SAIDA, colaborador.getNome(),
                        local.getNome(), ativa.getDataSaida().toLocalDate(),
                        "Saída registrada. Até logo, " + primeiroNome(colaborador) + "!");
            }
            throw new RegraNegocioException(null, "Você já está hospedado em "
                    + ativa.getLocal().getNome() + ". Dê saída lá antes de entrar aqui.");
        }

        if (repository.countByLocalIdAndDataSaidaIsNull(local.getId()) >= local.getCapacidade()) {
            throw new RegraNegocioException(null, "Local sem vagas no momento. Procure a administração.");
        }

        Hospedagem nova = Hospedagem.builder()
                .colaborador(colaborador)
                .local(local)
                .dataEntrada(LocalDateTime.now())
                .dataSaida(null)
                .observacao(null)
                .origem(OrigemHospedagem.AUTOATENDIMENTO)
                .build();
        repository.save(nova);
        return new EntradaPublicaResultado(AcaoEntrada.ENTRADA, colaborador.getNome(),
                local.getNome(), nova.getDataEntrada().toLocalDate(),
                "Entrada registrada. Bem-vindo(a), " + primeiroNome(colaborador) + "!");
    }

    private Colaborador buscarColaboradorPorCpf(String cpf) {
        String digitos = cpf == null ? "" : cpf.replaceAll("\\D", "");
        return colaboradorRepository.findByCpf(digitos)
                .orElseThrow(() -> new RegraNegocioException("cpf",
                        "CPF não encontrado. Verifique com a administração."));
    }

    private String primeiroNome(Colaborador colaborador) {
        String nome = colaborador.getNome() == null ? "" : colaborador.getNome().trim();
        int espaco = nome.indexOf(' ');
        return espaco > 0 ? nome.substring(0, espaco) : nome;
    }

    // ----- auxiliares -----

    private Hospedagem buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospedagem não encontrada."));
    }

    private HospedagemResponse toResponse(Hospedagem hospedagem) {
        Colaborador colaborador = hospedagem.getColaborador();
        Local local = hospedagem.getLocal();
        String status = hospedagem.getDataSaida() == null ? STATUS_ATIVA : STATUS_ENCERRADA;

        return new HospedagemResponse(
                hospedagem.getId(),
                new ResumoRef(colaborador.getId(), colaborador.getNome()),
                new ResumoRef(local.getId(), local.getNome()),
                hospedagem.getDataEntrada(),
                hospedagem.getDataSaida(),
                status,
                hospedagem.getObservacao(),
                hospedagem.getOrigem());
    }

    /** Converte string em branco para null, aparando espaços nas extremidades. */
    private String normalizar(String valor) {
        return StringUtils.hasText(valor) ? valor.trim() : null;
    }

    /**
     * Garante size dentro de [5,100] e mantém apenas ordenações por campos permitidos,
     * caindo para a ordenação padrão (dataEntrada desc) quando nenhuma for válida.
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
