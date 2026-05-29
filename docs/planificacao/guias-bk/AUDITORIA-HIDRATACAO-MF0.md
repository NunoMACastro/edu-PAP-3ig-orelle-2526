# Auditoria de hidratacao pedagogica/tecnica - MF0

## Header
- `doc_id`: `AUDITORIA-HIDRATACAO-MF0`
- `macro`: `MF0`
- `path`: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF0.md`
- `area`: `planificacao`
- `status`: `updated_after_hydration`
- `last_updated`: `2026-05-29`

## Objetivo
Auditar e acompanhar a hidratacao dos guias BK da macrofase `MF0`, garantindo que podem ser usados por alunos do 12.º ano sem dependerem de inferencia tecnica excessiva.

Esta auditoria nao altera RF, RNF, IDs BK, owners, prioridades, dependencias nem escopo. Regista apenas o estado pedagogico/tecnico dos guias, as decisoes confirmadas e os bloqueios que ainda exigem decisao documental ou configuracao real.

## Fontes consultadas
- `README.md`
- `docs/RF.md`
- `docs/RNF.md`
- `docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`
- `docs/planificacao/backlogs/BACKLOG-MVP.md`
- `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
- `docs/planificacao/backlogs/CONTRATO-CAMPOS-BK.md`
- `docs/planificacao/backlogs/MF-VIEWS.md`
- `docs/planificacao/guias-bk/_TEMPLATE-BK.md`
- `docs/planificacao/guias-bk/MF0/*.md`
- Guias posteriores consultados para contratos: `MF1`, `MF3`, `MF4` e `MF7` quando havia impacto em catalogo, preferencias, fotografias, consentimento ou recomendacoes.

## Snapshot inicial da auditoria

| Estado inicial | Total |
| --- | ---: |
| `OK` | 0 |
| `PARCIAL` | 3 |
| `CRITICO` | 5 |
| **Total analisado** | **8** |

Os BKs inicialmente marcados como `PARCIAL` eram `BK-MF0-03`, `BK-MF0-06` e `BK-MF0-08`.

Os BKs inicialmente marcados como `CRITICO` eram `BK-MF0-01`, `BK-MF0-02`, `BK-MF0-04`, `BK-MF0-05` e `BK-MF0-07`.

## Estado pos-hidratacao

| Estado atual | Total |
| --- | ---: |
| `OK` | 8 |
| `PARCIAL` | 0 |
| `CRITICO` | 0 |
| **Total analisado** | **8** |

Todos os guias `MF0` receberam uma secao `Hidratacao tecnica completa` com explicacao pedagogica, scope-in/scope-out, pre-requisitos, ficheiros a criar/editar/rever, codigo completo por ficheiro, localizacao de insercao, explicacao apos blocos de codigo, payloads, respostas esperadas, validacoes, cenarios negativos, evidence e handoff.

## BKs hidratados

| BK | Estado inicial | Estado atual | Reforco principal |
| --- | --- | --- | --- |
| `BK-MF0-01` | `CRITICO` | `OK` | Bootstrap normalizado para `server/` e `client/`, registo com bcrypt, DTO seguro, UI e testes. |
| `BK-MF0-02` | `CRITICO` | `OK` | Sessao com cookie `HttpOnly`, `requireAuth`, logout, `/me`, frontend sem `localStorage` e testes. |
| `BK-MF0-03` | `PARCIAL` | `OK` | Perfil protegido por ownership, validacao de campos, UI, payloads e bloqueio de dados medicos fora de scope. |
| `BK-MF0-04` | `CRITICO` | `OK` | Edicao de perfil com fotografia apenas em `stub_url`, bloqueio de upload real sem consentimento/storage/retencao. |
| `BK-MF0-05` | `CRITICO` | `OK` | Roles `cliente`, `consultor`, `administrador`, middleware RBAC, seed admin e testes `401/403`. |
| `BK-MF0-06` | `PARCIAL` | `OK` | Preferencias privadas por utilizador, marcas normalizadas e produtos favoritos bloqueados ate existir catalogo real. |
| `BK-MF0-07` | `CRITICO` | `OK` | Catalogo admin protegido, produto sem dependencia de IA, preco em centimos, stock inteiro e bloqueio de claims clinicos/medicos. |
| `BK-MF0-08` | `PARCIAL` | `OK` | Categorias iniciais, seed, associacao por `categoryIds`, rotas admin protegidas e handoff para filtros em `MF1`. |

