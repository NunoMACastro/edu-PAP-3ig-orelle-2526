# Implementacao real_dev - MF7

## Execucao atual - BK-MF7-03

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF7`
- `BK_IDS`: `BK-MF7-03`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-06-30

Esta execucao implementou/validou o `BK-MF7-03 - Sessoes autenticadas com cookies HttpOnly` contra `RNF14`, com ligacao direta a `RF02`. A comparacao entre guia, matriz, backlog, BK anterior (`BK-MF7-02`) e BK seguinte (`BK-MF7-04`) confirmou que a implementacao real ja estava completa em `real_dev/api` e `real_dev/web`; por isso nao foram necessarias alteracoes de codigo nesta execucao.

O fluxo real usa o cookie canonico `orelle_session` com `HttpOnly`, `SameSite=Lax`, `path="/"`, `secure` ligado ao gate HTTPS (`env.forceHttps`), token assinado no backend, login sem token no body, `/api/auth/me` protegido por `requireAuth`, logout com limpeza do mesmo cookie e frontend a enviar chamadas autenticadas com `credentials: "include"`.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF7-03` | `RNF14`, `RF02` | `IMPLEMENTADO` | `SESSION_COOKIE_NAME`, `getSessionCookieOptions`, `attachSessionCookie`, `clearSessionCookie`, `verifySessionToken`, `requireAuth`, `/api/auth/me`, `apiRequest`/`apiDownload` com `credentials: "include"` e suite `mf7.session-cookie.test.js` validada. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Cookie canonico HttpOnly | `real_dev/api/src/services/session.service.js` define `SESSION_COOKIE_NAME = "orelle_session"` e cria cookie com `httpOnly: true`, `sameSite: "lax"`, `path: "/"` e `maxAge` de 2h. | `CUMPRE` |
| `secure` alinhado com HTTPS/producao | `getSessionCookieOptions` usa `env.forceHttps`, que fica ativo por `FORCE_HTTPS=true` ou `NODE_ENV=production`. | `CUMPRE` |
| Segredo fraco bloqueado em producao | `real_dev/api/src/config/env.js` rejeita `SESSION_SECRET` ausente, curto ou placeholder quando `NODE_ENV=production`. | `CUMPRE` |
| Token assinado e validado no backend | `createSessionToken` assina `sub`, `email` e `role`; `verifySessionToken` rejeita assinatura alterada, segredo errado ou expiracao. | `CUMPRE` |
| Login cria sessao sem expor token no body | `loginController` chama `attachSessionCookie` e devolve apenas `{ user }`; a suite focada prova `response.body.token === undefined`. | `CUMPRE` |
| Logout limpa o mesmo cookie | `clearSessionCookie` remove `maxAge` mas preserva `httpOnly`, `sameSite`, `secure` e `path`, garantindo que `res.clearCookie` aponta ao cookie correto. | `CUMPRE` |
| `/auth/me` protegido por sessao | `real_dev/api/src/routes/auth.routes.js` monta `GET /me` com `requireAuth`; pedidos sem cookie recebem `401`. | `CUMPRE` |
| Revalidacao de conta quando ha BD/mock | `requireAuth` pode consultar `User.findById`, bloquear conta inexistente/suspensa e atualizar a role real antes de aceitar o pedido. | `CUMPRE` |
| Frontend nao guarda segredo | `real_dev/web/src/context/AuthContext.jsx` guarda apenas o utilizador seguro devolvido por `/api/auth/me` e nunca token. | `CUMPRE` |
| Cliente API envia cookies em todas as chamadas | `apiRequest` e `apiDownload` forcam `credentials: "include"` mesmo que o caller passe opcoes proprias. | `CUMPRE` |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF7`: preservada. O atributo `secure` depende de `env.forceHttps`, mantendo coerencia com o gate HTTPS/TLS do `BK-MF6-05`, e a autenticacao nao enfraquece bcrypt do `BK-MF6-06`.
- `BK-MF7-02 -> BK-MF7-03`: preservada. Os pedidos biometricos criados/revistos no BK anterior estao protegidos por `requireAuth`, roles e cookie HttpOnly em todas as rotas sensiveis.
- `BK-MF7-03 -> BK-MF7-04`: preservada. O frontend usa `fetch` standard com `credentials: "include"` e evita storage/token exposto, deixando a compatibilidade browser focada em APIs Web modernas.
- `MF7 -> MF8`: preservada. A sessao HttpOnly fica como fronteira reutilizavel para exportacoes, IA, revisoes administrativas e fluxos futuros sem inventar OAuth, refresh tokens ou sessao persistida.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 0 | Sem findings confirmados. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 0 | Sem findings confirmados. |

### Validacoes executadas nesta execucao

| Comando | Resultado |
| --- | --- |
| `git status --short` | Worktree ja tinha muitas alteracoes documentais pre-existentes; preservadas e nao revertidas. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | Passou; `real_dev/` confirmado como ignorado por `.gitignore:2`. |
| `rg -n "RNF14\|RF02\|BK-MF7-03\|cookie HttpOnly\|cookies HttpOnly" ...` | Confirmou `RNF14`, `RF02`, matriz, backlog e anexos associados ao BK. |
| Leitura do guia `BK-MF7-03` e BKs vizinhos `BK-MF7-02`/`BK-MF7-04` | Confirmou escopo, pre-requisitos, exclusoes e handoff MF7. |
| Leitura focada de `env.js`, `session.service.js`, `auth.controller.js`, `auth.middleware.js`, `auth.routes.js`, `apiClient.js`, `AuthContext.jsx` e testes | Confirmou cookie HttpOnly, segredo de producao, login/logout, `/auth/me`, `requireAuth`, revalidacao de conta e cliente com credenciais. |
| `npm --prefix real_dev/api test -- mf7.session-cookie.test.js` | Falhou dentro do sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 1 ficheiro e 5 testes passed. |
| `npm --prefix real_dev/api test` | Passou fora do sandbox: 26 ficheiros e 204 testes passed. |
| `npm --prefix real_dev/web run build` | Passou; Vite gerou `dist` com 79 modulos transformados. |
| `npm --prefix real_dev/web run smoke:mf7-compat` | Passou; `MF7 browser compatibility static check OK (50 ficheiros)`. |
| Pesquisa estatica focada sobre `localStorage`, `sessionStorage`, `Authorization`, `Bearer`, `token`, `credentials`, cookie e `/auth/me` | Sem finding novo no escopo `BK-MF7-03`; hits correspondem a comentarios de seguranca, uso backend do token assinado, testes de cookie e `credentials: "include"`. |
| `git diff --check` | Passou sem output. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs/74 guias consistentes. |

### Validacoes nao executadas

- QA manual em browser real para cookies em Chrome/Safari/Edge/Firefox: nao executada porque pertence ao `BK-MF7-04`; nesta execucao foi corrido apenas o smoke estatico de compatibilidade.
- Alteracao de guias/documentos canonicos: nao executada porque `PERMITIR_ALTERAR_DOCS=nao`.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.

### Alteracoes desta execucao

- Codigo: sem alteracoes; a implementacao ja cumpria o contrato do BK.
- Relatorio tecnico: atualizado este ficheiro permitido por `OUTPUT_MODE=relatorio_e_resumo`.
- Alteracoes pre-existentes no worktree: preservadas.

### Decisao

`BK-MF7-03` fica `IMPLEMENTADO` em `real_dev`. A app usa sessao autenticada por cookie HttpOnly, nao expoe token ao frontend, protege `/auth/me` e rotas sensiveis por `requireAuth`, limpa o cookie no logout e mantem o cliente React a enviar pedidos autenticados com `credentials: "include"`.

## Historico preservado - BK-MF7-02

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF7`
- `BK_IDS`: `BK-MF7-02`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-06-30

Esta execucao implementou/validou o `BK-MF7-02 - Direito a eliminar conta e dados incluindo fotos` contra `RNF13`, com ligacao a `RF41` e `RF44`. A comparacao entre guia, matriz, backlog, BK anterior (`BK-MF7-01`) e BK seguinte (`BK-MF7-03`) confirmou que a implementacao real ja estava completa em `real_dev/api` e `real_dev/web`; por isso nao foram necessarias alteracoes de codigo.

