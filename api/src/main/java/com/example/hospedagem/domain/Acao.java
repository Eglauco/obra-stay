package com.example.hospedagem.domain;

/**
 * Ações que um perfil pode conceder sobre uma {@link Tela}.
 * Além do CRUD uniforme, há ações especiais em telas específicas
 * (dar entrada/saída em Hospedagens, trocar status em Locais, mudar status em Solicitações).
 * O nome da constante é o valor persistido/transportado; o rótulo é para exibição no front.
 */
public enum Acao {
    VER("Ver"),
    CRIAR("Criar"),
    EDITAR("Editar"),
    EXCLUIR("Excluir"),
    EXPORTAR("Exportar"),
    DAR_ENTRADA("Dar entrada"),
    DAR_SAIDA("Dar saída"),
    TROCAR_STATUS("Trocar status"),
    MUDAR_STATUS("Mudar status");

    private final String rotulo;

    Acao(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}
