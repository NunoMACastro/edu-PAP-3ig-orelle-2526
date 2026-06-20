# AUDITORIA-IMPLEMENTACAO-real_dev-MF4

## Header

- `doc_id`: `AUDITORIA-IMPLEMENTACAO-real_dev-MF4`
- `project`: `Orelle`
- `implementation_root`: `real_dev`
- `api_root`: `real_dev/api`
- `web_root`: `real_dev/web`
- `mf_alvo`: `MF4`
- `modo`: `auditar_implementacao`
- `output_mode`: `relatorio_e_resumo`
- `strict_scope`: `true`
- `status`: `AUDITADO_OK`
- `data`: `2026-06-18`

## Resultado geral

A implementacao real da `MF4` foi auditada em `real_dev/api` e `real_dev/web`. O estado atual e substancialmente melhor do que o relatorio de auditoria anterior: os findings `P1`/`P2` entao registados foram reavaliados e ja nao se reproduzem no codigo atual.

Resultado tecnico atual:

- API validada fora do sandbox: `16` ficheiros, `129` testes, `PASS`.
- Web validada por build Vite: `PASS`.
- Pesquisa estatica sem ocorrencias indevidas de dominios externos, armazenamento de tokens no browser, `dangerouslySetInnerHTML`, `eval`, `new Function`, logs de segredos ou exposicao de dados biometricos.
- `git diff --check`: `PASS`.
- `scripts/validate-planificacao.sh`: `FAIL_DOCS` por qualidade dos guias canonicos MF4; fora de scope desta execucao porque `PERMITIR_ALTERAR_DOCS=nao`.

Classificacao final apos correcao: `AUDITADO_OK`. Nao ha findings atuais `P0`, `P1`, `P2` ou `P3` contra a implementacao `real_dev`.

## Escopo auditado

- BKs abrangidos: `BK-MF4-01`, `BK-MF4-02`, `BK-MF4-03`, `BK-MF4-04`, `BK-MF4-05`, `BK-MF4-08`
- RF/RNF abrangidos: `RF33`, `RF34`, `RF35`, `RF36`, `RF37`, `RF40`, seguranca de sessao/autorizacao ligada a `RNF14`
- Coerencia vizinha: `MF3 -> MF4 -> MF5`
- Pastas auditadas: `real_dev/api`, `real_dev/web`
- Pastas ignoradas como destino: `apps/`, `mockup/`, `agent/legacy/**`
- Relatorios consultados: `IMPLEMENTACAO-REAL_DEV-MF4.md` e `CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF4.md`

## Estado por BK

| BK | RF/RNF | Estado | Evidencia principal | Observacao |
| --- | --- | --- | --- | --- |
| `BK-MF4-01` | `RF33`, `RNF14` | `AUDITADO_OK` | `auth.middleware.js:43-90`, `admin-users.routes.js:24-50`, `admin-users.service.js:46-172`, `mf4.integration.test.js:230-295` | Role persistida substitui role stale do JWT; suspensao/eliminacao logica nao expõem `passwordHash`. |
| `BK-MF4-02` | `RF34` | `AUDITADO_OK` | `admin-review.service.js:42-90`, `admin-review.routes.js:15-28`, `mf4.integration.test.js:297-324` | Admin modera visibilidade sem alterar comentario/rating do cliente. |
| `BK-MF4-03` | `RF35` | `AUDITADO_OK` | `admin-export.validator.js:6-35`, `admin-export.controller.js:13-27`, `admin-export.service.js:82-160`, `AdminExportsPage.jsx:63-79`, `mf4.integration.test.js:326-354` | Exportacao e ficheiro descarregavel com `Content-Disposition`, `Content-Type` e minimizacao. |
| `BK-MF4-04` | `RF36` | `AUDITADO_OK` | `notification.routes.js:17-41`, `notification.service.js:42-157`, `mf4.integration.test.js:356-423` | Notificacoes internas autenticadas, ownership em `/me`, campanhas admin e notificacao de estado de encomenda. |
| `BK-MF4-05` | `RF37` | `AUDITADO_OK` | `routine-alert.routes.js:16-33`, `routine-alert.service.js:73-100`, `routine-alert.controller.js:30-34`, `routine-alert.validator.js`, `mf4.integration.test.js:425-482` | Execucao admin aceita `now` ISO opcional, valida input invalido e preserva idempotencia por dia. |
| `BK-MF4-08` | `RF40` | `AUDITADO_OK` | `profile.validator.js:69-120` e `188-212`, `profile.service.js:17-34` e `87-99`, `recommendation-restrictions.service.js:27-75`, `recommendation.service.js:161-231`, `mf4.integration.test.js:464-609` | Perfil guarda restricoes e recomendacoes filtram produtos bloqueados antes de persistir. |

