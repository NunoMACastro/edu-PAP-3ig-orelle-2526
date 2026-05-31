# Auditoria e correcao tecnica - MF1

## Header
- `doc_id`: `AUDITORIA-HIDRATACAO-MF1`
- `macro`: `MF1`
- `path`: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF1.md`
- `area`: `planificacao`
- `status`: `corrigir_apenas_concluido`
- `last_updated`: `2026-05-31`

## Objetivo
Corrigir os guias BK da macrofase `MF1` marcados como `CRITICO` na auditoria anterior, mantendo o contrato canonico do projeto, removendo deriva de dominio e deixando cada guia implementavel por alunos sem adivinhacao tecnica.

Esta execucao usa `MODO=corrigir_apenas`. Foram editados apenas os BKs de `docs/planificacao/guias-bk/MF1/` e este relatorio.

## Fontes consultadas
- `README.md`
- `docs/RF.md`
- `docs/RNF.md`
- `docs/planificacao/backlogs/BACKLOG-MVP.md`
- `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
- `docs/planificacao/backlogs/ANEXO-RF-PARA-BKS.md`
- `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
- `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
- `docs/planificacao/backlogs/MF-VIEWS.md`
- `docs/planificacao/sprints/PLANO-SPRINTS.md`
- `docs/planificacao/guias-bk/MF0/BK-MF0-02-registar-login-logout-e-recuperar-password.md`
- `docs/planificacao/guias-bk/MF0/BK-MF0-05-definir-roles-de-cliente-consultor-e-administrador.md`
- `docs/planificacao/guias-bk/MF0/BK-MF0-07-criar-base-de-dados-de-produtos-cosmeticos.md`
- `docs/planificacao/guias-bk/MF0/BK-MF0-08-organizar-produtos-por-categoria-cremes-seruns-limpeza-protetor-solar.md`
- Todos os BKs em `docs/planificacao/guias-bk/MF1/`

## Snapshot

| Momento | OK | PARCIAL | CRITICO | Total |
| --- | ---: | ---: | ---: | ---: |
| Antes da correcao | 0 | 0 | 8 | 8 |
| Depois da correcao | 8 | 0 | 0 | 8 |

## Criterio aplicado
Um BK foi considerado `OK` quando passou a ter:
- objetivo, importancia, scope-in, scope-out, pressupostos e teoria especifica;
- pelo menos 8 passos para prioridade `P0` e pelo menos 6 passos para prioridade `P1`;
- passos no formato `### Passo N - Nome claro`;
- os 7 pontos obrigatorios por passo;
- ficheiros concretos a criar, editar ou rever;
- codigo integrado para backend e frontend quando o requisito o exige;
- validacao, negativos, expected results, criterios de aceite, evidence e handoff;
- blocos formais `Bloco pedagogico`, `Bloco operacional`, `Snippet tecnico aplicavel` e matriz minima de testes exigidos pelo auditor local;
- ownership, autenticacao, consentimento, minimizacao ou limites de IA nos fluxos sensiveis.

## Resultado por BK

| BK | RF | Prioridade | Estado anterior | Estado atual | Resumo da correcao |
| --- | --- | --- | --- | --- | --- |
| `BK-MF1-01` | `RF09` | `P0` | `CRITICO` | `OK` | Pesquisa e filtros de catalogo com validator, service, controller, route e pagina React. |
| `BK-MF1-02` | `RF10` | `P0` | `CRITICO` | `OK` | Detalhe publico de produto, validacao de ID, agregados de avaliacoes e UI com negativos. |
| `BK-MF1-03` | `RF11` | `P1` | `CRITICO` | `OK` | Avaliacoes autenticadas com `Review`, validacao de estrelas/comentario, ownership e UI. |
| `BK-MF1-04` | `RF12` | `P1` | `CRITICO` | `OK` | Produtos relacionados por regras de catalogo, sem checkout e sem recomendacao personalizada de IA. |
| `BK-MF1-05` | `RF13` | `P0` | `CRITICO` | `OK` | Consentimento minimo, upload frontal/perfil, storage privado, validacao de ficheiros e UI. |
| `BK-MF1-06` | `RF14` | `P0` | `CRITICO` | `OK` | Analise cosmética com provider isolado, guardrails, ownership, limitations e UI. |
| `BK-MF1-07` | `RF15` | `P0` | `CRITICO` | `OK` | Relatorio personalizado ligado a analise concluida, rotina cosmética e ausencia de compra automatica. |
| `BK-MF1-08` | `RF16` | `P1` | `CRITICO` | `OK` | Historico pessoal de analises e relatorios, ownership por sessao e contrato para MF2/MF3. |

