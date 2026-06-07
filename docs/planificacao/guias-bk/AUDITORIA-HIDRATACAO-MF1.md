# Auditoria de hidratacao pedagogica/tecnica - MF1

## Header
- `doc_id`: `AUDITORIA-HIDRATACAO-MF1`
- `mf_alvo`: `MF1`
- `modo`: `corrigir_apenas`
- `data_execucao`: `2026-06-07`
- `relatorio`: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF1.md`

## Objetivo
Usar o relatorio existente como ponto de partida, revalidar os guias da `MF1` contra o gate oficial e corrigir apenas as lacunas documentais que ainda impediam os BKs de serem considerados completos e sem pendencias explicitas.

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
- `docs/planificacao/guias-bk/_TEMPLATE-BK.md`
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF0.md`
- Todos os BKs de `docs/planificacao/guias-bk/MF0/`.
- Todos os BKs de `docs/planificacao/guias-bk/MF1/`.
- BKs posteriores com dependencia direta em MF1: `BK-MF2-01`, `BK-MF2-02`, `BK-MF2-07`, `BK-MF3-01`, `BK-MF4-02`, `BK-MF5-01`, `BK-MF5-04`.

## Documentos em falta
Nenhum documento obrigatorio em falta.

## Snapshot
| Momento | OK | PARCIAL | CRITICO | Total |
| --- | ---: | ---: | ---: | ---: |
| Relatorio existente antes desta execucao | 8 | 0 | 0 | 8 |
| Revalidacao oficial no inicio desta execucao | 0 | 8 | 0 | 8 |
| Depois desta correcao | 8 | 0 | 0 | 8 |

Nota: o relatorio existente indicava `OK=8`, mas `bash scripts/validate-planificacao.sh` ainda assinalava `missing_pedagogic_or_operational_blocks` nos oito guias da `MF1`. Alem disso, os cabecalhos mantinham `estado=TODO` apesar de a hidratacao documental ja estar concluida. Por isso, nesta execucao os oito BKs foram tratados como `PARCIAL` para efeitos de correcao estrutural e de fecho documental.

## BKs editados
- `BK-MF1-01`
- `BK-MF1-02`
- `BK-MF1-03`
- `BK-MF1-04`
- `BK-MF1-05`
- `BK-MF1-06`
- `BK-MF1-07`
- `BK-MF1-08`

## Resultado por BK
| BK | RF | Estado antes pela revalidacao | Estado depois | Correcao principal |
| --- | --- | --- | --- | --- |
| `BK-MF1-01` | `RF09` | `PARCIAL` | `OK` | Adicionada a secção canonica `## Snippet técnico aplicável` e actualizado `estado` para `DONE`. |
| `BK-MF1-02` | `RF10` | `PARCIAL` | `OK` | Adicionada a secção canonica `## Snippet técnico aplicável` e actualizado `estado` para `DONE`. |
| `BK-MF1-03` | `RF11` | `PARCIAL` | `OK` | Adicionada a secção canonica `## Snippet técnico aplicável` e actualizado `estado` para `DONE`. |
| `BK-MF1-04` | `RF12` | `PARCIAL` | `OK` | Adicionada a secção canonica `## Snippet técnico aplicável` e actualizado `estado` para `DONE`. |
| `BK-MF1-05` | `RF13` | `PARCIAL` | `OK` | Adicionada a secção canonica `## Snippet técnico aplicável` e actualizado `estado` para `DONE`. |
| `BK-MF1-06` | `RF14` | `PARCIAL` | `OK` | Adicionada a secção canonica `## Snippet técnico aplicável` e actualizado `estado` para `DONE`. |
| `BK-MF1-07` | `RF15` | `PARCIAL` | `OK` | Adicionada a secção canonica `## Snippet técnico aplicável` e actualizado `estado` para `DONE`. |
| `BK-MF1-08` | `RF16` | `PARCIAL` | `OK` | Adicionada a secção canonica `## Snippet técnico aplicável` e actualizado `estado` para `DONE`. |

## Correcoes aplicadas

### Correcao estrutural comum aos oito BKs
- Problema corrigido: os guias ja tinham estrutura tutorial, passos lineares, codigo completo, validacao, matriz de testes, expected results, criterios, evidence e handoff, mas faltava a secção `## Snippet técnico aplicável` exigida por `docs/planificacao/scripts/auditar_planificacao.py`.
- Alteracao: adicionada a secção antes de `## Expected results` em todos os guias da `MF1`.
- Decisao pedagogica: a secção nao acrescenta codigo solto. Em vez disso, orienta o aluno a usar o codigo completo dos passos lineares, preservando a regra de executabilidade e evitando fragmentos fora de contexto.
- Resultado: `bash scripts/validate-planificacao.sh` passou com `overall_pass=true`.

