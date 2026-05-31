# Auditoria de hidratacao pedagogica/tecnica - MF1

## Header
- `doc_id`: `AUDITORIA-HIDRATACAO-MF1`
- `mf_alvo`: `MF1`
- `modo`: `corrigir_apenas`
- `data_execucao`: `2026-05-31`
- `relatorio`: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF1.md`

## Objetivo
Usar a reauditoria existente da `MF1` como ponto de partida, corrigir apenas os guias classificados como `PARCIAL` ou `CRITICO`, e deixar a macrofase pronta para ser seguida por alunos sem drifts de contrato, autenticação ou privacidade.

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
| Antes desta correcao, segundo relatorio MF1 existente | 1 | 6 | 1 | 8 |
| Depois desta correcao | 8 | 0 | 0 | 8 |

## BKs editados
- `BK-MF1-01`
- `BK-MF1-02`
- `BK-MF1-03`
- `BK-MF1-05`
- `BK-MF1-06`
- `BK-MF1-07`
- `BK-MF1-08`

`BK-MF1-04` nao foi editado porque ja estava classificado como `OK`.

## Resultado por BK
| BK | RF | Estado antes | Estado depois | Correcao principal |
| --- | --- | --- | --- | --- |
| `BK-MF1-01` | `RF09` | `PARCIAL` | `OK` | A pesquisa por marca passou a escapar caracteres antes de criar regex; comandos finais usam `localhost:3001`. |
| `BK-MF1-02` | `RF10` | `PARCIAL` | `OK` | Comandos de validacao de detalhe usam a porta canonica do backend, `localhost:3001`. |
| `BK-MF1-03` | `RF11` | `PARCIAL` | `OK` | Criacao de review passou a exigir `requireRole(ROLES.CLIENTE)`, com negativo `403`. |
| `BK-MF1-04` | `RF12` | `OK` | `OK` | Sem alteracoes. Mantem relacionados por catalogo, sem confundir com recomendacao personalizada. |
| `BK-MF1-05` | `RF13` | `CRITICO` | `OK` | Upload facial valida consentimento antes de `multer.diskStorage` e limpa ficheiros em erros posteriores ao upload. |
| `BK-MF1-06` | `RF14` | `PARCIAL` | `OK` | Validacao autenticada usa cookie `orelle_session` e `localhost:3001`. |
| `BK-MF1-07` | `RF15` | `PARCIAL` | `OK` | Validacao autenticada usa cookie `orelle_session` e `localhost:3001`. |
| `BK-MF1-08` | `RF16` | `PARCIAL` | `OK` | Testes de ownership usam cookies de utilizadores distintos e `localhost:3001`. |

## Correcoes aplicadas

### BK-MF1-01
- Problema corrigido: regex criada diretamente a partir de input do cliente.
- Alteracao: adicionado `escapeRegexText(value)` e uso de `new RegExp(escapedBrandName, "i")`.
- Validacao pedagogica: o guia agora manda testar `brandName=[` para provar que caracteres especiais sao tratados como texto.
- Drift corrigido: comandos finais mudaram de `localhost:3000` para `localhost:3001`.

### BK-MF1-02
- Problema corrigido: comandos de detalhe usavam porta divergente.
- Alteracao: todos os exemplos de `curl` do BK usam `http://localhost:3001/api/...`.
- Risco removido: falso negativo em validacao manual por testar a porta errada.

### BK-MF1-03
- Problema corrigido: o endpoint autenticava utilizador, mas nao confirmava que o ator era cliente.
- Alteracao: a route importa `requireRole` e `ROLES`, e protege `POST /api/catalog/products/:productId/reviews` com `requireRole(ROLES.CLIENTE)`.
- Validacao pedagogica: acrescentado negativo `403` para sessao autenticada sem role `cliente`.
- Risco removido: consultor ou administrador a criar conteudo de cliente.

### BK-MF1-05
- Problema corrigido: `multer.diskStorage` podia escrever fotografia facial antes de consentimento efetivo.
- Alteracao: adicionado middleware `ensureActiveFaceConsent` antes de `uploadFacePhotos`.
- Alteracao: `removeUploadedFiles` passou a ser exportado pelo service e usado pelo controller em erros de validacao/upload parcial.
- Alteracao: `saveFacePhotos` limpa ficheiros em qualquer erro depois de receber ficheiros, incluindo ausencia defensiva de consentimento.
- Validacao pedagogica: acrescentados cenarios de upload sem consentimento, upload incompleto e confirmacao de ausencia de ficheiro orfao.
- Risco removido: ficheiros biometricos sem registo persistente ou sem base legal ativa.

### BK-MF1-06
- Problema corrigido: validacao de analise facial usava contrato de token e porta errada.
- Alteracao: comandos de validacao usam `Cookie: orelle_session=...` e `localhost:3001`.
- Validacao pedagogica: o texto explica que o frontend usa `credentials: "include"` e nao cria outro sistema de autenticacao.

### BK-MF1-07
- Problema corrigido: validacao de relatorio personalizado usava contrato de token e porta errada.
- Alteracao: comandos de validacao usam `Cookie: orelle_session=...` e `localhost:3001`.
- Risco removido: incentivo a autenticação paralela para um fluxo derivado de dados biometricos.

### BK-MF1-08
- Problema corrigido: testes de ownership usavam token e porta errada.
- Alteracao: os pedidos usam cookies de `UTILIZADOR_A` e `UTILIZADOR_B` para provar isolamento por sessao.
- Validacao pedagogica: mantido o negativo com `?userId=ID_UTILIZADOR_B`, mas o backend continua a depender de `req.user.id`.

## Mapa de integração da MF
| BK editado | Ficheiros criados pelo guia | Ficheiros editados pelo guia | Exports/produtos | Imports consumidos | Endpoints | DTOs/validators | Schemas/models | Services/providers | Componentes frontend | Recursos sensiveis | BKs seguintes dependentes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BK-MF1-01` | `catalog-query.validator.js`, `catalog.controller.js`, `catalog.routes.js`, `ProductSearchPage.jsx` | `product.service.js`, `app.js`, `apiClient.js`, `App.jsx` | `validateCatalogQuery`, `listCatalogProducts`, `catalogRoutes`, `ProductSearchPage` | `Product`, `Category`, `SKIN_TYPES`, `apiRequest` | `GET /api/catalog/products` | `validateCatalogQuery` | `Product`, `Category` reutilizados | `listCatalogProducts` | `ProductSearchPage` | Nenhum | `BK-MF1-02`, `BK-MF3-02` |
| `BK-MF1-02` | `product-id.validator.js`, `product-details.controller.js`, `ProductDetailsPage.jsx` | `product.service.js`, `catalog.routes.js`, `App.jsx` | `validateProductIdParam`, `getCatalogProductDetails`, `ProductDetailsPage` | `Product`, `catalogRoutes`, `ProductSearchPage` | `GET /api/catalog/products/:productId` | `validateProductIdParam` | `Product` reutilizado | `getCatalogProductDetails` | `ProductDetailsPage` | Nenhum | `BK-MF1-03`, `BK-MF1-04` |
| `BK-MF1-03` | `review.model.js`, `review.validator.js`, `review.service.js`, `review.controller.js`, `ProductReviewPage.jsx` | `catalog.routes.js`, `App.jsx` | `Review`, `validateReviewInput`, `createProductReview`, `listProductReviews`, `ProductReviewPage` | `Product`, `requireAuth`, `requireRole`, `ROLES`, `validateProductIdParam` | `GET/POST /api/catalog/products/:productId/reviews` | `validateReviewInput` | `Review` | `createProductReview`, `listProductReviews` | `ProductReviewPage` | Conteudo de utilizador | `BK-MF4-02` |
| `BK-MF1-05` | `face-consent.model.js`, `face-photo.model.js`, `face-photo.validator.js`, `face-photo-upload.middleware.js`, `face-photo.service.js`, `face-photo.controller.js`, `face-photo.routes.js`, `FacePhotoUploadPage.jsx` | `package.json`, `app.js`, `apiClient.js`, `App.jsx` | `FaceConsent`, `FacePhoto`, `ensureActiveFaceConsent`, `uploadFacePhotos`, `acceptFaceConsent`, `removeUploadedFiles`, `saveFacePhotos`, `FacePhotoUploadPage` | `requireAuth`, `multer`, `apiRequest`, `AppError` | `POST /api/face-consent`, `POST /api/face-photos` | `validateFaceConsentInput`, `validateUploadedFaceFiles` | `FaceConsent`, `FacePhoto` | `acceptFaceConsent`, `saveFacePhotos`, `removeUploadedFiles` | `FacePhotoUploadPage` | Fotografias faciais, consentimento | `BK-MF1-06`, `BK-MF2-07`, `BK-MF5-01`, `BK-MF5-04` |
| `BK-MF1-06` | `face-analysis.model.js`, `skin-analysis.provider.js`, `face-analysis.service.js`, `face-analysis.controller.js`, `face-analysis.routes.js`, `FaceAnalysisPage.jsx` | `app.js`, `App.jsx` | `FaceAnalysis`, `analyzeSkinPhotos`, `createFaceAnalysisForUser`, `FaceAnalysisPage` | `FacePhoto`, `FaceConsent`, `requireAuth` | `POST /api/face-analyses` | Sem DTO novo de body; usa sessao | `FaceAnalysis`, `FacePhoto`, `FaceConsent` | `skin-analysis.provider`, `face-analysis.service` | `FaceAnalysisPage` | Analise facial e findings derivados | `BK-MF1-07`, `BK-MF2-02` |
| `BK-MF1-07` | `face-report.model.js`, `face-report.service.js`, `face-report.controller.js`, `face-report.routes.js`, `FaceReportPage.jsx` | `app.js`, `App.jsx` | `FaceReport`, `generateReportFromLatestAnalysis`, `FaceReportPage` | `FaceAnalysis`, `requireAuth` | `POST /api/face-reports/latest` | Sem DTO novo de body; usa sessao | `FaceReport`, `FaceAnalysis` | `face-report.service` | `FaceReportPage` | Relatorio derivado de analise facial | `BK-MF1-08`, `BK-MF2-02`, `BK-MF7-05` |
| `BK-MF1-08` | `skin-history.service.js`, `skin-history.controller.js`, `skin-history.routes.js`, `SkinHistoryPage.jsx` | `app.js`, `App.jsx` | `getPersonalSkinHistory`, `SkinHistoryPage` | `FaceAnalysis`, `FaceReport`, `requireAuth` | `GET /api/me/skin-history` | Sem DTO novo de body; query `userId` e ignorada por ownership | `FaceAnalysis`, `FaceReport` reutilizados | `skin-history.service` | `SkinHistoryPage` | Historico pessoal de analises e relatorios | `BK-MF2-01`, `BK-MF3-01` |

Confirmacoes de integracao:
- Nao ha dois endpoints para a mesma acao.
- Nao ha novo schema duplicado de produto, review, fotografia, analise, relatorio ou historico.
- O frontend continua a usar endpoints reais sob `http://localhost:3001/api`.
- Os fluxos autenticados usam cookie `orelle_session` e `credentials: "include"`.
- `BK-MF1-05` passa a ser uma base mais segura para `BK-MF1-06`, `BK-MF5-01` e `BK-MF5-04`.

## Coerencia global da MF
- O eixo de catalogo (`BK-MF1-01` a `BK-MF1-04`) fica coerente com produto/categoria da `MF0`.
- O eixo de reviews aplica autenticação, role e ownership no backend.
- O eixo biometrico (`BK-MF1-05` a `BK-MF1-08`) preserva consentimento, minimização, ownership e ausencia de paths internos nas respostas.
- Pesquisa de catalogo, produtos relacionados, analise facial, relatorio e historico continuam semanticamente separados.

## Decisoes tecnicas confirmadas
- CANONICO: backend Node.js + Express, frontend React + Vite, MongoDB/Mongoose.
- CANONICO: sessão autenticada por cookie `HttpOnly`, enviada no frontend com `credentials: "include"`.
- CANONICO: porta de backend por defeito nos guias `MF0` e `apiClient`: `3001`.
- CANONICO: reviews de `RF11` pertencem ao ator cliente.
- CANONICO: fotografias faciais frontal e perfil exigem consentimento explícito e ownership.
- CANONICO: relatorio e historico facial nao devem devolver paths internos nem dados de outro utilizador.

## Decisoes marcadas como DERIVADO
- DERIVADO: `BK-MF1-01` usa `brandName` herdado de `RF06`/`RF09`, preparado em `BK-MF0-07`.
- DERIVADO: `BK-MF1-01` usa regex escapada para pesquisa parcial por marca, mantendo input tratado como texto.
- DERIVADO: `BK-MF1-04` mantém semelhança por catalogo enquanto nao existe historico real de compras.
- DERIVADO: `BK-MF1-05` antecipa consentimento minimo antes da fase RNF propria (`MF7`), porque `RF13` ja trata dados biometricos.
- DERIVADO: `BK-MF1-06` usa provider local controlado ate haver provider externo validado.
- DERIVADO: `BK-MF1-07` sugere rotina cosmetica sem recomendacao personalizada de produto, preservando `RF18` para `MF2`.

## Drift documental encontrado
- Corrigido: porta `localhost:3000` em comandos MF1 foi alinhada para `localhost:3001`.
- Corrigido: validacoes autenticadas por token foram substituidas por cookie `orelle_session`.
- Corrigido: `BK-MF1-03` passou a aplicar `requireRole(ROLES.CLIENTE)`.
- Corrigido: `BK-MF1-05` passou a validar consentimento antes de `multer.diskStorage` e a limpar ficheiros em erros posteriores.
- Bloqueio externo ainda presente: `scripts/validate-planificacao.sh` aponta para `../scripts/validate_planificacao_canonica.py`, caminho inexistente neste checkout.

## Riscos de segurança/privacidade restantes
- Baixo: os BKs foram corrigidos documentalmente, mas a aplicacao real só fica comprovada depois de os alunos implementarem o código e correrem testes de backend/frontend.
- Medio: o validador canonico de planificacao nao executa por erro de caminho, logo nao houve validacao automatica completa da planificacao.
- A acompanhar em fases futuras: encriptação de ficheiros biometricos, pedidos de eliminação/anonymização e auditoria de acessos biometricos continuam reservados aos BKs posteriores declarados.

## Verificacoes textuais executadas

### Comando textual oficial
```bash
rg -n "StudyFlow|sala de estudo|turma oficial|disciplina|material oficial|IA da sala|IA da turma|professor|aluno inscrito|hidrata|pós-auditoria|scaffold|roteiro genérico|conversa interna|este guia deixa de ser|código ainda não corrigido|snippet|exemplo simplificado|implementar depois|quando aplicável|helpers chamados|substitu(ir|i)r? mocks|pseudo-código|solução parcial|payload: unknown|as any|ContextAction|contextApi" docs/planificacao/guias-bk/MF1/*.md
```
Resultado: sem ocorrencias nos BKs da `MF1`.

### Verificacao adicional de drift corrigido
```bash
rg -n "localhost:3000|Authorization: Bearer|new RegExp\(filters\.brandName" docs/planificacao/guias-bk/MF1/*.md
```
Resultado: sem ocorrencias.

## Validacao automatica
- `git diff --check`: `PASS` (`exit code 0`, sem output).
- `bash scripts/validate-planificacao.sh`: `FAIL` (`exit code 2`).

Erro observado:

```text
/opt/homebrew/Cellar/python@3.14/3.14.5/Frameworks/Python.framework/Versions/3.14/Resources/Python.app/Contents/MacOS/Python: can't open file '/Users/nuno/Developer/EPMS/Terceiro Ano/2025.2026/PAP/orelle/../scripts/validate_planificacao_canonica.py': [Errno 2] No such file or directory
```

Diagnostico: falha de infraestrutura/caminho no script, nao causada pelas edicoes aos BKs da `MF1`.

## Resumo da correcao
- MF processada: `MF1`.
- Numero de BKs analisados: `8`.
- Contagem antes: `OK=1`, `PARCIAL=6`, `CRITICO=1`.
- Contagem depois: `OK=8`, `PARCIAL=0`, `CRITICO=0`.
- BKs editados: `BK-MF1-01`, `BK-MF1-02`, `BK-MF1-03`, `BK-MF1-05`, `BK-MF1-06`, `BK-MF1-07`, `BK-MF1-08`.
- Principais lacunas corrigidas: regex de marca insegura, porta divergente, RBAC em reviews, ordem consentimento/upload, limpeza de ficheiros biometricos, validacoes por cookie.
- Decisões técnicas confirmadas: catalogo publico separado de recomendacao, sessão por cookie, role cliente em reviews, ownership por sessão, provider IA isolado.
- Decisões `DERIVADO`: pesquisa parcial por marca com regex escapada, relacionados por catalogo, consentimento minimo antecipado, provider local controlado, rotina cosmetica sem compra automatica.
- Drift documental encontrado: todos os drifts registados na reauditoria MF1 foram corrigidos nos BKs; permanece blocker externo no script de validação.
- Riscos de segurança/privacidade restantes: riscos altos da MF1 foram removidos documentalmente; validação automatica completa continua bloqueada pelo script.
- Verificações textuais executadas: comando oficial sem ocorrencias; verificacao adicional sem ocorrencias para porta/token/regex direta.
- Resultado de `git diff --check`: `PASS`.
- Resultado de `bash scripts/validate-planificacao.sh`: `FAIL`, por caminho inexistente para `../scripts/validate_planificacao_canonica.py`.
- Bloqueios ou TODOs restantes: corrigir o caminho do validador de planificacao; executar testes reais quando os BKs forem implementados no código da app.
