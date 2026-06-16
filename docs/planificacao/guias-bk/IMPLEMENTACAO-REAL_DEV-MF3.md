# Implementacao REAL_DEV MF3 - Orelle

## Resultado geral

- Projeto: `Orelle`
- Macrofase alvo: `MF3`
- Modo: `implementar`
- Pasta implementada: `real_dev/`
- Data de execucao: `2026-06-15`
- Estado geral: `IMPLEMENTADO`
- Commits/push: nao executados

A MF3 foi implementada em `real_dev/api` e `real_dev/web`, mantendo a cadeia incremental `MF2 -> MF3 -> MF4` e sem alterar guias BK, matriz canonica, backlog, RF/RNF ou `apps/`.

## Documentos consultados

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
- Guias `docs/planificacao/guias-bk/MF0/`, `MF1/`, `MF2/`, `MF3/`
- Relatorios `real_dev/IMPLEMENTACAO-MF2.md`, `real_dev/AUDITORIA-IMPLEMENTACAO-MF2.md`
- Relatorios de hidratacao `AUDITORIA-HIDRATACAO-MF0..MF3`

## Stack real identificada

- Backend/API: Node.js, Express, ES Modules, Mongoose.
- Frontend/web: React + Vite.
- Autenticacao: cookie HttpOnly e `requireAuth`.
- Roles: `cliente`, `consultor`, `administrador`.
- Implementacao real: `real_dev/api` e `real_dev/web`.
- `apps/`: lido apenas como referencia potencial, nao alterado.

## BKs implementados

| BK | RF | Estado | Entrega principal |
| --- | --- | --- | --- |
| `BK-MF3-01` | `RF25` | `IMPLEMENTADO` | `SkinComparison`, `POST /api/me/skin-comparisons`, pagina `SkinComparisonPage`, ownership por sessao, intervalo minimo de 30 dias e DTO sem fotografias/paths. |
| `BK-MF3-02` | `RF26` | `IMPLEMENTADO` | `Cart`, endpoints `GET/POST/PATCH/DELETE /api/cart`, validacao de produto/stock no backend, UI `CartPage` e acoes no catalogo/detalhe. |
| `BK-MF3-03` | `RF27` | `IMPLEMENTADO` | `Order`, `POST /api/orders/checkout`, provider isolado de pagamento, Stripe controlado por `STRIPE_SECRET_KEY`, PayPal/MBWay como stub pendente honesto. |
| `BK-MF3-04` | `RF28` | `IMPLEMENTADO` | `GET /api/me/orders`, historico pessoal com data, total, produtos, estado e DTO sem `userId`. |
| `BK-MF3-06` | `RF30` | `IMPLEMENTADO` | `POST /api/me/orders/:orderId/reorder`, recompra para carrinho, sem checkout automatico, com produtos indisponiveis em `skipped`. |
| `BK-MF3-07` | `RF31` | `IMPLEMENTADO` | `GET /api/admin/dashboard/stats`, role `administrador`, estatisticas agregadas sem PII. |
| `BK-MF3-08` | `RF32` | `IMPLEMENTADO` | `GET /api/admin/stock/alerts`, `PATCH /api/admin/products/:productId/stock`, `applyOrderStockUpdate(orderId)`, baixo stock `<5` e protecao contra dupla reducao por `stockReserved`. |

## Ficheiros principais criados/alterados

### Backend/API

- `real_dev/api/src/models/skin-comparison.model.js`
- `real_dev/api/src/validators/skin-comparison.validator.js`
- `real_dev/api/src/services/skin-comparison.service.js`
- `real_dev/api/src/controllers/skin-comparison.controller.js`
- `real_dev/api/src/routes/skin-comparison.routes.js`
- `real_dev/api/src/models/cart.model.js`
- `real_dev/api/src/validators/cart.validator.js`
- `real_dev/api/src/services/cart.service.js`
- `real_dev/api/src/controllers/cart.controller.js`
- `real_dev/api/src/routes/cart.routes.js`
- `real_dev/api/src/models/order.model.js`
- `real_dev/api/src/providers/payment.provider.js`
- `real_dev/api/src/validators/checkout.validator.js`
- `real_dev/api/src/services/order.service.js`
- `real_dev/api/src/controllers/order.controller.js`
- `real_dev/api/src/routes/order.routes.js`
- `real_dev/api/src/services/reorder.service.js`
- `real_dev/api/src/controllers/reorder.controller.js`
- `real_dev/api/src/routes/reorder.routes.js`
- `real_dev/api/src/services/admin-dashboard.service.js`
- `real_dev/api/src/controllers/admin-dashboard.controller.js`
- `real_dev/api/src/routes/admin-dashboard.routes.js`
- `real_dev/api/src/validators/stock.validator.js`
- `real_dev/api/src/services/stock.service.js`
- `real_dev/api/src/controllers/stock.controller.js`
- `real_dev/api/src/routes/stock.routes.js`
- `real_dev/api/src/app.js`
- `real_dev/api/src/config/env.js`
- `real_dev/api/tests/mf3.integration.test.js`

### Frontend/web

