# CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF6

## Resultado geral

- `PROJECT_NAME`: Orelle
- `MODO_RECEBIDO`: `corrigir_auditoria`
- `MODO_EXECUTADO`: `corrigir_auditoria`
- `MF_ALVO`: `MF6`
- `BK_IDS`: `[BK-MF6-07]`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `AUDIT_REPORT_SOURCE`: `auto`
- `AUDIT_REPORT_PATH`: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF6.md`
- `FINDING_IDS`: `[]` - todos os findings elegiveis do BK alvo
- `FIX_SEVERITIES`: `P0,P1,P2,P3`
- `INCLUIR_P3`: `sim`
- `STRICT_SCOPE`: `true`
- `CHECK_MF_COHERENCE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao` - apenas relatorios tecnicos MF6 foram atualizados
- `PERMITIR_COMMITS`: `nao`
- `data_execucao`: `2026-06-26`
- `resultado`: `CORRIGIDO`

Esta execucao corrigiu o finding `ORELLE-MF6-BK07-P1-001`, que deixava consumidores de `FaceReport` lerem relatorios sem filtrar `privacyStatus`. A correcao ficou limitada a `real_dev/api` e aos relatorios tecnicos permitidos. Nao foram alterados BKs, matriz, backlog, RF/RNF, planificacao canonica, `apps/`, `mockup/`, prompts, commits ou scope de MFs futuras.

## Findings tratados

| Finding | Severidade | BK/RNF | Estado final | Correcao aplicada |
|---|---|---|---|---|
| `ORELLE-MF6-BK07-P1-001` | `P1` | `BK-MF6-07` / `RNF11`, com dependencia de `RF41`, `BK-MF5-01` e `BK-MF5-04` | `CORRIGIDO` | `skin-history` e `admin-export` passaram a consultar apenas relatorios com `privacyStatus: "active"`; os testes MF1/MF4 foram atualizados para bloquear regressao. |

## Detalhe tecnico da correcao

### Historico pessoal de pele

`real_dev/api/src/services/skin-history.service.js` continua a devolver analises e relatorios do utilizador autenticado, mas a query de relatorios passou a exigir `privacyStatus: "active"`. Assim, relatorios marcados como `deleted` ou `anonymized` por pedidos de privacidade deixam de poder reaparecer no historico pessoal.

O teste `real_dev/api/tests/mf1.face.test.js` confirma agora que `FaceReport.find` e chamado com:

```js
{
    userId,
    privacyStatus: "active",
}
```

### Exportacao administrativa de relatorios

`real_dev/api/src/services/admin-export.service.js` continua a gerar datasets administrativos minimizados, mas a exportacao de `ai-reports` passou a consultar apenas `FaceReport.find({ privacyStatus: "active" })`.

O teste `real_dev/api/tests/mf4.integration.test.js` adicionou cobertura para `/api/admin/exports/ai-reports?format=csv`, validando que:

- o endpoint devolve CSV com o dataset canonico `ai-reports`;
- `FaceReport.find` recebe o filtro `privacyStatus: "active"`;
- o payload exportado nao inclui o campo operacional `privacyStatus`.

### Contratos preservados

- A encriptacao AES-256-GCM de fotografias e campos sensiveis de relatorios nao foi alterada.
- O modelo `FaceReport` mantem `privacyStatus` com `default: "active"` e estados `active`, `deleted`, `anonymized`.
- O service de pedidos biometricos continua responsavel por marcar relatorios tratados como `deleted` ou `anonymized`.
- Nao foram adicionados endpoints, roles, datasets novos, providers externos, IA generativa, treino externo, pagamentos, webhooks ou consentimentos MF7.
- O dataset publico da rota manteve o nome canonico ja existente: `ai-reports`.

## Ficheiros alterados

Backend (`real_dev`, gitignored):

- `real_dev/api/src/services/skin-history.service.js`
- `real_dev/api/src/services/admin-export.service.js`
- `real_dev/api/tests/mf1.face.test.js`
- `real_dev/api/tests/mf4.integration.test.js`

Relatorios tecnicos:

- `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF6.md`
- `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF6.md`

Nota Git:

- `real_dev/` esta ignorado por `.gitignore`; por isso, alteracoes de implementacao/testes em `real_dev/api` podem nao aparecer em `git status` nem em `git diff`.
- Os relatorios tecnicos MF6 continuam untracked.
- Nao foram feitos commits por `PERMITIR_COMMITS=nao`.

## Validacoes executadas

| Comando | Resultado |
|---|---|
| `npm --prefix real_dev/api test -- tests/mf1.face.test.js tests/mf4.integration.test.js` na sandbox | `FAIL_AMBIENTE`: testes HTTP falharam por `listen EPERM: operation not permitted 0.0.0.0`; falha de binding do sandbox, nao regressao funcional. |
| `npm --prefix real_dev/api test -- tests/mf1.face.test.js tests/mf4.integration.test.js` fora da sandbox | `PASS`: `2` ficheiros, `24` testes. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS`: `21` ficheiros, `164` testes. |
| `npm --prefix real_dev/web run build` | `PASS`: Vite build, `79` modules, JS `206.31 kB`, CSS `12.61 kB`. |
| Pesquisa estatica com `rg` | `PASS`: consumidores de `FaceReport` alterados para filtros com `privacyStatus: "active"`; restantes matches sao modelos, testes, services de privacidade ou relatorios tecnicos. |
| `bash scripts/validate-planificacao.sh` | `FAIL_BLOQUEADO_POR_SCOPE`: `coverage_pass=true`, `consistency_pass=true`, `guides_pass=false`, `overall_pass=false`; falhas em `guide_content_issues` de guias canonicos MF4/MF6, incluindo `BK-MF6-07`. Corrigir exige editar BKs/guias canonicos, bloqueado por `PERMITIR_ALTERAR_DOCS=nao`. |
| `git diff --check` | `PASS`. |

