## Resultado Geral

- Projeto: Orelle
- Alvo auditado: MF1
- Implementacao auditada: `real_dev`
- MFs implementadas consideradas: MF0 `IMPLEMENTADA`; MF1 `IMPLEMENTADA COM FALHA BLOQUEANTE`; MF2 `NAO_IMPLEMENTADA`; MF4 `PARCIALMENTE_IMPLEMENTADA` fora da cadeia direta MF1 nesta auditoria.
- Estado: FAIL
- Resumo: A MF1 tem boa cobertura estrutural, testes automatizados a passar e contratos fortes de autenticação, ownership e minimização de dados. No entanto, `BK-MF1-06` não entrega a deteção facial exigida por `RF14`: o provider real declara que é fallback e que não interpreta píxeis, devolvendo todos os sinais como `nao_conclusivo`. Isto bloqueia o fecho rigoroso da macrofase e enfraquece `BK-MF1-07`, `BK-MF1-08` e o handoff para `MF2`.

## Matriz por BK

| BK | Estado | Implementado | Falhas | Fora de scope | Risco |
| --- | --- | ---: | ---: | ---: | --- |
| BK-MF1-01 | PASS | Sim | 0 | 0 | Baixo |
| BK-MF1-02 | PASS | Sim | 0 | 0 | Baixo |
| BK-MF1-03 | PASS | Sim | 0 | 0 | Baixo |
| BK-MF1-04 | PASS COM RISCOS | Sim | 1 | 0 | Baixo |
| BK-MF1-05 | PASS | Sim | 0 | 0 | Médio controlado |
| BK-MF1-06 | FAIL | Parcial | 1 | 0 | Alto |
| BK-MF1-07 | PASS COM RISCOS | Sim | 1 derivada | 0 | Médio |
| BK-MF1-08 | PASS COM RISCOS | Sim | 1 derivada | 0 | Médio |

## Matriz de Coerencia entre MFs

| Ligacao | Estado | Contratos OK | Falhas | Regressao | Risco |
| --- | --- | ---: | ---: | ---: | --- |
| MF0 -> MF1 | PASS | Sim | 0 | Nao | Baixo |
| MF1 -> MF2 | PASS COM RISCOS | Parcial | 1 | Nao aplicavel | Alto para RF18 |

## Validacao por BK

### BK-MF1-01

- Estado: PASS
- O que cumpre: Implementa `GET /api/catalog/products`, valida filtros, reutiliza `Product`, `Category` e `categoryIds`, limita resposta pública e preserva cookies via `credentials: "include"`.
- O que falha: Nada essencial observado.
- Evidencia: `real_dev/api/src/routes/catalog.routes.js:25`; `real_dev/api/src/validators/catalog-query.validator.js:68`; `real_dev/api/src/services/product.service.js:96`; `real_dev/web/src/services/apiClient.js:22`.
- Fora de scope detetado: Nenhum.
- Riscos: Baixos; pesquisa usa `$text` e regex escapado.
- Correcao recomendada: Sem correção obrigatória.

### BK-MF1-02

- Estado: PASS
- O que cumpre: Implementa `GET /api/catalog/products/:productId`, valida `ObjectId`, devolve detalhe público, não expõe `createdBy` e integra `reviewSummary`.
- O que falha: Nada essencial observado.
- Evidencia: `real_dev/api/src/routes/catalog.routes.js:26`; `real_dev/api/src/validators/product-id.validator.js:15`; `real_dev/api/src/services/product.service.js:177`; `real_dev/api/tests/mf1.catalog.test.js:114`.
- Fora de scope detetado: Nenhum.
- Riscos: Baixos.
- Correcao recomendada: Sem correção obrigatória.

### BK-MF1-03

- Estado: PASS
- O que cumpre: Implementa `Review`, `POST /api/catalog/products/:productId/reviews`, `GET /api/catalog/products/:productId/reviews`, valida rating/comentário, exige sessão e role `cliente`, usa `req.user.id` e não aceita `userId` do frontend.
- O que falha: Nada essencial observado.
- Evidencia: `real_dev/api/src/routes/catalog.routes.js:31`; `real_dev/api/src/routes/catalog.routes.js:35`; `real_dev/api/src/models/review.model.js:11`; `real_dev/api/src/services/review.service.js:47`; `real_dev/api/tests/mf1.catalog.test.js:141`.
- Fora de scope detetado: Nenhum; moderação admin não foi antecipada.
- Riscos: Baixos.
- Correcao recomendada: Sem correção obrigatória.

### BK-MF1-04

