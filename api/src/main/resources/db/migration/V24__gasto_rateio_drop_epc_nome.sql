-- O rateio deixa de guardar uma CÓPIA do nome do EPC. Passa a referenciar apenas o
-- epc_id; o nome é resolvido a partir da tabela epc no momento da consulta, para
-- refletir renomeações do EPC (evita "nome congelado" no rateio já lançado).
-- Os números do rateio (pessoas/percentual/valor) continuam sendo snapshot do lançamento.
ALTER TABLE gasto_rateio DROP COLUMN epc_nome;
