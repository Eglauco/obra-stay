# ObraStay

Plataforma de **gestão de hospedagem de colaboradores em obras** (construção civil).
Monorepo com duas aplicações:

- `api/` — **Spring Boot 4.1.1** (Java 21), PostgreSQL, Flyway, JPA/Hibernate.
- `front/` — **Angular 22** (standalone + signals), Tailwind v4, SSR.

Cadastros: **Colaboradores**, **Funções**, **Locais** e **Locadoras** (CRUD com **paginação e filtros no backend**).
**Painel** (tela inicial): visão consolidada — ocupação, contratos a vencer, gastos por local (com custo por colaborador) e colaboradores por função.
Operação: **Hospedagens** (entradas/saídas de colaboradores), **Contratos** (locação dos locais por locadora) e **Gastos** (despesas por local).
Cada colaborador tem **1 função obrigatória**. Locais usam **ViaCEP** para autopreencher o endereço.
Identidade visual: SaaS premium, tema **claro + escuro**, acento índigo.

---

## Pré-requisitos

- Java 21+ e (opcional) Maven — há o wrapper `./mvnw`.
- Node 20+ e npm.
- PostgreSQL rodando em `localhost:5432` com o banco **`hospedagem`** criado:

```bash
psql -U postgres -c "CREATE DATABASE hospedagem;"
```

As credenciais padrão (sobrescrevíveis por variáveis de ambiente) estão em
`api/src/main/resources/application.properties`:
`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` (`postgres`), `SPRING_DATASOURCE_PASSWORD` (`root`).

O **Flyway** cria a tabela `colaborador` e insere **24 colaboradores de exemplo** na
primeira inicialização (migrations em `api/src/main/resources/db/migration`).

---

## Como rodar

### 1) Backend (porta 8080)

```bash
cd api
./mvnw spring-boot:run
```

### 2) Frontend (porta 4200)

```bash
cd front
npm install   # apenas na primeira vez
npm start
```

Abra http://localhost:4200 — o front consome a API em `http://localhost:8080/api`.

---

## API — módulo Colaboradores

Base: `http://localhost:8080/api/colaboradores`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Lista paginada. Filtros: `id`, `nome` (contém, case-insensitive), `sexo` (`MASCULINO`/`FEMININO`), `funcaoId`. Paginação: `page`, `size` (5–100), `sort` (`campo,direção` — `id`/`nome`/`sexo`). |
| GET | `/{id}` | Busca por id. |
| POST | `/` | Cria (`{ "nome", "sexo", "funcaoId" }`). |
| PUT | `/{id}` | Atualiza. |
| DELETE | `/{id}` | Exclui (hard delete). |

Cada colaborador retorna a função aninhada: `{ id, nome, sexo, funcao: { id, nome } }`.

## API — módulo Funções

Base: `http://localhost:8080/api/funcoes`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Lista paginada. Filtros: `id`, `nome` (contém). `sort`: `id`/`nome`. |
| GET | `/opcoes` | Todas as funções (para selects). |
| GET | `/{id}` | Busca por id. |
| POST | `/` | Cria (`{ "nome" }`). |
| PUT | `/{id}` | Atualiza. |
| DELETE | `/{id}` | Exclui. Retorna **409** se houver colaboradores vinculados. |

A listagem retorna um `PageResponse`:
`{ content, page, size, totalElements, totalPages, first, last, numberOfElements }`.

## API — módulo Locais

Base: `http://localhost:8080/api/locais`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Lista paginada. Filtros: `id`, `codigo` (contém), `nome` (contém), `cidade` (contém). `sort`: `id`/`codigo`/`nome`/`capacidade`/`cidade`. |
| GET | `/{id}` | Busca por id. |
| POST | `/` | Cria (`{ codigo, nome, capacidade, cep, logradouro, numero, complemento?, bairro, cidade, uf }`). |
| PUT | `/{id}` | Atualiza. |
| DELETE | `/{id}` | Exclui (hard delete). |

`codigo` é único — cadastrar/editar com código repetido retorna **400** com erro no campo `codigo`.
O **endereço** é preenchido no front via **ViaCEP** (`https://viacep.com.br`): ao digitar o CEP (8 dígitos), logradouro/bairro/cidade/UF são carregados; **cidade e UF ficam travados**.