## Validacoes nao executadas

- Browser/E2E desktop/mobile: nao existe script E2E/browser especifico para `BK-MF6-07` no `real_dev/web/package.json`.
- Validacao com MongoDB real: nao executada; a correcao e a suite atual usam mocks/unit/Supertest, coerente com o padrao deste `real_dev`.
- Correcao dos guias canonicos sinalizados pelo validator: bloqueada por `PERMITIR_ALTERAR_DOCS=nao`.
- Commit/push/PR: nao executados por `PERMITIR_COMMITS=nao`.

## Pesquisa estatica

Foram pesquisados:

- queries `FaceReport.find(...)`;
- referencias a `privacyStatus`, `deleted` e `anonymized`;
- logs com passwords, tokens, cookies, imagens, fotografias ou relatorios;
- `localStorage`/`sessionStorage`, `dangerouslySetInnerHTML`, `eval`, `new Function`;
- TODOs vagos, pseudocodigo, `payload: unknown`, `as any`;
- gateways, webhooks, RAG, embeddings, IA generativa e treino externo.

Classificacao:

- `FaceReport.find({ userId, privacyStatus: "active" })`: contrato esperado no historico pessoal.
- `FaceReport.find({ privacyStatus: "active" })`: contrato esperado na exportacao administrativa de `ai-reports`.
- `privacyStatus: "deleted"` e `privacyStatus: "anonymized"`: aparecem no service de pedidos biometricos e nos testes que provam tratamento de privacidade.
- Nao foram encontrados novos logs sensiveis, storage de sessao em browser, execucao dinamica de codigo, providers externos ou datasets inventados nesta correcao.

## Coerencia entre MFs

- `MF5 -> MF6`: preservada e reforcada. Estados de privacidade criados em MF5 passam a ser respeitados pelos consumidores MF1/MF4 auditados no scope MF6.
- `BK-MF6-06 -> BK-MF6-07`: preservada. A correcao nao mexe em segredos, hashes, sessao ou configuracao de encriptacao.
- `BK-MF6-07 -> BK-MF7-01`: preservada. A base de encriptacao e minimizacao continua pronta para consentimento explicito futuro sem implementar MF7 antes de tempo.
- `MF6 -> MF7`: sem scope futuro indevido.

## Blockers/TODOs

- `BLOQUEADO`: nenhum para `ORELLE-MF6-BK07-P1-001`.
- `BLOQUEADO_POR_SCOPE`: o validator canonico continua a sinalizar `guide_content_issues` em MF4/MF6, incluindo `BK-MF6-07`; corrigir exige permissao explicita para editar guias BK/documentacao canonica.
- `TODO`: nenhum no codigo para este finding.

## Proxima acao recomendada

Nenhuma acao runtime adicional para `BK-MF6-07`. Se o objetivo for fechar o validator global, abrir tarefa separada com permissao explicita para corrigir `guide_content_issues` dos BKs canonicos MF4/MF6 ou alinhar o validador ao contrato documental ativo.
