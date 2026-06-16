# Auditoria de implementacao real_dev MF3 - Orelle

## Resultado geral

- Projeto: `Orelle`
- Macrofase alvo: `MF3`
- Modo executado: `auditar_implementacao`
- Implementation root: `real_dev`
- Backend/API auditado: `real_dev/api`
- Frontend/web auditado: `real_dev/web`
- Data de execucao: `2026-06-15`
- Estado geral: `AUDITADO_OK`
- Codigo alterado: nao
- Relatorio tecnico atualizado: sim
- Commits/push: nao executados

A implementacao atual da `MF3` em `real_dev/api` e `real_dev/web` cumpre os contratos auditados para comparacao temporal, carrinho, checkout/pagamentos, historico, recompra, dashboard administrativo e stock. Os dois findings `P1` registados na auditoria anterior foram revalidados contra o codigo atual e encontram-se corrigidos pelo relatorio `CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF3.md`.

## Escopo auditado

- `MF_ALVO`: `MF3`
- `BK_IDS`: todos os BKs da macrofase
- BKs abrangidos: `BK-MF3-01`, `BK-MF3-02`, `BK-MF3-03`, `BK-MF3-04`, `BK-MF3-06`, `BK-MF3-07`, `BK-MF3-08`
- Macrofases vizinhas verificadas: `MF2 -> MF3 -> MF4`
- Pastas usadas como implementacao real: `real_dev/api`, `real_dev/web`
- Pastas ignoradas como destino: `apps/`, `agent/legacy/**`
- `real_dev/` fora do git nao foi tratado como finding, conforme regra da prompt.

## Documentos e relatorios consultados

