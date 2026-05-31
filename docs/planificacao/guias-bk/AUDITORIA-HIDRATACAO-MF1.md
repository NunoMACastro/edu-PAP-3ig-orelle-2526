# Auditoria de hidratacao pedagogica/tecnica - MF1

## Header
- `doc_id`: `AUDITORIA-HIDRATACAO-MF1`
- `macro`: `MF1`
- `path`: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF1.md`
- `area`: `planificacao`
- `status`: `auditar_apenas_concluido`
- `modo`: `auditar_apenas`
- `last_updated`: `2026-05-31`

## Objetivo
Auditar os guias BK da macrofase `MF1` sem editar os BKs dos alunos, verificando se continuam completos, pedagogicos, tecnicamente executaveis e coerentes com a documentacao canonica da Orelle.

Esta execucao atualiza apenas este relatorio. Os ficheiros em `docs/planificacao/guias-bk/MF1/` nao foram alterados.

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
- Todos os BKs em `docs/planificacao/guias-bk/MF0/`
- Todos os BKs em `docs/planificacao/guias-bk/MF1/`
- BKs posteriores com dependencia direta de MF1: `BK-MF2-01`, `BK-MF2-02`, `BK-MF2-07`, `BK-MF3-01`, `BK-MF4-02`, `BK-MF5-01`, `BK-MF5-04`.

## Documentos em falta
Nenhum documento obrigatorio em falta.

## Snapshot

| Momento | OK | PARCIAL | CRITICO | Total |
| --- | ---: | ---: | ---: | ---: |
| Antes desta auditoria, segundo o relatorio MF1 existente | 8 | 0 | 0 | 8 |
| Depois desta auditoria | 8 | 0 | 0 | 8 |

Nota historica: o relatorio anterior registava uma execucao de correcao em que os 8 BKs tinham passado de `PARCIAL` para `OK`. Esta execucao apenas reaudita esse estado.

## Criterio aplicado
Um BK foi considerado `OK` quando cumpriu cumulativamente:
- metadados alinhados com `MATRIZ-CANONICA-BK.md` e `BACKLOG-MVP.md`;
- objetivo, importancia, scope-in, scope-out, pre-requisitos, dependencias e handoff;
- conceitos teoricos suficientes para dominio, backend, frontend, seguranca, privacidade, IA ou comercio;
- passos no formato obrigatorio `### Passo N - Nome claro` com os 7 pontos pedidos;
- codigo completo e integrado, sem helpers por criar nem pseudo-codigo;
- explicacao didatica depois de cada bloco de codigo;
- validacao por passo, cenarios negativos, expected results, criterios de aceite e evidence;
- ausencia de linguagem interna proibida nos BKs dos alunos;
- aplicacao de sessao, ownership, consentimento e minimizacao quando ha dados sensiveis.

## Resultado por BK

| BK | RF | Estado | Fundamentacao principal |
| --- | --- | --- | --- |
| `BK-MF1-01` | `RF09` | `OK` | Pesquisa e filtragem usam endpoint publico, validator de query, service integrado com `Product`/`Category`, UI com estados e resposta publica minimizada. |
| `BK-MF1-02` | `RF10` | `OK` | Detalhe de produto valida `ObjectId`, devolve 400/404, separa valores temporarios honestos de reviews/relacionados e prepara `BK-MF1-03`/`BK-MF1-04`. |
| `BK-MF1-03` | `RF11` | `OK` | Reviews exigem sessao, usam ownership por `req.user.id`, validam rating/comentario, tratam duplicado com `409` e nao expõem `userId`/`passwordHash`. |
| `BK-MF1-04` | `RF12` | `OK` | Produtos relacionados usam regra `DERIVADO` por catalogo, sem inventar collaborative filtering, com endpoint real e lista vazia honesta quando nao ha criterios. |
| `BK-MF1-05` | `RF13` | `OK` | Upload facial exige sessao e consentimento, valida frontal/perfil, usa storage privado, minimiza resposta e prepara eliminacao/anonymizacao/auditoria posteriores. |
| `BK-MF1-06` | `RF14` | `OK` | Analise facial usa provider isolado, bloqueia sem consentimento/fotografias, aplica ownership, limita linguagem nao-medica e explicita fallback/guardrails. |
| `BK-MF1-07` | `RF15` | `OK` | Relatorio usa ultima analise concluida do utilizador, gera diagnostico cosmetico limitado, rotina sem compra automatica, fontes/limitations e handoff para historico. |
| `BK-MF1-08` | `RF16` | `OK` | Historico pessoal usa rota `/api/me/skin-history`, filtra por sessao, aplica `.select(...)`, nao aceita `userId` externo e prepara MF2/MF3. |

## BKs editados nesta execucao
Nenhum. O modo recebido foi `auditar_apenas`.