### Correcao de estado documental comum aos oito BKs
- Problema corrigido: os cabecalhos mantinham `estado=TODO`, embora o trabalho pedido nesta prompt fosse a hidratacao e validacao documental dos guias, nao a execucao futura do codigo de produto.
- Alteracao: actualizado `estado` para `DONE`, valor permitido pelo template canonico `TODO|IN_PROGRESS|DONE|BLOCKED`.
- Resultado: a `MF1` fica sem pendencias documentais explicitas nos guias auditados.

## Mapa de integração da MF
| BK editado | Ficheiros criados pelo guia | Ficheiros editados pelo guia | Exports produzidos | Imports consumidos de BKs anteriores | Endpoints criados | DTOs/validators criados | Schemas/models criados | Services criados | Componentes/paginas frontend criados | Providers de IA | Recursos sensiveis tratados | BKs seguintes dependentes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BK-MF1-01` | `catalog-query.validator.js`, `catalog.controller.js`, `catalog.routes.js`, `ProductSearchPage.jsx` | `product.service.js`, `app.js`, `apiClient.js`, `App.jsx` | `validateCatalogQuery`, `listCatalogProductsController`, `catalogRoutes`, `ProductSearchPage` | `Product`, `Category`, `SKIN_TYPES`, `apiRequest` | `GET /api/catalog/products` | `validateCatalogQuery` | Reutiliza `Product`, `Category` | `listCatalogProducts` | `ProductSearchPage` | Nenhum | Nenhum | `BK-MF1-02`, `BK-MF3-02` |
| `BK-MF1-02` | `product-id.validator.js`, `product-details.controller.js`, `ProductDetailsPage.jsx` | `product.service.js`, `catalog.routes.js`, `App.jsx` | `validateProductIdParam`, `getProductDetailsController`, `ProductDetailsPage` | `Product`, `catalogRoutes` | `GET /api/catalog/products/:productId` | `validateProductIdParam` | Reutiliza `Product` | `getCatalogProductDetails` | `ProductDetailsPage` | Nenhum | Nenhum | `BK-MF1-03`, `BK-MF1-04` |
| `BK-MF1-03` | `review.model.js`, `review.validator.js`, `review.service.js`, `review.controller.js`, `ProductReviewPage.jsx` | `catalog.routes.js`, `App.jsx` | `Review`, `validateReviewInput`, `createProductReview`, `listProductReviews`, `ProductReviewPage` | `Product`, `requireAuth`, `requireRole`, `ROLES`, `validateProductIdParam` | `GET /api/catalog/products/:productId/reviews`, `POST /api/catalog/products/:productId/reviews` | `validateReviewInput` | `Review` | `createProductReview`, `listProductReviews` | `ProductReviewPage` | Nenhum | Conteudo de utilizador | `BK-MF4-02` |
| `BK-MF1-04` | `related-products.service.js`, `related-products.controller.js`, `RelatedProductsPage.jsx` | `catalog.routes.js`, `App.jsx` | `listRelatedCatalogProducts`, `listRelatedProductsController`, `RelatedProductsPage` | `Product`, `validateProductIdParam` | `GET /api/catalog/products/:productId/related` | Reutiliza `validateProductIdParam` | Reutiliza `Product` | `listRelatedCatalogProducts` | `RelatedProductsPage` | Nenhum | Nenhum | `BK-MF1-05`, `BK-MF3-02` |
| `BK-MF1-05` | `face-consent.model.js`, `face-photo.model.js`, `face-photo.validator.js`, `face-photo-upload.middleware.js`, `face-photo.service.js`, `face-photo.controller.js`, `face-photo.routes.js`, `FacePhotoUploadPage.jsx` | `package.json`, `app.js`, `apiClient.js`, `App.jsx` | `FaceConsent`, `FacePhoto`, `ensureActiveFaceConsent`, `uploadFacePhotos`, `acceptFaceConsent`, `removeUploadedFiles`, `saveFacePhotos`, `FacePhotoUploadPage` | `requireAuth`, `AppError`, `apiRequest` | `POST /api/face-consent`, `POST /api/face-photos` | `validateFaceConsentInput`, `validateUploadedFaceFiles` | `FaceConsent`, `FacePhoto` | `acceptFaceConsent`, `saveFacePhotos`, `removeUploadedFiles` | `FacePhotoUploadPage` | Nenhum | Fotografias faciais e consentimento | `BK-MF1-06`, `BK-MF2-07`, `BK-MF5-01`, `BK-MF5-04` |
| `BK-MF1-06` | `face-analysis.model.js`, `skin-analysis.provider.js`, `face-analysis.service.js`, `face-analysis.controller.js`, `face-analysis.routes.js`, `FaceAnalysisPage.jsx` | `app.js`, `App.jsx` | `FaceAnalysis`, `analyzeSkinPhotos`, `createFaceAnalysisForUser`, `FaceAnalysisPage` | `FacePhoto`, `FaceConsent`, `requireAuth` | `POST /api/face-analyses` | Sem DTO de body; identidade vem da sessao | `FaceAnalysis` | `createFaceAnalysisForUser` | `FaceAnalysisPage` | `skin-analysis.provider.js` | Analise facial e findings derivados | `BK-MF1-07`, `BK-MF2-02` |
| `BK-MF1-07` | `face-report.model.js`, `face-report.service.js`, `face-report.controller.js`, `face-report.routes.js`, `FaceReportPage.jsx` | `app.js`, `App.jsx` | `FaceReport`, `generateReportFromLatestAnalysis`, `FaceReportPage` | `FaceAnalysis`, `requireAuth` | `POST /api/face-reports/latest` | Sem DTO de body; identidade vem da sessao | `FaceReport` | `generateReportFromLatestAnalysis` | `FaceReportPage` | Nenhum | Relatorio derivado de analise facial | `BK-MF1-08`, `BK-MF2-02`, `BK-MF7-05` |
| `BK-MF1-08` | `skin-history.service.js`, `skin-history.controller.js`, `skin-history.routes.js`, `SkinHistoryPage.jsx` | `app.js`, `App.jsx` | `getPersonalSkinHistory`, `getMySkinHistoryController`, `skinHistoryRoutes`, `SkinHistoryPage` | `FaceAnalysis`, `FaceReport`, `requireAuth` | `GET /api/me/skin-history` | Sem DTO de body; query `userId` nao controla ownership | Reutiliza `FaceAnalysis`, `FaceReport` | `getPersonalSkinHistory` | `SkinHistoryPage` | Nenhum | Historico pessoal de analises e relatorios | `BK-MF2-01`, `BK-MF3-01` |

Confirmacoes de integracao:
- Nao foram criados endpoints duplicados.
- Nao foram criados schemas duplicados.
- Nao foram alterados nomes de entidades, DTOs, services, controllers, routes ou componentes.
- Nenhum frontend passou a chamar endpoint novo ou inexistente.
- Nenhum service passou a importar ficheiro novo.
- A correcao foi documental e estrutural; os contratos tecnicos dos BKs mantiveram-se.

## Coerencia global da MF
- O eixo de catalogo (`BK-MF1-01` a `BK-MF1-04`) continua coerente com produto/categoria da `MF0`.
- O eixo de reviews continua a aplicar autenticação, role e ownership no backend.
- O eixo biometrico (`BK-MF1-05` a `BK-MF1-08`) continua a preservar consentimento, minimização, ownership e ausencia de paths internos nas respostas.
- A nova secção canónica existe em todos os BKs sem introduzir codigo adicional solto no fim dos ficheiros.

## Decisoes tecnicas confirmadas
- CANONICO: backend Node.js + Express, frontend React + Vite, MongoDB/Mongoose.
- CANONICO: sessão autenticada por cookie `HttpOnly`, enviada no frontend com `credentials: "include"`.
- CANONICO: porta de backend por defeito nos guias `MF0` e `apiClient`: `3001`.
- CANONICO: reviews de `RF11` pertencem ao ator cliente.
- CANONICO: fotografias faciais frontal e perfil exigem consentimento explícito e ownership.
- CANONICO: relatorio e historico facial nao devem devolver paths internos nem dados de outro utilizador.

## Decisoes marcadas como DERIVADO
- DERIVADO: a secção `## Snippet técnico aplicável` foi preenchida como orientação estrutural para os passos lineares, sem acrescentar codigo novo solto, porque o template e o validador exigem a secção mas a prompt proibe fragmentos finais sem integração.
- DERIVADO: `estado=DONE` nos cabecalhos representa conclusao documental da hidratacao dos guias `MF1`, nao conclusao da implementação de produto.
- DERIVADO: `BK-MF1-04` foi editado nesta execução apesar do relatorio anterior o declarar `OK`, porque o validador oficial ainda o classificava na pratica como incompleto por faltar a secção canónica.

