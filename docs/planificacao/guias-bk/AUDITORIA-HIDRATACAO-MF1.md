# Auditoria de hidratacao pedagogica/tecnica - MF1

## Header
- `doc_id`: `AUDITORIA-HIDRATACAO-MF1`
- `macro`: `MF1`
- `path`: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF1.md`
- `area`: `planificacao`
- `status`: `corrigir_apenas_concluido`
- `modo`: `corrigir_apenas`
- `last_updated`: `2026-05-31`

## Objetivo
Corrigir apenas os guias BK da macrofase `MF1` que estavam classificados como `PARCIAL` no relatorio existente, mantendo o escopo canonico, os RF/RNF, os contratos de backlog, os BKs de `MF0` ja detalhados e os handoffs para macrofases posteriores.

Esta execucao editou apenas BKs de `MF1` ja identificados como `PARCIAL` e atualizou este relatorio com o estado antes/depois da correcao.

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
| Antes desta correcao, segundo relatorio MF1 existente | 0 | 8 | 0 | 8 |
| Depois desta correcao | 8 | 0 | 0 | 8 |

## Criterio aplicado
Um BK foi considerado `OK` quando passou a cumprir cumulativamente:
- metadados canonicos alinhados;
- objetivo, importancia, scope-in, scope-out, pre-requisitos, dependencias e handoff;
- conceitos teoricos suficientes para dominio, backend, frontend, seguranca, privacidade, IA ou comercio;
- passos no formato obrigatorio `### Passo N - Nome claro` com os 7 pontos pedidos;
- codigo completo, integrado e explicacao didatica apos cada bloco;
- validacao por passo, negativos, expected results, criterios de aceite e evidence;
- ausencia de linguagem interna nos BKs de aluno;
- seguranca, consentimento, ownership e minimizacao aplicados no backend quando ha dados sensiveis.

## Resultado por BK

| BK | RF | Estado antes | Estado depois | Correcao aplicada |
| --- | --- | --- | --- | --- |
| `BK-MF1-01` | `RF09` | `PARCIAL` | `OK` | Removida linguagem interna, reforcados query params, validator, resposta publica e estados frontend. |
| `BK-MF1-02` | `RF10` | `PARCIAL` | `OK` | Clarificado contrato temporario de `reviewSummary` e `relatedProducts`, com 400/404 e handoff para reviews/relacionados. |
| `BK-MF1-03` | `RF11` | `PARCIAL` | `OK` | Tratado duplicado por indice unico como `409`, omitido `userId` da resposta publica e reforcados negativos. |
| `BK-MF1-04` | `RF12` | `PARCIAL` | `OK` | Reforcada decisao `DERIVADO`, criterios vazios, lista vazia e ausencia de collaborative filtering real. |
| `BK-MF1-05` | `RF13` | `PARCIAL` | `OK` | Reforcados consentimento, storage privado, minimizacao, encriptacao futura, eliminacao futura e limpeza de ficheiros em falha. |
| `BK-MF1-06` | `RF14` | `PARCIAL` | `OK` | Reforcados input permitido, ownership, fontes, confianca, fallback honesto, vies e limite nao-medico. |
| `BK-MF1-07` | `RF15` | `PARCIAL` | `OK` | Reforcado diagnostico cosmetico, rotina sem produtos, sources/limitations, ownership e ausencia de compra automatica. |
| `BK-MF1-08` | `RF16` | `PARCIAL` | `OK` | Reforcados historico pessoal, `.select(...)`, limite de resultados, ausencia de paths, `photoIds` e `consentId`. |

