-- E-mail do colaborador passa a ser OPCIONAL (por enquanto).
-- Alteração aditiva e segura: apenas afrouxa a restrição NOT NULL da coluna existente,
-- sem tocar nos dados atuais. A validação de FORMATO permanece na aplicação (@Email)
-- e é aplicada somente quando o e-mail for preenchido.
ALTER TABLE colaborador ALTER COLUMN email DROP NOT NULL;
