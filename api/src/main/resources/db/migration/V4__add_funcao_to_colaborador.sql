-- Vincula Função ao Colaborador (função obrigatória, 1 por colaborador)
ALTER TABLE colaborador ADD COLUMN funcao_id BIGINT;

-- Distribui as funções existentes entre os 24 colaboradores (variedade na demo)
UPDATE colaborador SET funcao_id = ((id - 1) % 10) + 1 WHERE funcao_id IS NULL;

ALTER TABLE colaborador ALTER COLUMN funcao_id SET NOT NULL;

ALTER TABLE colaborador ADD CONSTRAINT fk_colaborador_funcao
    FOREIGN KEY (funcao_id) REFERENCES funcao(id);

CREATE INDEX idx_colaborador_funcao ON colaborador (funcao_id);
