# Funções Fundamentais Da Aplicação - Orélle

Data do levantamento: 2026-07-07
Base do levantamento: `real_dev/api/src` e `real_dev/web/src`

## Critérios

- A lista foi extraída por AST a partir do código real em `real_dev`.
- Inclui funções/métodos nomeados de runtime com JSDoc: controllers, services, validators, middlewares, providers, componentes React, páginas, hooks, clientes HTTP e helpers nomeados.
- Inclui helpers privados quando fazem validação, autorização, transformação de dados, segurança, persistência, IA, privacidade, apresentação ou suporte operacional relevante.
- Exclui testes, scripts de smoke externos a `src`, callbacks anónimos inline, construtores, artefactos gerados, `node_modules`, `dist`, reports e storage runtime.
- Cada entrada mostra a assinatura curta, o tipo de símbolo, a descrição principal, as entradas documentadas e o valor devolvido.

## Resumo

- Backend: 434 funções/métodos em 122 ficheiros.
- Frontend: 181 funções/métodos em 58 ficheiros.
- Total: 615 funções/métodos fundamentais em 180 ficheiros.

## Backend

### `real_dev/api/src/app.js`

- `createApp()` (exportada; função) - Cria e configura uma instancia Express da API Orélle. Entradas: sem entradas explícitas. Devolve: Aplicacao Express pronta a usar.

### `real_dev/api/src/config/db.js`

- `connectDB()` (exportada; função) - Abre a ligacao principal ao MongoDB. Entradas: sem entradas explícitas. Devolve: Resolve quando o Mongoose estiver ligado.
- `disconnectDB()` (exportada; função) - Fecha a ligacao principal ao MongoDB. Entradas: sem entradas explícitas. Devolve: Resolve quando o Mongoose terminar a ligacao.

### `real_dev/api/src/config/env.js`

- `parseClientOrigins(rawValue)` (top-level; função) - Converte a lista CSV de origens permitidas em valores aceites pelo CORS. `CLIENT_ORIGIN` continua a representar a origem principal usada em redirects, enquanto `CLIENT_ORIGINS` permite aceitar localhost e 127.0.0.1 em dev. Entradas: `rawValue`: Lista CSV de origens HTTP/HTTPS. Devolve: Origens limpas e sem entradas vazias.
- `getMongoDatabaseName(mongoUri)` (exportada; função) - Extrai o nome da base de dados a partir de uma URI MongoDB. Entradas: `mongoUri`: URI MongoDB configurada. Devolve: Nome da base normalizado em minúsculas.
- `isProductionLikeMongoUri(mongoUri)` (exportada; função) - Indica se a URI aponta para uma base sem marcador explícito de teste. Entradas: `mongoUri`: URI MongoDB configurada. Devolve: Verdadeiro quando a URI não é segura para testes.
- `looksLikeLiveSecret(value)` (exportada; função) - Identifica segredos que parecem pertencer a ambientes reais. Entradas: `value`: Valor de uma variável sensível. Devolve: Verdadeiro quando o valor parece real.
- `getUnsafeTestSecretNames(source = process.env)` (exportada; função) - Lista variáveis sensíveis que parecem reais em modo de teste. Entradas: `source`: Fonte das variáveis. Devolve: Nomes das variáveis inseguras.
- `isUnsafeProductionSessionSecret(secret)` (exportada; função) - Identifica segredos de sessao que nao sao aceitaveis em producao. Entradas: `secret`: Valor de SESSION_SECRET. Devolve: Verdadeiro quando o segredo e ausente, fraco ou placeholder.
- `assertTestEnvironmentIsIsolated(options = {})` (exportada; função) - Garante que a configuração de teste não aponta para produção. Entradas: `options`: Configuração a validar. Devolve: Resumo seguro para evidence.

### `real_dev/api/src/controllers/admin-categories.controller.js`

- `createCategoryController(req, res, next)` (exportada; função) - Cria uma categoria administrativa a partir do corpo ja validado pelo validator, devolvendo ao cliente apenas a entidade criada. Entradas: `req`: Pedido admin autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 201 com categoria.
- `listCategoriesController(req, res, next)` (exportada; função) - Lista categorias administraveis. Entradas: `req`: Pedido admin autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com categorias.
- `assignProductCategoriesController(req, res, next)` (exportada; função) - Associa categorias existentes a um produto. Entradas: `req`: Pedido admin autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com produto atualizado.

### `real_dev/api/src/controllers/admin-dashboard.controller.js`

- `getAdminDashboardStatsController(req, res, next)` (exportada; função) - Devolve estatisticas agregadas para administradores. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Middleware de erro. Devolve: Resposta 200.

### `real_dev/api/src/controllers/admin-export.controller.js`

- `exportAdminDatasetController(req, res, next)` (exportada; função) - Gera exportacao minimizada para admin. Entradas: `req`: Pedido admin com dataset em `params` e filtros em `query`; `res`: Resposta Express usada para enviar o ficheiro; `next`: Proximo middleware para erros. Devolve: Resposta 200 com o ficheiro exportado.

### `real_dev/api/src/controllers/admin-products.controller.js`

- `createProductController(req, res, next)` (exportada; função) - Cria um produto no catalogo. Entradas: `req`: Pedido admin autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 201 com produto criado.

### `real_dev/api/src/controllers/admin-review.controller.js`

- `listAdminReviewsController(req, res, next)` (exportada; função) - Lista reviews para moderacao. Entradas: `req`: Pedido admin autenticado; `res`: Resposta Express; `next`: Proximo middleware para erros. Devolve: Resposta 200 com reviews pendentes ou moderadas.
- `moderateReviewController(req, res, next)` (exportada; função) - Atualiza estado de moderacao de uma review. Entradas: `req`: Pedido admin com review alvo e decisao; `res`: Resposta Express; `next`: Proximo middleware para erros. Devolve: Resposta 200 com a review atualizada.

### `real_dev/api/src/controllers/admin-users.controller.js`

- `listAdminUsersController(req, res, next)` (exportada; função) - Lista utilizadores para administracao. Entradas: `req`: Pedido admin autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com lista segura.
- `updateUserRoleController(req, res, next)` (exportada; função) - Atualiza a role de um utilizador alvo. Entradas: `req`: Pedido admin autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com utilizador atualizado.
- `updateUserStatusController(req, res, next)` (exportada; função) - Atualiza estado administrativo da conta. Entradas: `req`: Pedido admin autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com utilizador atualizado.
- `deleteUserAccountController(req, res, next)` (exportada; função) - Executa eliminacao logica de uma conta. Entradas: `req`: Pedido admin autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com conta eliminada logicamente.

### `real_dev/api/src/controllers/ai-consultation-review.controller.js`

- `listAiConsultationReviewsController(req, res, next)` (exportada; função) - Lista revisões acessíveis ao consultor/admin. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Próximo middleware. Devolve: Resposta 200 com fila.
- `getAiConsultationReviewController(req, res, next)` (exportada; função) - Devolve detalhe minimizado de uma revisão. Entradas: `req`: Pedido com `reviewId`; `res`: Resposta Express; `next`: Próximo middleware. Devolve: Resposta 200 com detalhe.
- `decideAiConsultationReviewController(req, res, next)` (exportada; função) - Regista decisão humana de revisão IA. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Próximo middleware. Devolve: Resposta 200 com revisão atualizada.

### `real_dev/api/src/controllers/ai-consultation.controller.js`

- `startAiConsultationSessionController(req, res, next)` (exportada; função) - Inicia ou devolve rascunho de sessao guiada para o utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 201.
- `getCurrentAiConsultationSessionController(req, res, next)` (exportada; função) - Devolve a sessao guiada mais recente do utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200.
- `saveAiConsultationAnswerController(req, res, next)` (exportada; função) - Guarda uma resposta validada da sessao guiada. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200.
- `submitAiConsultationSessionController(req, res, next)` (exportada; função) - Submete a sessao guiada quando esta completa. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200.

### `real_dev/api/src/controllers/ai-interaction-history.controller.js`

- `getMyAiInteractionHistoryController(req, res, next)` (exportada; função) - Lista o historico IA do utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com timeline publica.

### `real_dev/api/src/controllers/auth.controller.js`

- `registerController(req, res, next)` (exportada; função) - Controller de registo do BK-MF0-01. Entradas: `req`: Pedido com email/password; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 201 com utilizador seguro.
- `loginController(req, res, next)` (exportada; função) - Controller de login do BK-MF0-02. Entradas: `req`: Pedido com credenciais; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 e cookie HttpOnly.
- `logoutController(req, res)` (exportada; função) - Controller de logout. Entradas: `req`: Pedido Express; `res`: Resposta Express. Devolve: Resposta 204 depois de limpar cookie.
- `meController(req, res)` (exportada; função) - Controller que devolve o utilizador autenticado da sessao. Entradas: `req`: Pedido autenticado; `res`: Resposta Express. Devolve: Resposta 200 com `req.user`.

### `real_dev/api/src/controllers/before-after-visualization.controller.js`

- `createBeforeAfterVisualizationController(req, res, next)` (exportada; função) - Cria a visualização antes/depois para uma simulação pertencente ao utilizador. Entradas: `req`: Pedido autenticado com o ID da simulação no body; `res`: Resposta Express; `next`: Próximo middleware. Devolve: Resposta 201 com a visualização pública.

### `real_dev/api/src/controllers/biometric-audit.controller.js`

- `listBiometricAuditLogsController(req, res, next)` (exportada; função) - Lista eventos de auditoria biometricos para administrador. Entradas: `req`: Pedido autenticado de admin; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com logs minimizados.
- `listBiometricAuditAlertsController(req, res, next)` (exportada; função) - Lista alertas de auditoria biometricos para administrador. Entradas: `req`: Pedido autenticado de admin; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com alertas minimizados.

### `real_dev/api/src/controllers/biometric-data-request.controller.js`

- `createMyBiometricDataRequestController(req, res, next)` (exportada; função) - Cria pedido de eliminacao/anonymizacao para o cliente autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 201 com pedido minimizado.
- `listBiometricDataRequestsController(req, res, next)` (exportada; função) - Lista pedidos para revisao por consultor ou administrador. Entradas: `req`: Pedido protegido por role; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com pedidos minimizados.
- `decideBiometricDataRequestController(req, res, next)` (exportada; função) - Aprova ou rejeita pedido biometrico pendente. Entradas: `req`: Pedido autenticado de consultor/admin; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com decisao aplicada.

### `real_dev/api/src/controllers/cart.controller.js`

- `getMyCartController(req, res, next)` (exportada; função) - Lista carrinho do utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Middleware de erro. Devolve: Resposta 200.
- `addItemToCartController(req, res, next)` (exportada; função) - Adiciona item ao carrinho. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Middleware de erro. Devolve: Resposta 200.
- `updateCartItemQuantityController(req, res, next)` (exportada; função) - Atualiza quantidade de um item do carrinho. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Middleware de erro. Devolve: Resposta 200.
- `removeCartItemController(req, res, next)` (exportada; função) - Remove item do carrinho. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Middleware de erro. Devolve: Resposta 200.

### `real_dev/api/src/controllers/catalog.controller.js`

- `listCatalogProductsController(req, res, next)` (exportada; função) - Lista produtos publicos com filtros validados. Entradas: `req`: Pedido com query params opcionais; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta com `{ products }`.

### `real_dev/api/src/controllers/client-ai-insight.controller.js`

- `listMyClientAiInsightsController(req, res, next)` (exportada; função) - Lista os insights públicos publicados para o cliente autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Próximo middleware. Devolve: Resposta 200 com insights públicos.

### `real_dev/api/src/controllers/daily-routine.controller.js`

- `generateDailyRoutineController(req, res, next)` (exportada; função) - Gera uma rotina diária para o cliente autenticado com base nas recomendações ativas. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Próximo middleware. Devolve: Resposta 201 com a rotina gerada.
- `getDailyRoutineController(req, res, next)` (exportada; função) - Devolve a rotina diária atualmente guardada para o cliente autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Próximo middleware. Devolve: Resposta 200 com a rotina ou null.

### `real_dev/api/src/controllers/face-analysis.controller.js`

- `createFaceAnalysisController(req, res, next)` (exportada; função) - Cria analise para o utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 201.

### `real_dev/api/src/controllers/face-photo.controller.js`

- `acceptFaceConsentController(req, res, next)` (exportada; função) - Aceita consentimento facial do utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta com consentimento.
- `collectUploadedFilesForCleanup(files)` (top-level; função) - Normaliza ficheiros recebidos para limpeza em caso de erro. Entradas: `files`: Ficheiros Multer. Devolve: Ficheiros para cleanup.
- `uploadFacePhotosController(req, res, next)` (exportada; função) - Guarda fotografias faciais frontal e de perfil. Entradas: `req`: Pedido multipart; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta com metadados seguros.

### `real_dev/api/src/controllers/face-report.controller.js`

- `generateLatestFaceReportController(req, res, next)` (exportada; função) - Gera relatorio da analise concluida mais recente do utilizador. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 201.

### `real_dev/api/src/controllers/makeup-simulation.controller.js`

- `createMakeupSimulationController(req, res, next)` (exportada; função) - Cria uma simulação de maquilhagem para o utilizador autenticado. Entradas: `req`: Pedido autenticado com consentimento facial ativo; `res`: Resposta Express; `next`: Próximo middleware. Devolve: Resposta 201 com a simulação pública.

### `real_dev/api/src/controllers/notification.controller.js`

- `listMyNotificationsController(req, res, next)` (exportada; função) - Lista as notificações do utilizador autenticado. Entradas: `req`: Pedido com `req.user.id` definido pela sessão; `res`: Resposta HTTP; `next`: Encaminha erros para o middleware global. Devolve: Resposta 200 com notificações próprias.
- `markMyNotificationAsReadController(req, res, next)` (exportada; função) - Marca uma notificação própria como lida. Entradas: `req`: Pedido com params e sessão autenticada; `res`: Resposta HTTP; `next`: Encaminha erros controlados. Devolve: Resposta 200 com a notificação atualizada.
- `createCampaignNotificationController(req, res, next)` (exportada; função) - Cria uma campanha interna para a role alvo escolhida por admin. Entradas: `req`: Pedido admin com body validado no backend; `res`: Resposta HTTP; `next`: Encaminha erros para o middleware global. Devolve: Resposta 201 com resumo da campanha.
- `updateOrderStatusAndNotifyController(req, res, next)` (exportada; função) - Atualiza o estado logístico de uma encomenda e notifica o cliente. Entradas: `req`: Pedido admin com `orderId` e novo estado; `res`: Resposta HTTP; `next`: Encaminha erros controlados. Devolve: Resposta 200 com resultado da atualização.

### `real_dev/api/src/controllers/order.controller.js`

- `checkoutController(req, res, next)` (exportada; função) - Cria encomenda e inicia pagamento a partir do carrinho. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Middleware de erro. Devolve: Resposta 201.
- `listMyOrdersController(req, res, next)` (exportada; função) - Lista historico de encomendas do cliente autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Middleware de erro. Devolve: Resposta 200.

### `real_dev/api/src/controllers/preferences.controller.js`

- `getMyPreferencesController(req, res, next)` (exportada; função) - Consulta preferencias do utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com preferencias.
- `updateMyPreferencesController(req, res, next)` (exportada; função) - Atualiza preferencias do utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com preferencias.

### `real_dev/api/src/controllers/product-details.controller.js`

- `getProductDetailsController(req, res, next)` (exportada; função) - Devolve detalhe publico de um produto. Entradas: `req`: Pedido com `productId`; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta com `{ product }`.

### `real_dev/api/src/controllers/profile.controller.js`

- `createMyProfileController(req, res, next)` (exportada; função) - Cria o perfil do utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 201 com perfil.
- `getMyProfileController(req, res, next)` (exportada; função) - Consulta o perfil do utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com perfil.
- `updateMyProfileController(req, res, next)` (exportada; função) - Atualiza campos editaveis do perfil. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com perfil atualizado.
- `updateMyProfilePhotoController(req, res, next)` (exportada; função) - Atualiza a fotografia stub do perfil. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200 com fotografia atualizada.

### `real_dev/api/src/controllers/recommendation-review.controller.js`

- `createRecommendationReviewController(req, res, next)` (exportada; função) - Regista a revisão de uma recomendação feita por consultor ou administrador. Entradas: `req`: Pedido autenticado com params e body da revisão; `res`: Resposta Express; `next`: Próximo middleware. Devolve: Resposta 201 com a revisão pública.

### `real_dev/api/src/controllers/recommendation.controller.js`

- `generateRecommendationsController(req, res, next)` (exportada; função) - Gera recomendacoes para o utilizador autenticado. Entradas: `req`: Pedido autenticado com contexto para gerar recomendacoes; `res`: Resposta Express; `next`: Proximo middleware para erros. Devolve: Resposta 201 com recomendacoes personalizadas.
- `listRecommendationsController(req, res, next)` (exportada; função) - Lista recomendacoes do utilizador autenticado. Entradas: `req`: Pedido autenticado do cliente; `res`: Resposta Express; `next`: Proximo middleware para erros. Devolve: Resposta 200 com recomendacoes existentes.
- `submitRecommendationFeedbackController(req, res, next)` (exportada; função) - Regista feedback do cliente sobre uma recomendacao. Entradas: `req`: Pedido autenticado com ID da recomendacao e feedback; `res`: Resposta Express; `next`: Proximo middleware para erros. Devolve: Resposta 200 com a recomendacao atualizada.

