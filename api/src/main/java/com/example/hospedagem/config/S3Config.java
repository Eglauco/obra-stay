package com.example.hospedagem.config;

import java.net.URI;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Cria os beans do cliente S3 apenas quando {@code app.s3.enabled=true}.
 * Assim a aplicação continua subindo normalmente quando o storage não está configurado.
 *
 * <p>Usa path-style access (obrigatório no MinIO) e permite sobrepor o endpoint
 * (MinIO/R2/B2); sem endpoint, aponta para a AWS padrão da região.
 */
@Configuration
@EnableConfigurationProperties(S3Properties.class)
@ConditionalOnProperty(prefix = "app.s3", name = "enabled", havingValue = "true")
public class S3Config {

    private static final S3Configuration PATH_STYLE =
            S3Configuration.builder().pathStyleAccessEnabled(true).build();

    @Bean
    public S3Client s3Client(S3Properties props) {
        var builder = S3Client.builder()
                .region(Region.of(props.getRegion()))
                .credentialsProvider(credentials(props))
                .serviceConfiguration(PATH_STYLE)
                // Evita checksums que MinIO/R2/B2 podem rejeitar em uploads.
                .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED);
        if (StringUtils.hasText(props.getEndpoint())) {
            builder.endpointOverride(URI.create(props.getEndpoint()));
        }
        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner(S3Properties props) {
        var builder = S3Presigner.builder()
                .region(Region.of(props.getRegion()))
                .credentialsProvider(credentials(props))
                .serviceConfiguration(PATH_STYLE);
        if (StringUtils.hasText(props.getEndpoint())) {
            builder.endpointOverride(URI.create(props.getEndpoint()));
        }
        return builder.build();
    }

    private StaticCredentialsProvider credentials(S3Properties props) {
        return StaticCredentialsProvider.create(
                AwsBasicCredentials.create(props.getAccessKey(), props.getSecretKey()));
    }
}
