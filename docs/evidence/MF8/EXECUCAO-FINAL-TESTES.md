# EXECUCAO-FINAL-TESTES - MF8 Orelle

> **Nota de supersessão — 2026-07-11:** evidence histórica da bateria de 2026-07-07. O estado atual, comandos e retestes vigentes estão no [plano canónico da consulta OpenAI](../../planificacao/PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md). As contagens e a conclusão `PASSOU_COM_BLOCKER_E2E_DECLARADO` abaixo não constituem um gate final da árvore atual.

## Metadados

- `doc_id`: `EXECUCAO-FINAL-TESTES-MF8`
- `bk_id`: `BK-MF8-16`
- `requisito`: `RNF28`
- `origem`: `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
- `data_execucao`: `2026-07-07`
- `implementation_root`: `real_dev`
- `estado`: `PASSOU_COM_BLOCKER_E2E_DECLARADO`

## Resumo executivo

A bateria final de MF8 foi executada a partir da matriz criada no `BK-MF8-15`.
Os contratos, testes focais, smoke estatico, build web, validador de planificacao
e suite API completa passaram. A unica lacuna mantida e o `proof_e2e`, porque
nao existe comando browser/E2E aprovado em `real_dev/web/package.json`.

## Estados permitidos

- `passou`: comando executado com exit code `0` e output resumido guardado.
- `falhou_por_produto`: comando executado e falhou por codigo, contrato, teste
  ou configuracao da app. Nesta execucao nao houve proofs neste estado.
- `bloqueado_por_ambiente_ou_ferramenta`: comando nao pode ser executado por
  falta de runner, browser, permissao, servico externo ou artefacto herdado.

## Proofs executadas

| Proof | Ref | Camada | Comando | CWD | Exit code | Estado | Output resumido | Privacy check | Impacto |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| `proof_contrato` | `BK-MF8-16 / RNF28` | `planificacao` | `rg -n "RNF28\|BK-MF8-16\|BK-MF8-17\|unit \\+ integration \\+ e2e" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/BACKLOG-MVP.md docs/planificacao/sprints/PLANO-SPRINTS.md` | raiz | 0 | `passou` | Confirmou `RNF28`, `BK-MF8-16`, `BK-MF8-17` e regra P0 de `unit + integration + e2e`. | Sem dados privados no resumo. | O fecho BK16 esta ligado ao canon MF8. |
| `proof_matriz` | `BK-MF8-15 / RNF27` | `planificacao` | `rg -n "proof_api\|proof_web_build\|proof_mf8_smoke\|proof_e2e\|TODO \\(BLOCKER\\)" docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md` | raiz | 0 | `passou` | Confirmou matriz BK15 com `proof_api`, `proof_web_build`, `proof_mf8_smoke`, `proof_e2e` e blocker declarado. | Sem dados privados no resumo. | O BK16 executa o handoff do BK15 em vez de criar criterio paralelo. |
| `proof_contrato_bk15` | `BK-MF8-15 / RNF27` | `unit` | `node --check real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js` | raiz | 0 | `passou` | Sintaxe do contrato BK15 valida. | Sem dados privados no resumo. | Matriz final tem contrato executavel. |
| `proof_teste_final_bk15` | `BK-MF8-15 / RNF27` | `unit` | `npm --prefix real_dev/api test -- tests/mf8.final-contracts.test.js` | raiz | 0 | `passou` | `1` ficheiro passou, `5` testes passaram. | Sem dados privados no resumo. | Negativos P0 e lacuna E2E controlada ficam cobertos. |
| `proof_smoke_bk15` | `BK-MF8-15 / RNF27` | `smoke` | `node real_dev/web/scripts/check-mf8-final-smoke.mjs` | raiz | 0 | `passou` | `BK-MF8-15 fecho de testes validado: 4 artefactos e 18 contratos.` | Sem dados privados no resumo. | Artefactos minimos do handoff BK15 existem e sao legiveis. |
| `proof_contrato_bk16` | `BK-MF8-16 / RNF28` | `unit` | `node --check real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js` | raiz | 0 | `passou` | Sintaxe do contrato BK16 valida. | Sem dados privados no resumo. | Evidence final passa a ter contrato proprio. |
| `proof_teste_bk16` | `BK-MF8-16 / RNF28` | `unit` | `npm --prefix real_dev/api test -- tests/mf8.final-execution-contract.test.js` | raiz | 0 | `passou` | `1` ficheiro passou, `5` testes passaram. | Sem dados privados no resumo. | Evidence final valida proofs, estados, negativos e handoff. |
| `proof_api` | `MF0-MF8` | `integration` | `npm --prefix real_dev/api test` | raiz | 0 | `passou` | Fora da sandbox: `40` ficheiros passaram, `279` testes passaram. Na sandbox: bloqueado por `listen EPERM`, classificado como ambiente. | Resumo sem payloads privados. | Nao ha regressao API detetada na bateria real executavel. |
| `proof_web_build` | `MF0-MF8` | `build` | `npm --prefix real_dev/web run build` | raiz | 0 | `passou` | Vite compilou `87` modulos e gerou `dist/index.html`, CSS e JS em `765ms`. | Sem dados privados no resumo. | Frontend MF8 continua compilavel. |
| `proof_planificacao` | `MF0-MF8` | `planificacao` | `bash scripts/validate-planificacao.sh` | raiz | 0 | `passou` | `overall_pass: true`, sem refs invalidas, ciclos, links partidos, placeholders ou artefactos em falta. | Sem dados privados no resumo. | A evidencia nao quebra a planificacao canonica. |
| `proof_diff` | `MF8` | `diff` | `git diff --check` | raiz | 0 | `passou` | Sem output. | Sem dados privados no resumo. | Nao foram introduzidos erros de whitespace em ficheiros rastreados. |
| `proof_e2e` | `MF8 / P0` | `e2e` | `TODO (BLOCKER)` | raiz | 1 | `bloqueado_por_ambiente_ou_ferramenta` | Sem comando browser/E2E aprovado em `real_dev/web/package.json`. | Sem dados privados no resumo. | Bloqueio explicito para nao fingir cobertura browser. |
| `proof_privacidade` | `BK-MF8-16 / RNF28` | `privacy` | `node -e 'const fs=require("node:fs");const text=fs.readFileSync("docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md","utf8");const parts=[["pass","word","Hash"],["Author","ization",":"],["Set","-","Cookie"],["stor","age","Key"],["cons","ent","Id"],["/Use","rs/"],["/v","ar/"]];const hit=parts.map((part)=>part.join("")).find((marker)=>text.includes(marker));if(hit){throw new Error("sensitive marker")}console.log("Sem marcadores sensiveis na evidence final.");'` | raiz | 0 | `passou` | Sem marcadores sensiveis na evidence final. | Sem dados privados no resumo. | A evidence final nao publica identificadores internos ou dados privados. |
| `proof_handoff` | `BK-MF8-16 -> BK-MF8-17` | `handoff` | `rg -n "Falhas para BK-MF8-17\|Handoff para BK-MF8-17\|falhou_por_produto\|bloqueado_por_ambiente_ou_ferramenta\|proof_e2e" docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` | raiz | 0 | `passou` | Marcadores de falhas, handoff, estado de falha de produto e blocker E2E presentes. | Sem dados privados no resumo. | O BK17 recebe falhas e bloqueios triados. |

## Cenarios negativos

| ID | Esperado | Resultado | Estado |
| --- | --- | --- | --- |
| `neg_comando_inexistente` | Comando inexistente ou sem runner aprovado nao pode ser marcado como sucesso. | `proof_e2e` ficou `TODO (BLOCKER)` e `bloqueado_por_ambiente_ou_ferramenta`. | `passou` |
| `neg_falha_sem_output` | Falhas ambientais devem ser separadas de falhas de produto. | Suite API falhou na sandbox por `listen EPERM` e passou fora da sandbox. | `passou` |
| `neg_e2e_sem_runner` | E2E sem comando aprovado deve bloquear honestamente. | Contratos BK15/BK16 rejeitam marcar `proof_e2e` como sucesso sem runner. | `passou` |

## Falhas para BK-MF8-17

Nao foram detetadas falhas de produto nos comandos executados. Nenhuma proof
ficou com estado `falhou_por_produto`.

## Bloqueios para BK-MF8-17

- `proof_e2e`: `TODO (BLOCKER)` ate existir comando browser/E2E aprovado para MF8.

## Handoff para BK-MF8-17

O `BK-MF8-17` deve manter `proof_e2e` como bloqueio de ferramenta ou substituir por
um runner browser aprovado. Como a suite API completa, build web, contratos focais,
smoke e planificacao passaram, nao ha correcoes de produto abertas a partir desta
execucao final.
