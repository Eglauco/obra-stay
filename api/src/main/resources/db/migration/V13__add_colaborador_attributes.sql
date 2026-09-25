-- Novos atributos do colaborador: classificação de mão de obra (MDO), CPF, e-mail
-- e vínculos obrigatórios com EPC, Empresa e Gestão (1 de cada por colaborador).
-- Colunas adicionadas como nullable, com backfill dos registros existentes e,
-- só então, promovidas a NOT NULL + constraints.

-- 1) Colunas (nullable inicialmente)
ALTER TABLE colaborador ADD COLUMN mdo        VARCHAR(30);
ALTER TABLE colaborador ADD COLUMN cpf        VARCHAR(11);
ALTER TABLE colaborador ADD COLUMN email      VARCHAR(160);
ALTER TABLE colaborador ADD COLUMN epc_id     BIGINT;
ALTER TABLE colaborador ADD COLUMN empresa_id BIGINT;
ALTER TABLE colaborador ADD COLUMN gestao_id  BIGINT;

-- 2) Backfill MDO conforme a função (indireta para apoio/gestão; direta para execução)
UPDATE colaborador c SET mdo = CASE
        WHEN f.nome ILIKE '%engenheiro%'
          OR f.nome ILIKE '%almoxarife%'
          OR f.nome ILIKE '%coordenador%'
          OR f.nome ILIKE '%seguran%'
          OR f.nome ILIKE '%mestre%'
        THEN 'MAO_DE_OBRA_INDIRETA'
        ELSE 'MAO_DE_OBRA_DIRETA'
    END
FROM funcao f
WHERE c.funcao_id = f.id AND c.mdo IS NULL;

-- 3) Backfill dos vínculos, distribuídos entre os registros de seed (ids 1..6)
UPDATE colaborador SET epc_id     = ((id - 1) % 6) + 1 WHERE epc_id IS NULL;
UPDATE colaborador SET empresa_id = ((id - 1) % 6) + 1 WHERE empresa_id IS NULL;
UPDATE colaborador SET gestao_id  = ((id - 1) % 6) + 1 WHERE gestao_id IS NULL;

-- 4) Backfill de e-mail (único por colaborador, formato válido)
UPDATE colaborador SET email = 'colaborador' || id || '@obrastay.com.br' WHERE email IS NULL;

-- 5) Backfill de CPF: gera CPFs válidos (com dígitos verificadores) e únicos
DO $$
DECLARE
    r     RECORD;
    seqn  INT := 0;
    cpf9  TEXT;
    base10 TEXT;
    s     INT;
    i     INT;
    d1    INT;
    d2    INT;
BEGIN
    FOR r IN SELECT id FROM colaborador WHERE cpf IS NULL ORDER BY id LOOP
        seqn := seqn + 1;
        cpf9 := lpad(seqn::text, 9, '0');

        -- 1º dígito verificador
        s := 0;
        FOR i IN 0..8 LOOP
            s := s + substr(cpf9, i + 1, 1)::int * (10 - i);
        END LOOP;
        d1 := 11 - (s % 11);
        IF d1 >= 10 THEN d1 := 0; END IF;

        -- 2º dígito verificador
        base10 := cpf9 || d1::text;
        s := 0;
        FOR i IN 0..9 LOOP
            s := s + substr(base10, i + 1, 1)::int * (11 - i);
        END LOOP;
        d2 := 11 - (s % 11);
        IF d2 >= 10 THEN d2 := 0; END IF;

        UPDATE colaborador SET cpf = cpf9 || d1::text || d2::text WHERE id = r.id;
    END LOOP;
END $$;

-- 6) Promove a NOT NULL
ALTER TABLE colaborador ALTER COLUMN mdo        SET NOT NULL;
ALTER TABLE colaborador ALTER COLUMN cpf        SET NOT NULL;
ALTER TABLE colaborador ALTER COLUMN email      SET NOT NULL;
ALTER TABLE colaborador ALTER COLUMN epc_id     SET NOT NULL;
ALTER TABLE colaborador ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE colaborador ALTER COLUMN gestao_id  SET NOT NULL;

-- 7) Unicidade de CPF
ALTER TABLE colaborador ADD CONSTRAINT uk_colaborador_cpf UNIQUE (cpf);

-- 8) Chaves estrangeiras + índices de apoio
ALTER TABLE colaborador ADD CONSTRAINT fk_colaborador_epc     FOREIGN KEY (epc_id)     REFERENCES epc (id);
ALTER TABLE colaborador ADD CONSTRAINT fk_colaborador_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id);
ALTER TABLE colaborador ADD CONSTRAINT fk_colaborador_gestao  FOREIGN KEY (gestao_id)  REFERENCES gestao (id);

CREATE INDEX idx_colaborador_epc     ON colaborador (epc_id);
CREATE INDEX idx_colaborador_empresa ON colaborador (empresa_id);
CREATE INDEX idx_colaborador_gestao  ON colaborador (gestao_id);