### `real_dev/api/src/controllers/related-products.controller.js`

- `listRelatedProductsController(req, res, next)` (exportada; função) - Lista produtos semelhantes/complementares de um produto. Entradas: `req`: Pedido com `productId`; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta com `products`.

### `real_dev/api/src/controllers/reorder.controller.js`

- `reorderController(req, res, next)` (exportada; função) - Adiciona produtos de uma encomenda anterior ao carrinho. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Middleware de erro. Devolve: Resposta 200.

### `real_dev/api/src/controllers/review.controller.js`

- `createProductReviewController(req, res, next)` (exportada; função) - Cria uma review de cliente autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 201.
- `listProductReviewsController(req, res, next)` (exportada; função) - Lista reviews publicadas de um produto. Entradas: `req`: Pedido com `productId`; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200.

### `real_dev/api/src/controllers/routine-alert.controller.js`

- `getMyRoutineAlertPreferenceController(req, res, next)` (exportada; função) - Devolve a preferência de alerta de rotina do utilizador autenticado. Entradas: `req`: Pedido com `req.user.id` da sessão; `res`: Resposta HTTP; `next`: Encaminha erros para o middleware global. Devolve: Resposta 200 com preferência própria.
- `updateMyRoutineAlertPreferenceController(req, res, next)` (exportada; função) - Atualiza a preferência de alerta de rotina do próprio utilizador. Entradas: `req`: Pedido autenticado com body validado; `res`: Resposta HTTP; `next`: Encaminha erros para o middleware global. Devolve: Resposta 200 com preferência atualizada.
- `runRoutineAlertsController(req, res, next)` (exportada; função) - Executa a criação controlada dos alertas de rotina que estão devidos. Entradas: `req`: Pedido administrativo ou de smoke com data opcional; `res`: Resposta HTTP; `next`: Encaminha erros controlados. Devolve: Resposta 200 com contagem criada.

### `real_dev/api/src/controllers/skin-comparison.controller.js`

- `createSkinComparisonController(req, res, next)` (exportada; função) - Cria comparacao temporal para o utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Middleware de erro. Devolve: Resposta 201.

### `real_dev/api/src/controllers/skin-evolution.controller.js`

- `getMySkinEvolutionController(req, res, next)` (exportada; função) - Devolve os pontos de evolução cosmética da pele do utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Próximo middleware. Devolve: Resposta 200 com a evolução pública.

### `real_dev/api/src/controllers/skin-history.controller.js`

- `getMySkinHistoryController(req, res, next)` (exportada; função) - Devolve historico pessoal do utilizador autenticado. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta 200.

### `real_dev/api/src/controllers/stock.controller.js`

- `listLowStockProductsController(req, res, next)` (exportada; função) - Lista alertas de baixo stock. Entradas: `req`: Pedido admin; `res`: Resposta Express; `next`: Middleware de erro. Devolve: Resposta 200.
- `updateProductStockController(req, res, next)` (exportada; função) - Atualiza stock de um produto. Entradas: `req`: Pedido admin; `res`: Resposta Express; `next`: Middleware de erro. Devolve: Resposta 200.

### `real_dev/api/src/middlewares/auth.middleware.js`

- `shouldRevalidateSessionUser()` (top-level; função) - Decide se a sessao deve ser revalidada contra a conta persistida. Em runtime real a revalidacao fica ativa para bloquear contas suspensas ou eliminadas mesmo com cookie antigo. Em testes unitarios/integracao sem BD, a revalidacao so corre quando o proprio teste fornece um mock explicito. Entradas: sem entradas explícitas. Devolve: Verdadeiro quando ha contrato seguro para consultar User.
- `findSessionAccountState(userId)` (top-level; função) - Carrega apenas os campos necessarios para validar estado e role da conta. Entradas: `userId`: ID presente no token de sessao. Devolve: Estado de conta com role atual ou null.
- `requireAuth(req, res, next)` (exportada; função) - Bloqueia pedidos sem sessao valida. Entradas: `req`: Pedido Express; `res`: Resposta Express; `next`: Proximo middleware. Devolve: não devolve payload explícito.

### `real_dev/api/src/middlewares/error.middleware.js`

- `getMulterErrorMessage(err)` (top-level; função) - Converte erros conhecidos de upload em mensagens seguras para o cliente. Entradas: `err`: Erro emitido pelo Multer. Devolve: Mensagem HTTP segura.
- `errorMiddleware(err, req, res, next)` (exportada; função) - Converte erros da aplicacao numa resposta JSON uniforme e segura. Entradas: `err`: Erro recebido; `req`: Pedido Express original; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Resposta JSON ou delegacao se headers ja foram enviados.

### `real_dev/api/src/middlewares/face-photo-upload.middleware.js`

- `ensureActiveFaceConsent(req, res, next)` (exportada; função) - Garante consentimento ativo antes de permitir upload facial. Entradas: `req`: Pedido autenticado; `res`: Resposta Express; `next`: Proximo middleware. Devolve: Continua ou devolve erro.
- `fileFilter(req, file, callback)` (top-level; função) - Valida tipo MIME antes de aceitar o ficheiro. Entradas: `req`: Pedido Express; `file`: Ficheiro recebido; `callback`: Callback Multer. Devolve: não devolve payload explícito.

### `real_dev/api/src/middlewares/request-observability.middleware.js`

- `requestContextMiddleware(req, res, next)` (exportada; função) - Cria contexto minimo de observabilidade para cada pedido. Entradas: `req`: Pedido Express; `res`: Resposta Express; `next`: Proximo middleware. Devolve: não devolve payload explícito.
- `requestMetricsMiddleware(req, res, next)` (exportada; função) - Regista uma metrica quando a resposta HTTP termina. Entradas: `req`: Pedido Express; `res`: Resposta Express; `next`: Proximo middleware. Devolve: não devolve payload explícito.

### `real_dev/api/src/middlewares/request-timeout.middleware.js`

- `markRequestTimedOut(req)` (top-level; função) - Marca o pedido como expirado para que rotas assincronas parem com seguranca. Entradas: `req`: Pedido Express atual. Devolve: não devolve payload explícito.
- `requestTimeout({ timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS } = {})` (exportada; função) - Cria middleware Express que limita a duracao de cada pedido. Entradas: `options`: Configuracao do timeout. Devolve: Middleware Express.
- `req.hasRequestTimedOut()` (interna; arrow function) - Indica a handlers posteriores se o pedido ja ultrapassou o limite. Entradas: sem entradas explícitas. Devolve: Verdadeiro quando o temporizador ja marcou o pedido como expirado.

### `real_dev/api/src/middlewares/role.middleware.js`

- `requireRole(...allowedRoles)` (exportada; função) - Cria um middleware que exige uma das roles indicadas. Entradas: `allowedRoles`: Roles autorizadas para a rota. Devolve: Middleware Express de autorizacao.
- `roleMiddleware(req, res, next)` (interna; function expression) - Middleware que valida a role do utilizador autenticado. Entradas: `req`: Pedido Express; `res`: Resposta Express; `next`: Proximo middleware. Devolve: não devolve payload explícito.

### `real_dev/api/src/middlewares/security-transport.middleware.js`

- `isSecureTransport(req)` (top-level; função) - Confirma se o pedido chegou por HTTPS real ou por proxy HTTPS validado. Entradas: `req`: Pedido Express. Devolve: Verdadeiro quando o transporte efetivo é HTTPS.
- `securityTransportHeaders(req, res, next)` (exportada; função) - Aplica HSTS quando o ambiente exige HTTPS. Entradas: `req`: Pedido Express; `res`: Resposta Express; `next`: Proximo middleware. Devolve: não devolve payload explícito.
- `enforceHttpsTransport(req, res, next)` (exportada; função) - Bloqueia HTTP em produção sem fazer redirect inseguro de métodos POST. Entradas: `req`: Pedido Express; `res`: Resposta Express; `next`: Proximo middleware. Devolve: não devolve payload explícito.

### `real_dev/api/src/models/order.model.js`

- `hasAtLeastOneOrderItem(items)` (top-level; função) - Confirma que a encomenda contém pelo menos um item. Entradas: `items`: Valor recebido pelo validador Mongoose. Devolve: True quando o valor é um array não vazio.

### `real_dev/api/src/models/product-recommendation.model.js`

- `hasAtLeastOneReasonCode(items)` (top-level; função) - Confirma que existe pelo menos um motivo técnico para a recomendação. Entradas: `items`: Valor recebido pelo validador Mongoose. Devolve: True quando o valor é um array não vazio.
- `hasAtLeastOneSourceSignal(items)` (top-level; função) - Confirma que a recomendação guarda pelo menos um sinal de origem. Entradas: `items`: Valor recebido pelo validador Mongoose. Devolve: True quando o valor é um array não vazio.

### `real_dev/api/src/models/product.model.js`

- `hasAtLeastOneIngredient(items)` (top-level; função) - Confirma que o produto tem pelo menos um ingrediente declarado. Entradas: `items`: Valor recebido pelo validador Mongoose. Devolve: True quando o valor é um array não vazio.

### `real_dev/api/src/providers/before-after-visualization.provider.js`

- `createBeforeAfterVisualizationPreview({ simulation, recommendations })` (exportada; função) - Cria o preview seguro que compara a simulação com produtos recomendados. Entradas: `input`: Simulação existente e recomendações ativas. Devolve: Dados públicos da comparação antes/depois.

### `real_dev/api/src/providers/external-skin-analysis.provider.js`

- `assertExternalImagePurposePolicy(input = {})` (exportada; função) - Bloqueia finalidades fora da analise facial cosmetica autorizada. Entradas: `input`: Politica definida pelo service. Devolve: não devolve payload explícito.
- `assertExternalAnalysisPayloadInput(input)` (top-level; função) - Confirma que as fotografias foram preparadas pelo backend antes do provider. Entradas: `input`: Fotografias preparadas. Devolve: Fotografias validadas para request externo.
- `buildProviderPhoto(kind, photo)` (top-level; função) - Constrói uma fotografia minimizada para o provider remoto. Entradas: `kind`: Tipo de fotografia facial; `photo`: Fotografia preparada. Devolve: Fotografia para request externo.
- `buildExternalAnalysisPayload(input)` (exportada; função) - Constrói o payload externo com finalidade e retenção explícitas. Entradas: `input`: Fotografias preparadas. Devolve: Payload remoto minimizado.
- `assertSecureExternalProviderUrl(value)` (top-level; função) - Valida transporte seguro antes de enviar imagem facial ou API key. Entradas: `value`: Valor de `AI_PROVIDER_URL`. Devolve: URL seguro para chamada `fetch`.
- `normalizeFinding(value)` (top-level; função) - Normaliza um finding remoto sem permitir confiança extrema ou texto excessivo. Entradas: `value`: Finding devolvido pelo provider remoto. Devolve: Finding público.
- `normalizeExternalResult(data)` (top-level; função) - Converte resposta remota no contrato público da Orélle. Entradas: `data`: JSON devolvido pelo provider remoto. Devolve: Resultado normalizado.
- `analyzeSkinPhotosExternally(input)` (exportada; função) - Chama o provider remoto de análise cosmética. Entradas: `input`: Fotografias já autorizadas e preparadas. Devolve: Resultado normalizado para a API Orélle.

### `real_dev/api/src/providers/makeup-simulation.provider.js`

- `colorFromProduct(product)` (top-level; função) - Deriva uma cor estável a partir do ID do produto. Entradas: `product`: Produto usado na simulação. Devolve: Cor hexadecimal determinística.
- `escapeSvgText(value)` (top-level; função) - Escapa texto antes de o inserir no SVG gerado. Entradas: `value`: Valor textual vindo do domínio da aplicação. Devolve: Texto seguro para interpolação em SVG.
- `normalizeAccentColor(color)` (top-level; função) - Garante que a cor de destaque é um hexadecimal completo. Entradas: `color`: Cor candidata. Devolve: Cor aceite ou fallback neutro.
- `createSafeSvgPreviewImage({ title, subtitle, accentColor, variant = "before", })` (exportada; função) - Gera uma imagem SVG embebida em data URL sem expor fotografias privadas. Entradas: `input`: Conteúdo e estilo do preview. Devolve: Data URL SVG codificada.
- `createMakeupPreview({ facePhoto, product })` (exportada; função) - Cria preview publico sem expor a fotografia facial privada. Entradas: `input`: Fotografia frontal e produto. Devolve: Preview seguro.

### `real_dev/api/src/providers/payment.provider.js`

- `appendStripeLineItems(params, items)` (top-level; função) - Converte itens da encomenda para parametros aceites pela API Stripe. Entradas: `params`: Params form-urlencoded; `items`: Itens da encomenda. Devolve: não devolve payload explícito.
- `assertPaymentGatewayReady(gateway)` (exportada; função) - Valida se o gateway pedido pode iniciar o fluxo esperado. Esta pre-validacao corre antes da criacao da encomenda para evitar que um checkout Stripe sem configuracao persista uma encomenda sem URL de pagamento e limpe o carrinho do cliente. Entradas: `gateway`: Gateway ja validado pelo DTO. Devolve: não devolve payload explícito.
- `createStripeCheckoutSession(order, idempotencyKey)` (top-level; função) - Cria sessao de checkout Stripe com fetch nativo. Entradas: `order`: Encomenda persistida; `idempotencyKey`: Chave estavel da tentativa de checkout. Devolve: Estado de pagamento.
- `createManualGatewayStub(gateway, order)` (top-level; função) - Cria estado stub funcional para PayPal ou MBWay. Entradas: `gateway`: Gateway validado; `order`: Encomenda persistida. Devolve: Estado pendente.
- `createPaymentSession(order, gateway, idempotencyKey)` (exportada; função) - Cria a sessao/estado de pagamento para uma encomenda. Entradas: `order`: Encomenda persistida; `gateway`: Gateway validado; `idempotencyKey`: Chave estavel para evitar sessoes duplicadas. Devolve: Dados seguros de pagamento.

### `real_dev/api/src/providers/skin-analysis.provider.js`

- `createFinding(label, confidence, explanation)` (top-level; função) - Cria um finding estruturado. Entradas: `label`: Etiqueta do achado; `confidence`: Confianca entre 0 e 1; `explanation`: Explicacao curta. Devolve: Finding.
- `clampConfidence(value)` (top-level; função) - Limita um valor numerico ao intervalo de confianca permitido. Entradas: `value`: Valor candidato. Devolve: Confianca normalizada entre limites conservadores.
- `calculateTechnicalConfidence(frontalPhoto, perfilPhoto)` (top-level; função) - Calcula uma confianca tecnica estavel a partir dos metadados de upload. A baseline local nao tenta diagnosticar pele. Usa apenas sinais tecnicos ja validados pelo fluxo privado para manter resultados reprodutiveis em desenvolvimento e testes, ate existir um provider especializado. Entradas: `frontalPhoto`: Fotografia frontal validada; `perfilPhoto`: Fotografia de perfil validada. Devolve: Confianca baixa a moderada.
- `assertImagePurposeAllowed(input)` (top-level; função) - Valida que a analise usa apenas a finalidade cosmetica autorizada. Entradas: `input`: Politica definida pelo backend. Devolve: não devolve payload explícito.
- `assertValidAnalysisPhotos(input)` (top-level; função) - Valida fotografias antes de qualquer análise local ou externa. Entradas: `input`: Fotografias escolhidas pelo backend. Devolve: Fotografias e politica validadas.
- `analyzeSkinPhotosLocally(input)` (top-level; função) - Analisa fotografias faciais já validadas com baseline local. Entradas: `input`: Fotos escolhidas pelo backend. Devolve: Resultado estruturado da análise.
- `analyzeSkinPhotos(input)` (exportada; função) - Analisa fotografias com o provider configurado e fallback local explícito. Entradas: `input`: Fotos já validadas pelo backend. Devolve: Resultado estruturado da análise.

### `real_dev/api/src/services/admin-dashboard.service.js`

- `getAdminDashboardStats()` (exportada; função) - Calcula estatisticas agregadas para administradores. Entradas: sem entradas explícitas. Devolve: Metricas agregadas.

### `real_dev/api/src/services/admin-export.service.js`

- `escapeCsv(value)` (top-level; função) - Escapa valor CSV para manter compatibilidade com Excel. Entradas: `value`: Valor a serializar. Devolve: Campo CSV seguro.
- `buildCsvText(headers, rows)` (top-level; função) - Constroi CSV a partir de linhas simples. Entradas: `headers`: Cabecalhos; `rows`: Linhas. Devolve: Conteudo CSV.
- `buildCsv(headers, rows)` (exportada; função) - Constroi CSV descarregavel a partir de linhas simples. Entradas: `headers`: Cabecalhos; `rows`: Linhas. Devolve: Conteudo CSV em UTF-8 com BOM para Excel.
- `buildSimplePdf(title, body)` (exportada; função) - Constroi um PDF textual minimo sem dependencias externas. Entradas: `title`: Titulo do documento; `body`: Conteudo textual minimizado. Devolve: Representacao PDF simples.
- `getDatasetRows(dataset)` (top-level; função) - Le dados minimizados do dataset pedido. Entradas: `dataset`: Dataset canonico. Devolve: Dados exportaveis.
- `buildAdminExport({ dataset, format })` (exportada; função) - Gera uma exportacao administrativa minimizada. Entradas: `input`: Pedido validado. Devolve: Exportacao descarregavel.

### `real_dev/api/src/services/admin-review.service.js`

