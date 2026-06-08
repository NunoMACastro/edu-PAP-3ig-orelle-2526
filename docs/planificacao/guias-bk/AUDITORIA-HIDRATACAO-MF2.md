# Auditoria de hidratacao pedagogica/tecnica - MF2

## Header
- `doc_id`: `AUDITORIA-HIDRATACAO-MF2`
- `mf_alvo`: `MF2`
- `modo`: `auditar_apenas`
- `data_execucao`: `2026-06-08`
- `relatorio`: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF2.md`

## Objetivo
Auditar os guias BK da macrofase `MF2` sem editar os BKs, confirmando se estao completos, pedagogicos, tecnicamente executaveis e coerentes com os documentos canonicos da Orelle.

Nesta execucao nao foram alterados guias da `MF2`. O relatorio anterior estava escrito para `corrigir_apenas`; este ficheiro passa a registar a fotografia atual em modo `auditar_apenas`.

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
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF1.md`
- Todos os BKs em `docs/planificacao/guias-bk/MF0/`, `MF1/` e `MF2/`.
- BKs posteriores relevantes para dependencia ou handoff: `BK-MF3-01`, `BK-MF4-05`, `BK-MF4-08`, `BK-MF5-04`, `BK-MF6-07`, `BK-MF7-01`, `BK-MF8-05`, `BK-MF8-06` e `BK-MF8-07`.

## Documentos em falta
Nenhum documento obrigatorio em falta.

## Contexto de worktree
- No inicio desta auditoria, os oito BKs da `MF2` ja apareciam modificados no `git status`.
- O relatorio `AUDITORIA-HIDRATACAO-MF2.md` ja existia como ficheiro nao versionado.
- O modo pedido foi `auditar_apenas`; por isso, os BKs da `MF2` foram apenas lidos e classificados.
- O codigo existente da app nao foi tratado como contrato tecnico final; a auditoria foi feita contra documentacao canonica e BKs ja corrigidos.

## Resumo de classificacao
| Momento | OK | PARCIAL | CRITICO | Total |
| --- | ---: | ---: | ---: | ---: |
| Relatorio existente antes desta auditoria | 8 | 0 | 0 | 8 |
| Revalidacao manual desta execucao | 8 | 0 | 0 | 8 |
| Depois desta execucao | 8 | 0 | 0 | 8 |

## BKs editados
Nenhum BK da `MF2` foi editado nesta execucao.

## Resultado por BK
| BK | RF | Estado | Problema principal | Conclusao |
| --- | --- | --- | --- | --- |
| `BK-MF2-01` | `RF17` | `OK` | Sem lacuna bloqueante. | Guia completo para evolucao temporal com endpoint autenticado, service, controller, route, pagina e negativos. |
| `BK-MF2-02` | `RF18` | `OK` | Sem lacuna bloqueante. | Guia completo para recomendacoes personalizadas, com ranking, DTOs, ownership e bloqueio de recomendacao apenas por stock. |
| `BK-MF2-03` | `RF19` | `OK` | Sem lacuna bloqueante. | Guia completo para motivos explicaveis baseados em `reasonCodes` e `sourceSignals`, com teste unitario. |
| `BK-MF2-04` | `RF20` | `OK` | Sem lacuna bloqueante. | Guia completo para feedback util/nao relevante sem prometer treino real imediato de modelo. |
| `BK-MF2-05` | `RF21` | `OK` | Sem lacuna bloqueante. | Guia completo para rotina manha/noite, com origem explicita em recomendacoes ate existirem compras reais. |
| `BK-MF2-06` | `RF22` | `OK` | Sem lacuna bloqueante. | Guia completo para revisao por consultores/admins com `requireAuth`, `requireRole` e registo de revisao. |
| `BK-MF2-07` | `RF23` | `OK` | Sem lacuna bloqueante. | Guia completo para simulacao baseline com fotografia frontal privada, consentimento e provider local controlado. |
| `BK-MF2-08` | `RF24` | `OK` | Sem lacuna bloqueante. | Guia completo para visualizacao antes/depois baseada em simulacao e recomendacoes, sem publicar fotografia ou IDs sensiveis. |

