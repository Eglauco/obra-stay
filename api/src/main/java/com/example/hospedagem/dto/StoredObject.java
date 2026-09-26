package com.example.hospedagem.dto;

/**
 * Resultado de um upload no storage: a chave (caminho) do objeto, uma URL para acesso
 * (pública ou pré-assinada), o tamanho em bytes e o content-type gravado.
 */
public record StoredObject(String key, String url, long size, String contentType) {
}
