# Estatísticas Do Projeto - Orelle

Data do levantamento: 2026-07-07
Base do levantamento: checkout local `orelle`

> **Snapshot histórico, não contagem atual.** A correção integral iniciada em 2026-07-09 e a consulta OpenAI-only de 2026-07-11 acrescentaram/removeram módulos, testes e documentação. Os valores abaixo preservam apenas o levantamento de 2026-07-07 e não devem ser citados como estado final. O estado/evidência atuais ficam no [`PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md`](../planificacao/PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md); o [`PLANO-CORRECAO-AUDITORIA-COMPLETA-real_dev.md`](../planificacao/PLANO-CORRECAO-AUDITORIA-COMPLETA-real_dev.md) mantém o histórico anterior.

## Critérios De Contagem

- Documentação: ficheiros Markdown (`.md`) dentro de `docs/`, incluindo `docs/planificacao/` e este ficheiro.
- Ficheiros da app: ficheiros próprios dentro de `real_dev/api` e `real_dev/web`, incluindo código, testes, scripts, configs, `package.json`, `package-lock.json` e `.env.example`.
- Código estrito: subconjunto dos ficheiros da app com extensões `.js`, `.jsx`, `.mjs`, `.cjs`, `.css` e `.html`.
- Exclusões da app: `node_modules`, `dist`, `coverage`, `playwright-report`, `test-results`, caches, `.DS_Store`, `.env` local, storage runtime, screenshots de evidência e outros artefactos gerados ou específicos da máquina.
- Linha contabilizada: linha física de ficheiro. Linhas em branco e comentários contam, porque representam linhas reais mantidas no projeto.
- Backend: `real_dev/api`.
- Frontend: `real_dev/web`.

## Documentação

| Categoria                            |                                           Âmbito | Ficheiros | Linhas | Média por ficheiro |
| ------------------------------------ | -----------------------------------------------: | --------: | -----: | -----------------: |
| Total de documentação e planificação |                                   `docs/**/*.md` |       134 |  98273 |             733.38 |
| Documentação geral                   | `docs/**/*.md`, excluindo `docs/planificacao/**` |         9 |   2518 |             279.78 |
| Planificação                         |                      `docs/planificacao/**/*.md` |       125 |  95755 |             766.04 |

A maior parte da documentação textual do projeto está na planificação. A planificação representa `125` dos `134` ficheiros Markdown contabilizados.

## Código

### Ficheiros Da App

| Área         |                          Âmbito | Ficheiros | Linhas | Média por ficheiro |
| ------------ | ------------------------------: | --------: | -----: | -----------------: |
| Total da app | `real_dev/api` + `real_dev/web` |       317 |  44090 |             139.09 |
| Backend      |                  `real_dev/api` |       236 |  30456 |             129.05 |
| Frontend     |                  `real_dev/web` |        81 |  13634 |             168.32 |

Esta contagem inclui os ficheiros de suporte que fazem parte do projeto, como `package-lock.json`, `package.json` e `.env.example`.

Os ficheiros auxiliares próprios representam `8` ficheiros e `6401` linhas: `3` ficheiros / `3112` linhas no backend e `5` ficheiros / `3289` linhas no frontend.

### Código Estrito

| Área                    |                          Âmbito | Ficheiros | Linhas de código | Média por ficheiro |
| ----------------------- | ------------------------------: | --------: | ---------------: | -----------------: |
| Total de código estrito | `real_dev/api` + `real_dev/web` |       309 |            37689 |             121.97 |
| Backend                 |                  `real_dev/api` |       233 |            27344 |             117.36 |
| Frontend                |                  `real_dev/web` |        76 |            10345 |             136.12 |

### Código Por Extensão

| Extensão |     Área | Ficheiros | Linhas |
| -------- | -------: | --------: | -----: |
| `.js`    |  Backend |       231 |  26918 |
| `.mjs`   |  Backend |         2 |    426 |
| `.jsx`   | Frontend |        51 |   6520 |
| `.css`   | Frontend |         1 |   1712 |
| `.mjs`   | Frontend |        14 |   1365 |
| `.js`    | Frontend |         9 |    736 |
| `.html`  | Frontend |         1 |     12 |

### Funções E Estrutura Interna

A contagem de funções foi feita por AST com o parser Babel, sobre ficheiros `.js`, `.jsx`, `.mjs` e `.cjs`. A métrica "funções" inclui declarações `function`, function expressions, arrow functions, métodos de objeto, métodos de classes e construtores.

| Métrica                             | Total | Backend | Frontend |
| ----------------------------------- | ----: | ------: | -------: |
| Funções / construções function-like |  1809 |    1366 |      443 |
| Declarações `function`              |   816 |     603 |      213 |
| Function expressions                |     1 |       1 |        0 |
| Arrow functions                     |   966 |     736 |      230 |
| Métodos de objeto                   |    25 |      25 |        0 |
| Métodos de classes                  |     0 |       0 |        0 |
| Construtores                        |     1 |       1 |        0 |
| Classes                             |     1 |       1 |        0 |

### Testes E Código Fonte

| Métrica                | Total | Backend | Frontend |
| ---------------------- | ----: | ------: | -------: |
| Ficheiros dentro de `src` |   247 |     185 |       62 |
| Linhas dentro de `src`    | 26006 |   15416 |    10590 |
| Ficheiros de teste        |    46 |      46 |        0 |
| Linhas de teste           | 11502 |   11502 |        0 |

As linhas de teste representam `26.09%` das linhas dos ficheiros próprios da app. As linhas dentro de `src` representam `58.98%` das linhas dos ficheiros próprios da app.

## Leitura Rápida

- O projeto tem `134` ficheiros Markdown de documentação e planificação.
- A documentação e planificação somam `98273` linhas.
- A app em `real_dev` tem `317` ficheiros próprios, incluindo código e auxiliares do projeto.
- Esses ficheiros próprios da app somam `44090` linhas.
- Dentro desses ficheiros, o código estrito soma `309` ficheiros e `37689` linhas.
- O codebase tem `1809` funções/construções function-like contabilizadas por AST.
- Existem `46` ficheiros de teste, com `11502` linhas.
- O backend concentra `74.45%` dos ficheiros próprios da app e `69.08%` das linhas da app.
- O frontend concentra `25.55%` dos ficheiros próprios da app e `30.92%` das linhas da app.