- `toAdminReviewDto(review)` (top-level; função) - Converte review para DTO admin seguro. Entradas: `review`: Documento Mongoose ou mock equivalente. Devolve: Review sem dados sensiveis.
- `listAdminReviews()` (exportada; função) - Lista reviews para painel admin. Entradas: sem entradas explícitas. Devolve: Reviews recentes.
- `moderateReview({ reviewId, status, moderationReason, actorUserId, })` (exportada; função) - Modera visibilidade de uma review sem editar conteudo do cliente. Entradas: `input`: Acao admin. Devolve: Review moderada.

### `real_dev/api/src/services/admin-users.service.js`

- `toSafeUser(user)` (top-level; função) - Converte um utilizador em resposta segura para admin. Entradas: `user`: Documento Mongoose ou mock equivalente. Devolve: Utilizador sem passwordHash nem dados biometricos.
- `listAdminUsers()` (exportada; função) - Lista utilizadores para administracao, sempre com DTO minimizado. Entradas: sem entradas explícitas. Devolve: Utilizadores seguros para painel admin.
- `updateUserRole({ targetUserId, role, actorUserId })` (exportada; função) - Atualiza a role de outro utilizador. Entradas: `params`: Dados da operacao admin. Devolve: Utilizador atualizado.
- `setUserAccountStatus({ targetUserId, status, actorUserId })` (exportada; função) - Suspende ou reativa uma conta sem alterar a role. Entradas: `params`: Acao admin. Devolve: Utilizador atualizado.
- `softDeleteUserAccount({ targetUserId, actorUserId })` (exportada; função) - Aplica eliminacao logica no ambito de RF33. Entradas: `params`: Acao admin. Devolve: Utilizador eliminado logicamente.

### `real_dev/api/src/services/ai-consultation-review.service.js`

- `toId(value)` (top-level; função) - Converte ObjectId ou valor simples para string segura. Entradas: `value`: Valor persistido pelo Mongoose. Devolve: Identificador em string ou null.
- `uniqueCleanStrings(values)` (top-level; função) - Remove duplicados e valores vazios. Entradas: `values`: Lista candidata. Devolve: Lista limpa.
- `toProductDto(product)` (top-level; função) - Converte produto populado para DTO. Entradas: `product`: Produto populado na recomendação. Devolve: Produto minimizado.
- `toRecommendationDto(recommendation)` (top-level; função) - Converte recomendação enriquecida para DTO de consultor. Entradas: `recommendation`: Recomendação populada. Devolve: Recomendação minimizada.
- `toReviewListDto(review)` (top-level; função) - Converte revisão para linha de fila. Entradas: `review`: Revisão persistida. Devolve: Linha segura de fila.
- `toReviewDetailDto(review)` (top-level; função) - Converte revisão para detalhe de consultor. Entradas: `review`: Revisão persistida e populada. Devolve: Detalhe seguro para decisão humana.
- `buildReviewSummary(recommendations)` (top-level; função) - Constrói resumo operacional da revisão pendente. Entradas: `recommendations`: Recomendações criadas no BK-MF8-10. Devolve: Resumo seguro.
- `buildReviewPublicContext(recommendations)` (top-level; função) - Extrai labels e limitações públicas das recomendações. Entradas: `recommendations`: Recomendações geradas. Devolve: Contexto minimizado.
- `createOrRefreshAiConsultationReviewForSession(input)` (exportada; função) - Cria ou refresca uma revisão pendente para recomendações com sessão guiada. Entradas: `input`: Dados internos do BK-MF8-10. Devolve: Promise resolvida quando a operação termina.
- `toPublishedConsultantInsightDto(review)` (exportada; função) - Converte revisão publicada para DTO reutilizável pelo BK-MF8-12. Entradas: `review`: Revisão humana persistida. Devolve: Insight público seguro ou null quando não existe publicação.
- `listPublishedConsultantInsightsForClient(clientUserId, options = {})` (exportada; função) - Lista insights públicos do consultor para o cliente autenticado. O ownership vem do `clientUserId` validado pela sessão. O filtro opcional apenas restringe a sessão dentro dos dados desse cliente e nunca decide o utilizador dono dos documentos. Entradas: `clientUserId`: ID do cliente autenticado; `options`: Filtro opcional. Devolve: Insights públicos publicados para o cliente.
- `listAiConsultationReviewsForConsultant()` (exportada; função) - Lista revisões pendentes para consultores/admins. Entradas: sem entradas explícitas. Devolve: Fila minimizada de revisão humana.
- `getAiConsultationReviewForConsultant(reviewId)` (exportada; função) - Obtém detalhe de revisão para consultor/admin. Entradas: `reviewId`: ID validado da revisão. Devolve: Detalhe seguro da revisão.
- `assertRecommendationsBelongToReview(review, recommendationIds)` (top-level; função) - Garante que recomendações ajustadas pertencem à revisão aberta. Entradas: `review`: Revisão populada; `recommendationIds`: IDs validados. Devolve: não devolve payload explícito.
- `markAdjustedRecommendations(review, recommendationIds, publicNote)` (top-level; função) - Atualiza recomendações afetadas por uma decisão ajustada. Entradas: `review`: Revisão persistida; `recommendationIds`: IDs validados de recomendações; `publicNote`: Nota pública aprovada. Devolve: Promise resolvida quando a operação termina.
- `decideAiConsultationReview(consultant, input)` (exportada; função) - Regista decisão humana de consultor/admin. Entradas: `consultant`: Utilizador autenticado; `input`: Decisão validada. Devolve: Detalhe atualizado.

### `real_dev/api/src/services/ai-consultation.service.js`

- `toIdString(value)` (top-level; função) - Converte IDs Mongoose em string sem expor detalhes internos. Entradas: `value`: ID recebido de documento ou string. Devolve: ID normalizado.
- `resolveOptionLabel(question, value)` (top-level; função) - Resolve a etiqueta publica de uma opcao da consulta guiada. Entradas: `question`: Pergunta versionada; `value`: Valor guardado na resposta. Devolve: Etiqueta segura para historico.
- `buildHistorySignalFromAnswer(answer)` (top-level; função) - Converte uma resposta submetida num sinal minimizado para o historico IA. Entradas: `answer`: Resposta validada. Devolve: Sinal publico ou null.
- `buildSubmittedConsultationHistoryInput(session)` (top-level; função) - Cria o evento interno de historico a partir de uma sessao submetida. Entradas: `session`: Documento de sessao guiada submetida. Devolve: Evento minimizado para o service de historico.
- `toPublicAiConsultationSession(session)` (exportada; função) - Cria o DTO publico da sessao guiada. Entradas: `session`: Documento Mongoose da sessao guiada. Devolve: Objeto seguro para o frontend.
- `findLatestCompletedAnalysis(userId)` (top-level; função) - Procura a analise facial concluida mais recente do cliente. Entradas: `userId`: Utilizador autenticado. Devolve: Analise facial concluida.
- `findLatestActiveReport(userId)` (top-level; função) - Procura o relatorio facial ativo mais recente do cliente. Entradas: `userId`: Utilizador autenticado. Devolve: Relatorio facial ativo.
- `startGuidedConsultation(userId)` (exportada; função) - Inicia ou devolve o rascunho atual da sessao guiada. Entradas: `userId`: Utilizador autenticado. Devolve: DTO publico da sessao.
- `getCurrentGuidedConsultation(userId)` (exportada; função) - Devolve a sessao guiada mais recente do cliente. Entradas: `userId`: Utilizador autenticado. Devolve: DTO publico da sessao.
- `findOwnedDraftSession(userId, sessionId)` (top-level; função) - Procura uma sessao em rascunho pertencente ao utilizador autenticado. Entradas: `userId`: Utilizador autenticado; `sessionId`: Sessao recebida na route. Devolve: Documento de sessao editavel.
- `saveGuidedConsultationAnswer(userId, sessionId, input)` (exportada; função) - Guarda ou substitui uma resposta da sessao guiada. Entradas: `userId`: Utilizador autenticado; `sessionId`: Sessao recebida na route; `input`: Resposta validada. Devolve: DTO publico atualizado.
- `submitGuidedConsultation(userId, sessionId)` (exportada; função) - Submete a sessao guiada quando todas as obrigatorias existem. Entradas: `userId`: Utilizador autenticado; `sessionId`: Sessao recebida na route. Devolve: DTO publico submetido.

### `real_dev/api/src/services/ai-fairness-guard.service.js`

- `normalizePolicyText(value)` (top-level; função) - Normaliza texto para comparacao de politica sem depender de acentos. Entradas: `value`: Valor textual recebido pelo guard. Devolve: Texto normalizado para pesquisa interna.
- `toCleanStringList(value)` (top-level; função) - Converte um valor desconhecido numa lista de strings limpas. Entradas: `value`: Valor que deve representar uma lista. Devolve: Lista segura para validacoes.
- `findSensitiveSourceSignals(sourceSignals)` (top-level; função) - Encontra fontes tecnicas que usam atributos sensiveis. Entradas: `sourceSignals`: Fontes tecnicas da recomendacao. Devolve: Fontes bloqueadas por RNF24.
- `assertRespectfulPublicText(text)` (exportada; função) - Valida texto publico contra padroes discriminatorios. Entradas: `text`: Texto devolvido ao frontend. Devolve: não devolve payload explícito.
- `assertRecommendationFairness(recommendation)` (exportada; função) - Valida uma recomendacao explicavel contra RNF24. Entradas: `recommendation`: Dados antes do DTO publico. Devolve: Resultado publico minimo.

### `real_dev/api/src/services/ai-interaction-history.service.js`

- `normalizeText(value, fieldName, maxLength)` (top-level; função) - Normaliza texto obrigatorio com limite de tamanho. Entradas: `value`: Valor recebido; `fieldName`: Nome do campo para mensagem segura; `maxLength`: Tamanho maximo permitido. Devolve: Texto normalizado.
- `normalizeObjectId(value, fieldName)` (top-level; função) - Valida identificadores internos sem permitir ownership vindo do browser. Entradas: `value`: Identificador recebido de service interno; `fieldName`: Nome logico do campo. Devolve: ObjectId textual validado.
- `assertNoSensitiveContent(value)` (top-level; função) - Rejeita termos que indiquem dados privados ou tecnicos no historico publico. Entradas: `value`: Valor ja minimizado pelo caller. Devolve: não devolve payload explícito.
- `normalizeEventType(eventType)` (top-level; função) - Valida tipo de evento permitido pelo contrato do BK. Entradas: `eventType`: Tipo recebido. Devolve: Tipo validado.
- `normalizeSource(source)` (top-level; função) - Valida origem interna do evento. Entradas: `source`: Origem recebida. Devolve: Origem validada.
- `normalizeSafeSignals(signals)` (top-level; função) - Normaliza sinais publicos para a timeline IA. Entradas: `signals`: Sinais candidatos. Devolve: Sinais seguros.
- `normalizeLimit(limit)` (top-level; função) - Normaliza limite de listagem para intervalo seguro. Entradas: `limit`: Valor recebido da query ou de service interno. Devolve: Limite final.
- `toPublicHistoryItem(historyItem)` (top-level; função) - Converte documento interno em DTO publico. Entradas: `historyItem`: Documento Mongoose ou mock equivalente. Devolve: Item publico da timeline IA.
- `recordAiInteractionHistoryEvent(input)` (exportada; função) - Regista evento minimizado da interacao cliente-IA. Entradas: `input`: Evento interno. Devolve: DTO publico do evento criado.
- `listMyAiInteractionHistory(userId, options = {})` (exportada; função) - Lista historico IA do proprio utilizador autenticado. Entradas: `userId`: Utilizador autenticado; `options`: Opcoes de paginacao simples. Devolve: Timeline publica ordenada por data decrescente.
- `listRecommendationHistoryContext(userId, options = {})` (exportada; função) - Lista contexto interno seguro para enriquecimento de recomendacoes no BK-MF8-10. Entradas: `userId`: Utilizador autenticado no fluxo chamador; `options`: Filtro interno opcional. Devolve: Contexto minimizado.

### `real_dev/api/src/services/auth.service.js`

- `toSafeUser(user)` (top-level; função) - Converte um documento User numa resposta segura para o cliente. Entradas: `user`: Documento Mongoose ou mock equivalente. Devolve: Utilizador sem campos sensiveis.
- `ensureUserCanAuthenticate(user)` (exportada; função) - Confirma se a conta pode iniciar ou manter sessão. Entradas: `user`: Utilizador carregado da base de dados. Devolve: não devolve payload explícito.
- `registerUser({ email, password })` (exportada; função) - Regista um novo utilizador com password protegida por hash. Entradas: `input`: Dados validados pelo validator. Devolve: Utilizador criado sem segredo.
- `loginUser({ email, password })` (exportada; função) - Autentica um utilizador por email/password. Entradas: `input`: Credenciais validadas. Devolve: Utilizador autenticado.

### `real_dev/api/src/services/before-after-visualization.service.js`

- `toVisualizationDto(visualization)` (top-level; função) - Converte o documento de visualização antes/depois para DTO público. Entradas: `visualization`: Documento Mongoose persistido. Devolve: Visualização segura para resposta HTTP.
- `createBeforeAfterVisualizationForUser(userId, simulationId)` (exportada; função) - Cria visualização antes/depois para uma simulação do próprio utilizador. Entradas: `userId`: Utilizador autenticado; `simulationId`: ID da simulacao validado. Devolve: Visualizacao publica.

### `real_dev/api/src/services/biometric-audit.service.js`

- `idToString(value)` (top-level; função) - Converte um valor de ID para string sem depender de ObjectId real em testes. Entradas: `value`: ID de documento, string ou mock. Devolve: ID textual ou null.
- `sanitizeReason(reason)` (top-level; função) - Limita texto de auditoria a uma razao curta e segura. Entradas: `reason`: Texto controlado gerado pelo backend. Devolve: Texto seguro para persistir no log.
- `toAuditLogResponse(log)` (top-level; função) - Converte evento de auditoria para DTO minimizado. Entradas: `log`: Documento Mongoose ou mock equivalente. Devolve: Evento sem dados biometricos brutos.
- `recordBiometricAccess(event)` (exportada; função) - Regista um evento RF44 e assinala alerta por volume recente do mesmo ator. Entradas: `event`: Evento gerado por backend autenticado. Devolve: Evento persistido em DTO minimizado.
- `listBiometricAuditLogs(actor)` (exportada; função) - Lista eventos recentes para revisao administrativa. Entradas: `actor`: Administrador autenticado. Devolve: Eventos minimizados, mais recentes primeiro.
- `listBiometricAuditAlerts(actor)` (exportada; função) - Lista eventos que levantaram alerta de volume. Entradas: `actor`: Administrador autenticado. Devolve: Alertas minimizados, mais recentes primeiro.

### `real_dev/api/src/services/biometric-data-request.service.js`

- `idToString(value)` (top-level; função) - Converte um valor de ID para string sem assumir ObjectId real em testes. Entradas: `value`: ID vindo de documento real ou mock. Devolve: ID textual ou null.
- `toBiometricDataRequestResponse(request)` (top-level; função) - Converte pedido para DTO seguro para cliente e painel. Entradas: `request`: Documento Mongoose ou objeto equivalente. Devolve: Pedido sem dados biometricos brutos.
- `sessionOptions(session)` (top-level; função) - Devolve options de Mongoose apenas quando uma transacao real esta ativa. Entradas: `session`: Sessao transacional opcional. Devolve: Options para queries/saves.
- `canUseMongoTransactions()` (top-level; função) - Indica se a ligacao atual parece suportar transacoes MongoDB. MongoDB standalone nao suporta transacoes. Nesses ambientes, o service usa um estado duravel `processing`/`failed` para evitar pedidos "pending" apos mutacoes parciais e permitir recuperacao operacional. Entradas: sem entradas explícitas. Devolve: True quando a ligacao esta pronta e nao parece standalone.
- `createOptionalSession()` (top-level; função) - Inicia sessao transacional apenas quando o runtime MongoDB a suporta. Entradas: sem entradas explícitas. Devolve: Sessao ou null para fallback duravel.
- `runWithOptionalTransaction(handler)` (top-level; função) - Executa uma decisao com transacao quando disponivel. Entradas: `handler`: Mutacao a executar. Devolve: Resultado do handler.
- `findBiometricDataRequestById(requestId, session)` (top-level; função) - Carrega pedido com a sessao transacional quando existir. Entradas: `requestId`: ID validado do pedido; `session`: Sessao transacional opcional. Devolve: Documento de pedido ou null.
- `saveBiometricDataRequest(request, session)` (top-level; função) - Grava pedido preservando a transacao quando aplicavel. Entradas: `request`: Documento Mongoose ou mock equivalente; `session`: Sessao transacional opcional. Devolve: Conclui apos persistencia.
- `createMyBiometricDataRequest(userId, input)` (exportada; função) - Cria pedido de tratamento dos dados faciais do cliente autenticado. Entradas: `userId`: Utilizador autenticado pela sessao; `input`: Dados validados. Devolve: Pedido criado em formato seguro.
- `listBiometricDataRequestsForReview(actor)` (exportada; função) - Lista pedidos para o painel de revisao e regista auditoria RF44. Entradas: `actor`: Consultor/admin autenticado. Devolve: Pedidos minimizados, mais recentes primeiro.
- `recordDecisionAudit(actor, request, event)` (top-level; função) - Regista uma tentativa de decisao sobre pedido biometrico. Entradas: `actor`: Consultor/admin autenticado; `request`: Pedido encontrado, quando existir; `event`: Metadados do resultado. Devolve: Conclui apos gravar auditoria.
- `applyDeleteAction(requesterId, resources, session)` (top-level; função) - Aplica eliminacao logica aos recursos selecionados. Entradas: `requesterId`: Dono dos recursos; `resources`: Recursos pedidos; `session`: Sessao transacional opcional. Devolve: Conclui quando os recursos ficam fora da operacao normal.
- `applyAnonymizeAction(requesterId, resources, session)` (top-level; função) - Aplica anonymizacao minima aos recursos selecionados. Entradas: `requesterId`: Dono dos recursos; `resources`: Recursos pedidos; `session`: Sessao transacional opcional. Devolve: Conclui quando os dados deixam de ser uteis para identificacao.
- `applyApprovedBiometricDataRequest(request, session)` (top-level; função) - Aplica a acao aprovada aos recursos pedidos. Entradas: `request`: Pedido aprovado; `session`: Sessao transacional opcional. Devolve: Conclui quando os recursos foram tratados.
- `assertRequestCanBeDecided(request, input)` (top-level; função) - Garante que o pedido pode ser decidido ou reprocessado de forma segura. Entradas: `request`: Pedido carregado; `input`: Decisao validada. Devolve: não devolve payload explícito.
- `markDecisionAsFailed(request)` (top-level; função) - Guarda estado falhado recuperavel sem expor detalhes internos ao frontend. Entradas: `request`: Pedido cuja aprovacao falhou. Devolve: Conclui quando o estado recuperavel fica gravado.
- `approveBiometricDataRequest(request, reviewerId, input, session)` (top-level; função) - Aplica aprovacao com transacao quando possivel e fallback duravel quando nao. Entradas: `request`: Pedido a aprovar; `reviewerId`: Revisor autenticado; `input`: Input validado; `session`: Sessao transacional opcional. Devolve: Pedido atualizado em DTO seguro.
- `decideBiometricDataRequest(requestId, actor, input)` (exportada; função) - Decide um pedido pendente e aplica tratamento quando ha aprovacao. Entradas: `requestId`: Pedido a decidir; `actor`: Consultor/admin autenticado; `input`: Decisao validada. Devolve: Pedido atualizado.

