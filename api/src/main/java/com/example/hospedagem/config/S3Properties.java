package com.example.hospedagem.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuração do armazenamento de arquivos S3-compatível (MinIO/R2/B2/AWS).
 * Ligada por {@code app.s3.enabled=true} + credenciais (ver application.properties).
 */
@ConfigurationProperties(prefix = "app.s3")
@Getter
@Setter
public class S3Properties {

    /** Liga/desliga toda a integração de storage. */
    private boolean enabled = false;

    /** Endpoint da API S3 (ex.: https://bucket-production-aacf.up.railway.app). Vazio = AWS padrão. */
    private String endpoint;

    /** Região; MinIO aceita qualquer valor, padrão us-east-1. */
    private String region = "us-east-1";

    private String accessKey;

    private String secretKey;

    /** Nome do bucket. */
    private String bucket;

    /** URL pública base para montar links diretos (normalmente igual ao endpoint). Opcional. */
    private String publicBaseUrl;

    /** Cria o bucket no startup caso ainda não exista. */
    private boolean autoCreateBucket = true;
}
