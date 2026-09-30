-- Auditoria: data/hora do último login de cada usuário.
-- Aditivo e seguro em produção: coluna anulável (usuários existentes ficam nulos
-- até efetuarem o próximo login).
ALTER TABLE usuario ADD COLUMN ultimo_login TIMESTAMP;