## Evidencia de completude estrutural
| BK | Prioridade | Passos lineares | Estrutura 1-7 por passo | Estado no header | Secoes finais |
| --- | --- | ---: | --- | --- | --- |
| `BK-MF2-01` | `P2` | 7 | Completa | `DONE` | Expected results, criterios, validacao, evidence, handoff, changelog |
| `BK-MF2-02` | `P0` | 8 | Completa | `DONE` | Expected results, criterios, validacao, evidence, handoff, changelog |
| `BK-MF2-03` | `P1` | 6 | Completa | `DONE` | Expected results, criterios, validacao, evidence, handoff, changelog |
| `BK-MF2-04` | `P2` | 6 | Completa | `DONE` | Expected results, criterios, validacao, evidence, handoff, changelog |
| `BK-MF2-05` | `P1` | 8 | Completa | `DONE` | Expected results, criterios, validacao, evidence, handoff, changelog |
| `BK-MF2-06` | `P2` | 7 | Completa | `DONE` | Expected results, criterios, validacao, evidence, handoff, changelog |
| `BK-MF2-07` | `P2` | 8 | Completa | `DONE` | Expected results, criterios, validacao, evidence, handoff, changelog |
| `BK-MF2-08` | `P1` | 8 | Completa | `DONE` | Expected results, criterios, validacao, evidence, handoff, changelog |

## Gate de app funcional
- `BK-MF2-01`: `OK` por revisao estatica do guia. Imports previstos partem de `FaceAnalysis`, `requireAuth`, `apiRequest` e rotas/paginas criadas no proprio BK. Fluxo autenticado e falhas negativas estao descritos.
- `BK-MF2-02`: `OK` por revisao estatica do guia. Controller chama service existente no BK; service usa `FaceAnalysis`, `FaceReport`, `Product` e `ProductRecommendation`; frontend chama endpoints reais do BK.
- `BK-MF2-03`: `OK` por revisao estatica do guia. Motivos ficam integrados no service de recomendacao criado em `BK-MF2-02`, sem endpoint duplicado.
- `BK-MF2-04`: `OK` por revisao estatica do guia. Feedback usa ownership no backend sobre `ProductRecommendation`, sem aceitar `userId` do frontend.
- `BK-MF2-05`: `OK` por revisao estatica do guia. Rotina usa recomendacoes do proprio utilizador, exige cobertura `manha` e `noite`, e prepara `BK-MF4-05`.
- `BK-MF2-06`: `OK` por revisao estatica do guia. Revisao exige role `consultor` ou `administrador` no backend.
- `BK-MF2-07`: `OK` por revisao estatica do guia. Simulacao exige sessao, consentimento ativo e fotografia frontal do proprio utilizador.
- `BK-MF2-08`: `OK` por revisao estatica do guia. Visualizacao revalida consentimento, ownership da simulacao e recomendacoes validas.

Nota: os blocos de codigo dos guias nao foram executados como aplicacao real nesta auditoria; a conclusao `OK` refere-se a completude documental/estatica do guia e ao encaixe previsto na sequencia BK.