## Rastreabilidade BK -> ficheiros -> testes

| BK | Backend/API | Frontend | Testes/evidence |
| --- | --- | --- | --- |
| `BK-MF4-01` | `models/user.model.js`, `middlewares/auth.middleware.js`, `services/admin-users.service.js`, `controllers/admin-users.controller.js`, `routes/admin-users.routes.js` | `AdminUsersPage.jsx`, `App.jsx` | `real_dev/api/tests/mf4.integration.test.js`, `real_dev/api/tests/roles.test.js` |
| `BK-MF4-02` | `models/review.model.js`, `validators/admin-review.validator.js`, `services/admin-review.service.js`, `controllers/admin-review.controller.js`, `routes/admin-review.routes.js` | `AdminReviewsPage.jsx`, `App.jsx` | `real_dev/api/tests/mf4.integration.test.js` |
| `BK-MF4-03` | `validators/admin-export.validator.js`, `services/admin-export.service.js`, `controllers/admin-export.controller.js`, `routes/admin-export.routes.js` | `services/apiClient.js`, `AdminExportsPage.jsx`, `App.jsx` | `real_dev/api/tests/mf4.integration.test.js`, build web |
| `BK-MF4-04` | `models/notification.model.js`, `validators/notification.validator.js`, `services/notification.service.js`, `controllers/notification.controller.js`, `routes/notification.routes.js` | `NotificationsPage.jsx`, `AdminNotificationsPage.jsx`, `App.jsx` | `real_dev/api/tests/mf4.integration.test.js` |
| `BK-MF4-05` | `models/routine-alert-preference.model.js`, `validators/routine-alert.validator.js`, `services/routine-alert.service.js`, `controllers/routine-alert.controller.js`, `routes/routine-alert.routes.js` | `RoutineAlertsPage.jsx`, `App.jsx` | `real_dev/api/tests/mf4.integration.test.js` cobre `now` controlado e `now` invalido |
| `BK-MF4-08` | `models/profile.model.js`, `validators/profile.validator.js`, `services/profile.service.js`, `services/recommendation-restrictions.service.js`, `services/recommendation.service.js` | `EditProfilePage.jsx`, `ProductRecommendationsPage.jsx` | `real_dev/api/tests/mf4.integration.test.js`, `real_dev/api/tests/mf2.integration.test.js` |

## Contratos consumidos

- `MF0`: sessao por cookie HttpOnly, roles canonicas, perfil, produtos e categorias.
- `MF1`: reviews publicas, fotografias, analises e relatorios faciais minimizados.
- `MF2`: recomendacoes, rotinas diarias e feedback/revisao de recomendacoes.
- `MF3`: `Order`, historico, checkout/pagamento, dashboard, stock e separacao carrinho/encomenda/pagamento.

## Contratos entregues

- Gestao admin de contas com `accountStatus`, suspensao, reativacao e eliminacao logica.
- Moderacao admin de reviews com preservacao do conteudo original do cliente.
- Exportacao minimizada de vendas, utilizadores e relatorios IA em CSV/PDF descarregaveis.
- Notificacoes internas autenticadas, campanhas admin e notificacoes de estado de encomenda.
- Alertas de rotina baseados em preferencias do utilizador e `DailyRoutine`.
- Restricoes cosmeticas no perfil e filtro backend de recomendacoes por alergias/ingredientes.

## Coerencia entre MFs