## BKs PARCIAL ou CRITICO
Nenhum BK da `MF1` ficou classificado como `PARCIAL` ou `CRITICO` nesta auditoria.

## Lacunas corrigidas nesta execucao
Nenhuma lacuna foi corrigida nos BKs porque o modo nao permitia edicao. A auditoria confirmou que as lacunas anteriormente reportadas como corrigidas continuam encerradas na `MF1`.

## Mapa de integracao da MF

| BK | Ficheiros criados previstos | Ficheiros editados previstos | Exports produzidos | Imports consumidos de BKs anteriores | Endpoints criados | DTOs/validators criados | Schemas/models criados | Services/controllers criados | Frontend criado | Providers IA | Recursos sensiveis | BKs seguintes dependentes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BK-MF1-01` | `catalog-query.validator.js`, `catalog.controller.js`, `catalog.routes.js`, `ProductSearchPage.jsx` | `product.service.js`, `app.js`, `apiClient.js`, `App.jsx` | `validateCatalogQuery`, `listCatalogProducts`, `catalogRoutes` | `Product`, `Category`, `SKIN_TYPES`, `apiRequest` | `GET /api/catalog/products` | `catalog-query.validator.js` | `Product`, `Category` reutilizados | `product.service.js`, `catalog.controller.js` | `ProductSearchPage.jsx` | Nenhum | Nenhum | `BK-MF1-02`, `BK-MF3-02` |
| `BK-MF1-02` | `product-id.validator.js`, `product-details.controller.js`, `ProductDetailsPage.jsx` | `product.service.js`, `catalog.routes.js`, `App.jsx` | `validateProductIdParam`, `getCatalogProductDetails` | `Product`, `catalogRoutes`, `ProductSearchPage` | `GET /api/catalog/products/:productId` | `product-id.validator.js` | `Product` reutilizado | `product.service.js`, `product-details.controller.js` | `ProductDetailsPage.jsx` | Nenhum | Nenhum | `BK-MF1-03`, `BK-MF1-04` |
| `BK-MF1-03` | `review.model.js`, `review.validator.js`, `review.service.js`, `review.controller.js`, `ProductReviewPage.jsx` | `catalog.routes.js`, `App.jsx` | `Review`, `validateReviewInput`, `createProductReview`, `listProductReviews` | `Product`, `requireAuth`, `validateProductIdParam` | `GET/POST /api/catalog/products/:productId/reviews` | `review.validator.js` | `Review` | `review.service.js`, `review.controller.js` | `ProductReviewPage.jsx` | Nenhum | Comentarios de utilizador | `BK-MF4-02` |
| `BK-MF1-04` | `related-products.service.js`, `related-products.controller.js`, `RelatedProductsPage.jsx` | `catalog.routes.js`, `App.jsx` | `listRelatedCatalogProducts` | `Product`, `validateProductIdParam` | `GET /api/catalog/products/:productId/related` | Reutiliza `product-id.validator.js` | `Product` reutilizado | `related-products.service.js`, `related-products.controller.js` | `RelatedProductsPage.jsx` | Nenhum | Nenhum | `BK-MF2-02`, `BK-MF3-02` |
| `BK-MF1-05` | `face-consent.model.js`, `face-photo.model.js`, `face-photo.validator.js`, `face-photo-upload.middleware.js`, `face-photo.service.js`, `face-photo.controller.js`, `face-photo.routes.js`, `FacePhotoUploadPage.jsx` | `server/package.json`, `app.js`, `apiClient.js`, `App.jsx` | `FaceConsent`, `FacePhoto`, `uploadFacePhotos`, `acceptFaceConsent`, `saveFacePhotos` | `requireAuth`, `multer`, `apiRequest` | `POST /api/face-consent`, `POST /api/face-photos` | `face-photo.validator.js` | `FaceConsent`, `FacePhoto` | `face-photo.service.js`, `face-photo.controller.js` | `FacePhotoUploadPage.jsx` | Nenhum | Fotografias faciais, consentimento | `BK-MF1-06`, `BK-MF2-07`, `BK-MF5-01`, `BK-MF5-04` |
| `BK-MF1-06` | `face-analysis.model.js`, `skin-analysis.provider.js`, `face-analysis.service.js`, `face-analysis.controller.js`, `face-analysis.routes.js`, `FaceAnalysisPage.jsx` | `app.js`, `App.jsx` | `FaceAnalysis`, `analyzeSkinPhotos`, `createFaceAnalysisForUser` | `FacePhoto`, `FaceConsent`, `requireAuth` | `POST /api/face-analyses` | Contrato interno do service | `FaceAnalysis`, `FacePhoto`, `FaceConsent` | `face-analysis.service.js`, `face-analysis.controller.js` | `FaceAnalysisPage.jsx` | `skin-analysis.provider.js` | Analise facial, findings biometricos derivados | `BK-MF1-07`, `BK-MF2-02` |
| `BK-MF1-07` | `face-report.model.js`, `face-report.service.js`, `face-report.controller.js`, `face-report.routes.js`, `FaceReportPage.jsx` | `app.js`, `App.jsx` | `FaceReport`, `generateReportFromLatestAnalysis` | `FaceAnalysis`, `requireAuth` | `POST /api/face-reports/latest` | Contrato interno do service | `FaceReport`, `FaceAnalysis` | `face-report.service.js`, `face-report.controller.js` | `FaceReportPage.jsx` | Nenhum novo | Relatorio de analise | `BK-MF1-08`, `BK-MF2-02`, `BK-MF7-05` |
| `BK-MF1-08` | `skin-history.service.js`, `skin-history.controller.js`, `skin-history.routes.js`, `SkinHistoryPage.jsx` | `app.js`, `App.jsx` | `getPersonalSkinHistory` | `FaceAnalysis`, `FaceReport`, `requireAuth` | `GET /api/me/skin-history` | Ownership por sessao | `FaceAnalysis`, `FaceReport` | `skin-history.service.js`, `skin-history.controller.js` | `SkinHistoryPage.jsx` | Nenhum | Historico pessoal de analises e relatorios | `BK-MF2-01`, `BK-MF3-01` |

## Coerencia global da MF
- Nao foram encontrados dois endpoints para a mesma acao.
- Nao foram encontrados dois schemas para a mesma entidade dentro da `MF1`.
- Os conceitos `Product`, `Category`, `Review`, `FaceConsent`, `FacePhoto`, `FaceAnalysis`, `FaceReport` e historico aparecem com nomes consistentes.
- O frontend chama endpoints definidos nos respetivos BKs.
- Os fluxos sensiveis (`RF13` a `RF16`) usam sessao/ownership no backend e nao dependem de `userId` enviado pelo frontend.
- Os BKs posteriores dependentes encontram handoff explicito para fotografia, analise, relatorio, historico e reviews.

## Decisoes tecnicas confirmadas
- CANONICO: `RF09` a `RF12` pertencem ao dominio de catalogo/produto.
- CANONICO: `RF13` exige upload de fotografias frontal e perfil.
- CANONICO: `RF14` analisa tipo de pele, acne, manchas, rugas e oleosidade.
- CANONICO: `RF15` gera relatorio personalizado com diagnostico cosmetico e sugestoes de rotina.
- CANONICO: `RF16` guarda analise no historico pessoal.
- CANONICO: `RNF12` exige consentimento explicito antes da analise facial.
- CANONICO: `RNF14` exige sessoes com cookies HttpOnly; MF1 deve continuar a usar `credentials: "include"`.
- CANONICO: `RNF23`, `RNF24` e `RNF25` afetam diretamente a forma como IA e recomendacoes devem ser explicadas, limitadas e auditaveis.

## Decisoes marcadas como DERIVADO
- DERIVADO: `brandName` e necessario em catalogo porque `RF09` filtra por marca e `RF06` fala de marcas favoritas.
- DERIVADO: `BK-MF1-04` usa regras de catalogo para produtos semelhantes/complementares enquanto nao existe historico real de compras.
- DERIVADO: `BK-MF1-05` antecipa consentimento minimo de `RNF12`, apesar de o BK RNF canonico de consentimento estar em `MF7`.
- DERIVADO: `BK-MF1-06` usa provider local controlado enquanto a integracao externa completa fica para `RNF18`.
- DERIVADO: `BK-MF1-07` cria sugestoes de rotina cosmetica sem recomendacao personalizada de produto, preservando `RF18` para `MF2`.

## Drift documental encontrado
- Sem drift novo encontrado nesta auditoria entre matriz, backlog, anexos e headers dos BKs da `MF1`.
- Mantido como decisao documentada: `RNF12` aparece canonicamente como BK de `MF7`, mas `MF1` precisa de consentimento minimo para nao guardar/processar fotografia facial sem base explicita.
- Mantido fora de escopo: BKs posteriores que dependem de `MF1` continuam com hidratacao propria a avaliar quando essas macrofases forem processadas.
- Mantido como bloqueio externo: `scripts/validate-planificacao.sh` aponta para um ficheiro inexistente fora da raiz atual do repositorio.

## Riscos de seguranca/privacidade restantes
- Fotografias faciais e relatorios continuam dependentes de hardening posterior de encriptacao (`RNF11`) e processos de eliminacao/anonymizacao (`RF41`).
- O storage local privado fica minimizado e sem paths na resposta, mas a encriptacao de ficheiros pertence a BK posterior.
- O provider de IA fica isolado e limitado, mas a integracao externa futura deve manter consentimento, nao-discriminacao, fontes e limites de uso de dados.
- Historico e relatorios devolvem dados minimizados, mas paginacao/auditoria de acessos podem ser aprofundadas quando o volume crescer.

## Verificacoes textuais executadas

### Comando textual oficial

```bash
rg -n "StudyFlow|sala de estudo|turma oficial|disciplina|material oficial|IA da sala|IA da turma|professor|aluno inscrito|hidrata|pós-auditoria|scaffold|roteiro genérico|conversa interna|este guia deixa de ser|código ainda não corrigido|snippet|exemplo simplificado|implementar depois|quando aplicável|helpers chamados|substitu(ir|i)r? mocks|pseudo-código|solução parcial|payload: unknown|as any|ContextAction|contextApi" docs/planificacao/guias-bk/MF1/*.md
```

Resultado observado: `PASS`, sem ocorrencias.

### Verificacao adicional de linguagem interna

```bash
rg -n "CRITICO|CRÍTICO|guia anterior|Estado antes|Estado depois|reescrito|Snippet tecnico aplicavel|snippet" docs/planificacao/guias-bk/MF1/*.md
```

Resultado observado: `PASS`, sem ocorrencias.

### Verificacao de headers

```bash
node - <<'NODE'
// Compara headers dos BKs MF1 com MATRIZ-CANONICA-BK.md.
NODE
```

Resultado observado: `PASS`, headers da `MF1` alinhados com `MATRIZ-CANONICA-BK.md`.

### Contagem estrutural dos passos

| BK | Passos | Itens obrigatorios por passo | Estado |
| --- | ---: | --- | --- |
| `BK-MF1-01` | 8 | Presentes | `OK` |
| `BK-MF1-02` | 8 | Presentes | `OK` |
| `BK-MF1-03` | 8 | Presentes | `OK` |
| `BK-MF1-04` | 6 | Presentes | `OK` |
| `BK-MF1-05` | 8 | Presentes | `OK` |
| `BK-MF1-06` | 8 | Presentes | `OK` |
| `BK-MF1-07` | 8 | Presentes | `OK` |
| `BK-MF1-08` | 6 | Presentes | `OK` |

## Validacao automatica
- `git diff --check`: `PASS` (`exit code 0`, sem output).
- `bash scripts/validate-planificacao.sh`: `FAIL` (`exit code 2`).

Erro observado:

```text
/opt/homebrew/Cellar/python@3.14/3.14.5/Frameworks/Python.framework/Versions/3.14/Resources/Python.app/Contents/MacOS/Python: can't open file '/Users/nuno/Developer/EPMS/Terceiro Ano/2025.2026/PAP/orelle/../scripts/validate_planificacao_canonica.py': [Errno 2] No such file or directory
```

Diagnostico: falha de infraestrutura/caminho no script. A auditoria de `MF1` nao alterou esse script.

## Resumo da auditoria
- MF processada: `MF1`.
- Numero de BKs analisados: `8`.
- Contagem antes desta auditoria: `OK=8`, `PARCIAL=0`, `CRITICO=0`.
- Contagem depois desta auditoria: `OK=8`, `PARCIAL=0`, `CRITICO=0`.
- BKs editados: nenhum.
- Principais lacunas corrigidas: nenhuma nesta execucao; modo `auditar_apenas`.
- Decisoes tecnicas confirmadas: catalogo em `RF09`-`RF12`, upload/analise/relatorio/historico em `RF13`-`RF16`, sessao HttpOnly, consentimento e limites de IA.
- Decisoes marcadas como `DERIVADO`: `brandName`, relacionados por catalogo, consentimento minimo em MF1, provider local controlado e rotina cosmetica sem compra automatica.
- Drift documental encontrado: sem drift novo; mantem-se apenas o bloqueio externo do script de validacao.
- Riscos de seguranca/privacidade restantes: hardening posterior de encriptacao, eliminacao/anonymizacao, auditoria de acessos e integracao IA externa.
- Bloqueios/TODO restantes: `TODO (BLOCKER)` para corrigir o caminho usado por `scripts/validate-planificacao.sh`.

## Ordem recomendada de correcao
1. Corrigir o bloqueio de infraestrutura em `scripts/validate-planificacao.sh`, que procura `../scripts/validate_planificacao_canonica.py` fora da raiz atual.
2. Manter os BKs da `MF1` sem alteracoes funcionais enquanto nao houver novo drift documental.
3. Quando a execucao passar para macrofases posteriores, auditar primeiro os BKs dependentes de dados biometricos: `BK-MF5-01`, `BK-MF5-04`, `BK-MF6-07`, `BK-MF7-01`, `BK-MF7-02` e `BK-MF8-07`.
