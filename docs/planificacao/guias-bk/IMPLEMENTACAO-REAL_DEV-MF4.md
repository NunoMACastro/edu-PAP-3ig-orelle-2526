# Implementacao real_dev MF4 - Orelle

## Metadados

- Projeto: `Orelle`
- Macrofase alvo: `MF4`
- Modo executado: `implementar`
- Implementation root: `real_dev`
- Output mode: `relatorio_e_resumo`
- BKs abrangidos: todos os BKs oficiais da `MF4`
- BK IDs: `BK-MF4-01`, `BK-MF4-02`, `BK-MF4-03`, `BK-MF4-04`, `BK-MF4-05`, `BK-MF4-08`
- Data da execucao: `2026-06-18`
- Commits: `nao realizados`
- Documentos canonicos/BKs/prompts: `nao alterados`
- Relatorio tecnico: `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF4.md`

## Sumario executivo

Foi implementada a `MF4` em `real_dev`, integrada na app real Express/Mongoose/React existente, sem criar endpoints paralelos fora da arquitetura atual. A implementacao manteve os contratos validados de `MF0` a `MF3` e acrescentou modulos reais para gestao de contas, moderacao de reviews, exportacoes minimizadas, notificacoes internas, alertas de rotina e restricoes cosmeticas no perfil/recomendacoes.

Resultado final validado:

- API: `npm --prefix real_dev/api test` passou com `16` ficheiros e `125` testes.
- Web: `npm --prefix real_dev/web run build` passou.
- Sintaxe: `node --check` passou nos ficheiros criticos alterados.
- Whitespace tracked: `git diff --check` passou.

## BKs implementados

