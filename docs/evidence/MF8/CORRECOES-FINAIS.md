# MF8 - Correcoes finais e reexecucao dos testes afetados

> **Nota de supersessão — 2026-07-11:** evidence histórica da execução de 2026-07-07. O estado atual, a bateria vigente e os blockers reais estão no [plano canónico da consulta OpenAI](../../planificacao/PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md). Em particular, contagens antigas, o fecho `sem_falhas_de_produto` e o blocker E2E abaixo não devem ser reutilizados como prova do estado atual sem reteste.

## Header

- `bk_id`: `BK-MF8-17`
- `requisito`: `RNF29`
- `source_evidence`: `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
- `estado_final`: `sem_falhas_de_produto`
- `data_execucao`: `2026-07-07`
- `implementation_root`: `real_dev`

## Resumo executivo

O `BK-MF8-17` consumiu o handoff do `BK-MF8-16` e confirmou que a bateria final
nao deixou falhas de produto com estado `falhou_por_produto`. Por isso, nao
houve correcao funcional de codigo a aplicar nesta etapa.

O fecho terminal materializa a evidence de `RNF29`, preserva o blocker
`proof_e2e` como `bloqueado_por_ambiente_ou_ferramenta` e valida que API,
frontend, planificacao, diff, contrato BK17 e privacidade continuam em estado
controlado.

## Falhas de produto corrigidas

| error_id | source_proof | causa_raiz | ficheiros_editados | teste_afetado | comando_antes | exit_antes | comando_depois | exit_depois | estado |
| --- | --- | --- | --- | --- | --- | ---: | --- | ---: | --- |
| `SEM-FALHAS-PRODUTO` | `proof_handoff` | `A bateria final nao registou estado falhou_por_produto.` | `-` | `npm --prefix real_dev/api test -- tests/mf8.final-fixes-contract.test.js` | `rg -n "falhou_por_produto" docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` | 0 | `npm --prefix real_dev/api test -- tests/mf8.final-fixes-contract.test.js` | 0 | `sem_falhas_de_produto` |

## Bloqueios preservados

| blocker_id | source_proof | tipo | motivo | impacto | proxima_acao |
| --- | --- | --- | --- | --- | --- |
| `BLK-MF8-17-E2E` | `proof_e2e` | `bloqueado_por_ambiente_ou_ferramenta` | `Sem comando E2E/browser aprovado em real_dev/web/package.json.` | `Cobertura P0 sem browser real.` | `Aprovar runner E2E ou manter blocker explicito na defesa.` |

## Provas de reexecucao

| proof_id | comando | diretoria | exit_code | output_resumido | privacy_check |
| --- | --- | --- | ---: | --- | --- |
| `proof_relatorio_final` | `rg -n "RNF29\|BK-MF8-17\|BK-MF8-16\|unit \\+ integration \\+ e2e" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/BACKLOG-MVP.md docs/planificacao/backlogs/MF-VIEWS.md docs/planificacao/sprints/PLANO-SPRINTS.md` | `raiz` | 0 | `Contrato RNF29, BK terminal e matriz P0 confirmados.` | `sem dados sensiveis` |
| `proof_matriz_falhas` | `rg -n "Falhas para BK-MF8-17\|Handoff para BK-MF8-17\|falhou_por_produto\|bloqueado_por_ambiente_ou_ferramenta\|proof_e2e" docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` | `raiz` | 0 | `Handoff BK16 encontrado; sem falhas de produto e com proof_e2e bloqueado.` | `sem dados sensiveis` |
| `proof_correcao_final` | `rg -n "BK-MF8-17\|RNF29\|Falhas de produto corrigidas\|Bloqueios preservados\|proof_reexecucao_afetada\|proof_fecho_mf8" docs/evidence/MF8/CORRECOES-FINAIS.md` | `raiz` | 0 | `Evidence terminal BK17 contem requisito, bloqueios, reexecucao e fecho.` | `sem dados sensiveis` |
| `proof_contrato_bk17` | `node --check real_dev/api/tests/evidence/bk-mf8-17.evidence-contract.js` | `raiz` | 0 | `Sintaxe do contrato BK17 valida.` | `sem dados sensiveis` |
| `proof_reexecucao_afetada` | `npm --prefix real_dev/api test -- tests/mf8.final-fixes-contract.test.js` | `raiz` | 0 | `1 ficheiro passou; 5 testes passaram.` | `sem dados sensiveis` |
| `proof_api` | `npm --prefix real_dev/api test` | `raiz` | 0 | `Fora da sandbox: 41 ficheiros passaram; 284 testes passaram.` | `resumo sem payloads privados` |
| `proof_web_build` | `npm --prefix real_dev/web run build` | `raiz` | 0 | `Vite compilou 87 modulos e gerou bundle de producao.` | `sem dados sensiveis` |
| `proof_planificacao` | `bash scripts/validate-planificacao.sh` | `raiz` | 0 | `overall_pass true; 44 RF, 31 RNF e 74 BKs/guias.` | `sem dados sensiveis` |
| `proof_diff` | `git diff --check` | `raiz` | 0 | `Sem output.` | `sem dados sensiveis` |
| `proof_e2e` | `TODO (BLOCKER)` | `raiz` | 1 | `Sem comando E2E/browser aprovado em real_dev/web/package.json.` | `sem dados sensiveis` |
| `proof_privacidade` | `rg -n "password[H]ash\|Set[-]Cookie\|Authori[z]ation\|Bear[e]r\|storage[K]ey\|consent[I]d\|/User[s]/\|/va[r]/" docs/evidence/MF8/CORRECOES-FINAIS.md docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md` | `raiz` | 1 | `Sem marcadores sensiveis nos artefactos de evidence MF8.` | `sem dados sensiveis` |
| `proof_fecho_mf8` | `rg -n "BK-MF8-17.*\\| - \\|" docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/BACKLOG-MVP.md` | `raiz` | 0 | `BK-MF8-17 confirmado como terminal da MF8.` | `sem dados sensiveis` |

## Negativos finais

| neg_id | esperado | resultado | estado |
| --- | --- | --- | --- |
| `neg_correcao_sem_teste_afetado` | Uma correcao real sem teste afetado deve falhar. | O contrato BK17 rejeita `affectedTests` vazio. | `passou` |
| `neg_e2e_sem_runner` | Um E2E sem runner aprovado nao pode ser marcado como sucesso. | O contrato BK17 exige `bloqueado_por_ambiente_ou_ferramenta`. | `passou` |
| `neg_output_sensivel` | Evidence com cookies, tokens, paths internos ou marcadores biometricos deve falhar. | O contrato BK17 rejeita marcadores sensiveis no resumo. | `passou` |
| `neg_fecho_terminal` | O BK terminal nao pode apontar para outro BK. | O contrato BK17 exige `nextBk = "-"`. | `passou` |

## Fecho da MF8

- `proof_fecho_mf8`: `BK-MF8-17` e terminal (`proximo_bk = "-"`).
- `decisao_final`: `MF8 fechada com blocker E2E explicito`.
- `riscos_restantes`: `Browser E2E depende de runner aprovado.`
- `correcoes_produto_abertas`: `0`
- `blockers_ambiente_ou_ferramenta`: `1`

## Handoff final

Nao existe proximo BK canonico nesta macrofase. A MF8 fica tecnicamente fechada
com os gates disponiveis validados e com o `proof_e2e` preservado como blocker
honesto, nao como sucesso artificial.