O fluxo real permite ao cliente criar pedidos biometricos autenticados para `delete` ou `anonymize` sobre `photos` e/ou `reports`; limita a decisao a `consultor`/`administrador`; aplica eliminacao logica/anonymizacao aos recursos do proprio `requesterId`; regista auditoria `RF44`; e devolve apenas metadados, sem `storageKey`, paths internos, fotografias, relatorios completos, cookies ou tokens.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF7-02` | `RNF13`, `RF41`, `RF44` | `IMPLEMENTADO` | `BiometricDataRequest`, rotas `/api/me/biometric-data-requests` e `/api/admin/biometric-data-requests`, service de decisao com `delete`/`anonymize`, auditoria `BiometricAccessLog`, paginas cliente/admin e suite `mf7.biometric-data-requests.test.js` validada. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Pedido guarda apenas metadados minimos | `real_dev/api/src/models/biometric-data-request.model.js` guarda `requesterId`, `action`, `resources`, `reason`, estado, revisor e timestamps; nao guarda fotografias, relatorios completos, cookies, tokens ou paths internos. | `CUMPRE` |
| Acoes e recursos fechados | `real_dev/api/src/validators/biometric-data-request.validator.js` aceita apenas `delete`/`anonymize` e `photos`/`reports`, rejeitando recursos fora do escopo como `payments`. | `CUMPRE` |
| Ownership decidido por sessao | `createMyBiometricDataRequest` usa `requesterId: userId` vindo de `req.user.id`; o teste focado prova que um `requesterId` enviado pelo frontend e ignorado. | `CUMPRE` |
| Cliente cria pedido autenticado | `POST /api/me/biometric-data-requests` usa `requireAuth` e `requireRole(ROLES.CLIENTE)`. | `CUMPRE` |
| Revisao restrita a consultor/admin | `GET /api/admin/biometric-data-requests` e `PATCH /api/admin/biometric-data-requests/:requestId/decision` usam `requireAuth` e `requireRole(ROLES.CONSULTOR, ROLES.ADMIN)`. | `CUMPRE` |
| Eliminacao logica de fotografias e relatorios | `applyDeleteAction` marca `FacePhoto.status = "deleted"` e `FaceReport.privacyStatus = "deleted"` apenas para recursos do `requesterId`. | `CUMPRE` |
| Anonymizacao logica de fotografias e relatorios | `applyAnonymizeAction` marca fotografias como `anonymized` e substitui conteudo de relatorios por resumo/sources/limitations minimizados. | `CUMPRE` |
| Auditoria administrativa | `listBiometricDataRequestsForReview` e `decideBiometricDataRequest` registam eventos `RF44` via `recordBiometricAccess`. | `CUMPRE` |
| Respostas publicas minimizadas | `toBiometricDataRequestResponse` expoe apenas ids, estado, action/resources/reason e timestamps; os testes provam ausencia de `storageKey`. | `CUMPRE` |
| UI cliente e admin | `BiometricDataRequestPage.jsx` envia apenas action/resources/reason; `BiometricDataRequestsAdminPage.jsx` lista metadados e permite aprovar/rejeitar por role administrativa. | `CUMPRE` |
| Sessao/cookie usados no frontend | `apiClient.js` mantem `credentials: "include"`, evitando tokens expostos na UI. | `CUMPRE` |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF7`: preservada. O BK usa `FacePhoto.status` e `FaceReport.privacyStatus` sobre dados ja protegidos por `BK-MF6-07`; nao substitui encriptacao, nao le `storageKey` para respostas publicas e nao faz eliminacao fisica fora do contrato de retencao/backups.
- `BK-MF7-01 -> BK-MF7-02`: preservada. O fluxo de eliminacao/anonymizacao reutiliza ownership por sessao e fronteiras de dados biometricos sem criar novo consentimento RGPD nem permissao implicita para tratamento adicional.
- `BK-MF7-02 -> BK-MF7-03`: preservada. Todas as rotas dependem de `requireAuth`, roles e cookie de sessao, alinhando com a consolidacao de sessoes HttpOnly do BK seguinte.
- `MF7 -> MF8`: preservada. Estados `deleted`/`anonymized` ficam disponiveis para filtros downstream de exportacao/IA, sem treino externo, RAG, embeddings ou envio para providers externos neste BK.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 0 | Sem findings confirmados. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 0 | Sem findings confirmados. |

### Validacoes executadas nesta execucao

| Comando | Resultado |
| --- | --- |
| `git status --short` | Worktree ja tinha muitas alteracoes documentais pre-existentes; preservadas e nao revertidas. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | Passou; `real_dev/` confirmado como ignorado por `.gitignore:2`. |
| Leitura do guia `BK-MF7-02` e BKs vizinhos `BK-MF7-01`/`BK-MF7-03` | Confirmou escopo, dependencias, exclusoes e handoff MF7. |
| Leitura de `docs/RF.md`, `docs/RNF.md`, matriz, backlog e anexos | Confirmou `RNF13`, `RF41`, `RF44` e mapeamento canonico do BK. |
| Leitura focada de models, validators, controllers, routes, services, UI e testes do fluxo biometrico | Confirmou que a implementacao real cobre criacao, listagem, decisao, delete/anonymize, auditoria, UI e negativos. |
| `npm --prefix real_dev/api test -- mf7.biometric-data-requests.test.js` | Falhou dentro do sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 1 ficheiro e 7 testes passed. |
| `npm --prefix real_dev/api test` | Passou fora do sandbox: 26 ficheiros e 204 testes passed. |
| `npm --prefix real_dev/web run smoke:mf5-privacy-request` | Passou; `BK-MF5-01 client privacy-request smoke: PASS`. |
| `npm --prefix real_dev/web run build` | Passou; Vite gerou `dist` com 79 modulos transformados. |
| Pesquisa estatica focada sobre `storageKey`, `token`, cookies, storage browser, pagamentos e treino externo nos ficheiros do BK | Sem finding novo no escopo `BK-MF7-02`; hits correspondem a metadados permitidos, testes de ausencia de `storageKey`, cookies de teste e rejeicao de recurso `payments`. |
| `git diff --check` | Passou sem output. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs/74 guias consistentes. |

### Validacoes nao executadas

- QA manual em browser real: nao executada porque o escopo desta prompt fecha `BK-MF7-02` por implementacao real e testes automatizados; compatibilidade multi-browser pertence a `BK-MF7-04`.
- Alteracao de guias/documentos canonicos: nao executada porque `PERMITIR_ALTERAR_DOCS=nao`.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.

### Alteracoes desta execucao

- Codigo: sem alteracoes; a implementacao ja cumpria o contrato do BK.
- Relatorio tecnico: atualizado este ficheiro permitido por `OUTPUT_MODE=relatorio_e_resumo`.
- Alteracoes pre-existentes no worktree: preservadas.

### Decisao

`BK-MF7-02` fica `IMPLEMENTADO` em `real_dev`. O direito a eliminacao/anonymizacao biometrica esta coberto por fluxo autenticado, roles administrativas, ownership no backend, estados logicos de privacidade, auditoria `RF44`, respostas minimizadas e testes automatizados focados.

## Historico preservado - BK-MF7-01

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF7`
- `BK_IDS`: `BK-MF7-01`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-06-30

Esta execucao implementou/validou o `BK-MF7-01 - Consentimento explicito para analise facial (RGPD)` contra `RNF12`. A comparacao entre guia, matriz, backlog, MF anterior (`BK-MF6-07`) e BK seguinte (`BK-MF7-02`) confirmou que a implementacao real ja estava completa em `real_dev/api` e `real_dev/web`; por isso nao foram necessarias alteracoes de codigo.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF7-01` | `RNF12` | `IMPLEMENTADO` | `FaceConsent`, finalidade `analise_facial_cosmetica`, `POST /api/face-consent`, bloqueio de upload/analise/simulacao/antes-depois sem consentimento ativo, UI a chamar consentimento antes do `FormData` e suite `mf7.consent.test.js` validada. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Consentimento guarda apenas metadados minimos | `real_dev/api/src/models/face-consent.model.js` guarda `userId`, `acceptedAt`, `version`, `purpose`, `revokedAt` e timestamps; nao guarda fotografias, relatorios, cookies, tokens ou paths internos. | `CUMPRE` |
| Finalidade canonica e especifica | `real_dev/api/src/constants/face-consent.js` define `FACE_ANALYSIS_CONSENT_PURPOSE = "analise_facial_cosmetica"` e o model restringe `purpose` a esse enum. | `CUMPRE` |
| Aceitacao explicita no backend | `real_dev/api/src/validators/face-photo.validator.js` aceita apenas `accepted === true`; strings, omissao ou `false` falham com `400`. | `CUMPRE` |
| Ownership decidido por sessao | `acceptFaceConsentController` e `saveFacePhotos` usam `req.user.id`; o frontend nao envia nem escolhe `userId`. | `CUMPRE` |
| Endpoint autenticado | `real_dev/api/src/routes/face-photo.routes.js` monta `POST /api/face-consent` com `requireAuth`. | `CUMPRE` |
| Upload antes de escrita em disco exige consentimento ativo | `POST /api/face-photos` executa `requireAuth`, `ensureActiveFaceConsent` e so depois `uploadFacePhotos`. | `CUMPRE` |
| Analise e fluxos derivados respeitam consentimento | `face-analysis.service.js`, `makeup-simulation.routes.js` e `before-after-visualization.service.js` verificam consentimento ativo antes de tratar dados faciais. | `CUMPRE` |
| Frontend envia consentimento antes das fotografias | `real_dev/web/src/pages/FacePhotoUploadPage.jsx` chama `/face-consent` e so depois envia `FormData` para `/face-photos`. | `CUMPRE` |

### Coerencia entre MFs

- `MF6 -> MF7`: preservada. O BK consome fotografias/relatorios protegidos em repouso por `BK-MF6-07` e nao enfraquece encriptacao, minimizacao ou `privacyStatus`.
- `BK-MF7-01 -> BK-MF7-02`: preservada. `BK-MF7-02` consegue reutilizar `FaceConsent`, ownership por sessao, `FacePhoto` e contratos de dados biometricos para eliminacao/anonymizacao.
- `MF7 -> MF8`: preservada com handoff explicito. `BK-MF8-07` continua a precisar de consentimento proprio para treino externo; `BK-MF7-01` nao cria permissao implicita para treino, marketing, RAG, embeddings ou providers externos.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 0 | Sem findings confirmados. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 0 | Sem findings confirmados. |

### Validacoes executadas nesta execucao