### `real_dev/api/src/services/cart.service.js`

- `toCartItemResponse(item)` (top-level; função) - Converte item de carrinho para DTO publico. Entradas: `item`: Item Mongoose ou mock equivalente. Devolve: Item seguro para frontend.
- `toCartResponse(cart)` (exportada; função) - Converte carrinho para DTO publico. Entradas: `cart`: Documento de carrinho ou null. Devolve: DTO.
- `getMyCart(userId)` (exportada; função) - Carrega o carrinho do utilizador autenticado. Entradas: `userId`: ID de sessao. Devolve: Carrinho publico.
- `findPurchasableProduct(productId, quantity)` (top-level; função) - Procura produto vendavel para carrinho. Entradas: `productId`: ID do produto; `quantity`: Quantidade pedida. Devolve: Produto existente.
- `findOrCreateCart(userId)` (top-level; função) - Devolve carrinho existente ou cria um carrinho vazio para o utilizador. Entradas: `userId`: ID autenticado. Devolve: Carrinho Mongoose.
- `addItemToCart(userId, input)` (exportada; função) - Adiciona produto ao carrinho autenticado, sem aceitar preco ou userId do frontend. Entradas: `userId`: ID autenticado; `input`: Produto e quantidade. Devolve: Carrinho atualizado.
- `updateCartItemQuantity(userId, productId, quantity)` (exportada; função) - Atualiza quantidade de um item ja presente no carrinho. Entradas: `userId`: ID autenticado; `productId`: Produto a atualizar; `quantity`: Nova quantidade. Devolve: Carrinho atualizado.
- `removeCartItem(userId, productId)` (exportada; função) - Remove item do carrinho autenticado. Entradas: `userId`: ID autenticado; `productId`: Produto a remover. Devolve: Carrinho atualizado.
- `clearCart(userId)` (exportada; função) - Limpa o carrinho depois de criar encomenda. Entradas: `userId`: ID autenticado. Devolve: Promise resolvida quando a operação termina.

### `real_dev/api/src/services/category.service.js`

- `toCategoryResponse(category)` (top-level; função) - Converte uma categoria em resposta JSON. Entradas: `category`: Documento Mongoose ou mock equivalente. Devolve: Categoria segura.
- `toProductCategoryResponse(product)` (top-level; função) - Converte o resultado de associacao de categorias num produto. Entradas: `product`: Documento Mongoose ou mock equivalente. Devolve: Produto com categorias.
- `createCategory(input)` (exportada; função) - Cria uma categoria administrativamente. Entradas: `input`: Categoria validada. Devolve: Categoria criada.
- `listCategories()` (exportada; função) - Lista categorias por ordem estavel de slug. Entradas: sem entradas explícitas. Devolve: Categorias disponiveis para administracao.
- `seedCategory(input)` (exportada; função) - Cria uma categoria inicial sem duplicar o mesmo slug. Entradas: `input`: Categoria inicial. Devolve: Categoria existente ou criada.
- `assignCategoriesToProduct(productId, categoryIds)` (exportada; função) - Associa categorias existentes a um produto existente. Entradas: `productId`: ID do produto alvo; `categoryIds`: IDs de categorias ja validados como ObjectId. Devolve: Produto atualizado com categorias.

### `real_dev/api/src/services/daily-routine.service.js`

- `toProductSnapshot(product)` (top-level; função) - Guarda um resumo estável do produto usado num passo da rotina. Entradas: `product`: Produto populado a partir da recomendação. Devolve: Snapshot do produto no momento em que a rotina é gerada.
- `toRoutineDto(routine)` (top-level; função) - Converte a rotina persistida para o DTO público usado pelo frontend. Entradas: `routine`: Documento Mongoose ou null. Devolve: Rotina pública ou null quando ainda não existe rotina.
- `buildRoutineSteps(recommendations)` (top-level; função) - Cria passos alternados entre manhã e noite a partir das recomendações disponíveis. Entradas: `recommendations`: Recomendações já filtradas e populadas com produto. Devolve: Passos de rotina prontos para persistência.
- `generateDailyRoutineForUser(userId)` (exportada; função) - Gera rotina diaria baseada em recomendacoes ativas/aceites. Entradas: `userId`: Utilizador autenticado. Devolve: Rotina publica.
- `getDailyRoutineForUser(userId)` (exportada; função) - Obtem rotina atual do utilizador autenticado. Entradas: `userId`: Utilizador autenticado. Devolve: Rotina publica ou null.

### `real_dev/api/src/services/face-analysis.service.js`

- `latestByKind(photos, kind)` (top-level; função) - Encontra a fotografia ativa mais recente de um tipo. Entradas: `photos`: Fotografias ordenadas por data descrescente; `kind`: Tipo pretendido. Devolve: Fotografia mais recente.
- `toFaceAnalysisResponse(analysis)` (top-level; função) - Converte analise para resposta segura. Entradas: `analysis`: Documento Mongoose ou mock equivalente. Devolve: Analise publica.
- `preparePhotoForProvider(photo)` (top-level; função) - Prepara uma fotografia cifrada para provider interno ou externo. Entradas: `photo`: Documento `FacePhoto` com `storageKey` e `encryption` selecionados. Devolve: Entrada temporária para provider.
- `createFaceAnalysisForUser(userId)` (exportada; função) - Cria uma analise para o utilizador autenticado. Entradas: `userId`: Utilizador autenticado. Devolve: Analise criada.

### `real_dev/api/src/services/face-photo.service.js`

- `hasSignaturePrefix(buffer, signature)` (top-level; função) - Confirma se o buffer comeca com a assinatura binaria esperada. Entradas: `buffer`: Bytes iniciais do ficheiro; `signature`: Assinatura esperada. Devolve: Verdadeiro quando a assinatura corresponde.
- `readFileSignature(filePath)` (top-level; função) - Le apenas os bytes necessarios para validar a assinatura do ficheiro. Entradas: `filePath`: Caminho privado do ficheiro recebido. Devolve: Buffer com os primeiros bytes do ficheiro.
- `ensureAllowedImageSignature(file)` (top-level; função) - Valida que a assinatura binaria corresponde ao MIME aceite no upload. Entradas: `file`: Ficheiro recebido por Multer. Devolve: Conclui quando o ficheiro e uma imagem aceite.
- `ensureAllowedImageSignatures(uploadedFiles)` (top-level; função) - Valida assinatura real de todas as fotografias antes da persistencia. Entradas: `uploadedFiles`: Ficheiros recebidos. Devolve: Conclui quando todas as imagens sao validas.
- `toFacePhotoResponse(photo)` (top-level; função) - Converte uma fotografia facial para resposta segura. Entradas: `photo`: Documento Mongoose ou mock equivalente. Devolve: Metadados publicos.
- `removeUploadedFiles(uploadedFiles = [])` (exportada; função) - Remove ficheiros recem-recebidos quando a persistencia falha. Entradas: `uploadedFiles`: Ficheiros a limpar. Devolve: Conclui mesmo que algum ficheiro ja nao exista.
- `acceptFaceConsent(userId, input)` (exportada; função) - Aceita ou renova consentimento facial do utilizador. Entradas: `userId`: Utilizador autenticado; `input`: Consentimento validado. Devolve: Consentimento seguro.
- `saveFacePhotos(userId, uploadedFiles, activeConsent)` (exportada; função) - Guarda metadados de fotografias faciais com ownership da sessao. Entradas: `userId`: Utilizador autenticado; `uploadedFiles`: Ficheiros validados; `activeConsent`: Consentimento ja confirmado na rota. Devolve: Fotografias seguras.

### `real_dev/api/src/services/face-report.service.js`

- `buildCosmeticSummary(analysis)` (top-level; função) - Constroi resumo cosmetico limitado a partir da analise. Entradas: `analysis`: Analise concluida. Devolve: Resumo textual.
- `buildRoutineSuggestions(analysis)` (top-level; função) - Gera rotina geral sem recomendacao comercial personalizada. Entradas: `analysis`: Analise concluida. Devolve: Sugestoes de rotina.
- `toFaceReportResponse(report)` (top-level; função) - Converte relatorio para resposta segura. Entradas: `report`: Documento Mongoose ou mock equivalente. Devolve: Relatorio publico.
- `generateReportFromLatestAnalysis(userId)` (exportada; função) - Gera relatorio da ultima analise concluida do utilizador. Entradas: `userId`: Utilizador autenticado. Devolve: Relatorio criado.

### `real_dev/api/src/services/face-secure-storage.service.js`

- `safeUnlink(filePath)` (top-level; função) - Remove um ficheiro sem falhar quando já não existe. Entradas: `filePath`: Caminho privado a remover. Devolve: Promise resolvida quando a operação termina.
- `encryptFacePhotoFile(file)` (exportada; função) - Cifra uma fotografia recebida por Multer e remove o original. Entradas: `file`: Ficheiro já validado por MIME e assinatura. Devolve: Metadados seguros para MongoDB.
- `removeEncryptedFacePhotoFiles(encryptedFiles = [])` (exportada; função) - Remove fotografias cifradas criadas durante um pedido que falhou. Entradas: `encryptedFiles`: Ficheiros cifrados a limpar. Devolve: Promise resolvida quando a operação termina.
- `readEncryptedFacePhotoFile(photo)` (exportada; função) - Lê uma fotografia cifrada para providers internos autorizados. Entradas: `photo`: Documento de fotografia. Devolve: Bytes originais da fotografia.

### `real_dev/api/src/services/makeup-simulation.service.js`

- `toSimulationDto(simulation)` (top-level; função) - Converte a simulação persistida para DTO público. Entradas: `simulation`: Documento de simulação com produto associado. Devolve: Simulação segura para o frontend.
- `createMakeupSimulationForUser(userId, input, consent)` (exportada; função) - Cria simulação de maquilhagem para o utilizador autenticado. Entradas: `userId`: Utilizador autenticado; `input`: Produto validado; `consent`: Consentimento ativo da rota. Devolve: Simulação pública.

### `real_dev/api/src/services/notification.service.js`

- `toNotificationDto(notification)` (exportada; função) - Converte notificacao para DTO seguro. Entradas: `notification`: Documento Mongoose ou mock equivalente. Devolve: Notificacao do proprio utilizador.
- `listMyNotifications(userId)` (exportada; função) - Lista notificacoes do utilizador autenticado. Entradas: `userId`: ID da sessao. Devolve: Notificacoes proprias.
- `markMyNotificationAsRead(userId, notificationId)` (exportada; função) - Marca notificacao propria como lida. Entradas: `userId`: ID da sessao; `notificationId`: ID da notificacao. Devolve: Notificacao atualizada.
- `createCampaignNotification(input)` (exportada; função) - Cria campanha interna para utilizadores de uma role. Entradas: `input`: Campanha validada. Devolve: Numero de notificacoes criadas.
- `createOrderStatusNotification(order)` (exportada; função) - Cria notificacao minimizada de estado de encomenda. Entradas: `order`: Encomenda atualizada. Devolve: Notificacao criada.
- `updateOrderStatusAndNotify(orderId, status)` (exportada; função) - Atualiza estado logistico e emite notificacao transacional. Entradas: `orderId`: Encomenda alvo; `status`: Novo estado logistico. Devolve: Resultado minimizado.

### `real_dev/api/src/services/observability.service.js`

- `createRequestId()` (exportada; função) - Cria um identificador tecnico para correlacionar resposta, log e metrica. Entradas: sem entradas explícitas. Devolve: UUID aleatorio para o pedido atual.
- `getSafeRoute(req)` (exportada; função) - Remove query strings e identificadores reais antes de registar a rota. Entradas: `req`: Pedido Express observado. Devolve: Rota minimizada para logs e metricas.
- `isSensitiveText(value)` (top-level; função) - Verifica se um texto parece conter dados sensiveis. Entradas: `value`: Texto a avaliar. Devolve: Verdadeiro quando o texto deve ser redigido.
- `sanitizePublicDetails(details, depth = 0)` (exportada; função) - Sanitiza detalhes que podem ir para a resposta publica. Entradas: `details`: Detalhes recebidos de validators ou services; `depth`: Profundidade atual da sanitizacao recursiva. Devolve: Detalhes sem campos sensiveis.
- `buildPublicErrorResponse({ statusCode, message, details, requestId = "sem-request-id", })` (exportada; função) - Construi a resposta de erro que pode ser devolvida ao frontend. Entradas: `options`: Dados do erro. Devolve: Resposta publica minimizada.
- `buildSafeErrorLog({ err, req, statusCode })` (exportada; função) - Cria uma entrada de log com lista fechada de campos permitidos. Entradas: `options`: Erro e pedido. Devolve: Entrada segura para log.
- `writeSafeErrorLog(entry, logger = console)` (exportada; função) - Escreve o log seguro ja minimizado. Entradas: `entry`: Entrada de log permitida; `logger`: Logger injetavel para testes. Devolve: não devolve payload explícito.
- `getMetricStatus(statusCode)` (exportada; função) - Converte um codigo HTTP num estado operacional simples. Entradas: `statusCode`: Codigo HTTP observado. Devolve: Estado operacional da metrica.
- `canUseRealMetricConnection()` (top-level; função) - Indica se o modelo real tem uma ligacao Mongo pronta para escrita. Entradas: sem entradas explícitas. Devolve: Verdadeiro quando uma escrita real nao fica em buffer.
- `recordHttpRequestMetric({ method, route, statusCode, durationMs, })` (exportada; função) - Regista uma metrica HTTP minimizada sem interromper o pedido principal. Entradas: `metric`: Metrica observada. Devolve: Promessa resolvida mesmo que a escrita auxiliar falhe.

### `real_dev/api/src/services/order.service.js`

- `toOrderResponse(order)` (exportada; função) - Converte encomenda para DTO publico. Entradas: `order`: Documento Mongoose ou mock equivalente. Devolve: Encomenda sem userId nem detalhes internos.
- `buildOrderItemsFromCart(cartItems)` (top-level; função) - Rele produtos atuais e constroi linhas de encomenda seguras. Entradas: `cartItems`: Itens do carrinho. Devolve: Itens revalidados.
- `buildCheckoutKey(userId, cart, gateway)` (top-level; função) - Cria chave idempotente para a tentativa atual de checkout. Entradas: `userId`: ID autenticado pelo cookie HttpOnly; `cart`: Carrinho autenticado; `gateway`: Gateway validado. Devolve: Chave estavel para a mesma tentativa de checkout.
- `findReusableCheckoutOrder(userId, checkoutKey)` (top-level; função) - Procura uma encomenda ja criada para a mesma tentativa de checkout. Entradas: `userId`: ID autenticado; `checkoutKey`: Chave idempotente calculada pelo backend. Devolve: Encomenda reaproveitavel ou null.
- `markCheckoutPaymentFailed(order, gateway)` (top-level; função) - Guarda falha controlada de pagamento sem marcar a encomenda como paga. Entradas: `order`: Encomenda persistida; `gateway`: Gateway que falhou. Devolve: Promise resolvida quando a operação termina.
- `checkoutMyCart(userId, input)` (exportada; função) - Cria encomenda a partir do carrinho autenticado e inicia pagamento. Entradas: `userId`: ID autenticado; `input`: Gateway validado. Devolve: Encomenda criada.
- `listMyOrders(userId)` (exportada; função) - Lista historico de compras do cliente autenticado. Entradas: `userId`: ID autenticado. Devolve: Encomendas ordenadas por data.