## BKs editados
- `docs/planificacao/guias-bk/MF1/BK-MF1-01-permitir-pesquisa-e-filtragem-por-categoria-preco-tipo-de-pele-marca.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-02-pagina-de-detalhes-do-produto-com-descricao-completa-imagem-notas-de-utilizadores-e-recomendacoes.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-03-permitir-ao-cliente-avaliar-produtos-1-5-estrelas-e-deixar-comentarios.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-04-mostrar-produtos-semelhantes-e-complementares-quem-comprou-isto-tambem-comprou.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-06-o-sistema-deve-analisar-as-fotos-com-ia-para-detetar-tipo-de-pele-acne-manchas-rugas-e-oleosidade.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-07-gerar-um-relatorio-personalizado-com-diagnostico-e-sugestoes-de-rotina.md`
- `docs/planificacao/guias-bk/MF1/BK-MF1-08-a-analise-deve-ser-guardada-no-historico-pessoal-para-futuras-comparacoes.md`

## Mapa de integracao da MF

| BK | Endpoints | Validators/DTOs | Models | Services/controllers | Frontend | Recursos sensiveis | Handoff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `BK-MF1-01` | `GET /api/catalog/products` | `catalog-query.validator.js` | `Product`, `Category` da MF0 | `listCatalogProducts`, `catalog.controller.js`, `catalog.routes.js` | `ProductSearchPage.jsx`, `App.jsx` | Nenhum | Base para detalhe. |
| `BK-MF1-02` | `GET /api/catalog/products/:productId` | `product-id.validator.js` | `Product`, `Review` futuro | `getCatalogProductDetails`, `product-details.controller.js` | `ProductDetailsPage.jsx`, `App.jsx` | Nenhum | Base para reviews e relacionados. |
| `BK-MF1-03` | `GET/POST /api/catalog/products/:productId/reviews` | `review.validator.js`, `product-id.validator.js` | `Review` | `review.service.js`, `review.controller.js` | `ProductReviewPage.jsx`, `App.jsx` | Comentarios de utilizador | Prepara moderacao futura. |
| `BK-MF1-04` | `GET /api/catalog/products/:productId/related` | `product-id.validator.js` | `Product` | `related-products.service.js`, `related-products.controller.js` | `RelatedProductsPage.jsx`, `App.jsx` | Nenhum | Prepara recomendacoes sem invadir checkout. |
| `BK-MF1-05` | `POST /api/face-consent`, `POST /api/face-photos` | `face-photo.validator.js` | `FaceConsent`, `FacePhoto` | `face-photo.service.js`, `face-photo.controller.js`, upload middleware | `FacePhotoUploadPage.jsx`, `apiClient.js`, `App.jsx` | Fotografias faciais | Prepara analise IA. |
| `BK-MF1-06` | `POST /api/face-analyses` | Contrato interno do service | `FaceAnalysis` | `face-analysis.service.js`, `face-analysis.controller.js` | `FaceAnalysisPage.jsx`, `App.jsx` | Analise facial | Prepara relatorio e recomendacoes futuras. |
| `BK-MF1-07` | `POST /api/face-reports/latest` | Contrato interno do service | `FaceReport` | `face-report.service.js`, `face-report.controller.js` | `FaceReportPage.jsx`, `App.jsx` | Relatorio de analise | Prepara historico. |
| `BK-MF1-08` | `GET /api/me/skin-history` | Ownership por sessao | `FaceAnalysis`, `FaceReport` | `skin-history.service.js`, `skin-history.controller.js` | `SkinHistoryPage.jsx`, `App.jsx` | Historico pessoal | Prepara graficos em MF2 e compras em MF3. |