## Mapa de integracao da MF
| BK | Ficheiros previstos no guia | Exports/contratos produzidos | Imports/contratos consumidos | Endpoint(s) | Recursos sensiveis | BKs seguintes dependentes |
| --- | --- | --- | --- | --- | --- | --- |
| `BK-MF2-01` | `skin-evolution.service.js`, `skin-evolution.controller.js`, `skin-evolution.routes.js`, `SkinEvolutionPage.jsx`, `app.js`, `App.jsx` | `getMySkinEvolution`, controller, route, pagina | `FaceAnalysis`, `requireAuth`, `apiRequest` | `GET /api/me/skin-evolution` | Analises faciais minimizadas | `BK-MF2-02`, `BK-MF3-01` |
| `BK-MF2-02` | `product-recommendation.model.js`, `recommendation.service.js`, `recommendation.controller.js`, `recommendation.routes.js`, `ProductRecommendationsPage.jsx`, `app.js`, `App.jsx` | `ProductRecommendation`, `generateRecommendationsForUser`, `listMyRecommendations`, ranking com `reasonCodes` cosmeticos | `FaceAnalysis`, `FaceReport` por `analysisId`, `Product`, `requireAuth` | `GET /api/recommendations`, `POST /api/recommendations/generate` | Dados derivados de analise facial; sem fotografia no DTO | `BK-MF2-03`, `BK-MF2-04`, `BK-MF2-05`, `BK-MF2-06`, `BK-MF2-08`, `BK-MF8-05` |
| `BK-MF2-03` | `recommendation-reason.service.js`, `recommendation-reason.test.js`, `recommendation.service.js`, `ProductRecommendationsPage.jsx` | `buildRecommendationReason`, `reasonCodes`, `sourceSignals`, `explanation` | `ProductRecommendation`, ranking de `recommendation.service.js` | Reutiliza `POST /api/recommendations/generate` | Motivos publicos minimizados | `BK-MF2-04`, `BK-MF2-06`, `BK-MF8-05` |
| `BK-MF2-04` | `recommendation-feedback.validator.js`, `recommendation.service.js`, `recommendation.controller.js`, `recommendation.routes.js`, `ProductRecommendationsPage.jsx` | validators de feedback, `submitRecommendationFeedback` | `ProductRecommendation`, `requireAuth` | `POST /api/recommendations/:recommendationId/feedback` | Ownership de recomendacao | `BK-MF2-05` |
| `BK-MF2-05` | `daily-routine.model.js`, `daily-routine.service.js`, `daily-routine.controller.js`, `daily-routine.routes.js`, `DailyRoutinePage.jsx`, `app.js`, `App.jsx` | `DailyRoutine`, `generateDailyRoutineForUser`, `getMyDailyRoutine`, passos `manha` e `noite` | `ProductRecommendation`, `requireAuth` | `GET /api/me/daily-routine`, `POST /api/me/daily-routine/generate` | Recomendacoes derivadas de analise | `BK-MF4-05` |
| `BK-MF2-06` | `recommendation-review.model.js`, `recommendation-review.validator.js`, `recommendation-review.service.js`, `recommendation-review.controller.js`, `recommendation-review.routes.js`, `ConsultantRecommendationReviewPage.jsx`, `app.js`, `App.jsx` | `RecommendationReview`, `reviewRecommendation` | `ProductRecommendation`, `ROLES`, `requireAuth`, `requireRole` | `POST /api/consultant/recommendations/:recommendationId/reviews` | Recomendacao derivada de analise; sem fotos | `BK-MF5-04`, `RF44` futuro |
| `BK-MF2-07` | `makeup-simulation.provider.js`, `makeup-simulation.model.js`, `makeup-simulation.validator.js`, `makeup-simulation.service.js`, `makeup-simulation.controller.js`, `makeup-simulation.routes.js`, `MakeupSimulationPage.jsx`, `app.js`, `App.jsx` | `MakeupSimulation`, `createMakeupPreview`, `createMakeupSimulationForUser` | `FacePhoto`, `Product`, `ensureActiveFaceConsent`, `requireAuth` | `POST /api/makeup-simulations` | Fotografia frontal privada e consentimento | `BK-MF2-08`, `BK-MF8-07` |
| `BK-MF2-08` | `before-after-visualization.provider.js`, `before-after-visualization.model.js`, `before-after-visualization.validator.js`, `before-after-visualization.service.js`, `before-after-visualization.controller.js`, `before-after-visualization.routes.js`, `BeforeAfterVisualizationPage.jsx`, `app.js`, `App.jsx` | `BeforeAfterVisualization`, provider, service, controller, route, pagina | `FaceConsent`, `MakeupSimulation`, `ProductRecommendation`, `requireAuth` | `POST /api/before-after-visualizations` | Consentimento revalidado; sem fotografia publica | `BK-MF3-01`, `BK-MF8-05`, `BK-MF8-06`, `BK-MF8-07` |