- `MF3 -> MF4`: `CUMPRE`. A `MF4` reutiliza `Order`, `Review`, `DailyRoutine`, `Profile` e `ProductRecommendation` sem endpoints paralelos. Gateways de pagamento encontrados na pesquisa estatica pertencem ao contrato documentado da `MF3` e estao isolados em `payment.provider.js`.
- Dentro da `MF4`: `CUMPRE`. As responsabilidades estao separadas por dominio e a execucao admin de alertas aceita `now` ISO opcional validado para teste/operacao deterministica.
- `MF4 -> MF5`: `CUMPRE`. A `MF4` nao antecipa eliminacao/anonymizacao biometrica formal; esse handoff fica corretamente reservado para `BK-MF5-01` e auditoria sensivel em `BK-MF5-04`.

## Findings atuais

Sem findings atuais confirmados apos a correcao de `ORELLE-MF4-BK05-P3-001`.

## Findings anteriores reavaliados

| Finding anterior | Estado atual | Evidencia |
| --- | --- | --- |
| `ORELLE-MF4-BK01-P1-001` | `JA_CORRIGIDO` | `auth.middleware.js:43-90` seleciona `role isActive accountStatus` e substitui `req.user.role`; teste `mf4.integration.test.js:230-240` confirma `403` quando JWT antigo diz admin mas BD diz cliente. |
| `ORELLE-MF4-BK03-P1-002` | `JA_CORRIGIDO` | `admin-export.controller.js:18-26` envia headers e body binario; `AdminExportsPage.jsx:63-79` descarrega `Blob`; teste `mf4.integration.test.js:326-354` valida CSV minimizado. |
| `ORELLE-MF4-SEC-P1-003` | `JA_CORRIGIDO` | `.env` local verificado sem expor valores: `MONGODB_URI` ativa com comprimento de URI local esperado e `SESSION_SECRET` com 64 caracteres; `env.js:10-31` rejeita placeholders/segredos curtos; teste `mf4.integration.test.js:611-617` cobre placeholders. |
| `ORELLE-MF4-BK08-P2-004` | `JA_CORRIGIDO` | `recommendation.service.js:169-231` filtra antes de persistir; teste `mf4.integration.test.js:490-609` confirma que produto bloqueado nao entra em `ProductRecommendation.findOneAndUpdate`. |
| `ORELLE-MF4-BK05-P3-001` | `CORRIGIDO` | `routine-alert.validator.js` valida `now` ISO opcional, `routine-alert.controller.js` chama `createDueRoutineAlerts(input.now)`, e `mf4.integration.test.js` cobre `now` controlado e invalido. |

## Findings por severidade

| Severidade | Quantidade atual | IDs |
| --- | ---: | --- |
| `P0` | 0 | - |
| `P1` | 0 | - |
| `P2` | 0 | - |
| `P3` | 0 | - |

## Pesquisa estatica

Comando executado:

```bash
rg -n "FaithFlix|OPSA|StudyFlow|streaming|fiscalidade|turma|sala|multiempresa|TODO implementar|FIXME|temporario|temporary|demo only|implementar depois|pseudo-codigo|payload: unknown|as any|localStorage|sessionStorage|dangerouslySetInnerHTML|eval\\(|new Function|password.*console|token.*console|cookie.*console|image.*console|relatorio.*console|secret|api[_-]?key|stripe|paypal|mbway|webhook|RAG|embeddings|IA generativa|treino externo|deleteMany\\(\\{\\}\\)" real_dev/api real_dev/web --glob '!.env' --glob '!node_modules/**' --glob '!dist/**'
```

Resultado:

- Sem matches de dominios indevidos como FaithFlix, OPSA, StudyFlow, streaming, fiscalidade, turmas, salas ou multiempresa.
- Sem `localStorage`/`sessionStorage` funcional para tokens; a ocorrencia esta em comentario de `session.service.js` a proibir esse uso.
- Sem `dangerouslySetInnerHTML`, `eval` ou `new Function`.
- Matches de Stripe/PayPal/MBWay pertencem a `MF3` e estao documentados/isolados em `payment.provider.js`.
- Matches de `secret` pertencem ao guardrail de `SESSION_SECRET` e aos testes que confirmam placeholders inseguros.
- Texto sobre `treino externo` aparece no provider local de analise para declarar que fotografias nao sao enviadas para treino externo.
- `.env` foi verificado por comando seguro que nao imprime valores: `MONGODB_URI` e `SESSION_SECRET` existem sem expor conteudo; `SESSION_SECRET` tem comprimento forte.

