package com.example.hospedagem.service;

import com.example.hospedagem.domain.Gasto;
import com.example.hospedagem.domain.Local;
import com.example.hospedagem.domain.RateioGasto;
import com.example.hospedagem.dto.DistribuicaoEpcResponse;
import com.example.hospedagem.dto.GastoFiltro;
import com.example.hospedagem.dto.GastoRequest;
import com.example.hospedagem.dto.GastoResponse;
import com.example.hospedagem.dto.ItemRelatorioGasto;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.RateioGastoResponse;
import com.example.hospedagem.dto.RelatorioGastosResponse;
import com.example.hospedagem.dto.ResumoGastoResponse;
import com.example.hospedagem.dto.ResumoRef;
import com.example.hospedagem.dto.TotalEpcRelatorio;
import com.example.hospedagem.dto.TotalGastoResponse;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.GastoRepository;
import com.example.hospedagem.repository.HospedagemRepository;
import com.example.hospedagem.repository.LocalRepository;
import com.example.hospedagem.repository.RateioGastoRepository;
import com.example.hospedagem.specification.GastoSpecifications;
import com.example.hospedagem.util.PlanilhaExcel;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    private final HospedagemRepository hospedagemRepository;
    private final RateioGastoRepository rateioRepository;

    public GastoService(GastoRepository repository,
                        LocalRepository localRepository,
                        HospedagemRepository hospedagemRepository,
                        RateioGastoRepository rateioRepository) {
        this.repository = repository;
        this.localRepository = localRepository;
        this.hospedagemRepository = hospedagemRepository;
        this.rateioRepository = rateioRepository;
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

        Gasto salvo = repository.save(gasto);
        recomputarRateio(salvo);
        return toResponse(salvo);
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

        Gasto salvo = repository.save(gasto);
        recomputarRateio(salvo);
        return toResponse(salvo);
    }

    /** Rateio (snapshot) de um gasto por EPC. */
    @Transactional(readOnly = true)
    public List<RateioGastoResponse> rateio(Long id) {
        buscarEntidade(id);
        return rateioRepository.findByGastoIdOrderByValorDescIdAsc(id).stream()
                .map(r -> new RateioGastoResponse(
                        r.getEpcId(), r.getEpcNome(), r.getPessoas(), r.getPercentual(), r.getValor()))
                .toList();
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

    /** Exporta os gastos filtrados (detalhe do local) para Excel. */
    @Transactional(readOnly = true)
    public byte[] exportar(GastoFiltro filtro) {
        List<Gasto> lista = repository.findAll(
                GastoSpecifications.comFiltro(filtro),
                Sort.by(Sort.Direction.DESC, "data").and(Sort.by(Sort.Direction.ASC, "id")));

        List<String> cabecalhos = List.of("Data", "Gasto", "Quantidade", "Valor unitário", "Total");
        List<List<Object>> linhas = new ArrayList<>();
        for (Gasto g : lista) {
            linhas.add(Arrays.asList(
                    g.getData(), g.getNome(), g.getQuantidade(), g.getValor(),
                    g.getQuantidade().multiply(g.getValor())));
        }
        return PlanilhaExcel.gerar("Gastos", cabecalhos, linhas);
    }

    /** Exporta a grade de locais com o total gasto (respeita o filtro de nome). */
    @Transactional(readOnly = true)
    public byte[] exportarLocais(String nome) {
        List<Local> locais = localRepository.findAll(Sort.by(Sort.Direction.ASC, "nome"));
        String termo = nome == null ? "" : nome.trim().toLowerCase();

        Map<Long, BigDecimal> totalPorLocal = new HashMap<>();
        for (TotalGastoResponse t : totais()) {
            totalPorLocal.put(t.localId(), t.total());
        }

        List<String> cabecalhos = List.of("Código", "Nome", "Cidade/UF", "Total gasto");
        List<List<Object>> linhas = new ArrayList<>();
        for (Local l : locais) {
            if (!termo.isEmpty() && !l.getNome().toLowerCase().contains(termo)) {
                continue;
            }
            linhas.add(Arrays.asList(
                    l.getCodigo(), l.getNome(), l.getCidade() + "/" + l.getUf(),
                    totalPorLocal.getOrDefault(l.getId(), BigDecimal.ZERO)));
        }
        return PlanilhaExcel.gerar("Locais - gastos", cabecalhos, linhas);
    }

    /** Relatório de gastos do local no período: itens com rateio por EPC + totais por EPC. */
    @Transactional(readOnly = true)
    public RelatorioGastosResponse relatorio(Long localId, LocalDate dataDe, LocalDate dataAte) {
        Local local = carregarLocal(localId);
        List<Gasto> gastos = repository.findAll(
                GastoSpecifications.comFiltro(new GastoFiltro(localId, null, dataDe, dataAte)),
                Sort.by(Sort.Direction.DESC, "data").and(Sort.by(Sort.Direction.ASC, "id")));

        List<ItemRelatorioGasto> itens = new ArrayList<>();
        Map<Long, BigDecimal> valorPorEpc = new LinkedHashMap<>();
        Map<Long, String> nomePorEpc = new HashMap<>();
        BigDecimal naoRateado = BigDecimal.ZERO;
        BigDecimal totalGeral = BigDecimal.ZERO;

        for (Gasto g : gastos) {
            BigDecimal total = g.getQuantidade().multiply(g.getValor());
            totalGeral = totalGeral.add(total);

            List<RateioGasto> rr = rateioRepository.findByGastoIdOrderByValorDescIdAsc(g.getId());
            List<RateioGastoResponse> rateio = rr.stream()
                    .map(r -> new RateioGastoResponse(
                            r.getEpcId(), r.getEpcNome(), r.getPessoas(), r.getPercentual(), r.getValor()))
                    .toList();

            if (rr.isEmpty()) {
                naoRateado = naoRateado.add(total);
            } else {
                for (RateioGasto r : rr) {
                    valorPorEpc.merge(r.getEpcId(), r.getValor(), BigDecimal::add);
                    nomePorEpc.putIfAbsent(r.getEpcId(), r.getEpcNome());
                }
            }

            itens.add(new ItemRelatorioGasto(
                    g.getId(), g.getNome(), g.getData(),
                    g.getQuantidade(), g.getValor(), total, rateio));
        }

        List<TotalEpcRelatorio> totais = new ArrayList<>();
        valorPorEpc.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .forEach(e -> totais.add(new TotalEpcRelatorio(e.getKey(), nomePorEpc.get(e.getKey()), e.getValue())));
        if (naoRateado.signum() > 0) {
            totais.add(new TotalEpcRelatorio(null, "Não rateado", naoRateado));
        }

        return new RelatorioGastosResponse(
                new ResumoRef(local.getId(), local.getNome()),
                dataDe, dataAte, LocalDateTime.now(), itens, totais, totalGeral);
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

    /**
     * Recalcula (snapshot) o rateio do gasto por EPC, na proporção de colaboradores
     * hospedados ativos no local. O total (qtd x valor) é distribuído por EPC; a última
     * linha absorve o arredondamento para o somatório fechar com o total.
     */
    private void recomputarRateio(Gasto gasto) {
        rateioRepository.deleteByGastoId(gasto.getId());

        List<DistribuicaoEpcResponse> dist =
                hospedagemRepository.distribuicaoEpcAtivaPorLocal(gasto.getLocal().getId());
        long totalPessoas = dist.stream().mapToLong(DistribuicaoEpcResponse::pessoas).sum();
        if (totalPessoas == 0) {
            return; // sem hospedados no local -> sem rateio
        }

        BigDecimal total = gasto.getQuantidade().multiply(gasto.getValor()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalPessoasBd = BigDecimal.valueOf(totalPessoas);
        BigDecimal cem = BigDecimal.valueOf(100);

        BigDecimal valorAcumulado = BigDecimal.ZERO;
        BigDecimal pctAcumulado = BigDecimal.ZERO;
        List<RateioGasto> linhas = new ArrayList<>();

        for (int i = 0; i < dist.size(); i++) {
            DistribuicaoEpcResponse d = dist.get(i);
            BigDecimal pessoasBd = BigDecimal.valueOf(d.pessoas());
            boolean ultima = i == dist.size() - 1;

            BigDecimal percentual;
            BigDecimal valor;
            if (ultima) {
                percentual = cem.subtract(pctAcumulado);
                valor = total.subtract(valorAcumulado);
            } else {
                percentual = pessoasBd.multiply(cem).divide(totalPessoasBd, 2, RoundingMode.HALF_UP);
                valor = total.multiply(pessoasBd).divide(totalPessoasBd, 2, RoundingMode.HALF_UP);
                pctAcumulado = pctAcumulado.add(percentual);
                valorAcumulado = valorAcumulado.add(valor);
            }

            linhas.add(RateioGasto.builder()
                    .gasto(gasto)
                    .epcId(d.epcId())
                    .epcNome(d.epcNome())
                    .pessoas((int) d.pessoas())
                    .percentual(percentual)
                    .valor(valor)
                    .build());
        }

        rateioRepository.saveAll(linhas);
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
