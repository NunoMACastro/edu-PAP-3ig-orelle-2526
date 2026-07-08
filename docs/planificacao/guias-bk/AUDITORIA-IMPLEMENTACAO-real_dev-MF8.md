# Auditoria de implementacao real_dev - MF8

## 2026-07-07 - MF8 completa - auditar_implementacao fresh

### Resultado

- Estado: `AUDITADO_OK_COM_RESSALVA_E2E`
- Decisao operacional: `PASS_COM_RESSALVA_E2E`
- MF auditada: `MF8`
- BKs auditados: `BK-MF8-01` a `BK-MF8-17`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Docs canonicos/guias BK alterados: `nao`
- Relatorio tecnico actualizado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`
- Commits criados: `nao`

### Nota de escopo

Esta auditoria global foi executada a partir do prompt activo com `MF_ALVO=MF8`,
`BK_IDS=[]`, `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`,
`STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`,
`PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

Foram auditados `real_dev/api`, `real_dev/web`, `docs/evidence/MF8`, os guias
MF8 e os documentos canonicos de rastreabilidade. `apps/` foi mantido como
referencia publica dos guias, nao como raiz real de execucao. `real_dev/` esta
ignorado por `.gitignore`, comportamento esperado neste checkout.

O worktree ja estava sujo antes desta intervencao, com alteracoes locais em:

- `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`
- `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`
- `docs/evidence/MF8/CORRECOES-FINAIS.md`

Essas alteracoes foram preservadas. Nesta execucao foi acrescentada apenas esta
seccao global ao relatorio de auditoria.

### Estado por BK

| BK | RF/RNF | Estado | Evidencia principal |
| --- | --- | --- | --- |
| `BK-MF8-01` | `RNF19` | `AUDITADO_OK` | Estrutura MVC/modular em `real_dev/api/src`, contrato `mf8.modularidade.contract.test.js` e suite API completa. |
| `BK-MF8-02` | `RNF20` | `AUDITADO_OK` | `observability.service.js`, middlewares de requestId/metrica, teste `mf8.safe-logging.contract.test.js`. |
| `BK-MF8-03` | `RNF22` | `AUDITADO_OK` | `env.js` bloqueia ambiente de teste inseguro; `mf8.test-env.contract.test.js` cobre negativos. |
| `BK-MF8-04` | `RNF21` | `AUDITADO_OK` | `scripts/backup-daily.mjs` usa storage privado, dry-run e redaccao; `mf8.backup.contract.test.js` passa. |
| `BK-MF8-05` | `RNF23` | `AUDITADO_OK` | `recommendation-reason.service.js` gera motivos/fontes/limitacoes publicas e bloqueia claims clinicas. |
| `BK-MF8-06` | `RNF24` | `AUDITADO_OK` | `ai-fairness-guard.service.js` bloqueia genero, idade e tom de pele em motivos/fontes/texto publico. |
| `BK-MF8-07` | `RNF25` | `AUDITADO_OK` | Provider externo exige finalidade cosmetica, payload minimizado e `modelLearningAllowed=false`. |
| `BK-MF8-08` | `RF42` | `AUDITADO_OK` | Rotas/sessao guiada autenticadas, ownership no backend, UI `GuidedConsultationPage` e smoke MF8. |
| `BK-MF8-09` | `RF47`, `RNF30` | `AUDITADO_OK` | Historico IA minimizado, filtrado por utilizador autenticado, sem IDs internos no DTO publico. |
| `BK-MF8-10` | `RF43`, `RNF23` | `AUDITADO_OK` | Recomendacoes enriquecidas com contexto guiado seguro, boost limitado, explicabilidade e stock/restricoes. |
| `BK-MF8-11` | `RF45`, `RNF31` | `AUDITADO_OK` | Fila de revisao humana por consultor/admin, DTO minimizado, decisao auditada e role gates. |
| `BK-MF8-12` | `RF46` | `AUDITADO_OK` | Insights publicados visiveis apenas ao cliente dono, sem nota interna, actorId, userId ou audit trail. |
| `BK-MF8-13` | UI integrada | `AUDITADO_OK` | `AssistedConsultationHubPage`, role panels, smokes de UI e preservacao da autorizacao backend. |
| `BK-MF8-14` | `RNF26` | `AUDITADO_OK` | `mockup/` existe; gate `check-mf8-mockup-alignment.mjs` validou 6 ficheiros e 20 padroes. |
| `BK-MF8-15` | `RNF27` | `AUDITADO_OK_COM_RESSALVA_E2E` | Matriz `TESTES-ATUAIS-E-LACUNAS.md`, contrato/teste final e smoke final existem; `proof_e2e` fica blocker. |
| `BK-MF8-16` | `RNF28` | `AUDITADO_OK_COM_RESSALVA_E2E` | `EXECUCAO-FINAL-TESTES.md`, contrato/teste BK16 e bateria final existem; E2E real nao tem runner aprovado. |
| `BK-MF8-17` | `RNF29` | `AUDITADO_OK_COM_RESSALVA_E2E` | `CORRECOES-FINAIS.md`, contrato/teste BK17, sem falhas de produto e blocker E2E preservado. |

### Findings e blockers

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 0 | Sem findings abertos; P1 historicos de BK15/BK16/BK17 estao fechados nas secoes anteriores. |
| `P2` | 0 | Sem findings confirmados nesta passagem global. |
| `P3` | 1 | Ambiental: `npm --prefix real_dev/api test` falha na sandbox por `listen EPERM`, mas passa fora da sandbox. |

Blocker preservado:

- `proof_e2e`: nao existe runner browser/E2E aprovado em `real_dev/web/package.json`.
  A MF8 declara este ponto como `TODO (BLOCKER)` nos artefactos finais, em vez
  de o marcar como sucesso artificial. Isto deixa a implementacao auditada e
  testada por unit/integration/smoke/build, mas sem prova browser E2E real.

### Coerencia entre MFs

- `MF7 -> MF8`: preservada. A suite API completa passou fora da sandbox e a
  auditoria nao encontrou regressao em cookies HttpOnly, roles, consentimento,
  ownership, privacidade biometrica, provider IA, pagamentos ou endpoints.
- `MF8 interna`: preservada. Os BKs `BK-MF8-08` a `BK-MF8-13` formam o fluxo
  guiado cliente/consultor: sessao guiada, historico seguro, recomendacoes
  enriquecidas, revisao humana, insights do cliente e hub integrado.
- `BK-MF8-14 -> BK-MF8-17`: preservada com ressalva. Mockup, matriz de testes,
  execucao final e correcao final existem; apenas `proof_e2e` fica bloqueado
  por ausencia de runner browser aprovado.
- `MF8 -> MF seguinte`: nao existe `MF9` canonica neste checkout; `BK-MF8-17`
  e terminal.

### Validacoes executadas

| Comando / verificacao | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS_COM_NOTA` - worktree ja tinha alteracoes locais nos relatorios MF8 e `CORRECOES-FINAIS.md`; foram preservadas. |
| `git check-ignore -v real_dev real_dev/api real_dev/web ...` | `PASS_COM_NOTA` - `.gitignore:2:real_dev/` confirma que a raiz real esta ignorada como esperado. |
| `npm --prefix real_dev/api test` na sandbox | `FAIL_AMBIENTE` - `listen EPERM: operation not permitted 0.0.0.0`, com erros derivados de porta nula em Supertest. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` - `41` ficheiros e `284` testes passaram. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite compilou `87` modulos. |
| `node real_dev/web/scripts/check-mf8-guided-consultation-page.mjs` | `PASS` - pagina BK8 ligada a endpoints reais e sem storage inseguro. |
| `node real_dev/web/scripts/check-mf8-ai-history-page.mjs` | `PASS` - smoke frontend do historico IA. |
| `node real_dev/web/scripts/check-mf8-assisted-consultation-ui.mjs` | `PASS` - `8` ficheiros e `32` contratos. |
| `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` - `6` ficheiros e `20` padroes. |
| `node real_dev/web/scripts/check-mf8-final-smoke.mjs` | `PASS` - `4` artefactos e `18` contratos. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass=true`, `44` RF, `31` RNF, `74` BKs/guias. |
| Pesquisa estatica obrigatoria em `real_dev/api`, `real_dev/web` e `docs/evidence/MF8` | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como guards anti-storage, stubs/testes Stripe/PayPal/MBWay, segredos fake de teste, provider configurado por env, redaccao/observabilidade e texto defensivo contra treino externo. Sem finding novo. |
| Scan de marcadores sensiveis em `docs/evidence/MF8` e superfícies MF8 | `PASS_COM_RESIDUAIS_ESPERADOS` - artefactos de evidence nao expõem outputs reais sensiveis; hits restantes sao denylist, comentarios defensivos ou campos internos usados apenas no backend. |
| `git diff --check` | `PASS` - sem output. |
| `rg -n "[ \\t]+$" ...` nos relatorios/evidence MF8 alterados | `PASS` - sem trailing whitespace. |

### Validacoes nao executadas

- Browser E2E real: nao executado porque nao existe runner browser/E2E aprovado
  em `real_dev/web/package.json`.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.

### Alteracoes realizadas nesta execucao

- Actualizado apenas este relatorio tecnico com a seccao global
  `2026-07-07 - MF8 completa - auditar_implementacao fresh`.
- Nenhum ficheiro de implementacao, teste, evidence operacional, guia BK,
  matriz, backlog, prompt, `apps/` ou documento canonico foi alterado por esta
  execucao.
- Nenhum commit foi criado.

### Decisao

A MF8 fica `AUDITADO_OK_COM_RESSALVA_E2E`: todos os 17 BKs tem evidencia
objectiva em codigo, testes, smokes, build, planificacao ou artefactos finais.
Nao ha findings P0, P1 ou P2 abertos nesta passagem global.

A unica ressalva e o `proof_e2e` browser real, mantido como `TODO (BLOCKER)` por
ausencia de runner aprovado. A proxima accao recomendada e decidir se a PAP exige
um runner browser/E2E real; se sim, criar esse runner em escopo proprio e
reexecutar apenas os gates finais `BK-MF8-15` a `BK-MF8-17`.

## 2026-07-07 - BK-MF8-17 - reauditar_implementacao fresh

### Resultado

- Estado: `AUDITADO_OK_COM_BLOCKER_E2E_DECLARADO`
- Decisao operacional: `PASS_COM_RESSALVA_E2E`
- BK auditado: `BK-MF8-17`
- Macro-fase canonica: `MF8`
- RF/RNF principal: `RNF29`
- Modo executado: `auditar_implementacao`
- Implementacao/evidence alterada nesta execucao: `nao`
- Docs canonicos alterados: `nao`
- Relatorio actualizado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`
- Commits criados: `nao`

### Nota de escopo

Esta re-auditoria foi executada a partir do prompt activo com `MF_ALVO=MF8`,
`BK_IDS=[BK-MF8-17]`, `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`,
`STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PERMITIR_ALTERAR_DOCS=nao` e
`PERMITIR_COMMITS=nao`.

Foram auditados `real_dev/api`, `real_dev/web`, `docs/evidence/MF8`, os
documentos canonicos de rastreabilidade e os relatorios tecnicos existentes.
`apps/` foi mantido como referencia publica dos guias, nao como raiz real de
execucao. A pasta `real_dev/` continua ignorada por `.gitignore`, comportamento
esperado neste checkout.

### Achados reavaliados

| ID | Severidade | Estado actual | Evidencia actual |
| --- | --- | --- | --- |
| `ORELLE-MF8-BK17-P1-001` | P1 | `FECHADO` | `docs/evidence/MF8/CORRECOES-FINAIS.md` existe e contem `BK-MF8-17`, `RNF29`, `estado_final=sem_falhas_de_produto`, bloqueios preservados, proofs finais, negativos, privacidade e fecho terminal. |
| `ORELLE-MF8-BK17-P1-002` | P1 | `FECHADO` | `real_dev/api/tests/evidence/bk-mf8-17.evidence-contract.js` e `real_dev/api/tests/mf8.final-fixes-contract.test.js` existem; sintaxe e teste focal passaram. |
| `ORELLE-MF8-BK17-P3-003` | P3 | `NAO_BLOQUEANTE_AMBIENTAL` | `npm --prefix real_dev/api test` falha na sandbox por `listen EPERM`, mas passou fora da sandbox com `41` ficheiros e `284` testes. |

Resumo por severidade:

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 0 | Sem findings abertos; `2` findings anteriores fechados. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Ambiental, nao bloqueante quando repetido fora da sandbox. |

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| `RNF29` | `docs/RNF.md` define que erros encontrados nos testes finais devem ser corrigidos e revalidados. |
| Sequencia canonica | `MATRIZ-CANONICA-BK.md` e `BACKLOG-MVP.md` confirmam `BK-MF8-17` como `P0`, dependente de `BK-MF8-16`, com `proximo_bk = "-"`. |
| Regra P0 | `PLANO-SPRINTS.md` exige `unit + integration + e2e` e minimo de `3` negativos para BKs P0. |
| Handoff BK16 | `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` declara ausencia de proofs `falhou_por_produto` e preserva `proof_e2e` como `TODO (BLOCKER)`. |
| Evidence terminal BK17 | `docs/evidence/MF8/CORRECOES-FINAIS.md` materializa `sem_falhas_de_produto`, `proof_reexecucao_afetada`, `proof_privacidade`, `proof_fecho_mf8`, `4` negativos e `0` correcoes de produto abertas. |
| Contrato/teste BK17 | O contrato exige `RNF29`, source/final evidence, `11` proofs obrigatorias, minimo de `3` negativos, privacy review aprovada e `closure.nextBk = "-"`; o teste cobre caminho positivo e negativos de correcao sem teste afetado, E2E falso, output sensivel e fecho nao terminal. |
| Runner E2E/browser | `real_dev/web/package.json` nao expoe runner browser/E2E aprovado. O `proof_e2e` permanece blocker honesto, nao sucesso artificial. |

### Coerencia entre MFs e BKs vizinhos

- `MF7 -> MF8`: preservada. A suite API completa passou fora da sandbox e a
  re-auditoria nao encontrou alteracoes que enfraquecam cookies, roles,
  consentimento, ownership, privacidade biometrica, provider IA, pagamentos ou
  endpoints.
- `BK-MF8-15 -> BK-MF8-16`: preservado. A matriz final, contrato BK16, teste
  focal BK16 e smoke de artefactos continuam executaveis.
- `BK-MF8-16 -> BK-MF8-17`: entregue. O BK17 consome o handoff do BK16, nao
  encontra falhas `falhou_por_produto` e fecha a MF8 com blocker E2E declarado.
- `BK-MF8-17 -> MF seguinte`: terminal. Nao existe `BK-MF9` canonico neste
  checkout; qualquer `BK-MF9-01` presente nos testes e apenas negativo de
  contrato.

### Validacoes executadas nesta re-auditoria

| Comando / verificacao | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS_COM_NOTA` - havia alteracoes da correcao anterior em relatorios e `docs/evidence/MF8/CORRECOES-FINAIS.md`; nao foram revertidas. |
| `git check-ignore -v real_dev real_dev/api real_dev/web ...` | `PASS_COM_NOTA` - `real_dev/` e os testes BK17 estao ignorados por `.gitignore`, esperado neste fluxo. |
| `rg -n "RNF29\|BK-MF8-17\|BK-MF8-16\|unit \\+ integration \\+ e2e" ...` | `PASS` - confirmou requisito, dependencias, terminalidade e regra P0. |
| `rg -n "BK-MF8-17\|RNF29\|Falhas de produto corrigidas\|Bloqueios preservados\|proof_reexecucao_afetada\|proof_fecho_mf8" docs/evidence/MF8/CORRECOES-FINAIS.md` | `PASS` |
| `node --check real_dev/api/tests/evidence/bk-mf8-17.evidence-contract.js` | `PASS` |
| `node --check real_dev/api/tests/mf8.final-fixes-contract.test.js` | `PASS` |
| `npm --prefix real_dev/api test -- tests/mf8.final-fixes-contract.test.js` | `PASS` - `1` ficheiro e `5` testes. |
| `node --check real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js` | `PASS` |
| `npm --prefix real_dev/api test -- tests/mf8.final-execution-contract.test.js` | `PASS` - `1` ficheiro e `5` testes. |
| `node real_dev/web/scripts/check-mf8-final-smoke.mjs` | `PASS` - `BK-MF8-15 fecho de testes validado: 4 artefactos e 18 contratos.` |
| `npm --prefix real_dev/web run build` | `PASS` - Vite compilou `87` modulos. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, `44` RF, `31` RNF, `74` BKs/guias. |
| `npm --prefix real_dev/api test` na sandbox | `FAIL_AMBIENTE` - `listen EPERM: operation not permitted 0.0.0.0` e erros derivados de porta nula em Supertest. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` - `41` ficheiros e `284` testes passaram. |
| Check de privacidade da evidence MF8 | `PASS` - sem hits para marcadores sensiveis nos artefactos de evidence MF8. |
| Pesquisa estatica obrigatoria em `real_dev/api`, `real_dev/web` e `docs/evidence/MF8` | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como guards anti-storage, pagamentos documentados/testes Stripe/PayPal/MBWay, segredos fake de teste, validacao de segredo de sessao, provider IA controlado, texto defensivo contra treino externo e redaccao/observabilidade. Sem finding novo. |
| `git diff --check` | `PASS` - sem output. |

### Validacoes nao executadas

- Browser E2E real: nao executado porque nao existe runner browser/E2E aprovado
  em `real_dev/web/package.json`; o blocker esta explicitamente registado em
  `EXECUCAO-FINAL-TESTES.md` e `CORRECOES-FINAIS.md`.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.

### Alteracoes realizadas nesta execucao

- Actualizado apenas este relatorio tecnico com a re-auditoria fresca de
  `BK-MF8-17`.
- Nenhum ficheiro de implementacao, teste, evidence operacional, guia BK,
  matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Decisao

`BK-MF8-17` fica `AUDITADO_OK_COM_BLOCKER_E2E_DECLARADO` e operacionalmente
`PASS_COM_RESSALVA_E2E`. Nao ha findings P0, P1 ou P2 abertos. O unico residual
e o `proof_e2e`, corretamente mantido como `TODO (BLOCKER)` por falta de runner
browser/E2E aprovado.

## 2026-07-07 - BK-MF8-17 - reauditar_implementacao pos-correcao P1

### Resultado

- Estado: `AUDITADO_OK_COM_BLOCKER_E2E_DECLARADO`
- Decisao operacional: `PASS_COM_RESSALVA_E2E`
- BK auditado: `BK-MF8-17`
- Macro-fase canonica: `MF8`
- RF/RNF principal: `RNF29`
- Modo executado: `corrigir_auditoria` + re-auditoria de implementacao
- Implementacao/evidence alterada nesta execucao: `sim`
- Docs canonicos alterados: `nao`
- Relatorios actualizados:
  - `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`
  - `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

Esta re-auditoria foi executada apos corrigir os P1 abertos para `BK-MF8-17`,
mantendo `IMPLEMENTATION_ROOT=real_dev`, `STRICT_SCOPE=true`, `RUN_COMMANDS=true`
e `CHECK_MF_COHERENCE=true`. Foram alterados apenas artefactos de
evidence/contrato/teste em `docs/evidence/MF8` e `real_dev/api/tests`, mais os
relatorios tecnicos de auditoria/correcao.

Nao foram alterados guias BK, matriz canonica, backlog, prompts, `apps/`,
documentos canonicos, endpoints, services, DTOs, models, middleware, clientes
API ou regras de negocio existentes. O guia publico continua a usar caminhos
`apps/api` e `apps/web`; os comandos reais foram mapeados para `real_dev/api`
e `real_dev/web`.

### Achados reavaliados

| ID | Severidade | Estado actual | Evidencia actual |
| --- | --- | --- | --- |
| `ORELLE-MF8-BK17-P1-001` | P1 | `FECHADO` | Existe `docs/evidence/MF8/CORRECOES-FINAIS.md`, com `estado_final=sem_falhas_de_produto`, blocker `proof_e2e` preservado, provas finais, negativos, privacidade e fecho terminal da MF8. |
| `ORELLE-MF8-BK17-P1-002` | P1 | `FECHADO` | Existem `real_dev/api/tests/evidence/bk-mf8-17.evidence-contract.js` e `real_dev/api/tests/mf8.final-fixes-contract.test.js`; sintaxe e Vitest focal passaram com `5` testes. |
| `ORELLE-MF8-BK17-P3-003` | P3 | `NAO_BLOQUEANTE_AMBIENTAL` | A falha `listen EPERM` continua classificada como sandbox/tooling; a suite API completa passou fora da sandbox com `41` ficheiros e `284` testes. |

Resumo por severidade:

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 2 | Fechados nesta correcao/re-auditoria. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Ambiental, nao bloqueante quando repetido fora da sandbox. |

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF29` | `docs/RNF.md` define que erros encontrados nos testes finais devem ser corrigidos e revalidados; `MATRIZ-CANONICA-BK.md` e `BACKLOG-MVP.md` confirmam `BK-MF8-17` como terminal da MF8. |
| Handoff do `BK-MF8-16` | `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` existe, declara ausencia de falhas `falhou_por_produto` e preserva `proof_e2e` como `TODO (BLOCKER)`. |
| Artefacto terminal BK17 | `docs/evidence/MF8/CORRECOES-FINAIS.md` existe e regista `sem_falhas_de_produto`, bloqueios preservados, reexecucao afetada, gates finais, privacidade e fecho `proximo_bk = "-"`. |
| Contrato BK17 | `real_dev/api/tests/evidence/bk-mf8-17.evidence-contract.js` valida `RNF29`, proofs obrigatorias, minimo de `3` negativos P0, privacy review e terminalidade. |
| Teste BK17 | `real_dev/api/tests/mf8.final-fixes-contract.test.js` passou com `5` testes: caminho positivo, correcao sem teste afetado, E2E falso, output sensivel e fecho nao terminal. |
| Runner E2E/browser | `real_dev/web/package.json` continua sem runner browser/E2E aprovado. Por isso `proof_e2e` permanece `TODO (BLOCKER)`, nao `PASS`. |

### Coerencia entre MFs e BKs vizinhos

- `MF7 -> MF8`: preservada. A suite API completa passou fora da sandbox e esta
  correcao nao alterou autenticacao, cookies, roles, consentimento, ownership,
  privacidade biometrica, provider IA, pagamentos ou endpoints.
- `BK-MF8-16 -> BK-MF8-17`: entregue. O BK17 consome o handoff do BK16, fecha
  a evidence terminal e conserva o blocker E2E como bloqueio ambiental.
- `BK-MF8-17 -> MF seguinte`: terminal. A matriz e o backlog terminam em
  `BK-MF8-17`; nao existe `BK-MF9` canonico neste checkout.

### Validacoes executadas nesta re-auditoria

| Comando / verificacao | Resultado |
| --- | --- |
| `node --check real_dev/api/tests/evidence/bk-mf8-17.evidence-contract.js` | `PASS` |
| `node --check real_dev/api/tests/mf8.final-fixes-contract.test.js` | `PASS` |
| `npm --prefix real_dev/api test -- tests/mf8.final-fixes-contract.test.js` | `PASS` - `1` ficheiro e `5` testes. |
| `rg -n "BK-MF8-17\|RNF29\|Falhas de produto corrigidas\|Bloqueios preservados\|proof_reexecucao_afetada\|proof_fecho_mf8" docs/evidence/MF8/CORRECOES-FINAIS.md` | `PASS` |
| Check de privacidade da evidence MF8 | `PASS` - sem hits e `rg` com exit code `1`, conforme esperado para ausencia de marcadores. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com `87` modulos transformados. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, `44` RF, `31` RNF, `74` BKs/guias. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` - `41` ficheiros e `284` testes passaram. |
| Pesquisa estatica focada nos artefactos BK17 novos | `PASS_COM_RESIDUAIS_ESPERADOS` - hits apenas no denylist/negativo de teste; sem exposicao real em evidence. |
| `git diff --check` | `PASS` - sem output. |

### Validacoes nao executadas

- Browser E2E real: nao executado porque nao existe runner browser/E2E aprovado
  em `real_dev/web/package.json`; o blocker herdado de BK16 continua honesto.
- Commits, push ou PR: nao executados, conforme permissao anterior de
  `PERMITIR_COMMITS=nao`.

### Alteracoes realizadas nesta execucao

- Criado `docs/evidence/MF8/CORRECOES-FINAIS.md`.
- Criado `real_dev/api/tests/evidence/bk-mf8-17.evidence-contract.js`.
- Criado `real_dev/api/tests/mf8.final-fixes-contract.test.js`.
- Actualizados este relatorio e
  `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`.
- Nenhum commit foi criado.

### Decisao

`BK-MF8-17` fica `AUDITADO_OK_COM_BLOCKER_E2E_DECLARADO` e operacionalmente
`PASS_COM_RESSALVA_E2E`: os findings P1 foram fechados com artefacto terminal,
contrato executavel e teste focal; o unico residual e o `proof_e2e`, mantido
como blocker ambiental por ausencia de runner browser aprovado.

## 2026-07-07 - BK-MF8-17 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_COM_FINDINGS`
- Decisao operacional: `BLOQUEADO_POR_CONTRATO`
- BK auditado: `BK-MF8-17`
- Macro-fase canonica: `MF8`
- RF/RNF principal: `RNF29`
- Modo executado: `auditar_implementacao`
- Implementacao/evidence alterada nesta execucao: `nao`
- Docs canonicos alterados: `nao`
- Relatorio actualizado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`,
`RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`,
`PROFUNDIDADE_COERENCIA=vizinhas`, `PERMITIR_ALTERAR_DOCS=nao` e
`PERMITIR_COMMITS=nao`.

O guia publico do BK usa caminhos `apps/api` e `apps/web`; nesta auditoria os
contratos foram mapeados para `real_dev/api` e `real_dev/web`, mantendo
`docs/evidence/MF8` como caminho documental publico exigido pelos BKs. Nao
foram alterados codigo, testes, guias BK, matriz, backlog, prompts, `apps/` ou
documentos canonicos. Apenas este relatorio tecnico foi actualizado, conforme
`OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| `ORELLE-MF8-BK17-P1-001` | P1 | `ABERTO` | Falta o artefacto terminal `docs/evidence/MF8/CORRECOES-FINAIS.md`. O handoff do `BK-MF8-16` existe e declara que nao houve falhas de produto, mas o `BK-MF8-17` exige sempre evidence final propria com `sem_falhas_de_produto` ou correcoes, bloqueios preservados, provas de reexecucao e fecho da MF8. | `RNF29` fica sem registo final auditavel. A MF8 nao deve ser marcada como fechada para defesa porque o blocker `proof_e2e` e a ausencia de falhas de produto ainda nao foram transportados para o artefacto terminal. | Em modo `implementar` ou `corrigir_auditoria`, criar `CORRECOES-FINAIS.md` a partir de `EXECUCAO-FINAL-TESTES.md`, usando estado `sem_falhas_de_produto`, preservando `proof_e2e` como `TODO (BLOCKER)` e registando gates finais/privacidade. |
| `ORELLE-MF8-BK17-P1-002` | P1 | `ABERTO` | Faltam `real_dev/api/tests/evidence/bk-mf8-17.evidence-contract.js` e `real_dev/api/tests/mf8.final-fixes-contract.test.js`. | O contrato executavel de `RNF29` nao existe; por isso nao ha prova automatica de positivos, minimo de `3` negativos P0, privacy check e fecho terminal sem proximo BK. | Implementar o contrato e o teste focal mapeados para `real_dev/api`, depois executar `node --check` e `npm --prefix real_dev/api test -- tests/mf8.final-fixes-contract.test.js`. |
| `ORELLE-MF8-BK17-P3-003` | P3 | `NAO_BLOQUEANTE_AMBIENTAL` | `npm --prefix real_dev/api test` falhou na sandbox com `listen EPERM: operation not permitted 0.0.0.0` e erros derivados de porta nula em Supertest. A mesma suite passou fora da sandbox. | Ambiental. Nao e regressao de produto nem justifica alteracao de codigo. | Continuar a repetir suites HTTP/Supertest fora da sandbox quando o erro for `listen EPERM`, registando ambos os resultados. |

