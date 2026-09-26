-- Foto do local (chave do objeto no storage S3/MinIO). Nulo = sem foto.
ALTER TABLE local ADD COLUMN foto_key VARCHAR(255);
