package com.example.hospedagem.util;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/**
 * Gera planilhas .xlsx estilizadas (cabeçalho, autofiltro, 1ª linha congelada, larguras)
 * a partir de cabeçalhos + linhas, e monta a resposta HTTP de download.
 */
public final class PlanilhaExcel {

    private PlanilhaExcel() {
    }

    private static final DateTimeFormatter FMT_DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FMT_DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final MediaType XLSX = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    private static final int LARGURA_MAX = 60 * 256;

    /** Gera os bytes de um .xlsx com uma aba. Cada linha deve ter o mesmo tamanho dos cabeçalhos. */
    public static byte[] gerar(String aba, List<String> cabecalhos, List<List<Object>> linhas) {
        try (Workbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet(abaSegura(aba));
            CellStyle estiloCabecalho = estiloCabecalho(wb);

            Row cabecalho = sheet.createRow(0);
            for (int c = 0; c < cabecalhos.size(); c++) {
                Cell cell = cabecalho.createCell(c);
                cell.setCellValue(cabecalhos.get(c));
                cell.setCellStyle(estiloCabecalho);
            }

            int r = 1;
            for (List<Object> linha : linhas) {
                Row row = sheet.createRow(r++);
                for (int c = 0; c < linha.size(); c++) {
                    escrever(row.createCell(c), linha.get(c));
                }
            }

            for (int c = 0; c < cabecalhos.size(); c++) {
                sheet.autoSizeColumn(c);
                sheet.setColumnWidth(c, Math.min(sheet.getColumnWidth(c) + 512, LARGURA_MAX));
            }
            sheet.createFreezePane(0, 1);
            sheet.setAutoFilter(new CellRangeAddress(0, Math.max(0, linhas.size()), 0, cabecalhos.size() - 1));

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao gerar a planilha Excel.", e);
        }
    }

    /** Monta a resposta HTTP de download do .xlsx (nome = base + data). */
    public static ResponseEntity<byte[]> resposta(byte[] conteudo, String nomeBase) {
        String nome = nomeBase + "-" + LocalDate.now() + ".xlsx";
        return ResponseEntity.ok()
                .contentType(XLSX)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(nome).build().toString())
                .body(conteudo);
    }

    private static CellStyle estiloCabecalho(Workbook wb) {
        CellStyle estilo = wb.createCellStyle();
        Font fonte = wb.createFont();
        fonte.setBold(true);
        fonte.setColor(IndexedColors.WHITE.getIndex());
        estilo.setFont(fonte);
        estilo.setFillForegroundColor(IndexedColors.GREY_50_PERCENT.getIndex());
        estilo.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        estilo.setAlignment(HorizontalAlignment.LEFT);
        estilo.setVerticalAlignment(VerticalAlignment.CENTER);
        estilo.setBorderBottom(BorderStyle.THIN);
        return estilo;
    }

    private static void escrever(Cell cell, Object valor) {
        switch (valor) {
            case null -> cell.setBlank();
            case Number n -> cell.setCellValue(n.doubleValue());
            case Boolean b -> cell.setCellValue(b ? "Sim" : "Não");
            case LocalDate d -> cell.setCellValue(d.format(FMT_DATA));
            case LocalDateTime dt -> cell.setCellValue(dt.format(FMT_DATA_HORA));
            default -> cell.setCellValue(valor.toString());
        }
    }

    /** Nome de aba válido no Excel: sem : \ / ? * [ ] e no máximo 31 caracteres. */
    private static String abaSegura(String nome) {
        String limpo = nome == null ? "" : nome.replaceAll("[:\\\\/?*\\[\\]]", " ").trim();
        if (limpo.isEmpty()) {
            return "Dados";
        }
        return limpo.length() > 31 ? limpo.substring(0, 31) : limpo;
    }
}