Resumo por severidade:

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 2 | Abertos: artefacto final BK17 ausente e contrato/teste BK17 ausentes. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Ambiental, nao bloqueante quando repetido fora da sandbox. |

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF29` | `docs/RNF.md` define que os erros encontrados nos testes finais devem ser corrigidos e revalidados. `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` e `BACKLOG-MVP.md` confirmam `BK-MF8-17` como `P0`, dependente de `BK-MF8-16`, com `proximo_bk` igual a `-`. |
| Matriz minima P0 | `docs/planificacao/sprints/PLANO-SPRINTS.md` exige `unit + integration + e2e` e minimo de `3` negativos para BKs `P0`. |
| Handoff do `BK-MF8-16` | `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` existe, contem `Falhas para BK-MF8-17`, declara que nao houve estado `falhou_por_produto` e preserva `proof_e2e` como `TODO (BLOCKER)` por falta de runner browser/E2E aprovado. |
| Artefacto terminal BK17 | Verificacao de presenca devolveu `MISSING docs/evidence/MF8/CORRECOES-FINAIS.md`. O comando `rg -n ... docs/evidence/MF8/CORRECOES-FINAIS.md` falhou com `No such file or directory`. |
| Contrato/teste BK17 | Verificacao de presenca devolveu `MISSING real_dev/api/tests/evidence/bk-mf8-17.evidence-contract.js` e `MISSING real_dev/api/tests/mf8.final-fixes-contract.test.js`. `node --check` falhou com `MODULE_NOT_FOUND`; o Vitest focal falhou com `No test files found`. |
| Dependencia BK16 | `node --check real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js`, `npm --prefix real_dev/api test -- tests/mf8.final-execution-contract.test.js` e `node real_dev/web/scripts/check-mf8-final-smoke.mjs` passaram. |
| Scripts reais disponiveis | `real_dev/api/package.json` expoe `test` e `backup:daily`; `real_dev/web/package.json` expoe `build` e smokes MF2/MF5/MF6/MF7/MF8, mas nao contem runner browser/E2E aprovado. |

### Coerencia entre MFs e BKs vizinhos

- `MF7 -> MF8`: preservada. A suite API completa passou fora da sandbox e esta
  auditoria nao alterou cookies, roles, consentimento, ownership, privacidade
  biometrica, provider IA, pagamentos ou endpoints.
- `BK-MF8-15 -> BK-MF8-16`: preservado. Existem matriz/evidence BK15, contrato,
  teste focal e smoke final; o smoke final passou.
- `BK-MF8-16 -> BK-MF8-17`: parcialmente entregue. O BK16 entrega handoff
  objectivo, sem falhas `falhou_por_produto`, mas o BK17 ainda nao materializou
  o registo terminal de correcoes/bloqueios.
- `BK-MF8-17 -> MF seguinte`: terminal. A matriz e o backlog terminam em
  `BK-MF8-17`; nao existe `BK-MF9` canonico neste checkout.

### Validacoes executadas nesta auditoria

| Comando / verificacao | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS` - sem output antes da auditoria. |
| `git check-ignore -v real_dev real_dev/api real_dev/web docs/evidence/MF8` | `PASS_COM_NOTA` - `real_dev/` esta ignorado por `.gitignore`; `docs/evidence/MF8` nao esta ignorado. |
| `rg -n "RNF29\|BK-MF8-17\|BK-MF8-16\|unit \\+ integration \\+ e2e" ...` | `PASS` - confirmou `RNF29`, cadeia `BK-MF8-16 -> BK-MF8-17`, terminalidade do BK17 e regra P0. |
| `rg -n "Falhas para BK-MF8-17\|Handoff para BK-MF8-17\|falhou_por_produto\|bloqueado_por_ambiente_ou_ferramenta\|bloqueado_por_contrato\|proof_e2e" docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` | `PASS` - handoff BK16 encontrado, sem falhas de produto e com `proof_e2e` bloqueado. |
| Verificacao de presenca de `CORRECOES-FINAIS.md`, contrato e teste BK17 | `FAIL_CONTRATO` - os 3 caminhos esperados devolveram `MISSING`. |
| `rg -n "BK-MF8-17\|RNF29\|Falhas de produto corrigidas\|Bloqueios preservados\|proof_reexecucao_afetada\|proof_fecho_mf8" docs/evidence/MF8/CORRECOES-FINAIS.md` | `FAIL_CONTRATO` - ficheiro inexistente. |
| `node --check real_dev/api/tests/evidence/bk-mf8-17.evidence-contract.js` | `FAIL_CONTRATO` - `MODULE_NOT_FOUND`. |
| `npm --prefix real_dev/api test -- tests/mf8.final-fixes-contract.test.js` | `FAIL_CONTRATO` - `No test files found`. |
| `node --check real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js` | `PASS` |
| `npm --prefix real_dev/api test -- tests/mf8.final-execution-contract.test.js` | `PASS` - `1` ficheiro e `5` testes. |
| `node real_dev/web/scripts/check-mf8-final-smoke.mjs` | `PASS` - `BK-MF8-15 fecho de testes validado: 4 artefactos e 18 contratos.` |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com `87` modulos transformados. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, `44` RF, `31` RNF, `74` BKs/guias. |
| `npm --prefix real_dev/api test` na sandbox | `FAIL_AMBIENTE` - `listen EPERM: operation not permitted 0.0.0.0` e erros derivados de porta nula em Supertest. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` - `40` ficheiros e `279` testes passaram. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/web/src`, `real_dev/web/scripts` e `docs/evidence` | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como checks anti-`localStorage`/`sessionStorage`, stubs/testes Stripe/PayPal/MBWay, segredos fake de teste, provider Stripe por env, validacoes de segredo de sessao, strings defensivas contra treino externo e observabilidade/redaccao. Sem finding novo de seguranca, privacidade, biometria, IA ou dominio externo. |
| Scan de privacidade em `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` e `TESTES-ATUAIS-E-LACUNAS.md` | `PASS` - sem ocorrencias de `passwordHash`, `Set-Cookie`, `Authorization`, `Bearer`, `storageKey`, `consentId`, `/Users/` ou `/var/`. |
| `git diff --check` | `PASS` - sem output. |

### Validacoes nao executadas

- `node --check real_dev/api/tests/evidence/bk-mf8-17.evidence-contract.js` com
  resultado positivo: nao executavel porque o ficheiro nao existe.
- `npm --prefix real_dev/api test -- tests/mf8.final-fixes-contract.test.js`
  com resultado positivo: nao executavel porque o teste nao existe.
- Browser E2E real: nao executado porque nao existe runner browser/E2E aprovado
  em `real_dev/web/package.json`; o blocker herdado de BK16 continua honesto.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-17`.
- Nenhum ficheiro de implementacao, teste, evidence operacional, guia BK,
  matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Decisao

`BK-MF8-17` fica `AUDITADO_COM_FINDINGS` e operacionalmente
`BLOQUEADO_POR_CONTRATO`: o handoff do `BK-MF8-16` existe e nao ha falhas de
produto abertas, mas `RNF29` ainda nao tem o artefacto terminal
`CORRECOES-FINAIS.md`, nem contrato/teste BK17 que provem reexecucao afetada,
negativos P0, privacidade e fecho terminal da MF8.

Proxima accao recomendada: executar `implementar` ou `corrigir_auditoria`
estritamente para `BK-MF8-17`, criando `CORRECOES-FINAIS.md`,
`real_dev/api/tests/evidence/bk-mf8-17.evidence-contract.js` e
`real_dev/api/tests/mf8.final-fixes-contract.test.js`, preservando `proof_e2e`
como blocker enquanto nao houver runner browser aprovado.

## 2026-07-07 - BK-MF8-15/BK-MF8-16 - reauditar_implementacao pos-correcao P1

### Resultado

- Estado: `AUDITADO_OK_COM_BLOCKER_E2E_DECLARADO`
- Decisao operacional: `PASS_COM_RESSALVA_E2E`
- BKs auditados: `BK-MF8-15`, `BK-MF8-16`
- Macro-fase canonica: `MF8`
- RF/RNF principais: `RNF27`, `RNF28`
- Modo executado: `corrigir_auditoria` + re-auditoria de implementacao
- Implementacao/evidence alterada nesta execucao: `sim`
- Docs canonicos alterados: `nao`
- Relatorio actualizado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

Esta re-auditoria foi executada apos corrigir os P1 abertos para `BK-MF8-15`
e `BK-MF8-16`. Foram alterados apenas artefactos de evidence/contrato/teste
em `docs/evidence/MF8`, `real_dev/api/tests` e `real_dev/web/scripts`, mais
este relatorio tecnico e o relatorio de correcao. Nao foram alterados guias BK,
matriz canonica, backlog, prompts, `apps/` nem documentos canonicos.

O guia publico usa caminhos `apps/api` e `apps/web`; nesta execucao os comandos
foram mapeados para `real_dev/api` e `real_dev/web`, mantendo `docs/evidence/MF8`
como caminho documental publico exigido pelos BKs.

### Achados reavaliados

| ID | Severidade | Estado actual | Evidencia actual |
| --- | --- | --- | --- |
| `ORELLE-MF8-BK15-P1-001` | P1 | `FECHADO` | Existem `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`, `real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js`, `real_dev/api/tests/mf8.final-contracts.test.js` e `real_dev/web/scripts/check-mf8-final-smoke.mjs`; sintaxe, teste focal e smoke passaram. |
| `ORELLE-MF8-BK16-P1-001` | P1 | `FECHADO` | O `BK-MF8-16` consome agora o handoff executavel do `BK-MF8-15`; a matriz contem `proof_api`, `proof_web_build`, `proof_mf8_smoke`, `proof_e2e` e `TODO (BLOCKER)`. |
| `ORELLE-MF8-BK16-P1-002` | P1 | `FECHADO` | Existem `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`, `real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js` e `real_dev/api/tests/mf8.final-execution-contract.test.js`; a evidence final tem `14` proofs, `3` negativos, privacy check e handoff para `BK-MF8-17`. |
| `ORELLE-MF8-BK16-P3-003` | P3 | `NAO_BLOQUEANTE_AMBIENTAL` | A suite API continua a falhar na sandbox por `listen EPERM`, mas passou fora da sandbox com `40` ficheiros e `279` testes. |

Resumo por severidade:

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 3 | Fechados nesta correcao/re-auditoria. |
| `P2` | 0 | Sem findings confirmados para BK15/BK16. |
| `P3` | 1 | Ambiental, nao bloqueante quando repetido fora da sandbox. |

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF27`/`RNF28` | `docs/RNF.md` define verificacao/criacao de testes em falta e execucao final com evidencias objetivas; `PLANO-SPRINTS.md` exige para P0 `unit + integration + e2e` e minimo de `3` negativos. |
| Handoff BK15 | `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md` liga `BK-MF8-15` a `RNF27`, lista provas por camada, inclui `3` negativos e declara `proof_e2e` como `lacuna_controlada`. |
| Contrato BK15 | `real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js` valida BK, requisito, proofs, camadas, negativos e ausencia de marcadores sensiveis no resumo. |
| Teste BK15 | `real_dev/api/tests/mf8.final-contracts.test.js` passou com `5` testes, incluindo negativos de proof ausente, E2E sem runner marcado como sucesso, negativos insuficientes e output sensivel. |
| Smoke BK15 | `real_dev/web/scripts/check-mf8-final-smoke.mjs` passou e validou `4` artefactos e `18` contratos. |
| Evidence BK16 | `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` contem comandos, diretorias, camadas, exit codes, estados, output resumido, privacy check, impacto, negativos, falhas vazias e blocker E2E. |
| Contrato BK16 | `real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js` valida `14` proofs obrigatorias, camadas, estados permitidos, minimo de `3` negativos, `proof_e2e` e handoff `BK-MF8-17`. |
| Teste BK16 | `real_dev/api/tests/mf8.final-execution-contract.test.js` passou com `5` testes, incluindo negativos de proof ausente, E2E sem runner marcado como sucesso, output sensivel e handoff errado. |
| Runner E2E/browser | `real_dev/web/package.json` tem scripts de build e smokes estaticos, mas nao contem runner browser/E2E aprovado. Por isso `proof_e2e` permanece `TODO (BLOCKER)`. |

### Coerencia entre MFs e BKs vizinhos

- `MF7 -> MF8`: preservada. A suite API completa passou fora da sandbox e a
  correcao nao altera cookies, roles, consentimento, ownership, biometria,
  provider IA, pagamentos ou endpoints.
- `BK-MF8-14 -> BK-MF8-15`: preservado. A matriz BK15 referencia os comandos e
  artefactos de mockup/evidence ja existentes sem alterar o contrato visual.
- `BK-MF8-15 -> BK-MF8-16`: entregue. O BK16 tem agora matriz, contrato, teste
  e smoke herdados para executar a bateria final.
- `BK-MF8-16 -> BK-MF8-17`: entregue com ressalva. A evidence final declara que
  nao houve falhas de produto e passa apenas `proof_e2e` como blocker de
  ferramenta ate existir runner aprovado.

### Validacoes executadas nesta re-auditoria

| Comando / verificacao | Resultado |
| --- | --- |
| `node --check real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js` | `PASS` |
| `node --check real_dev/api/tests/mf8.final-contracts.test.js` | `PASS` |
| `node --check real_dev/web/scripts/check-mf8-final-smoke.mjs` | `PASS` |
| `node --check real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js` | `PASS` |
| `node --check real_dev/api/tests/mf8.final-execution-contract.test.js` | `PASS` |
| `npm --prefix real_dev/api test -- tests/mf8.final-contracts.test.js` | `PASS` - `1` ficheiro e `5` testes. |
| `node real_dev/web/scripts/check-mf8-final-smoke.mjs` | `PASS` - `BK-MF8-15 fecho de testes validado: 4 artefactos e 18 contratos.` |
| `npm --prefix real_dev/api test -- tests/mf8.final-execution-contract.test.js` | `PASS` - `1` ficheiro e `5` testes. |
| `rg -n "RNF28\|BK-MF8-16\|BK-MF8-17\|unit \\+ integration \\+ e2e" ...` | `PASS` |
| `rg -n "proof_api\|proof_web_build\|proof_mf8_smoke\|proof_e2e\|TODO \\(BLOCKER\\)" docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md` | `PASS` |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com `87` modulos transformados. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, `44` RF, `31` RNF, `74` BKs/guias. |
| `npm --prefix real_dev/api test` na sandbox | `FAIL_AMBIENTE` - `listen EPERM: operation not permitted 0.0.0.0`. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` - `40` ficheiros e `279` testes passaram. |
| `git diff --check` | `PASS` - sem output. |
| Check de privacidade da evidence final | `PASS` - sem marcadores sensiveis na evidence final. |
| `rg -n "proof_api\|proof_web_build\|proof_e2e\|falhou_por_produto\|bloqueado_por_ambiente_ou_ferramenta\|Handoff para BK-MF8-17" docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` | `PASS` |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/web/src`, `real_dev/web/scripts` e `docs/evidence` | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como checks anti-storage, stubs/testes de pagamentos, segredos fake de teste, provider Stripe por env, validacoes de segredo de sessao, strings defensivas contra treino externo e observabilidade/redaccao. |
| `rg -nP "[^\\x00-\\x7F]" ...` nos artefactos novos | `PASS` |
| `rg -n "[ \\t]+$" ...` nos artefactos novos | `PASS` |

### Validacoes nao executadas

- Browser E2E real: nao executado porque nao existe runner browser/E2E
  aprovado em `real_dev/web/package.json`. O estado foi registado como
  `TODO (BLOCKER)` em `proof_e2e`, nao como sucesso.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.

### Decisao

`BK-MF8-15` e `BK-MF8-16` ficam re-auditados como
`AUDITADO_OK_COM_BLOCKER_E2E_DECLARADO`. Os P1 abertos foram corrigidos: o
BK15 tem matriz, contrato, teste e smoke; o BK16 tem evidence final, contrato,
teste e handoff para `BK-MF8-17`.

A unica ressalva operacional e `proof_e2e`: nao ha comando browser/E2E
aprovado no projeto, por isso a evidence final mantem `TODO (BLOCKER)` de forma
honesta. Isto nao reabre P1 porque a lacuna esta documentada, testada e
classificada como bloqueio de ferramenta.

## 2026-07-07 - BK-MF8-16 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_COM_FINDINGS`
- Decisao operacional: `BLOQUEADO_POR_CONTRATO`
- BK auditado: `BK-MF8-16`
- Macro-fase canonica: `MF8`
- RF/RNF principal: `RNF28`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com
`IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`,
`CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`,
`PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O guia publico do BK usa caminhos `apps/api`, `apps/web` e
`docs/evidence/MF8`; nesta execucao esses contratos foram mapeados para
`real_dev/api` e `real_dev/web`, preservando `docs/evidence/MF8` quando o
proprio BK exige evidence documental. Nao foram alterados codigo, guias BK,
matriz, backlog, prompts, `apps/` nem documentos canonicos. Apenas este
relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK16-P1-001 | P1 | `ABERTO` / `BLOQUEADO_POR_CONTRATO` | O `BK-MF8-16` depende do handoff executavel do `BK-MF8-15`, mas faltam `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`, `real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js`, `real_dev/api/tests/mf8.final-contracts.test.js` e `real_dev/web/scripts/check-mf8-final-smoke.mjs`. | A bateria final nao tem matriz/comandos herdados para executar. O BK16 nao deve criar uma bateria paralela nem fingir sucesso; fica bloqueado antes da execucao final. | Primeiro implementar/corrigir o `BK-MF8-15` em `real_dev`, criando matriz, contrato, teste Vitest e smoke final; depois repetir a auditoria do BK16. |
| ORELLE-MF8-BK16-P1-002 | P1 | `ABERTO` | O contrato proprio de `RNF28` nao esta implementado: faltam `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`, `real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js` e `real_dev/api/tests/mf8.final-execution-contract.test.js`. | Nao existe evidence final com comando, diretoria, camada, exit code, estado, output resumido, privacy check, negativos e handoff para `BK-MF8-17`. Bloqueia `AUDITADO_OK` para `RNF28`. | Em modo proprio de implementacao/correcao, materializar os artefactos BK16 mapeados para `real_dev`, executar a bateria final real e manter `proof_e2e` como comando aprovado ou `TODO (BLOCKER)` explicito. |
| ORELLE-MF8-BK16-P3-003 | P3 | `NAO_BLOQUEANTE_AMBIENTAL` | `npm --prefix real_dev/api test` falhou na sandbox com `listen EPERM: operation not permitted 0.0.0.0` e erros derivados `Cannot read properties of null (reading 'port')`; a repeticao fora da sandbox passou. | Ambiental. Nao representa regressao de produto nem explica os findings P1, que sao ausencia objetiva de artefactos do BK15/BK16. | Continuar a repetir suites HTTP/Supertest fora da sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Resumo por severidade:

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 2 | Abertos: handoff BK15 ausente e contrato/evidence BK16 ausente. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Ambiental, nao bloqueante quando repetido fora da sandbox. |

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF28` | `docs/RNF.md:87` define que a bateria final de testes deve ser executada com evidencias objetivas. |
| Canon BK e fronteiras vizinhas | `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:91` a `:93` coloca `BK-MF8-15 -> BK-MF8-16 -> BK-MF8-17`; `BK-MF8-16` e `P0`, depende de `BK-MF8-14` e `BK-MF8-15`, fecha `RNF28` e entrega para `BK-MF8-17`. `BACKLOG-MVP.md:119` a `:121` confirma a mesma cadeia. |
| Matriz minima de testes | `docs/planificacao/sprints/PLANO-SPRINTS.md:56` a `:57` exige para `P0` evidence `unit + integration + e2e` e minimo de `3` negativos. |
| CORE-DUAL | `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md:98` a `:100` classifica `BK-MF8-15`, `BK-MF8-16` e `BK-MF8-17` como suporte `FundacaoQualidade`, ligado a gates e incidentes criticos. |
| Guia BK16 | `docs/planificacao/guias-bk/MF8/BK-MF8-16-execucao-final-de-testes-com-evidencias.md:23` a `:36` exige executar a bateria final, criar evidence final, contrato, teste Vitest, separacao de estados e handoff. `:51` a `:57` exige BK15 concluido e matriz `TESTES-ATUAIS-E-LACUNAS.md`. `:94` a `:102` lista os artefactos a criar/rever. |
| Handoff BK15 esperado | `BK-MF8-15...md:795` a `:800` exige matriz, contrato, teste, smoke e comandos suficientes para o BK16; `:847` a `:857` explicita que o BK16 deve receber matriz, contrato, teste, smoke, outputs, `proof_e2e` e lacunas triadas. |
| Handoff BK16 esperado pelo BK17 | `BK-MF8-16...md:826` a `:837` exige entregar ao BK17 a evidence final preenchida, proofs `falhou_por_produto`, bloqueios, testes afetados e nota `proof_e2e`. `BK-MF8-17...md:162` a `:177` confirma que o proximo BK consome `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`. |
| Scripts reais disponiveis | `real_dev/api/package.json:6` a `:10` expoe `test` e `backup:daily`; `real_dev/web/package.json:6` a `:21` expoe `build` e smokes ate `smoke:mf8-assisted-consultation`. Nao existe script E2E/browser aprovado nem `smoke:mf8-final` em `real_dev/web/package.json`. |
| Artefactos BK15/BK16 no checkout | Verificacao de presenca devolveu `MISSING` para `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`, `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`, `real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js`, `real_dev/api/tests/mf8.final-contracts.test.js`, `real_dev/web/scripts/check-mf8-final-smoke.mjs`, `real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js` e `real_dev/api/tests/mf8.final-execution-contract.test.js`. |
| Inventario de testes real_dev | `find docs/evidence real_dev/api/tests real_dev/web/scripts -maxdepth 5 -type f` mostra evidence apenas em `docs/evidence/MF7`, contratos MF8 ate `bk-mf8-14.evidence-contract.js` e testes MF8 ate consulta/recomendacoes/mockup. Nao ha `bk-mf8-15`, `bk-mf8-16`, `mf8.final-contracts`, `mf8.final-execution` nem `check-mf8-final-smoke`. |
| Dependencia `BK-MF8-03` | `node --check real_dev/api/tests/mf8.test-env.contract.test.js` passou; `npm --prefix real_dev/api test -- tests/mf8.test-env.contract.test.js` passou com `1` ficheiro e `5` testes. |
| Dependencia `BK-MF8-14` | `node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js`, `node --check real_dev/web/scripts/check-mf8-mockup-alignment.mjs`, `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs` e `npm --prefix real_dev/web run smoke:mf8-assisted-consultation` passaram. |

### Coerencia entre MFs e BKs vizinhos

- `MF7 -> MF8`: preservada no codigo existente. A suite API completa passou
  fora da sandbox, e esta auditoria nao encontrou enfraquecimento de cookies
  HttpOnly, consentimento, ownership, roles, privacidade biometrica, provider
  IA ou pagamentos.
- `BK-MF8-14 -> BK-MF8-16`: parcialmente entregue. Existem gates e evidence
  de `RNF26`, mas o BK16 nao pode agrega-los na bateria final porque o handoff
  BK15 ainda nao existe.
- `BK-MF8-15 -> BK-MF8-16`: quebrado por ausencia de contrato. Sem matriz,
  contrato, teste e smoke do BK15, a execucao final fica bloqueada por
  contrato e nao deve inventar novos criterios de cobertura.
- `BK-MF8-16 -> BK-MF8-17`: quebrado. O BK17 exige
  `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` com falhas, bloqueios,
  `proof_e2e` e testes afetados; esse artefacto nao existe.
- `MF8 -> MF seguinte`: nao existe MF9 canonica nesta matriz (`MF0` a `MF8`).
  A fronteira relevante e o fecho intra-MF8 por `BK-MF8-17`.

### Validacoes executadas nesta auditoria

| Comando / verificacao | Resultado |
| --- | --- |
| `git status --short` | `PASS_COM_NOTA` - havia `docs/cabulas/`, relatorios MF8 e `mockup/` untracked; foram preservados. |
| `git check-ignore -v real_dev real_dev/api real_dev/web ...` | `PASS` - `.gitignore:2:real_dev/` confirma que a area real esta ignorada como esperado. |
| `rg -n "RNF28\|BK-MF8-16\|BK-MF8-17\|unit \\+ integration \\+ e2e" ...` | `PASS` - confirmou `RNF28`, BK16 P0, dependencias/handoff e regra P0. |
| Verificacao de presenca dos artefactos BK15/BK16 | `FAIL_CONTRATO` - os 7 caminhos esperados devolveram `MISSING`. |
| `node --check real_dev/api/tests/mf8.test-env.contract.test.js` | `PASS` |
| `npm --prefix real_dev/api test -- tests/mf8.test-env.contract.test.js` | `PASS` - `1` ficheiro e `5` testes. |
| `node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js` | `PASS` |
| `node --check real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` |
| `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` - `BK-MF8-14 alinhamento visual validado: 6 ficheiros e 20 padroes.` |
| `npm --prefix real_dev/web run smoke:mf8-assisted-consultation` | `PASS` - `BK-MF8-13 UI integrada validada: 8 ficheiros e 32 contratos.` |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com `87` modulos transformados. |
| `npm --prefix real_dev/api test` na sandbox | `FAIL_AMBIENTE` - `listen EPERM: operation not permitted 0.0.0.0` e erros derivados de porta nula em Supertest. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` - `38` ficheiros e `269` testes passaram. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, `44` RF, `31` RNF, `74` BKs/guias. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/web/src`, `real_dev/web/scripts` e `docs/evidence` | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como checks anti-`localStorage`/`sessionStorage`, stubs/testes Stripe/PayPal/MBWay, segredos fake de teste, provider Stripe configurado por env, validacoes de segredo de sessao, strings defensivas contra treino externo e observabilidade/redaccao. Sem finding novo de seguranca, privacidade, biometria, IA ou dominio externo. |
| `git diff --check` | `PASS` - sem output. |
| `rg -n "[ \\t]+$" docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md` | `PASS` - sem trailing whitespace no relatorio actualizado. |

### Validacoes nao executadas

- `node --check real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js`:
  nao executado porque o ficheiro nao existe.
- `npm --prefix real_dev/api test -- tests/mf8.final-contracts.test.js`: nao
  executado porque o teste nao existe.
- `node --check real_dev/web/scripts/check-mf8-final-smoke.mjs` e
  `node real_dev/web/scripts/check-mf8-final-smoke.mjs`: nao executados porque
  o smoke final nao existe.
- `node --check real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js`:
  nao executado porque o ficheiro nao existe.
- `npm --prefix real_dev/api test -- tests/mf8.final-execution-contract.test.js`:
  nao executado porque o teste nao existe.
- Browser E2E real: nao executado; nao ha script E2E/browser aprovado nem
  evidence final BK16 a classificar `proof_e2e`.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-16`.
- Nenhum ficheiro de implementacao foi alterado.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi
  alterado.
- Nenhum commit foi criado.

### Decisao

`BK-MF8-16` fica `AUDITADO_COM_FINDINGS` e operacionalmente
`BLOQUEADO_POR_CONTRATO`: a aplicacao real continua compilavel e a suite API
passa fora da sandbox, mas `RNF28` nao esta entregue. Falta o handoff do
`BK-MF8-15` e faltam os artefactos proprios do BK16, incluindo
`EXECUCAO-FINAL-TESTES.md`, contrato de evidence, teste Vitest e handoff
executavel para `BK-MF8-17`.

Proxima accao recomendada: corrigir primeiro `BK-MF8-15` em modo
`implementar` ou `corrigir_auditoria`; depois implementar `BK-MF8-16` e repetir
esta auditoria.

## 2026-07-07 - BK-MF8-15 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_COM_FINDINGS`
- BK auditado: `BK-MF8-15`
- Macro-fase canonica: `MF8`
- RF/RNF principal: `RNF27`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com
`IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`,
`CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`,
`PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O guia publico do BK usa caminhos `apps/api`, `apps/web` e
`docs/evidence/MF8`; nesta execucao esses contratos foram mapeados para a
implementacao real `real_dev/api` e `real_dev/web`, preservando os caminhos de
evidence documental quando o proprio BK os exige. Nao foram alterados codigo,
guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos. Apenas
este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK15-P1-001 | P1 | `ABERTO` | O contrato central de `RNF27` nao esta implementado em `real_dev`: faltam a matriz `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`, o contrato `real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js`, o teste `real_dev/api/tests/mf8.final-contracts.test.js` e o smoke `real_dev/web/scripts/check-mf8-final-smoke.mjs`. | Requisito essencial incompleto. O BK15 nao consegue provar verificacao de testes actuais, criacao dos testes em falta, negativos P0, lacuna E2E controlada nem handoff objectivo para `BK-MF8-16`. Bloqueia `AUDITADO_OK` e a bateria final herdada pelo BK16. | Em modo proprio de implementacao/correcao, criar a matriz, contrato, teste Vitest e smoke final mapeados para `real_dev`, mantendo a ausencia de browser E2E como `TODO (BLOCKER)` ou lacuna controlada ate existir comando aprovado. |
| ORELLE-MF8-BK15-P3-002 | P3 | `NAO_BLOQUEANTE_AMBIENTAL` | `npm --prefix real_dev/api test` falhou na sandbox com `listen EPERM: operation not permitted 0.0.0.0` e varias falhas derivadas `Cannot read properties of null (reading 'port')`; a repeticao fora da sandbox passou. | Ambiental. Nao representa regressao de produto nem explica o P1 do BK15, que e ausencia objectiva dos artefactos exigidos. | Continuar a repetir suites HTTP/Supertest fora da sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Resumo por severidade:

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 1 | Aberto: artefactos centrais do BK15 ausentes. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Ambiental, nao bloqueante quando repetido fora da sandbox. |

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF27` | `docs/RNF.md:86` define que os testes actuais devem ser verificados e os testes em falta criados antes da bateria final. |
| Canon BK e fronteiras vizinhas | `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:90` a `:92` coloca `BK-MF8-14 -> BK-MF8-15 -> BK-MF8-16`; `BK-MF8-15` e `P0`, depende de `BK-MF8-03` e `BK-MF8-14`, fecha `RNF27` e entrega para `BK-MF8-16`. `BACKLOG-MVP.md:118` a `:120` confirma a mesma cadeia. |
| Matriz minima de testes | `docs/planificacao/sprints/PLANO-SPRINTS.md:56` a `:57` exige para `P0` evidence `unit + integration + e2e` e minimo de `3` negativos. |
| Guia BK15 | `docs/planificacao/guias-bk/MF8/BK-MF8-15-verificacao-dos-testes-atuais-e-criacao-dos-testes-em-falta.md:23` define inventario, lacunas, contrato de evidence e teste final; `:33` a `:39` lista a matriz, contrato, teste, smoke e handoff; `:94` a `:96` fixa `RNF27`, P0 e lacuna E2E controlada; `:108` a `:111` lista os quatro artefactos a criar. |
| Criterios de aceite BK15 | `BK-MF8-15...md:795` a `:808` exige matriz ligada a `RNF27`, contrato, teste final, smoke final, ausencia de E2E real registada como lacuna controlada e evidence por camada. `:819` a `:823` lista as validacoes finais esperadas. |
| Scripts reais disponiveis | `real_dev/api/package.json:9` expoe `test` com `NODE_ENV=test` e `orelle_test`; `real_dev/web/package.json:8` expoe `build`; `:19` a `:21` expoem smokes MF8 existentes para consulta, historico e consulta assistida. Nao existe script E2E/browser nem smoke final BK15 em `real_dev/web/package.json`. |
| Artefactos BK15 no checkout | Verificacao de presenca devolveu `MISSING` para `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`, `real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js`, `real_dev/api/tests/mf8.final-contracts.test.js` e `real_dev/web/scripts/check-mf8-final-smoke.mjs`. |
| Inventario de testes real_dev | `find real_dev/api/tests -maxdepth 2 -type f` mostra testes MF8 ate `BK-MF8-14`/consulta assistida, incluindo `bk-mf8-13.evidence-contract.js`, `bk-mf8-14.evidence-contract.js`, `mf8.safe-logging.contract.test.js`, `mf8.test-env.contract.test.js` e `mf8.*` de consulta/recomendacoes, mas nao mostra `bk-mf8-15` nem `mf8.final-contracts.test.js`. |
| Dependencia `BK-MF8-03` | `real_dev/api/tests/mf8.test-env.contract.test.js:15` a `:87` cobre ambiente isolado, base `orelle_test`, bloqueio fora de `NODE_ENV=test`, URI sem marcador de teste, base production-like e credenciais live. O teste focal passou com `5` testes. |
| Dependencia `BK-MF8-14` | `real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js:1` a `:7` fixa `BK-MF8-14`, `RNF26`, `mode: "mockup"`, screenshots e 3 negativos; `real_dev/web/scripts/check-mf8-mockup-alignment.mjs:6` a `:13` e `:15` a `:96` exigem ficheiros/padroes de mockup. O gate passou com `6` ficheiros e `20` padroes, e o smoke `smoke:mf8-assisted-consultation` passou com `8` ficheiros e `32` contratos. |
| Handoff esperado pelo BK16 | `docs/planificacao/guias-bk/MF8/BK-MF8-16-execucao-final-de-testes-com-evidencias.md:149` a `:193` diz que o BK16 deve confirmar os quatro artefactos do BK15 e registar cada ausencia como bloqueio herdado. |