## Drift documental encontrado
- Drift encontrado: o relatorio existente dizia que `bash scripts/validate-planificacao.sh` falhava por caminho inexistente para `../scripts/validate_planificacao_canonica.py`, mas o script atual executa `docs/planificacao/scripts/auditar_planificacao.py` e corre corretamente.
- Drift encontrado: o relatorio existente marcava `OK=8`, mas a revalidacao oficial inicial ainda devolvia `missing_pedagogic_or_operational_blocks` para todos os BKs MF1.
- Drift corrigido: os oito guias MF1 passaram a conter a secção canónica exigida pelo validador e estado documental `DONE`.

## Riscos de segurança/privacidade restantes
- Nenhum risco novo foi introduzido por esta correcao estrutural.
- Mantem-se a necessidade de validar a implementacao real de upload facial, consentimento, minimização, encriptação futura, eliminação/anonymização e auditoria biométrica nos BKs/RNFs correspondentes.
- Como os BKs tratam fotografias e relatorios faciais, qualquer implementação posterior deve continuar a rejeitar tokens em `localStorage`, paths internos em respostas e ownership decidido pelo frontend.

## Verificacoes textuais executadas

### Comando textual oficial
```bash
rg -n "StudyFlow|sala de estudo|turma oficial|disciplina|material oficial|IA da sala|IA da turma|professor|aluno inscrito|hidrata|pós-auditoria|scaffold|roteiro genérico|conversa interna|este guia deixa de ser|código ainda não corrigido|snippet|exemplo simplificado|implementar depois|quando aplicável|helpers chamados|substitu(ir|i)r? mocks|pseudo-código|solução parcial|payload: unknown|as any|ContextAction|contextApi" docs/planificacao/guias-bk/MF1/*.md
```

