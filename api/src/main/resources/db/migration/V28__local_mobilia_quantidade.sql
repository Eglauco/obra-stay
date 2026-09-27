-- O item de mobília do Local passa a ter uma ÚNICA "quantidade" (a escala fixa/por quarto
-- fica só no Orçamento e é resolvida no momento da cópia). Backfill dos itens existentes:
-- quantidade = quantidade_fixa + quantidade_por_quarto * (nº de quartos do local).

ALTER TABLE local_mobilia_item ADD COLUMN quantidade INTEGER;

UPDATE local_mobilia_item i
SET quantidade = i.quantidade_fixa + i.quantidade_por_quarto * l.quartos
FROM local l
WHERE l.id = i.local_id;

-- Segurança: nenhuma quantidade nula/negativa.
UPDATE local_mobilia_item SET quantidade = 1 WHERE quantidade IS NULL OR quantidade < 1;

ALTER TABLE local_mobilia_item ALTER COLUMN quantidade SET NOT NULL;

ALTER TABLE local_mobilia_item DROP COLUMN quantidade_fixa;
ALTER TABLE local_mobilia_item DROP COLUMN quantidade_por_quarto;