## Coerencia global da MF
- Nao foram detetados endpoints duplicados para a mesma acao principal.
- `POST /api/recommendations/generate` permanece o unico endpoint de geracao de recomendacoes.
- Feedback, rotina, revisao, simulacao e visualizacao usam endpoints distintos.
- Os BKs evitam carrinho, encomenda e pagamento na `MF2`.
- Os fluxos biometricos exigem sessao e consentimento onde aplicavel.
- Os DTOs de `BK-MF2-07` e `BK-MF2-08` evitam devolver fotografia, `storageKey`, path interno, `facePhotoId` e `consentId`.
- A coerencia global de `ProductRecommendation` fica fechada para ranking, motivo, feedback, rotina e revisao.

## Decisoes tecnicas confirmadas
- CANONICO: backend recomendado em Node.js + Express com ES Modules.
- CANONICO: frontend recomendado em React + Vite.
- CANONICO: persistencia em MongoDB/Mongoose.
- CANONICO: sessao por cookie `HttpOnly`; frontend deve usar `credentials: "include"` e nao guardar tokens no `localStorage`.
- CANONICO: `RF17` a `RF24` pertencem ao nucleo de consultoria inteligente, recomendacao e simulacao baseline.
- CANONICO: toda a `MF2` esta classificada como `CORE-IA` em `ANEXO-CORE-DUAL-BK.md`.
- CANONICO: carrinho, encomenda, pagamento e historico de compra ficam fora da `MF2`.
- CANONICO: `RF23` exige fotografia facial e consentimento; `RF24` depende de `RF23`.
- CANONICO: consultores e administradores devem ser autorizados por role no backend, nao apenas no frontend.

## Decisoes DERIVADO registadas
- DERIVADO: `BK-MF2-01` calcula evolucao temporal a partir de `FaceAnalysis.findings`, sem voltar a expor fotografias.
- DERIVADO: `BK-MF2-02` usa ranking local por score, sem provider externo real nesta fase.
- DERIVADO: `BK-MF2-02` usa termos do nome, descricao e ingredientes do produto como compatibilidade cosmetica inicial ate existir motor de recomendacao mais avancado.
- DERIVADO: `BK-MF2-05` usa `source: "recommendations"` ate existirem compras reais na `MF3`, apesar de `RF21` falar em produtos adquiridos.
- DERIVADO: `BK-MF2-06` autoriza `consultor` e `administrador` por role enquanto nao existe entidade canonica de atribuicao consultor-cliente.
- DERIVADO: `BK-MF2-07` e `BK-MF2-08` usam providers locais controlados para entregar simulacao/visualizacao baseline sem publicar fotografia privada.

## Drift documental encontrado
- Drift entre prompt atual e documentacao/validador: `BACKLOG-MVP.md`, `PLANO-SPRINTS.md`, `_TEMPLATE-BK.md` e `docs/planificacao/scripts/auditar_planificacao.py` ainda exigem seccao/contrato de `Snippet tecnico aplicavel`, enquanto a prompt atual proibe a palavra `snippet` nos BKs dos alunos.
- O validador pode classificar a `MF2` como incompleta se continuar a exigir essa seccao. Nesta auditoria, a ausencia da seccao nos BKs da `MF2` foi considerada coerente com a prompt atual.
- Alguns BKs posteriores consultados ainda estao em formato curto/legado e contem `Snippet tecnico orientado...`; isso nao bloqueia a classificacao da `MF2`, mas afeta a continuidade documental futura.
- O relatorio `MF0` marca os BKs como `OK`, mas os headers de varios BKs `MF0` ainda mostram `estado: TODO`. Esse drift nao foi corrigido por estar fora do escopo `MF2`.

## Riscos de seguranca/privacidade restantes
- `BK-MF2-02` a `BK-MF2-06`: risco baixo direto de privacidade; continuam a usar dados derivados de analise facial e devem manter DTOs minimizados.
- `BK-MF2-07` e `BK-MF2-08`: risco biometrico medio por tratarem fotografia/simulacao; os guias mitigam com sessao, consentimento, ownership e DTO sem ficheiros privados.
- `BK-MF5-04` continua necessario para auditoria formal de acessos biometricos; a `MF2` minimiza dados, mas nao implementa trilho completo de auditoria.
- `BK-MF4-08` deve reforcar recomendacoes contra alergias, ingredientes a evitar e restricoes medicas leves quando esse requisito entrar.
- `RNF11`, `RNF12`, `RNF23`, `RNF24` e `RNF25` continuam a precisar de hardening especifico nas macrofases posteriores.