### Coerencia entre MFs e BKs vizinhos

- `MF7 -> MF8`: preservada no codigo existente. Esta auditoria nao encontrou
  enfraquecimento de autenticacao, cookies HttpOnly, consentimento, ownership,
  roles, privacidade biometrica, provider IA ou pagamentos. A suite API passou
  fora da sandbox.
- `MF8 interna / BK-MF8-03 -> BK-MF8-15`: parcialmente consumivel, mas nao
  consumido pelo BK15. O guard de ambiente de teste existe e passa, mas ainda
  nao ha matriz BK15 a inventariar esse contrato como evidence para a bateria
  final.
- `MF8 interna / BK-MF8-14 -> BK-MF8-15`: entregue pelo BK14, nao consumido
  pelo BK15. O check estatico, contrato de evidence visual e screenshots do
  mockup existem, mas falta a matriz final que os agregue em `RNF27`.
- `BK-MF8-15 -> BK-MF8-16`: quebrado por ausencia de contrato. O BK16 depende
  da matriz, contrato, teste e smoke final do BK15; sem eles, a execucao final
  deve herdar bloqueio em vez de fingir sucesso.
- `MF8 -> MF seguinte`: nao existe MF9 canonica nesta matriz (`MF0` a `MF8`).
  A fronteira relevante apos o BK15 e o fecho intra-MF8 por `BK-MF8-16` e
  `BK-MF8-17`.

### Validacoes executadas nesta auditoria

| Comando / verificacao | Resultado |
| --- | --- |
| `git status --short` | `PASS_COM_NOTA` - havia `docs/cabulas/`, relatorios MF8 e `mockup/` untracked; foram preservados. |
| `git check-ignore -v real_dev real_dev/api real_dev/web ...` | `PASS` - `.gitignore:2:real_dev/` confirma que a area real esta ignorada como esperado. |
| `rg -n "RNF27\|BK-MF8-15\|BK-MF8-16\|unit \\+ integration \\+ e2e" ...` | `PASS` - confirmou `RNF27`, BK15 P0, dependencias/handoff e regra P0. |
| Verificacao de presenca dos 4 artefactos BK15 | `FAIL_CONTRATO` - todos os 4 caminhos esperados devolveram `MISSING`. |
| `node --check real_dev/api/tests/mf8.test-env.contract.test.js` | `PASS` |
| `node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js` | `PASS` |
| `node --check real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` |
| `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` - `BK-MF8-14 alinhamento visual validado: 6 ficheiros e 20 padroes.` |
| `npm --prefix real_dev/web run smoke:mf8-assisted-consultation` | `PASS` - `BK-MF8-13 UI integrada validada: 8 ficheiros e 32 contratos.` |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com `87` modulos transformados. |
| `npm --prefix real_dev/api test -- tests/mf8.test-env.contract.test.js` | `PASS` - `1` ficheiro, `5` testes. |
| `npm --prefix real_dev/api test` na sandbox | `FAIL_AMBIENTE` - `listen EPERM: operation not permitted 0.0.0.0` e erros derivados de porta nula em Supertest. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` - `38` ficheiros e `269` testes passaram. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, `44` RF, `31` RNF, `74` BKs/guias. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/api/scripts`, `real_dev/web/src` e `real_dev/web/scripts` | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como storage privado do backup, testes/stubs Stripe/PayPal/MBWay, segredos fake de teste, verificacoes anti-`localStorage`/`sessionStorage`, provider externo controlado, strings defensivas contra treino externo e padroes de redaccao/observabilidade. Sem finding novo de seguranca, privacidade, biometria, IA ou dominio externo. |
| `git diff --check` | `PASS` - sem output. |
| `rg -n "[ \\t]+$" docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md` | `PASS` - sem trailing whitespace no relatorio actualizado. |

### Validacoes nao executadas

- `node --check real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js`:
  nao executado porque o ficheiro nao existe.
- `npm --prefix real_dev/api test -- tests/mf8.final-contracts.test.js`: nao
  executado porque o teste nao existe.
- `node --check real_dev/web/scripts/check-mf8-final-smoke.mjs` e
  `node real_dev/web/scripts/check-mf8-final-smoke.mjs`: nao executados porque
  o smoke final nao existe.
- Browser E2E real: nao executado; nao ha script E2E/browser aprovado nem matriz
  BK15 a classificar a lacuna como controlada.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-15`.
- Nenhum ficheiro de implementacao foi alterado.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi
  alterado.
- Nenhum commit foi criado.

### Decisao

`BK-MF8-15` fica `AUDITADO_COM_FINDINGS`: as dependencias `BK-MF8-03` e
`BK-MF8-14` estao tecnicamente disponiveis e validadas, a app compila e a suite
API passa fora da sandbox, mas o proprio BK15 ainda nao entrega `RNF27`. Falta
a matriz de testes/lacunas, o contrato de evidence, o teste final e o smoke
final; por isso o handoff para `BK-MF8-16` esta bloqueado por contrato de
fecho incompleto.

Proxima accao recomendada: executar uma prompt em modo `implementar` ou
`corrigir_auditoria` para `BK-MF8-15`, criando apenas os artefactos de teste e
evidence exigidos, depois repetir esta auditoria.

## 2026-07-07 - BK-MF8-14 - reauditar_implementacao pos-correcao P2-004

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-14`
- Macro-fase canonica: `MF8`
- RF/RNF principal: `RNF26`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A re-auditoria foi executada como passe novo, em modo audit-only, com
`IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`,
`CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`,
`PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem
documentos canonicos. Apenas este relatorio tecnico foi actualizado, conforme
`OUTPUT_MODE=relatorio_e_resumo`. A pasta `mockup/` existe neste checkout e foi
tratada apenas como referencia visual/fluxo para `RNF26`, sem criar contrato
backend, privacidade, biometria, comercio ou IA.

### Achados

| ID | Severidade | Estado | Descricao | Evidencia de fecho |
| --- | --- | --- | --- | --- |
| ORELLE-MF8-BK14-P1-001 | P1 | `FECHADO` / `JA_CORRIGIDO` | O finding anterior sobre `hasMockup: false`/evidence em baseline continua nao reproduzivel. A implementacao declara `hasMockup: true`, expoe `data-mockup-mode`, referencia `mockup/` e o contrato de evidence exige `mode: "mockup"`. | `AssistedConsultationHubPage.jsx:14-20`, `:169-217`; `bk-mf8-14.evidence-contract.js:1-7`, `:46-68`; contrato positivo `mode: "mockup"` passou e negativo `mode: "baseline"` foi rejeitado. |
| ORELLE-MF8-BK14-P2-003 | P2 | `FECHADO` / `CORRIGIDO` | O contraste dos titulos dos steps inactivos/activos continua corrigido com regras locais em `.assisted-consultation-step strong` e `.assisted-consultation-step[aria-pressed="true"] strong`. | `styles.css:873-925`; screenshots desktop/mobile inspeccionadas mostram steps legiveis. |
| ORELLE-MF8-BK14-P2-004 | P2 | `FECHADO` / `CORRIGIDO` | O conteudo embutido no painel activo ja nao herda tokens claros do tema escuro sobre superficie branca. `.assisted-consultation-panel-body` isola tokens locais de texto, superficies, linhas, botoes e marca para os componentes renderizados dentro do painel. | `styles.css:962-983`; `check-mf8-mockup-alignment.mjs:76-82`; screenshots desktop/mobile inspeccionadas mostram o titulo interno `Sessao guiada de avaliacao cosmetica`, progresso e botoes legiveis. |
| ORELLE-MF8-BK14-P3-002 | P3 | `NAO_REPRODUZIDO` | `npm --prefix real_dev/api test` falhou na sandbox com `listen EPERM: operation not permitted 0.0.0.0`, mas a repeticao fora da sandbox passou. | Fora da sandbox: `38` ficheiros e `269` testes passaram. |

Sem findings P0, P1 ou P2 abertos para `BK-MF8-14`.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF26` | `docs/RNF.md:85` exige que a interface final se aproxime do mockup aprovado nos ecras principais. |
| Canon BK e fronteiras vizinhas | `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:89` a `:92` coloca `BK-MF8-13 -> BK-MF8-14 -> BK-MF8-15 -> BK-MF8-16`; `BK-MF8-14` e `P0`, depende de `BK-MF5-05`, `BK-MF5-06`, `BK-MF5-07` e `BK-MF8-13`, e fecha `RNF26`. |
| Guia BK14 | `docs/planificacao/guias-bk/MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md:23` a `:25` define aproximacao ao mockup com hierarquia, responsividade, legibilidade e evidence; `:35` a `:41` inclui uso de `mockup/`, CSS, responsividade, estados e evidence; `:45` a `:50` exclui endpoints, DTOs, regras de negocio, pagamentos, biometricos e dados sensiveis. |
| Hub integrado | `real_dev/web/src/pages/AssistedConsultationHubPage.jsx:14` a `:20` declara `hasMockup: true` e atributos `data-mockup-*`; `:169` a `:217` renderiza shell autenticada, steps por role, painel activo, badge `Mockup`, `aria-pressed` e `aria-live` sem criar fluxo paralelo. |
| Correcao dos steps | `real_dev/web/src/styles.css:873` a `:925` define cards de steps, estado activo, texto inactivo `var(--mockup-text)` e texto activo `var(--mockup-background)`, fechando o contraste reportado em `ORELLE-MF8-BK14-P2-003`. |
| Correcao do painel activo | `real_dev/web/src/styles.css:962` a `:983` define `color`, `--ink`, `--muted`, `--line`, superficies, tokens de marca e tokens de botao locais em `.assisted-consultation-panel-body`, impedindo que componentes filhos usem texto claro do tema escuro sobre o fundo claro do mockup. |
| Gate estatico | `real_dev/web/scripts/check-mf8-mockup-alignment.mjs:6` a `:13` exige `mockup/` e ficheiros de implementacao; `:15` a `:96` exige 20 padroes, incluindo `hasMockup: true`, `data-mockup-mode`, tokens do design system, CTA `Consultar IA`, `--ink: var(--mockup-text)` e `--muted: rgb(30 30 30 / 72%)`. |
| Contrato de evidence | `real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js:1` a `:7` fixa `BK-MF8-14`, `RNF26`, areas obrigatorias, `mode: "mockup"`, 2 screenshots, 2 referencias mockup e 3 negativos; `:46` a `:68` rejeita evidence fora desse contrato. |
| Evidence visual | `real_dev/web/evidence/bk-mf8-14-desktop-hub-mockup.png` e `real_dev/web/evidence/bk-mf8-14-mobile-hub-mockup.png` foram inspeccionadas nesta re-auditoria. O desktop mostra shell claro, hero, steps, painel, estado autenticado e badge `Mockup`; o mobile mostra o painel activo com titulo interno, progresso e botoes legiveis. |
| Relatorio de correcao | `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md:3` em diante regista a correcao de `ORELLE-MF8-BK14-P2-004`. |

### Coerencia entre MFs e BKs vizinhos

- `MF5 -> MF8`: preservada. Os tokens locais do painel reforcam
  legibilidade, identidade visual e responsividade sem alterar contratos de
  dados.
- `MF7 -> MF8`: preservada. A UI continua dependente de `useAuth`/cookie
  HttpOnly e nao substitui autorizacao, ownership, consentimento ou privacidade
  backend.
- `BK-MF8-13 -> BK-MF8-14`: consumido. O polimento continua sobre
  `AssistedConsultationHubPage`, reutilizando as paginas existentes em vez de
  criar experiencia paralela.
- `BK-MF8-14 -> BK-MF8-15`: entregue. Existem gates estaticos, evidence visual,
  contrato positivo/negativo e comandos de validacao para a verificacao de
  testes.
- `BK-MF8-14 -> BK-MF8-16`: entregue. A bateria final pode reaproveitar os
  comandos e screenshots actuais como evidencia objectiva de `RNF26`.

### Validacoes executadas nesta re-auditoria

| Comando / verificacao | Resultado |
| --- | --- |
| `git check-ignore -v real_dev real_dev/web real_dev/api ...` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao real esta ignorada. |
| `node --check real_dev/web/src/services/mockupAlignmentChecklist.js` | `PASS` |
| `node --check real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` |
| `node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js` | `PASS` |
| `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` - `BK-MF8-14 alinhamento visual validado: 6 ficheiros e 20 padroes.` |
| Contrato positivo `validateBKMF814Evidence(...)` com `mode: "mockup"` | `PASS` - `{"bkId":"BK-MF8-14","status":"valid","domain":"mockup_alignment","mode":"mockup"}` |
| Contrato negativo `validateBKMF814Evidence(...)` com `mode: "baseline"` | `PASS_NEGATIVO` - rejeitado com `Evidence visual deve usar mode mockup quando mockup/ existe.` |
| `npm --prefix real_dev/web run smoke:mf8-assisted-consultation` | `PASS` - `BK-MF8-13 UI integrada validada: 8 ficheiros e 32 contratos.` |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 87 modulos transformados. |
| `npm --prefix real_dev/api test` na sandbox | `FAIL_AMBIENTE` - falhou com `listen EPERM: operation not permitted 0.0.0.0`. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` - 38 ficheiros, 269 testes. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa estatica focada por storage inseguro, `dangerouslySetInnerHTML`, `eval`, `new Function`, ids internos, segredos e placeholders nos ficheiros BK14 | `PASS_COM_NOTA` - unicos hits foram texto defensivo/documental (`tokens CSS`, `tokens ou dados biometricos`), nao uso real de storage/token. |
| Pesquisa estatica focada por repos externos, dominios estranhos, pagamentos, checkout, RAG/embeddings e treino externo nos ficheiros BK14 | `PASS_COM_NOTA` - unico hit foi texto defensivo sobre mockup ausente; sem drift material. |
| Inspeccao visual de `bk-mf8-14-desktop-hub-mockup.png` e `bk-mf8-14-mobile-hub-mockup.png` | `PASS` - shell, mockup mode, steps, painel activo e mobile OK. |
| `git diff --check` | `PASS` |
| `rg -n "[ \t]+$" real_dev/web/src/styles.css real_dev/web/scripts/check-mf8-mockup-alignment.mjs docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md` | `PASS` - sem trailing whitespace nos ficheiros verificados. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de re-auditoria
  `BK-MF8-14 - reauditar_implementacao pos-correcao P2-004`.
- Nenhum ficheiro de implementacao foi alterado nesta auditoria.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi
  alterado.
- Nenhum commit foi criado.

### Validacoes nao executadas

- Nao foram regeneradas screenshots nesta re-auditoria; foram inspeccionadas as
  screenshots existentes geradas apos a correcao anterior.
- Nao foi feita sessao live browser contra API real/autenticacao real nesta
  re-auditoria; a decisao visual usa screenshots existentes, leitura estatica
  de CSS/React e os gates executados.
- Commit/push/PR nao executados, conforme `PERMITIR_COMMITS=nao`.

### Decisao

`BK-MF8-14` fica `AUDITADO_OK`: os findings anteriores estao fechados ou nao
reproduzidos, `RNF26` esta coberto por implementacao, evidence visual,
contratos positivo/negativo, gate estatico, smoke UI, build, suite API fora da
sandbox e validacao de planificacao. Nao foram encontrados novos desvios de
escopo, backend, privacidade, comercio, biometria ou IA.

## 2026-07-07 - BK-MF8-14 - reauditar_implementacao pos-correcao

### Resultado

- Estado: `AUDITADO_COM_FINDINGS`
- BK auditado: `BK-MF8-14`
- Macro-fase canonica: `MF8`
- RF/RNF principal: `RNF26`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A re-auditoria foi executada como passe novo, em modo audit-only, com
`IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`,
`CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`,
`PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem
documentos canonicos. Apenas este relatorio tecnico foi actualizado, conforme
`OUTPUT_MODE=relatorio_e_resumo`. A pasta `mockup/` existe neste checkout e foi
tratada apenas como referencia visual/fluxo para `RNF26`, sem criar contrato
backend, privacidade, biometria, comercio ou IA.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK14-P1-001 | P1 | `FECHADO` / `JA_CORRIGIDO` | O finding anterior sobre `hasMockup: false`/evidence em baseline ja nao se reproduz. A implementacao declara `hasMockup: true`, expoe `data-mockup-mode`, referencia `mockup/` e o contrato de evidence exige `mode: "mockup"`. | O bloqueio principal de `RNF26` foi corrigido. | Manter o gate estatico e o contrato de evidence para impedir regressao para baseline quando `mockup/` existir. |
| ORELLE-MF8-BK14-P2-003 | P2 | `FECHADO` / `CORRIGIDO` | O contraste dos titulos dos steps inactivos/activos foi corrigido com regras locais em `.assisted-consultation-step strong` e `.assisted-consultation-step[aria-pressed="true"] strong`. As screenshots desktop/mobile mostram `Historico IA`, `Recomendacoes` e `Insights do consultor` legiveis sobre cards claros. | A navegacao lateral do hub deixou de falhar a legibilidade visual reportada na auditoria anterior. | Manter as regras locais porque o tema escuro ainda tem `--ink` claro globalmente. |
| ORELLE-MF8-BK14-P2-004 | P2 | `ABERTO` | O conteudo embutido no painel activo ainda herda tokens globais do tema escuro sobre a superficie branca do mockup. `GuidedConsultationPage` renderiza um `<section>` sem classe com `<h1>Sessao guiada de avaliacao cosmetica</h1>`; o CSS global aplica `section > h1 { color: var(--ink) }`, e em tema escuro `--ink` e claro, enquanto `.assisted-consultation-panel` usa `background: var(--mockup-card)` branco. Nas screenshots desktop/mobile, o titulo interno do painel fica quase invisivel. | O hub esta funcional e o shell/steps estao alinhados, mas a area `panel` ainda nao cumpre legibilidade suficiente para fechar `RNF26` sem ressalva. Bloqueia `AUDITADO_OK` para o BK. | Em modo de correcao, isolar os tokens de texto dentro de `.assisted-consultation-panel-body` ou aplicar uma classe/override local ao conteudo embutido, garantindo texto escuro sobre superficies claras sem alterar contratos backend. Recolher novas screenshots desktop/mobile apos correcao. |
| ORELLE-MF8-BK14-P3-002 | P3 | `NAO_REPRODUZIDO` | `npm --prefix real_dev/api test` falhou na sandbox com `listen EPERM: operation not permitted 0.0.0.0`; a repeticao fora da sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RNF26`. | Continuar a repetir suites HTTP/Supertest fora da sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0 ou P1 abertos. Existe 1 finding P2 aberto de legibilidade no
conteudo do painel activo.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF26` | `docs/RNF.md:85` exige que a interface final se aproxime do mockup aprovado nos ecras principais. |
| Canon BK e fronteiras vizinhas | `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:89` a `:92` coloca `BK-MF8-13 -> BK-MF8-14 -> BK-MF8-15 -> BK-MF8-16`; `BK-MF8-14` e `P0`, depende de `BK-MF5-05`, `BK-MF5-06`, `BK-MF5-07` e `BK-MF8-13`, e fecha `RNF26`. |
| Guia BK14 | `docs/planificacao/guias-bk/MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md:23` a `:25` define aproximacao ao mockup com hierarquia, responsividade, legibilidade e evidence; `:35` a `:41` inclui uso de `mockup/`, CSS, responsividade, estados e evidence; `:45` a `:50` exclui endpoints, DTOs, regras de negocio, pagamentos, biometricos e dados sensiveis. |
| Mockup e checklist | `real_dev/web/src/services/mockupAlignmentChecklist.js:3` a `:41` referencia `mockup/README.md`, `mockup/src/app/docs/DESIGN-SYSTEM.md`, `mockup/src/app/App.tsx` e tokens `#F5EFE7`, `#591C21`, `#E7BFBF`, `#9B7E3C`, `#1E1E1E`; `:79` a `:84` define checkpoints visuais; `:93` a `:109` muda para `mode: "mockup"` quando `hasMockup` e verdadeiro; `:120` a `:164` exige evidence visual com referencias, areas e screenshots. |
| Hub integrado | `real_dev/web/src/pages/AssistedConsultationHubPage.jsx:14` a `:20` declara `hasMockup: true` e atributos `data-mockup-*`; `:31` a `:65` renderiza hero partilhado; `:169` a `:217` renderiza shell autenticada, steps por role, painel activo, badge `Mockup`, `aria-pressed` e `aria-live` sem criar fluxo paralelo. |
| Correcao dos steps | `real_dev/web/src/styles.css:873` a `:920` define cards de steps, estado activo, texto inactivo `var(--mockup-text)` e texto activo `var(--mockup-background)`, fechando o contraste reportado em `ORELLE-MF8-BK14-P2-003`. |
| Novo risco de contraste no painel | `real_dev/web/src/styles.css:63` a `:74` torna `--ink`/`--muted` claros em dark theme; `:424` a `:430` aplica `section > h1 { color: var(--ink) }`; `:466` a `:468` aplica `p { color: var(--muted) }`; `:927` a `:965` coloca o painel em fundo branco/mockup sem override equivalente para o conteudo filho. `real_dev/web/src/pages/GuidedConsultationPage.jsx:264` a `:296` renderiza um `<section>` interno sem classe, expondo esse conflito visual. |
| Gate estatico | `real_dev/web/scripts/check-mf8-mockup-alignment.mjs:6` a `:13` exige `mockup/` e ficheiros de implementacao; `:15` a `:88` exige 18 padroes, incluindo `hasMockup: true`, `data-mockup-mode`, tokens do design system e CTA `Consultar IA`; o comando reportou `6 ficheiros e 18 padroes`. |
| Contrato de evidence | `real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js:1` a `:7` fixa `BK-MF8-14`, `RNF26`, areas obrigatorias, `mode: "mockup"`, 2 screenshots, 2 referencias mockup e 3 negativos; `:46` a `:68` rejeita evidence fora desse contrato. |
| Evidence visual | `real_dev/web/evidence/bk-mf8-14-desktop-hub-mockup.png` e `real_dev/web/evidence/bk-mf8-14-mobile-hub-mockup.png` mostram shell claro, hero, steps, painel, estado autenticado e badge `Mockup`. A inspeccao visual confirmou que os steps ficaram legiveis, mas tambem confirmou o novo P2: o titulo interno `Sessao guiada de avaliacao cosmetica` no painel activo fica quase invisivel sobre a superficie clara. |

### Coerencia entre MFs e BKs vizinhos

- `MF5 -> MF8`: parcialmente preservada. A correcao dos steps reforcou a
  legibilidade local, mas o conteudo embutido do painel ainda mistura tokens
  globais de tema escuro com a superficie clara do mockup.
- `MF7 -> MF8`: preservada. A UI continua dependente de `useAuth`/cookie
  HttpOnly e nao substitui autorizacao, ownership, consentimento ou privacidade
  backend.
- `BK-MF8-13 -> BK-MF8-14`: consumido. O polimento foi feito sobre
  `AssistedConsultationHubPage`, reutilizando as paginas existentes em vez de
  criar uma experiencia paralela.
- `BK-MF8-14 -> BK-MF8-15`: condicionado. Os gates e evidence existem, mas
  `ORELLE-MF8-BK14-P2-004` deve ser corrigido antes da verificacao de testes
  tratar `RNF26` como visualmente fechado.
- `BK-MF8-14 -> BK-MF8-16`: condicionado. A bateria final pode reaproveitar os
  comandos e screenshots, mas deve exigir novas screenshots apos corrigir o
  contraste do conteudo do painel.

### Validacoes executadas nesta re-auditoria

| Comando / verificacao | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS_COM_NOTA` - existem artefactos tecnicos/docs untracked, `mockup/` untracked e `real_dev/` ignorado; nada foi revertido ou apagado. |
| `git check-ignore -v real_dev real_dev/web real_dev/api ...` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao real esta ignorada. |
| `node --check real_dev/web/src/services/mockupAlignmentChecklist.js` | `PASS` |
| `node --check real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` |
| `node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js` | `PASS` |
| `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` - `BK-MF8-14 alinhamento visual validado: 6 ficheiros e 18 padroes.` |
| Contrato positivo `validateBKMF814Evidence(...)` com `mode: "mockup"` | `PASS` - `{"bkId":"BK-MF8-14","status":"valid","domain":"mockup_alignment","mode":"mockup"}` |
| Contrato negativo `validateBKMF814Evidence(...)` com `mode: "baseline"` | `PASS_NEGATIVO` - rejeitado com `Evidence visual deve usar mode mockup quando mockup/ existe.` |
| `npm --prefix real_dev/web run smoke:mf8-assisted-consultation` | `PASS` - `BK-MF8-13 UI integrada validada: 8 ficheiros e 32 contratos.` |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 87 modulos transformados. |
| `npm --prefix real_dev/api test` na sandbox | `FAIL_AMBIENTE` - falhou com `listen EPERM: operation not permitted 0.0.0.0`. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` - 38 ficheiros, 269 testes. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa estatica focada por storage inseguro, `dangerouslySetInnerHTML`, `eval`, `new Function`, ids internos, segredos e placeholders nos ficheiros BK14 | `PASS_COM_NOTA` - unicos hits foram texto defensivo/documental (`tokens CSS`, `tokens ou dados biometricos`), nao uso real de storage/token. |
| Pesquisa estatica focada por repos externos, dominios estranhos, pagamentos, checkout, RAG/embeddings e treino externo nos ficheiros BK14 | `PASS_COM_NOTA` - unico hit foi texto defensivo sobre mockup ausente; sem drift material. |
| Inspeccao visual de `bk-mf8-14-desktop-hub-mockup.png` e `bk-mf8-14-mobile-hub-mockup.png` | `PASS_COM_FINDING` - shell, mockup mode, steps e mobile OK; conteudo interno do painel activo gera `ORELLE-MF8-BK14-P2-004`. |
| `git diff --check` | `PASS` |
| `rg -n "[ \t]+$" real_dev/web/src/styles.css docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md` | `PASS` - sem trailing whitespace nos ficheiros verificados. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de re-auditoria `BK-MF8-14`.
- Nenhum ficheiro de implementacao foi alterado nesta auditoria.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi
  alterado.
- Nenhum commit foi criado.

### Validacoes nao executadas

- Nao foram regeneradas screenshots nesta re-auditoria; foram inspeccionadas as
  screenshots existentes geradas apos a correcao anterior.
- Nao foi feita sessao live browser contra API real/autenticacao real nesta
  re-auditoria; a decisao visual usa screenshots existentes e leitura estatica
  de CSS/React.
- Nao foi corrigido o P2 aberto porque o modo solicitado e
  `auditar_implementacao`.
- Commit/push/PR nao executados, conforme `PERMITIR_COMMITS=nao`.

### Decisao

`BK-MF8-14` fica `AUDITADO_COM_FINDINGS`: o P1 anterior esta fechado, o P2 dos
steps esta corrigido, os gates estaticos/evidence/build/smokes/suite API fora
da sandbox/planificacao passaram, e nao ha drift de escopo, backend,
privacidade, comercio ou IA. Contudo, o painel activo ainda tem um problema
objectivo de contraste no conteudo embutido (`ORELLE-MF8-BK14-P2-004`), por isso
o BK nao deve ser tratado como `AUDITADO_OK` ate essa legibilidade ser corrigida
e revalidada com novas screenshots desktop/mobile.

## 2026-07-07 - BK-MF8-14 - reauditar_implementacao

### Resultado

