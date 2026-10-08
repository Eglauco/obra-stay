-- Regra de negócio: cada EPC do colaborador passa a ter uma PORCENTAGEM (soma 100% por colaborador),
-- usada no rateio de gastos por EPC. Migração aditiva: adiciona a coluna, faz backfill com divisão
-- igual (somando exatamente 100, com o resto no 1º EPC) e só então promove a NOT NULL.
ALTER TABLE colaborador_epc ADD COLUMN percentual NUMERIC(5,2);

-- Backfill: divide 100 igualmente entre os EPCs de cada colaborador. O 1º EPC (menor epc_id)
-- absorve o resto do arredondamento para a soma fechar em 100,00.
UPDATE colaborador_epc ce SET percentual = sub.pct
FROM (
    SELECT x.colaborador_id,
           x.epc_id,
           CASE WHEN x.rn = 1
                THEN ROUND(100.0 / x.n, 2) + (100.0 - ROUND(100.0 / x.n, 2) * x.n)
                ELSE ROUND(100.0 / x.n, 2) END AS pct
    FROM (
        SELECT ce2.colaborador_id,
               ce2.epc_id,
               COUNT(*)    OVER (PARTITION BY ce2.colaborador_id)                      AS n,
               ROW_NUMBER() OVER (PARTITION BY ce2.colaborador_id ORDER BY ce2.epc_id) AS rn
        FROM colaborador_epc ce2
    ) x
) sub
WHERE sub.colaborador_id = ce.colaborador_id
  AND sub.epc_id = ce.epc_id;

ALTER TABLE colaborador_epc ALTER COLUMN percentual SET NOT NULL;

-- Cada porcentagem individual deve ser > 0 e <= 100 (a soma = 100 é garantida pela aplicação).
ALTER TABLE colaborador_epc
    ADD CONSTRAINT ck_colabepc_percentual CHECK (percentual > 0 AND percentual <= 100);
