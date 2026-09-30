package com.example.hospedagem.service;

import com.example.hospedagem.domain.Acao;
import com.example.hospedagem.domain.Perfil;
import com.example.hospedagem.domain.PerfilPermissao;
import com.example.hospedagem.domain.Tela;
import com.example.hospedagem.dto.AcaoCatalogo;
import com.example.hospedagem.dto.PageResponse;
import com.example.hospedagem.dto.PerfilFiltro;
import com.example.hospedagem.dto.PerfilOpcao;
import com.example.hospedagem.dto.PerfilRequest;
import com.example.hospedagem.dto.PerfilResponse;
import com.example.hospedagem.dto.PermissaoDto;
import com.example.hospedagem.dto.TelaCatalogo;
import com.example.hospedagem.exception.RegraNegocioException;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.PerfilRepository;
import com.example.hospedagem.repository.UsuarioRepository;
import com.example.hospedagem.specification.PerfilSpecifications;
import com.example.hospedagem.util.PlanilhaExcel;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Regras de negócio dos Perfis de acesso (RBAC). */
@Service
public class PerfilService {

    private static final Set<String> CAMPOS_ORDENAVEIS = Set.of("id", "nome");
    private static final int SIZE_MIN = 5;
    private static final int SIZE_MAX = 100;
    private static final Sort ORDENACAO_PADRAO = Sort.by(Sort.Direction.ASC, "nome");

    private final PerfilRepository repository;
    private final UsuarioRepository usuarioRepository;

    public PerfilService(PerfilRepository repository, UsuarioRepository usuarioRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<PerfilResponse> buscar(PerfilFiltro filtro, Pageable pageable) {
        Pageable saneado = sanitizar(pageable);
        Page<Perfil> pagina = repository.findAll(PerfilSpecifications.comFiltro(filtro), saneado);
        List<PerfilResponse> conteudo = pagina.getContent().stream().map(this::toResumo).toList();
        return PageResponse.of(pagina, conteudo);
    }

    @Transactional(readOnly = true)
    public PerfilResponse obter(Long id) {
        return toResponseCompleto(buscarEntidade(id));
    }

    /** Perfis (id + nome) para popular selects, ordenados por nome. */
    @Transactional(readOnly = true)
    public List<PerfilOpcao> listarOpcoes() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome")).stream()
                .map(p -> new PerfilOpcao(p.getId(), p.getNome(), p.isAcessoTotal()))
                .toList();
    }

    /** Catálogo de telas e ações disponíveis, para o front montar a matriz de permissões. */
    @Transactional(readOnly = true)
    public List<TelaCatalogo> catalogo() {
        List<TelaCatalogo> telas = new ArrayList<>();
        for (Tela tela : Tela.values()) {
            List<AcaoCatalogo> acoes = tela.getAcoes().stream()
                    .map(a -> new AcaoCatalogo(a.name(), a.getRotulo()))
                    .toList();
            telas.add(new TelaCatalogo(tela.getChave(), tela.getRotulo(), acoes));
        }
        return telas;
    }

    @Transactional
    public PerfilResponse criar(PerfilRequest request) {
        String nome = request.nome().trim();
        if (repository.existsByNomeIgnoreCase(nome)) {
            throw new RegraNegocioException("nome", "Já existe um perfil com este nome.");
        }
        Perfil perfil = Perfil.builder()
                .nome(nome)
                .descricao(normalizarDescricao(request.descricao()))
                .acessoTotal(false)
                .sistema(false)
                .build();
        perfil.getPermissoes().addAll(montarPermissoes(perfil, request.permissoes()));
        return toResponseCompleto(repository.save(perfil));
    }

    @Transactional
    public PerfilResponse atualizar(Long id, PerfilRequest request) {
        Perfil perfil = buscarEntidade(id);
        if (perfil.isSistema()) {
            throw new RegraNegocioException(null, "O perfil do sistema não pode ser editado.");
        }
        String nome = request.nome().trim();
        if (repository.existsByNomeIgnoreCaseAndIdNot(nome, id)) {
            throw new RegraNegocioException("nome", "Já existe um perfil com este nome.");
        }
        perfil.setNome(nome);
        perfil.setDescricao(normalizarDescricao(request.descricao()));

        // Remove as permissões antigas e faz flush antes de inserir as novas, para não
        // colidir com o índice único (perfil_id, tela, acao) na mesma transação.
        perfil.getPermissoes().clear();
        repository.saveAndFlush(perfil);
        perfil.getPermissoes().addAll(montarPermissoes(perfil, request.permissoes()));
        return toResponseCompleto(repository.save(perfil));
    }