## Decisoes tecnicas confirmadas
- A estrutura base da app fica normalizada em `server/src` e `client/src`. O drift antigo de `apps/api`/`apps/web` foi removido dos guias `MF0`.
- O backend segue o padrao `routes -> controller -> service -> model`, para facilitar explicacao e testes.
- A autenticacao usa password hash com `bcrypt` e sessao em cookie `HttpOnly`; tokens nao devem ser guardados em `localStorage` ou `sessionStorage`.
- Roles Cliente/Consultor/Admin sao protegidas no backend com `requireAuth` antes de `requireRole`.
- Fotografias em `MF0` sao tratadas apenas como avatar por URL/stub controlado; upload real facial fica bloqueado ate existirem consentimento explicito, storage seguro, retencao e controlo de acesso documentados.
- Produtos e categorias nao dependem de IA, simulacao ou recomendacoes avancadas.
- Descricoes de produtos devem rejeitar claims clinicos/medicos nao documentados.
- Preferencias por marcas podem existir antes do catalogo; favoritos por produto so devem ser ativados contra IDs reais depois do contrato de `BK-MF0-07`.

## Reforcos de privacidade e seguranca
- Passwords nunca sao guardadas nem devolvidas em texto claro.
- DTOs de utilizador removem `passwordHash` das respostas.
- Cookies de sessao sao `HttpOnly`, `sameSite` e configurados para `secure` fora de desenvolvimento.
- Rotas de perfil e preferencias usam sempre `req.user.id`, evitando leitura/escrita cruzada entre utilizadores.
- Rotas admin de roles, produtos e categorias exigem autenticacao e role `administrador`.
- Fotografias faciais nao sao tratadas como upload comum: em `MF0` o guia documenta `stub_url` e bloqueio explicito de ficheiros reais.
- Os guias impedem promessas medicas/clinicas em perfil, produtos e recomendacoes futuras.

## Drift documental encontrado e resolvido
- `BK-MF0-01` usava `apps/api` e `apps/web`, enquanto os restantes guias usavam `server/src` e `client/src`. Resolvido na hidratacao: `BK-MF0-01` ficou normalizado para `server/` e `client/`.
- `BK-MF0-07` tem dependencia canonica `-`, mas exige autenticacao/role para escrita admin. Mantido sem alterar matriz: o guia documenta isto como pre-condicao tecnica derivada e bloqueia implementacao real se `BK-MF0-02`/`BK-MF0-05` nao estiverem prontos.
- `RF04` aparece em `MF0` e toca fotografias antes do consentimento formal de fases posteriores. Resolvido pedagogicamente: `BK-MF0-04` implementa apenas `stub_url` e declara os ficheiros que devem ser atualizados antes de upload real.

## Bloqueios restantes
- `MONGODB_URI`, `SESSION_SECRET`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` precisam de configuracao local/ambiente antes de execucao real.
- Upload real de fotografias faciais continua bloqueado ate decisao documental sobre consentimento explicito, armazenamento seguro, retencao, controlo de acesso e fluxo de eliminacao.
- Produtos favoritos com IDs reais em preferencias devem ser validados depois de o catalogo de `BK-MF0-07` estar implementado.
- O script `scripts/validate-planificacao.sh` tem um problema de caminho: tenta executar `../scripts/validate_planificacao_canonica.py`, que nao existe a partir da raiz atual do repositorio.

## Validacao executada

- Comando pedido: `bash scripts/validate-planificacao.sh`
- Resultado: falhou antes da validacao documental.
- Exit code: `2`
- Erro observado: o script tenta executar `../scripts/validate_planificacao_canonica.py`, mas esse ficheiro nao existe a partir da raiz atual do repositorio.
- Diagnostico auxiliar executado: `python3 docs/planificacao/scripts/auditar_planificacao.py`
- Resultado auxiliar: `overall_pass: true`
- Sub-resultados auxiliares: `coverage_pass: true`, `consistency_pass: true`, `guides_pass: true`, `naming_pass: true`

## BKs que podem ficar como estao

- `BK-MF0-01`
- `BK-MF0-02`
- `BK-MF0-03`
- `BK-MF0-04`
- `BK-MF0-05`
- `BK-MF0-06`
- `BK-MF0-07`
- `BK-MF0-08`

Estes guias podem ficar como estao para uso pedagogico/tecnico, desde que os bloqueios explicitados em cada guia sejam respeitados durante a implementacao real.

## BKs que precisam de pequenas melhorias

Nenhum BK da `MF0` fica classificado como `PARCIAL` apos esta hidratacao.

Melhorias futuras opcionais podem ser feitas quando existir codigo real no repositorio, para trocar snippets didaticos por referencias a ficheiros implementados.

## BKs que precisam de hidratacao profunda antes de serem usados pelos alunos

Nenhum BK da `MF0` fica classificado como `CRITICO` apos esta hidratacao.

Os bloqueios restantes sao decisoes/configuracoes de execucao, nao falta de hidratacao pedagogica dos guias.