Resultado: sem ocorrencias nos BKs da `MF1` (`exit code 1` do `rg`, sem output, significa que nao houve matches).

## Validacao automatica
- `git diff --check`: `PASS` (`exit code 0`, sem output).
- `bash scripts/validate-planificacao.sh`: `PASS` (`overall_pass=true`).

Resumo do validador:
```json
{
  "coverage_pass": true,
  "consistency_pass": true,
  "guides_pass": true,
  "naming_pass": true,
  "overall_pass": true
}
```

## Resumo da correcao
- MF processada: `MF1`.
- Numero de BKs analisados: `8`.
- Contagem OK/PARCIAL/CRITICO antes:
  - Relatorio existente: `OK=8`, `PARCIAL=0`, `CRITICO=0`.
  - Revalidacao oficial inicial desta execução: `OK=0`, `PARCIAL=8`, `CRITICO=0`.
- Contagem OK/PARCIAL/CRITICO depois: `OK=8`, `PARCIAL=0`, `CRITICO=0`.
- BKs editados: `BK-MF1-01`, `BK-MF1-02`, `BK-MF1-03`, `BK-MF1-04`, `BK-MF1-05`, `BK-MF1-06`, `BK-MF1-07`, `BK-MF1-08`.
- Principais lacunas corrigidas: ausência da secção canónica `## Snippet técnico aplicável` nos oito BKs MF1 e cabeçalhos ainda marcados como `estado=TODO`.
- Decisões técnicas confirmadas: catalogo separado de recomendacao, sessão por cookie, role cliente em reviews, ownership por sessão, provider IA isolado, minimização de dados biometricos.
- Decisões marcadas como `DERIVADO`: usar a secção canónica como referência aos passos lineares, sem codigo solto; usar `estado=DONE` como fecho documental; editar `BK-MF1-04` apesar do relatorio anterior o marcar `OK`, por falha objetiva no validador.
- Drift documental encontrado: relatório anterior e estado real do validador estavam desalinhados.
- Riscos de segurança/privacidade restantes: nenhum novo risco por esta alteração; manter validação rigorosa dos fluxos biometricos nas implementações reais.
- Verificações textuais executadas: comando oficial de termos proibidos, sem ocorrencias.
- Resultado de `git diff --check`: `PASS`.
- Resultado de `bash scripts/validate-planificacao.sh`: `PASS`.
- Bloqueios ou TODOs restantes: nenhum blocker documental para a `MF1` no validador atual.