- Estado: `AUDITADO_COM_FINDINGS`
- BK auditado: `BK-MF8-14`
- Macro-fase canonica: `MF8`
- RF/RNF principal: `RNF26`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A re-auditoria foi executada como passe novo, em modo audit-only, com
`IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`,
`CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`,
`PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem
documentos canonicos. Apenas este relatorio tecnico foi actualizado, conforme
`OUTPUT_MODE=relatorio_e_resumo`. A pasta `mockup/` existe neste checkout e foi
tratada como referencia visual local para `RNF26`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK14-P1-001 | P1 | `FECHADO` | O finding anterior sobre `hasMockup: false`/evidence em baseline ja nao se reproduz. A implementacao declara `hasMockup: true`, expoe `data-mockup-mode`, referencia `mockup/` e o contrato de evidence exige `mode: "mockup"`. | O bloqueio principal de `RNF26` foi corrigido. | Manter o gate estatico e o contrato de evidence para impedir regressao para baseline quando `mockup/` existir. |
| ORELLE-MF8-BK14-P2-003 | P2 | `ABERTO` | As screenshots desktop/mobile mostram a estrutura visual alinhada com o mockup, mas os titulos dos steps inactivos ficam com contraste insuficiente em tema escuro sobre cards claros. A causa provavel e a regra global `strong { color: var(--ink); }`: em dark theme `--ink` e claro, enquanto os cards inactivos usam fundo branco/areia. | A navegacao continua funcional e o step activo esta legivel, mas labels importantes como `Historico IA`, `Recomendacoes` e `Insights do consultor` ficam pouco legiveis. Isto viola a parte de legibilidade do guia BK14 e impede fecho limpo de `RNF26`. | Em modo de correcao/implementacao, definir cor local para `.assisted-consultation-step strong` e override para o estado activo, usando `--mockup-text`/`--mockup-background` ou tokens equivalentes; recolher novas screenshots desktop/mobile depois da correcao. |
| ORELLE-MF8-BK14-P3-002 | P3 | `NAO_REPRODUZIDO` | `npm --prefix real_dev/api test` falhou na sandbox com `listen EPERM: operation not permitted 0.0.0.0`; a repeticao fora da sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RNF26`. | Continuar a repetir suites HTTP/Supertest fora da sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0 ou P1 abertos. Existe 1 finding P2 aberto de legibilidade visual.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF26` | `docs/RNF.md:85` exige que a interface final se aproxime do mockup aprovado nos ecras principais. |
| Canon BK e fronteiras vizinhas | `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:89` a `:92` coloca `BK-MF8-13 -> BK-MF8-14 -> BK-MF8-15 -> BK-MF8-16`; `BK-MF8-14` e `P0`, depende de `BK-MF5-05`, `BK-MF5-06`, `BK-MF5-07` e `BK-MF8-13`, e fecha `RNF26`. |
| Guia BK14 | `docs/planificacao/guias-bk/MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md:23` a `:25` define aproximacao ao mockup com hierarquia, responsividade, legibilidade e evidence; `:35` a `:41` inclui uso de `mockup/`, CSS, responsividade, estados e evidence; `:45` a `:50` exclui endpoints, DTOs, regras de negocio, pagamentos, biometricos e dados sensiveis. |
| Mockup e checklist | `real_dev/web/src/services/mockupAlignmentChecklist.js:3` a `:41` referencia `mockup/README.md`, `mockup/src/app/docs/DESIGN-SYSTEM.md`, `mockup/src/app/App.tsx` e tokens `#F5EFE7`, `#591C21`, `#E7BFBF`, `#9B7E3C`, `#1E1E1E`; `:79` a `:84` define checkpoints visuais; `:93` a `:109` muda para `mode: "mockup"` quando `hasMockup` e verdadeiro; `:120` a `:164` exige evidence visual com referencias, areas e screenshots. |
| Hub integrado | `real_dev/web/src/pages/AssistedConsultationHubPage.jsx:14` a `:20` declara `hasMockup: true` e atributos `data-mockup-*`; `:31` a `:65` renderiza hero partilhado; `:169` a `:217` renderiza shell autenticada, steps por role, painel activo, badge `Mockup`, `aria-pressed` e `aria-live` sem criar fluxo paralelo. |
| Estilos RNF26 | `real_dev/web/src/styles.css:10` a `:15` define tokens do mockup; `:873` a `:917` define steps, activo borgonha e texto secundario; `:919` a `:966` define painel e empty state; `:968` a `:982` define mobile em uma coluna. O mesmo ficheiro tambem mostra a causa do P2: `:63` a `:73` tornam `--ink` claro em dark theme e `:583` a `:585` aplicam `strong { color: var(--ink); }`, sem override local para o titulo do step inactivo. |
| Gate estatico | `real_dev/web/scripts/check-mf8-mockup-alignment.mjs:6` a `:13` exige `mockup/` e ficheiros de implementacao; `:15` a `:88` exige 18 padroes, incluindo `hasMockup: true`, `data-mockup-mode`, tokens do design system e CTA `Consultar IA`; o comando reportou `6 ficheiros e 18 padroes`. |
| Contrato de evidence | `real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js:1` a `:7` fixa `BK-MF8-14`, `RNF26`, areas obrigatorias, `mode: "mockup"`, 2 screenshots, 2 referencias mockup e 3 negativos; `:46` a `:68` rejeita evidence fora desse contrato. |
| Evidence visual | `real_dev/web/evidence/bk-mf8-14-desktop-hub-mockup.png` mostra shell claro, hero, step activo, painel, status autenticado e badge `Mockup`; `real_dev/web/evidence/bk-mf8-14-mobile-hub-mockup.png` mostra layout mobile em coluna e painel sem sobreposicao. A inspeccao visual tambem confirmou o P2 de contraste insuficiente nos titulos dos steps inactivos. |

### Coerencia entre MFs e BKs vizinhos

- `MF5 -> MF8`: parcialmente preservada. Tokens, superficies e estrutura visual foram aplicados; a legibilidade dos titulos inactivos ainda precisa de cor local para cumprir a heranca de MF5.
- `MF7 -> MF8`: preservada. A UI continua dependente de `useAuth`/cookie HttpOnly e nao substitui autorizacao, ownership, consentimento ou privacidade backend.
- `BK-MF8-13 -> BK-MF8-14`: consumido. O polimento foi feito sobre `AssistedConsultationHubPage`, sem criar outra experiencia nem endpoints novos.
- `BK-MF8-14 -> BK-MF8-15`: condicionado. O gate estatico, o contrato de evidence, screenshots e comandos ja existem, mas o P2 deve ser corrigido antes de tratar `RNF26` como fechado sem ressalvas.
- `BK-MF8-14 -> BK-MF8-16`: condicionado. A bateria final pode reaproveitar comandos/evidence, mas deve exigir screenshot revalidada apos corrigir contraste.

### Validacoes executadas nesta re-auditoria

| Comando / verificacao | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS_COM_NOTA` - existem artefactos tecnicos/docs untracked, `mockup/` untracked e `real_dev/` ignorado; nada foi revertido ou apagado. |
| `git check-ignore -v real_dev real_dev/web real_dev/api ...` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao real esta ignorada. |
| `node --check real_dev/web/src/services/mockupAlignmentChecklist.js` | `PASS` |
| `node --check real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` |
| `node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js` | `PASS` |
| `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` - `BK-MF8-14 alinhamento visual validado: 6 ficheiros e 18 padroes.` |
| Contrato positivo `validateBKMF814Evidence(...)` com `mode: "mockup"` | `PASS` - `{"bkId":"BK-MF8-14","status":"valid","domain":"mockup_alignment","mode":"mockup"}` |
| Contrato negativo `validateBKMF814Evidence(...)` com `mode: "baseline"` | `PASS_NEGATIVO` - rejeitado com `Evidence visual deve usar mode mockup quando mockup/ existe.` |
| `npm --prefix real_dev/web run smoke:mf8-assisted-consultation` | `PASS` - `BK-MF8-13 UI integrada validada: 8 ficheiros e 32 contratos.` |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 87 modulos transformados. |
| `npm --prefix real_dev/api test` na sandbox | `FAIL_AMBIENTE` - falhou com `listen EPERM: operation not permitted 0.0.0.0`. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` - 38 ficheiros, 269 testes. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa estatica focada por storage inseguro, `dangerouslySetInnerHTML`, `eval`, `new Function`, ids internos, segredos e placeholders nos ficheiros BK14 | `PASS_COM_NOTA` - unicos hits foram texto defensivo/documental (`tokens CSS`, `tokens ou dados biometricos`), nao uso real de storage/token. |
| Pesquisa estatica focada por repos externos, dominios estranhos, pagamentos, checkout, RAG/embeddings e treino externo nos ficheiros BK14 | `PASS_COM_NOTA` - unico hit foi texto defensivo sobre mockup ausente; sem drift material. |
| Inspeccao visual de `bk-mf8-14-desktop-hub-mockup.png` e `bk-mf8-14-mobile-hub-mockup.png` | `PASS_COM_FINDING` - estrutura, mockup mode e mobile OK; contraste dos titulos inactivos dos steps gera `ORELLE-MF8-BK14-P2-003`. |
| `git diff --check` | `PASS` |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de re-auditoria `BK-MF8-14`.
- Nenhum ficheiro de implementacao foi alterado nesta auditoria.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Validacoes nao executadas

- Nao foi feita nova sessao live browser contra API real/autenticacao real nesta re-auditoria; a decisao visual usou screenshots existentes e inspeccao estatica de CSS/React.
- Nao foi corrigido o P2 porque o modo solicitado e `auditar_implementacao`.
- Commit/push/PR nao executados, conforme `PERMITIR_COMMITS=nao`.

### Decisao

`BK-MF8-14` fica `AUDITADO_COM_FINDINGS`: o P1 anterior foi corrigido e a
implementacao ja usa `mockup/`, `mode: "mockup"`, gate estatico, contrato de
evidence, screenshots desktop/mobile, build web, smoke web, suite API fora da
sandbox, pesquisa estatica e validacao de planificacao. Contudo, o P2
`ORELLE-MF8-BK14-P2-003` permanece aberto porque os titulos dos steps inactivos
ficam pouco legiveis em dark theme sobre cards claros. O BK nao deve ser fechado
como `AUDITADO_OK` ate esse contraste ser corrigido e revalidado com novas
screenshots.

## 2026-07-07 - BK-MF8-14 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_COM_FINDINGS`
- BK auditado: `BK-MF8-14`
- Macro-fase canonica: `MF8`
- RF/RNF principal: `RNF26`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O contrato do `BK-MF8-14` foi comparado contra documentos canonicos, guia BK, implementacao real em `real_dev/web` e `real_dev/api`, dependencias visuais `BK-MF5-05`, `BK-MF5-06`, `BK-MF5-07`, handoff `BK-MF8-13 -> BK-MF8-14 -> BK-MF8-15`, artefactos de evidence, suite API, build web, smokes web, pesquisa estatica e validador de planificacao. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos durante esta auditoria; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

Durante a auditoria, a verificacao inicial de `mockup/` nao devolveu resultados. No estado final do workspace, contudo, existe uma pasta `mockup/` untracked com export Figma/documentacao visual da plataforma. Como a pasta esta presente agora e afecta directamente `RNF26`, a decisao final desta auditoria trata `mockup/` como referencia visual local disponivel. A implementacao auditada continua a usar `hasMockup: false` e evidence em modo `baseline`, o que cria drift objectivo face ao contrato do BK.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK14-P1-001 | P1 | `ABERTO` | `mockup/` existe no workspace final, mas `AssistedConsultationHubPage.jsx` continua a construir o checklist com `hasMockup: false`, a evidence esta em modo `baseline` e as screenshots auditadas nao demonstram aproximacao aos ecras principais do mockup exportado. | Requisito essencial de `RNF26` incompleto. O nucleo tecnico do BK existe, mas o BK nao pode ser considerado visualmente fechado enquanto houver mockup local disponivel e a implementacao/evidence nao o comparar nem o reflectir. Deve bloquear a passagem limpa de `BK-MF8-14` para `BK-MF8-15`/`BK-MF8-16` sem ressalva. | Corrigir em modo proprio: usar `mockup/` como referencia visual, actualizar checklist/evidence para modo `mockup`, alinhar a UI principal com paleta/estrutura/documentacao do mockup sem inventar contratos backend e recolher screenshots desktop/mobile autenticados e comparaveis. |
| ORELLE-MF8-BK14-P3-002 | P3 | `NAO_REPRODUZIDO` | A suite API falhou dentro da sandbox com `listen EPERM: operation not permitted 0.0.0.0`; a repeticao fora da sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RNF26`. | Continuar a repetir suites HTTP fora da sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0 ou P2. Existe um finding P1 aberto ligado a `RNF26` e um P3 ambiental descartado por repeticao fora da sandbox.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF26` | `docs/RNF.md:85` exige que a interface final se aproxime do mockup aprovado nos ecras principais. |
| Canon BK e fronteiras vizinhas | `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:89` a `:91` coloca `BK-MF8-13 -> BK-MF8-14 -> BK-MF8-15`; `:90` define `BK-MF8-14` como `P0`, dependente de `BK-MF5-05`, `BK-MF5-06`, `BK-MF5-07` e `BK-MF8-13`, com requisito `RNF26`. |
| Backlog e MF views | `docs/planificacao/backlogs/BACKLOG-MVP.md:117` a `:119` confirma a cadeia `BK-MF8-13 -> BK-MF8-14 -> BK-MF8-15`; `docs/planificacao/backlogs/MF-VIEWS.md:237` a `:240` exige integrar experiencia antes do polimento visual, aproximar UI ao mockup e completar testes/evidence. |
| Anexos de rastreabilidade | `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md:42` liga `RNF26` a `BK-MF8-14`; `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md:97` classifica `BK-MF8-14` como `CORE-HIBRIDO`, com acabamento visual para confianca/conversao. |
| Matriz minima P0 | `docs/planificacao/sprints/PLANO-SPRINTS.md:56` a `:59` exige para `P0` evidence de `unit + integration + e2e` e minimo de 3 negativos. |
| Guia BK14 sem drift de escopo | `docs/planificacao/guias-bk/MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md:35` a `:42` define scope-in de checklist, polimento do hub, responsividade, estados e evidence; `:44` a `:51` exclui endpoints, DTOs, models, authorization, compra automatica e exposicao de dados sensiveis; `:80` a `:86` permite baseline quando `mockup/` nao existe e exige screenshots/negativos. |
| Mockup local disponivel | `mockup/README.md` identifica a origem Figma; `mockup/src/app/docs/DESIGN-SYSTEM.md:8` a `:36` define borgonha `#591C21`, rosa metalico `#E7BFBF`, fundo areia `#F5EFE7`, texto carvao e dourado `#9B7E3C`; `mockup/src/app/App.tsx:105` a `:142` define ecrã inicial claro com hero, CTAs `Consultar IA`/`Explorar Produtos`; `:149` a `:230` define banner da consultora IA com cards brancos e chat demo. |
| Checklist visual `RNF26` | `real_dev/web/src/services/mockupAlignmentChecklist.js:1` a `:37` fixa requisito, areas `hero`, `steps`, `panel`, `empty-error` e baseline visual; `:46` a `:60` devolve modo `baseline`/`mockup`; `:71` a `:101` rejeita requisito errado, areas insuficientes e menos de 2 screenshots. |
| Hub polido sem fluxo paralelo, mas em baseline | `real_dev/web/src/pages/AssistedConsultationHubPage.jsx:7` importa o checklist; `:14` a `:17` usa `hasMockup: false` apesar de `mockup/` estar presente no workspace final; `:27` a `:55` reutiliza paginas existentes dos BKs `08` a `12`; `:74` a `:120` cobre loading, sem sessao e role sem acesso; `:122` a `:185` renderiza hero, status, steps, painel ativo, `aria-pressed` e `aria-live`. |
| CSS responsive | `real_dev/web/src/styles.css:760` a `:904` adiciona shell, hero, status, grelha, steps, painel, empty state e `overflow-wrap` para email; `:906` a `:920` muda hero/header e grelha para uma coluna em mobile. |
| Check estatico BK14 | `real_dev/web/scripts/check-mf8-mockup-alignment.mjs:6` a `:37` exige ficheiros/padroes essenciais; `:64` a `:84` valida ficheiros e padroes; o comando reportou `BK-MF8-14 alinhamento visual validado: 3 ficheiros e 6 padroes.` |
| Contrato de evidence BK14 | `real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js:1` a `:5` fixa `BK-MF8-14`, `RNF26`, 4 areas, 2 screenshots e 3 negativos; `:15` a `:63` valida BK, requisito, areas, screenshots e negativos. |
| Evidence visual existente | `real_dev/web/evidence/` contem 6 imagens `bk-mf8-14-*`. A inspeccao visual confirmou screenshots desktop/mobile legiveis do hub/estado sem sessao, mas nao confirmou comparacao com `mockup/`, nem steps/painel ativo autenticado; por isso `RNF26` fica `NAO_CUMPRE` no estado final e gerou `ORELLE-MF8-BK14-P1-001`. |

### Coerencia entre MFs e BKs vizinhos

- `MF5 -> MF8`: preservada. O BK usa tokens e padroes visuais ja existentes, estados legiveis e grelha responsiva sem criar sistema visual paralelo.
- `MF7 -> MF8`: preservada. A UI continua dependente de `useAuth`/cookie HttpOnly e nao substitui autorizacao, ownership, consentimento ou privacidade backend.
- `BK-MF8-13 -> BK-MF8-14`: consumido. O polimento foi feito sobre `AssistedConsultationHubPage`, sem criar outra experiencia de consulta assistida nem endpoints novos.
- `BK-MF8-14 -> BK-MF8-15`: nao esta limpo. O proximo BK pode consumir checklist, smoke e contrato de evidence, mas deve tratar `ORELLE-MF8-BK14-P1-001` antes de fechar a matriz final de testes/evidence.
- `MF seguinte`: nao existe `MF9` na matriz canonica atual (`MF0` a `MF8`); nao foi criado scope futuro.

### Validacoes executadas nesta auditoria

| Comando / verificacao | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS_COM_NOTA` - existem relatorios/docs tecnicos untracked e uma arvore `mockup/` untracked no estado final; `real_dev/` permanece ignorado. Nenhum destes ficheiros foi revertido ou apagado nesta auditoria. |
| `git check-ignore -v real_dev real_dev/web real_dev/api ...` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao real esta ignorada neste checkout. |
| `find . -maxdepth 3 -type d -name mockup -print` / estado final do workspace | `DRIFT_DE_ESTADO_LOCAL` - a verificacao inicial nao encontrou `mockup/`; no estado final, `git status --short --untracked-files=all` e `find mockup -maxdepth 1 -type d -print` mostram `mockup/` untracked disponivel. A decisao final considera o mockup presente. |
| `node --check real_dev/web/src/services/mockupAlignmentChecklist.js` | `PASS` - sem erro de sintaxe. |
| `node --check real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` - sem erro de sintaxe. |
| `node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js` | `PASS` - sem erro de sintaxe. |
| `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` - `BK-MF8-14 alinhamento visual validado: 3 ficheiros e 6 padroes.` |
| `npm --prefix real_dev/web run smoke:mf8-assisted-consultation` | `PASS` - `BK-MF8-13 UI integrada validada: 8 ficheiros e 32 contratos.` |
| `node --input-type=module -e 'import { validateBKMF814Evidence } ...'` com evidence valida | `PASS` - devolveu `{"bkId":"BK-MF8-14","status":"valid","domain":"mockup_alignment"}`. |
| `node --input-type=module -e '...'` com um unico screenshot | `PASS_NEGATIVO` - rejeitou com `Evidence visual precisa de screenshots desktop e mobile.` |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 87 modulos transformados. |
| `npm --prefix real_dev/api test` dentro da sandbox | `FAIL_AMBIENTE` - `listen EPERM: operation not permitted 0.0.0.0` em testes Supertest. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` - 38 ficheiros, 269 testes. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa estatica ampla por repos externos, placeholders, storage inseguro, logs sensiveis, segredos, pagamentos, RAG/embeddings e treino externo | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como historico de relatorios, checks anti-storage, fake secrets de teste, providers/pagamentos MF3/MF7 existentes e disclaimers de treino externo; sem fuga material nova no BK14. |
| Pesquisa focada nos ficheiros BK14 por storage inseguro, IDs internos, paths sensiveis, `payload: unknown`, `as any`, `TODO`, `FIXME`, `eval`, `new Function` e termos sensiveis | `PASS_COM_NOTA` - unicos hits sao texto defensivo no checklist (`tokens CSS` e `tokens ou dados biometricos`), nao uso de storage/token. |
| Leitura estatica de `mockup/README.md`, `mockup/src/app/App.tsx`, `mockup/src/app/docs/DESIGN-SYSTEM.md` e `mockup/src/app/docs/FEATURES.md` | `PASS_COM_FINDING` - confirmou referencia Figma, paleta/estrutura visual clara e fluxo de consultora IA; a implementacao BK14 auditada continua em `baseline`, gerando P1. |
| Inspeccao visual local de `real_dev/web/evidence/bk-mf8-14-desktop-hub.png` e `bk-mf8-14-mobile-hub-focused.png` | `FAIL_EVIDENCE_RNF26` - imagens desktop/mobile legiveis, mas em estado sem sessao e sem demonstrar comparacao contra mockup local. |
| `git diff --check` | `PASS` - sem whitespace errors em tracked changes. |
| `rg -n "[ \t]+$" ...ficheiros BK14 e relatorios...` | `PASS` - sem trailing whitespace. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-14`.
- Nenhum ficheiro de implementacao foi alterado nesta auditoria.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Validacoes nao executadas

- Comparacao visual completa mockup-vs-runtime: nao executada como correcao porque o modo e audit-only; a leitura estatica do mockup foi suficiente para confirmar o drift P1.
- QA/browser autenticado com utilizadores reais `cliente`, `consultor` e `administrador`: nao executado; ficou abrangido pelo P1 aberto por falta de screenshot autenticado/comparavel contra `mockup/`.
- E2E browser automatizado: nao existe script dedicado neste checkout para o fluxo BK14.
- Commit/push/PR: nao executados, conforme `PERMITIR_COMMITS=nao`.

### Decisao

`BK-MF8-14` fica `AUDITADO_COM_FINDINGS`: a implementacao real cumpre parte tecnica de suporte ao `RNF26` (hub do `BK-MF8-13`, CSS responsive, check estatico, contrato de evidence, build, smokes, suite API fora da sandbox, pesquisa estatica e planificacao), mas nao cumpre o fecho visual do BK no estado final do workspace porque `mockup/` existe e a implementacao/evidence continuam em modo `baseline`. O finding `ORELLE-MF8-BK14-P1-001` deve ser corrigido antes de tratar `BK-MF8-14` como fechado para `BK-MF8-15`/`BK-MF8-16`.

## 2026-07-07 - BK-MF8-13 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-13`
- Macro-fase canonica: `MF8`
- RF/RNF principais: `RF42`, `RF45`, `RF46`, `RNF26`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O contrato do `BK-MF8-13` foi comparado contra documentos canonicos, guia BK, implementacao real em `real_dev/api` e `real_dev/web`, dependencias vizinhas `BK-MF8-08` a `BK-MF8-12`, handoff para `BK-MF8-14`, testes focais, suite API completa, build web, smokes web, pesquisa estatica e validador de planificacao. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos durante esta auditoria; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

Nao existe directoria `mockup/` neste checkout. Para `BK-MF8-13`, `RNF26` foi auditado como integracao funcional e preparacao do acabamento visual; o polimento visual final continua no `BK-MF8-14`, conforme matriz/backlog e guia.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK13-P3-001 | P3 | `NAO_REPRODUZIDO` | Os testes HTTP/Supertest focados falharam no sandbox com `listen EPERM`/porta nula; a repeticao fora do sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RF42`/`RF45`/`RF46`/`RNF26`. | Continuar a repetir suites HTTP fora do sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0, P1 ou P2. Sem findings abertos apos esta auditoria.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RF42`/`RF45`/`RF46`/`RNF26` | `docs/RF.md:61` define avaliacao guiada; `docs/RF.md:62` define revisao humana por consultores; `docs/RF.md:63` define insights/correcoes visiveis ao cliente; `docs/RNF.md:85` exige aproximacao aos mockups nos ecras principais. |
| Canon BK e fronteiras vizinhas | `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:84` a `:89` e `docs/planificacao/backlogs/BACKLOG-MVP.md:112` a `:117` colocam `BK-MF8-13` depois de `BK-MF8-08` a `BK-MF8-12`, com requisitos `RF42`, `RF45`, `RF46`, `RNF26` e handoff para `BK-MF8-14`. |
| Guia BK sem drift de escopo | `docs/planificacao/guias-bk/MF8/BK-MF8-13-interface-integrada-cliente-consultor-para-consulta-assistida.md:29` descreve o problema de experiencia fragmentada; `:38` exige reutilizar paginas/endpoints dos BKs `08` a `12`; `:62` a `:66` enumera as paginas/endpoints pre-requisito; `:99` e `:153` a `:155` fixam `RNF26` como base funcional, deixando polimento visual para `BK-MF8-14`. |
| Navegacao integrada por role | `real_dev/web/src/services/assistedConsultationNavigation.js:1` a `:38` define paines canonicos separados para cliente e consultor; `:47` exige role `cliente`; `:58` permite `consultor` ou `administrador`; `:69` a `:75` devolve apenas os paines permitidos para a role autenticada. |
| Hub reutiliza as paginas dos BKs anteriores | `real_dev/web/src/pages/AssistedConsultationHubPage.jsx:7` a `:11` importa `AiHistoryPage`, `ClientAiInsightsPage`, `ConsultantAiReviewPage`, `GuidedConsultationPage` e `ProductRecommendationsPage`; `:21` a `:40` mapeia cada painel para a pagina existente; `:57` a `:62` usa `useAuth` e `getAssistedConsultationPanels`; `:71`, `:80` e `:89` cobrem loading, sem sessao e role sem acesso; `:113` e `:129` usam `aria-pressed` e `aria-live`. |
| Integracao no shell existente | `real_dev/web/src/App.jsx:17` importa `AssistedConsultationHubPage`; `:134` a `:157` preserva os ecras cliente existentes e monta o hub integrado; `:158` a `:163` mantem insights cliente; `:183` a `:191` preserva a seccao de consultoria existente para consultor/admin. |
| Autenticacao frontend por cookie HttpOnly | `real_dev/web/src/context/AuthContext.jsx:4` a `:8` declara que o estado vem de `/api/auth/me` via cookie HttpOnly; `:24` a `:26` carrega o utilizador autenticado; `real_dev/web/src/services/apiClient.js:81` a `:87` usa `credentials: "include"`. |
| Endpoints dos BKs `08` a `12` continuam protegidos no backend | `real_dev/api/src/app.js:89` a `:97` monta as routes de consulta IA, historico, insights, recomendacoes e revisao humana; `real_dev/api/src/routes/ai-consultation.routes.js:18` a `:37`, `ai-interaction-history.routes.js:19` a `:20`, `recommendation.routes.js:17` a `:30` e `client-ai-insight.routes.js:18` a `:19` usam `requireAuth`; `ai-consultation-review.routes.js:19` a `:35` combina `requireAuth` com `requireRole(ROLES.CONSULTOR, ROLES.ADMIN)`. |
| Contrato de evidencia BK13 | `real_dev/api/tests/evidence/bk-mf8-13.evidence-contract.js:1` a `:4` fixa `BK-MF8-13`, requisitos obrigatorios `RF42`, `RF45`, `RF46`, `RNF26`, minimo de 4 provas e 3 negativos; `:14` a `:48` valida a evidencia e devolve dominio `assisted_consultation_ui`. |
| Smoke estatico do hub | `real_dev/web/scripts/check-mf8-assisted-consultation-ui.mjs:80` a `:89` confirma import/montagem do hub e paginas integradas; `:102` a `:119` confirma exports das paginas dos BKs `08` a `12`; `:122` a `:128` proibe `localStorage`, `sessionStorage`, `/api/consultant`, `userId`, `analysisId` e `reportId` no hub; `:131` reporta `BK-MF8-13 UI integrada validada: 8 ficheiros e 32 contratos.` |

### Coerencia entre MFs e BKs vizinhos

- `MF0/MF7 -> MF8`: preservada. A UI depende de `useAuth` e `apiRequest` com cookie HttpOnly; nao guarda token em `localStorage`/`sessionStorage` nem decide ownership no browser.
- `BK-MF8-08 -> BK-MF8-13`: consumido. A pagina integrada reaproveita `GuidedConsultationPage` e os endpoints `/api/ai-consultation/sessions` protegidos por `requireAuth`.
- `BK-MF8-09 -> BK-MF8-13`: consumido. O historico cliente-IA entra como painel proprio, sem expor `userId`, `analysisId` ou `reportId` no hub.
- `BK-MF8-10 -> BK-MF8-13`: consumido. `ProductRecommendationsPage` continua a fornecer recomendacoes enriquecidas dentro do fluxo cliente, sem criar carrinho, checkout ou compra automatica.
- `BK-MF8-11 -> BK-MF8-13`: consumido. A revisao humana fica acessivel apenas a `consultor`/`administrador` pela navegacao do hub e continua protegida no backend por role.
- `BK-MF8-12 -> BK-MF8-13`: consumido. `ClientAiInsightsPage` fica disponivel no fluxo cliente e continua a depender do endpoint autenticado `/api/me/ai-consultation-insights`.
- `BK-MF8-13 -> BK-MF8-14`: preparado. A base funcional integrada existe; a aproximacao visual fina ao mockup continua fora deste BK.

### Validacoes executadas nesta auditoria