### `real_dev/api/src/services/performance-budget.service.js`

- `assertPerformanceBudgetActive(signal)` (exportada; função) - Garante que uma tarefa cooperativa ainda esta dentro do budget temporal. Entradas: `signal`: Sinal controlado por `runWithPerformanceBudget`. Devolve: não devolve payload explícito.
- `recordPerformanceMetric(metric)` (top-level; função) - Persiste uma metrica minimizada sem mascarar o resultado principal. Entradas: `metric`: Metrica minimizada. Devolve: Promise resolvida quando a operação termina.
- `runWithPerformanceBudget({ operation, budgetMs, task })` (exportada; função) - Executa uma operacao com budget temporal e regista a metrica completa. A medicao comeca antes de executar `task` e termina apenas depois de `task` resolver/rejeitar ou do timeout disparar. A metrica persistida e minimizada. Entradas: `options`: Configuracao do budget. Devolve: Resultado e metrica temporal.

### `real_dev/api/src/services/preferences.service.js`

- `toPreferenceResponse(preference)` (top-level; função) - Converte preferencias para resposta JSON. Entradas: `preference`: Documento Mongoose ou mock equivalente. Devolve: Preferencias seguras.
- `getMyPreferences(userId)` (exportada; função) - Consulta preferencias, criando o documento vazio se ainda nao existir. Entradas: `userId`: ID vindo da sessao autenticada. Devolve: Preferencias existentes ou inicializadas.
- `updateMyPreferences(userId, input)` (exportada; função) - Atualiza preferencias do utilizador autenticado. Entradas: `userId`: ID vindo da sessao autenticada; `input`: Preferencias validadas. Devolve: Preferencias atualizadas.

### `real_dev/api/src/services/product.service.js`

- `toProductResponse(product)` (top-level; função) - Converte um produto Mongoose em resposta JSON. Entradas: `product`: Documento Mongoose ou mock equivalente. Devolve: Produto seguro.
- `createProduct(input, adminUserId)` (exportada; função) - Cria um produto no catalogo. Entradas: `input`: Dados validados do produto; `adminUserId`: ID do administrador autenticado. Devolve: Produto criado.
- `toPublicProductResponse(product)` (top-level; função) - Converte um produto para o contrato publico do catalogo. Entradas: `product`: Documento Mongoose ou mock equivalente. Devolve: Produto sem campos administrativos.
- `escapeRegexText(value)` (top-level; função) - Escapa texto recebido do cliente antes de o usar numa RegExp. Entradas: `value`: Texto de pesquisa normalizado. Devolve: Texto seguro para RegExp literal.
- `listCatalogProducts(filters)` (exportada; função) - Lista produtos publicos do catalogo com filtros validados. Entradas: `filters`: Filtros normalizados. Devolve: Produtos publicos.
- `getReviewSummary(productId)` (top-level; função) - Calcula resumo publico das reviews publicadas de um produto. Entradas: `productId`: ID do produto. Devolve: Resumo de notas.
- `getCatalogProductDetails(productId)` (exportada; função) - Obtem o detalhe publico de um produto. Entradas: `productId`: ID validado do produto. Devolve: Produto publico detalhado.

### `real_dev/api/src/services/profile.service.js`

- `toProfileResponse(profile)` (top-level; função) - Converte um perfil Mongoose numa resposta JSON estavel. Entradas: `profile`: Documento Mongoose ou mock equivalente. Devolve: Perfil seguro para o cliente.
- `createMyProfile(userId, input)` (exportada; função) - Cria o perfil do utilizador autenticado. Entradas: `userId`: ID vindo da sessao autenticada; `input`: Dados ja validados. Devolve: Perfil criado.
- `getMyProfile(userId)` (exportada; função) - Consulta o perfil do utilizador autenticado. Entradas: `userId`: ID vindo da sessao autenticada. Devolve: Perfil do proprio utilizador.
- `updateMyProfile(userId, input)` (exportada; função) - Atualiza campos editaveis do perfil do utilizador autenticado. Entradas: `userId`: ID vindo da sessao autenticada; `input`: Campos permitidos pelo validator. Devolve: Perfil atualizado.
- `updateMyProfilePhoto(userId, input)` (exportada; função) - Atualiza o URL controlado da fotografia de perfil. Entradas: `userId`: ID vindo da sessao autenticada; `input`: Dados validados. Devolve: Perfil atualizado com data da fotografia.

### `real_dev/api/src/services/recommendation-reason.service.js`

- `uniqueCleanStrings(values)` (top-level; função) - Remove valores repetidos e vazios sem alterar a ordem original. Entradas: `values`: Lista recebida de outro service. Devolve: Lista limpa e sem duplicados.
- `assertSafePublicExplanation(text)` (exportada; função) - Valida se uma frase publica fica dentro do dominio cosmetico. Entradas: `text`: Texto que sera devolvido ao frontend. Devolve: não devolve payload explícito.
- `buildPublicSourceLabels(sourceSignals)` (exportada; função) - Converte sinais tecnicos em labels publicos. Entradas: `sourceSignals`: Sinais internos controlados pelo backend. Devolve: Labels seguros para o frontend.
- `buildRecommendationReason({ reasonCodes, sourceSignals, product, profile = null, })` (exportada; função) - Constroi explicacao publica de uma recomendacao. Entradas: `input`: Sinais validados. Devolve: Motivo publico.

### `real_dev/api/src/services/recommendation-restrictions.service.js`

- `normalizeRestrictionTerm(value)` (top-level; função) - Normaliza termos de ingredientes/restricoes para comparacao exata. Entradas: `value`: Valor original. Devolve: Termo normalizado.
- `getBlockedIngredientsFromProfile(profile)` (exportada; função) - Junta alergias e ingredientes a evitar declarados no perfil. Entradas: `profile`: Perfil do utilizador. Devolve: Ingredientes bloqueados.
- `getProductRestrictionConflict(product, profile)` (exportada; função) - Verifica se um produto viola restricoes declaradas. Entradas: `product`: Produto candidato; `profile`: Perfil do utilizador. Devolve: Resultado.
- `filterProductsBlockedByProfile(products, profile)` (exportada; função) - Remove produtos incompativeis com alergias/ingredientes a evitar. Entradas: `products`: Produtos candidatos; `profile`: Perfil do utilizador. Devolve: Produtos seguros para ranking.

### `real_dev/api/src/services/recommendation-review.service.js`

- `toReviewDto(review, recommendation)` (top-level; função) - Converte a revisão e a recomendação atualizada para DTO público. Entradas: `review`: Revisão manual persistida; `recommendation`: Recomendação revista e populada com produto. Devolve: Revisão segura para resposta HTTP.
- `createRecommendationReview(consultantId, input)` (exportada; função) - Regista revisão manual por consultor/admin. Entradas: `consultantId`: Utilizador consultor/admin autenticado; `input`: Dados validados. Devolve: Revisão pública.

### `real_dev/api/src/services/recommendation.service.js`

- `normalizeSearchText(value)` (top-level; função) - Normaliza texto para comparação leve. Entradas: `value`: Valor original. Devolve: Texto normalizado.
- `toProductSnapshot(product)` (top-level; função) - Converte produto populado para DTO publico. Entradas: `product`: Produto Mongoose ou mock equivalente. Devolve: Produto publico.
- `toRecommendationDto(recommendation)` (top-level; função) - Converte recomendacao para DTO publico. Entradas: `recommendation`: Documento populado. Devolve: Recomendacao publica.
- `buildProductSearchText(product)` (top-level; função) - Cria texto pesquisável do produto. Entradas: `product`: Produto candidato. Devolve: Texto normalizado.
- `resolveGuidedKeywords(signal)` (top-level; função) - Extrai termos guiados permitidos para reforço de ranking. Entradas: `signal`: Sinal seguro do histórico IA. Devolve: Termos normalizados para comparar com produto.
- `buildGuidedSourceSignal(signal)` (top-level; função) - Constrói um sinal público controlado para a avaliação guiada. Entradas: `signal`: Sinal seguro do histórico IA. Devolve: Sinal técnico com prefixo público permitido.
- `scoreProductForAnalysis(product, analysis)` (top-level; função) - Avalia compatibilidade cosmetica entre produto e analise. Entradas: `product`: Produto candidato; `analysis`: Analise facial concluida. Devolve: Ranking ou null.
- `scoreGuidedContextForProduct(product, historyContext)` (top-level; função) - Converte contexto guiado em reforço de ranking para um produto. Entradas: `product`: Produto candidato; `historyContext`: Contexto seguro. Devolve: Reforço calculado.
- `getLatestAnalysisAndReport(userId)` (top-level; função) - Obtem a ultima analise concluida e relatorio correspondente. Entradas: `userId`: Utilizador autenticado. Devolve: Contrato de recomendacao.
- `getRecommendationProfile(userId)` (top-level; função) - Obtém perfil cosmético obrigatório para recomendações. Entradas: `userId`: Utilizador autenticado. Devolve: Perfil do cliente.
- `getGuidedContextForRecommendations(userId, options)` (top-level; função) - Carrega contexto seguro da sessão guiada quando o cliente indicou uma sessão. Entradas: `userId`: Utilizador autenticado; `options`: Opções validadas. Devolve: Contexto seguro para ranking.
- `generateRecommendationsForUser(userId, options = {})` (exportada; função) - Gera recomendacoes personalizadas do utilizador autenticado. Entradas: `userId`: Utilizador autenticado; `options`: Contexto guiado opcional. Devolve: Recomendacoes geradas.
- `listRecommendationsForUser(userId)` (exportada; função) - Lista recomendacoes do proprio utilizador. Entradas: `userId`: Utilizador autenticado. Devolve: Recomendacoes publicas.
- `submitRecommendationFeedback(userId, input)` (exportada; função) - Regista feedback do cliente numa recomendacao. Entradas: `userId`: Utilizador autenticado; `input`: Feedback validado. Devolve: Recomendacao atualizada.

### `real_dev/api/src/services/related-products.service.js`

- `toRelatedProductResponse(product)` (top-level; função) - Converte produto relacionado para resposta publica compacta. Entradas: `product`: Documento Mongoose ou mock equivalente. Devolve: Produto relacionado.
- `listRelatedCatalogProducts(productId)` (exportada; função) - Lista produtos relacionados por campos de catalogo. Entradas: `productId`: Produto base. Devolve: Produtos relacionados sem o produto atual.

### `real_dev/api/src/services/reorder.service.js`

- `reorderFromOrder(userId, orderId)` (exportada; função) - Recompra produtos disponiveis de uma encomenda anterior, adicionando-os ao carrinho. Entradas: `userId`: ID autenticado; `orderId`: Encomenda original. Devolve: Carrinho atualizado e produtos ignorados.

### `real_dev/api/src/services/review.service.js`

- `toReviewResponse(review)` (top-level; função) - Converte uma review para resposta publica. Entradas: `review`: Documento Mongoose ou mock equivalente. Devolve: Review segura.
- `isDuplicateReviewError(err)` (top-level; função) - Deteta erro de indice unico do MongoDB. Entradas: `err`: Erro recebido do Mongoose. Devolve: Verdadeiro quando o erro e duplicacao.
- `createProductReview(productId, userId, input)` (exportada; função) - Cria uma avaliacao para o produto usando ownership da sessao. Entradas: `productId`: Produto avaliado; `userId`: Utilizador autenticado; `input`: Review validada. Devolve: Review criada.
- `listProductReviews(productId)` (exportada; função) - Lista reviews publicadas de um produto. Entradas: `productId`: Produto alvo. Devolve: Reviews publicadas.

### `real_dev/api/src/services/routine-alert.service.js`

- `toRoutineAlertPreferenceDto(preference)` (top-level; função) - Converte preferencia para DTO. Entradas: `preference`: Documento Mongoose. Devolve: Preferencia segura.
- `getMyRoutineAlertPreference(userId)` (exportada; função) - Consulta ou cria preferencia default do utilizador. Entradas: `userId`: ID autenticado. Devolve: Preferencia.
- `updateMyRoutineAlertPreference(userId, input)` (exportada; função) - Atualiza preferencia de alerta do proprio utilizador. Entradas: `userId`: ID autenticado; `input`: Preferencia validada. Devolve: Preferencia atualizada.
- `createDueRoutineAlerts(now = new Date())` (exportada; função) - Cria alertas de rotina devidos de forma idempotente. Entradas: `now`: Date()] - Momento de execucao controlavel em testes. Devolve: Numero de alertas criados.

### `real_dev/api/src/services/session.service.js`

- `getSessionCookieOptions()` (exportada; função) - Constroi as opcoes seguras do cookie de sessao. Entradas: sem entradas explícitas. Devolve: Opcoes para `res.cookie`.
- `getClearSessionCookieOptions()` (top-level; função) - Constroi as opcoes usadas para limpar o cookie de sessao. `clearCookie` nao deve receber `maxAge`, porque o Express passa a ignorar esse campo em versoes futuras. Mantemos os restantes atributos iguais aos usados na criacao para atingir o mesmo cookie. Entradas: sem entradas explícitas. Devolve: Opcoes para `res.clearCookie`.
- `createSessionToken(user)` (exportada; função) - Cria um token de sessao a partir do utilizador seguro. Entradas: `user`: Utilizador autenticado. Devolve: JWT assinado para colocar no cookie HttpOnly.
- `verifySessionToken(token)` (exportada; função) - Valida um token de sessao e devolve o utilizador autenticado. Entradas: `token`: JWT recebido do cookie. Devolve: Dados minimos do utilizador autenticado.
- `attachSessionCookie(res, user)` (exportada; função) - Escreve o cookie HttpOnly de sessao na resposta. Entradas: `res`: Resposta Express; `user`: Utilizador autenticado. Devolve: não devolve payload explícito.
- `clearSessionCookie(res)` (exportada; função) - Limpa o cookie de sessao no logout. Entradas: `res`: Resposta Express. Devolve: não devolve payload explícito.

### `real_dev/api/src/services/skin-comparison.service.js`

- `getDaysBetween(start, end)` (top-level; função) - Calcula dias completos entre duas datas. Entradas: `start`: Data inicial; `end`: Data final. Devolve: Dias completos entre datas.
- `getFindingLabel(finding)` (top-level; função) - Extrai label publico de um finding de analise facial. Entradas: `finding`: Finding guardado na analise. Devolve: Label seguro para DTO.
- `buildChangeLabel(baselineValue, followUpValue)` (top-level; função) - Cria descritor textual da alteracao de uma metrica. Entradas: `baselineValue`: Valor inicial; `followUpValue`: Valor final. Devolve: Alteracao em linguagem segura.
- `toSkinComparisonResponse(comparison)` (top-level; função) - Converte documento de comparacao para DTO minimizado. Entradas: `comparison`: Documento Mongoose ou mock equivalente. Devolve: Comparacao sem dados biometricos brutos.
- `createSkinComparison(userId, input)` (exportada; função) - Cria ou atualiza a comparacao temporal entre duas analises do proprio cliente. Entradas: `userId`: ID do utilizador autenticado; `input`: IDs validados. Devolve: Comparacao minimizada.

### `real_dev/api/src/services/skin-evolution.service.js`

- `toScore(finding)` (top-level; função) - Converte uma label cosmética guardada para a escala numérica do gráfico. Entradas: `finding`: Resultado cosmético guardado na análise. Devolve: Pontuação de 1 a 3 ou null quando a label não é mapeável.
- `toEvolutionPoint(analysis)` (top-level; função) - Converte uma análise facial concluída num ponto temporal de evolução. Entradas: `analysis`: Documento de análise facial concluída. Devolve: Ponto público com scores cosméticos.
- `getMySkinEvolution(userId)` (exportada; função) - Obtém pontos públicos de evolução do utilizador autenticado. Entradas: `userId`: Utilizador autenticado. Devolve: DTO publico de evolucao.

### `real_dev/api/src/services/skin-history.service.js`

- `toAnalysisHistoryItem(analysis)` (top-level; função) - Converte analise em item cronologico seguro. Entradas: `analysis`: Documento Mongoose ou mock equivalente. Devolve: Item de historico de analise.
- `toReportHistoryItem(report)` (top-level; função) - Converte relatorio em item cronologico seguro. Entradas: `report`: Documento Mongoose ou mock equivalente. Devolve: Item de historico de relatorio.
- `getPersonalSkinHistory(userId)` (exportada; função) - Lista historico pessoal do utilizador autenticado. Entradas: `userId`: Utilizador autenticado. Devolve: Historico ordenado por data descrescente.

### `real_dev/api/src/services/stock.service.js`

- `toStockProductResponse(product)` (top-level; função) - Converte produto para DTO de stock. Entradas: `product`: Produto Mongoose ou mock equivalente. Devolve: Produto minimizado para stock.
- `listLowStockProducts()` (exportada; função) - Lista produtos com stock abaixo do limite canonico de RF32. Entradas: sem entradas explícitas. Devolve: Produtos com stock inferior a 5.
- `setProductStock(productId, stock)` (exportada; função) - Ajusta manualmente o stock de um produto. Entradas: `productId`: Produto a atualizar; `stock`: Novo stock. Devolve: Produto atualizado.
- `groupOrderItemsByProduct(items)` (top-level; função) - Agrupa linhas de encomenda por produto para reduzir cada stock uma unica vez. Entradas: `items`: Linhas da encomenda. Devolve: Linhas agrupadas.
- `assertEnoughStockForGroupedItems(items, session)` (top-level; função) - Confirma que todos os produtos agrupados ainda têm stock suficiente. Entradas: `items`: Itens agrupados; `session`: Sessao da transacao. Devolve: Promise resolvida quando a operação termina.
- `applyOrderStockUpdate(orderId)` (exportada; função) - Reduz stock uma unica vez para uma encomenda com pagamento confirmado. Entradas: `orderId`: Encomenda confirmada. Devolve: Resultado.

