-- Hospedagem: entrada/saída passam a guardar DATA + HORA (auditoria) e ganham a origem do registro.

ALTER TABLE hospedagem
    ALTER COLUMN data_entrada TYPE TIMESTAMP USING data_entrada::timestamp;
ALTER TABLE hospedagem
    ALTER COLUMN data_saida TYPE TIMESTAMP USING data_saida::timestamp;

-- Origem do registro da entrada: registros existentes vieram da administração.
ALTER TABLE hospedagem ADD COLUMN origem VARCHAR(20);
UPDATE hospedagem SET origem = 'ADMINISTRACAO' WHERE origem IS NULL;
ALTER TABLE hospedagem ALTER COLUMN origem SET NOT NULL;
