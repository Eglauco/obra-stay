-- Quartos dentro do Local: a hospedagem passa a ser num QUARTO (não direto no local), cada
-- quarto tem lotação máxima e a capacidade do Local vira a SOMA das lotações dos seus quartos.
-- Decisões: apagar TODO o histórico de hospedagem (começar do zero) e os locais começam SEM
-- quartos (capacidade 0, recalculada quando o usuário gerar os quartos).

-- 1) Tabela de quartos
CREATE TABLE quarto (
    id             BIGSERIAL PRIMARY KEY,
    local_id       BIGINT NOT NULL,
    nome           VARCHAR(60) NOT NULL,
    lotacao_maxima INTEGER NOT NULL,
    ordem          INTEGER NOT NULL,
    CONSTRAINT fk_quarto_local FOREIGN KEY (local_id) REFERENCES local (id) ON DELETE CASCADE,
    CONSTRAINT ck_quarto_lotacao CHECK (lotacao_maxima >= 1)
);
CREATE INDEX idx_quarto_local ON quarto (local_id);

-- 2) Apaga TODO o histórico de hospedagem (recomeço por quarto). Zera a FK denormalizada antes.
UPDATE colaborador SET hospedagem_ativa_id = NULL WHERE hospedagem_ativa_id IS NOT NULL;
DELETE FROM hospedagem;

-- 3) Hospedagem passa a referenciar o quarto (tabela vazia -> pode ser NOT NULL direto).
ALTER TABLE hospedagem ADD COLUMN quarto_id BIGINT NOT NULL;
ALTER TABLE hospedagem
    ADD CONSTRAINT fk_hospedagem_quarto FOREIGN KEY (quarto_id) REFERENCES quarto (id);
CREATE INDEX idx_hospedagem_quarto ON hospedagem (quarto_id);

-- 4) O Local não guarda mais a contagem de quartos (agora derivada da tabela quarto).
ALTER TABLE local DROP COLUMN quartos;

-- 5) Locais existentes começam sem quartos -> capacidade 0 (recalculada ao gerar quartos).
UPDATE local SET capacidade = 0;