| Comando | Resultado |
| --- | --- |
| `git status --short` | Worktree ja tinha muitas alteracoes documentais pre-existentes; preservadas e nao revertidas. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | Passou; `real_dev/` confirmado como ignorado por `.gitignore:2`. |
| `rg -n "BK-MF7-01\|RNF12\|consentimento\|analise_facial_cosmetica" ...` | Confirmou contrato canonico, matriz/backlog, guia alvo, codigo real, UI e testes. |
| `npm --prefix real_dev/api test -- mf7.consent.test.js` | Falhou dentro do sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 1 ficheiro e 7 testes passed. |
| `npm --prefix real_dev/api test` | Passou fora do sandbox: 26 ficheiros e 204 testes passed. |
| `npm --prefix real_dev/web run build` | Passou; Vite gerou `dist` com 79 modulos transformados. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/web/src` e `real_dev/web/scripts` | Sem finding novo no escopo `BK-MF7-01`; hits residuais correspondem a testes/configuracao de segredos, gateways Stripe/PayPal/MBWay, comentarios anti-`localStorage`/`sessionStorage` e disclaimers/proibicoes de treino externo. |
| `git diff --check` | Passou sem output. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs/74 guias consistentes. |

### Validacoes nao executadas

- QA manual em browser real para fluxos UI de upload: nao executada porque o escopo desta prompt fecha implementacao real e validacao automatizada; o contrato especifico de compatibilidade multi-browser pertence a `BK-MF7-04`.
- Alteracao de guias/documentos canonicos: nao executada porque `PERMITIR_ALTERAR_DOCS=nao`.

### Alteracoes desta execucao

- Codigo: sem alteracoes; a implementacao ja cumpria o contrato do BK.
- Relatorio tecnico: atualizado este ficheiro permitido por `OUTPUT_MODE=relatorio_e_resumo`.
- Commits/push/PR: nao executados, conforme `PERMITIR_COMMITS=nao`.

### Decisao

`BK-MF7-01` fica `IMPLEMENTADO` em `real_dev`. A app exige consentimento facial explicito e autenticado, guarda prova minima por finalidade, bloqueia tratamento facial sensivel sem consentimento ativo, preserva ownership no backend e mantem respostas publicas minimizadas.

## Historico preservado - MF7 completa

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF7`
- `BK_IDS`: `[]`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `PARCIAL`
- `data`: 2026-06-30

Esta execucao tratou `BK_IDS: []` como MF7 completa e auditou/cross-validou a implementacao real em `real_dev/api` e `real_dev/web` contra os sete BKs da MF: `BK-MF7-01`, `BK-MF7-02`, `BK-MF7-03`, `BK-MF7-04`, `BK-MF7-05`, `BK-MF7-06` e `BK-MF7-07`.

Nao foram aplicadas alteracoes de codigo nesta execucao. A leitura tecnica e as validacoes indicam que a implementacao funcional automatizavel da MF7 ja esta presente em `real_dev`: consentimento facial RGPD, pedidos de eliminacao/anonymizacao biometrica, sessoes HttpOnly, smoke de compatibilidade, exportacao PDF, checkout Stripe/PayPal/MBWay e adapter de IA externa. O estado global permanece `PARCIAL` apenas por uma lacuna de evidence manual do `BK-MF7-04`: a checklist real Chrome/Safari/Edge/Firefox ainda nao existe em `docs/evidence/MF7` e a prompt atual nao permite criar/editar esse artefacto documental.

### Estado consolidado por BK

| BK | Requisito | Estado atual | Observacao |
| --- | --- | --- | --- |
| `BK-MF7-01` | `RNF12` | `IMPLEMENTADO` | `FaceConsent`, finalidade facial cosmetica, bloqueios backend e `mf7.consent.test.js` presentes e validados. |
| `BK-MF7-02` | `RNF13`, `RF41`, `RF44` | `IMPLEMENTADO` | Fluxo de pedidos biometricos, revisao, decisao, estados de privacidade e auditoria presentes e validados. |
| `BK-MF7-03` | `RNF14`, `RF02` | `IMPLEMENTADO` | Sessao por cookie `orelle_session` HttpOnly, `SameSite=Lax`, `requireAuth`, logout e cliente com `credentials: "include"`. |
| `BK-MF7-04` | `RNF15` | `PARCIAL` | Build e smoke estatico passam; falta QA manual real em Chrome, Safari, Edge e Firefox com evidence documental. |
| `BK-MF7-05` | `RNF16`, `RF35` | `IMPLEMENTADO` | `admin-export` gera PDF minimizado, protegido por sessao/role admin, com filtro `privacyStatus: "active"`. |
| `BK-MF7-06` | `RNF17`, `RF27` | `IMPLEMENTADO` | Checkout autenticado com `checkoutKey`, Stripe com `Idempotency-Key`, PayPal/MBWay em stub funcional e falhas persistidas como `failed`. |
| `BK-MF7-07` | `RNF18`, `RF14` | `IMPLEMENTADO` | Provider externo isolado, HTTPS obrigatorio fora de localhost, payload minimizado, timeout e fallback local explicito. |

### Validacoes executadas nesta execucao

| Comando | Resultado |
| --- | --- |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | Passou; `real_dev/` confirmado como ignorado por `.gitignore:2`. |
| `npm --prefix real_dev/api test` | Falhou dentro do sandbox por `listen EPERM: operation not permitted 0.0.0.0`; repetido fora do sandbox com sucesso: 26 test files e 204 tests passed. |
| `npm --prefix real_dev/web run build` | Passou; Vite gerou `dist` com 79 modulos transformados. |
| `npm --prefix real_dev/web run smoke:mf7-compat` | Passou; `MF7 browser compatibility static check OK (50 ficheiros)`. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs consistentes. |
| Pesquisa negativa em `real_dev/api` e `real_dev/web` | Sem findings novos; hits residuais correspondem a config/testes de segredo, gateways Stripe/PayPal/MBWay, comentarios anti-localStorage/sessionStorage e disclaimers de treino externo. |
| `rg --files docs/evidence` | Falhou com `No such file or directory`; confirma ausencia de evidence manual em `docs/evidence`. |
| `find mockup -maxdepth 3 -type f` | Falhou com `No such file or directory`; nao existe mockup local para comparacao visual. |

### Findings e correcoes

- `ORELLE-MF7-BK04-P1-001`: `BK-MF7-04` continua `PARCIAL` por falta de QA manual real Chrome/Safari/Edge/Firefox e artefacto `docs/evidence/MF7/BK-MF7-04-browser-compatibility.md`. Nao corrigido nesta execucao porque exige browsers/evidence manual e `PERMITIR_ALTERAR_DOCS=nao`.
- Nao foram encontrados findings P0, P2 ou P3 novos dentro de `real_dev` nesta execucao.
- Nao foram feitas correcoes de codigo porque as suites automatizadas e a leitura dos contratos MF7 nao revelaram defeitos implementaveis dentro do escopo permitido.

### Alteracoes desta execucao

- Atualizado apenas este relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`.
- Preservadas as alteracoes pre-existentes no worktree, incluindo guias/documentos canónicos ja modificados antes desta execucao.
- Sem commits, push ou PR.

## Resultado geral

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF7`
- `BK_IDS`: `BK-MF7-03`, `BK-MF7-04`, `BK-MF7-05`, `BK-MF7-06`, `BK-MF7-07`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `resultado`: `PARCIAL`
- `data`: 2026-06-30

Esta execucao consolidou o estado acumulado da `MF7` em `real_dev`, mantendo o `BK-MF7-03 - Sessoes autenticadas com cookies HttpOnly`, acrescentando a implementacao tecnica do `BK-MF7-04 - Compativel com Chrome, Safari, Edge e Firefox`, fechando a prova automatica do `BK-MF7-05 - Exportacao de relatorios em PDF`, implementando o `BK-MF7-06 - Integracao de pagamentos MVP com Stripe real e PayPal/MBWay em stub funcional` e implementando o `BK-MF7-07 - Suporte para API de IA externa`.

A base tecnica de sessao ja existia e estava maioritariamente alinhada: `SESSION_COOKIE_NAME`, cookie HttpOnly, `SameSite=Lax`, bloqueio de `SESSION_SECRET` fraco em producao, `requireAuth`, `/api/auth/me`, login sem token no body, logout e `credentials: "include"`. A execucao fechou o BK com uma suite propria `mf7.session-cookie.test.js` e reforcou o cliente HTTP para que chamadas autenticadas nao consigam remover acidentalmente `credentials: "include"` atraves das opcoes passadas ao `fetch`.

A execucao atual do `BK-MF7-04` adicionou um smoke local sem dependencias novas para detetar branches por nome de browser em `real_dev/web/src`, ligou o comando `smoke:mf7-compat`, validou build Vite e confirmou que upload, downloads, checkout e sessao continuam assentes em APIs Web standard (`FormData`, `Blob`, `URL.createObjectURL`, links normais e `fetch` com cookie HttpOnly).

O `BK-MF7-05` reutiliza o modulo `admin-export` existente, sem endpoint paralelo e sem dependencia nova de PDF. A implementacao em `real_dev` ja continha o filtro `FaceReport.find({ privacyStatus: "active" })`, headers de download, `nosniff`, `X-Orelle-Export-Rows`, role admin e frontend por `apiDownload`/`Blob`; esta execucao acrescentou a suite focada `mf7.admin-export-pdf.test.js` para provar PDF, validator, service, headers, autorizacao e negativos `401`/`403`/`400`.

O `BK-MF7-06` reforcou o checkout existente de `MF3` sem criar endpoint paralelo. A encomenda agora guarda `checkoutKey` unica por utilizador, o service reaproveita encomendas da mesma tentativa, Stripe recebe a mesma chave em `Idempotency-Key`, PayPal/MBWay continuam como stubs pendentes e falhas Stripe apos criacao de encomenda persistem `payment.status: "failed"` sem limpar o carrinho nem fingir pagamento recebido.