| Comando | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS_COM_NOTA` - apenas artefactos tecnicos/docs untracked ja existentes aparecem; `real_dev/` permanece ignorado conforme contrato do repo. |
| `git check-ignore -v real_dev real_dev/api real_dev/web real_dev/web/src/pages/AssistedConsultationHubPage.jsx real_dev/api/tests/evidence/bk-mf8-13.evidence-contract.js` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao real esta ignorada. |
| `node --check real_dev/web/src/services/assistedConsultationNavigation.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/web/scripts/check-mf8-assisted-consultation-ui.mjs` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/tests/evidence/bk-mf8-13.evidence-contract.js` | `PASS` - sem erros de sintaxe. |
| `node --input-type=module -e 'import { validateBKMF813Evidence } ...'` | `PASS` - devolveu `{"bkId":"BK-MF8-13","status":"valid","domain":"assisted_consultation_ui"}`. |
| `npm --prefix real_dev/web run smoke:mf8-assisted-consultation` | `PASS` - `BK-MF8-13 UI integrada validada: 8 ficheiros e 32 contratos.` |
| `npm --prefix real_dev/web run smoke:mf8-consultation` | `PASS` - `BK-MF8-08 guided consultation page check passed`. |
| `npm --prefix real_dev/web run smoke:mf8-ai-history` | `PASS` - `BK-MF8-09 frontend smoke OK`. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 86 modulos transformados. |
| `npm --prefix real_dev/api test -- tests/mf8.ai-consultation-review.test.js tests/mf8.client-insights.test.js` | Primeiro `FAIL_AMBIENTE` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 2 ficheiros, 15 testes. |
| `npm --prefix real_dev/api test` | `PASS` fora do sandbox - 38 ficheiros, 269 testes. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa estatica ampla por repos externos, placeholders, storage inseguro, logs sensiveis, secrets, pagamentos, RAG/embeddings e treino externo | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como testes/stubs MF3 Stripe/PayPal/MBWay, fake secrets de teste, checks anti-`localStorage`/`sessionStorage`, provider/pagamentos existentes e historico de relatorios; sem fuga material nova no BK13. |
| Pesquisa focada no hub por `localStorage`, `sessionStorage`, `/api/consultant`, `userId`, `analysisId` e `reportId` | `PASS` - o smoke BK13 proibe esses termos no hub e a pagina integrada nao os contem. |
| `git diff --check` | `PASS` - sem whitespace errors em tracked changes. |
| `rg -n "[ \t]+$" docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md` | `PASS` - sem trailing whitespace no relatorio atualizado. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-13`.
- Nenhum ficheiro de implementacao foi alterado nesta auditoria.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum para `BK-MF8-13` no estado atual auditado.
- Pendente operacional: QA manual/browser com utilizador cliente, consultor e administrador reais seedados nao foi executada; a cobertura automatica valida navegacao integrada, role gates, endpoints backend, suite API completa, build web, planificacao e pesquisa estatica.
- Pendente ambiental: manter a regra de repetir Supertest fora do sandbox quando surgir `listen EPERM`.
- Pendente visual: a directoria `mockup/` nao existe neste checkout; a validacao visual fina de `RNF26` fica para `BK-MF8-14`.

### Decisao

`BK-MF8-13` fica `AUDITADO_OK`: a implementacao real integra, num hub navegavel, as superficies cliente e consultor dos BKs `BK-MF8-08` a `BK-MF8-12`, separa paines por role, preserva autenticacao por cookie HttpOnly e autorizacao backend, nao introduz endpoints novos nem storage local, mantem o fluxo de compra fora do escopo, valida evidencia minima de `RF42`/`RF45`/`RF46`/`RNF26` e passa smokes web, build, testes API, pesquisa estatica e validador de planificacao.

## 2026-07-06 - BK-MF8-12 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-12`
- Macro-fase canonica: `MF8`
- RF/RNF principais: `RF46`, com fronteira de seguranca herdada de `RNF31`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O contrato do `BK-MF8-12` foi comparado contra documentos canonicos, guia BK, implementacao real em `real_dev/api` e `real_dev/web`, dependencias vizinhas `BK-MF8-09`, `BK-MF8-10`, `BK-MF8-11`, handoff para `BK-MF8-13`, testes focais, suite API completa, build web, pesquisa estatica, validador de planificacao e coerencia com MFs anteriores. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos durante esta auditoria; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK12-P3-001 | P3 | `NAO_REPRODUZIDO` | Os testes HTTP/Supertest focados falharam no sandbox com `listen EPERM`/porta nula; a repeticao fora do sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RF46`/fronteira `RNF31`. | Continuar a repetir suites HTTP fora do sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0, P1 ou P2. Sem findings abertos apos esta auditoria.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RF46` e fronteira `RNF31` | `docs/RF.md:63` exige que o cliente consulte insights/correcoes do consultor associados a sessao/recomendacoes; `docs/RNF.md:58` exige acessos autenticados, autorizados, auditaveis e limitados a DTO seguro para sessoes IA. |
| Canon BK e fronteiras vizinhas | `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:87` a `:89` coloca `BK-MF8-11 -> BK-MF8-12 -> BK-MF8-13`; `docs/planificacao/backlogs/BACKLOG-MVP.md:115` a `:117` confirma a mesma cadeia e associa `BK-MF8-12` a `RF46`. |
| Guia BK sem drift de escopo | `docs/planificacao/guias-bk/MF8/BK-MF8-12-insights-correcoes-do-consultor-visiveis-para-o-cliente.md:24` a `:32` define endpoint autenticado, filtro `consultationSessionId`, DTO publico, pagina cliente e testes; `:46` a `:55` fixa os ficheiros esperados; `:59` a `:68` exclui decisao do consultor, notas internas, fotografias, storage keys, prompts, consentimentos internos, checkout, carrinho e alteracao de auth global. |
| Fronteira teorica do DTO e ownership | `docs/planificacao/guias-bk/MF8/BK-MF8-12-insights-correcoes-do-consultor-visiveis-para-o-cliente.md:111` a `:119` separa camada privada de consultor da camada publica de cliente e exige que `userId` venha da sessao autenticada, nao do browser; `:123` a `:131` define o fluxo `GET /api/me/ai-consultation-insights`. |
| DTO publico reutilizado e reforcado | `real_dev/api/src/services/ai-consultation-review.service.js:229` a `:257` devolve apenas `id`, `consultationSessionId`, `status`, `note`, `publishedAt`, `reviewedAt` e `recommendations`, recusando reviews sem `publicInsight` ou sem estado final. |
| Listagem por cliente autenticado | `real_dev/api/src/services/ai-consultation-review.service.js:272` a `:297` consulta por `userId: clientUserId`, estados finais `approved`/`adjusted`, `publicInsight` nao nulo, filtro opcional `consultationSessionId`, populate minimizado de recomendacoes e limite `CLIENT_INSIGHT_LIMIT`. |
| Validator de query | `real_dev/api/src/validators/client-ai-insight.validator.js:15` a `:29` normaliza `consultationSessionId`, aceita ausencia do filtro e rejeita ObjectId invalido com `400`. |
| Controller com ownership backend | `real_dev/api/src/controllers/client-ai-insight.controller.js:17` a `:26` valida query, chama o service com `req.user.id` e devolve `{ insights }`, sem aceitar `userId` vindo do cliente. |
| Route autenticada e montagem Express | `real_dev/api/src/routes/client-ai-insight.routes.js:17` a `:21` define `GET /me/ai-consultation-insights` com `requireAuth`; `real_dev/api/src/app.js:15` importa a route e `:89` a `:91` monta em `/api`. |
| UI cliente integrada | `real_dev/web/src/pages/ClientAiInsightsPage.jsx:73` a `:205` chama `/me/ai-consultation-insights`, envia apenas filtro opcional codificado, usa `apiRequest`/cookie HttpOnly, cobre loading/error/empty/success e mostra nota publica, datas e recomendacoes afetadas. |
| Pagina no fluxo de cliente | `real_dev/web/src/App.jsx:23` importa `ClientAiInsightsPage`; `:148` a `:153` integra a pagina junto de recomendacoes, fora da area de consultor/admin. |
| Teste focal BK12 | `real_dev/api/tests/mf8.client-insights.test.js:128` a `:224` cobre sem sessao, ObjectId invalido, query com `userId` da sessao, filtro por sessao, remocao de review sem `publicInsight` e ausencia de `userId`, `internalNote`, `reviewedBy`, `auditTrail` e `actorId` no DTO publico. |
| Regressao DTO BK11 -> BK12 | `real_dev/api/tests/mf8.ai-consultation-review.test.js:270` a `:319` prova que `toPublishedConsultantInsightDto(...)` exporta DTO publico reutilizavel sem nota interna. |

### Coerencia entre MFs e BKs vizinhos

- `MF0/MF7 -> MF8`: preservada. A leitura cliente depende de `requireAuth` e cookie HttpOnly ja existentes; a UI usa `apiRequest` e nao guarda tokens ou cookies manualmente.
- `BK-MF8-09 -> BK-MF8-12`: preservada. O filtro `consultationSessionId` restringe a listagem dentro do cliente autenticado, sem expor historico bruto, fotografias, prompts, consentimentos ou storage keys.
- `BK-MF8-10 -> BK-MF8-12`: preservada. As recomendacoes afetadas seguem no DTO publico como contexto de leitura e nao criam carrinho, checkout, compra ou recomendacao comercial final automatica.
- `BK-MF8-11 -> BK-MF8-12`: fechado. O cliente ve apenas reviews finalizadas com `publicInsight`; a decisao do consultor, `internalNote`, `reviewedBy`, `auditTrail` e `actorId` continuam fora do DTO cliente.
- `BK-MF8-12 -> BK-MF8-13`: preparado. O guia `BK-MF8-13` exige reutilizar `ClientAiInsightsPage` e endpoint `/api/me/ai-consultation-insights` (`docs/planificacao/guias-bk/MF8/BK-MF8-13-interface-integrada-cliente-consultor-para-consulta-assistida.md:60` a `:68`), sem criar novos endpoints backend.

### Validacoes executadas nesta auditoria

| Comando | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS_COM_NOTA` - apenas os relatorios tecnicos MF8 aparecem como untracked; `real_dev/` permanece ignorado conforme contrato do repo. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao real esta ignorada. |
| `node --check` nos ficheiros `ai-consultation-review.service.js`, `client-ai-insight.validator.js`, `client-ai-insight.controller.js` e `client-ai-insight.routes.js` | `PASS` - sem erros de sintaxe. |
| `npm --prefix real_dev/api test -- tests/mf8.ai-consultation-review.test.js tests/mf8.client-insights.test.js` | Primeiro `FAIL_AMBIENTE` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 2 ficheiros, 15 testes. |
| `npm --prefix real_dev/api test` | `PASS` fora do sandbox - 38 ficheiros, 269 testes. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 84 modulos transformados. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa canonica por `RF46`, `RF45`, `RNF31`, `BK-MF8-11`, `BK-MF8-12` e `BK-MF8-13` | `PASS` - RF, RNF, matriz, backlog, anexos e MF views convergem para o escopo esperado. |
| Pesquisa estatica por endpoint, DTO publico, `publicInsight`, campos internos e pagina cliente | `PASS_COM_RESIDUAIS_ESPERADOS` - ocorrencias de `internalNote`, `reviewedBy`, `auditTrail` e `actorId` estao no modelo/service privado ou em testes que provam ausencia desses campos no DTO cliente. |
| Pesquisa estatica de storage/secrets/tokens/cookies manuais/pagamentos/carrinho/provider IA/RAG/embeddings no controller, route, validator e pagina BK12 | `PASS_COM_NOTA` - unica ocorrencia relevante e comentario de ownership em `client-ai-insight.controller.js:20`; nao ha armazenamento local, bearer token, cookie manual, checkout, pagamento, carrinho, provider IA, RAG ou embeddings nesta superficie. |
| `git diff --check` | `PASS` - sem whitespace errors em tracked changes. |
| `rg -n "[ \t]+$" docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md` | `PASS` - sem trailing whitespace no relatorio atualizado. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-12`.
- Nenhum ficheiro de implementacao foi alterado nesta auditoria.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum para `BK-MF8-12` no estado atual auditado.
- Pendente operacional: QA manual/browser com utilizador cliente e consultor reais seedados nao foi executada; a cobertura automatica valida API, DTOs, ownership, filtros, suite completa, build web, planificacao e pesquisa estatica.
- Pendente ambiental: manter a regra de repetir Supertest fora do sandbox quando surgir `listen EPERM`.

### Decisao

`BK-MF8-12` fica `AUDITADO_OK`: a implementacao real cumpre `RF46`, preserva a fronteira privada herdada de `RNF31`, expoe insights/correcoes publicados apenas ao cliente autenticado dono da sessao, valida `consultationSessionId`, filtra por estado final e `publicInsight`, nao devolve campos internos, integra a pagina cliente no frontend e valida o contrato com testes focais, suite API completa, build web, pesquisa estatica e validador de planificacao.

## 2026-07-06 - BK-MF8-11 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-11`
- Macro-fase canonica: `MF8`
- RF/RNF principais: `RF45`, `RNF31`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O contrato do `BK-MF8-11` foi comparado contra documentos canonicos, guia BK, implementacao real em `real_dev/api` e `real_dev/web`, dependencias `BK-MF2-06`, `BK-MF8-09`, `BK-MF8-10`, handoff para `BK-MF8-12`, testes focais, regressao API MF2/MF4/MF8, suite API completa, build web, smokes web, pesquisa estatica, validador de planificacao e coerencia com MFs anteriores. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos durante esta auditoria; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK11-P3-001 | P3 | `NAO_REPRODUZIDO` | Os testes HTTP/Supertest focados falharam no sandbox com `listen EPERM`/porta nula; a repeticao fora do sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RF45`/`RNF31`. | Continuar a repetir suites HTTP fora do sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0, P1 ou P2. Sem findings abertos apos esta auditoria.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RF45`/`RNF31` | `docs/RF.md:62` exige que consultores revejam sessoes IA submetidas e adicionem insights/correcoes; `docs/RNF.md:58` exige acessos autenticados, autorizados, auditaveis e limitados a DTO seguro. |
| Canon BK e fronteiras vizinhas | `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:86` a `:89` coloca `BK-MF8-11` como P0, dependente de `BK-MF2-06`, `BK-MF8-09` e `BK-MF8-10`, com handoff para `BK-MF8-12` e depois `BK-MF8-13`. |
| Guia BK sem drift de escopo | `docs/planificacao/guias-bk/MF8/BK-MF8-11-revisao-humana-de-sessoes-ia-por-consultores.md:21` a `:33` define fluxo completo de revisao humana; `:41` a `:49` fixa fila, detalhe seguro, decisoes, nota publica/interna, audit trail, DTO publico e teste focal; `:51` a `:59` bloqueia clinica, fotografias, chaves internas, cookies, tokens, consentimentos, provider IA novo, checkout, pagamentos, carrinho e publicacao de notas internas. |
| Modelo persistente e auditavel | `real_dev/api/src/models/ai-consultation-review.model.js:12` a `:17` define estados; `:19` a `:34` separa `publicInsight`; `:36` a `:58` guarda `actorId`, `actorRole`, acao e data no audit trail; `:61` a `:125` persiste `userId`, `consultationSessionId`, recomendacoes, estado, resumo, fontes, limitacoes, nota publica, nota interna, revisor e datas; `:128` a `:130` indexa fila e ownership por sessao. |
| Validator de input | `real_dev/api/src/validators/ai-consultation-review.validator.js:7` a `:11` limita decisoes a `approved`, `adjusted` e `needs_clarification`; `:68` a `:76` valida `reviewId`; `:87` a `:126` valida body, obrigatoriedade de nota publica/interna e IDs de recomendacoes ajustadas. |
| DTOs seguros e handoff BK12 | `real_dev/api/src/services/ai-consultation-review.service.js:95` a `:106` devolve fila sem `userId`/`consultationSessionId`; `:116` a `:132` devolve detalhe minimizado, sem `actorId`; `:228` a `:246` exporta `toPublishedConsultantInsightDto(...)` com apenas insight publico, estado, datas, sessao e recomendacoes. |
| Criacao da revisao a partir do BK10 | `real_dev/api/src/services/recommendation.service.js:15` importa o service de review; `:480` a `:484` cria/refresca a revisao quando existem recomendacoes enriquecidas com `consultationSessionId`; `real_dev/api/src/services/ai-consultation-review.service.js:182` a `:219` cria fila pendente, limpa notas anteriores e inicializa `auditTrail` sem expor dados crus. |
| Decisao humana com ownership backend | `real_dev/api/src/services/ai-consultation-review.service.js:301` a `:315` recusa recomendacoes fora da revisao; `:328` a `:342` actualiza recomendacoes ajustadas filtrando tambem por `userId`; `:355` a `:400` bloqueia revisoes fechadas, grava `reviewedBy`, `reviewedAt`, `publicInsight`, `internalNote` e evento de auditoria. |
| Routes protegidas por sessao e role | `real_dev/api/src/controllers/ai-consultation-review.controller.js:24` a `:70` liga listagem, detalhe e decisao ao validator/service; `real_dev/api/src/routes/ai-consultation-review.routes.js:18` a `:37` protege os tres endpoints com `requireAuth` e `requireRole(ROLES.CONSULTOR, ROLES.ADMIN)`; `real_dev/api/src/app.js:13` e `:95` montam a route em `/api`. |
| UI de consultor/admin | `real_dev/web/src/pages/ConsultantAiReviewPage.jsx:54` a `:65` carrega a fila; `:76` a `:93` abre detalhe; `:104` a `:137` submete decisao com nota publica, nota interna e recomendacao ajustada; `:143` a `:249` renderiza fila, detalhe, recomendacoes e formulario. `real_dev/web/src/App.jsx:23` importa a pagina e `:164` a `:173` renderiza apenas para consultor/admin. |
| Teste focal BK11 | `real_dev/api/tests/mf8.ai-consultation-review.test.js:133` a `:148` cobre sem sessao e role cliente; `:150` a `:180` cobre lista/detalhe sem `userId`, `consultationSessionId` ou `actorId`; `:183` a `:190` cobre decisao invalida; `:192` a `:229` cobre decisao ajustada e audit trail; `:231` a `:268` cobre recomendacao externa e revisao fechada; `:270` a `:295` cobre DTO publico sem nota interna. |
| Regressao BK10 -> BK11 | `real_dev/api/tests/mf8.enriched-recommendations.test.js:367` a `:382` prova que gerar recomendacoes enriquecidas com sessao guiada cria/refresca uma revisao pendente, sem `publicInsight`/`internalNote` e com `auditTrail` inicial. |

### Coerencia entre MFs e BKs vizinhos

- `MF2 -> MF8`: preservada. As roles existentes `consultor` e `administrador` continuam a ser a fronteira de backend; o fluxo antigo de revisao manual de recomendacoes nao foi substituido nem quebrado.
- `BK-MF8-09 -> BK-MF8-11`: preservada. A revisao usa sessoes IA e contexto minimizado sem expor fotografias, prompts internos, storage keys, consentimentos, cookies ou tokens.
- `BK-MF8-10 -> BK-MF8-11`: consumido. A geracao de recomendacoes enriquecidas com `consultationSessionId` passa a alimentar a fila de revisao humana sem criar endpoint paralelo de recomendacoes.
- `BK-MF8-11 -> BK-MF8-12`: preparado. O service exporta DTO publico reutilizavel pelo proximo BK, mantendo `internalNote`, `actorId` e campos de controlo fora da camada cliente.
- `BK-MF8-13` futuro: preservado fora de escopo. A app tem superficie de consultor, mas nao implementa ainda interface integrada final, endpoint cliente de insights, chat livre, RAG, embeddings, provider IA novo, checkout, pagamentos, carrinho ou compra automatica.

### Validacoes executadas nesta auditoria

| Comando | Resultado |
| --- | --- |
| `git status --short` | `PASS_COM_NOTA` - apenas os relatorios tecnicos MF8 aparecem como untracked; `real_dev/` permanece ignorado conforme contrato do repo. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao real esta ignorada. |
| `find . -maxdepth 2 -type d -name mockup -print` | `PASS` - sem pasta `mockup/` neste checkout. |
| `node --check` nos ficheiros BK11 de model, validator, service, controller, route e `recommendation.service.js` | `PASS` - sem erros de sintaxe. |
| `npm --prefix real_dev/api test -- tests/mf8.ai-consultation-review.test.js tests/mf8.enriched-recommendations.test.js` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 2 ficheiros, 14 testes. |
| `npm --prefix real_dev/api test -- tests/mf2.integration.test.js tests/mf4.integration.test.js tests/mf8.ai-consultation.test.js tests/mf8.ai-interaction-history.test.js tests/mf8.recommendation-explainability.test.js tests/mf8.enriched-recommendations.test.js tests/mf8.ai-consultation-review.test.js` | `PASS` fora do sandbox - 7 ficheiros, 57 testes. |
| `npm --prefix real_dev/api test` | `PASS` fora do sandbox - 37 ficheiros, 263 testes. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 83 modulos transformados. |
| `npm --prefix real_dev/web run smoke:mf2` | `PASS` - `MF2 recommendations smoke passed: build, mounting and API contracts are present.` |
| `npm --prefix real_dev/web run smoke:mf8-consultation` | `PASS` - `BK-MF8-08 guided consultation page check passed`. |
| `npm --prefix real_dev/web run smoke:mf8-ai-history` | `PASS` - `BK-MF8-09 frontend smoke OK`. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa canonica por `RF45`, `RNF31`, `BK-MF8-10`, `BK-MF8-11`, `BK-MF8-12` e `consultor` | `PASS` - RF, RNF, matriz, backlog, anexos, MF views, README e guia convergem para o escopo esperado. |
| Pesquisa estatica por storage inseguro, secrets, tokens, cookies, pagamentos, checkout/carrinho, fotografias, prompts e provider IA no BK11 | `PASS` - sem ocorrencias nos ficheiros runtime BK11 auditados. |
| Pesquisa focada por `sourceSignals`, `actorId`, `userId`, `consultationSessionId`, `internalNote`, `publicInsight`, `auditTrail`, `imageUrl` | `PASS_COM_RESIDUAIS_ESPERADOS` - ocorrencias sao campos internos de modelo/service/testes ou DTO de produto; testes provam ausencia de `userId`, `consultationSessionId`, `actorId` e nota interna nos DTOs publicos relevantes. |
| `git diff --check` | `PASS` - sem whitespace errors em tracked changes. |
| `rg -n "[ \t]+$" ...ficheiros auditados e relatorios...` | `PASS` - sem trailing whitespace nos ficheiros e relatorios auditados. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-11`.
- Nenhum ficheiro de implementacao foi alterado nesta auditoria.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum para `BK-MF8-11` no estado atual auditado.
- Pendente operacional: QA manual/browser com utilizador consultor/admin real seedado nao foi executado; as validacoes automaticas cobrem service, API, roles, DTOs, integracao BK10, suite API completa, build, smokes web e planificacao.
- Pendente ambiental: manter a regra de repetir Supertest fora do sandbox quando surgir `listen EPERM`.

### Decisao

`BK-MF8-11` fica `AUDITADO_OK`: a implementacao real cumpre `RF45` e `RNF31`, cria fila protegida de revisoes IA para consultores/admins, oferece detalhe minimizado, valida decisoes humanas, separa nota publica de nota interna, grava audit trail, actualiza recomendacoes ajustadas com filtro por `userId`, exporta DTO publico para `BK-MF8-12`, integra a pagina de consultor no frontend e valida o contrato com testes focais, regressões API, suite completa, build, smokes e pesquisa estatica.

## 2026-07-06 - BK-MF8-10 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-10`
- Macro-fase canonica: `MF8`
- RF/RNF principais: `RF43`, `RNF23`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O contrato do `BK-MF8-10` foi comparado contra documentos canonicos, guia BK, implementacao real em `real_dev/api` e `real_dev/web`, BKs vizinhos `BK-MF8-09` e `BK-MF8-11`, teste focal BK10, regressões MF2/MF4/MF8, suite API completa, build web, smokes web, pesquisa estatica, validador de planificacao e coerencia com MFs anteriores. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos durante esta auditoria; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK10-P1-001 | P1 | `JA_CORRIGIDO` | O fluxo `POST /api/recommendations/generate` aceita body opcional validado, passa `consultationSessionId`/`historyLimit` do controller para o service, consome `listRecommendationHistoryContext(...)` com `userId` autenticado, reforca ranking com sinais guiados seguros e acrescenta fontes publicas de avaliacao guiada. | O requisito central de `RF43` fica cumprido no estado atual: recomendacoes combinam analise, relatorio, perfil, restricoes, produtos com stock e contexto guiado minimizado, sem compra automatica nem ownership no frontend. | Manter a cobertura focal BK10 e reutilizar este contrato em `BK-MF8-11` sem criar endpoint/schema paralelo. |
| ORELLE-MF8-BK10-P2-002 | P2 | `JA_CORRIGIDO` | Existem `real_dev/api/src/validators/recommendation-generation.validator.js` e `real_dev/api/tests/mf8.enriched-recommendations.test.js`, cobrindo body vazio, limite de historico, ID invalido, happy path enriquecido, ownership via `req.user.id` e sessao sem historico acessivel. | A regressao principal de BK10 fica coberta por teste focado e pelas regressões MF2/MF4/MF8. | Em QA final, acrescentar apenas smoke/browser autenticado com dados reais seedados, se houver ambiente preparado. |

