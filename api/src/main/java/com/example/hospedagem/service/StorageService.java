package com.example.hospedagem.service;

import com.example.hospedagem.dto.StoredObject;
import java.time.Duration;

/**
 * Abstração de armazenamento de arquivos (implementada sobre S3/MinIO).
 *
 * <p>A implementação só existe quando {@code app.s3.enabled=true}. Onde for usada de forma
 * opcional, injete via {@code ObjectProvider<StorageService>} para o app funcionar sem storage.
 */
public interface StorageService {

    /**
     * Envia um arquivo. A chave final é gerada como
     * {@code <prefixo>/<ano>/<mes>/<uuid>.<ext>} para evitar colisões.
     *
     * @param prefixo    "pasta" lógica (ex.: "solicitacoes", "colaboradores")
     * @param nomeArquivo nome original (usado só para deduzir a extensão)
     * @param contentType tipo MIME (ex.: image/jpeg); pode ser nulo
     * @param conteudo    bytes do arquivo
     * @return metadados do objeto gravado (chave + URL)
     */
    StoredObject upload(String prefixo, String nomeArquivo, String contentType, byte[] conteudo);

    /** Baixa o conteúdo de um objeto pela chave. */
    byte[] download(String key);

    /** Remove um objeto (idempotente). */
    void delete(String key);

    /** Indica se um objeto existe. */
    boolean exists(String key);

    /** Gera uma URL temporária (pré-assinada) para leitura direta do objeto. */
    String presignedGetUrl(String key, Duration ttl);

    /** URL pública direta do objeto, quando {@code app.s3.public-base-url} estiver configurado (senão null). */
    String publicUrl(String key);
}