O `BK-MF7-07` adicionou uma fronteira isolada para provider externo de IA facial. A configuracao passa por `AI_PROVIDER_MODE`, `AI_PROVIDER_URL` e `AI_PROVIDER_KEY`; o adapter remoto usa `fetch` nativo com timeout, recusa HTTP externo antes de enviar imagem/API key, envia apenas `contentBase64` temporario sem `storageKey`, normaliza resposta para `providerName`, `findings`, `sources` e `limitations`, e mantem fallback local explicito quando o provider remoto falha. O service preserva sessao, consentimento, ownership e storage cifrado antes de preparar bytes em memoria para a analise.

O `BK-MF7-07` fica `IMPLEMENTADO`. O estado acumulado da `MF7` permanece `PARCIAL` apenas por falta de QA manual real nos quatro browsers alvo do `BK-MF7-04`. A implementacao tecnica automatizada passou; a checklist manual Chrome/Safari/Edge/Firefox deve ser preenchida em ambiente com esses browsers antes de defesa ou encerramento total de `RNF15`.

## Escopo

### Incluido

- `BK-MF7-03 - Sessoes autenticadas com cookies HttpOnly`.
- `BK-MF7-04 - Compativel com Chrome, Safari, Edge e Firefox`.
- `BK-MF7-05 - Exportacao de relatorios em PDF`.
- `BK-MF7-06 - Integracao de pagamentos MVP com Stripe real e PayPal/MBWay em stub funcional`.
- `BK-MF7-07 - Suporte para API de IA externa`.
- `RNF14 - Sessoes autenticadas com cookies HttpOnly`.
- `RNF15 - Compatibilidade com Chrome, Safari, Edge e Firefox`.
- `RNF16 - Exportacao de relatorios em PDF`.
- `RNF17 - MVP com Stripe real e fluxos stub funcional para PayPal/MBWay`.
- `RNF18 - Suporte para API de IA externa`.
- Ligacao a `RF02 - Login e logout com sessao segura`.
- Ligacao a `RF27 - Registar encomendas e pagamentos com Stripe real no MVP e PayPal/MBWay em stub funcional`.
- Ligacao a `RF35 - Exportacao de dados para Excel/PDF`.
- Ligacao a `RF14 - Analise facial de tipo de pele, acne, manchas, rugas e oleosidade`.
- Confirmacao de cookie HttpOnly, `SameSite=Lax`, nome canonico `orelle_session` e limpeza coerente no logout.
- Confirmacao de bloqueio de segredo fraco em producao.
- Confirmacao de `/api/auth/me` protegido por `requireAuth`.
- Reforco de `apiRequest` e `apiDownload` para preservar `credentials: "include"`.
- Testes focados para `/auth/me` sem cookie, login com cookie HttpOnly, body sem token, cookie assinado, cookie invalido e logout.
- Verificacao estatica sem dependencias novas contra `navigator.userAgent`, `navigator.vendor`, `document.all` e `document.documentMode`.
- Confirmacao de build Vite em producao.
- Revisao dos fluxos criticos: upload facial, exportacao administrativa, checkout e cliente API.
- Confirmacao de PDF textual minimo sem dependencia nova.
- Confirmacao de `GET /api/admin/exports/:dataset?format=pdf` protegido por sessao HttpOnly e role admin.
- Confirmacao de filtro `privacyStatus: "active"` para relatorios IA.
- Confirmacao de headers `Content-Type`, `Content-Disposition`, `X-Content-Type-Options` e `X-Orelle-Export-Rows`.
- Testes focados para builder PDF, validator, service, headers, autorizacao e negativos.
- Confirmacao de `POST /api/orders/checkout` protegido por `requireAuth` e ownership por `req.user.id`.
- Confirmacao de `checkoutKey` server-side, indice unico `{ userId, checkoutKey }` e reaproveitamento de encomenda em retry.
- Confirmacao de `Idempotency-Key` enviada a Stripe com a `checkoutKey`.
- Confirmacao de PayPal/MBWay como stubs funcionais com `pending_manual_confirmation`, sem `paid` falso.
- Confirmacao de falha Stripe persistida como `payment.status: "failed"` quando a API externa falha depois da encomenda existir.
- Confirmacao de configuracao de IA externa por ambiente, sem chaves hardcoded.
- Confirmacao de provider externo isolado em `providers/external-skin-analysis.provider.js`.
- Confirmacao de URL HTTPS obrigatorio para provider externo publicado, com excecao controlada para localhost/127.0.0.1 em desenvolvimento.
- Confirmacao de payload externo minimizado com `contentBase64`, sem `storageKey`, paths internos, token ou API key no body.
- Confirmacao de fallback local explicito quando o provider externo falha por rede, timeout ou indisponibilidade.
- Confirmacao de resposta publica normalizada com `providerName`, `findings`, `sources` e `limitations`.

### Excluido

- OAuth, refresh tokens, login social ou sessao persistida em base de dados.
- Mudancas ao hashing de passwords, ja tratado no `BK-MF6-06`.
- Mudancas a roles/permissoes de negocio, fora do foco deste BK.
- Alteracoes a consentimento RGPD ou eliminacao/anonymizacao; o provider externo de IA ficou limitado ao contrato `BK-MF7-07`.
- Edicao de BKs, documentos canonicos, matriz, backlog, RF/RNF ou prompts.
- Evidence documental separada em `docs/evidence/MF7`, porque `PERMITIR_ALTERAR_DOCS=nao`; a evidence desta execucao fica neste relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`.
- Playwright, Cypress, Selenium ou instalacao de browsers.
- QA manual real nos quatro browsers alvo, por indisponibilidade/nao execucao neste contexto.
- PDF visual avancado, bibliotecas externas de PDF ou desenho de relatorio fora do MVP PAP.
- Novo modulo, novo endpoint paralelo ou nova pagina de exportacoes.
- Webhooks, callbacks externos, reconciliacao bancaria, reembolsos, cupoes, faturas ou multi-gateway completo.
- Confirmacao real de pagamento recebido. Stripe fica em `requires_payment`; PayPal/MBWay ficam em `pending_manual_confirmation`.
- Exportacao de fotografias faciais, paths internos, cookies, tokens, `passwordHash` ou relatorios IA nao ativos.
- Escolha de fornecedor pago definitivo de IA, contrato comercial Azure/TensorFlow, webhooks de IA, treino externo de imagens ou envio de fotografias para aprendizagem de terceiros.
- Screenshot/gravação manual do download no browser; a evidence desta execucao e automatica/API/build.
- Commits, push ou PR.

## Fontes consultadas

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
- `docs/planificacao/guias-bk/MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-01-consentimento-explicito-para-analise-facial-rgpd.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-02-direito-a-eliminar-conta-e-dados-incluindo-fotos.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-03-sessoes-autenticadas-com-cookies-httponly.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-04-compativel-com-chrome-safari-edge-e-firefox.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-05-exportacao-de-relatorios-em-pdf.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-06-integracao-com-gateways-de-pagamento-stripe-paypal-mbway.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-07-suporte-para-api-de-ia-externa-ex-azure-face-api-ou-tensorflow.md`
- `docs/planificacao/guias-bk/MF3/BK-MF3-02-adicionar-remover-produtos-do-carrinho-de-compras.md`
- `docs/planificacao/guias-bk/MF3/BK-MF3-03-registar-encomendas-e-pagamentos-gateway-stripe-paypal-mbway.md`
- `docs/planificacao/guias-bk/MF3/BK-MF3-04-historico-de-compras-com-data-total-produtos-e-estado-pendente-enviado-entregue.md`
- `docs/planificacao/guias-bk/MF4/BK-MF4-03-exportacao-de-dados-para-excel-pdf-vendas-relatorios-de-ia-utilizadores.md`
- `docs/planificacao/guias-bk/MF4/BK-MF4-08-guardar-alergias-ingredientes-a-evitar-e-restricoes-medicas-leves-no-perfil-e-impedir-recomendacoes-que-violem-regras.md`
- `docs/planificacao/guias-bk/MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md`
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF7.md`
- `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF7.md`
- `real_dev/api`
- `real_dev/web`

## Estado por BK

