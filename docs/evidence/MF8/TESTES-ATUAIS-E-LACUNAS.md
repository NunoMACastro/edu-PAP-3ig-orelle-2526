# TESTES-ATUAIS-E-LACUNAS - MF8 Orelle

## Header

- `doc_id`: `TESTES-ATUAIS-E-LACUNAS-MF8`
- `bk_id`: `BK-MF8-15`
- `macro`: `MF8`
- `requisito`: `RNF27`
- `proximo_bk`: `BK-MF8-16`
- `estado_global`: `preparado_para_execucao_final`
- `implementation_root`: `real_dev`

## Contrato canonico

- `CANONICO`: `RNF27` exige verificar os testes atuais e criar os testes em falta antes da bateria final.
- `CANONICO`: por prioridade `P0`, a bateria deve cobrir `unit + integration + e2e` e minimo de `3` negativos.
- `DERIVADO`: como nao existe comando E2E/browser aprovado em `real_dev/web/package.json`, `proof_e2e` fica `TODO (BLOCKER)` ate haver runner aprovado.

## Estados permitidos

- `preparado`: artefacto existente antes do BK15 e reutilizavel pelo fecho final.
- `criado_neste_bk`: artefacto criado para fechar a lacuna do BK15.
- `executavel`: comando existente e pronto para ser executado pelo BK16.
- `lacuna_controlada`: lacuna conhecida e registada sem fingir sucesso.

## Matriz de testes e lacunas

| proof_id | BK/RNF | camada | comando | estado | lacuna | negativo | risco | handoff |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `proof_test_env` | `BK-MF8-03 / RNF22` | `unit` | `npm --prefix real_dev/api test -- tests/mf8.test-env.contract.test.js` | `preparado` | Sem lacuna confirmada. | Ambiente fora de `NODE_ENV=test` deve falhar. | Sem ambiente isolado, a bateria final poderia tocar em dados errados. | `BK-MF8-16` deve anexar output do comando. |
| `proof_mockup_alignment` | `BK-MF8-14 / RNF26` | `smoke` | `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `preparado` | Sem lacuna confirmada. | Sem padroes de mockup, o smoke deve falhar. | Sem prova visual, o fecho final perde cobertura UI. | `BK-MF8-16` deve anexar output do comando. |
| `proof_mockup_evidence` | `BK-MF8-14 / RNF26` | `unit` | `node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js` | `preparado` | Sem lacuna confirmada. | Evidence sem screenshots deve falhar. | Evidence visual incompleta. | `BK-MF8-16` deve manter referencia visual no fecho. |
| `proof_final_contract` | `BK-MF8-15 / RNF27` | `unit` | `npm --prefix real_dev/api test -- tests/mf8.final-contracts.test.js` | `criado_neste_bk` | Faltava contrato executavel da matriz final. | Matriz sem `proof_e2e` deve falhar. | Avancar para BK16 sem inventario real. | `BK-MF8-16` consome esta matriz. |
| `proof_mf8_smoke` | `BK-MF8-15 / RNF27` | `smoke` | `node real_dev/web/scripts/check-mf8-final-smoke.mjs` | `criado_neste_bk` | Faltava smoke de artefactos minimos. | Ficheiro de matriz em falta deve falhar. | Bateria final sem artefactos minimos. | `BK-MF8-16` executa o smoke antes da bateria final. |
| `proof_api` | `MF0-MF8` | `integration` | `npm --prefix real_dev/api test` | `executavel` | Falha na sandbox pode ser ambiental por `listen EPERM`. | Falha real deve ser classificada como `falhou_por_produto`. | Regressao backend sem triagem. | `BK-MF8-16` deve anexar output e classificar ambiente/produto. |
| `proof_web_build` | `MF0-MF8` | `build` | `npm --prefix real_dev/web run build` | `executavel` | Sem lacuna confirmada. | Build falhado deve bloquear fecho. | UI nao compilavel. | `BK-MF8-16` deve anexar output do build. |
| `proof_e2e` | `MF8 / P0` | `e2e` | `TODO (BLOCKER)` | `lacuna_controlada` | Sem comando E2E/browser aprovado em `real_dev/web/package.json`. | Marcar E2E como `passou` sem runner deve falhar. | Cobertura P0 incompleta se o professor exigir browser real. | `BK-MF8-16` deve manter blocker ou substituir por comando aprovado. |

## Cenarios negativos obrigatorios

| negativo_id | esperado | resultado | estado |
| --- | --- | --- | --- |
| `neg_sem_proof_e2e` | Matriz sem `proof_e2e` falha no contrato. | Coberto por `mf8.final-contracts.test.js`. | `passou` |
| `neg_sem_negativos_minimos` | Matriz com menos de 3 negativos falha no contrato. | Coberto por `mf8.final-contracts.test.js`. | `passou` |
| `neg_output_sensivel` | Evidence com output sensivel falha no contrato. | Coberto por `mf8.final-contracts.test.js`. | `passou` |

## Handoff para BK-MF8-16

O `BK-MF8-16` deve executar a bateria final a partir desta matriz, anexar outputs objetivos e classificar cada proof como:

- `passou`;
- `falhou_por_produto`;
- `bloqueado_por_ambiente_ou_ferramenta`.

O `proof_e2e` fica `TODO (BLOCKER)` ate existir comando browser/E2E aprovado.
