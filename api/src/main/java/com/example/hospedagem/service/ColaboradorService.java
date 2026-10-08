package com.example.hospedagem.service;

import com.example.hospedagem.domain.Colaborador;
import com.example.hospedagem.domain.Empresa;
import com.example.hospedagem.domain.Epc;
import com.example.hospedagem.domain.Funcao;
import com.example.hospedagem.domain.Gestao;
import com.example.hospedagem.domain.Hospedagem;
import com.example.hospedagem.domain.Local;
import com.example.hospedagem.domain.Mdo;
import com.example.hospedagem.domain.Sexo;
import com.example.hospedagem.domain.ColaboradorEpc;
import com.example.hospedagem.dto.ColaboradorEpcResponse;
import com.example.hospedagem.dto.ColaboradorFiltro;
import com.example.hospedagem.dto.ColaboradorRequest;
import com.example.hospedagem.dto.ColaboradorResponse;
import com.example.hospedagem.dto.EmpresaResponse;
import com.example.hospedagem.dto.EpcPercentualRequest;
import com.example.hospedagem.dto.FuncaoResponse;
import com.example.hospedagem.dto.GestaoResponse;
import com.example.hospedagem.dto.HospedagemAtivaResumo;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.exception.RegraNegocioException;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.ColaboradorRepository;
import com.example.hospedagem.repository.EmpresaRepository;
import com.example.hospedagem.repository.EpcRepository;
import com.example.hospedagem.repository.FuncaoRepository;
import com.example.hospedagem.repository.GestaoRepository;
import com.example.hospedagem.specification.ColaboradorSpecifications;
import com.example.hospedagem.util.PlanilhaExcel;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
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
    /** A soma das porcentagens dos EPCs de um colaborador deve ser exatamente isto. */
    private static final BigDecimal SOMA_PERCENTUAL = new BigDecimal("100.00");

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
                .email(normalizarEmail(request.email()))
                .funcao(buscarFuncao(request.funcaoId()))
                .empresa(buscarEmpresa(request.empresaId()))
                .gestao(buscarGestao(request.gestaoId()))
                .build();
        aplicarEpcs(colaborador, request.epcs());
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
        colaborador.setEmail(normalizarEmail(request.email()));
        colaborador.setFuncao(buscarFuncao(request.funcaoId()));
        aplicarEpcs(colaborador, request.epcs());
        colaborador.setEmpresa(buscarEmpresa(request.empresaId()));
        colaborador.setGestao(buscarGestao(request.gestaoId()));
        return toResponse(repository.save(colaborador));
    }

    @Transactional
    public void excluir(Long id) {
        Colaborador colaborador = buscarEntidade(id);
        repository.delete(colaborador);
    }

    /** Exporta os colaboradores filtrados (sem paginação) para Excel (.xlsx). */
    @Transactional(readOnly = true)
    public byte[] exportar(ColaboradorFiltro filtro) {
        List<Colaborador> lista = repository.findAll(
                ColaboradorSpecifications.comFiltro(filtro), Sort.by(Sort.Direction.ASC, "nome"));

        List<String> cabecalhos = List.of("ID", "Nome", "CPF", "Sexo", "Mão de obra", "E-mail",
                "Função", "EPC", "Empresa", "Gestão", "Hospedagem ativa", "Hospedado desde");

        List<List<Object>> linhas = new ArrayList<>();
        for (Colaborador c : lista) {
            Hospedagem h = c.getHospedagemAtiva();
            linhas.add(Arrays.asList(
                    c.getId(),
                    c.getNome(),
                    formatarCpf(c.getCpf()),
                    rotuloSexo(c.getSexo()),
                    rotuloMdo(c.getMdo()),
                    c.getEmail(),
                    c.getFuncao() != null ? c.getFuncao().getNome() : null,
                    c.getEpcs().stream()
                            .sorted(Comparator.comparing(ce -> ce.getEpc().getNome(), String.CASE_INSENSITIVE_ORDER))
                            .map(ce -> ce.getEpc().getNome() + " ("
                                    + ce.getPercentual().toPlainString().replace('.', ',') + "%)")
                            .collect(Collectors.joining(", ")),
                    c.getEmpresa() != null ? c.getEmpresa().getNome() : null,
                    c.getGestao() != null ? c.getGestao().getNome() : null,
                    h != null ? h.getLocal().getNome() : null,
                    h != null ? h.getDataEntrada() : null));
        }
        return PlanilhaExcel.gerar("Colaboradores", cabecalhos, linhas);
    }

    private String rotuloSexo(Sexo sexo) {
        if (sexo == null) {
            return null;
        }
        return sexo == Sexo.FEMININO ? "Feminino" : "Masculino";
    }

    private String rotuloMdo(Mdo mdo) {
        if (mdo == null) {
            return null;
        }
        return mdo == Mdo.MAO_DE_OBRA_DIRETA ? "Mão de Obra Direta" : "Mão de Obra Indireta";
    }

    private String formatarCpf(String cpf) {
        if (cpf == null) {
            return null;
        }
        String d = cpf.replaceAll("\\D", "");
        if (d.length() != 11) {
            return cpf;
        }
        return d.substring(0, 3) + "." + d.substring(3, 6) + "." + d.substring(6, 9) + "-" + d.substring(9);
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

    /**
     * Valida e aplica os EPCs (com porcentagem) ao colaborador: ao menos 1, sem repetição, cada
     * porcentagem &gt; 0 e a SOMA exatamente 100%.
     *
     * <p>Reconcilia a associação em vez de limpar e recriar: os EPCs que permanecem são
     * ATUALIZADOS (mesma entidade), os que saíram são removidos (orphanRemoval) e só os novos
     * são inseridos. Isso evita recriar {@code ColaboradorEpc} com a mesma chave derivada
     * (@MapsId), o que causaria {@code NonUniqueObjectException} ao editar.
     */
    private void aplicarEpcs(Colaborador colaborador, List<EpcPercentualRequest> itens) {
        if (itens == null || itens.isEmpty()) {
            throw new RegraNegocioException("epcs", "Selecione ao menos um EPC.");
        }
        Map<Long, BigDecimal> desejado = new LinkedHashMap<>();
        BigDecimal soma = BigDecimal.ZERO;
        for (EpcPercentualRequest it : itens) {
            if (it.epcId() == null) {
                throw new RegraNegocioException("epcs", "Selecione o EPC.");
            }
            if (desejado.putIfAbsent(it.epcId(), it.percentual()) != null) {
                throw new RegraNegocioException("epcs", "O mesmo EPC foi informado mais de uma vez.");
            }
            soma = soma.add(it.percentual());
        }
        if (soma.compareTo(SOMA_PERCENTUAL) != 0) {
            throw new RegraNegocioException("epcs",
                    "A soma das porcentagens dos EPCs deve ser exatamente 100%.");
        }

        // Remove os que saíram; atualiza o percentual dos que permanecem.
        colaborador.getEpcs().removeIf(ce -> !desejado.containsKey(ce.getEpc().getId()));
        Set<Long> existentes = new HashSet<>();
        for (ColaboradorEpc ce : colaborador.getEpcs()) {
            ce.setPercentual(desejado.get(ce.getEpc().getId()));
            existentes.add(ce.getEpc().getId());
        }
        // Insere apenas os EPCs novos.
        for (EpcPercentualRequest it : itens) {
            if (!existentes.contains(it.epcId())) {
                Epc epc = epcRepository.findById(it.epcId())
                        .orElseThrow(() -> new ResourceNotFoundException("EPC não encontrado."));
                colaborador.adicionarEpc(epc, it.percentual());
            }
        }
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

    /** Normaliza o e-mail (opcional): apara espaços e minúsculas; grava null quando vazio/em branco. */
    private String normalizarEmail(String email) {
        if (email == null) {
            return null;
        }
        String limpo = email.trim();
        return limpo.isEmpty() ? null : limpo.toLowerCase();
    }

    private ColaboradorResponse toResponse(Colaborador colaborador) {
        Funcao funcao = colaborador.getFuncao();
        Empresa empresa = colaborador.getEmpresa();
        Gestao gestao = colaborador.getGestao();
        List<ColaboradorEpcResponse> epcs = colaborador.getEpcs().stream()
                .sorted(Comparator.comparing(ce -> ce.getEpc().getNome(), String.CASE_INSENSITIVE_ORDER))
                .map(ce -> new ColaboradorEpcResponse(
                        ce.getEpc().getId(), ce.getEpc().getNome(), ce.getPercentual()))
                .toList();
        return new ColaboradorResponse(
                colaborador.getId(),
                colaborador.getNome(),
                colaborador.getSexo(),
                colaborador.getMdo(),
                colaborador.getCpf(),
                colaborador.getEmail(),
                new FuncaoResponse(funcao.getId(), funcao.getNome()),
                epcs,
                new EmpresaResponse(empresa.getId(), empresa.getNome()),
                new GestaoResponse(gestao.getId(), gestao.getNome()),
                hospedagemAtiva(colaborador));
    }

    /** Resumo da hospedagem ativa do colaborador (null quando não há). */
    private HospedagemAtivaResumo hospedagemAtiva(Colaborador colaborador) {
        Hospedagem h = colaborador.getHospedagemAtiva();
        if (h == null) {
            return null;
        }
        Local local = h.getLocal();
        return new HospedagemAtivaResumo(h.getId(), local.getId(), local.getNome(), h.getDataEntrada());
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