| BK | RF/RNF | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF7-01` | `RNF12` | `IMPLEMENTADO` | Estado acumulado anterior: `FaceConsent`, finalidade `analise_facial_cosmetica`, bloqueios backend e `mf7.consent.test.js`. |
| `BK-MF7-02` | `RNF13`, `RF41`, `RF44` | `IMPLEMENTADO` | Estado acumulado anterior: pedido/revisao/decisao/auditoria, estados de privacidade e `mf7.biometric-data-requests.test.js`. |
| `BK-MF7-03` | `RNF14`, relacionado com `RF02` | `IMPLEMENTADO` | `session.service.js`, `env.js`, `auth.middleware.js`, `auth.controller.js`, `auth.routes.js`, `apiClient.js`, `AuthContext.jsx` e `mf7.session-cookie.test.js`. |
| `BK-MF7-04` | `RNF15` | `PARCIAL` | `check-mf7-browser-compatibility.mjs`, `smoke:mf7-compat` e build Vite passaram; checklist manual real Chrome/Safari/Edge/Firefox pendente. |
| `BK-MF7-05` | `RNF16`, relacionado com `RF35` | `IMPLEMENTADO` | `admin-export` gera PDF minimizado, aplica role admin e `privacyStatus: "active"` em `ai-reports`; `mf7.admin-export-pdf.test.js` passou com 7 testes e a suite API atual passou com 26 ficheiros / 204 testes. |
| `BK-MF7-06` | `RNF17`, relacionado com `RF27` | `IMPLEMENTADO` | `Order.checkoutKey`, indice unico, provider Stripe com `Idempotency-Key`, PayPal/MBWay em stub pendente, falha Stripe persistida como `failed` e `mf3.integration.test.js` passou com 21 testes; suite API completa passou com 26 ficheiros / 204 testes. |
| `BK-MF7-07` | `RNF18`, relacionado com `RF14` | `IMPLEMENTADO` | `external-skin-analysis.provider.js`, configuracao `AI_PROVIDER_*`, `face-analysis.service.js` com leitura cifrada e `mf7.external-ai-provider.test.js` passou com 8 testes; suite API completa passou com 26 ficheiros / 204 testes. |

## Rastreabilidade BK-MF7-03

| Requisito | Ficheiros principais | Testes/validacoes |
| --- | --- | --- |
| Cookie canonico HttpOnly | `real_dev/api/src/services/session.service.js` | `mf7.session-cookie.test.js` valida `Set-Cookie`, `HttpOnly`, `SameSite=Lax` e nome `orelle_session`. |
| Login sem token exposto | `real_dev/api/src/controllers/auth.controller.js`, `real_dev/api/src/services/session.service.js` | `mf7.session-cookie.test.js` confirma body com `user` e `token` ausente. |
| `/auth/me` protegido | `real_dev/api/src/routes/auth.routes.js`, `real_dev/api/src/middlewares/auth.middleware.js` | Negativo `/api/auth/me` sem cookie devolve `401`. |
| Cookie assinado aceite | `real_dev/api/src/services/session.service.js`, `real_dev/api/src/middlewares/auth.middleware.js` | Teste com `createSessionToken` devolve `200` e utilizador seguro. |
| Cookie invalido rejeitado | `verifySessionToken` em `session.service.js` | Teste com token alterado devolve `401` e mensagem controlada. |
| Logout limpa a sessao | `clearSessionCookie` e `logoutController` | Teste com agente Supertest confirma `204`, cookie limpo e novo `/auth/me` a `401`. |
| Segredo forte em producao | `real_dev/api/src/config/env.js` | Suite API completa cobre `isUnsafeProductionSessionSecret`; pesquisa confirma bloqueio de placeholders. |
| Frontend envia cookies | `real_dev/web/src/services/apiClient.js`, `real_dev/web/src/context/AuthContext.jsx` | `apiRequest` e `apiDownload` preservam `credentials: "include"`; build Vite passou. |

## Rastreabilidade BK-MF7-04

| Requisito | Ficheiros principais | Testes/validacoes |
| --- | --- | --- |
| Compatibilidade Chrome/Safari/Edge/Firefox sem branches por browser | `real_dev/web/scripts/check-mf7-browser-compatibility.mjs`, `real_dev/web/src` | `npm --prefix real_dev/web run smoke:mf7-compat` passou com 50 ficheiros analisados. |
| Build Vite estavel | `real_dev/web/vite.config.js`, `real_dev/web/package.json` | `npm --prefix real_dev/web run build` passou e gerou `dist`. |
| Sessao por cookie preservada em browsers modernos | `real_dev/web/src/services/apiClient.js`, `real_dev/api/tests/mf7.session-cookie.test.js` | `credentials: "include"` preservado; suite `mf7.session-cookie.test.js` passou fora do sandbox com 5 testes. |
| Upload facial usa API Web standard | `real_dev/web/src/pages/FacePhotoUploadPage.jsx`, `real_dev/web/src/utils/imageOptimization.js` | Pesquisa confirmou `FormData` e compressao por `Blob`/`canvas.toBlob`, sem user-agent branching. |
| Exportacoes descarregam ficheiros sem expor conteudo no DOM | `real_dev/web/src/pages/AdminExportsPage.jsx`, `real_dev/web/src/services/apiClient.js` | Pesquisa confirmou `Blob`, `URL.createObjectURL`, link temporario e `apiDownload` autenticado. |
| Checkout nao depende de browser especifico | `real_dev/web/src/pages/CheckoutPage.jsx` | Pesquisa confirmou uso de link normal para `checkoutUrl` e ausencia de branches por browser. |
| Checklist manual por browser | Relatorio tecnico MF7 | `PARCIAL`: Chrome, Safari, Edge e Firefox ainda nao foram executados manualmente nesta sessao. |

## Rastreabilidade BK-MF7-05

| Requisito | Ficheiros principais | Testes/validacoes |
| --- | --- | --- |
| PDF descarregavel para `RNF16` | `real_dev/api/src/services/admin-export.service.js`, `real_dev/api/src/controllers/admin-export.controller.js` | `mf7.admin-export-pdf.test.js` confirma buffer `%PDF`, `application/pdf` e `Content-Disposition: attachment`. |
| `RF35` preservado sem modulo paralelo | `real_dev/api/src/validators/admin-export.validator.js`, `real_dev/api/src/routes/admin-export.routes.js`, `real_dev/api/src/app.js` | Endpoint existente `GET /api/admin/exports/:dataset?format=pdf` continua montado em `/api/admin`. |
| Lista fechada de datasets/formatos | `validateAdminExportRequest` | Teste recusa `format=html` e dataset desconhecido antes de consultar `Order`, `User` ou `FaceReport`. |
| Privacidade de relatorios IA | `getDatasetRows("ai-reports")` em `admin-export.service.js`, `FaceReport` | Teste prova `FaceReport.find({ privacyStatus: "active" })` e ausencia de `storageKey`, paths internos, `passwordHash` e `privacyStatus` no PDF. |
| Autorizacao server-side | `requireAuth`, `requireRole(ROLES.ADMIN)`, `admin-export.routes.js` | Testes HTTP cobrem admin `200`, cliente `403` e visitante `401`. |
| Frontend descarrega sem renderizar conteudo | `real_dev/web/src/pages/AdminExportsPage.jsx`, `real_dev/web/src/services/apiClient.js` | Build Vite passou; pagina usa `apiDownload`, `Blob`, `URL.createObjectURL` e mostra apenas metadados seguros. |

## Rastreabilidade BK-MF7-06

| Requisito | Ficheiros principais | Testes/validacoes |
| --- | --- | --- |
| Gateway fechado `stripe`/`paypal`/`mbway` | `real_dev/api/src/validators/checkout.validator.js`, `real_dev/api/src/models/order.model.js` | `mf3.integration.test.js` cobre gateway MBWay e Stripe sem configuracao; validator recusa valores fora de `PAYMENT_GATEWAYS`. |
| Checkout autenticado e ownership backend | `real_dev/api/src/routes/order.routes.js`, `real_dev/api/src/controllers/order.controller.js`, `real_dev/api/src/services/order.service.js` | `POST /api/orders/checkout` usa `requireAuth` e `req.user.id`; testes enviam cookie HttpOnly e ignoram `totalCents` falso vindo do frontend. |
| Preco e stock recalculados no backend | `buildOrderItemsFromCart` em `order.service.js`, `Product`, `Cart` | Teste `cria encomenda stub...` prova total real `2598` apesar de `totalCents: 1`; stock insuficiente continua a devolver `409`. |
| Idempotencia minima por checkout | `Order.checkoutKey`, indice `{ userId, checkoutKey }`, `findReusableCheckoutOrder` | Teste `reaproveita encomenda existente para a mesma checkoutKey` prova que `Order.create` e `Product.find` nao correm em retry reaproveitavel. |
| Stripe real controlado | `payment.provider.js`, `env.stripeSecretKey` | Teste `falha Stripe sem configuracao...` prova `503` antes de criar encomenda; teste `envia Idempotency-Key...` prova header enviado quando ha chave. |
| Falha externa Stripe recuperavel | `markCheckoutPaymentFailed` em `order.service.js` | Teste `marca pagamento Stripe como failed...` prova `502`, `payment.status: "failed"` e carrinho nao limpo. |
| PayPal/MBWay em stub funcional | `createManualGatewayStub` em `payment.provider.js`, `CheckoutPage.jsx` | Teste MBWay devolve `pending_manual_confirmation`; frontend apresenta gateway escolhido sem afirmar pagamento recebido. |
| Handoff para IA externa | `BK-MF7-07`, `recommendation` existente | Checkout continua separado de recomendacao; nenhum produto recomendado e comprado ou adicionado automaticamente. |

## Rastreabilidade BK-MF7-07

| Requisito | Ficheiros principais | Testes/validacoes |
| --- | --- | --- |
| Configuracao de provider IA sem hardcode | `real_dev/api/src/config/env.js` | `AI_PROVIDER_MODE` usa `local` por defeito; `AI_PROVIDER_URL` e `AI_PROVIDER_KEY` entram por ambiente; `node --check` passou. |
| Adapter externo isolado | `real_dev/api/src/providers/external-skin-analysis.provider.js` | `mf7.external-ai-provider.test.js` cobre provider sem configuracao, HTTPS guard, payload minimizado, resposta sem `findings` e timeout. |
| Transporte seguro para imagem/API key | `assertSecureExternalProviderUrl` | URL `http://ia.example.test/analyze` devolve erro antes de `fetch`; localhost/127.0.0.1 ficam permitidos apenas fora de producao. |
| Payload minimizado para provider remoto | `buildExternalAnalysisPayload`, `preparePhotoForProvider` | Teste confirma `contentBase64` no body, API key no header e ausencia de `storageKey`, path interno e token no body. |
| Consentimento, ownership e storage cifrado antes do provider | `real_dev/api/src/services/face-analysis.service.js`, `face-secure-storage.service.js` | Service filtra por `userId`/`status: "active"`, exige consentimento, seleciona `+storageKey +encryption +encryption.iv +encryption.authTag`, lê bytes cifrados no backend e passa base64 apenas em memoria. |
| Fallback local honesto | `real_dev/api/src/providers/skin-analysis.provider.js` | Em `AI_PROVIDER_MODE=external`, falha remota cai para `local-skin-analysis-v1` com limitacao adicional; erros de input `400` continuam bloqueantes. |
| UI consome limitacoes da API | `real_dev/web/src/pages/FaceAnalysisPage.jsx` | UI existente mostra `analysis.limitations.join(" ")`; `npm --prefix real_dev/web run build` passou. |
| Handoff para MF8 | `providerName`, `findings`, `sources`, `limitations` | Contrato deixa dados para `BK-MF8-01` documentar modularidade e `BK-MF8-05` reforcar explicabilidade. |

