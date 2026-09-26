-- Telefone de contato da locadora (apenas dígitos: 10 = fixo, 11 = celular).
-- Coluna adicionada como nullable, com backfill e depois promovida a NOT NULL.

ALTER TABLE locadora ADD COLUMN telefone VARCHAR(11);

-- Backfill dos registros de seed (ids 1..6) com telefones realistas
UPDATE locadora SET telefone = CASE id
        WHEN 1 THEN '31987654321'
        WHEN 2 THEN '1133224455'
        WHEN 3 THEN '21996887744'
        WHEN 4 THEN '4132658899'
        WHEN 5 THEN '51985471236'
        WHEN 6 THEN '6135551020'
    END
WHERE telefone IS NULL;

-- Fallback para quaisquer locadoras adicionadas fora do seed (evita NOT NULL falhar)
UPDATE locadora SET telefone = '1140044004' WHERE telefone IS NULL;

ALTER TABLE locadora ALTER COLUMN telefone SET NOT NULL;