    @Transactional
    public void excluir(Long id) {
        Perfil perfil = buscarEntidade(id);
        if (perfil.isSistema()) {
            throw new RegraNegocioException(null, "O perfil do sistema não pode ser excluído.");
        }
        if (usuarioRepository.existsByPerfilId(id)) {
            throw new RegraNegocioException(null,
                    "Não é possível excluir: existem usuários com este perfil.");
        }
        repository.delete(perfil);
    }

    /** Exporta os perfis filtrados (sem paginação) para Excel. */
    @Transactional(readOnly = true)
    public byte[] exportar(PerfilFiltro filtro) {
        List<Perfil> lista = repository.findAll(
                PerfilSpecifications.comFiltro(filtro), Sort.by(Sort.Direction.ASC, "nome"));

        List<String> cabecalhos = List.of("ID", "Nome", "Descrição", "Acesso total", "Nº de permissões");
        List<List<Object>> linhas = new ArrayList<>();
        for (Perfil p : lista) {
            linhas.add(List.of(
                    p.getId(),
                    p.getNome(),
                    p.getDescricao() == null ? "" : p.getDescricao(),
                    p.isAcessoTotal() ? "Sim" : "Não",
                    p.isAcessoTotal() ? totalCatalogo() : p.getPermissoes().size()));
        }
        return PlanilhaExcel.gerar("Perfis", cabecalhos, linhas);
    }

    // ----- auxiliares -----

    private Perfil buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado."));
    }

    private String normalizarDescricao(String descricao) {
        if (descricao == null) {
            return null;
        }
        String limpo = descricao.trim();
        return limpo.isEmpty() ? null : limpo;
    }

    /**
     * Converte os pares (tela, ação) recebidos em entidades, validando contra o catálogo.
     * Toda tela com ao menos uma ação concedida ganha automaticamente a ação VER
     * (uma ação só faz sentido se a tela puder ser vista).
     */
    private List<PerfilPermissao> montarPermissoes(Perfil perfil, List<PermissaoDto> dtos) {
        Map<Tela, Set<Acao>> mapa = new LinkedHashMap<>();
        if (dtos != null) {
            for (PermissaoDto dto : dtos) {
                Tela tela = Tela.porChave(dto.tela())
                        .orElseThrow(() -> new RegraNegocioException("permissoes",
                                "Tela inválida: " + dto.tela()));
                Acao acao;
                try {
                    acao = Acao.valueOf(dto.acao());
                } catch (IllegalArgumentException e) {
                    throw new RegraNegocioException("permissoes", "Ação inválida: " + dto.acao());
                }
                if (!tela.permite(acao)) {
                    throw new RegraNegocioException("permissoes",
                            "A ação " + acao.getRotulo() + " não é válida para a tela " + tela.getRotulo() + ".");
                }
                mapa.computeIfAbsent(tela, t -> new LinkedHashSet<>()).add(acao);
            }
        }
        List<PerfilPermissao> lista = new ArrayList<>();
        for (Map.Entry<Tela, Set<Acao>> entry : mapa.entrySet()) {
            Set<Acao> acoes = entry.getValue();
            acoes.add(Acao.VER);
            for (Acao acao : acoes) {
                lista.add(PerfilPermissao.builder()
                        .perfil(perfil)
                        .tela(entry.getKey())
                        .acao(acao)
                        .build());
            }
        }
        return lista;
    }

    private PerfilResponse toResumo(Perfil p) {
        int total = p.isAcessoTotal() ? totalCatalogo() : p.getPermissoes().size();
        return new PerfilResponse(p.getId(), p.getNome(), p.getDescricao(),
                p.isAcessoTotal(), p.isSistema(), total, List.of());
    }

    private PerfilResponse toResponseCompleto(Perfil p) {
        List<PermissaoDto> perms = p.isAcessoTotal()
                ? List.of()
                : p.getPermissoes().stream()
                        .map(pp -> new PermissaoDto(pp.getTela().getChave(), pp.getAcao().name()))
                        .toList();
        int total = p.isAcessoTotal() ? totalCatalogo() : perms.size();
        return new PerfilResponse(p.getId(), p.getNome(), p.getDescricao(),
                p.isAcessoTotal(), p.isSistema(), total, perms);
    }

    private int totalCatalogo() {
        int total = 0;
        for (Tela tela : Tela.values()) {
            total += tela.getAcoes().size();
        }
        return total;
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