### `real_dev/api/src/utils/encryption.util.js`

- `isEncryptedPayload(value)` (exportada; função) - Confirma se um valor já tem o formato cifrado interno. Entradas: `value`: Valor candidato. Devolve: Verdadeiro quando parece payload cifrado da Orélle.
- `parseDataEncryptionKey(rawKey)` (exportada; função) - Converte uma chave textual numa chave AES-256. Entradas: `rawKey`: Chave em base64, hex ou texto forte. Devolve: Chave com 32 bytes.
- `getActiveDataEncryptionKey()` (top-level; função) - Resolve a chave ativa, exigindo segredo dedicado em produção. Entradas: sem entradas explícitas. Devolve: Chave AES-256 para cifra/decifra.
- `encryptBuffer(plainBuffer)` (exportada; função) - Encripta bytes sensíveis com AES-256-GCM. Entradas: `plainBuffer`: Conteúdo a cifrar. Devolve: Payload cifrado.
- `decryptBuffer(payload)` (exportada; função) - Decifra bytes previamente cifrados pela Orélle. Entradas: `payload`: Payload AES-256-GCM. Devolve: Conteúdo original.
- `encryptJson(value)` (exportada; função) - Encripta um valor JSON mantendo tipo lógico na decifra. Entradas: `value`: Valor serializável a proteger. Devolve: Payload cifrado.
- `decryptJson(value)` (exportada; função) - Decifra um valor JSON, aceitando dados antigos ainda em claro. Entradas: `value`: Valor cifrado ou legado em claro. Devolve: Valor lógico para services e DTOs.

### `real_dev/api/src/validators/admin-export.validator.js`

- `validateAdminExportRequest(params, query)` (exportada; função) - Valida dataset e formato de exportacao. Entradas: `params`: Parametros da rota; `query`: Query string. Devolve: Pedido normalizado.

### `real_dev/api/src/validators/admin-review.validator.js`

- `validateReviewModerationInput(params, body)` (exportada; função) - Valida o pedido de moderacao de uma review. Entradas: `params`: Parametros da rota; `body`: Corpo do pedido. Devolve: Dados normalizados.

### `real_dev/api/src/validators/ai-consultation-review.validator.js`

- `normalizeTextField(value, options)` (top-level; função) - Normaliza texto opcional ou obrigatório. Entradas: `value`: Valor recebido do body; `options`: Regras do campo. Devolve: Texto normalizado ou null.
- `normalizeRecommendationIds(value)` (top-level; função) - Normaliza lista de recomendações ajustadas. Entradas: `value`: Valor recebido do body. Devolve: Lista segura de ObjectIds.
- `validateReviewId(params)` (exportada; função) - Valida o identificador da revisão recebido nos params. Entradas: `params`: Parâmetros da rota. Devolve: ID da revisão.
- `validateReviewDecisionInput(params, body)` (exportada; função) - Valida o pedido de decisão de revisão humana. Entradas: `params`: Parâmetros da rota; `body`: Body enviado pelo consultor. Devolve: Dados normalizados.

### `real_dev/api/src/validators/ai-consultation.validator.js`

- `getGuidedConsultationScript()` (exportada; função) - Devolve uma copia publica do script de perguntas. Entradas: sem entradas explícitas. Devolve: Perguntas que podem ser mostradas no frontend.
- `validateSessionIdParam(params)` (exportada; função) - Valida o parametro `sessionId` recebido nas routes. Entradas: `params`: Parametros Express. Devolve: ID validado.
- `normalizeTextAnswer(question, value)` (top-level; função) - Normaliza uma resposta textual com limite de caracteres. Entradas: `question`: Pergunta do script; `value`: Valor recebido. Devolve: Texto seguro para guardar.
- `normalizeChoiceAnswer(question, value)` (top-level; função) - Normaliza uma escolha simples ou multipla. Entradas: `question`: Pergunta do script; `value`: Valor recebido. Devolve: Valor validado contra as opcoes da pergunta.
- `normalizeScaleAnswer(question, value)` (top-level; função) - Normaliza uma resposta numerica de escala. Entradas: `question`: Pergunta do script; `value`: Valor recebido. Devolve: Numero validado.
- `validateAnswerInput(body)` (exportada; função) - Valida e normaliza uma resposta enviada pelo frontend. Entradas: `body`: Corpo JSON do pedido. Devolve: Resposta pronta para o service.

### `real_dev/api/src/validators/auth.validator.js`

- `normalizeEmail(value)` (top-level; função) - Normaliza um email recebido do cliente. Entradas: `value`: Valor recebido em `body.email`. Devolve: Email em minusculas e sem espacos laterais.
- `validateRegisterInput(body)` (exportada; função) - Valida o payload de registo do BK-MF0-01. Entradas: `body`: Corpo do pedido HTTP. Devolve: Dados normalizados para o service.
- `validateLoginInput(body)` (exportada; função) - Valida o payload de login do BK-MF0-02. Entradas: `body`: Corpo do pedido HTTP. Devolve: Credenciais normalizadas.

### `real_dev/api/src/validators/before-after-visualization.validator.js`

- `validateBeforeAfterVisualizationInput(body)` (exportada; função) - Valida o body usado para criar uma visualização antes/depois. Entradas: `body`: Body recebido do pedido HTTP. Devolve: Dados normalizados para o service.

### `real_dev/api/src/validators/biometric-data-request.validator.js`

- `normalizeShortText(value)` (top-level; função) - Normaliza texto curto vindo do frontend sem o transformar em requisito novo. Entradas: `value`: Valor recebido no body. Devolve: Texto aparado e limitado.
- `validateCreateBiometricDataRequestInput(body = {})` (exportada; função) - Valida o pedido criado pelo proprio cliente. Entradas: `body`: Corpo recebido pela API. Devolve: Dados normalizados.
- `validateBiometricDataRequestDecisionInput(body = {})` (exportada; função) - Valida a decisao tomada por consultor ou administrador. Entradas: `body`: Corpo recebido pela API. Devolve: Decisao normalizada.

### `real_dev/api/src/validators/cart.validator.js`

- `validateProductId(value)` (top-level; função) - Valida ID de produto vindo de params ou payload. Entradas: `value`: Valor recebido. Devolve: ID normalizado.
- `validateQuantity(value)` (top-level; função) - Valida quantidade de carrinho. Entradas: `value`: Valor recebido. Devolve: Quantidade inteira.
- `validateCartItemPayload(body)` (exportada; função) - Valida payload de adicionar item ao carrinho. Entradas: `body`: Corpo HTTP. Devolve: Dados normalizados.
- `validateCartQuantityPayload(body)` (exportada; função) - Valida payload de atualizacao de quantidade. Entradas: `body`: Corpo HTTP. Devolve: Quantidade normalizada.
- `validateCartProductParam(params)` (exportada; função) - Valida parametro `productId` das rotas de carrinho. Entradas: `params`: Params Express. Devolve: ID normalizado.

### `real_dev/api/src/validators/catalog-query.validator.js`

- `normalizeText(value)` (top-level; função) - Normaliza texto simples vindo da query string. Entradas: `value`: Valor recebido do cliente. Devolve: Texto com espacos normalizados.
- `normalizeOptionalText(value)` (top-level; função) - Devolve texto normalizado ou undefined quando o filtro nao foi enviado. Entradas: `value`: Valor opcional da query. Devolve: Texto seguro ou ausencia de filtro.
- `parseOptionalPrice(value, fieldName, errors)` (top-level; função) - Converte precos opcionais em inteiros de centimos. Entradas: `value`: Valor recebido na query; `fieldName`: Nome do campo para mensagens de erro; `errors`: Acumulador de erros. Devolve: Preco validado ou undefined.
- `validateCatalogQuery(query)` (exportada; função) - Valida filtros publicos do catalogo. Entradas: `query`: Query params do Express. Devolve: Filtros normalizados.

### `real_dev/api/src/validators/category.validator.js`

- `slugify(value)` (exportada; função) - Cria um slug estavel a partir de texto humano. Entradas: `value`: Nome ou slug enviado. Devolve: Slug minusculo, sem acentos e separado por hifens.
- `validateCategoryInput(body)` (exportada; função) - Valida a criacao de uma categoria. Entradas: `body`: Corpo do pedido. Devolve: Categoria normalizada.
- `validateCategoryIds(body)` (exportada; função) - Valida a lista de categorias a associar a um produto. Entradas: `body`: Corpo do pedido. Devolve: Lista unica de ObjectIds em formato string.

### `real_dev/api/src/validators/checkout.validator.js`

- `validateCheckoutPayload(body)` (exportada; função) - Valida gateway de checkout. Entradas: `body`: Corpo HTTP. Devolve: Gateway normalizado.
- `validateOrderIdParam(params)` (exportada; função) - Valida parametro `orderId`. Entradas: `params`: Params Express. Devolve: ID normalizado.

### `real_dev/api/src/validators/client-ai-insight.validator.js`

- `validateClientInsightQuery(query)` (exportada; função) - Valida filtros aceites por `GET /api/me/ai-consultation-insights`. Entradas: `query`: Query string recebida pelo Express. Devolve: Filtros normalizados.

### `real_dev/api/src/validators/face-photo.validator.js`

- `validateFaceConsentInput(body)` (exportada; função) - Valida consentimento facial explicito. Entradas: `body`: Corpo JSON do pedido. Devolve: Consentimento normalizado.
- `validateUploadedFaceFiles(files)` (exportada; função) - Valida que chegaram exatamente as fotografias frontal e de perfil. Entradas: `files`: Ficheiros recebidos por Multer. Devolve: Ficheiros normalizados.

### `real_dev/api/src/validators/makeup-simulation.validator.js`

- `validateMakeupSimulationInput(body)` (exportada; função) - Valida o body usado para criar uma simulação de maquilhagem. Entradas: `body`: Body recebido do pedido HTTP. Devolve: Dados normalizados para o service.

### `real_dev/api/src/validators/notification.validator.js`

- `validateCampaignNotificationInput(body)` (exportada; função) - Valida campanha admin de notificacoes internas. Entradas: `body`: Corpo do pedido. Devolve: Dados normalizados.
- `validateNotificationIdParam(params)` (exportada; função) - Valida identificador de notificacao. Entradas: `params`: Parametros da rota. Devolve: ID normalizado.
- `validateOrderStatusNotificationInput(body)` (exportada; função) - Valida estado logistico para notificacao transacional. Entradas: `body`: Corpo do pedido. Devolve: Estado validado.

### `real_dev/api/src/validators/preferences.validator.js`

- `normalizeBrand(value)` (top-level; função) - Normaliza uma marca escrita pelo utilizador. Entradas: `value`: Valor original. Devolve: Marca limpa e com espacos internos normalizados.
- `validatePreferencesInput(body)` (exportada; função) - Valida preferencias de marcas e produtos favoritos. Entradas: `body`: Corpo do pedido. Devolve: Preferencias normalizadas.

### `real_dev/api/src/validators/product-id.validator.js`

- `validateProductIdParam(params)` (exportada; função) - Valida o parametro `productId` como ObjectId MongoDB. Entradas: `params`: Parametros de rota Express. Devolve: Product ID seguro.

### `real_dev/api/src/validators/product.validator.js`

- `normalizeText(value)` (top-level; função) - Normaliza texto simples. Entradas: `value`: Valor recebido do cliente. Devolve: Texto limpo e com espacos internos normalizados.
- `normalizeList(value)` (top-level; função) - Normaliza uma lista de strings. Entradas: `value`: Valor esperado como array. Devolve: Lista normalizada, em minusculas e sem duplicados.
- `assertControlledImageUrl(value, errors)` (top-level; função) - Valida e normaliza o URL da imagem do produto. Entradas: `value`: Valor recebido em `imageUrl`; `errors`: Objeto de erros a preencher. Devolve: URL normalizado ou string vazia em caso de erro.
- `hasBlockedClaims(description)` (top-level; função) - Deteta claims medicos bloqueados no texto do produto. Entradas: `description`: Descricao normalizada do produto. Devolve: Verdadeiro quando a descricao contem claim bloqueado.
- `validateProductInput(body)` (exportada; função) - Valida o payload de criacao de produto. Entradas: `body`: Corpo do pedido admin. Devolve: Produto normalizado.

### `real_dev/api/src/validators/profile-photo.validator.js`

- `parseUrl(value)` (top-level; função) - Tenta converter um valor para URL. Entradas: `value`: Valor recebido do cliente. Devolve: URL valido ou null quando o valor e invalido.
- `validateProfilePhotoInput(body)` (exportada; função) - Valida o payload de fotografia controlada do RF04. Entradas: `body`: Corpo do pedido. Devolve: Dados prontos para persistencia.

### `real_dev/api/src/validators/profile.validator.js`

- `normalizeText(value)` (top-level; função) - Normaliza texto simples vindo de formularios. Entradas: `value`: Valor original. Devolve: Texto sem espacos nas pontas.
- `normalizeList(value)` (top-level; função) - Normaliza listas de texto, removendo vazios e duplicados. Entradas: `value`: Valor original, esperado como array. Devolve: Lista em minusculas, sem vazios e sem duplicados.
- `validateRestrictionList(items, fieldName)` (top-level; função) - Valida listas curtas de restricoes cosmeticas. Entradas: `items`: Lista normalizada; `fieldName`: Nome do campo para mensagem de erro. Devolve: Lista valida ou erro.
- `validateCreateProfileInput(body)` (exportada; função) - Valida a criacao do perfil personalizado do RF03. Entradas: `body`: Corpo do pedido. Devolve: Dados validados.
- `validateUpdateProfileInput(body)` (exportada; função) - Valida a edicao controlada do perfil do RF04. Entradas: `body`: Corpo do pedido de edicao. Devolve: Campos permitidos para atualizar.

### `real_dev/api/src/validators/recommendation-feedback.validator.js`

- `validateRecommendationFeedbackInput(params, body)` (exportada; função) - Valida ID e valor de feedback recebido do cliente. Entradas: `params`: Parametros da rota; `body`: Corpo do pedido. Devolve: Dados normalizados.

### `real_dev/api/src/validators/recommendation-generation.validator.js`

- `normalizeHistoryLimit(value)` (top-level; função) - Normaliza limite de histórico usado para enriquecer recomendações. Entradas: `value`: Valor recebido do body. Devolve: Limite seguro.
- `normalizeOptionalObjectId(value, fieldName)` (top-level; função) - Normaliza um ObjectId opcional. Entradas: `value`: Valor recebido do body; `fieldName`: Nome do campo para mensagem de erro. Devolve: ObjectId válido ou null.
- `validateRecommendationGenerationInput(body = {})` (exportada; função) - Valida o pedido de geração de recomendações. Entradas: `body`: Body enviado pelo frontend. Devolve: Input normalizado.

### `real_dev/api/src/validators/recommendation-review.validator.js`

- `validateRecommendationReviewInput(params, body)` (exportada; função) - Valida params e body da revisão manual de uma recomendação. Entradas: `params`: Parâmetros da rota com o ID da recomendação; `body`: Body com estado, nota e possível explicação ajustada. Devolve: Dados normalizados.

### `real_dev/api/src/validators/review.validator.js`

- `validateReviewInput(body)` (exportada; função) - Valida rating e comentario de uma review. Entradas: `body`: Corpo do pedido. Devolve: Review normalizada.

### `real_dev/api/src/validators/routine-alert.validator.js`

- `parseOptionalRunDate(value)` (top-level; função) - Converte o campo opcional `now` num Date seguro para a execução admin. Entradas: `value`: Valor recebido em `body.now`. Devolve: Data validada ou o momento atual.
- `validateRoutineAlertPreferenceInput(body)` (exportada; função) - Valida preferencia pessoal de alerta. Entradas: `body`: Corpo do pedido. Devolve: Preferencia validada.
- `validateRoutineAlertRunInput(body = {})` (exportada; função) - Valida input opcional da execução administrativa de alertas. Entradas: `body`: Corpo do pedido admin. Devolve: Momento usado para avaliar alertas devidos.

### `real_dev/api/src/validators/skin-comparison.validator.js`

- `validateSkinComparisonPayload(body)` (exportada; função) - Valida o payload usado para criar uma comparacao entre duas analises. Entradas: `body`: Corpo recebido no pedido HTTP. Devolve: IDs normalizados.

### `real_dev/api/src/validators/stock.validator.js`

- `validateProductStockParams(params)` (exportada; função) - Valida parametro de produto em rotas admin de stock. Entradas: `params`: Params Express. Devolve: ID validado.
- `validateStockPayload(body)` (exportada; função) - Valida payload de ajuste manual de stock. Entradas: `body`: Corpo HTTP. Devolve: Stock normalizado.

## Frontend

### `real_dev/web/src/App.jsx`