- `README.md`
- `docs/RF.md`
- `docs/RNF.md`
- `docs/planificacao/README.md`
- `docs/planificacao/CORE-DUAL-CONTRATO.md`
- `docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`
- `docs/planificacao/backlogs/BACKLOG-MVP.md`
- `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
- `docs/planificacao/backlogs/CONTRATO-CAMPOS-BK.md`
- `docs/planificacao/backlogs/MF-VIEWS.md`
- `docs/planificacao/backlogs/ANEXO-RF-PARA-BKS.md`
- `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
- `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
- `docs/planificacao/sprints/PLANO-SPRINTS.md`
- `docs/planificacao/sprints/SCORECARD-SPRINTS.md`
- `docs/planificacao/guias-bk/README.md`
- `docs/planificacao/guias-bk/_TEMPLATE-BK.md`
- todos os guias de `docs/planificacao/guias-bk/MF3/`
- guias e contratos relevantes de `MF0`, `MF1`, `MF2` e `MF4`
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF0.md`
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF1.md`
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF2.md`
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF3.md`
- `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF3.md`
- `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF3.md`
- `real_dev/IMPLEMENTACAO-MF2.md`
- `real_dev/AUDITORIA-IMPLEMENTACAO-MF1.md`
- `real_dev/AUDITORIA-IMPLEMENTACAO-MF2.md`

## Estado por BK

| BK | RF/RNF | Estado | Evidencia principal | Resultado |
| --- | --- | --- | --- | --- |
| `BK-MF3-01` | `RF25` | `AUDITADO_OK` | `SkinComparison`, `POST /api/me/skin-comparisons`, `SkinComparisonPage.jsx`, testes MF3 | Compara analises do proprio utilizador, exige 30 dias e devolve DTO sem fotografias, `storageKey` ou paths internos. |
| `BK-MF3-02` | `RF26` | `AUDITADO_OK` | `Cart`, `GET/POST/PATCH/DELETE /api/cart`, `CartPage.jsx`, testes MF3 | Carrinho usa sessao autenticada, valida produto/quantidade/stock no backend e nao aceita preco nem `userId` do frontend. |
| `BK-MF3-03` | `RF27`, coerencia com `RNF17` | `AUDITADO_OK` | `Order`, `payment.provider.js`, `POST /api/orders/checkout`, `CheckoutPage.jsx`, testes MF3 | Checkout cria encomenda a partir do carrinho, revalida preco/stock, Stripe sem chave devolve `503` antes de mutacoes e PayPal/MBWay ficam stub honesto. |
| `BK-MF3-04` | `RF28` | `AUDITADO_OK` | `GET /api/me/orders`, `PurchaseHistoryPage.jsx`, testes MF3 | Historico e filtrado por sessao, devolve snapshots de produtos e nao expoe `userId`. |
| `BK-MF3-06` | `RF30` | `AUDITADO_OK` | `POST /api/me/orders/:orderId/reorder`, `reorder.service.js`, `PurchaseHistoryPage.jsx`, testes MF3 | Recompra valida ownership, disponibilidade atual e adiciona ao carrinho sem criar checkout automatico. |
| `BK-MF3-07` | `RF31` | `AUDITADO_OK` | `GET /api/admin/dashboard/stats`, `AdminDashboardPage.jsx`, testes MF3 | Endpoint protegido por `administrador`; metricas sao agregadas e contam apenas encomendas pagas. |
| `BK-MF3-08` | `RF32` | `AUDITADO_OK` | `GET /api/admin/stock/alerts`, `PATCH /api/admin/products/:productId/stock`, `applyOrderStockUpdate`, testes MF3 | Alertas usam limite `<5`, ajuste manual e admin-only, e reducao automatica de stock corre em transacao MongoDB com protecao contra duplicacao. |

## Rastreabilidade BK -> RF/RNF -> ficheiros -> testes

| BK | Backend/API | Frontend | Testes/evidence |
| --- | --- | --- | --- |
| `BK-MF3-01` | `skin-comparison.model.js`, `skin-comparison.validator.js`, `skin-comparison.service.js`, `skin-comparison.controller.js`, `skin-comparison.routes.js` | `SkinComparisonPage.jsx`, `App.jsx` | `real_dev/api/tests/mf3.integration.test.js` |
| `BK-MF3-02` | `cart.model.js`, `cart.validator.js`, `cart.service.js`, `cart.controller.js`, `cart.routes.js` | `CartPage.jsx`, `ProductSearchPage.jsx`, `ProductDetailsPage.jsx`, `App.jsx` | `real_dev/api/tests/mf3.integration.test.js` |
| `BK-MF3-03` | `order.model.js`, `checkout.validator.js`, `order.service.js`, `order.controller.js`, `order.routes.js`, `payment.provider.js` | `CheckoutPage.jsx`, `App.jsx` | `real_dev/api/tests/mf3.integration.test.js` |
| `BK-MF3-04` | `order.service.js`, `order.controller.js`, `order.routes.js` | `PurchaseHistoryPage.jsx`, `App.jsx` | `real_dev/api/tests/mf3.integration.test.js` |
| `BK-MF3-06` | `reorder.service.js`, `reorder.controller.js`, `reorder.routes.js`, `checkout.validator.js` | `PurchaseHistoryPage.jsx` | `real_dev/api/tests/mf3.integration.test.js` |
| `BK-MF3-07` | `admin-dashboard.service.js`, `admin-dashboard.controller.js`, `admin-dashboard.routes.js` | `AdminDashboardPage.jsx`, `App.jsx` | `real_dev/api/tests/mf3.integration.test.js` |
| `BK-MF3-08` | `stock.validator.js`, `stock.service.js`, `stock.controller.js`, `stock.routes.js` | `StockAdminPage.jsx`, `App.jsx` | `real_dev/api/tests/mf3.integration.test.js` |

## Contratos consumidos

- `Product` de `MF0/MF1`: `name`, `brandName`, `priceCents`, `stock`, `imageUrl`, `categoryIds`.
- `FaceAnalysis` de `MF1`: analises `completed`, `findings`, `createdAt`, ownership por `userId`.
- `FacePhoto`/consentimento facial de `MF1` como pre-condicao historica para dados biometricos usados em analises.
- `requireAuth`, cookie HttpOnly e `req.user.id` de `MF0`.
- `requireRole(ROLES.ADMIN)` e roles `cliente`, `consultor`, `administrador`.
- Cliente web `apiRequest` com `credentials: "include"`.
- Contratos `MF2` de recomendacao, rotina, simulacao e visualizacao antes/depois sem compra automatica.

## Contratos entregues

- `SkinComparison` minimizado para comparacao temporal entre analises do proprio utilizador.
- `Cart` autenticado com snapshots de preco/nome e checkout a revalidar produto, preco e stock.
- `Order` com `items`, `totalCents`, `status`, `payment` e `stockReserved`.
- `POST /api/orders/checkout` com gateway validado, Stripe controlado e stubs honestos PayPal/MBWay.
- `GET /api/me/orders` para historico, recompra e notificacoes futuras.
- `POST /api/me/orders/:orderId/reorder` para voltar a colocar produtos disponiveis no carrinho.
- `GET /api/admin/dashboard/stats` com agregados comerciais sem PII.
- `GET /api/admin/stock/alerts`, `PATCH /api/admin/products/:productId/stock` e `applyOrderStockUpdate(orderId)`.

## Coerencia entre MFs

- `MF2 -> MF3`: `CUMPRE`. A MF3 nao transforma recomendacoes ou simulacoes em compras automaticas, mantem separacao entre comparacao temporal e visualizacao imediata e preserva `apiRequest` com cookies.
- `MF3`: `CUMPRE`. Todos os BKs auditados ficam `AUDITADO_OK` na implementacao atual.
- `MF3 -> MF4`: `CUMPRE`. `Order`, historico, dashboard e stock entregam contratos reutilizaveis para exportacao, notificacoes, gestao administrativa e alertas futuros. Webhooks Stripe reais continuam fora do scope da MF3 e dependem de contrato/configuracao futura.

## Findings atuais

Nao foram confirmados findings atuais `P0`, `P1`, `P2` ou `P3` dentro do escopo auditado.

| Severidade | Total aberto | IDs |
| --- | ---: | --- |
| `P0` | 0 | - |
| `P1` | 0 | - |
| `P2` | 0 | - |
| `P3` | 0 | - |

## Findings historicos revalidados

| Finding historico | Severidade original | Estado atual | Evidencia de fecho |
| --- | --- | --- | --- |
| `ORELLE-MF3-BK03-P1-001` | `P1` | `JA_CORRIGIDO` | `assertPaymentGatewayReady` em `payment.provider.js`; `checkoutMyCart` chama a validacao antes de criar `Order`; teste MF3 confirma `503`, sem `Order.create`, sem `Product.find` e sem `Cart.deleteOne`. |
| `ORELLE-MF3-BK08-P1-001` | `P1` | `JA_CORRIGIDO` | `applyOrderStockUpdate` usa `mongoose.startSession()` e `session.withTransaction(...)`; testes MF3 cobrem pagamento nao pago, agrupamento, segunda execucao e falha de preflight sem reducao parcial. |

## Pesquisa estatica obrigatoria

Comando executado:

```bash
rg -n "FaithFlix|OPSA|StudyFlow|streaming|fiscalidade|turma|sala|multiempresa|TODO implementar|FIXME|temporario|temporary|demo only|implementar depois|pseudo-codigo|payload: unknown|as any|localStorage|sessionStorage|dangerouslySetInnerHTML|eval\\(|new Function|password.*console|token.*console|cookie.*console|image.*console|relatorio.*console|secret|api[_-]?key|stripe|paypal|mbway|webhook|RAG|embeddings|IA generativa|treino externo|deleteMany\\(\\{\\}\\)" real_dev/api real_dev/web
```

Resultado: exit code `0` com ocorrencias justificadas.

- `stripe`, `paypal`, `mbway`: esperado em provider, modelo, UI e testes de `RF27`.
- `STRIPE_SECRET_KEY`/`secret`: esperado em `env.js`/provider; nao ha segredo hardcoded.
- `localStorage/sessionStorage`: aparece apenas em comentario de seguranca de `session.service.js`, nao como armazenamento real de sessao/token.
- `treino externo`: aparece em limitacao segura do provider de analise facial.
- Nao foram encontradas ocorrencias reais de `payload: unknown`, `as any`, `dangerouslySetInnerHTML`, `eval`, `new Function`, logs de passwords/tokens/cookies/imagens/relatorios, `deleteMany({})`, dominios indevidos ou claims medicos novos na MF3.

Pesquisa complementar a logs/segredos:

- `console.log` existe apenas em scripts operacionais (`seed-admin.js`, `seed-categories.js`) e em `server.js` para indicar porta local; nao foram encontrados logs de password, token, cookie, imagem, relatorio ou dados biometricos.
- Ocorrencias de `storageKey` ficam em services/models de fotografia/analise e nao sao devolvidas pelos DTOs MF3 auditados.

## Comandos executados

| Comando | Resultado |
| --- | --- |
| `git status --short` | Mostrou relatorios tecnicos MF3 como untracked; nao tratado como falha. |
| `npm --prefix real_dev/api test` dentro do sandbox | `FAIL` ambiental: Supertest tentou `listen 0.0.0.0` e recebeu `EPERM`; nao foi classificado como falha funcional da app. |
| `npm --prefix real_dev/api test` fora do sandbox aprovado | `PASS`: 15 ficheiros, 116 testes. |
| `npm --prefix real_dev/web run build` | `PASS`: Vite build concluido. |
| `npm --prefix real_dev/web run smoke:mf2` | `PASS`: contratos MF2 presentes. |
| `bash scripts/validate-planificacao.sh` | `PASS`: `overall_pass: true`. |
| Pesquisa estatica obrigatoria `rg` | `PASS com ocorrencias justificadas`. |
| Pesquisa complementar a logs/segredos | `PASS com ocorrencias justificadas`. |
| `git diff --check` | `PASS`. |

## Validacoes nao executadas

- Nao foi executado E2E browser MF3 com backend real ligado nesta auditoria.
- Nao foi executado teste real com `STRIPE_SECRET_KEY`, porque exigiria segredo/configuracao externa e rede Stripe controlada.
- Nao foi executado teste real de concorrencia multi-processo para `applyOrderStockUpdate`; a cobertura atual valida a transacao, preflight, agrupamento e duplicacao por testes de integracao com mocks.

## Ficheiros auditados principais

- `real_dev/api/src/app.js`
- `real_dev/api/src/models/cart.model.js`
- `real_dev/api/src/models/order.model.js`
- `real_dev/api/src/models/skin-comparison.model.js`
- `real_dev/api/src/providers/payment.provider.js`
- `real_dev/api/src/services/cart.service.js`
- `real_dev/api/src/services/order.service.js`
- `real_dev/api/src/services/reorder.service.js`
- `real_dev/api/src/services/admin-dashboard.service.js`
- `real_dev/api/src/services/skin-comparison.service.js`
- `real_dev/api/src/services/stock.service.js`
- `real_dev/api/src/controllers/*`
- `real_dev/api/src/routes/*`
- `real_dev/api/src/validators/*`
- `real_dev/api/tests/mf3.integration.test.js`
- `real_dev/web/src/App.jsx`
- `real_dev/web/src/services/apiClient.js`
- `real_dev/web/src/pages/CartPage.jsx`
- `real_dev/web/src/pages/CheckoutPage.jsx`
- `real_dev/web/src/pages/PurchaseHistoryPage.jsx`
- `real_dev/web/src/pages/SkinComparisonPage.jsx`
- `real_dev/web/src/pages/AdminDashboardPage.jsx`
- `real_dev/web/src/pages/StockAdminPage.jsx`

## Ficheiros alterados por esta execucao

- `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF3.md`

Nenhum ficheiro de codigo foi alterado.

## Blockers e TODOs

- Sem blockers atuais para a auditoria MF3.
- TODO futuro, fora do escopo MF3: validar fluxo Stripe real com `STRIPE_SECRET_KEY` e ambiente de teste Stripe quando houver credenciais e contrato operacional.
- TODO futuro, fora do escopo MF3: E2E browser com backend real para cobrir fluxo visual completo de carrinho, checkout, historico, dashboard e stock.

## Recomendacao

Classificar a `MF3` como `AUDITADO_OK` no estado atual de `real_dev`. A proxima acao recomendada e avançar para validacao/correcao da `MF4` ou, se o objetivo for reforcar evidence, executar um E2E browser MF3 com backend real e dados seed controlados.