## Comandos executados

| Comando | Resultado | Observacao |
| --- | --- | --- |
| `git status --short` | `PASS_INFO` | Mostrou relatorios tecnicos MF4 untracked; `real_dev/` nao foi tratado como problema por contrato da prompt. |
| `npm --prefix real_dev/api test` | `FAIL_SANDBOX` | No sandbox falhou por `listen EPERM 0.0.0.0`, restricao local de sockets do Supertest. |
| `npm --prefix real_dev/api test -- tests/mf4.integration.test.js` fora do sandbox | `PASS` | `1` ficheiro, `12` testes. |
| `npm --prefix real_dev/api test` fora do sandbox | `PASS` | `16` ficheiros, `129` testes. |
| `npm --prefix real_dev/web run build` | `PASS` | Vite build concluido com `66` modulos transformados. |
| Pesquisa estatica `rg` | `PASS_COM_OCORRENCIAS_ESPERADAS` | Ocorrencias classificadas como contrato MF3, guardrails ou comentarios seguros. |
| Verificacao segura de `.env` por `awk` | `PASS` | Validou chaves e comprimentos sem imprimir segredos. |
| `bash scripts/validate-planificacao.sh` | `FAIL_DOCS` | Cobertura/consistencia OK; `guides_pass=false` por qualidade dos guias MF4. Fora de scope por `PERMITIR_ALTERAR_DOCS=nao`. |
| `git diff --check` | `PASS` | Sem whitespace errors. |

## Ficheiros auditados

- `real_dev/api/src/app.js`
- `real_dev/api/src/middlewares/auth.middleware.js`
- `real_dev/api/src/middlewares/role.middleware.js`
- `real_dev/api/src/config/env.js`
- `real_dev/api/src/routes/admin-users.routes.js`
- `real_dev/api/src/services/admin-users.service.js`
- `real_dev/api/src/services/admin-review.service.js`
- `real_dev/api/src/services/admin-export.service.js`
- `real_dev/api/src/controllers/admin-export.controller.js`
- `real_dev/api/src/services/notification.service.js`
- `real_dev/api/src/routes/notification.routes.js`
- `real_dev/api/src/services/routine-alert.service.js`
- `real_dev/api/src/controllers/routine-alert.controller.js`
- `real_dev/api/src/routes/routine-alert.routes.js`
- `real_dev/api/src/validators/routine-alert.validator.js`
- `real_dev/api/src/validators/profile.validator.js`
- `real_dev/api/src/services/profile.service.js`
- `real_dev/api/src/services/recommendation-restrictions.service.js`
- `real_dev/api/src/services/recommendation.service.js`
- `real_dev/api/tests/mf4.integration.test.js`
- `real_dev/web/src/services/apiClient.js`
- `real_dev/web/src/pages/AdminExportsPage.jsx`

## Ficheiros alterados nesta execucao

- `real_dev/api/src/validators/routine-alert.validator.js`
- `real_dev/api/src/controllers/routine-alert.controller.js`
- `real_dev/api/tests/mf4.integration.test.js`
- `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF4.md`
- `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF4.md`

Nao foram alterados BKs, RF/RNF, matriz, backlog, prompts, `apps/`, `mockup/` ou `agent/legacy/**`.

## Blockers e TODOs

- `TODO (DOCS/FORA_DE_SCOPE)`: `scripts/validate-planificacao.sh` continua a falhar por qualidade dos guias canonicos MF4: blocos pedagogicos/operacionais, matriz de testes e politica negativa. Nao corrigido porque `PERMITIR_ALTERAR_DOCS=nao`.

## Conclusao

A `MF4` esta funcional, integrada e validada em `real_dev`, sem findings atuais `P0`, `P1`, `P2` ou `P3`.

Proxima acao recomendada: corrigir a qualidade dos guias canonicos MF4 apenas numa execucao propria com `PERMITIR_ALTERAR_DOCS=sim`, se for necessario fechar tambem o validador documental.
