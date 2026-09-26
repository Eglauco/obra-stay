-- Arquivo (PDF) do contrato: chave do objeto no storage (S3/MinIO). Nulo = sem arquivo.
ALTER TABLE contrato ADD COLUMN arquivo_key VARCHAR(255);