- `real_dev/web/src/pages/SkinComparisonPage.jsx`
- `real_dev/web/src/pages/CartPage.jsx`
- `real_dev/web/src/pages/CheckoutPage.jsx`
- `real_dev/web/src/pages/PurchaseHistoryPage.jsx`
- `real_dev/web/src/pages/AdminDashboardPage.jsx`
- `real_dev/web/src/pages/StockAdminPage.jsx`
- `real_dev/web/src/App.jsx`
- `real_dev/web/src/pages/ProductSearchPage.jsx`
- `real_dev/web/src/pages/ProductDetailsPage.jsx`

## Contratos consumidos

- `Product` de MF0/MF1 com `priceCents`, `stock`, `name`, `imageUrl`.
- `FaceAnalysis` de MF1 com `findings`, `status`, `createdAt` e ownership por `userId`.
- `requireAuth`, cookie HttpOnly e `req.user.id`.
- `requireRole(ROLES.ADMIN)` para dashboard e stock.
- Cliente frontend `apiRequest` com `credentials: "include"`.
- Recomendacoes/rotinas MF2 mantidas sem acoplamento automatico ao carrinho.

## Contratos entregues

- Comparacao temporal minimizada para a cadeia de evolucao.
- Carrinho autenticado com `priceSnapshotCents`, mas checkout a revalidar preco atual.
- Encomenda persistente com `items`, `totalCents`, `status`, `payment` e `stockReserved`.
- Historico pessoal de encomendas para notificacoes futuras e recompra.
- Dashboard agregado para futura exportacao `BK-MF4-03`.
- Alertas/stock para notificacoes futuras `BK-MF4-04`.

## Decisoes tecnicas

- Nao foi adicionada dependencia `stripe`; o provider usa `fetch` nativo quando `STRIPE_SECRET_KEY` existir.
- Sem `STRIPE_SECRET_KEY`, Stripe devolve `requires_payment` e nao marca a encomenda como paga.
- PayPal/MBWay ficam como `pending_manual_confirmation`, sem fingir confirmacao de pagamento.
- Stock nao e reduzido no carrinho nem na simples criacao de encomenda.
- `applyOrderStockUpdate(orderId)` reduz stock apenas quando `payment.status = paid` e `stockReserved = false`.
- Recompra adiciona produtos disponiveis ao carrinho e nao cria pagamento/encomenda automaticamente.

## Coerencia entre MFs

- `MF2 -> MF3`: preservado. A comparacao temporal nao reutiliza simulacao/visualizacao imediata como prova de 30 dias; carrinho e checkout nao sao acionados por recomendacoes.
- `MF3 -> MF4`: preparado. `Order` suporta historico/notificacoes; dashboard entrega agregados para exportacao; stock entrega alertas para notificacoes futuras.
- Risco residual: a confirmacao real de pagamento por webhook continua fora do scope MF3/MVP atual e deve ser consolidada em `MF7-06` ou quando houver contrato operacional de webhooks.

## Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `npm run test -- tests/mf3.integration.test.js` em `real_dev/api` dentro da sandbox | FAIL ambiental: `listen EPERM 0.0.0.0` no Supertest. |
| `npm run test -- tests/mf3.integration.test.js` em `real_dev/api` fora da sandbox | PASS, 13 testes. |
| `npm run test` em `real_dev/api` fora da sandbox | PASS, 15 ficheiros, 111 testes. |
| `npm run build` em `real_dev/web` | PASS. |
| `npm run smoke:mf2` em `real_dev/web` | PASS. |
| `bash scripts/validate-planificacao.sh` | PASS, `overall_pass: true`. |
| `git diff --check` | PASS. |
| Pesquisa estatica `rg` pedida pela prompt em `real_dev/api real_dev/web` | PASS com ocorrencias justificadas. |
| Vite `npm run dev -- --host 127.0.0.1 --port 4178` + browser integrado | PASS visual basico: secções MF3 renderizadas; sem erros de consola. Alerta visivel de API era esperado porque o backend nao estava ligado nessa verificacao. |

## Pesquisa estatica

Ocorrencias encontradas e justificadas:

- `stripe`, `paypal`, `mbway`: esperadas em `payment.provider.js`, `order.model.js`, `CheckoutPage.jsx` e testes MF3 por serem parte de `RF27`.
- `STRIPE_SECRET_KEY`: esperado em `config/env.js` e `payment.provider.js`; segredo lido por env, nao hardcoded.
- `treino externo`: esperado em provider MF1 como limitacao segura que informa que fotografias nao sao usadas para treino externo.
- `localStorage/sessionStorage`: aparece em comentario de seguranca existente em `session.service.js`, nao como uso de sessao/token no frontend.

Nao foram encontradas ocorrencias reais de `payload: unknown`, `as any`, `dangerouslySetInnerHTML`, `eval`, `new Function`, tokens em storage do browser, logs de passwords/tokens/cookies/imagens/relatorios, `deleteMany({})`, domínios indevidos ou claims medicos novos na implementacao MF3.

## Blockers e TODOs

- Sem blocker tecnico para executar testes/build.
- `real_dev/` continua fora do git; isto e esperado pela prompt e nao foi tratado como falha.
- Webhooks Stripe e confirmacao automatica externa de pagamento nao foram inventados nesta MF. Permanecem dependentes de contrato/configuracao futura.

## Conclusao

A `MF3` fica implementada em `real_dev` com backend, frontend, testes focados, validacao de build e preservacao de contratos anteriores. A app continua executavel no scope validado, com comercio separado entre carrinho, encomenda, pagamento, historico, recompra e stock.