- Estado: PASS COM RISCOS
- O que cumpre: Implementa `GET /api/catalog/products/:productId/related`, calcula relacionados por categoria, tipo de pele e marca, exclui o produto atual, filtra stock positivo e não usa histórico de compras nem IA.
- O que falha: DRIFT menor de payload: o guia exemplifica resposta `{ products }`, mas a implementação responde `{ relatedProducts }`. Backend, frontend e testes estão coerentes entre si, portanto não quebra a app.
- Evidencia: `real_dev/api/src/controllers/related-products.controller.js:20`; `real_dev/api/src/controllers/related-products.controller.js:22`; `real_dev/web/src/pages/RelatedProductsPage.jsx:37`; `real_dev/api/tests/mf1.catalog.test.js:190`.
- Fora de scope detetado: Nenhum.
- Riscos: Baixo; risco documental/API se MF futura assumir o snippet do guia literalmente.
- Correcao recomendada: Alinhar documentação ou payload antes de publicar contrato externo. Preferência conservadora: manter contrato real se já testado e atualizar guia/evidence.

### BK-MF1-05

- Estado: PASS
- O que cumpre: Implementa consentimento mínimo, upload autenticado, campos `frontal` e `perfil`, valida MIME e assinatura binária, aplica limite de tamanho, guarda ficheiros fora da pasta pública e não devolve `storageKey`.
- O que falha: Nada essencial de MF1 observado.
- Evidencia: `real_dev/api/src/routes/face-photo.routes.js:24`; `real_dev/api/src/routes/face-photo.routes.js:30`; `real_dev/api/src/models/face-photo.model.js:24`; `real_dev/api/src/middlewares/face-photo-upload.middleware.js:77`; `real_dev/api/src/services/face-photo.service.js:176`; `real_dev/api/tests/mf1.face.test.js:257`.
- Fora de scope detetado: Nenhum. Encriptação, eliminação/anonimização e auditoria completa pertencem a MFs posteriores.
- Riscos: Médio controlado por envolver dados biométricos; mitigado por consentimento, storage privado e resposta minimizada.
- Correcao recomendada: Revalidar encriptação e apagamento quando MF6/MF7/MF5 forem implementadas.

### BK-MF1-06

- Estado: FAIL
- O que cumpre: Cria `FaceAnalysis`, provider isolado, endpoint `POST /api/face-analyses`, guardrails de sessão/consentimento/fotografias e persistência por utilizador autenticado.
- O que falha: P0 / DRIFT funcional. `RF14` e o BK pedem análise por IA para detetar tipo de pele, acne, manchas, rugas e oleosidade. O provider real declara que é fallback e que não interpreta píxeis, devolvendo todos os findings como `nao_conclusivo` com baixa confiança. Isto valida pré-condições, mas não entrega a deteção.
- Evidencia: `docs/RF.md` define `RF14`; `docs/planificacao/guias-bk/MF1/BK-MF1-06-o-sistema-deve-analisar-as-fotos-com-ia-para-detetar-tipo-de-pele-acne-manchas-rugas-e-oleosidade.md` define o objetivo; `real_dev/api/src/providers/skin-analysis.provider.js:4`; `real_dev/api/src/providers/skin-analysis.provider.js:45`; `real_dev/api/src/providers/skin-analysis.provider.js:48`; `real_dev/api/src/providers/skin-analysis.provider.js:76`; `real_dev/api/tests/mf1.face.test.js:297`.
- Fora de scope detetado: Nenhum; a falha é ausência de comportamento essencial, não implementação fora de scope.
- Riscos: Alto. MF2-02 depende de `BK-MF1-06` para recomendações personalizadas; com todos os sinais inconclusivos, a recomendação futura não terá base útil.
- Correcao recomendada: Implementar provider real ou baseline determinístico documentado que produza sinais cosméticos verificáveis a partir das imagens, mantendo limitações, confiança, fontes, não diagnóstico médico e testes negativos. Se a decisão pedagógica for manter fallback, o BK deve ser reclassificado como parcial e não como DONE.

### BK-MF1-07

- Estado: PASS COM RISCOS
- O que cumpre: Cria `FaceReport`, endpoint `POST /api/face-reports/latest`, escolhe a última análise concluída do próprio utilizador, gera resumo cosmético, rotina manhã/noite, fontes e limitações sem recomendar produtos nem criar checkout.
- O que falha: Risco derivado de `BK-MF1-06`: o relatório resume findings `nao_conclusivo`, logo cumpre o fluxo mas não gera diagnóstico cosmético útil quando a análise não deteta sinais.
- Evidencia: `real_dev/api/src/routes/face-report.routes.js:17`; `real_dev/api/src/services/face-report.service.js:89`; `real_dev/api/src/services/face-report.service.js:99`; `real_dev/api/tests/mf1.face.test.js:362`.
- Fora de scope detetado: Nenhum.
- Riscos: Médio; relatório formalmente existe, mas valor funcional depende de corrigir `BK-MF1-06`.
- Correcao recomendada: Depois de corrigir o provider, revalidar se `cosmeticSummary` e `routineSuggestions` refletem sinais reais e continuam sem promessas médicas.