## API — módulo Locadoras

Base: `http://localhost:8080/api/locadoras` — empresas responsáveis pela locação dos locais (ex.: imobiliárias). Cadastro simples, ainda sem vínculo com outras entidades.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Lista paginada. Filtros: `id`, `nome` (contém). `sort`: `id`/`nome`. |
| GET | `/{id}` | Busca por id. |
| POST | `/` | Cria (`{ nome }`). |
| PUT | `/{id}` | Atualiza. |
| DELETE | `/{id}` | Exclui (hard delete). |

## API — Gestão de Hospedagem

Base: `http://localhost:8080/api/hospedagens` — entradas e saídas de colaboradores nos locais.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Lista paginada. Filtros: `colaboradorId`, `localId`, `status` (`ATIVA`/`ENCERRADA`), `entradaDe`, `entradaAte`. `sort`: `dataEntrada`/`dataSaida`/`id`. |
| GET | `/ocupacao` | Ocupação atual por local (`{ localId, localNome, capacidade, ocupados }`). |
| GET | `/{id}` | Busca por id. |
| POST | `/` | **Dar entrada** (`{ colaboradorId, localId, dataEntrada, observacao? }`). |
| PUT | `/{id}/saida` | **Dar saída** (`{ dataSaida }`). |
| DELETE | `/{id}` | Remove o registro. |

Regras de negócio (retornam **409** com mensagem/campo):
- **1 hospedagem ativa por colaborador** (reforçada por índice único parcial no banco).
- **Capacidade**: não permite dar entrada em local lotado.
- `dataSaida` ≥ `dataEntrada`; só encerra hospedagem ativa.

Auxiliar: `GET /api/colaboradores/opcoes` (todos os colaboradores, para selects).

## API — Gestão de Contratos

Base: `http://localhost:8080/api/contratos` — contratos de locação de cada local (vínculo com Locadora).

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Lista paginada. Filtros: `localId`, `codigo` (contém), `status` (`VIGENTE`/`AGENDADO`/`ENCERRADO`). `sort`: `dataInicio`/`dataFim`/`codigo`/`id`. |
| GET | `/vigencia` | Contrato vigente por local (`{ localId, contratoId, codigo, dataInicio, dataFim, locadoraNome }`) — alimenta o card. |
| GET | `/{id}` | Busca por id. |
| POST | `/` | Cria (`{ codigo, localId, locadoraId, dataInicio, dataFim }`). |
| PUT | `/{id}` | Atualiza. |
| DELETE | `/{id}` | Remove. |

Regras (retornam **409** com mensagem/campo):
- **`codigo` único**; `dataFim` ≥ `dataInicio`.
- **Sem sobreposição de períodos** no mesmo local (1 vigente por vez).
- `status` derivado por data: VIGENTE / AGENDADO / ENCERRADO. Card do local mostra os **dias até o vencimento** (âmbar ≤ 30 dias, vermelho vencido/sem contrato).

Auxiliar: `GET /api/locadoras/opcoes` (todas as locadoras, para selects).

## API — Gestão de Gastos

Base: `http://localhost:8080/api/gastos` — despesas de cada local. O `valor` é **unitário**; total do lançamento = `quantidade × valor`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Lista paginada. Filtros: `localId`, `nome` (contém), `dataDe`, `dataAte`. `sort`: `data`/`nome`/`valor`/`id`. |
| GET | `/totais` | Total gasto por local (`{ localId, total }`) — alimenta os cards. |
| GET | `/resumo` | `?localId&dataDe&dataAte` → `{ totalGeral, totalPeriodo }` (cabeçalho do detalhe). |
| GET | `/{id}` | Busca por id. |
| POST | `/` | Cria (`{ localId, nome, quantidade, valor, data }`). |
| PUT | `/{id}` | Atualiza. |
| DELETE | `/{id}` | Remove. |

Cada gasto retorna o `total` calculado (`quantidade × valor`).

Todas as listagens retornam um `PageResponse`:
`{ content, page, size, totalElements, totalPages, first, last, numberOfElements }`.

CORS liberado para `http://localhost:4200`.

---

## Estrutura do frontend

