package com.example.hospedagem.service;

import com.example.hospedagem.domain.ItemOrcamentoMobiliario;
import com.example.hospedagem.domain.OrcamentoMobiliario;
import com.example.hospedagem.dto.ItemOrcamentoMobiliarioRequest;
import com.example.hospedagem.dto.ItemOrcamentoMobiliarioResponse;
import com.example.hospedagem.dto.OrcamentoMobiliarioFiltro;
import com.example.hospedagem.dto.OrcamentoMobiliarioRequest;
import com.example.hospedagem.dto.OrcamentoMobiliarioResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.ResumoRef;
import com.example.hospedagem.exception.RegraNegocioException;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.OrcamentoMobiliarioRepository;
import com.example.hospedagem.specification.OrcamentoMobiliarioSpecifications;
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
import org.springframework.util.StringUtils;

/**
 * Regras de negócio do módulo Orçamento de Mobiliário (cadastro de orçamento + itens).
 * A simulação de custo por nº de quartos é regra futura (não implementada aqui).
 */
@Service
public class OrcamentoMobiliarioService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "nome", "criadoEm");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.ASC, "nome");

    private final OrcamentoMobiliarioRepository repository;

    public OrcamentoMobiliarioService(OrcamentoMobiliarioRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<OrcamentoMobiliarioResponse> buscar(OrcamentoMobiliarioFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<OrcamentoMobiliario> pagina = repository.findAll(
                OrcamentoMobiliarioSpecifications.comFiltro(filtro), saneado);

        List<OrcamentoMobiliarioResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public OrcamentoMobiliarioResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    /** Orçamentos (id + nome) ordenados por nome, para popular selects. */
    @Transactional(readOnly = true)
    public List<ResumoRef> listarOpcoes() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome")).stream()
                .map(o -> new ResumoRef(o.getId(), o.getNome()))
                .toList();
    }

    @Transactional
    public OrcamentoMobiliarioResponse criar(OrcamentoMobiliarioRequest request) {
        String nome = request.nome().trim();
        if (repository.existsByNomeIgnoreCase(nome)) {
            throw new RegraNegocioException("nome", "Já existe um orçamento com este nome.");
        }
        validarItens(request.itens());

        OrcamentoMobiliario orcamento = OrcamentoMobiliario.builder()
                .nome(nome)
                .descricao(normalizarOpcional(request.descricao()))
                .criadoEm(LocalDateTime.now())
                .build();
        aplicarItens(orcamento, request.itens());

        return toResponse(repository.save(orcamento));
    }

    @Transactional
    public OrcamentoMobiliarioResponse atualizar(Long id, OrcamentoMobiliarioRequest request) {
        OrcamentoMobiliario orcamento = buscarEntidade(id);
        String nome = request.nome().trim();
        if (repository.existsByNomeIgnoreCaseAndIdNot(nome, id)) {
            throw new RegraNegocioException("nome", "Já existe um orçamento com este nome.");
        }
        validarItens(request.itens());

        orcamento.setNome(nome);
        orcamento.setDescricao(normalizarOpcional(request.descricao()));
        orcamento.limparItens();
        aplicarItens(orcamento, request.itens());

        return toResponse(repository.save(orcamento));
    }

    @Transactional
    public void excluir(Long id) {
        OrcamentoMobiliario orcamento = buscarEntidade(id);
        repository.delete(orcamento);
    }

    /** Exporta os orçamentos filtrados (sem paginação) para Excel (.xlsx). */
    @Transactional(readOnly = true)
    public byte[] exportar(OrcamentoMobiliarioFiltro filtro) {
        List<OrcamentoMobiliario> lista = repository.findAll(
                OrcamentoMobiliarioSpecifications.comFiltro(filtro), Sort.by(Sort.Direction.ASC, "nome"));

        List<String> cabecalhos = List.of("ID", "Nome", "Descrição", "Qtd. de itens", "Criado em");
        List<List<Object>> linhas = new ArrayList<>();
        for (OrcamentoMobiliario o : lista) {
            linhas.add(Arrays.asList(
                    o.getId(),
                    o.getNome(),
                    o.getDescricao(),
                    o.getItens().size(),
                    o.getCriadoEm()));
        }
        return PlanilhaExcel.gerar("Orçamentos de Mobiliário", cabecalhos, linhas);
    }

    // ----- auxiliares -----

    private void aplicarItens(OrcamentoMobiliario orcamento, List<ItemOrcamentoMobiliarioRequest> itens) {
        int ordem = 0;
        for (ItemOrcamentoMobiliarioRequest it : itens) {
            orcamento.addItem(ItemOrcamentoMobiliario.builder()
                    .nome(it.nome().trim())
                    .precoUnitario(it.precoUnitario())
                    .quantidadeFixa(it.quantidadeFixa())
                    .quantidadePorQuarto(it.quantidadePorQuarto())
                    .ordem(ordem++)
                    .build());
        }
    }

    private void validarItens(List<ItemOrcamentoMobiliarioRequest> itens) {
        for (ItemOrcamentoMobiliarioRequest it : itens) {
            if (it.quantidadeFixa() == 0 && it.quantidadePorQuarto() == 0) {
                throw new RegraNegocioException("itens",
                        "O item \"" + it.nome().trim()
                                + "\" precisa de quantidade fixa ou por quarto maior que zero.");
            }
        }
    }

    private OrcamentoMobiliario buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orçamento não encontrado."));
    }

    private OrcamentoMobiliarioResponse toResponse(OrcamentoMobiliario o) {
        List<ItemOrcamentoMobiliarioResponse> itens = o.getItens().stream()
                .map(i -> new ItemOrcamentoMobiliarioResponse(
                        i.getId(), i.getNome(), i.getPrecoUnitario(),
                        i.getQuantidadeFixa(), i.getQuantidadePorQuarto()))
                .toList();
        return new OrcamentoMobiliarioResponse(
                o.getId(), o.getNome(), o.getDescricao(), o.getCriadoEm(), itens.size(), itens);
    }

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