- `SectionGroup({ title, description, children })` (top-level; função) - Agrupa paginas por responsabilidade visual sem substituir autorizacao. A autorizacao continua nos gates de role e na API; este componente serve apenas para tornar a experiencia MF5 mais previsivel em desktop e mobile. Entradas: `props`: Conteudo e contexto do grupo. Devolve: Grupo responsivo de paginas.
- `scrollToAppSection(sectionId)` (top-level; função) - Faz scroll para uma area real da aplicacao sem criar routing paralelo. Entradas: `sectionId`: ID da area a focar visualmente. Devolve: não devolve payload explícito.
- `AppContent()` (top-level; função) - Conteudo da aplicacao com acesso ao estado autenticado. Entradas: sem entradas explícitas. Devolve: Paginas MF0-MF5 agrupadas por papel, com gates de role preservados.
- `App()` (exportada; função) - Renderiza a aplicacao real_dev. Entradas: sem entradas explícitas. Devolve: Aplicacao React com contexto de autenticacao.

### `real_dev/web/src/components/FeedbackMessage.jsx`

- `FeedbackMessage({ id, type = "info", children })` (exportada; função) - Mostra uma mensagem acessivel e consistente para formularios da Orelle. Entradas: `props`: Identificador, tipo e conteudo seguro da mensagem. Devolve: Mensagem formatada ou null quando nao existe conteudo.

### `real_dev/web/src/components/MeasuredPageSection.jsx`

- `MeasuredPageSection({ pageKey, label, children })` (exportada; função) - Mede uma area principal sem alterar a pagina interna. Entradas: `props`: Area principal medida. Devolve: Wrapper com aviso tecnico minimizado.

### `real_dev/web/src/components/OptimizedImage.jsx`

- `OptimizedImage({ src, alt, width, height, className })` (exportada; função) - Renderiza imagem com defaults seguros de performance. Entradas: `props`: Propriedades da imagem. Devolve: Imagem otimizada ou null quando não há src.

### `real_dev/web/src/components/OrelleMockupHome.jsx`

- `HomeActionButton({ children, onClick, variant = "primary", className = "" })` (top-level; função) - Renderiza um botao reutilizavel da home mockup. Entradas: `props`: Texto e comportamento do botao. Devolve: Botao visual da home.
- `AIConsultantPreview({ onStartConsultation })` (top-level; função) - Mostra a demonstração visual da consulta IA sem simular backend. Entradas: `props`: Callback para abrir o hub real. Devolve: Secção de consultoria com preview visual.
- `OrelleMockupHome({...})` (exportada; função) - Renderiza a home principal e-commerce/consultoria. Entradas: `props`: Conteudo e navegacao real. Devolve: Home alinhada com o mockup.

### `real_dev/web/src/components/PagePerformanceNotice.jsx`

- `PagePerformanceNotice({ measurement })` (exportada; função) - Mostra o estado de performance sem dados pessoais ou de sessao. Entradas: `props`: Medicao local. Devolve: Aviso tecnico discreto.

### `real_dev/web/src/components/SubmitButton.jsx`

- `SubmitButton({...})` (exportada; função) - Botao de submissao com estado ocupado e protecao contra duplo envio. Entradas: `props`: Estado do envio, texto de espera, bloqueio externo, classe opcional e conteudo visivel. Devolve: Botao acessivel para formularios.

### `real_dev/web/src/components/ThemeControls.jsx`

- `ThemeControls()` (exportada; função) - Apresenta controlos acessiveis para alternar o tema visual da aplicacao. Entradas: sem entradas explícitas. Devolve: Grupo de botoes para tema claro, escuro e contraste.

### `real_dev/web/src/context/AuthContext.jsx`

- `AuthProvider({ children })` (exportada; função) - Provider de autenticacao para a app React. Entradas: `props`: Conteudo da aplicacao. Devolve: Provider com user, loading, login e logout.
- `login(credentials)` (interna; função) - Envia credenciais para a API e atualiza o utilizador autenticado. Entradas: `credentials`: Credenciais do formulario. Devolve: Utilizador autenticado.
- `logout()` (interna; função) - Termina a sessao no backend e limpa o utilizador local. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `useAuth()` (exportada; função) - Hook para ler o contexto de autenticacao. Entradas: sem entradas explícitas. Devolve: Estado e acoes de autenticacao.

### `real_dev/web/src/hooks/usePagePerformance.js`

- `usePagePerformance(pageKey, label)` (exportada; função) - Mede o primeiro frame apos montagem de uma area principal. Entradas: `pageKey`: Identificador tecnico da area principal; `label`: Nome visivel minimizado da area. Devolve: Medicao avaliada ou null antes do primeiro frame.

### `real_dev/web/src/hooks/useThemePreference.js`

- `canReadSystemTheme()` (top-level; função) - Confirma se o browser permite ler a preferencia visual do sistema. Entradas: sem entradas explícitas. Devolve: True quando `matchMedia` esta disponivel no runtime.
- `normalizeTheme(candidate)` (exportada; função) - Normaliza qualquer valor externo para um tema permitido pela aplicacao. Entradas: `candidate`: Valor recebido da UI ou de um teste negativo. Devolve: Tema seguro para aplicar no DOM.
- `getInitialTheme()` (exportada; função) - Calcula o tema inicial sem consultar APIs, sessoes ou dados pessoais. Entradas: sem entradas explícitas. Devolve: Tema inicial validado.
- `useThemePreference()` (exportada; função) - Gere a preferencia visual local da Orélle. Entradas: sem entradas explícitas. Devolve: Estado ativo, opcoes permitidas e acao de selecao.
- `handleSystemThemeChange(event)` (interna; função) - Sincroniza claro/escuro com o sistema sem substituir a escolha explicita de contraste. Entradas: `event`: Alteracao da preferencia visual do sistema. Devolve: não devolve payload explícito.

### `real_dev/web/src/pages/AdminCategoriesPage.jsx`

- `AdminCategoriesPage()` (exportada; função) - Formulario para criar categorias e associa-las a produtos. Entradas: sem entradas explícitas. Devolve: UI administrativa de categorias.
- `loadCategories()` (interna; função) - Carrega categorias administraveis da API. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `createCategory(event)` (interna; função) - Cria uma categoria na API. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.
- `toggleCategory(categoryId)` (interna; função) - Seleciona ou remove uma categoria da associacao. Entradas: `categoryId`: ID da categoria. Devolve: não devolve payload explícito.
- `assignCategories(event)` (interna; função) - Associa categorias existentes a um produto. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/AdminDashboardPage.jsx`

- `AdminDashboardPage()` (exportada; função) - Mostra estatisticas agregadas de vendas e utilizacao. Entradas: sem entradas explícitas. Devolve: Dashboard admin.
- `loadStats()` (interna; função) - Carrega estatisticas administrativas. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/AdminExportsPage.jsx`

- `getDownloadFilename(contentDisposition, fallback)` (top-level; função) - Resolve o nome do ficheiro indicado pelo backend. Entradas: `contentDisposition`: Header Content-Disposition; `fallback`: Nome local quando o header nao existe. Devolve: Nome seguro para download.
- `downloadBlob(blob, filename)` (top-level; função) - Descarrega um Blob no browser sem expor o conteudo no DOM. Entradas: `blob`: Conteudo binario recebido da API; `filename`: Nome do ficheiro. Devolve: não devolve payload explícito.
- `AdminExportsPage()` (exportada; função) - Gera exportacoes CSV/PDF como ficheiros descarregaveis. Entradas: sem entradas explícitas. Devolve: UI admin de exportacoes.
- `generateExport(event)` (interna; função) - Pede ao backend a exportacao escolhida e inicia o download local. Entradas: `event`: Submissao do formulario de exportacao. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/AdminNotificationsPage.jsx`

- `AdminNotificationsPage()` (exportada; função) - Mostra o formulario admin usado para criar campanhas de notificacoes internas. Entradas: sem entradas explícitas. Devolve: UI administrativa de campanhas.
- `updateField(event)` (interna; função) - Atualiza o campo editado mantendo os restantes valores da campanha. Entradas: `event`: Evento do campo editado. Devolve: não devolve payload explícito.
- `createCampaign(event)` (interna; função) - Submete a campanha ao backend e mostra o numero de notificacoes criadas. Entradas: `event`: Submissao do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/AdminProductCreatePage.jsx`

- `AdminProductCreatePage()` (exportada; função) - Formulario para criar produtos como administrador. Entradas: sem entradas explícitas. Devolve: UI de criacao de produto.
- `updateField(event)` (interna; função) - Atualiza um campo do formulario de produto. Entradas: `event`: Evento do campo. Devolve: não devolve payload explícito.
- `submitProduct(event)` (interna; função) - Envia o produto para a API admin. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/AdminReviewsPage.jsx`

- `AdminReviewsPage()` (exportada; função) - Mostra reviews e permite ocultar/republicar sem editar conteudo. Entradas: sem entradas explícitas. Devolve: UI de moderacao.
- `loadReviews()` (interna; função) - Carrega as reviews disponiveis para moderacao administrativa. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `moderate(reviewId, nextStatus)` (interna; função) - Envia a decisao de moderacao e substitui localmente a review atualizada. Entradas: `reviewId`: Review alvo da decisao; `nextStatus`: Estado de moderacao pretendido. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/AdminUsersPage.jsx`

- `AdminUsersPage()` (exportada; função) - Lista utilizadores e executa acoes administrativas de estado. Entradas: sem entradas explícitas. Devolve: UI admin de contas.
- `loadUsers()` (interna; função) - Carrega a lista administrativa de utilizadores. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `updateStatus(userId, nextStatus)` (interna; função) - Atualiza o estado operacional de uma conta e reflete a resposta na lista. Entradas: `userId`: Utilizador alvo; `nextStatus`: Estado de conta pretendido. Devolve: Promise resolvida quando a operação termina.
- `deleteUser(userId)` (interna; função) - Pede a eliminacao logica de uma conta e atualiza a linha correspondente. Entradas: `userId`: Utilizador alvo da eliminacao logica. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/AiHistoryPage.jsx`

- `SafeSignalList({ signals = [] })` (top-level; função) - Renderiza uma lista curta de sinais seguros da timeline. Entradas: `props`: Sinais publicos. Devolve: Lista de sinais minimizados.
- `AiHistoryPage()` (exportada; função) - Renderiza a timeline publica de historico IA do cliente autenticado. Entradas: sem entradas explícitas. Devolve: Timeline segura da interacao cliente-IA.
- `loadHistory()` (interna; função) - Carrega o historico IA do proprio cliente. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/AssistedConsultationHubPage.jsx`

- `AssistedConsultationHero({ user = null })` (top-level; função) - Renderiza o hero partilhado pelos estados da consulta assistida. Entradas: `props`: Sessao autenticada, quando existe. Devolve: Hero visual alinhado com o mockup aprovado.
- `renderAssistedConsultationPanel(panelId, setRecommendations)` (top-level; função) - Renderiza o painel selecionado da consulta assistida. Entradas: `panelId`: Identificador do painel ativo; `setRecommendations`: Sincroniza recomendacoes para paineis dependentes. Devolve: Painel React correspondente.
- `AssistedConsultationHubPage()` (exportada; função) - Integra consulta guiada, historico IA, recomendacoes, insights e revisao humana. Entradas: sem entradas explícitas. Devolve: Pagina integrada com acabamento visual RNF26.

### `real_dev/web/src/pages/BeforeAfterVisualizationPage.jsx`

- `BeforeAfterVisualizationPage({ simulation = null })` (exportada; função) - Mostra o fluxo que gera uma comparação visual segura a partir da simulação ativa. Entradas: `props`: Simulação de maquilhagem escolhida. Devolve: Página de visualização antes/depois.
- `submitVisualization(event)` (interna; função) - Submete a simulação ao backend para criar a visualização antes/depois. Entradas: `event`: Evento de submissão do formulário. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/BiometricAuditPage.jsx`

- `formatDateTime(value)` (top-level; função) - Formata datas vindas da API sem bloquear caso o valor esteja ausente. Entradas: `value`: Data do evento. Devolve: Data legivel para o painel.
- `AuditEventItem({ event })` (top-level; função) - Mostra um evento de auditoria minimizado. Entradas: `props`: Evento devolvido pela API. Devolve: Item de lista sem dados biometricos brutos.
- `BiometricAuditPage()` (exportada; função) - Painel administrativo de logs e alertas biometricos. Entradas: sem entradas explícitas. Devolve: Auditoria minimizada para administradores.
- `loadAudit()` (interna; função) - Carrega logs e alertas atraves dos endpoints administrativos reais. Entradas: sem entradas explícitas. Devolve: Atualiza estado visual e listas minimizadas.

### `real_dev/web/src/pages/BiometricDataRequestPage.jsx`

- `toggleResourceValue(resources, value, checked)` (top-level; função) - Alterna um recurso numa lista de recursos selecionados. Entradas: `resources`: Recursos atualmente selecionados; `value`: Recurso a adicionar ou remover; `checked`: Estado final do checkbox. Devolve: Proxima lista de recursos.
- `BiometricDataRequestPage()` (exportada; função) - Formulario de cliente para pedir eliminacao ou anonimizacao de dados faciais. Entradas: sem entradas explícitas. Devolve: UI de criacao de pedido RF41 com feedback seguro.
- `updateField(event)` (interna; função) - Atualiza campo simples do formulario. Entradas: `event`: Evento do campo. Devolve: não devolve payload explícito.
- `updateResource(event)` (interna; função) - Atualiza a lista de recursos sem aceitar ownership vindo da UI. Entradas: `event`: Evento do checkbox. Devolve: não devolve payload explícito.
- `handleSubmit(event)` (interna; função) - Cria o pedido no endpoint autenticado do cliente. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/BiometricDataRequestsAdminPage.jsx`

- `formatResources(resources = [])` (top-level; função) - Formata listas curtas de recursos para leitura no painel. Entradas: `resources`: Recursos pedidos pelo cliente. Devolve: Recursos formatados sem dados sensiveis.
- `BiometricDataRequestsAdminPage()` (exportada; função) - Painel de revisao de pedidos de eliminacao/anonymizacao de dados faciais. Entradas: sem entradas explícitas. Devolve: Lista minimizada de pedidos e acoes de decisao.
- `loadRequests()` (interna; função) - Carrega pedidos minimizados do painel. Entradas: sem entradas explícitas. Devolve: Atualiza a lista e o estado visual.
- `decideRequest(requestId, decision)` (interna; função) - Envia a decisao do revisor para a API. Entradas: `requestId`: Pedido biometrico a decidir; `decision`: Decisao escolhida no painel. Devolve: Recarrega a lista apos decisao.

### `real_dev/web/src/pages/CartPage.jsx`

- `CartPage()` (exportada; função) - Mostra e edita o carrinho autenticado. Entradas: sem entradas explícitas. Devolve: UI de carrinho com estados principais.
- `loadCart()` (interna; função) - Carrega carrinho da API. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `handleAddItem(event)` (interna; função) - Adiciona produto ao carrinho sem enviar preco ou userId. Entradas: `event`: Evento submit. Devolve: Promise resolvida quando a operação termina.
- `updateQuantity(itemProductId, nextQuantity)` (interna; função) - Atualiza a quantidade de um produto no carrinho. Entradas: `itemProductId`: Produto a atualizar; `nextQuantity`: Nova quantidade. Devolve: Promise resolvida quando a operação termina.
- `removeItem(itemProductId)` (interna; função) - Remove produto do carrinho. Entradas: `itemProductId`: Produto a remover. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/CheckoutPage.jsx`

- `CheckoutPage()` (exportada; função) - Cria encomenda a partir do carrinho e inicia gateway selecionado. Entradas: sem entradas explícitas. Devolve: UI de checkout.
- `handleCheckout()` (interna; função) - Submete checkout ao backend. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/ClientAiInsightsPage.jsx`

- `formatDatePt(value)` (top-level; função) - Formata datas de API para leitura curta em portugues. Entradas: `value`: Data recebida da API. Devolve: Data formatada ou texto neutro.
- `formatInsightStatus(status)` (top-level; função) - Traduz estado tecnico da review para texto de cliente. Entradas: `status`: Estado persistido da review. Devolve: Texto legivel para a UI.
- `RecommendationSummary({ recommendation })` (top-level; função) - Mostra uma recomendacao afetada por uma revisao humana. Entradas: `props`: Recomendacao publica. Devolve: Linha de recomendacao minimizada.
- `ClientAiInsightsPage()` (exportada; função) - Renderiza os insights publicos publicados pelo consultor. A pagina nao decide ownership nem guarda credenciais. A API identifica o cliente pelo cookie HttpOnly enviado automaticamente por `apiRequest`. Entradas: sem entradas explícitas. Devolve: Area de leitura RF46.
- `loadInsights(sessionFilter = "")` (interna; função) - Carrega insights do consultor, opcionalmente filtrados por sessao. Entradas: `sessionFilter`: Filtro opcional de sessao IA. Devolve: Promise resolvida quando a operação termina.
- `handleSubmit(event)` (interna; função) - Aplica o filtro escrito pelo cliente. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/ConsultantAiReviewPage.jsx`

- `formatReviewStatus(status)` (top-level; função) - Traduz estado técnico para texto de UI. Entradas: `status`: Estado técnico da revisão. Devolve: Texto legível.
- `ConsultantAiReviewPage()` (exportada; função) - Página operacional de revisão IA. Entradas: sem entradas explícitas. Devolve: Experiência de fila, detalhe e decisão.
- `loadReviews()` (interna; função) - Carrega a fila de revisões pendentes. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `openReview(reviewId)` (interna; função) - Abre o detalhe de uma revisão. Entradas: `reviewId`: ID da revisão escolhida. Devolve: Promise resolvida quando a operação termina.
- `submitDecision(event)` (interna; função) - Submete a decisão humana ao backend. Entradas: `event`: Evento de formulário. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/ConsultantRecommendationReviewPage.jsx`