## Contratos consumidos

- `BK-MF0-02`: login/logout com sessao segura por cookie HttpOnly.
- `BK-MF1-06`: provider local de analise facial e contrato `providerName`/`findings`/`sources`/`limitations`.
- `BK-MF3-02`: `Cart`, itens de carrinho e `clearCart` como origem da intencao de compra.
- `BK-MF3-03`: `Order`, estados logisticos/pagamento, `POST /api/orders/checkout` e provider de pagamento base.
- `BK-MF3-04`: historico de encomendas continua a consumir `Order.find({ userId })` sem expor `userId`.
- `BK-MF4-03`: modulo `admin-export`, datasets fechados, CSV/PDF textual, headers de download e UI administrativa.
- `BK-MF4-08`: recomendacoes continuam separadas do carrinho e nao fazem compra automatica.
- `BK-MF5-05`: interface responsiva e estrutura visual reutilizavel.
- `BK-MF5-07`: feedback acessivel em formularios sensiveis.
- `BK-MF6-02`: build/performance das paginas principais como base de experiencia moderna.
- `BK-MF6-05`: `env.forceHttps` ativa `secure` em producao/HTTPS controlado.
- `BK-MF6-06`: password continua protegida por bcrypt; este BK nao altera hashing.
- `BK-MF6-07`: `FaceReport` preserva `privacyStatus` e campos sensiveis cifrados em repouso; fotografias faciais sao lidas por `readEncryptedFacePhotoFile` apenas no backend autorizado.
- `BK-MF7-01`: consentimento facial depende de sessao autenticada.
- `BK-MF7-02`: pedidos biometricos sensiveis dependem de `requireAuth` e `credentials: "include"`.
- `BK-MF7-03`: cookie HttpOnly e cliente API com `credentials: "include"` sao a base da compatibilidade de sessao.
- `BK-MF7-04`: downloads usam APIs Web standard (`Blob`, `URL.createObjectURL`) sem branches por browser.
- `BK-MF7-05`: checkout continua isolado da exportacao administrativa e sem payloads sensiveis em URL/DOM.

## Contratos entregues

- Cookie canonico `orelle_session` com `httpOnly: true`, `sameSite: "lax"`, `path: "/"` e `secure` dependente do gate HTTPS/producao.
- Login que cria cookie e devolve apenas `user` seguro.
- `/api/auth/me` como fonte segura do utilizador autenticado.
- Logout que limpa o mesmo cookie criado no login.
- Middleware `requireAuth` que valida assinatura/expiracao e revalida estado da conta quando a base de dados esta disponivel.
- Cliente frontend com `credentials: "include"` preservado para JSON e downloads autenticados.
- Suite `mf7.session-cookie.test.js` como evidencia propria para o BK-MF7-03.
- Handoff para `BK-MF7-04`: compatibilidade entre browsers pode validar cookies/fetch sem ramos especificos por browser.
- Smoke `smoke:mf7-compat` sem dependencias novas para bloquear `navigator.userAgent`, `navigator.vendor`, `document.all` e `document.documentMode`.
- Build Vite validado para producao com configuracao HTTPS ja existente.
- `BK-MF7-05`: exportacao PDF minimizada para `sales`, `users` e `ai-reports`, com `ai-reports` limitado a `privacyStatus: "active"`.
- Headers de download: `Content-Type`, `Content-Disposition`, `X-Content-Type-Options: nosniff` e `X-Orelle-Export-Rows`.
- Suite `mf7.admin-export-pdf.test.js` como evidence propria para `RNF16`: builder, validator, service, headers, autorizacao e negativos.
- `BK-MF7-06`: `Order.checkoutKey` interna, obrigatoria e unica por `{ userId, checkoutKey }`.
- `BK-MF7-06`: `findReusableCheckoutOrder` para reaproveitar tentativas com `requires_payment`, `pending_manual_confirmation` ou `failed`.
- `BK-MF7-06`: `createPaymentSession(order, gateway, checkoutKey)` envia `Idempotency-Key` a Stripe.
- `BK-MF7-06`: falha Stripe apos criacao de encomenda guarda `payment.status: "failed"` e nao limpa carrinho.
- `BK-MF7-06`: PayPal/MBWay ficam em `pending_manual_confirmation`, sem simular `paid`.
- Handoff para `BK-MF7-07`: IA externa/recomendacoes continuam separadas da decisao de compra e nao acionam checkout automaticamente.
- `BK-MF7-07`: configuracao `AI_PROVIDER_MODE`, `AI_PROVIDER_URL` e `AI_PROVIDER_KEY`.
- `BK-MF7-07`: provider externo isolado com `fetch`, timeout, HTTPS guard e normalizacao conservadora.
- `BK-MF7-07`: `analyzeSkinPhotos` continua como contrato unico para o service, alternando entre provider local e externo.
- `BK-MF7-07`: payload externo minimizado com `contentBase64`, sem `storageKey`, paths internos ou API key no body.
- `BK-MF7-07`: fallback local explicito com limitacao publica quando o provider configurado fica indisponivel.
- Handoff para `BK-MF8-01` e `BK-MF8-05`: providers documentaveis e resposta com `sources`/`limitations` para explicabilidade.

## Coerencia entre MFs

- `MF6 -> MF7`: preservada. HTTPS em producao, bcrypt e encriptacao em repouso continuam intactos; a sessao HttpOnly passa a ficar provada por testes MF7 dedicados.
- `BK-MF7-01 -> BK-MF7-03`: preservada. Upload/analise facial continuam dependentes de sessao e consentimento backend.
- `BK-MF7-02 -> BK-MF7-03`: preservada. Pedidos de privacidade biometricos continuam protegidos por `requireAuth` e pelo cliente com cookies.
- `BK-MF7-03 -> BK-MF7-04`: preservada. O smoke confirma ausencia de branches por browser e a suite de sessao passa fora do sandbox.
- `BK-MF7-04 -> BK-MF7-05`: preservada. Downloads PDF/CSV continuam a usar `apiDownload`, `Blob` e link temporario; a prova automatica cobre backend/headers, e QA manual real por browser fica associado a `RNF15`.
- `BK-MF7-05 -> BK-MF7-06`: preservada. Exportacao administrativa nao mistura recomendacao, carrinho, encomenda ou pagamento; o proximo BK pode focar checkout sem herdar dados sensiveis do PDF.
- `BK-MF7-06 -> BK-MF7-07`: preservada. Checkout nao chama providers de IA, nao compra recomendacoes automaticamente e entrega encomenda/pagamento como contrato comercial separado.
- `BK-MF7-07 -> MF8`: preservada. A IA externa entrega contrato normalizado e limitacoes publicas para `BK-MF8-01`, `BK-MF8-05` e `BK-MF8-07`, sem treino externo nem exposicao de paths internos.
- `MF7 -> MF8`: preparada com ressalva. MF8 deve continuar a consumir `req.user`/sessao backend, nao aceitar ownership vindo da UI e manter logs/metricas sem segredos Stripe, cookies, API keys, fotografias, base64 ou dados pessoais.

## Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Nenhum finding aberto. |
| `P1` | 0 | Nenhum finding aberto. |
| `P2` | 0 | Nenhum finding aberto. |
| `P3` | 0 | Sem finding formal aberto; foram feitos reforcos preventivos no cliente API, exports e checkout, com evidence dedicada. |

## Ficheiros alterados

### Nesta execucao BK-MF7-07

- `real_dev/api/src/config/env.js`
- `real_dev/api/src/providers/external-skin-analysis.provider.js`
- `real_dev/api/src/providers/skin-analysis.provider.js`
- `real_dev/api/src/services/face-analysis.service.js`
- `real_dev/api/tests/mf1.face.test.js`
- `real_dev/api/tests/mf6.face-analysis-performance.test.js`
- `real_dev/api/tests/mf7.external-ai-provider.test.js`
- `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF7.md`

### Nesta execucao BK-MF7-06

- `real_dev/api/src/models/order.model.js`
- `real_dev/api/src/providers/payment.provider.js`
- `real_dev/api/src/services/order.service.js`
- `real_dev/api/tests/mf3.integration.test.js`
- `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF7.md`

### Nesta execucao BK-MF7-05

- `real_dev/api/tests/mf7.admin-export-pdf.test.js`
- `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF7.md`

### Nesta execucao BK-MF7-04

- `real_dev/web/scripts/check-mf7-browser-compatibility.mjs`
- `real_dev/web/package.json`

### Estado acumulado anterior BK-MF7-03

- `real_dev/web/src/services/apiClient.js`
- `real_dev/api/tests/mf7.session-cookie.test.js`

## Ficheiros revistos/auditados no scope