## Decisoes tecnicas confirmadas
- CANONICO: `RF09` a `RF12` pertencem ao dominio de catalogo/produto.
- CANONICO: `RF13` exige upload de fotografias frontal e perfil.
- CANONICO: `RF14` analisa tipo de pele, acne, manchas, rugas e oleosidade.
- CANONICO: `RF15` gera relatorio personalizado com diagnostico cosmetico e sugestoes de rotina.
- CANONICO: `RF16` guarda a analise no historico pessoal.
- DERIVADO: `BK-MF1-04` usa uma regra simples de catalogo para produtos semelhantes e complementares enquanto ainda nao existe historico de compras.
- DERIVADO: `BK-MF1-05` antecipa um contrato minimo de consentimento, porque fotografias faciais nao devem ser guardadas ou processadas sem base explicita.
- DERIVADO: os guias de IA usam provider isolado e limitations visiveis, sem promessas medicas.

## Drift documental e TODOs
- Drift resolvido nos guias: os BKs deixaram de misturar catalogo, checkout e analise facial no mesmo codigo.
- Drift resolvido nos guias: os fluxos sensiveis passaram a exigir sessao, consentimento, ownership e minimizacao.
- Drift resolvido nos guias: os oito BKs passaram a cumprir os blocos formais esperados pelo auditor local.
- TODO externo: alinhar o documento de sequencia que coloca `RNF12` em `MF7`, porque `MF1` precisa de consentimento minimo antes de upload/processamento facial.
- TODO externo: corrigir `scripts/validate-planificacao.sh`, que aponta para um caminho inexistente fora da raiz atual.

## Validacao executada

- Verificacao textual pedida:

```bash
rg -n "StudyFlow|sala de estudo|turma oficial|disciplina|material oficial|IA da sala|IA da turma|professor|aluno inscrito|hidrata|pós-auditoria|scaffold|roteiro genérico|conversa interna|este guia deixa de ser|código ainda não corrigido|snippet|exemplo simplificado|implementar depois|quando aplicável|helpers chamados|substitu(ir|i)r? mocks|pseudo-código|solução parcial|payload: unknown|as any|ContextAction|contextApi" docs/planificacao/guias-bk/MF1/*.md
```

Resultado: `PASS` sem output (`exit code 1`, comportamento esperado do `rg` quando nao encontra ocorrencias).

- Contagem de passos:

| BK | Passos |
| --- | ---: |
| `BK-MF1-01` | 8 |
| `BK-MF1-02` | 8 |
| `BK-MF1-03` | 8 |
| `BK-MF1-04` | 6 |
| `BK-MF1-05` | 8 |
| `BK-MF1-06` | 8 |
| `BK-MF1-07` | 8 |
| `BK-MF1-08` | 6 |

- `git diff --check`: `PASS` (`exit code 0`, sem output).

- `bash scripts/validate-planificacao.sh`: `FAIL` (`exit code 2`).

Erro observado:

```text
/opt/homebrew/Cellar/python@3.14/3.14.5/Frameworks/Python.framework/Versions/3.14/Resources/Python.app/Contents/MacOS/Python: can't open file '/Users/nuno/Developer/EPMS/Terceiro Ano/2025.2026/PAP/orelle/../scripts/validate_planificacao_canonica.py': [Errno 2] No such file or directory
```

Diagnostico: falha de infraestrutura/caminho pre-existente no script. O script tenta abrir `../scripts/validate_planificacao_canonica.py` a partir da raiz atual do repositorio, mas esse ficheiro nao existe nesse caminho.

- Diagnostico auxiliar:

```bash
python3 docs/planificacao/scripts/auditar_planificacao.py
```

Resultado auxiliar final: `PASS`, com `overall_pass: true`, `coverage_pass: true`, `consistency_pass: true`, `guides_pass: true` e `naming_pass: true`.

## Resumo de fecho
- MF processada: `MF1`.
- BKs analisados: `8`.
- BKs corrigidos: `8`.
- Contagem antes: `OK=0`, `PARCIAL=0`, `CRITICO=8`.
- Contagem depois: `OK=8`, `PARCIAL=0`, `CRITICO=0`.
- Resultado textual dos BKs: sem termos proibidos no comando pedido.
- Resultado estrutural dos BKs: P0 com 8 passos; P1 com 6 ou mais passos.
- Resultado do auditor auxiliar: `PASS`.
- Bloqueio restante fora dos BKs: `scripts/validate-planificacao.sh` falha por caminho inexistente.
