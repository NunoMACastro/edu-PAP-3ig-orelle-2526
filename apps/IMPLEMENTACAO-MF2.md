# Implementacao MF2 - real_dev

## Contexto

- Macrofase alvo: `MF2`
- Modo: `implementar`
- Pasta alvo: `real_dev/`
- Data de execucao: `2026-06-11`

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
- Guias `docs/planificacao/guias-bk/MF0/`
- Guias `docs/planificacao/guias-bk/MF1/`
- Guias `docs/planificacao/guias-bk/MF2/`
- Codigo existente em `real_dev/api` e `real_dev/web`

## Stack real identificada

- Backend: Node.js, Express, ES Modules, Mongoose.
- Frontend: React com Vite.
- Autenticacao: cookie HttpOnly via `requireAuth`.
- Roles: `cliente`, `consultor`, `administrador`.
- Area de trabalho: `real_dev/`, sem alteracao de `apps/`.
- Configuracao Vite: criado `real_dev/web/vite.config.js` para garantir transform JSX consistente com `@vitejs/plugin-react`.

## BKs implementados

### BK-MF2-01 / RF17

- Criado `GET /api/me/skin-evolution`.
- Criados service, controller e route de evolucao temporal.
- Criada `SkinEvolutionPage`.
- DTO publico nao devolve `photoIds`, `consentId`, `storageKey` nem ficheiros privados.

### BK-MF2-02 / RF18

- Criado modelo `ProductRecommendation`.
- Criados endpoints:
  - `POST /api/recommendations/generate`
  - `GET /api/recommendations`
- Recomendacoes usam analise facial concluida, relatorio ligado ao `analysisId` e produtos reais com stock positivo.
- Produtos apenas com stock, mas sem compatibilidade cosmetica, nao geram recomendacao.
- Nao foi criado carrinho, encomenda, checkout ou pagamento.

### BK-MF2-03 / RF19

- Criado `recommendation-reason.service.js`.
- Motivos (`reasonCodes`, `sourceSignals`, `explanation`) sao gerados no backend.
- UI mostra motivos legiveis sem `JSON.stringify`.

### BK-MF2-04 / RF20

- Criado validator de feedback.
- Criado `POST /api/recommendations/:recommendationId/feedback`.
- Feedback limitado a `util` e `nao_relevante`.
- Ownership aplicado por `_id` + `userId`.

### BK-MF2-05 / RF21

- Criado modelo `DailyRoutine`.
- Criados endpoints:
  - `POST /api/me/daily-routine/generate`
  - `GET /api/me/daily-routine`
- Rotina exige pelo menos um passo `manha` e um passo `noite`.
- Recomendações `dismissed` ficam excluidas.
- DERIVADO: como compras reais pertencem a MF3, a rotina usa `source: "recommendations"` nesta macrofase e prepara `source: "purchases"` para integração futura.

### BK-MF2-06 / RF22

- Criado modelo `RecommendationReview`.
- Criado `POST /api/consultant/recommendations/:recommendationId/reviews`.
- Route protegida por `requireAuth` e `requireRole(ROLES.CONSULTOR, ROLES.ADMIN)`.
- DTO minimo nao devolve fotografia, analise completa, relatorio completo, consentimento ou paths.
- Revisao `adjusted` atualiza explicacao; `rejected` marca recomendacao como `dismissed`.

### BK-MF2-07 / RF23

- Criado provider local `makeup-simulation.provider.js`.
- Criado modelo `MakeupSimulation`.
- Criado `POST /api/makeup-simulations`.
- Backend escolhe fotografia frontal ativa; frontend envia apenas `productId`.
- Route reutiliza `ensureActiveFaceConsent`.
- DTO nao devolve `storageKey`, `facePhotoId` ou `consentId`.

### BK-MF2-08 / RF24

- Criado provider local `before-after-visualization.provider.js`.
- Criado modelo `BeforeAfterVisualization`.
- Criado `POST /api/before-after-visualizations`.
- Service revalida consentimento, ownership da simulacao e recomendacoes do proprio utilizador.
- Nao implementa comparacao apos 30 dias, carrinho ou compra automatica.

## Decisoes DERIVADO

- `BK-MF2-01`: evolucao calculada a partir de `FaceAnalysis.findings`, sem usar fotografias.
- `BK-MF2-05`: rotina gerada a partir de recomendacoes `active`/`accepted` enquanto compras reais nao existem antes da MF3.
- `BK-MF2-07`: provider local baseline para simulacao, sem provider externo real.
- `BK-MF2-08`: visualizacao antes/depois usa preview seguro da simulacao e recomendacoes existentes, sem publicar fotografia privada.

## Blockers e riscos

- Nao foram encontrados blockers tecnicos para compilar/testar a implementacao MF2.
- `bash scripts/validate-planificacao.sh` falhou por `missing_pedagogic_or_operational_blocks` nos guias MF2 existentes. A implementacao nao altera guias/documentacao canonica por regra da prompt.

## Validacoes executadas

- `npm run build` em `real_dev/web`: PASS.
- `npm run test -- tests/mf2.contracts.test.js` em `real_dev/api`: PASS, 7 testes.
- `npm run test` em `real_dev/api` dentro do sandbox: FAIL por `listen EPERM 0.0.0.0` no Supertest.
- `npm run test` em `real_dev/api` fora do sandbox com permissao: PASS, 13 ficheiros e 87 testes.
- `git diff --check`: PASS.
- `bash scripts/validate-planificacao.sh`: FAIL documental nos guias MF2, sem falhas de cobertura/consistencia.
- Browser integrado em `http://127.0.0.1:4177/`: PASS visual basico, secções MF2 renderizadas sem alertas visiveis.

## Scope deixado de fora

- Carrinho, encomendas, pagamentos e compras reais: pertencem a MF3.
- Comparacao antes vs apos 30 dias de uso: pertence a MF3.
- Encriptacao em repouso, auditoria biometrica completa, apagamento/anonymizacao e provider externo real: pertencem a macrofases posteriores conforme matriz canonica.