Sem findings P0 ou P3. Sem findings abertos apos esta auditoria.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RF43`/`RNF23` | `docs/RF.md:77` exige que recomendacoes usem analise, relatorio, historico, respostas guiadas, restricoes e produtos reais com stock; `docs/RNF.md:98` exige explicabilidade das recomendacoes. |
| Canon BK e handoff | `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:86` coloca `BK-MF8-10` como P0, dependente de `BK-MF2-02`, `BK-MF4-08` e `BK-MF8-09`, com handoff para `BK-MF8-11`; `:87` confirma que `BK-MF8-11` depende deste BK. |
| Guia BK sem ambiguidade | `docs/planificacao/guias-bk/MF8/BK-MF8-10-recomendacoes-enriquecidas-com-respostas-da-avaliacao-guiada.md:27` a `:44` exige transformar recomendacoes base em recomendacoes enriquecidas, ler historico IA seguro, ajustar ranking com sinais guiados, reutilizar restricoes e actualizar controller/service/UI/testes; `:61` a `:63` exige `POST /api/recommendations/generate` com contexto opcional, ownership backend e UI com/sem sessao; `:98` a `:104` fixa `RF43`, `RNF23`, `consultationSessionId`, `listRecommendationHistoryContext` e `guided_context_match`; `:108` a `:116` descreve o fluxo esperado. |
| Input opcional validado | `real_dev/api/src/validators/recommendation-generation.validator.js:20` a `:28` limita `historyLimit` a 1..10; `:39` a `:49` normaliza `consultationSessionId` opcional e rejeita ObjectIds invalidos; `:60` a `:72` rejeita bodies nao objeto e devolve `{ consultationSessionId, historyLimit }`. |
| Controller preserva ownership backend | `real_dev/api/src/controllers/recommendation.controller.js:15` a `:22` valida `req.body`, passa input normalizado e usa `req.user.id` como unica fonte de dono. |
| Contexto BK09 consumido com filtro seguro | `real_dev/api/src/services/recommendation.service.js:334` a `:360` carrega contexto apenas quando `consultationSessionId` existe, chama `listRecommendationHistoryContext(userId, { sessionId, limit })` e devolve `404` controlado para sessao inexistente/de outro utilizador sem revelar qual caso ocorreu. |
| Ranking enriquecido sem substituir a analise | `real_dev/api/src/services/recommendation.service.js:146` a `:188` transforma sinais seguros em palavras-chave controladas; `:257` a `:283` aplica boost maximo pequeno (`0.24`) e cria `guided_context_match`/`guidedContext:*`; `:371` a `:479` combina analise, relatorio, perfil, restricoes, stock, contexto guiado, `buildRecommendationReason(...)`, fairness guard e persistencia da recomendacao. |
| Explicabilidade publica reforcada | `real_dev/api/src/services/recommendation-reason.service.js:9` a `:27` reconhece `guided_context_match` e `guidedContext` como motivo/fonte publica; `:78` a `:91` converte sinais internos para `sourceLabels`; `:102` a `:140` bloqueia recomendacoes sem motivo/fonte publica e mantem limitacoes cosmeticas. |
| Base MF2/MF4 preservada | `real_dev/api/src/services/recommendation.service.js:293` a `:312` continua a exigir analise e relatorio; `:324` a `:331` exige perfil; `:379` a `:382` filtra produtos com `stock > 0` e remove produtos bloqueados por restricoes; `:418` a `:420` continua a bloquear catalogo insuficiente. |
| UI chama endpoint real com ou sem sessao guiada | `real_dev/web/src/pages/ProductRecommendationsPage.jsx:47` a `:91` adiciona estado `consultationSessionId`, envia `{}` ou `{ consultationSessionId, historyLimit: 5 }` para `/recommendations/generate` via `apiRequest`; `:161` a `:171` expoe campo opcional; `:181` a `:227` mostra produto, score, preco, stock, motivos, `sourceLabels`, limitacoes e feedback. |
| Teste focal BK10 | `real_dev/api/tests/mf8.enriched-recommendations.test.js:309` a `:331` cobre body vazio, limite e ID invalido; `:334` a `:364` cobre recomendacao enriquecida com contexto filtrado por ownership, `guided_context_match`, `sourceLabels` e ausencia de `userId`/`sessionId`; `:366` a `:383` cobre sessao sem historico acessivel e garante que catalogo/persistencia nao correm nesse caso. |
| Comercio e seguranca nao foram enfraquecidos | `ProductRecommendationsPage.jsx:211` a `:221` apenas envia feedback `util`/`nao_relevante`; nao ha chamada para carrinho no fluxo de recomendacao. A pesquisa estatica nao encontrou `localStorage`/`sessionStorage` na pagina de recomendacoes e os DTOs continuam sem `sourceSignals`, fotografias, consentimentos, prompts, tokens ou paths internos. |

### Coerencia entre MFs e BKs vizinhos

- `MF2 -> MF8`: preservada. As recomendacoes base continuam funcionais e foram enriquecidas sem quebrar o endpoint existente; body vazio continua valido e o fluxo antigo mantem fallback honesto.
- `MF4 -> MF8`: preservada na base atual. `filterProductsBlockedByProfile(...)` continua a remover produtos incompativeis com alergias/ingredientes a evitar antes do ranking.
- `BK-MF8-08 -> BK-MF8-09`: preservado. A sessao guiada e o historico IA seguro existem e foram validados por testes/smokes.
- `BK-MF8-09 -> BK-MF8-10`: preservado e consumido. `listRecommendationHistoryContext(...)` e chamado apenas com `userId` autenticado e `sessionId` opcional validado.
- `BK-MF8-10 -> BK-MF8-11`: preparado. Recomendacoes enriquecidas persistem motivo, fontes publicas, limitacoes e estado sem criar contrato paralelo para revisao humana.
- `MF8 futura`: preservada fora de escopo. Nao foram introduzidos chat livre, RAG, embeddings, provider IA novo, diagnostico medico, checkout, pagamento, webhook, roles novas ou compra automatica.

### Validacoes executadas nesta auditoria

| Comando | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS_COM_NOTA` - os relatorios tecnicos MF8 aparecem como untracked; `real_dev/` permanece ignorado conforme contrato do repo. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao real esta ignorada, como previsto. |
| `find . -maxdepth 2 -type d -name mockup -print` | `PASS` - sem pasta `mockup/` neste checkout. |
| `node --check real_dev/api/src/services/recommendation.service.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/controllers/recommendation.controller.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/routes/recommendation.routes.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/validators/recommendation-generation.validator.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/services/ai-interaction-history.service.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/web/scripts/smoke-mf2-recommendations.mjs` | `PASS` - sem erros de sintaxe. |
| Pesquisa canonica por `RF43`, `RNF23`, `BK-MF8-10`, `BK-MF8-09`, `BK-MF8-11` | `PASS` - RF, RNF, matriz, backlog, anexos, README e guia convergem para o escopo esperado. |
| Pesquisa focada por `consultationSessionId`, `historyLimit`, `guided_context_match`, `listRecommendationHistoryContext` | `PASS` - termos aparecem no validator, controller/service de recomendacoes, UI e teste focal BK10. |
| Pesquisa estatica ampla por repos externos, placeholders, storage inseguro, logs sensiveis, secrets, pagamentos, RAG/embeddings e treino externo | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como pagamentos/testes MF3 existentes, checks anti-`localStorage`/`sessionStorage`, fake secrets de teste, provider/payment ja existente, comentarios defensivos e negativos como `skin_secret`; sem fuga material nova no BK10. |
| `npm --prefix real_dev/api test -- tests/mf8.enriched-recommendations.test.js` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox passou apos ajuste de fixture: 1 ficheiro, 5 testes. |
| `npm --prefix real_dev/api test -- tests/mf2.integration.test.js tests/mf4.integration.test.js tests/mf8.recommendation-explainability.test.js tests/mf8.ai-interaction-history.test.js tests/mf8.enriched-recommendations.test.js` | `PASS` fora do sandbox - 5 ficheiros, 40 testes. |
| `npm --prefix real_dev/api test` | `PASS` fora do sandbox - 36 ficheiros, 254 testes. |
| `npm --prefix real_dev/web run smoke:mf2` | `PASS` - `MF2 recommendations smoke passed: build, mounting and API contracts are present.` |
| `npm --prefix real_dev/web run smoke:mf8-ai-history` | `PASS` - `BK-MF8-09 frontend smoke OK`. |
| `npm --prefix real_dev/web run smoke:mf8-consultation` | `PASS` - `BK-MF8-08 guided consultation page check passed`. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 82 modulos transformados. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| `git diff --check` | `PASS` - sem whitespace errors em tracked changes. |
| `rg -n "[ \t]+$" ...ficheiros tocados...` | `PASS` - sem trailing whitespace nos ficheiros e relatorio auditados. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-10`.
- Nenhum ficheiro de implementacao foi alterado.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum para `BK-MF8-10` no estado atual auditado.
- Pendente operacional: QA manual/browser com utilizador real seedado nao foi executado; as validacoes automaticas cobrem service/API base, historico IA, explicabilidade, suite API completa, build, smokes web e planificacao.
- Pendente ambiental: manter a regra de repetir Supertest/build Vite fora do sandbox quando surgir `listen EPERM` ou `EPERM` de ficheiro temporario.

### Decisao

`BK-MF8-10` fica `AUDITADO_OK`: a implementacao real cumpre `RF43` e reforca `RNF23`, mantendo recomendacoes base compativeis, aceitando sessao guiada opcional validada, consumindo historico IA minimizado por ownership backend, ajustando ranking com boost limitado, devolvendo fontes publicas e limitacoes seguras, respeitando restricoes/stock, separando recomendacao de compra/carrinho e validando o contrato com teste focal, regressões API, build e smokes web.

## 2026-07-06 - BK-MF8-09 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-09`
- Macro-fase canonica: `MF8`
- RF/RNF principais: `RF47`, `RNF30`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O contrato do `BK-MF8-09` foi comparado contra documentos canonicos, guia BK, implementacao real em `real_dev/api` e `real_dev/web`, testes focais, suite API completa, build web, smokes web, pesquisa estatica, validador de planificacao e coerencia com `BK-MF8-08`, `BK-MF8-10` e MFs anteriores. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK09-P3-001 | P3 | `NAO_REPRODUZIDO` | Os testes HTTP/Supertest focados falharam no sandbox com `listen EPERM`/porta nula; a repeticao fora do sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RF47`/`RNF30`. | Continuar a repetir suites HTTP fora do sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0, P1 ou P2.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RF47`/`RNF30` | `docs/RF.md:64` define historico da interacao cliente-IA guardado de forma minimizada e consultavel pelo proprio cliente; `docs/RNF.md:57` exige minimizacao, encriptacao/privacidade e ausencia de fotografias, storage keys, consent IDs ou prompts internos. |
| Canon BK e fronteiras vizinhas | `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:84` a `:87` e `docs/planificacao/backlogs/BACKLOG-MVP.md:112` a `:115` colocam `BK-MF8-09` como P0, dependente de `BK-MF8-08` e `BK-MF6-07`, com handoff para `BK-MF8-10`; `BK-MF8-11` continua fora deste escopo. |
| Guia BK sem drift de escopo | `docs/planificacao/guias-bk/MF8/BK-MF8-09-historico-seguro-da-interacao-cliente-ia.md:37` a `:47` exige modelo, cifra, service, route autenticada, frontend e testes; `:48` a `:55` bloqueia chat livre, recomendacoes enriquecidas, IDs internos, fotografias, prompts, consentimentos, tokens, cookies e ownership vindo do frontend; `:90` a `:107` descreve o fluxo `record -> encrypt -> GET /api/me/ai-interactions -> DTO publico`. |
| Modelo de historico minimizado | `real_dev/api/src/models/ai-interaction-history.model.js:7` a `:8` usa utilitario puro de cifra sem importar service; `:23` a `:75` define o schema; `:50` a `:62` cifra `safeSummary` e `safeSignals`; `:78` a `:82` indexa timeline por utilizador e idempotencia por `userId/sessionId/eventType`; `:90` a `:92` exporta `AiInteractionHistory`. |
| Service de validacao, minimizacao e DTO | `real_dev/api/src/services/ai-interaction-history.service.js:18` a `:29` lista termos sensiveis proibidos; `:82` a `:90` rejeita conteudo sensivel; `:135` a `:155` normaliza sinais campo a campo; `:182` a `:192` constroi DTO publico sem `userId`/`sessionId`; `:204` a `:227` regista evento minimizado; `:238` a `:247` lista apenas `{ userId: req.user.id }`; `:258` a `:282` prepara contexto interno minimizado para `BK-MF8-10` sem expor IDs. |
| Endpoint autenticado e ownership backend | `real_dev/api/src/controllers/ai-interaction-history.controller.js:16` a `:23` passa `req.user.id` ao service e devolve `{ history }`; `real_dev/api/src/routes/ai-interaction-history.routes.js:18` a `:22` publica `GET /api/me/ai-interactions` com `requireAuth`; `real_dev/api/src/app.js:13` e `:87` a `:88` montam a route no prefixo `/api`. |
| Integracao vinda do `BK-MF8-08` | `real_dev/api/src/services/ai-consultation.service.js:58` a `:98` transforma respostas guiadas em sinais minimizados; `:107` a `:130` cria evento `consultation_submitted`; `:331` a `:357` submete apenas sessao propria completa e chama `recordAiInteractionHistoryEvent(...)` apos `save()`. |
| UI cliente sem ownership manual | `real_dev/web/src/services/aiInteractionHistoryApi.js:13` a `:17` chama `/me/ai-interactions` e nao envia `userId`; `real_dev/web/src/pages/AiHistoryPage.jsx:48` a `:60` carrega historico com estados de erro/loading/empty; `:63` a `:98` mostra timeline publica com `safeSummary`/`safeSignals`; `real_dev/web/src/App.jsx:30` e `:130` a `:135` integram a pagina no shell cliente. |
| Smoke web anti-regressao | `real_dev/web/scripts/check-mf8-ai-history-page.mjs:57` a `:67` confirma ligacao `App -> AiHistoryPage -> apiRequest`; `:68` a `:74` proibe `localStorage`, `sessionStorage`, `analysisId`, `reportId` e `userId` na pagina; `real_dev/web/package.json:19` a `:20` publica smokes MF8. |
| Testes focais `RF47`/`RNF30` | `real_dev/api/tests/mf8.ai-interaction-history.test.js:115` a `:144` prova registo minimizado e DTO sem IDs; `:146` a `:165` prova bloqueio de conteudo sensivel; `:167` a `:179` prova filtro por utilizador autenticado; `:181` a `:198` prova handoff seguro para `BK-MF8-10`; `:200` a `:221` prova endpoint autenticado e bloqueio sem sessao. |
| Regressao `BK-MF8-08 -> BK-MF8-09` | `real_dev/api/tests/mf8.ai-consultation.test.js:293` a `:342` prova que submissao da sessao guiada regista historico IA minimizado com `eventType: "consultation_submitted"` e `source: "guided_consultation"`. |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. O modelo usa cifra em repouso para campos pessoais e nao cria storage publico, path privado novo, fotografia, relatorio facial ou exposicao de `storageKey`.
- `MF7 -> MF8`: preservada. A consulta publica depende de `requireAuth` e do cookie HttpOnly existente; a UI nao guarda token em `localStorage`/`sessionStorage` nem escolhe dono do historico.
- `BK-MF8-08 -> BK-MF8-09`: consumido. A submissao da sessao guiada e o unico produtor auditado de historico neste BK, com respostas textuais reduzidas a sinal minimizado.
- `BK-MF8-09 -> BK-MF8-10`: preparado. `listRecommendationHistoryContext(...)` entrega contexto interno sem IDs para recomendacoes enriquecidas futuras, sem implementar a recomendacao neste BK.
- `BK-MF8-11` e interface integrada futura: preservados fora de escopo. Nao foram introduzidos acessos de consultor, revisao humana, insights/correcoes, dashboard, roles novas, chat livre, RAG, embeddings, IA generativa nova ou prompts internos no DTO.

### Validacoes executadas nesta auditoria

| Comando | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS` - apenas os relatorios tecnicos MF8 aparecem como untracked antes da actualizacao; `real_dev/` permanece ignorado. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao real esta ignorada, como previsto. |
| `find . -maxdepth 2 -type d -name mockup -print` | `PASS` - sem pasta `mockup/` neste checkout. |
| `node --check real_dev/api/src/models/ai-interaction-history.model.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/services/ai-interaction-history.service.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/controllers/ai-interaction-history.controller.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/routes/ai-interaction-history.routes.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/services/ai-consultation.service.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/web/scripts/check-mf8-ai-history-page.mjs` | `PASS` - sem erros de sintaxe. |
| `npm --prefix real_dev/api test -- tests/mf8.ai-interaction-history.test.js tests/mf8.ai-consultation.test.js` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 2 ficheiros, 14 testes. |
| `npm --prefix real_dev/api test` | `PASS` fora do sandbox - 35 ficheiros, 249 testes. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 82 modulos transformados. |
| `npm --prefix real_dev/web run smoke:mf8-ai-history` | `PASS` - `BK-MF8-09 frontend smoke OK`. |
| `npm --prefix real_dev/web run smoke:mf8-consultation` | `PASS` - `BK-MF8-08 guided consultation page check passed`. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa canonica por `RF47`, `RNF30`, `BK-MF8-08`, `BK-MF8-09`, `BK-MF8-10` e `BK-MF8-11` | `PASS` - RF, RNF, matriz, backlog, anexos, README, MF views e guia convergem para o escopo esperado. |
| Pesquisa estatica ampla por repos externos, placeholders, storage inseguro, logs sensiveis, secrets, pagamentos, RAG/embeddings e treino externo | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como pagamentos/testes MF3 existentes, checks anti-`localStorage`/`sessionStorage`, fake secrets de teste, provider/payment ja existente, comentarios defensivos e negativos como `skin_secret`; sem fuga material no BK09. |
| Pesquisa focada nos ficheiros BK09 por `localStorage`, `sessionStorage`, IDs internos, consentimentos, prompts, cookies, tokens, imagens e secrets | `PASS_COM_RESIDUAIS_ESPERADOS` - hits sao lista de bloqueio do service, comentario de ownership e smoke que proibe esses termos na UI. |
| `git diff --check` | `PASS` - sem whitespace errors em tracked changes. |
| `rg -n "[ \t]+$" docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | `PASS` - sem trailing whitespace nos relatorios MF8 untracked. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-09`.
- Nenhum ficheiro de implementacao foi alterado.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum.
- Pendente ambiental: manter a regra de repetir Supertest fora do sandbox quando surgir `listen EPERM`.
- Pendente operacional: QA manual/browser com utilizador real seedado nao foi executado; as validacoes automaticas cobrem service, API, DTO HTTP, integracao com `BK-MF8-08`, suite API completa, build, smoke web e planificacao.
- Pendente operacional: smoke com MongoDB persistente/seed real nao foi executado nesta auditoria; os testes focais usam mocks controlados e Supertest.

### Decisao

`BK-MF8-09` fica `AUDITADO_OK`: a implementacao real cumpre `RF47` e `RNF30`, guarda historico IA minimizado e cifrado, lista apenas o historico do proprio cliente autenticado, devolve DTO publico sem IDs internos, bloqueia termos sensiveis, integra a submissao do `BK-MF8-08`, prepara contexto seguro para `BK-MF8-10`, inclui UI/smoke sem storage inseguro e mantem fora de escopo recomendacoes enriquecidas, revisao humana, chat livre, prompts internos, fotografias, consentimentos e segredos.

## 2026-07-06 - BK-MF8-08 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-08`
- Macro-fase canonica: `MF8`
- RF principal: `RF42`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O contrato do `BK-MF8-08` foi comparado contra documentos canonicos, guia BK, implementacao real em `real_dev/api` e `real_dev/web`, testes focais, suite API completa, build web, smoke web, pesquisas estaticas e validador de planificacao. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK08-P3-001 | P3 | `NAO_REPRODUZIDO` | O teste HTTP/Supertest focado falhou no sandbox com `listen EPERM`/porta nula; a repeticao fora do sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RF42`. | Continuar a repetir suites HTTP fora do sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0, P1 ou P2.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RF42` | `docs/RF.md:61` define avaliacao guiada com perguntas cosmeticas estruturadas; `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:84`, `docs/planificacao/backlogs/BACKLOG-MVP.md:112`, `docs/planificacao/backlogs/ANEXO-RF-PARA-BKS.md:55`, `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md:91`, `docs/planificacao/backlogs/MF-VIEWS.md:223` e `docs/planificacao/guias-bk/README.md:115` convergem em `BK-MF8-08`, prioridade P0, dependencias `BK-MF1-06`, `BK-MF1-07`, `BK-MF7-01` e handoff para `BK-MF8-09`. |
| Fronteira com BKs vizinhos | `docs/RF.md:62` a `:64`, `docs/RF.md:77`, `docs/RNF.md:57`, `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:85` a `:87` e `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:89` mantem historico seguro, recomendacoes enriquecidas, revisao humana e interface integrada fora do escopo deste BK. |
| Guia BK sem drift de escopo | `docs/planificacao/guias-bk/MF8/BK-MF8-08-sessao-guiada-de-avaliacao-cosmetica-com-ia.md:23` a `:48`, `:90` a `:103`, `:108` a `:116`, `:128` a `:139`, `:1642` a `:1646` e `:1711` exigem sessao guiada estruturada, backend owner, validacao de obrigatorias, ausencia de chat livre/recomendacoes/historico e preparacao para `BK-MF8-09`. |
| Modelo de sessao guiada | `real_dev/api/src/models/ai-consultation-session.model.js:45` a `:79` define `userId`, `analysisId`, `reportId`, `scriptVersion`, `answers`, `status` e `submittedAt`; `:88` a `:90` indexa rascunhos por utilizador/status; `:99` a `:101` exporta `AiConsultationSession`. |
| Script versionado e validacao de input | `real_dev/api/src/validators/ai-consultation.validator.js:10` a `:60` fixa o script de perguntas no backend; `:69` a `:70` devolve copia publica; `:84`, `:103`, `:126`, `:155` e `:177` a `:189` validam `sessionId`, texto, escolhas, escala e pergunta contra o contrato, bloqueando campos inventados pelo frontend. |
| Service centraliza ownership e dependencias reais | `real_dev/api/src/services/ai-consultation.service.js:39` a `:53` cria DTO publico sem `userId`, `analysisId` ou `reportId`; `:65` a `:103` exige analise concluida e relatorio ativo do proprio utilizador; `:118` a `:141` cria ou reutiliza rascunho; `:175` a `:181` procura sessao editavel por `_id`, `userId` e `status`; `:199` a `:217` grava resposta validada; `:230` a `:253` submete apenas quando todas as obrigatorias existem. |
| Endpoints autenticados e montados | `real_dev/api/src/controllers/ai-consultation.controller.js:25` a `:96` delega start/current/save/submit para service e validators; `real_dev/api/src/routes/ai-consultation.routes.js:17` a `:38` publica `POST /api/ai-consultation/sessions`, `GET /api/ai-consultation/sessions/current`, `PATCH /api/ai-consultation/sessions/:sessionId/answers` e `POST /api/ai-consultation/sessions/:sessionId/submit`, todos com `requireAuth`; `real_dev/api/src/app.js:12` e `:86` montam as rotas. |
| UI consome o contrato sem decidir ownership | `real_dev/web/src/pages/GuidedConsultationPage.jsx:14`, `:26`, `:68`, `:94`, `:113` a `:129` e `:161` a `:173` iniciam/retomam sessao, guardam respostas e submetem via API; `real_dev/web/src/App.jsx:29` e `:130` integram a pagina; `real_dev/web/src/services/apiClient.js:81` a `:87` preserva cookie HttpOnly com `credentials: "include"`. |
| Smoke web anti-regressao | `real_dev/web/scripts/check-mf8-guided-consultation-page.mjs:63` a `:90` confirma import/rota, endpoints reais, cookie HttpOnly e ausencia de `localStorage`/`sessionStorage`; `real_dev/web/package.json:19` publica `smoke:mf8-consultation`. |
| Teste focal `RF42` | `real_dev/api/tests/mf8.ai-consultation.test.js:135` a `:155` cobre validacao positiva e pergunta inexistente; `:159` a `:186` prova criacao com analise/relatorio do utilizador autenticado e DTO sem IDs internos; `:191` a `:205` prova gravacao de resposta; `:209` a `:225` bloqueia sem autenticacao e sessao de outro utilizador; `:229` a `:253` bloqueia submissao sem perguntas obrigatorias. |

### Coerencia entre MFs e BKs vizinhos

- `MF1 -> MF8`: preservada. A sessao guiada consome analise facial concluida e relatorio ativo existentes, sem criar upload, provider, modelo facial, foto publica ou nova analise.
- `MF7 -> MF8`: preservada. As rotas usam `requireAuth`, dependem do cookie HttpOnly existente e fazem ownership no backend por `req.user.id`.
- `BK-MF8-07 -> BK-MF8-08`: preservada. O BK nao altera finalidade de imagem, consentimento facial, treino externo, provider IA ou payload de analise.
- `BK-MF8-08 -> BK-MF8-09`: preparado. A sessao submetida fica estruturada e minimizada para historico seguro futuro, mas este BK nao implementa historico, exposicao cronologica, storage adicional ou consulta historica.
- `BK-MF8-10`, `BK-MF8-11` e `BK-MF8-13`: preservados fora de escopo. Nao foram implementadas recomendacoes enriquecidas, revisao humana, insights/correcoes de consultor, dashboard ou interface integrada cliente/consultor.
- `MF8 futura`: preservada. Nao foram introduzidos chat livre, RAG, embeddings, prompts internos no DTO, IA generativa nova, pagamentos, checkout, webhooks, roles novas, `localStorage`, `sessionStorage` ou `dangerouslySetInnerHTML`.

### Validacoes executadas nesta auditoria

| Comando | Resultado |
| --- | --- |
| `node --check real_dev/api/src/models/ai-consultation-session.model.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/validators/ai-consultation.validator.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/services/ai-consultation.service.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/controllers/ai-consultation.controller.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/routes/ai-consultation.routes.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/web/scripts/check-mf8-guided-consultation-page.mjs` | `PASS` - sem erros de sintaxe. |
| `npm --prefix real_dev/api test -- tests/mf8.ai-consultation.test.js` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 1 ficheiro, 7 testes. |
| `npm --prefix real_dev/api test` | `PASS` fora do sandbox - 34 ficheiros, 242 testes. |
| `npm --prefix real_dev/web run smoke:mf8-consultation` | `PASS` - `BK-MF8-08 guided consultation page check passed`. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 80 modulos transformados. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa canonica por `BK-MF8-08`, `BK-MF8-09`, `RF42`, `RF43`, `RF45`, `RF47` e `RNF30` | `PASS` - RF, RNF, matriz, backlog, anexos, README, MF views e guia convergem para a divisao de escopo esperada. |
| Pesquisa estatica ampla por repos externos, placeholders, storage inseguro, logs sensiveis, secrets, pagamentos, RAG/embeddings e treino externo | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como stubs/testes MF3, checks anti-`localStorage`/`sessionStorage`, fake secrets de teste, provider/payment ja existente, comentarios de seguranca e teste negativo `skin_secret`; sem fuga material no BK08. |
| `rg -n "real[_]dev\|REAL[_]DEV" docs/planificacao/guias-bk/MF8/BK-MF*.md` | `PASS` - sem leakage de path privado nos guias publicos MF8. |
| `find . -maxdepth 2 -type d -name mockup -print` | `PASS` - sem pasta `mockup/` neste checkout. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao permanece ignorada. |
| `git diff --check` | `PASS` - sem whitespace errors em tracked changes. |
| `rg -n "[ \t]+$" docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | `PASS` - sem trailing whitespace nos relatorios MF8 untracked. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-08`.
- Nenhum ficheiro de implementacao foi alterado.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum.
- Pendente ambiental: manter a regra de repetir Supertest fora do sandbox quando surgir `listen EPERM`.
- Pendente operacional: QA manual/browser com utilizador real seedado nao foi executado; as validacoes automaticas cobrem service, API, DTO HTTP, suite completa, build, smoke web e planificacao.

### Decisao

`BK-MF8-08` fica `AUDITADO_OK`: a implementacao real cumpre `RF42`, cria sessao guiada estruturada associada ao utilizador autenticado, liga a sessao a analise facial concluida e relatorio ativo, valida perguntas/respostas no backend, bloqueia submissao incompleta, protege ownership por backend, integra UI sem storage inseguro e mantem fora de escopo historico, recomendacoes enriquecidas, revisao humana e interface integrada.