## BKs editados
- `docs/planificacao/guias-bk/MF1/BK-MF1-01-permitir-pesquisa-e-filtragem-por-categoria-preco-tipo-de-pele-marca.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-02-pagina-de-detalhes-do-produto-com-descricao-completa-imagem-notas-de-utilizadores-e-recomendacoes.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-03-permitir-ao-cliente-avaliar-produtos-1-5-estrelas-e-deixar-comentarios.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-04-mostrar-produtos-semelhantes-e-complementares-quem-comprou-isto-tambem-comprou.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-06-o-sistema-deve-analisar-as-fotos-com-ia-para-detetar-tipo-de-pele-acne-manchas-rugas-e-oleosidade.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-07-gerar-um-relatorio-personalizado-com-diagnostico-e-sugestoes-de-rotina.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-08-a-analise-deve-ser-guardada-no-historico-pessoal-para-futuras-comparacoes.md`

## Lacunas corrigidas
- Removidas dos 8 BKs as secoes `Estado antes` e `Estado depois`.
- Removidas dos 8 BKs as secoes finais de codigo solto `Snippet tecnico aplicavel`.
- Substituidos changelogs com linguagem de reescrita por linguagem neutra de revisao.
- Expandida a teoria de catalogo, detalhe, reviews, produtos relacionados, upload facial, IA, relatorio e historico.
- Reforcada a explicacao apos blocos de codigo com dados de entrada, saida, erros e impacto.
- Fechado tratamento de review duplicada como `409`.
- Minimizadas respostas publicas em reviews e historico.
- Adicionada limpeza de ficheiros no fluxo de upload se a persistencia falhar.
- Reforcados consentimento, ownership e limites de IA em todos os BKs sensiveis.

## Mapa de integracao da MF