## Verificacoes textuais executadas
| Comando | Resultado | Observacoes |
| --- | --- | --- |
| `rg -n "StudyFlow|sala de estudo|turma oficial|disciplina|material oficial|IA da sala|IA da turma|professor|aluno inscrito|hidrata|pós-auditoria|scaffold|roteiro genérico|conversa interna|este guia deixa de ser|código ainda não corrigido|snippet|exemplo simplificado|implementar depois|quando aplicável|helpers chamados|substitu(ir|i)r? mocks|pseudo-código|solução parcial|payload: unknown|as any|ContextAction|contextApi" docs/planificacao/guias-bk/MF2/*.md` | PASS | Sem ocorrencias; `rg` devolveu exit code `1`, que significa zero matches. |
| `git diff --check` | PASS | Sem whitespace errors; exit code `0`. |
| `bash scripts/validate-planificacao.sh` | FAIL | `coverage_pass=true`, `consistency_pass=true`, `naming_pass=true`, `guides_pass=false`, `overall_pass=false`. O validador lista `missing_pedagogic_or_operational_blocks` em `BK-MF2-01` a `BK-MF2-08`. |

## Resumo final da auditoria
- MF processada: `MF2`.
- Numero de BKs analisados: `8`.
- Contagem OK/PARCIAL/CRITICO antes: `OK=8`, `PARCIAL=0`, `CRITICO=0`.
- Contagem OK/PARCIAL/CRITICO depois: `OK=8`, `PARCIAL=0`, `CRITICO=0`.
- BKs editados: nenhum.
- Principais lacunas corrigidas: nenhuma nesta execucao; modo `auditar_apenas`.
- Decisoes tecnicas confirmadas: stack Node/Express, React/Vite, MongoDB/Mongoose, cookies `HttpOnly`, `CORE-IA`, separacao entre recomendacao/simulacao e comercio.
- Decisoes marcadas como `DERIVADO`: ranking local, match inicial por texto de produto, rotina a partir de recomendacoes ate existirem compras, revisao por role sem entidade consultor-cliente, providers locais baseline.
- Drift documental encontrado: prompt atual proibe `snippet` nos BKs dos alunos, mas template/validador/documentos canonicos ainda exigem essa seccao.
- Riscos de seguranca/privacidade restantes: manter minimizacao de DTOs biometricos, aplicar auditoria futura, encriptacao futura e reforcar recomendacoes contra restricoes de `RF40`.
- Verificacoes textuais executadas: comando oficial de termos proibidos, sem ocorrencias.
- Resultado de `git diff --check`: `PASS`.
- Resultado de `bash scripts/validate-planificacao.sh`: `FAIL`; `guide_content_issues` aponta `missing_pedagogic_or_operational_blocks` nos 8 BKs da `MF2`.
- Bloqueios ou TODOs restantes: alinhar validador/contrato documental com a decisao final sobre a palavra/seccao `snippet`.

## Ordem recomendada de correcao
1. Nao corrigir BKs da `MF2` neste modo; manter os oito BKs como `OK`.
2. Alinhar `docs/planificacao/scripts/auditar_planificacao.py`, `BACKLOG-MVP.md`, `PLANO-SPRINTS.md` e `_TEMPLATE-BK.md` com a decisao final sobre a seccao `Snippet tecnico aplicavel`.
3. Hidratar os BKs posteriores que dependem da `MF2`, sobretudo `BK-MF4-05`, `BK-MF5-04`, `BK-MF8-05`, `BK-MF8-06` e `BK-MF8-07`.
4. Revalidar `MF2` depois do alinhamento documental, para garantir que a prompt atual e o validador automatico medem o mesmo contrato.