- `app.ts` — shell (sidebar + topbar + tema).
- `layout/` — `sidebar`, `topbar`.
- `features/painel/` — **Painel** (rota `painel`, tela inicial): KPIs + ocupação por local, contratos a vencer, gastos por local (com custo por colaborador) e colaboradores por função. Só compõe endpoints existentes (`/colaboradores/opcoes`, `/hospedagens/ocupacao`, `/contratos/vigencia`, `/gastos/totais`).
- `core/` — `models`, `services` (`colaborador`, `funcao`, `local`, `locadora`, `hospedagem`, `contrato`, `gasto`, `via-cep`, `theme`, `toast`), `util/format` (moeda/data), `components` (`toast-container`, `confirm-dialog`).
- `features/colaboradores/`
  - `colaborador-pesquisa/` — página da rota `colaboradores`: **console de busca** (filtros id/nome/sexo/função no back), tabela ordenável com coluna Função, estados (skeleton/vazio/erro), paginação. O estado da busca fica na **URL** (compartilhável e preservado ao voltar da edição).
  - `colaborador-cadastro/` — **tela dedicada** de criar/editar (rotas `colaboradores/novo` e `colaboradores/:id/editar`), Signal Forms com função obrigatória, acessível.
- `features/funcoes/`
  - `funcao-pesquisa/` — página da rota `funcoes`: busca (id/nome no back), tabela, estados, paginação.
  - `funcao-cadastro/` — **tela dedicada** de criar/editar (rotas `funcoes/novo` e `funcoes/:id/editar`).
- `features/locais/`
  - `local-pesquisa/` — página da rota `locais`: busca (id/codigo/nome/cidade no back), tabela com capacidade e cidade/UF, estados, paginação.
  - `local-cadastro/` — **tela dedicada** de criar/editar (rotas `locais/novo` e `locais/:id/editar`) com **ViaCEP** (autopreenchimento por CEP; cidade/UF travados).
- `features/locadoras/`
  - `locadora-pesquisa/` — página da rota `locadoras`: busca (id/nome no back), tabela, estados, paginação.
  - `locadora-cadastro/` — **tela dedicada** de criar/editar (rotas `locadoras/novo` e `locadoras/:id/editar`).
- `features/hospedagens/` — **gestão de hospedagem** (operação, fluxo mestre-detalhe centrado no Local):
  - `hospedagem-locais/` — rota `hospedagens`: **lista principal de Locais** em cards com ocupação (X/capacidade); clicar abre o detalhe.
  - `hospedagem-local/` — rota `hospedagens/local/:id`: detalhe do local com os **colaboradores hospedados** (abas Hospedados/Histórico/Todos), **+ Dar entrada** e **Dar saída** por colaborador.
  - `hospedagem-entrada/` — **tela** de dar entrada (rota `hospedagens/local/:id/entrada`): local **travado** (vem do detalhe), escolhe colaborador + data + observação.
  - `hospedagem-saida-dialog/` — **diálogo** de dar saída (check-out): confirma a data.
- `features/contratos/` — **gestão de contratos** (mesmo fluxo mestre-detalhe):
  - `contrato-locais/` — rota `contratos`: locais em cards com o **vencimento do contrato vigente** (âmbar ≤ 30 dias, vermelho vencido/sem contrato).
  - `contrato-local/` — rota `contratos/local/:id`: contratos do local (Vigente/Histórico/Todos), com **+ Novo contrato**, **Editar**, **Excluir** e **Renovar**.
  - `contrato-cadastro/` — **tela** de novo/editar/renovar (rotas `contratos/local/:id/novo` e `contratos/editar/:id`): local travado, escolhe locadora, código e datas.
- `features/gastos/` — **gestão de gastos** (mesmo fluxo mestre-detalhe):
  - `gasto-locais/` — rota `gastos`: locais em cards com o **total já gasto** em cada um.
  - `gasto-local/` — rota `gastos/local/:id`: gastos do local, **filtro por período** (De/Até) com **total geral** e **total do período**, além de **+ Novo gasto**, Editar e Excluir.
  - `gasto-cadastro/` — **tela** de novo/editar (rotas `gastos/local/:id/novo` e `gastos/editar/:id`): local travado, com nome, quantidade, valor unitário e data (mostra a **prévia do total**).

Padrão do projeto: em CRUD, Novo/Editar sempre em tela própria (nunca modal). Em operação, ações rápidas (dar saída) podem usar diálogo.