## 2026-07-05 - BK-MF8-07 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-07`
- Macro-fase canonica: `MF8`
- RNF principal: `RNF25`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PROFUNDIDADE_COERENCIA=vizinhas`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O contrato do `BK-MF8-07` foi comparado contra documentos canonicos, guia BK, implementacao real em `real_dev/api`, testes focais, testes de regressao, suite API, build web, smoke web, checks estaticos e validador de planificacao. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK07-P3-001 | P3 | `NAO_REPRODUZIDO` | Os testes HTTP/Supertest falharam no sandbox com `listen EPERM`/porta nula; a repeticao fora do sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RNF25`. | Continuar a repetir suites HTTP fora do sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0, P1 ou P2.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF25` | `docs/RNF.md:100`, `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:83`, `docs/planificacao/backlogs/BACKLOG-MVP.md:111` e `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md:41` confirmam que imagens processadas nao devem ser usadas para treinar modelos externos sem consentimento, com prioridade P0, dependencias `BK-MF7-01`/`BK-MF7-07` e handoff para `BK-MF8-08`. |
| Guia BK sem drift de escopo | `docs/planificacao/guias-bk/MF8/BK-MF8-07-o-sistema-nao-deve-usar-imagens-para-treinar-modelos-sem-consentimento.md:23`, `:27` a `:40`, `:54` a `:62`, `:75` a `:91`, `:103` a `:119`, `:195` a `:237`, `:371` a `:402` e `:433` a `:439` exigem finalidade centralizada, consentimento activo por finalidade, payload minimizado para provider, bloqueio de finalidade diferente, `allowModelLearning: false`, fallback local preservado e teste Vitest dedicado. |
| Constantes de finalidade e retencao | `real_dev/api/src/constants/face-consent.js:13`, `:20` a `:21`, `:28` a `:29` e `:36` a `:41` definem `FACE_ANALYSIS_CONSENT_PURPOSE`, finalidade separada de aprendizagem de terceiros, retencao do provider e politica imutavel com `modelLearningAllowed: false`. |
| Service de analise facial aplica consentimento e minimizacao | `real_dev/api/src/services/face-analysis.service.js:42` a `:53` devolvem `imageUse` no DTO publico; `:64` a `:73` preparam base64 temporario; `:90` a `:94` procuram `FaceConsent` activo pela finalidade canonica; `:100` a `:122` seleccionam imagens internas e chamam o provider com `requestedPurpose` e `allowModelLearning: false`; `:126` a `:134` persistem metadados internos sem os devolver no DTO. |
| Provider local rejeita finalidade indevida | `real_dev/api/src/providers/skin-analysis.provider.js:70` a `:82` bloqueiam finalidade diferente e treino externo; `:92` a `:120` validam fotografias preparadas e aplicam defaults seguros; `:166` a `:173` declaram limitacoes de uso cosmetico; `:186` a `:199` preservam fallback local e nao escondem erros de contrato do provider externo. |
| Provider externo envia payload minimizado | `real_dev/api/src/providers/external-skin-analysis.provider.js:28` a `:40` bloqueiam finalidade errada/treino externo antes do `fetch`; `:50` a `:69` exigem imagens preparadas; `:80` a `:108` enviam apenas `kind`, `mimeType`, `sizeBytes`, `contentBase64`, `purpose`, `retention` e `modelLearningAllowed: false`; `:119` a `:137` exigem HTTPS fora de localhost; `:202` a `:248` enviam a chave apenas em `Authorization` e usam o payload minimizado no body. |
| Teste focal `RNF25` | `real_dev/api/tests/mf8.image-purpose-limit.test.js:47` a `:61` prova payload minimizado sem `storageKey`/`consentId`; `:63` a `:87` prova bloqueio de finalidade errada e `allowModelLearning: true`; `:89` a `:118` prova chave apenas no header e ausencia de metadados privados no body; `:120` a `:137` prova rejeicao de imagem nao preparada antes do `fetch`. |
| Regressao de MF6 preservada | `real_dev/api/tests/mf6.face-analysis-performance.test.js:337` a `:363` prova resposta publica com performance sem `storageKey`/`userId` e chamada ao provider com finalidade canonica, `allowModelLearning: false` e imagens preparadas. |
| Regressao de provider externo MF7 preservada | `real_dev/api/tests/mf7.external-ai-provider.test.js:29` a `:30`, `:75` a `:103`, `:108` a `:133` e `:140` a `:161` provam que o provider externo continua isolado, com payload minimizado, bloqueio de imagens nao preparadas, fallback local em erro operacional e sem fallback em erro de contrato. |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. O BK consome storage cifrado apenas no backend, prepara imagens temporarias em memoria, nao devolve `storageKey`, `userId` ou chaves internas no DTO publico e mantem budget/performance testado.
- `MF7 -> MF8`: preservada. O consentimento facial explicito por finalidade e o provider externo seguro continuam a ser a fronteira de autorizacao antes de qualquer chamada de analise.
- `BK-MF8-06 -> BK-MF8-07`: preservada. A politica de finalidade de imagem nao altera fairness, ranking ou explicabilidade das recomendacoes.
- `BK-MF8-07 -> BK-MF8-08`: preparado. O DTO de analise passa a expor `imageUse`, permitindo a futura sessao guiada informar finalidade/retencao sem reabrir treino externo nem criar endpoint novo.
- `MF8 futura`: preservada. Nao foram introduzidos checkout, stock, recomendacoes enriquecidas, RAG, embeddings, dashboards, roles, prompts de treino, upload publico, URL publica de imagem ou consentimento separado para aprendizagem externa.

### Validacoes executadas nesta auditoria

| Comando | Resultado |
| --- | --- |
| `node --check real_dev/api/src/constants/face-consent.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/services/face-analysis.service.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/providers/skin-analysis.provider.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/providers/external-skin-analysis.provider.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/tests/mf8.image-purpose-limit.test.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/tests/mf6.face-analysis-performance.test.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/tests/mf7.external-ai-provider.test.js` | `PASS` - sem erros de sintaxe. |
| `npm --prefix real_dev/api test -- tests/mf8.image-purpose-limit.test.js` | `PASS` - 1 ficheiro, 5 testes. |
| `npm --prefix real_dev/api test -- tests/mf7.external-ai-provider.test.js` | `PASS` - 1 ficheiro, 8 testes. |
| `npm --prefix real_dev/api test -- tests/mf6.face-analysis-performance.test.js` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 1 ficheiro, 6 testes. |
| `npm --prefix real_dev/api test -- tests/mf7.consent.test.js tests/mf1.face.test.js` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 2 ficheiros, 19 testes. |
| `npm --prefix real_dev/api test` | `PASS` fora do sandbox - 33 ficheiros, 235 testes. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 79 modulos transformados. |
| `npm --prefix real_dev/web run smoke:mf6-images` | `PASS` - `BK-MF6-04 image checks passed`. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| `rg -n "FACE_ANALYSIS_CONSENT_PURPOSE\|FACE_IMAGE_PURPOSE_POLICY\|THIRD_PARTY_MODEL_LEARNING_PURPOSE\|FACE_IMAGE_PROVIDER_RETENTION\|modelLearningAllowed\|allowModelLearning\|requestedPurpose\|assertExternalImagePurposePolicy\|buildExternalAnalysisPayload" real_dev/api/src real_dev/api/tests docs/planificacao/guias-bk/MF8/BK-MF8-08-sessao-guiada-de-avaliacao-cosmetica-com-ia.md` | `PASS` - ocorrencias convergem para constantes, guards, service e testes esperados. |
| Pesquisa estatica ampla por placeholders, repos externos, storage inseguro, logs sensiveis, segredos, pagamentos, RAG/embeddings e metadados privados | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como testes/stubs, checks anti-fuga, storage interno cifrado, fake secrets de teste, providers de pagamento ja existentes, comentarios de seguranca e metadados internos nao expostos. |
| `rg -n "real[_]dev\|REAL[_]DEV" docs/planificacao/guias-bk/MF8/BK-MF*.md` | `PASS` - sem leakage de path privado nos guias publicos MF8. |
| `find . -maxdepth 2 -type d -name mockup -print` | `PASS` - sem pasta `mockup/` neste checkout. |
| `git check-ignore -v real_dev real_dev/api real_dev/web real_dev/api/src/constants/face-consent.js real_dev/api/src/services/face-analysis.service.js real_dev/api/src/providers/skin-analysis.provider.js real_dev/api/src/providers/external-skin-analysis.provider.js real_dev/api/tests/mf8.image-purpose-limit.test.js real_dev/api/tests/mf6.face-analysis-performance.test.js real_dev/api/tests/mf7.external-ai-provider.test.js` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao permanece ignorada. |

### Decisao

`BK-MF8-07` esta `AUDITADO_OK` em `real_dev`: a implementacao cumpre `RNF25`, bloqueia treino externo sem consentimento, centraliza a finalidade de analise facial, envia payload minimizado ao provider, preserva fallback local, nao expõe metadados privados e mantem coerencia com `MF6`, `MF7`, `BK-MF8-06` e `BK-MF8-08`.

Risco residual: smoke operacional contra provider real depende de credenciais/endpoint externos configurados fora desta execucao. As garantias de contrato, minimizacao e bloqueio antes do `fetch` ficaram cobertas por testes locais.

## 2026-07-04 - BK-MF8-06 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-06`
- Macro-fase canonica: `MF8`
- RNF principal: `RNF24`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O contrato do `BK-MF8-06` foi comparado contra documentos canonicos, guia BK, implementacao real em `real_dev/api`, UI em `real_dev/web`, testes focais, testes de integracao, suite API, build web, smoke web e checks de planificacao. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK06-P3-001 | P3 | `NAO_REPRODUZIDO` | Os testes HTTP `mf2.integration` e `mf4.integration` falharam no sandbox com `listen EPERM`/porta nula em Supertest; a repeticao fora do sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RNF24`. | Continuar a repetir suites HTTP fora do sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0, P1 ou P2.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF24` | `docs/RNF.md:99`, `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:82`, `docs/planificacao/backlogs/BACKLOG-MVP.md:110`, `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md:40`, `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md:89`, `docs/planificacao/backlogs/MF-VIEWS.md:221` e `docs/planificacao/guias-bk/README.md:113` confirmam `BK-MF8-06`, prioridade P0, dependencia `BK-MF8-05`, requisito `RNF24` e handoff para `BK-MF8-07`. |
| Apoio funcional de recomendacoes | `docs/RF.md:72`, `docs/RF.md:73`, `docs/RF.md:77` e `docs/RF.md:127` confirmam `RF18`, `RF19`, `RF43` e `RF40`: recomendacao personalizada, motivo da sugestao, recomendacoes enriquecidas futuras e respeito por restricoes declaradas. |
| Guia BK sem drift de escopo | `docs/planificacao/guias-bk/MF8/BK-MF8-06-o-sistema-deve-garantir-nao-discriminacao-por-genero-idade-ou-tom-de-pele.md:23`, `:29`, `:33` a `:39`, `:77`, `:83`, `:85`, `:89` a `:99`, `:947` a `:965` e `:985` a `:998` exigem service dedicado, bloqueio de motivo/fonte/texto sensivel, positivo, tres negativos, DTO minimo e handoff para `BK-MF8-07`. |
| Guard etico isolado | `real_dev/api/src/services/ai-fairness-guard.service.js:1` a `:9` documentam o guard `RNF24`; `:11` a `:30` definem motivos e prefixes sensiveis; `:32` a `:48` definem padroes de texto discriminatorio; `:57` a `:63` normalizam acentos/capitalizacao para evitar bypass. |
| Bloqueio material de fairness | `real_dev/api/src/services/ai-fairness-guard.service.js:104` a `:112` bloqueiam texto publico discriminatorio; `:123` a `:160` exigem motivos/fontes, bloqueiam `reasonCodes` e `sourceSignals` sensiveis, validam explicacao/limitacoes e devolvem apenas `{ status: "checked", protectedAttributes }`. |
| Ranking limitado a sinais cosmeticos | `real_dev/api/src/services/recommendation.service.js:83` a `:136` pontuam apenas `skinType`, `oleosidade`, `acne`, `manchas` e `rugas`, sem genero, idade ou tom de pele como criterio de ranking. |
| Guard antes de persistir | `real_dev/api/src/services/recommendation.service.js:205` a `:247` constroem a explicacao com fontes controladas, executam `assertRecommendationFairness` antes de `ProductRecommendation.findOneAndUpdate` e persistem `reasonCodes`, `explanation`, `sourceSignals` e `limitations` validados. |
| Guard antes de devolver DTO | `real_dev/api/src/services/recommendation.service.js:48` a `:72` revalidam recomendacoes persistidas antes da resposta publica e devolvem `fairnessStatus` e `protectedAttributesChecked`, sem valores reais de genero, idade ou tom de pele. |
| Modelo preserva contratos de explicabilidade | `real_dev/api/src/models/product-recommendation.model.js:85` a `:110` exigem `reasonCodes`, `explanation`, `sourceSignals` e `limitations`; `real_dev/api/src/models/product-recommendation.model.js:130` a `:133` mantem unicidade por `userId`, `analysisId` e `productId`. |
| Explicabilidade publica continua controlada | `real_dev/api/src/services/recommendation-reason.service.js:9` a `:30` limitam motivos/fontes/limitacoes publicas; `:76` a `:90` convertem `sourceSignals` em labels publicos; `:100` a `:137` recusam recomendacao sem motivo/fonte publica e mantem a separacao entre recomendacao e compra automatica. |
| Endpoints existentes e autenticados | `real_dev/api/src/routes/recommendation.routes.js:16` a `:31` mantem apenas `POST /recommendations/generate`, `GET /recommendations` e `POST /recommendations/:recommendationId/feedback`, todos com `requireAuth`; `real_dev/api/src/controllers/recommendation.controller.js:14` a `:42` usam `req.user.id`. |
| UI nao decide fairness | `real_dev/web/src/pages/ProductRecommendationsPage.jsx:48` a `:80` chama endpoints existentes; `:136` a `:178` mostra explicacao, motivos, fontes e limitacoes vindos do backend. O cliente HTTP em `real_dev/web/src/services/apiClient.js:81` a `:107` usa `credentials: "include"` e nao introduz storage local de tokens. |
| Teste focal `RNF24` | `real_dev/api/tests/mf8.fairness-guard.test.js:34` a `:70` cobre positivo com sinais cosmeticos e tres negativos materiais: fonte sensivel, motivo sensivel e texto publico discriminatorio. |
| Prova HTTP do DTO publico | `real_dev/api/tests/mf2.integration.test.js:527` a `:542` prova `POST /api/recommendations/generate` com `201`, `fairnessStatus: "checked"`, `protectedAttributesChecked` e ausencia de `storageKey`, `consentId` e `facePhotoId`; `real_dev/api/tests/mf4.integration.test.js:623` a `:650` prova o mesmo contrato no fluxo com restricoes/alergias. |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. O BK nao altera encriptacao, `storageKey`, `privacyStatus`, uploads, relatorios biometricos, timeout, HTTPS ou contratos de eliminacao/anonymizacao.
- `MF7 -> MF8`: preservada. Auth por cookie HttpOnly, consentimento facial, provider IA externo, politica de treino externo, ownership e isolamento de imagens/prompts nao foram alterados.
- `BK-MF8-05 -> BK-MF8-06`: consumido correctamente. O guard usa `reasonCodes`, `sourceSignals`, `explanation` e `limitations` criados pelo BK de explicabilidade, sem duplicar endpoint nem modelo de recomendacao.
- `BK-MF8-06 -> BK-MF8-07`: preparado. A fronteira etica de recomendacoes fica fechada; o proximo BK pode focar privacidade de imagens e treino externo sem reabrir fairness.
- `BK-MF8-10`: preparado. Recomendações enriquecidas futuras devem continuar a alimentar motivos/fontes cosmeticas no mesmo guard, em vez de criar criterio paralelo baseado em atributos sensiveis.
- `MF8 futura`: preservada. Nao foram introduzidos endpoints novos, roles, providers externos, webhooks, pagamentos, carrinho automatico, revisao humana, RAG, embeddings, treino externo ou dashboards.

### Validacoes executadas nesta auditoria

| Comando | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS` - apenas os relatorios tecnicos MF8 aparecem como untracked. |
| `find . -maxdepth 2 -type d -name mockup -print` | `PASS` - sem pasta `mockup/` neste checkout. |
| `rg --files docs/planificacao/guias-bk/MF8` | `PASS` - existem guias `BK-MF8-01` a `BK-MF8-17`. |
| Pesquisa canonica por `RNF24`, `BK-MF8-06`, `RF18`, `RF19`, `RF40` e `RF43` | `PASS` - RF, RNF, matriz, backlog, anexos, README, MF views e guia convergem para o mesmo contrato. |
| `node --check real_dev/api/src/services/ai-fairness-guard.service.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/services/recommendation.service.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/tests/mf8.fairness-guard.test.js` | `PASS` - sem erros de sintaxe. |
| `npm --prefix real_dev/api test -- tests/mf8.fairness-guard.test.js` | `PASS` - 1 ficheiro, 4 testes. |
| `npm --prefix real_dev/api test -- tests/mf2.integration.test.js` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 1 ficheiro, 12 testes. |
| `npm --prefix real_dev/api test -- tests/mf4.integration.test.js` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 1 ficheiro, 13 testes. |
| `npm --prefix real_dev/api test` | `PASS` fora do sandbox - 32 ficheiros, 230 testes. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 79 modulos transformados. |
| `npm --prefix real_dev/web run smoke:mf2` | `PASS` - build, mounting e API contracts presentes. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| `rg -n "real[_]dev\|REAL[_]DEV" docs/planificacao/guias-bk/MF8/BK-MF*.md` | `PASS` - sem leakage de path privado nos guias publicos MF8. |
| `git check-ignore -v real_dev/api/src/services/ai-fairness-guard.service.js real_dev/api/src/services/recommendation.service.js real_dev/api/tests/mf8.fairness-guard.test.js real_dev/api/tests/mf2.integration.test.js real_dev/api/tests/mf4.integration.test.js real_dev/web/src/pages/ProductRecommendationsPage.jsx real_dev/api real_dev/web` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao permanece ignorada. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/api/scripts`, `real_dev/web/src`, `real_dev/web/scripts` e relatorios MF8 | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como historico de relatorio, storage privado do BK de backup, testes/stubs de Stripe/PayPal/MBWay, segredos fake de teste, guards de configuracao, comentarios anti-`localStorage`/`sessionStorage`, provider externo MF7, disclaimers de treino externo e testes negativos/claims de seguranca. |
| Pesquisa focada em ficheiros `BK-MF8-06` por `localStorage`, `sessionStorage`, `dangerouslySetInnerHTML`, `eval`, `new Function`, `payload: unknown`, `as any`, `TODO`, `FIXME`, secrets e logs sensiveis | `PASS` - sem ocorrencias. |
| Pesquisa focada de atributos sensiveis no fluxo de recomendacao | `PASS_COM_FALSO_POSITIVO` - ocorrencias reais ficam no guard/testes; `oleosidade:` pode casar com `idade:` por substring, mas e sinal cosmetico permitido pelo guia. |
| `git diff --check` | `PASS` - sem whitespace errors em tracked changes. |
| `rg -n "[ \t]+$" real_dev/api/src/services/ai-fairness-guard.service.js real_dev/api/src/services/recommendation.service.js real_dev/api/tests/mf8.fairness-guard.test.js real_dev/api/tests/mf2.integration.test.js real_dev/api/tests/mf4.integration.test.js real_dev/web/src/pages/ProductRecommendationsPage.jsx docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md` | `PASS` - sem trailing whitespace nos ficheiros auditados e relatorios MF8. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-06`.
- Nenhum ficheiro de implementacao foi alterado.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum.
- Pendente ambiental: manter a regra de repetir Supertest fora do sandbox quando surgir `listen EPERM`.
- Pendente operacional: QA manual/browser com dados reais seedados nao foi executado; as validacoes automatizadas cobrem service, API, DTO HTTP, suite completa, build, smoke e planificacao.

### Decisao

`BK-MF8-06` fica `AUDITADO_OK`: a implementacao real cumpre `RNF24`, bloqueia atributos sensiveis como motivo, fonte e texto publico, valida recomendacoes antes de persistir e antes de devolver DTOs, preserva endpoints existentes, nao desloca fairness para o frontend, nao adiciona produtos ao carrinho, nao cria providers/endpoints novos e deixa handoff coerente para `BK-MF8-07` e `BK-MF8-10`.

## 2026-07-04 - BK-MF8-05 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-05`
- Macro-fase canonica: `MF8`
- RNF principal: `RNF23`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O contrato do `BK-MF8-05` foi comparado contra documentos canonicos, guia BK, implementacao real em `real_dev/api`, UI em `real_dev/web`, testes focais, testes de integracao e checks de planificacao. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK05-P3-001 | P3 | `NAO_BLOQUEANTE_AMBIENTAL` | `npm --prefix real_dev/api test -- tests/mf2.integration.test.js` falhou no sandbox com `listen EPERM`/porta nula em testes Supertest; a repeticao fora do sandbox passou com 1 ficheiro e 12 testes. | Ambiental. Nao representa regressao de produto nem incumprimento de `RNF23`. | Continuar a repetir suites HTTP fora do sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0, P1 ou P2.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF23` | `docs/RNF.md:98`, `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:81`, `docs/planificacao/backlogs/BACKLOG-MVP.md:109`, `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md:39` e `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md:88` confirmam `BK-MF8-05`, prioridade P0, dependencia `BK-MF7-07`, requisito `RNF23` e handoff para `BK-MF8-06`. |
| Apoio funcional de recomendacoes | `docs/RF.md:72`, `docs/RF.md:73`, `docs/RF.md:77` e `docs/RF.md:127` confirmam `RF18`, `RF19`, `RF43` e `RF40`: recomendacao personalizada, motivo, enriquecimento futuro e restricoes declaradas. |
| Guia BK sem drift de escopo | `docs/planificacao/guias-bk/MF8/BK-MF8-05-a-ia-deve-indicar-como-chegou-as-recomendacoes-explicabilidade.md:13`, `:27`, `:60`, `:95` a `:98`, `:117` e `:143` ancoram `RNF23`, `RF18`, `RF19`, `RF40`, `RF43`, ausencia de endpoints/roles novos e preparacao de `BK-MF8-06`. |
| Motivos controlados | `real_dev/api/src/services/recommendation-reason.service.js:9` a `real_dev/api/src/services/recommendation-reason.service.js:15` limitam `reasonCodes` a codigos cosmeticos conhecidos. |
| Fontes publicas seguras | `real_dev/api/src/services/recommendation-reason.service.js:17` a `real_dev/api/src/services/recommendation-reason.service.js:25` definem prefixes publicos; `real_dev/api/src/services/recommendation-reason.service.js:76` a `real_dev/api/src/services/recommendation-reason.service.js:90` ignoram fontes desconhecidas, removem markup e limitam o valor apresentado. |
| Bloqueio de explicacoes opacas ou inseguras | `real_dev/api/src/services/recommendation-reason.service.js:32` a `real_dev/api/src/services/recommendation-reason.service.js:33`, `:60` a `:67` e `:100` a `:138` bloqueiam promessa clinica, exigem motivo e fonte publica, sanitizam nome do produto e acrescentam limitacoes. |
| DTO publico sem sinais internos | `real_dev/api/src/services/recommendation.service.js:47` a `real_dev/api/src/services/recommendation.service.js:62` devolvem `reasonCodes`, `explanation`, `sourceLabels` e `limitations`, mas nao devolvem `sourceSignals`, fotografias, consentimentos, prompts, tokens ou paths internos. |
| Ranking e persistencia scoped ao utilizador | `real_dev/api/src/services/recommendation.service.js:72` a `real_dev/api/src/services/recommendation.service.js:125` derivam motivos e sinais a partir de analise cosmetica; `real_dev/api/src/services/recommendation.service.js:136` a `:155` exigem analise/relatorio do proprio utilizador; `real_dev/api/src/services/recommendation.service.js:166` a `:232` gravam recomendacoes por `userId`, `analysisId` e `productId`. |
| Restricoes e stock real | `real_dev/api/src/services/recommendation.service.js:174` a `real_dev/api/src/services/recommendation.service.js:177` filtram produtos com stock e restricoes; `real_dev/api/src/services/recommendation-restrictions.service.js:27` a `real_dev/api/src/services/recommendation-restrictions.service.js:75` removem produtos que violem alergias/ingredientes a evitar. |
| Endpoints existentes e autenticados | `real_dev/api/src/routes/recommendation.routes.js:16` a `real_dev/api/src/routes/recommendation.routes.js:31` mantem apenas `POST /recommendations/generate`, `GET /recommendations` e `POST /recommendations/:recommendationId/feedback`, todos com `requireAuth`; `real_dev/api/src/controllers/recommendation.controller.js:14` a `:42` usam `req.user.id`. |
| Modelo exige motivos e fontes | `real_dev/api/src/models/product-recommendation.model.js:85` a `real_dev/api/src/models/product-recommendation.model.js:110` exigem `reasonCodes`, `explanation`, `sourceSignals` e `limitations`; `real_dev/api/src/models/product-recommendation.model.js:130` a `:133` mantem unicidade por `userId`, `analysisId` e `productId`. |
| UI apresenta explicabilidade vinda do backend | `real_dev/web/src/pages/ProductRecommendationsPage.jsx:48` a `real_dev/web/src/pages/ProductRecommendationsPage.jsx:63`, `:72` a `:85` e `:118` a `:180` chamam os endpoints existentes e mostram explicacao, motivos, fontes e limitacoes com fallback honesto. |
| Cliente HTTP preserva cookie HttpOnly | `real_dev/web/src/services/apiClient.js:81` a `real_dev/web/src/services/apiClient.js:107` usa `credentials: "include"` e nao introduz storage local de tokens. |
| Teste focal `RNF23` | `real_dev/api/tests/mf8.recommendation-explainability.test.js:18` a `real_dev/api/tests/mf8.recommendation-explainability.test.js:85` cobre positivo de motivos/fontes/limitacoes, ausencia de `storageKey`/`consentId`, negativo sem motivo/fonte publica, ignorar sinais desconhecidos e bloqueio de promessa clinica. |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. O BK nao altera encriptacao, `storageKey`, `privacyStatus`, uploads, relatorios biometricos, timeout, HTTPS ou contratos de eliminacao/anonymizacao.
- `MF7 -> MF8`: preservada. Auth por cookie HttpOnly, consentimento facial, provider IA externo, politica de treino externo, ownership e isolamento de imagens/prompts nao foram alterados.
- `BK-MF8-04 -> BK-MF8-05`: consumido sem regressao. O BK de explicabilidade nao toca no script de backup, storage privado, redaccao nem dry-run de base de dados.
- `BK-MF8-05 -> BK-MF8-06`: preparado. `reasonCodes`, `sourceLabels`, `explanation` e `limitations` deixam os motivos auditaveis para a futura validacao de nao discriminacao.
- `BK-MF8-10`: preparado. A recomendacao enriquecida com respostas guiadas pode reutilizar `buildRecommendationReason` em vez de criar um contrato paralelo de explicacao.
- `MF8 futura`: preservada. Nao foram introduzidos endpoints novos, roles, providers externos, webhooks, pagamentos, carrinho automatico, revisao humana, RAG, embeddings, treino externo ou dashboards.

### Validacoes executadas nesta auditoria

| Comando | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS` - apenas os relatorios tecnicos MF8 aparecem como untracked no arranque. |
| `find . -maxdepth 2 -type d -name mockup -print` | `PASS` - sem pasta `mockup/` neste checkout. |
| `rg --files docs/planificacao/guias-bk/MF8` | `PASS` - existem guias `BK-MF8-01` a `BK-MF8-17`. |
| Pesquisa canonica por `RF18`, `RF19`, `RF40`, `RF43`, `RNF23`, `BK-MF8-05`, `BK-MF8-06` e `BK-MF8-10` | `PASS` - RF, RNF, matriz, backlog, anexos e guia convergem para o mesmo contrato. |
| `node --check real_dev/api/src/services/recommendation-reason.service.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/src/services/recommendation.service.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/tests/mf8.recommendation-explainability.test.js` | `PASS` - sem erros de sintaxe. |
| `npm --prefix real_dev/api test -- tests/mf8.recommendation-explainability.test.js` | `PASS` - 1 ficheiro, 4 testes. |
| `npm --prefix real_dev/api test -- tests/mf2.contracts.test.js` | `PASS` - 1 ficheiro, 7 testes. |
| `npm --prefix real_dev/api test -- tests/mf2.integration.test.js` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 1 ficheiro, 12 testes. |
| `npm --prefix real_dev/api test` | `PASS` fora do sandbox - 31 ficheiros, 226 testes. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 79 modulos transformados. |
| `npm --prefix real_dev/web run smoke:mf2` | `PASS` - build, mounting e API contracts presentes. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| `rg -n "real[_]dev\|REAL[_]DEV" docs/planificacao/guias-bk/MF8/BK-MF*.md` | `PASS` - sem leakage de path privado nos guias publicos MF8. |
| `git check-ignore -v real_dev/api/src/services/recommendation-reason.service.js real_dev/api/src/services/recommendation.service.js real_dev/api/tests/mf8.recommendation-explainability.test.js real_dev/web/src/pages/ProductRecommendationsPage.jsx real_dev/api real_dev/web` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao permanece ignorada. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/api/scripts`, `real_dev/web/src`, `real_dev/web/scripts` e relatorios MF8 | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como historico de relatorio, storage privado do BK de backup, testes/stubs de Stripe/PayPal/MBWay, segredos fake de teste, guards de configuracao, comentarios anti-`localStorage`/`sessionStorage`, provider externo MF7, disclaimers de treino externo e teste negativo que prova que `storageKey`/`consentId` nao saem no DTO. |
| `git diff --check` | `PASS` - sem whitespace errors em tracked changes. |
| `rg -n "[ \t]+$" real_dev/api/src/services/recommendation-reason.service.js real_dev/api/src/services/recommendation.service.js real_dev/api/tests/mf8.recommendation-explainability.test.js real_dev/web/src/pages/ProductRecommendationsPage.jsx docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md` | `PASS` - sem trailing whitespace nos ficheiros auditados e relatorios MF8. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-05`.
- Nenhum ficheiro de implementacao foi alterado.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum.
- Pendente ambiental: manter a regra de repetir Supertest fora do sandbox quando surgir `listen EPERM`.
- Pendente operacional: QA manual/browser com dados reais seedados nao foi executado; as validacoes automatizadas cobrem contrato, API, build e smoke MF2.

### Decisao

`BK-MF8-05` fica `AUDITADO_OK`: a implementacao real cumpre `RNF23`, transforma motivos e fontes internas em explicacao publica controlada, bloqueia recomendacoes opacas, minimiza DTO publico, preserva restricoes/stock/ownership, nao introduz endpoints ou providers novos e deixa handoff tecnico claro para `BK-MF8-06` e `BK-MF8-10`.

## 2026-07-04 - BK-MF8-04 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-04`
- Macro-fase canonica: `MF8`
- RNF principal: `RNF21`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O contrato do `BK-MF8-04` foi comparado contra documentos canonicos, guia BK, implementacao real em `real_dev/api`, testes de contrato, script operacional de backup e checks de planificacao. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK04-P3-001 | P3 | `NAO_BLOQUEANTE_AMBIENTAL` | `npm --prefix real_dev/api test` falhou no sandbox com `listen EPERM`/porta nula em testes Supertest; a repeticao fora do sandbox passou com 30 ficheiros e 222 testes. | Ambiental. Nao representa regressao de produto nem incumprimento de `RNF21`. | Continuar a repetir suites HTTP fora do sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0, P1 ou P2.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF21` | `docs/RNF.md:83`, `MATRIZ-CANONICA-BK.md:80`, `BACKLOG-MVP.md:108`, `ANEXO-RNF-PARA-BKS.md:37`, `ANEXO-CORE-DUAL-BK.md:87`, `MF-VIEWS.md:219` e o guia `BK-MF8-04` confirmam backups automaticos diarios como contrato P1 de `MF8`. |
| Comando operacional de backup | `real_dev/api/package.json:10` expõe `backup:daily` como `node scripts/backup-daily.mjs`, sem novo endpoint, UI ou provider externo. |
| Guard de ambiente herdado de `BK-MF8-03` | `real_dev/api/scripts/backup-daily.mjs:15` a `real_dev/api/scripts/backup-daily.mjs:20` reutilizam `assertTestEnvironmentIsIsolated`, `env`, `getMongoDatabaseName`, `connectDB` e `disconnectDB`; `real_dev/api/src/config/env.js:161` a `real_dev/api/src/config/env.js:190` exigem `NODE_ENV=test`, URI com marcador de teste e ausencia de credenciais live. |
| Destino privado e ignorado | `real_dev/api/scripts/backup-daily.mjs:22` a `real_dev/api/scripts/backup-daily.mjs:27` definem `real_dev/storage/private/backups`; `real_dev/api/scripts/backup-daily.mjs:59` a `real_dev/api/scripts/backup-daily.mjs:83` recusam destino fora de `storage/private` ou em pastas publicas/build; `git check-ignore -v` confirmou `.gitignore:2:real_dev/`. |
| Redaccao de dados sensiveis | `real_dev/api/scripts/backup-daily.mjs:29` a `real_dev/api/scripts/backup-daily.mjs:42` listam chaves sensiveis; `real_dev/api/scripts/backup-daily.mjs:104` a `real_dev/api/scripts/backup-daily.mjs:125` redigem os valores antes de serializar documentos. |
| Escrita controlada de colecoes | `real_dev/api/scripts/backup-daily.mjs:217` a `real_dev/api/scripts/backup-daily.mjs:236` escrevem colecoes ja redigidas em ficheiros `.backup.json` dentro do destino previamente validado. |
| Manifest e resumo publico | `real_dev/api/scripts/backup-daily.mjs:246` a `real_dev/api/scripts/backup-daily.mjs:307` geram manifesto com `bkId: "BK-MF8-04"` e `requirement: "RNF21"`; `real_dev/api/scripts/backup-daily.mjs:191` a `real_dev/api/scripts/backup-daily.mjs:207` bloqueiam URI MongoDB, `storageKey`, segredos e paths internos no output publico. |
| Prova dry-run repetivel | `NODE_ENV=test MONGODB_URI=mongodb://127.0.0.1:27017/orelle_test npm --prefix real_dev/api run backup:daily -- --dry-run` passou com `status: ok`, `dryRun: true`, `databaseName: orelle_test`, `collections: []` e `backupId: bk-mf8-04-2026-07-04T00-46-48-234Z`, sem URI nem paths internos no resumo. |
| Testes negativos obrigatorios | `real_dev/api/tests/mf8.backup.contract.test.js:28` a `real_dev/api/tests/mf8.backup.contract.test.js:115` cobrem manifesto dry-run em destino privado, recusa de destino fora de `storage/private`, recusa de `MONGODB_URI` vazia, redaccao de `passwordHash`/`storageKey` e bloqueio de resumo publico inseguro. |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. O BK nao altera encriptacao, `storageKey`, `privacyStatus`, uploads, relatorios biometricos nem contratos de eliminacao/anonymizacao.
- `MF7 -> MF8`: preservada. Auth, consentimento, cookies HttpOnly, ownership, providers externos e pagamentos nao foram alterados pelo procedimento de backup.
- `BK-MF8-03 -> BK-MF8-04`: consumido correctamente. O backup depende do guard de ambiente isolado, usa `orelle_test` nas validacoes e falha antes de tocar em dados quando a configuracao e insegura.
- `BK-MF8-04 -> BK-MF8-05`: preparado. `RNF21` fica fechado como camada operacional de suporte; nao foi criada dependencia tecnica que bloqueie a explainability do proximo BK.
- `BK-MF8-15/BK-MF8-16`: preparados. O script e os testes deixam evidence repetivel para a futura matriz final e para validacoes de release.
- `MF8 futura`: preservada. Nao foram introduzidos cron real, cloud storage, restore destrutivo, dashboards, endpoints novos, providers externos, webhooks, pagamentos novos, RAG, embeddings ou treino externo.