### BK-MF1-08

- Estado: PASS COM RISCOS
- O que cumpre: Implementa `GET /api/me/skin-history`, lista análises e relatórios do utilizador autenticado, ordena por data, limita campos e ignora `userId` vindo da query.
- O que falha: Risco derivado de `BK-MF1-06`: histórico fica tecnicamente correto, mas pouco útil para evolução temporal se os findings forem sempre inconclusivos.
- Evidencia: `real_dev/api/src/routes/skin-history.routes.js:17`; `real_dev/api/src/services/skin-history.service.js:52`; `real_dev/api/src/services/skin-history.service.js:54`; `real_dev/api/tests/mf1.face.test.js:390`.
- Fora de scope detetado: Nenhum; gráficos e comparação visual ficam para MF2/MF3.
- Riscos: Médio para handoff MF2-01.
- Correcao recomendada: Após corrigir `BK-MF1-06`, validar histórico com várias análises em datas diferentes e sinais comparáveis.

## Coerencia entre MFs

### MF0 -> MF1

- Estado: PASS
- Contratos entregues pela MF anterior: sessão por cookie HttpOnly, `requireAuth`, roles `cliente/consultor/administrador`, perfil, preferências, `Product`, `Category` e `Product.categoryIds`.
- Como a MF alvo os consome: MF1 usa cookies via `apiClient`, `requireAuth` em reviews/upload/análise/relatório/histórico, `requireRole(ROLES.CLIENTE)` nas reviews, e reutiliza `Product`/`Category`.
- Falhas: Nenhuma regressão observada.
- Regressions: Não observadas. A suite API completa passa fora do sandbox.
- Riscos: Baixos.

### MF alvo -> MF seguinte

- Estado: PASS COM RISCOS
- Contratos entregues pela MF alvo: endpoints de catálogo/reviews/relacionados, upload facial com metadados, `FaceAnalysis`, `FaceReport`, `GET /api/me/skin-history`.
- Como a MF seguinte os consome: MF2 ainda não está implementada em `real_dev`; documentalmente `BK-MF2-01` depende de `BK-MF1-08` e `BK-MF2-02` depende de `BK-MF1-06`/`BK-MF1-07`.
- Falhas: `BK-MF1-06` entrega schema e histórico, mas não entrega sinais detectados suficientes para recomendações personalizadas de `BK-MF2-02`.
- Incompatibilidades: Não há incompatibilidade de endpoints observada, porque MF2 não consome ainda. Há risco de contrato fraco: todos os findings podem ser `nao_conclusivo`.
- Riscos: Alto para recomendação personalizada e evolução temporal com valor real.

## Findings

### P0

- Severidade: P0
- BK afetado: BK-MF1-06
- MF afetada: MF1
- Ficheiro e linha: `real_dev/api/src/providers/skin-analysis.provider.js:4`, `real_dev/api/src/providers/skin-analysis.provider.js:45`, `real_dev/api/src/providers/skin-analysis.provider.js:48`, `real_dev/api/src/providers/skin-analysis.provider.js:76`
- Evidencia observada: Provider `local-fallback-skin-analysis-v1` devolve todos os sinais como `nao_conclusivo` e declara que valida pré-condições, mas não interpreta píxeis.
- Documento/BK violado: `RF14`; `BK-MF1-06`.
- Impacto: A macrofase não pode fechar rigorosamente como PASS, porque falta a deteção de tipo de pele, acne, manchas, rugas e oleosidade. Também enfraquece `BK-MF1-07`, `BK-MF1-08` e o futuro `BK-MF2-02`.
- Correcao recomendada: Implementar provider real ou baseline técnico validável que produza sinais cosméticos a partir das fotografias, com confiança, fontes, limitações e testes negativos.
- Scope: Dentro do scope da MF1.
- Tipo: DRIFT.

### P1

- Severidade: P1
- BK afetado: BK-MF1-07, BK-MF1-08, BK-MF2-02
- MF afetada: MF1/MF2
- Ficheiro e linha: `real_dev/api/src/services/face-report.service.js:15`, `real_dev/api/src/services/skin-history.service.js:52`
- Evidencia observada: Relatório e histórico persistem e expõem dados seguros, mas dependem de findings inconclusivos.
- Documento/BK violado: Handoff `BK-MF1-06 -> BK-MF1-07 -> BK-MF1-08 -> BK-MF2-02`.
- Impacto: Fluxos futuros podem funcionar tecnicamente, mas sem qualidade funcional suficiente para recomendações personalizadas.
- Correcao recomendada: Revalidar relatório/histórico após corrigir análise facial; adicionar testes com findings conclusivos e múltiplas análises.
- Scope: Dentro do scope cumulativo MF1/MF2.
- Tipo: INCOMPATIBILIDADE ENTRE MFS potencial.

