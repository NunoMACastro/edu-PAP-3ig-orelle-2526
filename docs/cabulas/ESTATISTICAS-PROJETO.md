# Estatísticas Do Projeto - Orelle

Data do levantamento: 2026-07-15
Base do levantamento: checkout local `orelle`

## Critérios De Contagem

- Documentação: ficheiros Markdown (`.md`) dentro de `docs/`, incluindo `docs/planificacao/`, `docs/cabulas/` e este ficheiro.
- Ficheiros textuais da app: ficheiros próprios e legíveis como UTF-8 dentro de `real_dev/api` e `real_dev/web`, incluindo código, configs, `package.json`, `package-lock.json`, `.env.example`, `.env.local.example`, scripts, testes e contratos de evidência.
- Código estrito: subconjunto dos ficheiros textuais da app com extensões `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.css`, `.html`, `.prisma` e `.sql`.
- Ativos estáticos e runtime distribuído: imagens, modelos, WebAssembly e JavaScript vendorizado de MediaPipe são inventariados separadamente, sem linhas de código.
- Exclusões da app: `node_modules`, diretórios `node_modules.*` de quarentena, `dist`, `coverage`, `playwright-report`, `test-results`, caches, `.DS_Store`, `.env`, `.env.local`, `real_dev/api/storage` e `real_dev/api/tmp`.
- Linha contabilizada: linha física de ficheiro. Linhas em branco e comentários contam, porque representam linhas reais mantidas no projeto.
- Backend: `real_dev/api`.
- Frontend: `real_dev/web`.

## Documentação

| Categoria                            |                                           Âmbito | Ficheiros | Linhas | Média por ficheiro |
| ------------------------------------ | -----------------------------------------------: | --------: | -----: | -----------------: |
| Total de documentação e planificação |                                   `docs/**/*.md` |       138 |  87117 |             631.28 |
| Documentação geral                   | `docs/**/*.md`, excluindo `docs/planificacao/**` |        10 |   2893 |             289.30 |
| Planificação                         |                      `docs/planificacao/**/*.md` |       128 | 84224 |             657.38 |

A maior parte da documentação textual do projeto está na planificação. A planificação representa `128` dos `138` ficheiros Markdown contabilizados, ou seja, `92.75%` dos ficheiros e `96.68%` das linhas de documentação.

## Código

### Ficheiros Textuais Da App

| Área         |                          Âmbito | Ficheiros | Linhas | Média por ficheiro |
| ------------ | ------------------------------: | --------: | -----: | -----------------: |
| Total da app | `real_dev/api` + `real_dev/web` |       570 | 140256 |             246.06 |
| Backend      |                  `real_dev/api` |       394 |  91062 |             231.12 |
| Frontend     |                  `real_dev/web` |       176 |  49194 |             279.51 |

Esta contagem inclui os ficheiros de suporte textuais que fazem parte do projeto, como `package-lock.json`, `package.json`, ficheiros `.env*.example`, configs e scripts de validação. Não transforma bytes de imagens, modelos ou WebAssembly em linhas artificiais.

Os ficheiros auxiliares próprios representam `7` ficheiros e `8403` linhas: `4` ficheiros / `4016` linhas no backend e `3` ficheiros / `4387` linhas no frontend.

### Ativos Estáticos E Runtime Distribuído

| Categoria                                     | Ficheiros |
| --------------------------------------------- | --------: |
| Imagens públicas de produto, marca e editorial |       523 |
| Imagens-fonte                                 |         3 |
| Screenshots de evidência técnica              |         8 |
| Fixture binária de teste                      |         1 |
| Runtime MediaPipe vendorizado                 |         7 |
| Total                                         |       542 |

Os `7` ficheiros MediaPipe (`3` JavaScript, `3` WebAssembly e `1` modelo) são dependência distribuída, não código próprio do Orelle. Por isso, estão fora das métricas de código e da análise AST.

### Código Estrito

| Área                    |                          Âmbito | Ficheiros | Linhas de código | Média por ficheiro |
| ----------------------- | ------------------------------: | --------: | ---------------: | -----------------: |
| Total de código estrito | `real_dev/api` + `real_dev/web` |       563 |           131853 |             234.20 |
| Backend                 |                  `real_dev/api` |       390 |            87046 |             223.19 |
| Frontend                |                  `real_dev/web` |       173 |            44807 |             259.00 |

## Código Por Extensão

| Extensão |     Área | Ficheiros | Linhas |
| -------- | -------: | --------: | -----: |
| `.js`    |  Backend |       373 |  82462 |
| `.mjs`   |  Backend |        17 |   4584 |
| `.jsx`   | Frontend |        84 |  23238 |
| `.css`   | Frontend |         1 |  10965 |
| `.js`    | Frontend |        42 |   6144 |
| `.mjs`   | Frontend |        45 |   4445 |
| `.html`  | Frontend |         1 |     15 |

## Funções E Estrutura Interna

A contagem de funções foi feita por AST com o parser Babel sobre os `561` ficheiros `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts` e `.tsx`. A métrica "funções" inclui declarações `function`, function expressions, arrow functions, métodos e construtores. Também inclui callbacks de testes, porque são funções reais mantidas no codebase. Todos os ficheiros elegíveis foram analisados sem erros de parsing.

| Métrica                             | Total | Backend | Frontend |
| ----------------------------------- | ----: | ------: | -------: |
| Funções / construções function-like |  6293 |    4247 |     2046 |
| Declarações `function`              |  1980 |    1452 |      528 |
| Function expressions                |     4 |       4 |        0 |
| Arrow functions                     |  4239 |    2737 |     1502 |
| Métodos                             |    66 |      52 |       14 |
| Construtores                        |     4 |       2 |        2 |
| Classes                             |     4 |       2 |        2 |

## Testes E Código Fonte

| Métrica                   | Total | Backend | Frontend |
| ------------------------- | ----: | ------: | -------: |
| Ficheiros dentro de `src` |   346 |     259 |       87 |
| Linhas dentro de `src`    | 79129 |   45958 |    33171 |
| Ficheiros de teste        |   174 |     114 |       60 |
| Linhas de teste           | 46147 |   36504 |     9643 |

As linhas de teste representam `32.90%` das linhas dos ficheiros textuais próprios da app. As linhas dentro de `src` representam `56.42%` dessas linhas.

## Leitura Rápida

- O projeto tem `138` ficheiros Markdown de documentação e planificação.
- A documentação e planificação somam `87117` linhas.
- A app em `real_dev` tem `570` ficheiros textuais próprios, incluindo código e auxiliares do projeto.
- Esses ficheiros textuais somam `140256` linhas.
- Dentro desses ficheiros, o código estrito soma `563` ficheiros e `131853` linhas.
- O frontend inclui ainda `542` ativos estáticos ou ficheiros de runtime distribuído, inventariados sem linhas artificiais.
- O codebase próprio tem `6293` funções/construções function-like contabilizadas por AST.
- Existem `174` ficheiros de teste, com `46147` linhas.
- O backend concentra `69.12%` dos ficheiros textuais próprios da app e `64.93%` das respetivas linhas.
- O frontend concentra `30.88%` dos ficheiros textuais próprios da app e `35.07%` das respetivas linhas.