### Validacoes executadas nesta auditoria

| Comando | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS` - apenas os relatorios tecnicos MF8 aparecem como untracked. |
| `find . -maxdepth 2 -type d -name mockup -print` | `PASS` - sem pasta `mockup/` neste checkout. |
| `rg --files docs/planificacao/guias-bk/MF8` | `PASS` - existem guias `BK-MF8-01` a `BK-MF8-17`. |
| Pesquisa canonica por `RNF21`, `BK-MF8-04` e backups | `PASS` - matriz, backlog, RNF, anexos e guia convergem para o mesmo contrato. |
| `node --check real_dev/api/scripts/backup-daily.mjs` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/tests/mf8.backup.contract.test.js` | `PASS` - sem erros de sintaxe. |
| `npm --prefix real_dev/api run` | `PASS` - lista `backup:daily` como script disponivel. |
| `git check-ignore -v real_dev/storage/private/backups/test.backup.json real_dev/storage/private/backups-test/test.backup.json real_dev/api/scripts/backup-daily.mjs real_dev/api/tests/mf8.backup.contract.test.js real_dev real_dev/api real_dev/web` | `PASS` - `.gitignore:2:real_dev/` confirma que a area de implementacao e artefactos de backup ficam ignorados. |
| `npm --prefix real_dev/api test -- tests/mf8.backup.contract.test.js` | `PASS` - 1 ficheiro, 5 testes. |
| `NODE_ENV=test MONGODB_URI=mongodb://127.0.0.1:27017/orelle_test npm --prefix real_dev/api run backup:daily -- --dry-run` | `PASS` - resumo publico seguro, sem URI nem paths internos. |
| `npm --prefix real_dev/api test` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 30 ficheiros, 222 testes. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 79 modulos transformados. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/api/scripts`, `real_dev/web/src`, `real_dev/web/scripts` e relatorios MF8 | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como historico de relatorio, storage privado esperado no BK, `storageKey` em testes/servicos que provam minimizacao, URIs Mongo de teste, testes/stubs de Stripe/PayPal/MBWay, segredos fake de teste, comentarios anti-`localStorage`/`sessionStorage`, disclaimers de treino externo e guards de configuracao. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-04`.
- Nenhum ficheiro de implementacao foi alterado.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum.
- Pendente operacional: backup real non-dry-run nao foi executado por disciplina de escopo; deve continuar limitado a Mongo local isolado `orelle_test` quando for necessario produzir artefactos reais.
- Pendente ambiental: manter a regra de repetir Supertest fora do sandbox quando surgir `listen EPERM`.
- Validacoes nao executadas por nao serem aplicaveis ao escopo: QA manual/browser e testes visuais, porque o `BK-MF8-04` e backend/script/test-contract only.

### Decisao

`BK-MF8-04` fica `AUDITADO_OK`: a implementacao real cumpre `RNF21`, usa a camada segura criada em `BK-MF8-03`, escreve apenas em storage privado, redige dados sensiveis, minimiza output publico, tem negativos P1 cobertos e preserva a coerencia MF6/MF7/MF8.

## 2026-07-04 - BK-MF8-03 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-03`
- Macro-fase canonica: `MF8`
- RNF principal: `RNF22`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi executada em modo audit-only, com `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

O contrato do `BK-MF8-03` foi comparado contra documentos canonicos, guia BK, implementacao real em `real_dev/api`, testes de contrato e checks de planificacao. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK03-P3-001 | P3 | `NAO_BLOQUEANTE_AMBIENTAL` | `npm --prefix real_dev/api test` falhou no sandbox com `listen EPERM: operation not permitted 0.0.0.0`; a repeticao fora do sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RNF22`. | Continuar a repetir testes Supertest fora do sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0, P1 ou P2.

### Evidencia auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF22` | `docs/RNF.md`, `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md`, `ANEXO-RNF-PARA-BKS.md`, `ANEXO-CORE-DUAL-BK.md`, `MF-VIEWS.md` e `PLANO-SPRINTS.md` confirmam `BK-MF8-03`, prioridade P1, sprint S12, requisito `RNF22` e handoff para `BK-MF8-04`. |
| Separacao por script de teste | `real_dev/api/package.json:9` executa `NODE_ENV=test` com `MONGODB_URI=mongodb://127.0.0.1:27017/orelle_test`, evitando base de dados de desenvolvimento/producao no comando normal de testes. |
| Defaults e marcadores seguros | `real_dev/api/src/config/env.js:28` a `real_dev/api/src/config/env.js:31` definem URIs default separadas para desenvolvimento e teste, com marcador `_test`/`orelle_test`. |
| Guard centralizado de ambiente | `real_dev/api/src/config/env.js:65`, `real_dev/api/src/config/env.js:80`, `real_dev/api/src/config/env.js:99`, `real_dev/api/src/config/env.js:120` e `real_dev/api/src/config/env.js:161` centralizam extraccao do nome da base de dados, deteccao de URI production-like, deteccao de segredo live e `assertTestEnvironmentIsIsolated`. |
| Activacao em runtime de teste | `real_dev/api/src/config/env.js:241` a `real_dev/api/src/config/env.js:247` executam o guard quando `env.nodeEnv === "test"`, impedindo arranque de testes com configuracao perigosa. |
| Documentacao operacional minima | `real_dev/api/.env.example:12` a `real_dev/api/.env.example:15` documentam que testes automatizados devem usar base de dados isolada com `_test`/`orelle_test`; `real_dev/api/.env.example:31` a `real_dev/api/.env.example:33` usam chave Stripe de teste. |
| Testes negativos obrigatorios | `real_dev/api/tests/mf8.test-env.contract.test.js:15` a `real_dev/api/tests/mf8.test-env.contract.test.js:87` cobrem happy path e negativos para `NODE_ENV` errado, URI sem marcador de teste, nome production-like e credencial live em modo teste. |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. A separacao de ambiente nao altera robustez, seguranca, HTTPS, encriptacao, privacidade nem o contrato de armazenamento privado ja auditado.
- `MF7 -> MF8`: preservada. `aiProviderMode`, `aiProviderUrl` e `aiProviderKey` continuam no objecto `env`; auth, consentimento, cookies e ownership nao foram enfraquecidos.
- `BK-MF8-02 -> BK-MF8-03`: preservado. Logs seguros e metricas HTTP continuam disponiveis para distinguir falhas ambientais de regressao real.
- `BK-MF8-03 -> BK-MF8-04`: preparado. O uso de `orelle_test` cria base isolada para os fluxos de backup/restore do proximo BK sem tocar em dados produtivos.
- `BK-MF8-15`: preparado. O contrato de testes passa a ter guard deterministico contra configuracao insegura antes de ampliar cobertura futura.

### Validacoes executadas nesta auditoria

| Comando | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS` - apenas os relatorios tecnicos MF8 aparecem como untracked. |
| `git check-ignore -v real_dev real_dev/api real_dev/web real_dev/api/src/config/env.js` | `PASS` - `.gitignore:2:real_dev/` confirma que `real_dev/` e area ignorada. |
| `node --check real_dev/api/src/config/env.js` | `PASS` - sem erros de sintaxe. |
| `node --check real_dev/api/tests/mf8.test-env.contract.test.js` | `PASS` - sem erros de sintaxe. |
| `npm --prefix real_dev/api test -- tests/mf8.test-env.contract.test.js` | `PASS` - 1 ficheiro, 5 testes. |
| `npm --prefix real_dev/api test` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 29 ficheiros, 217 testes. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 79 modulos transformados. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa estatica obrigatoria de privacidade/sensibilidade | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como historico de relatorio, testes/stubs de Stripe/PayPal/MBWay, comentarios anti-`localStorage`/`sessionStorage`, segredos fake de teste, guards de configuracao e disclaimers de treino externo. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de auditoria `BK-MF8-03`.
- Nenhum ficheiro de implementacao foi alterado.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum.
- Pendente ambiental: manter a regra de repetir Supertest fora do sandbox quando surgir `listen EPERM`.
- Validacoes nao executadas por nao serem aplicaveis ao escopo: QA manual/browser e testes visuais, porque o `BK-MF8-03` e backend/config/test-contract only.

### Decisao

`BK-MF8-03` fica `AUDITADO_OK`: a implementacao real cumpre `RNF22`, os testes cobrem os negativos pedidos, a coerencia MF6/MF7/MF8 foi preservada e a unica anomalia observada foi ambiental no sandbox, mitigada por repeticao fora do sandbox com sucesso.

## 2026-07-03 - BK-MF8-02 - reauditar_implementacao

### Resultado

- Estado: `REAUDITADO_OK`
- BK auditado: `BK-MF8-02`
- Macro-fase canonica: `MF8`
- RNF principal: `RNF20`
- Modo pedido no chat: `re-auditar`
- Modo efectivo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

O anexo desta execucao indicava `MODO: implementar`, mas o pedido explicito do utilizador foi `Podes re-auditar?`. Para evitar alterar codigo contra a intencao expressa, esta execucao foi tratada como re-auditoria audit-only do `BK-MF8-02`, mantendo `IMPLEMENTATION_ROOT=real_dev`, `RUN_COMMANDS=true`, `STRICT_SCOPE=true`, `CHECK_MF_COHERENCE=true`, `PERMITIR_ALTERAR_DOCS=nao` e `PERMITIR_COMMITS=nao`.

A re-auditoria foi feita do zero contra documentos canonicos, guia BK, implementacao real em `real_dev/api`, testes e checks de planificacao. Nao foram alterados codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos; apenas este relatorio tecnico foi actualizado, conforme `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK02-P3-002 | P3 | `NAO_BLOQUEANTE` | Drift operacional entre anexo (`MODO: implementar`) e pedido explicito no chat (`re-auditar`). | Risco de executar alteracoes de codigo quando a intencao expressa e audit-only. Nao afectou runtime porque a execucao foi mantida como re-auditoria. | Em prompts futuras, alinhar `MODO=auditar_implementacao` quando o objectivo for re-auditar. |
| ORELLE-MF8-BK02-P3-003 | P3 | `NAO_BLOQUEANTE` | `npm --prefix real_dev/api test -- tests/mf8.safe-logging.contract.test.js` falhou no sandbox com `listen EPERM: operation not permitted 0.0.0.0`; a repeticao fora do sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RNF20`. | Continuar a repetir testes Supertest fora do sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0, P1 ou P2.

### Evidencia re-auditada

| Contrato auditado | Evidencia actual |
| --- | --- |
| Contrato canonico `RNF20` | `docs/RNF.md`, `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md`, `ANEXO-RNF-PARA-BKS.md`, `ANEXO-CORE-DUAL-BK.md`, `MF-VIEWS.md` e `PLANO-SPRINTS.md` confirmam `BK-MF8-02`, prioridade P1, sprint S12, requisito `RNF20` e handoff para `BK-MF8-03`. |
| `requestId` por pedido | `real_dev/api/src/middlewares/request-observability.middleware.js` cria `req.requestId`, `req.requestStartedAt` e envia `X-Request-Id` antes das routes. |
| Metrica HTTP minimizada | `requestMetricsMiddleware` regista metrica no evento `finish` com `method`, rota segura, `statusCode` e `durationMs`, sem bloquear a resposta principal. |
| Modelo `PerformanceMetric` compativel | `real_dev/api/src/models/performance-metric.model.js` preserva `face_analysis` e acrescenta `http_request`, com `route`, `method`, `statusCode`, `durationMs`, `status` e `budgetMs`; nao inclui `userId`, headers, cookies, body, fotografias ou relatorios. |
| Sanitizacao e erro publico | `real_dev/api/src/services/observability.service.js` centraliza `sanitizePublicDetails` e `buildPublicErrorResponse`; `real_dev/api/src/middlewares/error.middleware.js` devolve `"Erro interno do servidor"` para `500` e inclui `requestId` sem detalhes internos. |
| Log seguro | `buildSafeErrorLog` produz apenas `level`, `event`, `requestId`, `method`, `route`, `statusCode`, `errorName` e `message`; a pesquisa focada nao encontrou uso de `console.error(err)`, `err.stack`, `req.body`, `req.headers` nem `req.cookies` no log. |
| Montagem na app | `real_dev/api/src/app.js` monta `requestContextMiddleware` e `requestMetricsMiddleware` antes de seguranca, timeout, CORS, JSON, cookies e routes. |
| Negativos obrigatorios | `real_dev/api/tests/mf8.safe-logging.contract.test.js` cobre detalhe sensivel redigido, erro interno generico e metrica `http_request` sem cookie, password ou `storageKey`. |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. `PerformanceMetric` continua a suportar `face_analysis` e o novo uso `http_request` nao altera o contrato de budget temporal.
- `MF6/BK-MF6-07`: preservado. Fotografias, relatorios, paths internos e storage privado continuam fora de respostas publicas, logs e metricas HTTP.
- `MF7/BK-MF7-03`: preservado. A sessao com cookie HttpOnly continua validada no backend; o novo log redige cookies e nao devolve tokens ao frontend.
- `MF7/BK-MF7-07`: preservado. Providers externos, API keys, consentimento, ownership e politica de treino externo nao foram alterados.
- `BK-MF8-01 -> BK-MF8-02`: preservado. A observabilidade encaixa nas fronteiras MVC sem duplicar controllers, routes ou regras de dominio.
- `BK-MF8-02 -> BK-MF8-03`: entregue. O proximo BK pode usar `requestId`, logs seguros e metricas HTTP para separar falhas de teste/ambiente de regressao real.

### Validacoes executadas nesta re-auditoria

| Comando | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS` - apenas os relatorios tecnicos MF8 aparecem como untracked. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | `PASS` - `.gitignore:2:real_dev/` confirma que `real_dev/` e area ignorada. |
| `rg -n "RNF20\|BK-MF8-02\|BK-MF8-03\|..." docs/...` | `PASS` - confirmou contrato canonico, guia alvo e handoff para `BK-MF8-03`. |
| `npm --prefix real_dev/api test -- tests/mf8.safe-logging.contract.test.js` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 1 ficheiro, 3 testes. |
| `npm --prefix real_dev/api test` | `PASS` fora do sandbox: 28 ficheiros, 212 testes. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 79 modulos transformados. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| `git diff --check` | `PASS` - sem output. |
| Pesquisa estatica de privacidade/sensibilidade | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como testes negativos, stubs/configuracao, comentarios defensivos, providers existentes ou storage privado fora do escopo deste BK. |

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio com a seccao de re-auditoria `BK-MF8-02`.
- Nenhum ficheiro de implementacao foi alterado.
- Nenhum guia BK, matriz, backlog, prompt, `apps/` ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum.
- Pendente operacional: alinhar o anexo para `MODO=auditar_implementacao` quando o pedido for re-auditoria.
- Pendente ambiental: manter a regra de repetir Supertest fora do sandbox quando surgir `listen EPERM`.

### Decisao

`BK-MF8-02` permanece `AUDITADO_OK` / `REAUDITADO_OK` em `real_dev`. A implementacao cumpre `RNF20` com request ID por pedido, resposta publica sanitizada, logs seguros, metricas HTTP minimizadas, negativos obrigatorios cobertos e validacoes verdes fora da limitacao ambiental do sandbox.

Proxima accao recomendada: avancar para `BK-MF8-03 - Ambiente de testes separado do ambiente de producao`.

## 2026-07-03 - BK-MF8-02 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-02`
- Macro-fase canonica: `MF8`
- RNF principal: `RNF20`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

A auditoria foi limitada a `BK-MF8-02 - Logs de erros e metricas de desempenho`, ao requisito `RNF20` e a coerencia vizinha `BK-MF8-01 -> BK-MF8-02 -> BK-MF8-03`, com verificacao de contratos MF6/MF7 que este BK consome. O guia publico usa caminhos `apps/api`, mas a prompt definiu `IMPLEMENTATION_ROOT=real_dev`; por isso a evidencia runtime foi recolhida em `real_dev/api` e `real_dev/web`.

Esta execucao nao alterou codigo, guias BK, matriz, backlog, prompts, `apps/` nem documentos canonicos. A unica alteracao realizada foi este bloco de auditoria tecnica, permitido por `OUTPUT_MODE=relatorio_e_resumo`.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK02-P3-001 | P3 | `NAO_BLOQUEANTE` | Os testes Vitest/Supertest falham dentro do sandbox com `listen EPERM: operation not permitted 0.0.0.0`. A repeticao fora do sandbox passou. | Ambiental. Nao representa regressao de produto nem incumprimento de `RNF20`. | Continuar a repetir testes Supertest fora do sandbox quando a falha for `listen EPERM`, registando ambos os resultados. |

Sem findings P0, P1 ou P2.

### Evidencia de cumprimento

| Contrato auditado | Evidencia |
| --- | --- |
| `requestId` por pedido | `real_dev/api/src/middlewares/request-observability.middleware.js` cria `req.requestId`, `req.requestStartedAt` e envia o header `X-Request-Id` antes das routes. |
| Metricas HTTP no fim da resposta | `requestMetricsMiddleware` usa o evento `finish`, calcula `durationMs` e chama `recordHttpRequestMetric` com `method`, rota segura, `statusCode` e duracao, sem bloquear a resposta principal. |
| Modelo `PerformanceMetric` minimizado | `real_dev/api/src/models/performance-metric.model.js` preserva `face_analysis` e acrescenta `http_request`, com campos `route`, `method`, `statusCode`, `durationMs`, `status` e `budgetMs`, sem `userId`, email, headers, cookies, body, fotografias ou relatorios. |
| Sanitizacao centralizada | `real_dev/api/src/services/observability.service.js` centraliza `sanitizePublicDetails`, redige chaves/valores sensiveis e limita profundidade antes de responder ao frontend. |
| Erro publico seguro | `real_dev/api/src/middlewares/error.middleware.js` chama `buildPublicErrorResponse`, preserva mensagens controladas de erros conhecidos e devolve `"Erro interno do servidor"` para `500`, com `requestId` e sem detalhes internos. |
| Logs com lista fechada | `buildSafeErrorLog` em `observability.service.js` produz apenas `level`, `event`, `requestId`, `method`, `route`, `statusCode`, `errorName` e `message`; nao usa `req.body`, headers, cookies, ficheiros, fotografias, relatorios ou dados biometricos. |
| Montagem na aplicacao | `real_dev/api/src/app.js` monta `requestContextMiddleware` e `requestMetricsMiddleware` antes de seguranca, timeout, CORS, JSON, cookies e routes, garantindo cobertura de endpoints e do `GET /api/health`. |
| Negativos obrigatorios | `real_dev/api/tests/mf8.safe-logging.contract.test.js` prova erro `400` com cookie/token/path redigidos, erro interno `500` generico e metrica `http_request` sem payload, cookie, password ou `storageKey`. |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. `PerformanceMetric` continua disponivel para metricas de `face_analysis` e o novo uso `http_request` nao altera `runWithPerformanceBudget` nem o contrato de budget temporal.
- `MF6/BK-MF6-07`: preservado. Storage privado, fotografias e relatorios continuam fora de logs, respostas publicas e metricas HTTP.
- `MF7/BK-MF7-03`: preservado. A sessao por cookie HttpOnly continua a ser transportada pelo browser e validada no backend; o novo log redige cookies e nao devolve tokens ao frontend.
- `MF7/BK-MF7-07`: preservado. Providers externos, API keys, treino externo, ownership e consentimento de imagens nao foram alterados; a observabilidade nao envia logs para providers externos.
- `BK-MF8-01 -> BK-MF8-02`: consumido. O service e middleware novos encaixam nas fronteiras MVC reforcadas pelo BK anterior sem duplicar controllers, routes ou regras de dominio.
- `BK-MF8-02 -> BK-MF8-03`: entregue. `BK-MF8-03` pode usar `requestId`, logs seguros e metricas HTTP para diagnosticar falhas de arranque/teste e distinguir problema ambiental de regressao real.
- `BK-MF8-04`: nao bloqueado. O futuro isolamento/backups de teste pode consumir a observabilidade sem depender de dashboard, provider externo ou metricas invasivas.

### Pesquisa estatica obrigatoria

Executada em:

- `real_dev/api/src`
- `real_dev/api/tests`
- `real_dev/web/src`
- `real_dev/web/scripts`
- `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md`
- `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

Resultado: sem finding novo. Os hits observados correspondem a testes negativos de privacidade, cookies simulados de Supertest, chaves fake de teste/configuracao, verificacoes anti-`localStorage`/`sessionStorage`, disclaimers de IA/treino externo e codigo legitimo de storage privado fora do escopo deste BK.

A pesquisa focada nos ficheiros de observabilidade confirmou que nao ha `console.error(err)`, `err.stack`, `req.body`, `req.headers` nem `req.cookies` usados no log; os hits restantes sao comentarios defensivos e patterns de redaccao.

### Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | `PASS` - apenas `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md` e `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` aparecem como untracked. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | `PASS` - `.gitignore:2:real_dev/` confirma que `real_dev/` e area ignorada, como previsto na prompt. |
| `rg -n "RNF20\|BK-MF8-02\|..." docs/...` | `PASS` - confirmou `RNF20`, matriz/backlog, anexo RNF/BK, core dual, sprint S12 e handoff para `BK-MF8-03`. |
| `npm --prefix real_dev/api test -- tests/mf8.safe-logging.contract.test.js` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com aprovacao e passou: 1 ficheiro, 3 testes. |
| `npm --prefix real_dev/api test` | `PASS` fora do sandbox: 28 ficheiros e 212 testes. |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 79 modulos transformados. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| `git diff --check` | `PASS` - sem output. |
| Pesquisa estatica de privacidade/sensibilidade | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como testes negativos, stubs/configuracao ou comentarios defensivos. |

### Ficheiros auditados

- `docs/RNF.md`
- `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
- `docs/planificacao/backlogs/BACKLOG-MVP.md`
- `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
- `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
- `docs/planificacao/backlogs/MF-VIEWS.md`
- `docs/planificacao/sprints/PLANO-SPRINTS.md`
- `docs/planificacao/guias-bk/MF8/BK-MF8-01-codigo-modular-mvc-com-documentacao-e-docstrings.md`
- `docs/planificacao/guias-bk/MF8/BK-MF8-02-logs-de-erros-e-metricas-de-desempenho.md`
- `docs/planificacao/guias-bk/MF8/BK-MF8-03-ambiente-de-testes-separado-do-ambiente-de-producao.md`
- `docs/planificacao/guias-bk/MF8/BK-MF8-04-base-de-dados-com-backups-automaticos-diarios.md`
- `docs/planificacao/guias-bk/MF6/BK-MF6-01-processar-analise-de-fotografia-em-menos-de-10-segundos.md`
- `docs/planificacao/guias-bk/MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-03-sessoes-autenticadas-com-cookies-httponly.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-07-suporte-para-api-de-ia-externa-ex-azure-face-api-ou-tensorflow.md`
- `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md`
- `real_dev/api/src/models/performance-metric.model.js`
- `real_dev/api/src/services/observability.service.js`
- `real_dev/api/src/middlewares/request-observability.middleware.js`
- `real_dev/api/src/middlewares/error.middleware.js`
- `real_dev/api/src/app.js`
- `real_dev/api/tests/mf8.safe-logging.contract.test.js`

### Alteracoes realizadas nesta execucao

- Actualizado este relatorio de auditoria com o bloco `BK-MF8-02`.
- Nenhum ficheiro de implementacao foi alterado.
- Nenhum guia BK, matriz, backlog, prompt ou documento canonico foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum.
- Pendente operacional: manter a regra de repetir Supertest fora do sandbox quando a falha for `listen EPERM`.

### Decisao

`BK-MF8-02` fica `AUDITADO_OK` em `real_dev`. A implementacao cumpre `RNF20`: request ID por pedido, logs de erro seguros, resposta publica sanitizada, metricas HTTP minimizadas em `PerformanceMetric`, negativos obrigatorios cobertos e validacoes completas verdes fora da limitacao ambiental do sandbox.

Proxima accao recomendada: avancar para `BK-MF8-03 - Ambiente de testes separado do ambiente de producao`, reutilizando `requestId` e metricas HTTP como evidence operacional.

## 2026-07-03 - BK-MF8-01 - auditar_implementacao

### Resultado

- Estado: `AUDITADO_OK`
- BK auditado: `BK-MF8-01`
- Macro-fase canonica: `MF8`
- RNF principal: `RNF19`
- Modo executado: `auditar_implementacao`
- Implementacao alterada nesta execucao: `nao`
- Relatorio actualizado/criado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md`

### Nota de escopo

O prompt recebido indicava `MF_ALVO: MF7`, mas tambem indicava `BK_IDS: [BK-MF8-01]`.
A matriz canonica, o backlog MVP, o anexo RNF/BK e o guia de BK classificam `BK-MF8-01` como parte da `MF8`.
Por isso, a auditoria foi executada sobre o alvo efectivo `MF8/BK-MF8-01`, mantendo o desvio de prompt registado como P3 nao bloqueante.

### Achados

| ID | Severidade | Estado | Descricao | Impacto | Accao recomendada |
| --- | --- | --- | --- | --- | --- |
| ORELLE-MF8-BK01-P3-001 | P3 | `NAO_BLOQUEANTE` | `MF_ALVO=MF7` no prompt conflita com `BK_IDS=[BK-MF8-01]`, que e canonico da MF8. | Operacional/documental. Nao afecta runtime nem validade da implementacao auditada. | Em futuras execucoes, alinhar `MF_ALVO=MF8` quando o BK alvo for `BK-MF8-01`. |

Sem findings P0, P1 ou P2.

### Evidencia de cumprimento

| Contrato auditado | Evidencia |
| --- | --- |
| Modularidade MVC mantida | `real_dev/api/src/app.js` expoe `createApp`, compoe middlewares/rotas e delega erro para `errorMiddleware`, sem concentrar regras de negocio. |
| Constantes partilhadas fora dos modelos | `real_dev/api/src/constants/domain.constants.js` centraliza enumeracoes de dominio usadas por modelos, validadores e providers. |
| Criptografia fora de schemas/modelos | `real_dev/api/src/utils/encryption.util.js` contem helpers puros AES-256-GCM com JSDoc; `real_dev/api/src/services/encryption.service.js` preserva facade compativel. |
| Controllers com responsabilidade HTTP | `real_dev/api/src/controllers/notification.controller.js` e `real_dev/api/src/controllers/routine-alert.controller.js` mantem ownership de request/response e delegam casos de uso para services. |
| Contrato automatizado de arquitectura | `real_dev/api/tests/mf8.modularidade.contract.test.js` valida directorias, `createApp`, fronteiras controller/service/provider/model, constantes partilhadas e JSDoc publico. |
| Guia BK satisfeito | `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` regista a execucao de implementacao anterior, ficheiros tocados e validacoes. |

### Coerencia entre MFs

- MF6 preservada: a criptografia continua encapsulada em utilitario dedicado e a facade historica evita quebrar imports existentes.
- MF7 preservada: contratos de provider externo e compatibilidade de checkout/exportacao nao foram alterados nesta execucao.
- MF8 preparada: `BK-MF8-01` deixa fronteiras MVC, constantes e documentacao tecnica auditaveis para avancar para `BK-MF8-02`.

### Pesquisa estatica obrigatoria

Executada em:

- `real_dev/api/src`
- `real_dev/api/tests`
- `real_dev/web/src`
- `real_dev/web/scripts`
- `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md`

Resultado: sem finding novo. Os hits observados correspondem a pagamentos/testes MF3, segredos ficticios de teste/configuracao, verificacoes contra armazenamento inseguro no browser e disclaimers de IA externa ja esperados no contexto Orelle.

### Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `npm --prefix real_dev/api test -- tests/mf8.modularidade.contract.test.js` | `PASS` - 1 ficheiro, 5 testes. |
| `npm --prefix real_dev/api test` | Primeiro `FAIL` no sandbox por `listen EPERM`; repetido fora do sandbox com aprovacao e passou com 27 ficheiros e 209 testes. |
| `npm --prefix real_dev/web run build` | `PASS`. |
| `bash scripts/validate-planificacao.sh` | `PASS`, `overall_pass: true`. |
| `git diff --check` | `PASS`. |
| `git check-ignore -v real_dev ...` | `PASS`, confirmado que `real_dev/` esta ignorado por `.gitignore:2`. |

### Ficheiros auditados

- `docs/RNF.md`
- `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
- `docs/planificacao/backlogs/BACKLOG-MVP.md`
- `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
- `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
- `docs/planificacao/backlogs/MF-VIEWS.md`
- `docs/planificacao/guias-bk/README.md`
- `docs/planificacao/guias-bk/MF8/BK-MF8-01-codigo-modular-mvc-com-documentacao-e-docstrings.md`
- `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md`
- `real_dev/api/src/app.js`
- `real_dev/api/src/constants/domain.constants.js`
- `real_dev/api/src/utils/encryption.util.js`
- `real_dev/api/src/services/encryption.service.js`
- `real_dev/api/src/controllers/notification.controller.js`
- `real_dev/api/src/controllers/routine-alert.controller.js`
- `real_dev/api/tests/mf8.modularidade.contract.test.js`

### Alteracoes realizadas nesta execucao

- Criado este relatorio de auditoria.
- Nenhum ficheiro de implementacao foi alterado.
- Nenhum commit foi criado.

### Bloqueadores e pendentes

- Bloqueadores: nenhum.
- Pendente operacional: alinhar o valor de `MF_ALVO` em prompts futuros para evitar ambiguidade entre MF7 e MF8.

### Proxima accao recomendada

Avancar para `BK-MF8-02`, mantendo `MF_ALVO=MF8` e usando `real_dev` como raiz efectiva de implementacao.
