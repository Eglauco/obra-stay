package com.example.hospedagem.service;

import com.example.hospedagem.config.S3Properties;
import com.example.hospedagem.dto.StoredObject;
import com.example.hospedagem.exception.StorageException;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

/**
 * Implementação de {@link StorageService} sobre S3/MinIO (AWS SDK v2).
 * Ativa apenas quando {@code app.s3.enabled=true}.
 */
@Service
@ConditionalOnProperty(prefix = "app.s3", name = "enabled", havingValue = "true")
public class S3StorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(S3StorageService.class);

    private final S3Client s3;
    private final S3Presigner presigner;
    private final S3Properties props;

    public S3StorageService(S3Client s3, S3Presigner presigner, S3Properties props) {
        this.s3 = s3;
        this.presigner = presigner;
        this.props = props;
    }

    /** Valida a configuração e cria o bucket (se habilitado) no startup. */
    @PostConstruct
    void inicializar() {
        if (!StringUtils.hasText(props.getBucket())) {
            throw new StorageException("app.s3.bucket não configurado (defina APP_S3_BUCKET).");
        }
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(props.getBucket()).build());
            log.info("Storage S3 ativo: bucket '{}' em '{}'", props.getBucket(),
                    StringUtils.hasText(props.getEndpoint()) ? props.getEndpoint() : "AWS " + props.getRegion());
        } catch (NoSuchBucketException e) {
            criarBucket();
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                criarBucket();
            } else {
                log.warn("Não foi possível verificar o bucket '{}': {}", props.getBucket(), e.getMessage());
            }
        }
    }

    private void criarBucket() {
        if (!props.isAutoCreateBucket()) {
            throw new StorageException("Bucket '" + props.getBucket()
                    + "' não existe e auto-create está desligado.");
        }
        s3.createBucket(CreateBucketRequest.builder().bucket(props.getBucket()).build());
        log.info("Storage S3: bucket '{}' criado.", props.getBucket());
    }

    @Override
    public StoredObject upload(String prefixo, String nomeArquivo, String contentType, byte[] conteudo) {
        String key = montarChave(prefixo, nomeArquivo);
        try {
            PutObjectRequest req = PutObjectRequest.builder()
                    .bucket(props.getBucket())
                    .key(key)
                    .contentType(StringUtils.hasText(contentType) ? contentType : "application/octet-stream")
                    .build();
            s3.putObject(req, RequestBody.fromBytes(conteudo));
        } catch (S3Exception e) {
            throw new StorageException("Falha ao enviar arquivo para o storage.", e);
        }
        String url = publicUrl(key);
        if (url == null) {
            url = presignedGetUrl(key, Duration.ofHours(1));
        }
        return new StoredObject(key, url, conteudo.length,
                StringUtils.hasText(contentType) ? contentType : "application/octet-stream");
    }

    @Override
    public byte[] download(String key) {
        try {
            ResponseBytes<GetObjectResponse> obj = s3.getObjectAsBytes(
                    GetObjectRequest.builder().bucket(props.getBucket()).key(key).build());
            return obj.asByteArray();
        } catch (NoSuchKeyException e) {
            throw new StorageException("Arquivo não encontrado: " + key, e);
        } catch (S3Exception e) {
            throw new StorageException("Falha ao baixar arquivo do storage.", e);
        }
    }

    @Override
    public void delete(String key) {
        try {
            s3.deleteObject(DeleteObjectRequest.builder().bucket(props.getBucket()).key(key).build());
        } catch (S3Exception e) {
            throw new StorageException("Falha ao remover arquivo do storage.", e);
        }
    }

    @Override
    public boolean exists(String key) {
        try {
            s3.headObject(HeadObjectRequest.builder().bucket(props.getBucket()).key(key).build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                return false;
            }
            throw new StorageException("Falha ao consultar arquivo no storage.", e);
        }
    }

    @Override
    public String presignedGetUrl(String key, Duration ttl) {
        GetObjectPresignRequest req = GetObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .getObjectRequest(GetObjectRequest.builder().bucket(props.getBucket()).key(key).build())
                .build();
        return presigner.presignGetObject(req).url().toString();
    }

    @Override
    public String publicUrl(String key) {
        String base = props.getPublicBaseUrl();
        if (!StringUtils.hasText(base)) {
            return null;
        }
        String semBarra = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        // path-style: <base>/<bucket>/<key>
        return semBarra + "/" + props.getBucket() + "/" + key;
    }

    // ----- auxiliares -----

    private String montarChave(String prefixo, String nomeArquivo) {
        String pasta = StringUtils.hasText(prefixo) ? sanitizarPasta(prefixo) : "arquivos";
        LocalDate hoje = LocalDate.now();
        String nome = UUID.randomUUID().toString().replace("-", "");
        return String.format(Locale.ROOT, "%s/%04d/%02d/%s%s",
                pasta, hoje.getYear(), hoje.getMonthValue(), nome, extensao(nomeArquivo));
    }

    /** Extensão (com ponto) em minúsculas, ou "" quando ausente/estranha. */
    private String extensao(String nomeArquivo) {
        if (!StringUtils.hasText(nomeArquivo)) {
            return "";
        }
        int ponto = nomeArquivo.lastIndexOf('.');
        if (ponto < 0 || ponto == nomeArquivo.length() - 1) {
            return "";
        }
        String ext = nomeArquivo.substring(ponto + 1).toLowerCase(Locale.ROOT);
        return ext.matches("[a-z0-9]{1,8}") ? "." + ext : "";
    }

    private String sanitizarPasta(String prefixo) {
        String limpo = prefixo.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9/_-]+", "-")
                .replaceAll("^/+|/+$", "");
        return StringUtils.hasText(limpo) ? limpo : "arquivos";
    }
}