- `ConsultantRecommendationReviewPage({ recommendations = [] })` (exportada; função) - Permite ao consultor ou administrador rever uma recomendação existente. Entradas: `props`: Recomendações carregadas no ecrã principal. Devolve: Formulário de revisão manual.
- `submitReview(event)` (interna; função) - Envia a decisão de revisão manual para o endpoint de consultor. Entradas: `event`: Evento de submissão do formulário. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/DailyRoutinePage.jsx`

- `groupSteps(steps)` (top-level; função) - Agrupa os passos da rotina pelos períodos apresentados na interface. Entradas: `steps`: Passos devolvidos pelo backend. Devolve: Passos separados por manhã e noite.
- `DailyRoutinePage()` (exportada; função) - Mostra a rotina diária gerada a partir das recomendações do utilizador. Entradas: sem entradas explícitas. Devolve: Página de rotina diária.
- `generateRoutine()` (interna; função) - Pede ao backend para gerar uma nova rotina diária. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `loadRoutine()` (interna; função) - Carrega a rotina atualmente guardada para o utilizador. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/EditProfilePage.jsx`

- `EditProfilePage()` (exportada; função) - Formulario de edicao de dados e fotografia stub. Entradas: sem entradas explícitas. Devolve: UI de edicao do perfil.
- `updateProfileField(event)` (interna; função) - Atualiza um campo do formulario de perfil. Entradas: `event`: Evento do campo. Devolve: não devolve payload explícito.
- `saveProfile(event)` (interna; função) - Guarda alteracoes textuais do perfil. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.
- `savePhotoStub(event)` (interna; função) - Guarda o URL controlado da fotografia stub. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/FaceAnalysisPage.jsx`

- `FaceAnalysisPage()` (exportada; função) - Aciona a analise e mostra achados com limitacoes. Entradas: sem entradas explícitas. Devolve: UI de analise facial.
- `handleAnalyze()` (interna; função) - Pede ao backend que analise as fotos do utilizador autenticado. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/FacePhotoUploadPage.jsx`

- `FacePhotoUploadPage()` (exportada; função) - Envia consentimento e duas fotografias por FormData. Entradas: sem entradas explícitas. Devolve: Formulario de upload facial com feedback seguro.
- `handleSubmit(event)` (interna; função) - Aceita consentimento e envia fotografias para a API. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/FaceReportPage.jsx`

- `FaceReportPage()` (exportada; função) - Gera e apresenta o relatorio da analise mais recente. Entradas: sem entradas explícitas. Devolve: UI de relatorio facial.
- `handleGenerate()` (interna; função) - Pede geracao de relatorio ao backend. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/GuidedConsultationPage.jsx`

- `buildAnswerState(session)` (top-level; função) - Cria um mapa de respostas a partir do DTO publico da API. Entradas: `session`: Sessao da API. Devolve: Estado inicial por pergunta.
- `GuidedConsultationPage()` (exportada; função) - Renderiza a consulta guiada de RF42. Entradas: sem entradas explícitas. Devolve: Wizard de consulta guiada.
- `updateAnswerValue(questionId, value)` (interna; função) - Atualiza uma resposta no estado local da pagina. Entradas: `questionId`: Identificador da pergunta; `value`: Valor selecionado ou escrito. Devolve: não devolve payload explícito.
- `startSession()` (interna; função) - Inicia a sessao guiada ou recupera rascunho existente. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `loadCurrentSession()` (interna; função) - Carrega a sessao guiada mais recente do cliente. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `saveCurrentAnswer()` (interna; função) - Guarda a resposta atual no backend. Entradas: sem entradas explícitas. Devolve: Verdadeiro quando a resposta foi guardada.
- `goToNextQuestion()` (interna; função) - Guarda a resposta atual e avanca no wizard. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `submitSession()` (interna; função) - Submete a sessao guiada depois de guardar a resposta atual. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `renderQuestionControl(question)` (interna; função) - Renderiza o controlo certo para o tipo de pergunta atual. Entradas: `question`: Pergunta enviada pela API. Devolve: Controlo de resposta.

### `real_dev/web/src/pages/LoginPage.jsx`

- `LoginPage()` (exportada; função) - Formulario de login e acao de logout. Entradas: sem entradas explícitas. Devolve: UI de autenticacao.
- `updateField(event)` (interna; função) - Atualiza campos do formulario de login. Entradas: `event`: Evento do input. Devolve: não devolve payload explícito.
- `handleLogin(event)` (interna; função) - Envia as credenciais para a API. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.
- `handleLogout()` (interna; função) - Termina a sessao atual. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/MakeupSimulationPage.jsx`

- `MakeupSimulationPage({ onSimulationCreated = () => {} })` (exportada; função) - Permite escolher um produto e gerar uma simulação visual segura. Entradas: `props`: Callback chamado quando a simulação é criada. Devolve: Página de simulação de maquilhagem.
- `loadProducts()` (interna; função) - Carrega produtos do catálogo para alimentar o seletor da simulação. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `submitSimulation(event)` (interna; função) - Submete o produto escolhido para criar a simulação de maquilhagem. Entradas: `event`: Evento de submissão do formulário. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/NotificationsPage.jsx`

- `NotificationsPage()` (exportada; função) - Apresenta a inbox de notificacoes do cliente autenticado. Entradas: sem entradas explícitas. Devolve: UI de notificacoes pessoais.
- `loadNotifications()` (interna; função) - Carrega as notificacoes pessoais e ajusta o estado visual da pagina. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `markAsRead(notificationId)` (interna; função) - Marca uma notificacao propria como lida e substitui o item atualizado. Entradas: `notificationId`: Notificacao alvo. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/PreferencesPage.jsx`

- `PreferencesPage()` (exportada; função) - Formulario para guardar marcas favoritas. Entradas: sem entradas explícitas. Devolve: UI de preferencias.
- `savePreferences(event)` (interna; função) - Guarda as preferencias na API. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/ProductDetailsPage.jsx`

- `ProductDetailsPage()` (exportada; função) - Mostra imagem, descricao, ingredientes, preco, stock e resumo de notas. Entradas: sem entradas explícitas. Devolve: Formulario por ID e detalhe do produto.
- `handleSubmit(event)` (interna; função) - Carrega detalhe por ID. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.
- `addToCart()` (interna; função) - Adiciona o produto detalhado ao carrinho. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/ProductRecommendationsPage.jsx`

- `formatPrice(priceCents)` (top-level; função) - Formata preço guardado em cêntimos. Entradas: `priceCents`: Preço em cêntimos. Devolve: Preço legível.
- `renderList(items = [], emptyText)` (top-level; função) - Mostra uma lista pública com fallback honesto quando a API não devolve itens. Entradas: `items`: Lista recebida da API; `emptyText`: Texto visível quando a lista está vazia. Devolve: Lista ou fallback textual.
- `ProductRecommendationsPage({ onRecommendationsChange = () => {} })` (exportada; função) - Mostra recomendações personalizadas e permite enviar feedback do cliente. Entradas: `props`: Callback para sincronizar recomendações com outras páginas. Devolve: Página de recomendações personalizadas.
- `applyRecommendations(nextRecommendations)` (interna; função) - Atualiza lista local e comunica com páginas dependentes. Entradas: `nextRecommendations`: Lista devolvida pela API. Devolve: não devolve payload explícito.
- `generateRecommendations()` (interna; função) - Pede ao backend para gerar novas recomendações personalizadas. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `loadRecommendations()` (interna; função) - Carrega recomendações já existentes para o utilizador autenticado. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `submitFeedback(recommendationId, feedback)` (interna; função) - Regista feedback de utilidade para uma recomendação específica. Entradas: `recommendationId`: ID da recomendação avaliada; `feedback`: Valor de feedback enviado ao backend. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/ProductReviewPage.jsx`

- `ProductReviewPage()` (exportada; função) - Formulario de avaliacao de produto. Entradas: sem entradas explícitas. Devolve: Formulario de rating e comentario.
- `handleSubmit(event)` (interna; função) - Submete review sem enviar userId. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/ProductSearchPage.jsx`

- `formatProductPrice(priceCents)` (top-level; função) - Formata preco guardado em centimos. Entradas: `priceCents`: Preco recebido da API. Devolve: Preco final em euros.
- `formatSkinTypes(skinTypes = [])` (top-level; função) - Cria texto curto com tipos de pele reais do produto. Entradas: `skinTypes`: Tipos de pele vindos da API. Devolve: Texto para badge visual.
- `ProductSearchPage()` (exportada; função) - Permite pesquisar produtos por texto, marca, tipo de pele e preco. Entradas: sem entradas explícitas. Devolve: Formulario e lista de produtos publicos.
- `updateFilter(field, value)` (interna; função) - Atualiza um filtro local. Entradas: `field`: Nome do filtro; `value`: Valor introduzido. Devolve: não devolve payload explícito.
- `buildQueryString()` (interna; função) - Constroi query string apenas com filtros preenchidos. Entradas: sem entradas explícitas. Devolve: Query string segura.
- `handleSubmit(event)` (interna; função) - Submete a pesquisa ao endpoint real. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.
- `addToCart(productId)` (interna; função) - Adiciona produto pesquisado ao carrinho autenticado. Entradas: `productId`: Produto selecionado. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/ProfileSetupPage.jsx`

- `ProfileSetupPage()` (exportada; função) - Formulario para criar o perfil do utilizador autenticado. Entradas: sem entradas explícitas. Devolve: UI de criacao de perfil.
- `updateField(event)` (interna; função) - Atualiza um campo do formulario de perfil. Entradas: `event`: Evento do campo. Devolve: não devolve payload explícito.
- `handleSubmit(event)` (interna; função) - Cria o perfil na API. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/PurchaseHistoryPage.jsx`

- `PurchaseHistoryPage()` (exportada; função) - Lista encomendas pessoais e permite recomprar para o carrinho. Entradas: sem entradas explícitas. Devolve: UI de historico e recompra.
- `loadOrders()` (interna; função) - Carrega historico pessoal. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `reorder(orderId)` (interna; função) - Adiciona produtos de encomenda anterior ao carrinho. Entradas: `orderId`: Encomenda original. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/RegisterPage.jsx`

- `RegisterPage()` (exportada; função) - Formulario de registo com email, password e feedback imediato. Entradas: sem entradas explícitas. Devolve: UI de registo com mensagens seguras e botao ocupado.
- `updateField(event)` (interna; função) - Atualiza um campo do formulario sem alterar os restantes. Entradas: `event`: Evento do input. Devolve: não devolve payload explícito.
- `handleSubmit(event)` (interna; função) - Submete o registo para a API e traduz o resultado para feedback de UI. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/RelatedProductsPage.jsx`

- `RelatedProductsPage()` (exportada; função) - Mostra produtos semelhantes e complementares. Entradas: sem entradas explícitas. Devolve: UI de pesquisa de relacionados por ID.
- `handleSubmit(event)` (interna; função) - Carrega produtos relacionados do endpoint real. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/RoutineAlertsPage.jsx`

- `RoutineAlertsPage()` (exportada; função) - Permite consultar e guardar a preferencia pessoal de alertas de rotina. Entradas: sem entradas explícitas. Devolve: UI de configuracao de alertas.
- `savePreference(event)` (interna; função) - Guarda a preferencia atual de alerta noturno. Entradas: `event`: Submissao do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/SkinComparisonPage.jsx`

- `SkinComparisonPage()` (exportada; função) - Permite comparar duas analises faciais do proprio utilizador. Entradas: sem entradas explícitas. Devolve: Formulario e resultado minimizado da comparacao.
- `handleSubmit(event)` (interna; função) - Submete IDs das analises ao backend. Entradas: `event`: Evento do formulario. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/SkinEvolutionPage.jsx`

- `buildPolyline(points, key)` (top-level; função) - Constrói a sequência de coordenadas SVG para uma métrica da evolução. Entradas: `points`: Pontos temporais devolvidos pela API; `key`: Chave da métrica que será desenhada. Devolve: Coordenadas no formato esperado pelo elemento polyline.
- `SkinEvolutionPage()` (exportada; função) - Mostra um gráfico SVG simples com a evolução cosmética da pele. Entradas: sem entradas explícitas. Devolve: Página de evolução temporal da pele.
- `loadEvolution()` (interna; função) - Carrega os pontos de evolução cosmética do utilizador autenticado. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/SkinHistoryPage.jsx`

- `SkinHistoryPage()` (exportada; função) - Lista analises e relatorios do utilizador autenticado. Entradas: sem entradas explícitas. Devolve: UI de historico temporal.
- `loadHistory()` (interna; função) - Carrega o historico pessoal. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/pages/StockAdminPage.jsx`

- `StockAdminPage()` (exportada; função) - Lista alertas de baixo stock e permite ajuste manual. Entradas: sem entradas explícitas. Devolve: UI admin de stock.
- `loadAlerts()` (interna; função) - Carrega alertas de stock. Entradas: sem entradas explícitas. Devolve: Promise resolvida quando a operação termina.
- `handleStockUpdate(event)` (interna; função) - Submete ajuste manual de stock. Entradas: `event`: Evento submit. Devolve: Promise resolvida quando a operação termina.

### `real_dev/web/src/services/aiInteractionHistoryApi.js`

- `listMyAiInteractionHistory()` (exportada; função) - Lista a timeline IA do cliente autenticado. Entradas: sem entradas explícitas. Devolve: Historico publico do proprio cliente.

### `real_dev/web/src/services/apiClient.js`

- `isLocalHttpUrl(value)` (top-level; função) - Confirma se uma URL HTTP e explicitamente local. Entradas: `value`: URL candidata. Devolve: Verdadeiro quando a URL HTTP aponta para localhost.
- `resolveApiBaseUrl(value, options = {})` (exportada; função) - Resolve a base URL da API e bloqueia HTTP publico em build publicado. Entradas: `value`: Valor de ambiente opcional; `options`: Contexto de build. Devolve: Base URL segura para o cliente.
- `readApiErrorMessage(response)` (top-level; função) - Extrai uma mensagem de erro JSON sem assumir que todos os endpoints devolvem sempre JSON. Entradas: `response`: Resposta fetch. Devolve: Mensagem segura para UI.
- `apiRequest(path, options = {})` (exportada; função) - Faz um pedido JSON para a API Orélle. Entradas: `path`: Caminho da API, por exemplo `/auth/login`; `options`: Opcoes adicionais do `fetch`. Devolve: JSON da resposta ou null para 204.
- `apiDownload(path, options = {})` (exportada; função) - Faz um pedido autenticado para endpoints que devolvem ficheiros. Entradas: `path`: Caminho da API; `options`: Opcoes adicionais do `fetch`. Devolve: Resposta binaria validada.

### `real_dev/web/src/services/assistedConsultationNavigation.js`

- `canUseClientConsultationPanels(user)` (exportada; função) - Confirma se o utilizador pode ver a experiencia de cliente. Entradas: `user`: Utilizador devolvido pelo AuthContext. Devolve: Verdadeiro para cliente autenticado.
- `canUseConsultantReviewPanel(user)` (exportada; função) - Confirma se o utilizador pode ver a area de revisao humana. Entradas: `user`: Utilizador devolvido pelo AuthContext. Devolve: Verdadeiro para consultor ou administrador.
- `getAssistedConsultationPanels(user)` (exportada; função) - Devolve os paineis visiveis para a consulta assistida. Entradas: `user`: Utilizador autenticado. Devolve: Paineis permitidos na UI.

### `real_dev/web/src/services/mockupAlignmentChecklist.js`

- `buildMockupAlignmentChecklist({ hasMockup, reviewedAreas = [] })` (exportada; função) - Cria a matriz de evidence visual do BK-MF8-14. Entradas: `options`: Contexto da comparacao visual. Devolve: Checklist normalizado.
- `assertMockupAlignmentEvidence(evidence)` (exportada; função) - Valida se a equipa recolheu evidence visual minima para o BK. Entradas: `evidence`: Evidence recolhida para PR/defesa. Devolve: Resultado resumido.

### `real_dev/web/src/utils/imageOptimization.js`

- `scaleDimensions(width, height, maxDimension)` (top-level; função) - Redimensiona uma dimensão mantendo proporção. Entradas: `width`: Largura original; `height`: Altura original; `maxDimension`: Maior dimensão permitida. Devolve: Dimensões finais.
- `canvasToBlob(canvas, type, quality)` (top-level; função) - Converte `canvas.toBlob` para Promise. Entradas: `canvas`: Canvas com a imagem redimensionada; `type`: MIME original; `quality`: Qualidade de compressão. Devolve: Blob comprimido ou null.
- `compressImageForUpload(file, options = {})` (exportada; função) - Comprime uma imagem antes do upload quando isso reduz o tamanho. Entradas: `file`: Imagem escolhida pelo utilizador; `options`: Orçamento de compressão. Devolve: Ficheiro original ou versão comprimida.

### `real_dev/web/src/utils/performanceBudget.js`

- `findMainPageDefinition(pageKey)` (exportada; função) - Procura a definicao de uma area principal. Entradas: `pageKey`: Identificador tecnico da area. Devolve: Definicao encontrada.
- `evaluatePageLoad({ pageKey, label, durationMs })` (exportada; função) - Avalia uma medicao face ao orcamento canonico de 3 segundos. Entradas: `input`: Dados tecnicos da medicao. Devolve: Resultado minimizado.

