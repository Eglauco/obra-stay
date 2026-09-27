-- Valor do aluguel mensal do Local (opcional; 0 quando não informado).
-- Base do Resumo Financeiro (aluguel + mobiliário mensal). DEFAULT 0 já cobre os existentes.
ALTER TABLE local ADD COLUMN valor_aluguel NUMERIC(12, 2) NOT NULL DEFAULT 0;