- `real_dev/api/src/config/env.js`
- `real_dev/api/src/services/session.service.js`
- `real_dev/api/src/controllers/auth.controller.js`
- `real_dev/api/src/middlewares/auth.middleware.js`
- `real_dev/api/src/routes/auth.routes.js`
- `real_dev/api/src/middlewares/role.middleware.js`
- `real_dev/api/src/app.js`
- `real_dev/api/src/validators/admin-export.validator.js`
- `real_dev/api/src/services/admin-export.service.js`
- `real_dev/api/src/controllers/admin-export.controller.js`
- `real_dev/api/src/routes/admin-export.routes.js`
- `real_dev/api/src/models/face-report.model.js`
- `real_dev/api/src/models/cart.model.js`
- `real_dev/api/src/models/order.model.js`
- `real_dev/api/src/models/product.model.js`
- `real_dev/api/src/validators/checkout.validator.js`
- `real_dev/api/src/providers/payment.provider.js`
- `real_dev/api/src/providers/skin-analysis.provider.js`
- `real_dev/api/src/providers/external-skin-analysis.provider.js`
- `real_dev/api/src/services/face-analysis.service.js`
- `real_dev/api/src/services/face-secure-storage.service.js`
- `real_dev/api/src/services/cart.service.js`
- `real_dev/api/src/services/order.service.js`
- `real_dev/api/src/controllers/order.controller.js`
- `real_dev/api/src/routes/order.routes.js`
- `real_dev/api/tests/auth.session.test.js`
- `real_dev/api/tests/mf0.flow.test.js`
- `real_dev/api/tests/mf3.integration.test.js`
- `real_dev/api/tests/mf4.integration.test.js`
- `real_dev/api/tests/mf7.admin-export-pdf.test.js`
- `real_dev/api/tests/mf7.external-ai-provider.test.js`
- `real_dev/api/tests/mf6.face-analysis-performance.test.js`
- `real_dev/api/tests/mf1.face.test.js`
- `real_dev/web/src/services/apiClient.js`
- `real_dev/web/src/context/AuthContext.jsx`
- `real_dev/web/src/pages/LoginPage.jsx`
- `real_dev/web/vite.config.js`
- `real_dev/web/src/pages/FacePhotoUploadPage.jsx`
- `real_dev/web/src/pages/AdminExportsPage.jsx`
- `real_dev/web/src/pages/CheckoutPage.jsx`
- `real_dev/web/src/pages/FaceAnalysisPage.jsx`
- `real_dev/web/scripts/check-mf5-feedback.mjs`
- `real_dev/web/scripts/check-mf6-images.mjs`

## Comandos executados

A tabela combina evidencia acumulada das execucoes anteriores do `BK-MF7-03`, `BK-MF7-04`, `BK-MF7-05` e `BK-MF7-06` com os comandos executados nesta execucao do `BK-MF7-07`. Quando um comando pertence apenas ao estado anterior, isso fica indicado no resultado.

| Comando | Resultado |
| --- | --- |
| `git status --short` | Worktree ja tinha varias alteracoes documentais/MF8 fora do scope; nao foram revertidas nem editadas. |
| `git check-ignore -v real_dev real_dev/web real_dev/web/scripts/check-mf7-browser-compatibility.mjs real_dev/web/package.json` | `real_dev/` confirmado como ignorado por `.gitignore`, esperado neste projeto. |
| `rg -n "RNF14|RF02|BK-MF7-03|cookie HttpOnly|HttpOnly|sessao|cookies" ...` | Confirmou `RNF14`, ligacao `BK-MF7-03` e `RF02` nos documentos canonicos. |
| `rg -n "RNF15|BK-MF7-04|Chrome|Safari|Edge|Firefox|compatib|browser|build Vite|smoke" ...` | Confirmou `RNF15`, `BK-MF7-04`, matriz, backlog, CORE-HIBRIDO e sprints. |
| `rg -n "BK-MF7-05|RF35|RNF16|exportacao|exportação|PDF|privacyStatus|FaceReport|AdminExports|admin-export" docs real_dev/api real_dev/web` | Confirmou `RNF16`, `RF35`, guia alvo, modulo `admin-export`, filtro `privacyStatus` e UI real em `real_dev`. |
| `rg -n "BK-MF7-06|RF27|RNF17|Stripe|PayPal|MBWay|pagament|checkout|gateway" ...` | Confirmou `RNF17`, `RF27`, guia alvo, matriz, backlog, CORE-COM e contratos de checkout. |
| `rg -n "RNF18|RNF23|RNF24|RNF25|RF14|RF15|RF18|RF19|BK-MF7-07|CORE-IA|Azure|TensorFlow|Face API" ...` | Confirmou `RNF18`, ligacao a `RF14`, handoff para MF8 e classe `CORE-IA` nos documentos canonicos. |
| `npm --prefix real_dev/web run smoke:mf7-compat` | Passou: 50 ficheiros JS/JSX analisados, sem branches por browser. |
| `npm --prefix real_dev/web run build` | Passou: Vite build concluido, 79 modulos transformados, bundle JS 206.31 kB. |
| `npm --prefix real_dev/api test -- mf7.session-cookie.test.js` | Falhou no sandbox por `listen EPERM`; passou fora do sandbox: 1 ficheiro, 5 testes. |
| `npm --prefix real_dev/api test -- mf7.admin-export-pdf.test.js` | Falhou no sandbox por `listen EPERM`/`Cannot read properties of null (reading 'port')`; passou fora do sandbox: 1 ficheiro, 7 testes. |
| `npm --prefix real_dev/api test -- mf3.integration.test.js` | Falhou no sandbox por `listen EPERM`; passou fora do sandbox: 1 ficheiro, 21 testes. |
| `npm --prefix real_dev/api test -- mf7.external-ai-provider.test.js` | Passou no sandbox: 1 ficheiro, 8 testes. |
| `npm --prefix real_dev/api test -- mf7.external-ai-provider.test.js mf6.face-analysis-performance.test.js mf1.face.test.js` | Falhou no sandbox em suites Supertest por `listen EPERM`; passou fora do sandbox: 3 ficheiros, 26 testes. |
| `npm --prefix real_dev/api test` | Passou fora do sandbox: 26 ficheiros, 204 testes. |
| `node --check real_dev/api/src/models/order.model.js` | Passou sem output. |
| `node --check real_dev/api/src/providers/payment.provider.js` | Passou sem output. |
| `node --check real_dev/api/src/services/order.service.js` | Passou sem output. |
| `node --check real_dev/api/tests/mf3.integration.test.js` | Passou sem output. |
| `node --check real_dev/api/src/config/env.js` | Passou sem output. |
| `node --check real_dev/api/src/providers/external-skin-analysis.provider.js` | Passou sem output. |
| `node --check real_dev/api/src/providers/skin-analysis.provider.js` | Passou sem output. |
| `node --check real_dev/api/src/services/face-analysis.service.js` | Passou sem output. |
| `node --check real_dev/api/tests/mf7.external-ai-provider.test.js` | Passou sem output. |
| `node --check real_dev/api/tests/mf1.face.test.js` | Passou sem output. |
| Pesquisa `SESSION_COOKIE_NAME|getSessionCookieOptions|credentials: "include"|requireAuth|localStorage|sessionStorage|...` | Contratos encontrados nas camadas esperadas; sem uso de storage de browser para token/sessao em `src`. |
| Pesquisa `navigator.userAgent|navigator.vendor|document.all|document.documentMode|FormData|Blob|URL.createObjectURL|checkoutUrl` | Sem branches por browser em `src`; fluxos criticos usam APIs Web standard. |
| Pesquisa `buildSimplePdf|application/pdf|Content-Disposition|X-Orelle-Export-Rows|privacyStatus|mf7.admin-export-pdf` | Confirmou builder PDF, headers, filtro de privacidade, teste focado e consumidores relacionados. |
| Pesquisa `checkoutKey|Idempotency-Key|PAYMENT_STATUS.FAILED|pending_manual_confirmation|Stripe nao esta configurado` | Confirmou contratos implementados no model, service, provider e testes de checkout. |
| Pesquisa `AI_PROVIDER_MODE|AI_PROVIDER_URL|AI_PROVIDER_KEY|analyzeSkinPhotosExternally|contentBase64|providerName|limitations` | Confirmou configuracao, adapter externo, payload minimizado, contrato publico e UI de limitacoes. |
| Pesquisa estatica ampla de seguranca/privacidade | Sem finding in-scope; falsos positivos registados abaixo. |
| `bash scripts/validate-planificacao.sh` | Falhou por `guides_pass=false`/`overall_pass=false` em drift legado de qualidade de guias (`missing_pedagogic_or_operational_blocks`, matrizes/negativos em multiplos BKs, incluindo BKs fora do scope); `coverage_pass` e `consistency_pass` passaram. |
| `git diff --check` | Passou. |
| `git diff --no-index --check /dev/null real_dev/api/tests/mf7.admin-export-pdf.test.js` | Exit code 1 sem output, comportamento esperado de `--no-index` para ficheiro novo; nao reportou whitespace errors. |
| `git diff --no-index --check /dev/null real_dev/api/src/models/order.model.js` | Exit code 1 sem output, comportamento esperado de `--no-index`; nao reportou whitespace errors. |
| `git diff --no-index --check /dev/null real_dev/api/src/providers/payment.provider.js` | Exit code 1 sem output, comportamento esperado de `--no-index`; nao reportou whitespace errors. |
| `git diff --no-index --check /dev/null real_dev/api/src/services/order.service.js` | Exit code 1 sem output, comportamento esperado de `--no-index`; nao reportou whitespace errors. |
| `git diff --no-index --check /dev/null real_dev/api/tests/mf3.integration.test.js` | Exit code 1 sem output, comportamento esperado de `--no-index`; nao reportou whitespace errors. |
| `git check-ignore -v real_dev/api/src/providers/external-skin-analysis.provider.js real_dev/api/tests/mf7.external-ai-provider.test.js real_dev/web/dist/index.html` | Confirmou que `real_dev/` e `dist/` continuam ignorados por `.gitignore`, esperado neste projeto. |
| `git diff --no-index --check /dev/null real_dev/api/src/config/env.js` | Exit code 1 sem output, comportamento esperado de `--no-index`; nao reportou whitespace errors. |
| `git diff --no-index --check /dev/null real_dev/api/src/providers/external-skin-analysis.provider.js` | Exit code 1 sem output, comportamento esperado de `--no-index`; nao reportou whitespace errors. |
| `git diff --no-index --check /dev/null real_dev/api/src/providers/skin-analysis.provider.js` | Exit code 1 sem output, comportamento esperado de `--no-index`; nao reportou whitespace errors. |
| `git diff --no-index --check /dev/null real_dev/api/src/services/face-analysis.service.js` | Exit code 1 sem output, comportamento esperado de `--no-index`; nao reportou whitespace errors. |
| `git diff --no-index --check /dev/null real_dev/api/tests/mf1.face.test.js` | Exit code 1 sem output, comportamento esperado de `--no-index`; nao reportou whitespace errors. |
| `git diff --no-index --check /dev/null real_dev/api/tests/mf6.face-analysis-performance.test.js` | Exit code 1 sem output, comportamento esperado de `--no-index`; nao reportou whitespace errors. |
| `git diff --no-index --check /dev/null real_dev/api/tests/mf7.external-ai-provider.test.js` | Exit code 1 sem output, comportamento esperado de `--no-index`; nao reportou whitespace errors. |
| `git diff --no-index --check /dev/null docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF7.md` | Exit code 1 sem output, comportamento esperado de `--no-index`; nao reportou whitespace errors. |

