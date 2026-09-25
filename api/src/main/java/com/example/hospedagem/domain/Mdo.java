package com.example.hospedagem.domain;

/**
 * Classificação da mão de obra do colaborador.
 * Serializado em JSON como o nome da constante: "MAO_DE_OBRA_DIRETA" ou "MAO_DE_OBRA_INDIRETA".
 * O rótulo amigável ("Mão de Obra Direta"/"Mão de Obra Indireta") é responsabilidade do front-end.
 */
public enum Mdo {
    MAO_DE_OBRA_DIRETA,
    MAO_DE_OBRA_INDIRETA
}
