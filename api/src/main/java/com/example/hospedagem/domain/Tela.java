package com.example.hospedagem.domain;

import java.util.List;
import java.util.Optional;

/**
 * Telas do sistema controladas por RBAC (Perfil). Cada tela define as ações que podem
 * ser concedidas a um perfil. A "chave" casa com a rota/menu do front (kebab-case) e é o
 * que compõe a authority ({@code chave:ACAO}). O Painel é sempre visível e não entra aqui.
 *
 * <p>Esta enum é a fonte única do catálogo de permissões: usada pelo catálogo exposto ao
 * front, pela validação no {@code PerfilService} e pelo seed de perfis no {@code DataInitializer}.
 */
public enum Tela {

    COLABORADORES("colaboradores", "Colaboradores", crudExport()),
    FUNCOES("funcoes", "Funções", crudExport()),
    EPC("epc", "EPC", crudExport()),
    EMPRESAS("empresas", "Empresas", crudExport()),
    GESTOES("gestoes", "Gestão", crudExport()),
    LOCAIS("locais", "Locais",
            List.of(Acao.VER, Acao.CRIAR, Acao.EDITAR, Acao.EXCLUIR, Acao.EXPORTAR, Acao.TROCAR_STATUS)),
    STATUS_LOCAIS("status-locais", "Status dos Locais", crudExport()),
    ORCAMENTOS_MOBILIARIO("orcamentos-mobiliario", "Orçamento de Mobiliário", crudExport()),
    LOCADORAS("locadoras", "Locadoras", crudExport()),
    TIPOS_SOLICITACAO("tipos-solicitacao", "Tipos de Solicitação", crudExport()),
    HOSPEDAGENS("hospedagens", "Hospedagens",
            List.of(Acao.VER, Acao.DAR_ENTRADA, Acao.DAR_SAIDA, Acao.EXCLUIR, Acao.EXPORTAR)),
    CONTRATOS("contratos", "Contratos", crudExport()),
    GASTOS("gastos", "Gastos", crudExport()),
    SOLICITACOES("solicitacoes", "Solicitações",
            List.of(Acao.VER, Acao.CRIAR, Acao.EDITAR, Acao.MUDAR_STATUS, Acao.EXCLUIR, Acao.EXPORTAR)),
    USUARIOS("usuarios", "Usuários",
            List.of(Acao.VER, Acao.CRIAR, Acao.EDITAR, Acao.EXCLUIR)),
    PERFIS("perfis", "Perfis",
            List.of(Acao.VER, Acao.CRIAR, Acao.EDITAR, Acao.EXCLUIR)),
    LOGS_ACESSO("logs-acesso", "Logs de Acesso",
            List.of(Acao.VER, Acao.EXPORTAR));

    private final String chave;
    private final String rotulo;
    private final List<Acao> acoes;

    Tela(String chave, String rotulo, List<Acao> acoes) {
        this.chave = chave;
        this.rotulo = rotulo;
        this.acoes = acoes;
    }

    public String getChave() {
        return chave;
    }

    public String getRotulo() {
        return rotulo;
    }

    public List<Acao> getAcoes() {
        return acoes;
    }

    /** Conjunto CRUD + exportação, o mais comum entre as telas de cadastro. */
    private static List<Acao> crudExport() {
        return List.of(Acao.VER, Acao.CRIAR, Acao.EDITAR, Acao.EXCLUIR, Acao.EXPORTAR);
    }

    public boolean permite(Acao acao) {
        return acoes.contains(acao);
    }

    public static Optional<Tela> porChave(String chave) {
        if (chave == null) {
            return Optional.empty();
        }
        for (Tela t : values()) {
            if (t.chave.equalsIgnoreCase(chave)) {
                return Optional.of(t);
            }
        }
        return Optional.empty();
    }
}