| BK | RF | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF4-01` | `RF33` | `IMPLEMENTADO` | `User` tem `accountStatus`; login e sessao bloqueiam conta inativa; admin lista, suspende, reativa e elimina logicamente contas. |
| `BK-MF4-02` | `RF34` | `IMPLEMENTADO` | `Review` tem metadados de moderacao; admin lista/modera visibilidade sem alterar comentario/rating do cliente; reviews publicas filtram `published`. |
| `BK-MF4-03` | `RF35` | `IMPLEMENTADO` | `GET /api/admin/exports/:dataset` exporta `sales`, `users` e `ai-reports` em CSV/PDF simples com minimizacao de campos sensiveis. |
| `BK-MF4-04` | `RF36` | `IMPLEMENTADO` | `Notification` suporta notificacoes internas, campanhas admin, ownership em `/api/me/notifications` e notificacao de estado de encomenda. |
| `BK-MF4-05` | `RF37` | `IMPLEMENTADO` | Preferencias de alertas de rotina e runner admin idempotente reutilizam `Notification` e `DailyRoutine`. |
| `BK-MF4-08` | `RF40` | `IMPLEMENTADO` | `Profile` guarda alergias, ingredientes a evitar e restricoes leves; recomendacoes exigem perfil e filtram produtos bloqueados antes de persistir. |

## Alteracoes principais

### Backend/API

- `real_dev/api/src/app.js`: montagem das rotas MF4.
- `real_dev/api/src/models/user.model.js`: estados de conta e metadados de suspensao/eliminacao.
- `real_dev/api/src/services/auth.service.js`: bloqueio de login para contas inativas.
- `real_dev/api/src/middlewares/auth.middleware.js`: revalidacao de estado de conta em runtime real e em testes com mock explicito.
- `real_dev/api/src/services/admin-users.service.js`, `controllers/admin-users.controller.js`, `routes/admin-users.routes.js`: gestao admin de utilizadores preservando alteracao de role existente.
- `real_dev/api/src/models/review.model.js`, `services/review.service.js`: estados e filtro publico de reviews.
- `real_dev/api/src/validators/admin-review.validator.js`, `services/admin-review.service.js`, `controllers/admin-review.controller.js`, `routes/admin-review.routes.js`: moderacao admin.
- `real_dev/api/src/validators/admin-export.validator.js`, `services/admin-export.service.js`, `controllers/admin-export.controller.js`, `routes/admin-export.routes.js`: exportacoes minimizadas.
- `real_dev/api/src/models/notification.model.js`, `validators/notification.validator.js`, `services/notification.service.js`, `controllers/notification.controller.js`, `routes/notification.routes.js`: notificacoes internas e estado de encomenda.
- `real_dev/api/src/models/routine-alert-preference.model.js`, `validators/routine-alert.validator.js`, `services/routine-alert.service.js`, `controllers/routine-alert.controller.js`, `routes/routine-alert.routes.js`: preferencias e execucao de alertas de rotina.
- `real_dev/api/src/models/profile.model.js`, `validators/profile.validator.js`, `services/profile.service.js`: campos de restricoes cosmeticas no perfil.
- `real_dev/api/src/services/recommendation-restrictions.service.js`, `services/recommendation.service.js`: filtro de produtos por restricoes e perfil obrigatorio para recomendacoes.
- `real_dev/api/tests/mf2.integration.test.js`: atualizacao do contrato de recomendacoes para exigir perfil.
- `real_dev/api/tests/mf4.integration.test.js`: novos testes MF4.

### Frontend/Web

- `real_dev/web/src/App.jsx`: integracao das vistas MF4.
- `real_dev/web/src/pages/AdminUsersPage.jsx`: gestao admin de utilizadores.
- `real_dev/web/src/pages/AdminReviewsPage.jsx`: moderacao de reviews.
- `real_dev/web/src/pages/AdminExportsPage.jsx`: exportacoes admin.
- `real_dev/web/src/pages/NotificationsPage.jsx`: notificacoes do utilizador.
- `real_dev/web/src/pages/AdminNotificationsPage.jsx`: campanhas admin.
- `real_dev/web/src/pages/RoutineAlertsPage.jsx`: preferencias de alertas.
- `real_dev/web/src/pages/EditProfilePage.jsx`: edicao de alergias, ingredientes a evitar e restricoes leves.
- `real_dev/web/src/pages/ProductRecommendationsPage.jsx`: apresentacao de limitacoes/restricoes nas recomendacoes.

## Findings apos implementacao

| ID | Severidade | Estado | Descricao |
| --- | --- | --- | --- |
| `ORELLE-MF4-RUNTIME-P0-001` | `P0` | `FECHADO` | `MF4` nao existia no runtime real; agora tem backend, frontend e testes focados. |
| `ORELLE-MF4-SESSION-P1-001` | `P1` | `FECHADO` | Contas suspensas/eliminadas bloqueiam login e sessoes revalidadas em runtime real. |
| `ORELLE-MF4-RESTRICTIONS-P1-001` | `P1` | `FECHADO` | Recomendacoes agora exigem perfil e filtram ingredientes bloqueados, incluindo normalizacao sem acentos. |
| `ORELLE-MF4-E2E-P3-001` | `P3` | `ACEITE` | Nao foi executado E2E browser ponta-a-ponta com API e web em simultaneo; mitigado por build web e testes HTTP da API. |
| `ORELLE-MF4-MF5-HANDOFF-P3-001` | `P3` | `FORA_DE_SCOPE` | `MF5` continua como fase seguinte a auditar/implementar; `MF4` entrega contratos para esse handoff. |

## Coerencia MF3 -> MF4 -> MF5

- `MF3 -> MF4`: preservada. `MF4` consome `Order`, `DailyRoutine`, `ProductRecommendation`, `FaceReport`, `Review`, `User`, roles e sessao sem quebrar os testes existentes.
- Dentro da `MF4`: responsabilidades ficaram separadas por dominio: contas, reviews, exportacoes, notificacoes, alertas e restricoes.
- `MF4 -> MF5`: preparada. Eliminacao de conta e restricoes cosmeticas nao apagam/anonymizam dados biometricos; esse contrato continua reservado para `BK-MF5-01` e auditoria biometrica para `BK-MF5-04`.

## Validacoes executadas

| Comando/verificacao | Resultado | Observacao |
| --- | --- | --- |
| `node --check real_dev/api/src/app.js` | `PASS` | Sintaxe valida. |
| `node --check real_dev/api/src/services/auth.service.js` | `PASS` | Sintaxe valida. |
| `node --check real_dev/api/src/middlewares/auth.middleware.js` | `PASS` | Sintaxe valida. |
| `node --check real_dev/api/src/services/admin-users.service.js` | `PASS` | Sintaxe valida. |
| `node --check real_dev/api/src/services/admin-export.service.js` | `PASS` | Sintaxe valida. |
| `node --check real_dev/api/src/services/notification.service.js` | `PASS` | Sintaxe valida. |
| `node --check real_dev/api/src/services/routine-alert.service.js` | `PASS` | Sintaxe valida. |
| `node --check real_dev/api/src/services/recommendation.service.js` | `PASS` | Sintaxe valida. |
| `node --check real_dev/api/src/services/recommendation-restrictions.service.js` | `PASS` | Sintaxe valida. |
| `npm --prefix real_dev/api test -- tests/mf2.integration.test.js` | `PASS` | `12` testes, incluindo perfil obrigatorio. |
| `npm --prefix real_dev/api test -- tests/mf4.integration.test.js` | `PASS` | `8` testes MF4. |
| `npm --prefix real_dev/api test` fora da sandbox aprovada | `PASS` | `16` ficheiros, `125` testes. |
| `npm --prefix real_dev/web run build` | `PASS` | Vite build concluido com `66` modulos transformados. |
| `git diff --check` | `PASS` | Sem erros de whitespace em ficheiros tracked. |
| `git status --short --ignored real_dev docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF4.md` | `INFO` | `real_dev/` esta ignored conforme esperado; relatorio tecnico esta untracked. |

## Validacoes nao executadas

- Nao foi executado E2E browser com backend e frontend ligados ao mesmo tempo.
- Nao foi testada exportacao PDF visual por renderer, porque o PDF MF4 e textual/minimo e a validacao exigida foi API/build.
- Nao foi testado provider externo de email/SMS/push, porque `RF36` foi implementado como notificacoes internas MVP sem provider externo.
- Nao foram criados commits, push ou PR por `PERMITIR_COMMITS: nao`.

## Decisoes tecnicas

- `RF36` foi implementado com notificacoes internas autenticadas, sem inventar email, SMS ou push provider.
- `RF35` usa CSV compativel com Excel e PDF textual simples sem dependencia nova.
- `RF37` usa runner admin explicito para alertas, sem agendador externo inventado.
- `RF40` aplica restricoes por comparacao normalizada de ingredientes, sem diagnosticos ou claims medicos.
- A middleware de auth revalida estado de conta em runtime real. Em testes sem BD real, evita consulta pendurada; quando o teste fornece `User.findById` mockado, a revalidacao e exercitada.

## Blockers/TODOs

- Sem blocker tecnico para `MF4`.
- TODO futuro: executar E2E browser real quando houver fluxo de QA integrado API+web.
- TODO futuro: auditar/implementar `MF5`, sobretudo eliminacao/anonymizacao de dados biometricos e auditoria de acessos.

## Proxima acao recomendada

Rever manualmente as novas paginas MF4 no browser com utilizadores `admin` e `cliente`, depois avancar para auditoria/implementacao da `MF5`.
