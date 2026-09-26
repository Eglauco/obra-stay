-- Referência denormalizada à hospedagem ATIVA do colaborador (centraliza a info para buscas).
-- Mantida em sincronia pela HospedagemService a cada entrada/saída. ON DELETE SET NULL
-- garante que apagar uma hospedagem não quebre a FK.
ALTER TABLE colaborador ADD COLUMN hospedagem_ativa_id BIGINT;

ALTER TABLE colaborador ADD CONSTRAINT fk_colaborador_hospedagem_ativa
    FOREIGN KEY (hospedagem_ativa_id) REFERENCES hospedagem (id) ON DELETE SET NULL;

-- Backfill: aponta cada colaborador para sua hospedagem ativa atual (data_saida nula).
UPDATE colaborador c SET hospedagem_ativa_id = (
    SELECT h.id
    FROM hospedagem h
    WHERE h.colaborador_id = c.id AND h.data_saida IS NULL
    ORDER BY h.data_entrada DESC, h.id DESC
    LIMIT 1
);