### P2

- Severidade: P2
- BK afetado: BK-MF1-04
- MF afetada: MF1
- Ficheiro e linha: `real_dev/api/src/controllers/related-products.controller.js:22`, `real_dev/web/src/pages/RelatedProductsPage.jsx:37`
- Evidencia observada: Endpoint real devolve `{ relatedProducts }`, enquanto o snippet operacional do guia usa `{ products }`.
- Documento/BK violado: Guia `BK-MF1-04`, contrato de exemplo do controller.
- Impacto: Sem quebra interna atual, porque frontend/testes usam `{ relatedProducts }`; risco documental para consumidores futuros.
- Correcao recomendada: Uniformizar guia e evidence com o payload real ou alterar endpoint/frontend/testes para `{ products }`.
- Scope: Dentro do scope da MF1.
- Tipo: DRIFT.

### P3

- Severidade: P3
- BK afetado: transversal
- MF afetada: MF1
- Ficheiro e linha: `real_dev/web/src/App.jsx:2`, `real_dev/web/src/App.jsx:30`, `real_dev/web/src/App.jsx:62`
- Evidencia observada: Comentários do `App.jsx` ainda dizem "frontend MF0" apesar de compor páginas MF1.
- Documento/BK violado: Não viola requisito funcional; é clareza/manutenção.
- Impacto: Baixo; pode confundir auditorias futuras.
- Correcao recomendada: Atualizar comentários quando for permitido editar documentação/código.
- Scope: Manutenção, não bloqueante.
- Tipo: Observação.

## Seguranca e Privacidade

- Resultado: Bom para MF1, com um blocker funcional não relacionado com exposição de dados.
- Falhas encontradas: Não foi observado uso de `localStorage`/`sessionStorage` para tokens. `passwordHash` tem `select:false`. `storageKey` tem `select:false` e não é devolvido nas respostas. Reviews não expõem `userId`. Histórico usa `req.user.id` e ignora `userId` na query.
- Riscos restantes: Fotografias e relatórios ainda não têm encriptação em repouso nesta MF; isto pertence a `RNF11`/MF6. Eliminação/anonymização e auditoria de acessos ficam para MF5/MF7. O segredo default `dev-only-change-me` é bloqueado em produção, mas deve ser revalidado em deploy.

## Testes e Comandos

- Comandos executados:
  - `bash scripts/validate-planificacao.sh`: PASS, `overall_pass: true`.
  - `npm run build` em `real_dev/web`: PASS.
  - `npm run test` em `real_dev/api` dentro do sandbox: FAIL por `listen EPERM 0.0.0.0`, restrição do ambiente ao Supertest.
  - `npm run test` em `real_dev/api` fora do sandbox com permissão escalada: PASS, 12 ficheiros e 80 testes.
- Resultado observado: Documentação, build frontend e testes API passam. O PASS dos testes não invalida o finding P0 porque os testes codificam o fallback inconclusivo como comportamento esperado.
- Comandos nao executados:
  - `npm run lint`: não existe em `real_dev/api/package.json` nem em `real_dev/web/package.json`.
  - Smoke browser/manual: não executado porque a prompt pediu auditoria sem alteração e os testes/build cobrem os contratos principais.
- Motivo: Ausência de script ou validação suficiente por testes/build.

## Conclusao

- A macrofase pode avancar? Não deve ser fechada como PASS enquanto `BK-MF1-06` não entregar deteção facial real ou baseline validável alinhado com `RF14`.
- O que falta corrigir antes de fechar? Corrigir o provider de análise facial; revalidar relatório e histórico com findings conclusivos; alinhar o payload/documentação de relacionados.
- O que deve ser revalidado depois das correcoes? `npm run test` em `real_dev/api`, `npm run build` em `real_dev/web`, `bash scripts/validate-planificacao.sh`, testes específicos de análise com fotografia frontal/perfil válida, sem consentimento, sem uma fotografia e provider/fallback com limitações.
- Ha contratos entre MFs que precisam de ser corrigidos? Sim: `MF1 -> MF2` precisa de sinais de análise suficientemente úteis para `BK-MF2-02`; caso contrário, MF2 herda um contrato tecnicamente existente mas funcionalmente fraco.