| BK | Ficheiros criados previstos | Ficheiros editados previstos | Exports produzidos | Imports consumidos | Endpoints | DTOs/validators | Models | Services/controllers | Frontend | Providers IA | Recursos sensiveis | BKs seguintes dependentes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BK-MF1-01` | `catalog-query.validator.js`, `catalog.controller.js`, `catalog.routes.js`, `ProductSearchPage.jsx` | `product.service.js`, `app.js`, `apiClient.js`, `App.jsx` | `validateCatalogQuery`, `listCatalogProducts`, `catalogRoutes` | `Product`, `Category`, `SKIN_TYPES`, `apiRequest` | `GET /api/catalog/products` | `catalog-query.validator.js` | `Product`, `Category` | `product.service.js`, `catalog.controller.js` | `ProductSearchPage.jsx` | Nenhum | Nenhum | `BK-MF1-02`, `BK-MF3-02` |
| `BK-MF1-02` | `product-id.validator.js`, `product-details.controller.js`, `ProductDetailsPage.jsx` | `product.service.js`, `catalog.routes.js`, `App.jsx` | `validateProductIdParam`, `getCatalogProductDetails` | `Product`, `catalogRoutes` | `GET /api/catalog/products/:productId` | `product-id.validator.js` | `Product` | `product.service.js`, `product-details.controller.js` | `ProductDetailsPage.jsx` | Nenhum | Nenhum | `BK-MF1-03`, `BK-MF1-04` |
| `BK-MF1-03` | `review.model.js`, `review.validator.js`, `review.service.js`, `review.controller.js`, `ProductReviewPage.jsx` | `catalog.routes.js`, `App.jsx` | `Review`, `validateReviewInput`, `createProductReview`, `listProductReviews` | `Product`, `requireAuth`, `validateProductIdParam` | `GET/POST /api/catalog/products/:productId/reviews` | `review.validator.js` | `Review` | `review.service.js`, `review.controller.js` | `ProductReviewPage.jsx` | Nenhum | Comentarios de utilizador | `BK-MF4-02` |
| `BK-MF1-04` | `related-products.service.js`, `related-products.controller.js`, `RelatedProductsPage.jsx` | `catalog.routes.js`, `App.jsx` | `listRelatedCatalogProducts` | `Product`, `validateProductIdParam` | `GET /api/catalog/products/:productId/related` | Reutiliza `product-id.validator.js` | `Product` | `related-products.service.js`, `related-products.controller.js` | `RelatedProductsPage.jsx` | Nenhum | Nenhum | `BK-MF2-02`, `BK-MF3-02` |
| `BK-MF1-05` | `face-consent.model.js`, `face-photo.model.js`, `face-photo.validator.js`, `face-photo-upload.middleware.js`, `face-photo.service.js`, `face-photo.controller.js`, `face-photo.routes.js`, `FacePhotoUploadPage.jsx` | `server/package.json`, `app.js`, `apiClient.js`, `App.jsx` | `FaceConsent`, `FacePhoto`, `uploadFacePhotos`, `acceptFaceConsent`, `saveFacePhotos` | `requireAuth`, `multer`, `apiRequest` | `POST /api/face-consent`, `POST /api/face-photos` | `face-photo.validator.js` | `FaceConsent`, `FacePhoto` | `face-photo.service.js`, `face-photo.controller.js` | `FacePhotoUploadPage.jsx` | Nenhum | Fotografias faciais, consentimento | `BK-MF1-06`, `BK-MF2-07`, `BK-MF5-01`, `BK-MF5-04` |
| `BK-MF1-06` | `face-analysis.model.js`, `skin-analysis.provider.js`, `face-analysis.service.js`, `face-analysis.controller.js`, `face-analysis.routes.js`, `FaceAnalysisPage.jsx` | `app.js`, `App.jsx` | `FaceAnalysis`, `analyzeSkinPhotos`, `createFaceAnalysisForUser` | `FacePhoto`, `FaceConsent`, `requireAuth` | `POST /api/face-analyses` | Contrato interno do service | `FaceAnalysis`, `FacePhoto`, `FaceConsent` | `face-analysis.service.js`, `face-analysis.controller.js` | `FaceAnalysisPage.jsx` | `skin-analysis.provider.js` | Analise facial, findings biometricos derivados | `BK-MF1-07`, `BK-MF2-02` |
| `BK-MF1-07` | `face-report.model.js`, `face-report.service.js`, `face-report.controller.js`, `face-report.routes.js`, `FaceReportPage.jsx` | `app.js`, `App.jsx` | `FaceReport`, `generateReportFromLatestAnalysis` | `FaceAnalysis`, `requireAuth` | `POST /api/face-reports/latest` | Contrato interno do service | `FaceReport`, `FaceAnalysis` | `face-report.service.js`, `face-report.controller.js` | `FaceReportPage.jsx` | Nenhum novo | Relatorio de analise | `BK-MF1-08`, `BK-MF2-02`, `BK-MF7-05` |
| `BK-MF1-08` | `skin-history.service.js`, `skin-history.controller.js`, `skin-history.routes.js`, `SkinHistoryPage.jsx` | `app.js`, `App.jsx` | `getPersonalSkinHistory` | `FaceAnalysis`, `FaceReport`, `requireAuth` | `GET /api/me/skin-history` | Ownership por sessao | `FaceAnalysis`, `FaceReport` | `skin-history.service.js`, `skin-history.controller.js` | `SkinHistoryPage.jsx` | Nenhum | Historico pessoal de analises e relatorios | `BK-MF2-01`, `BK-MF3-01` |

## Decisoes tecnicas confirmadas
- CANONICO: `RF09` a `RF12` pertencem ao dominio de catalogo/produto.
- CANONICO: `RF13` exige upload de fotografias frontal e perfil.
- CANONICO: `RF14` analisa tipo de pele, acne, manchas, rugas e oleosidade.
- CANONICO: `RF15` gera relatorio personalizado com diagnostico cosmetico e sugestoes de rotina.
- CANONICO: `RF16` guarda analise no historico pessoal.
- CANONICO: `RNF12` exige consentimento explicito antes da analise facial.
- CANONICO: `RNF14` exige sessoes com cookies HttpOnly; MF1 deve continuar a usar `credentials: "include"`.
- CANONICO: `RNF23`, `RNF24` e `RNF25` afetam diretamente a forma como a IA e explicada e limitada.

## Decisoes marcadas como DERIVADO
- DERIVADO: `brandName` e necessario em catalogo porque `RF09` filtra por marca e `RF06` fala de marcas favoritas.
- DERIVADO: `BK-MF1-04` usa regras de catalogo para produtos semelhantes/complementares enquanto nao existe historico real de compras.
- DERIVADO: `BK-MF1-05` antecipa consentimento minimo de `RNF12`, apesar de o BK RNF canonico de consentimento estar em `MF7`.
- DERIVADO: `BK-MF1-06` usa provider local controlado enquanto a integracao externa completa fica para `RNF18`.
- DERIVADO: `BK-MF1-07` cria sugestoes de rotina cosmetica sem recomendacao personalizada de produto, preservando `RF18` para `MF2`.

## Drift documental encontrado
- Corrigido: o relatorio anterior marcava os oito BKs de `MF1` como `PARCIAL`; depois desta correcao os oito atingem `OK` pelo criterio aplicado.
- Corrigido: os guias de aluno ja nao incluem linguagem interna de auditoria nem secoes de codigo solto no fim.
- Mantido como decisao documentada: `RNF12` aparece canonicamente como BK de `MF7`, mas `MF1` precisa de consentimento minimo para nao guardar/processar fotografia facial sem base explicita.
- Mantido fora de escopo: os BKs posteriores que dependem de MF1 ainda podem precisar de hidratacao propria quando forem processados.
- Mantido como bloqueio externo: `scripts/validate-planificacao.sh` aponta para um ficheiro inexistente fora da raiz atual do repositorio.

## Riscos de seguranca/privacidade restantes
- Fotografias faciais e relatorios continuam dependentes de hardening posterior de encriptacao (`RNF11`) e processos de eliminacao/anonymizacao (`RF41`).
- O storage local privado fica minimizado e sem paths na resposta, mas a encriptacao de ficheiros ainda pertence a BK posterior.
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

Diagnostico: falha de infraestrutura/caminho no script. A correcao de `MF1` nao alterou esse script.

## Resumo final
- MF processada: `MF1`.
- Numero de BKs analisados: `8`.
- Contagem antes: `OK=0`, `PARCIAL=8`, `CRITICO=0`.
- Contagem depois: `OK=8`, `PARCIAL=0`, `CRITICO=0`.
- BKs editados: `BK-MF1-01` a `BK-MF1-08`.
- Principais lacunas corrigidas: linguagem interna, codigo solto no fim dos guias, explicacoes curtas, placeholders ambiguos, duplicados de reviews, privacidade no upload, limites de IA, relatorio cosmetico e minimizacao do historico.
- Decisoes tecnicas confirmadas: catalogo em `RF09`-`RF12`, upload/analise/relatorio/historico em `RF13`-`RF16`, sessao HttpOnly e consentimento obrigatorio nos fluxos sensiveis.
- Decisoes marcadas como `DERIVADO`: `brandName`, relacionados por catalogo, consentimento minimo em MF1, provider local controlado e rotina cosmetica sem compra automatica.
- Drift documental encontrado: drift interno dos guias corrigido; `RNF12` continua antecipado em MF1 por necessidade de privacidade; BKs posteriores dependentes ficam para execucoes futuras; script de validacao mantem caminho quebrado.
- Riscos de seguranca/privacidade restantes: hardening posterior de encriptacao, eliminacao/anonymizacao, auditoria de acessos e integracao IA externa.
- Verificacoes textuais executadas: regex oficial, verificacao adicional de linguagem interna e contagem estrutural.
- Resultado de `git diff --check`: `PASS`.
- Resultado de `bash scripts/validate-planificacao.sh`: `FAIL`, porque o script aponta para `../scripts/validate_planificacao_canonica.py`, ficheiro inexistente a partir da raiz atual.
- Bloqueios/TODO restantes: `TODO (BLOCKER)` para corrigir o caminho usado por `scripts/validate-planificacao.sh`.
