package com.example.hospedagem.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.ImageIO;
import net.coobird.thumbnailator.Thumbnails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Redimensiona e comprime imagens antes de subir ao storage.
 *
 * <p>Decodifica com ImageIO; se conseguir, reescreve como JPEG limitado a {@code maxLado}
 * (sem ampliar) com a qualidade indicada. Se não conseguir decodificar (ex.: WebP sem
 * plugin), devolve os bytes originais (passthrough) — o arquivo já costuma ser pequeno.
 */
@Component
public class ProcessadorImagem {

    private static final Logger log = LoggerFactory.getLogger(ProcessadorImagem.class);

    /** Resultado do processamento: bytes finais + content-type + extensão (com ponto). */
    public record ImagemProcessada(byte[] bytes, String contentType, String extensao) {
    }

    public ImagemProcessada processar(byte[] original, String contentTypeOriginal,
                                      int maxLado, double qualidade) {
        try {
            BufferedImage src = ImageIO.read(new ByteArrayInputStream(original));
            if (src == null) {
                return passthrough(original, contentTypeOriginal);
            }
            int alvoLargura = Math.min(src.getWidth(), maxLado);
            int alvoAltura = Math.min(src.getHeight(), maxLado);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Thumbnails.of(src)
                    .size(alvoLargura, alvoAltura)
                    .keepAspectRatio(true)
                    .outputFormat("jpg")
                    .outputQuality(qualidade)
                    .toOutputStream(out);
            return new ImagemProcessada(out.toByteArray(), "image/jpeg", ".jpg");
        } catch (IOException | RuntimeException e) {
            log.warn("Não foi possível processar a imagem, salvando original: {}", e.getMessage());
            return passthrough(original, contentTypeOriginal);
        }
    }

    private ImagemProcessada passthrough(byte[] original, String contentType) {
        return new ImagemProcessada(
                original,
                contentType != null ? contentType : "application/octet-stream",
                extensaoDe(contentType));
    }

    private String extensaoDe(String contentType) {
        if (contentType == null) {
            return "";
        }
        return switch (contentType.toLowerCase()) {
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> "";
        };
    }
}
