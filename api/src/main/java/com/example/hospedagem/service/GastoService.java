package com.example.hospedagem.service;

import com.example.hospedagem.domain.Gasto;
import com.example.hospedagem.domain.Local;
import com.example.hospedagem.dto.GastoFiltro;
import com.example.hospedagem.dto.GastoRequest;
import com.example.hospedagem.dto.GastoResponse;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.ResumoGastoResponse;
import com.example.hospedagem.dto.ResumoRef;
import com.example.hospedagem.dto.TotalGastoResponse;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.GastoRepository;
import com.example.hospedagem.repository.LocalRepository;
import com.example.hospedagem.specification.GastoSpecifications;
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
 * Regras de negócio do módulo Gestão de Gastos (lançamentos de despesa por local).
 * O {@code valor} é UNITÁRIO; o total de cada gasto = quantidade x valor.
 */
@Service
public class GastoService {

    /** Campos permitidos para ordenação. */
    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "nome", "data", "valor");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.DESC, "data");

    private final GastoRepository repository;
    private final LocalRepository localRepository;

    public GastoService(GastoRepository repository, LocalRepository localRepository) {
        this.repository = repository;
        this.localRepository = localRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<GastoResponse> buscar(GastoFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Gasto> pagina = repository.findAll(GastoSpecifications.comFiltro(filtro), saneado);

        List<GastoResponse> conteudo = pagina.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public GastoResponse obter(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public GastoResponse criar(GastoRequest request) {
        Local local = carregarLocal(request.localId());

        Gasto gasto = Gasto.builder()
                .local(local)
                .nome(request.nome().trim())
                .quantidade(request.quantidade())
                .valor(request.valor())
                .data(request.data())
                .build();

        return toResponse(repository.save(gasto));
    }

    @Transactional
    public GastoResponse atualizar(Long id, GastoRequest request) {
        Gasto gasto = buscarEntidade(id);
        Local local = carregarLocal(request.localId());

        gasto.setLocal(local);
        gasto.setNome(request.nome().trim());
        gasto.setQuantidade(request.quantidade());
        gasto.setValor(request.valor());
        gasto.setData(request.data());

        return toResponse(repository.save(gasto));
    }

    @Transactional
    public void excluir(Long id) {
        Gasto gasto = buscarEntidade(id);
        repository.delete(gasto);
    }

    @Transactional(readOnly = true)
    public List<TotalGastoResponse> totais() {
        return repository.totaisPorLocal();
    }

    @Transactional(readOnly = true)
    public ResumoGastoResponse resumo(Long localId, LocalDate dataDe, LocalDate dataAte) {
        return new ResumoGastoResponse(
                repository.somaGeral(localId),
                repository.somaPeriodo(localId, dataDe, dataAte));
    }

    // ----- auxiliares -----

    private Local carregarLocal(Long localId) {
        return localRepository.findById(localId)
                .orElseThrow(() -> new ResourceNotFoundException("Local não encontrado."));
    }

    private Gasto buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gasto não encontrado."));
    }

    private GastoResponse toResponse(Gasto gasto) {
        Local local = gasto.getLocal();

        return new GastoResponse(
                gasto.getId(),
                new ResumoRef(local.getId(), local.getNome()),
                gasto.getNome(),
                gasto.getQuantidade(),
                gasto.getValor(),
                gasto.getQuantidade().multiply(gasto.getValor()),
                gasto.getData());
    }

    /**
     * Garante size dentro de [5,100] e mantém apenas ordenações por campos permitidos,
     * caindo para a ordenação padrão (data desc) quando nenhuma for válida.
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