## Pesquisa estatica

Falsos positivos justificados:

- `localStorage`/`sessionStorage`: aparecem em comentario de seguranca de `session.service.js` e no script de smoke de tema; nao ha token/sessao guardado em browser storage em `real_dev/web/src`.
- `secret`/`stripeSecretKey`: pertencem a configuracao de ambiente, provider de pagamento existente e testes de segredo fraco; a execucao nao adicionou segredo hardcoded.
- `AI_PROVIDER_KEY`/`Authorization: Bearer`: aparecem apenas como variaveis de ambiente/header de servidor no adapter externo e como valor dummy em testes; a key nao entra no body nem no frontend.
- `contentBase64`: aparece apenas como payload temporario para provider externo depois de consentimento, ownership e leitura cifrada no backend; nao e persistido nem devolvido pela API.
- `storageKey`: aparece em validacao interna, JSDoc e testes negativos; o teste novo confirma que nao segue no body externo.
- `stripe`, `paypal`, `mbway`: pertencem ao fluxo de checkout previsto por `RNF17`; Stripe continua controlado por `STRIPE_SECRET_KEY` e PayPal/MBWay ficam stubs pendentes.
- `Idempotency-Key`: aparece apenas no provider Stripe e nos testes do `BK-MF7-06`, sem expor segredos ou dados pessoais.
- `checkoutKey`: campo interno de idempotencia da encomenda; nao e devolvido no DTO publico de checkout.
- `treino externo`: aparece como proibicao/limite do provider local, nao como treino real.
- `temporario`: aparece em comentarios de testes que alteram variaveis de ambiente de forma controlada.
- `localStorage`/`sessionStorage` no smoke de tema: e um teste negativo que garante que preferencia visual nao usa storage; nao guarda sessao nem token.
- `/api/admin/exports/secrets?format=pdf`: aparece apenas no teste negativo do `BK-MF7-05` para provar que dataset desconhecido devolve `400` antes de consultar modelos.
- `privacyStatus: "deleted"` dentro do teste novo e um valor sentinela para provar que campos sensiveis do mock nao entram no PDF gerado.

## Validacoes nao executadas

- Browser manual real em Chrome, Safari, Edge e Firefox: nao executado nesta ronda. A evidence automatica valida ausencia de branches por browser, build, `Set-Cookie`, `/auth/me`, logout e APIs Web standard; a confirmacao manual por browser fica pendente para defesa/QA.
- Verificacao manual visual do header `Set-Cookie` no DevTools: nao executada; substituida nesta ronda por Supertest fora do sandbox.
- Download manual de `ai-reports.pdf` no browser/screenshot: nao executado; substituido por teste HTTP de headers, service PDF e build web.
- Chamada real a Stripe: nao executada por seguranca operacional e por ausencia de chave real no scope; o teste cobre provider via `fetch` mockado, header `Idempotency-Key` e falha controlada.
- Confirmacao manual PayPal/MBWay: nao executada contra providers externos porque o contrato MVP e stub funcional, nao integracao externa completa.
- Cenarios negativos destrutivos por mutacao temporaria de `navigator.userAgent` ou import invalido: nao executados para nao introduzir edicoes artificiais no workspace; o script contem os padroes bloqueados e deve ser validado manualmente se a equipa quiser prova de mutacao.
- Evidence separada `docs/evidence/MF7/BK-MF7-04-browser-compatibility.md`: nao criada porque `PERMITIR_ALTERAR_DOCS=nao`; a evidencia permitida fica neste relatorio tecnico.
- Evidence separada `docs/evidence/MF7/BK-MF7-05-admin-export-pdf.md`: nao criada porque `PERMITIR_ALTERAR_DOCS=nao`; a evidencia permitida fica neste relatorio tecnico.
- Commits/push: nao executados porque `PERMITIR_COMMITS=nao`.
- Chamada real a Azure Face API, TensorFlow remoto ou outro provider externo: nao executada por ausencia de contrato/credenciais reais no scope; a integracao foi validada com `fetch` mockado, guard HTTPS, timeout e payload minimizado.
- Screenshot da UI com fallback local: nao executado; a UI existente mostra `analysis.limitations` e o build passou, mas a prova visual manual fica como evidence complementar.

## Blockers e TODOs

- Sem blockers de implementacao para `BK-MF7-03`.
- Sem blockers de codigo para `BK-MF7-04`.
- Sem blockers de codigo para `BK-MF7-05`.
- Sem blockers de codigo para `BK-MF7-06`.
- Sem blockers de codigo para `BK-MF7-07`.
- TODO operacional recomendado: em demo/defesa, abrir a app em browser, fazer login, confirmar cookie HttpOnly no DevTools e validar que um refresh mantem `/auth/me` autenticado.
- TODO operacional obrigatorio para fechar `BK-MF7-04` como `IMPLEMENTADO`: executar checklist manual em Chrome, Safari, Edge e Firefox cobrindo login, upload facial, pedido de privacidade, exportacao CSV/PDF e checkout.
- TODO operacional recomendado para `BK-MF7-05`: em demo/defesa, descarregar `ai-reports.pdf` numa sessao admin real e guardar screenshot/headers como evidence manual complementar.
- TODO operacional recomendado para `BK-MF7-06`: em demo/defesa, executar checkout MBWay/PayPal stub numa sessao cliente real e, se houver `STRIPE_SECRET_KEY` de teste, validar criacao de sessao Stripe em ambiente controlado sem webhooks.
- TODO operacional recomendado para `BK-MF7-07`: em demo/defesa, configurar `AI_PROVIDER_MODE=external` com endpoint HTTPS de teste controlado e recolher screenshot/headers do fallback ou resposta normalizada, sem usar imagens reais para treino externo.

## Decisao

`BK-MF7-03` fica `IMPLEMENTADO` em `real_dev`, com suite API focada verde fora do sandbox, build web verde, pesquisa estatica sem findings in-scope e coerencia preservada com `MF6`, `BK-MF7-01` e `BK-MF7-02`.

`BK-MF7-04` fica com implementacao tecnica automatizada concluida em `real_dev/web`, incluindo `smoke:mf7-compat`, build Vite e revisao dos fluxos criticos. O estado formal permanece `PARCIAL` ate existir QA manual real nos quatro browsers alvo, porque `RNF15` nao deve ser declarado totalmente cumprido apenas com evidence automatica em ambiente unico.

`BK-MF7-05` fica `IMPLEMENTADO` em `real_dev`: o modulo `admin-export` entrega PDF minimizado para `RNF16`, preserva `RF35`, exige sessao e role admin, filtra relatorios IA por `privacyStatus: "active"`, nao exporta campos sensiveis e tem suite dedicada verde fora do sandbox. A unica ressalva e evidence manual complementar de download em browser real, que nao bloqueia o contrato backend/API validado.

`BK-MF7-06` fica `IMPLEMENTADO` em `real_dev`: o checkout preserva backend como autoridade de preco/stock/ownership, aceita apenas gateways canonicos, adiciona idempotencia minima por `checkoutKey`, envia `Idempotency-Key` a Stripe, mantem PayPal/MBWay em stub funcional pendente, persiste falha Stripe como `failed` quando a encomenda ja existe e tem evidence automatica verde na suite `mf3.integration.test.js` e na suite API completa.

`BK-MF7-07` fica `IMPLEMENTADO` em `real_dev`: a API tem configuracao de provider externo por ambiente, adapter isolado com `fetch` nativo, guard HTTPS, timeout controlado, payload minimizado com `contentBase64`, API key apenas no header, fallback local explicito e resposta publica com `providerName`, `findings`, `sources` e `limitations`. A suite dedicada `mf7.external-ai-provider.test.js` passou com 8 testes, as suites focadas passaram fora do sandbox com 26 testes e a suite API completa passou com 26 ficheiros / 204 testes.
