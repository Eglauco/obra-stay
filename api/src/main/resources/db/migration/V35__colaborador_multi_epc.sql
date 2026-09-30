-- Regra de negócio: o colaborador passa a ter VÁRIOS EPCs (N:N), sem "principal".
-- Migração segura: cria a tabela de junção, MIGRA o EPC atual de cada colaborador
-- (preservando o vínculo) e só então remove a coluna antiga colaborador.epc_id.
CREATE TABLE colaborador_epc (
    colaborador_id BIGINT NOT NULL,
    epc_id         BIGINT NOT NULL,
    CONSTRAINT pk_colaborador_epc PRIMARY KEY (colaborador_id, epc_id),
    CONSTRAINT fk_colabepc_colaborador FOREIGN KEY (colaborador_id) REFERENCES colaborador (id) ON DELETE CASCADE,
    CONSTRAINT fk_colabepc_epc FOREIGN KEY (epc_id) REFERENCES epc (id)
);

CREATE INDEX idx_colabepc_epc ON colaborador_epc (epc_id);

-- Backfill: cada colaborador atual leva o EPC que já tinha para a nova tabela.
INSERT INTO colaborador_epc (colaborador_id, epc_id)
SELECT id, epc_id FROM colaborador WHERE epc_id IS NOT NULL;

-- Remove a coluna antiga (dado preservado na tabela de junção).
ALTER TABLE colaborador DROP COLUMN epc_id;
