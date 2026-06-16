# Auditoria de hidratacao pedagogica/tecnica - MF4

## Header
- `doc_id`: `AUDITORIA-HIDRATACAO-MF4`
- `mf_alvo`: `MF4`
- `modo`: `auditar_apenas`
- `data_execucao`: `2026-06-16`
- `relatorio`: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF4.md`
- `status`: `auditado_ok_com_validador_legacy_pendente`
- `output_mode`: `relatorio_e_resumo`
- `bk_ids`: `todos_os_bks_mf4`
- `strict_scope`: `true`
- `permitir_alterar_docs`: `sim`
- `permitir_commits`: `nao`

## Objetivo
Auditar os 6 guias BK da macrofase `MF4` sem editar BKs, confirmando se estao pedagogicamente autocontidos, tecnicamente executaveis, coerentes com os documentos canonicos da Orelle e alinhados com os contratos de `MF3` e `MF5`.

Esta execucao normaliza o relatorio anterior, que estava em modo `corrigir_apenas`, para a fotografia atual pedida na prompt: `auditar_apenas`. Nenhum BK da `MF4`, documento canonico, prompt, template, script, codigo real ou ficheiro legacy foi editado nesta execucao. O unico ficheiro atualizado e este relatorio.

## Contexto de worktree
- No inicio da execucao ja existiam alteracoes locais nos seis BKs da `MF4`.
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF4.md` ja existia como ficheiro nao versionado.
- As alteracoes dos BKs foram tratadas como trabalho existente do repositorio e auditadas no estado atual do working tree.
- `mockup/` nao existe neste checkout; por isso nao houve referencia visual a consultar.
- `agent/legacy/**` nao foi consultado nem alterado.

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
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF0.md`
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF1.md`
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF2.md`
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF3.md`
- Todos os BKs em `docs/planificacao/guias-bk/MF0/`, `MF1/`, `MF2/`, `MF3/`, `MF4/` e `MF5/`.
- Codigo real em `real_dev/api` e `real_dev/web`, tratado como implementacao inicial a validar e nao como fonte de verdade quando pudesse contrariar documentos canonicos.

## Documentos em falta
Nenhum documento obrigatorio em falta.

## Contexto canonico da MF4
- `MF4` tem 6 BKs oficiais: `BK-MF4-01`, `BK-MF4-02`, `BK-MF4-03`, `BK-MF4-04`, `BK-MF4-05` e `BK-MF4-08`.
- A cobertura funcional e `RF33`, `RF34`, `RF35`, `RF36`, `RF37` e `RF40`.
- A prioridade canonica e `P0=3`, `P1=3`, `P2=0`.
- A janela canonica e `S08-S09`.
- `BK-MF4-01`, `BK-MF4-02`, `BK-MF4-03`, `BK-MF4-05` e `BK-MF4-08` sao `CORE-HIBRIDO`; `BK-MF4-04` e `CORE-COM`.
- `BK-MF3-08` faz handoff para `BK-MF4-01`; `BK-MF4-08` faz handoff para `BK-MF5-01`.

## MFs implementadas inferidas
- `real_dev/api` tem testes reais para `MF0`, `MF1`, `MF2` e `MF3`.
- `npm --prefix real_dev/api test` passou fora da sandbox com `15` ficheiros e `116` testes.
- `real_dev/web` compila com `npm --prefix real_dev/web run build`.
- `real_dev` ainda nao tem implementacao runtime completa da `MF4`: existe apenas o modulo parcial de administracao de utilizadores herdado de roles (`PATCH /api/admin/users/:id/role`), sem os contratos completos de ativar/suspender/eliminar contas, moderacao, exportacoes, notificacoes, alertas de rotina ou restricoes de recomendacao.
- Esta diferenca e uma limitacao de validacao runtime, nao uma falha dos BKs, porque os guias `MF4` indicam os ficheiros completos a criar/editar.

## Resumo de classificacao
| Momento | OK | PARCIAL | CRITICO | Total |
| --- | ---: | ---: | ---: | ---: |
| Estado no inicio desta execucao `auditar_apenas` | 6 | 0 | 0 | 6 |
| Estado apos reauditoria desta execucao | 6 | 0 | 0 | 6 |

Nota: como o modo desta execucao foi `auditar_apenas`, a contagem "antes" e "depois" e igual. Nao houve correcao de BKs nesta execucao.

## BKs editados
Nenhum BK da `MF4` foi editado nesta execucao.

## Resultado por BK
| BK | RF | Estado | Evidencia principal |
| --- | --- | --- | --- |
| `BK-MF4-01` | `RF33` | `OK` | Define gestao admin de contas com `accountStatus`, bloqueio de login/sessao inativa, `GET/PATCH/DELETE /api/admin/users`, `requireAuth`, `requireRole(ROLES.ADMIN)`, DTO sem `passwordHash` e negativos de auto-acao, role e conta inexistente. |
| `BK-MF4-02` | `RF34` | `OK` | Reutiliza `Review`, acrescenta metadados de moderacao, protege `GET/PATCH /api/admin/reviews` com role admin e preserva `rating`, `comment` e `userId` do cliente. |
| `BK-MF4-03` | `RF35` | `OK` | Exporta vendas, utilizadores e relatorios IA com minimizacao, CSV/PDF controlados, `GET /api/admin/exports/:dataset`, sem `passwordHash`, `storageKey`, cookies, imagens ou relatorios faciais integrais. |
| `BK-MF4-04` | `RF36` | `OK` | Cria notificacoes internas autenticadas para promocoes, novos produtos e estado de encomenda, separa notificacao de compra, aplica ownership em `/api/me/notifications` e restringe campanhas a admin. |
| `BK-MF4-05` | `RF37` | `OK` | Implementa preferencias pessoais de alertas de rotina e execucao admin idempotente por `createDueRoutineAlerts(now)`, sem promessas clinicas nem agendador externo inventado. |
| `BK-MF4-08` | `RF40` | `OK` | Estende `Profile` com alergias, ingredientes a evitar e restricoes leves, preserva validators de perfil existentes, bloqueia produtos incompativeis antes de persistir recomendacoes e usa o contrato `GET/PUT /api/profile/me`. |

## Evidencia estrutural da reauditoria
| BK | Linhas | Passos lineares | Blocos JS/JSX/TS/TSX | Marcadores JSDoc | Secoes obrigatorias | Itens 1-7 por passo |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `BK-MF4-01` | 921 | 8 | 9 | 14 | `OK` | `OK` |
| `BK-MF4-02` | 706 | 7 | 8 | 10 | `OK` | `OK` |
| `BK-MF4-03` | 695 | 7 | 8 | 10 | `OK` | `OK` |
| `BK-MF4-04` | 999 | 8 | 10 | 15 | `OK` | `OK` |
| `BK-MF4-05` | 781 | 7 | 7 | 6 | `OK` | `OK` |
| `BK-MF4-08` | 1382 | 8 | 9 | 21 | `OK` | `OK` |

Todos os BKs da `MF4` seguem a estrutura exigida nesta prompt: `#### Objetivo`, `#### Importância`, `#### Scope-in`, `#### Scope-out`, `#### Estado antes e depois`, `#### Pre-requisitos`, `#### Glossário`, `#### Conceitos teóricos essenciais`, `#### Arquitetura do BK`, `#### Ficheiros a criar/editar/rever`, `#### Tutorial técnico linear`, passos com itens `1` a `7`, `#### Expected results`, `#### Critérios de aceite`, `#### Validação final`, `#### Evidence para PR/defesa`, `#### Handoff` e `#### Changelog`.

## Gate de app funcional
| Criterio | Resultado |
| --- | --- |
| Imports apontam para ficheiros criados no proprio BK ou em BKs anteriores? | `OK` por revisao estatica dos caminhos e parsing dos blocos de codigo. |
| Controllers chamam services existentes ou criados no proprio BK? | `OK`. |
| Services usam models/schemas existentes ou criados no proprio BK? | `OK`. |
| Frontend chama endpoints reais definidos no backend previsto? | `OK`. |
| Tipos/payloads frontend correspondem ao backend? | `OK`; nao foi encontrado `payload: unknown`. |
| Fluxos autenticados usam sessao real? | `OK`; `requireAuth` e `apiRequest` com `credentials: "include"` suportam o contrato. |
| Role/ownership e aplicado no backend? | `OK`; endpoints admin usam `requireRole(ROLES.ADMIN)` e endpoints `/me` usam `req.user.id`. |
| Dados sensiveis sao minimizados? | `OK`; os BKs evitam expor `passwordHash`, imagens, cookies, paths internos, relatorios completos ou dados biometricos indevidos. |
| Fluxos comerciais mantem separacao entre catalogo, recomendacao, carrinho, encomenda e pagamento? | `OK`; notificacao e recomendacao nao compram nem adicionam produto automaticamente. |
| Proximo BK consegue construir sobre o anterior? | `OK` dentro da `MF4`; o risco restante esta em `MF5`, que ainda esta em formato curto/legacy. |

Nota de alcance: a conclusao `OK` e documental/estatica. A implementacao runtime completa de `MF4` ainda nao existe em `real_dev`.

## Findings

### `ORELLE-MF4-VALIDADOR-P2-001`
- Severidade: `P2`.
- BK/RF/RNF afetado: `MF4` completa; impacto indireto em `BK-MF4-01`, `BK-MF4-02`, `BK-MF4-03`, `BK-MF4-04`, `BK-MF4-05` e `BK-MF4-08`.
- Estado do finding: `BLOQUEADO_POR_CONTRATO`.
- Expected: o validador oficial deve aceitar a estrutura atual exigida pela prompt (`#### ...` e passos lineares com itens 1-7), ou a documentacao canonica deve voltar a exigir a estrutura legacy.
- Observed: `bash scripts/validate-planificacao.sh` devolve `overall_pass=false`, `guides_pass=false`, `coverage_pass=true`, `consistency_pass=true` e `naming_pass=true`.
- Evidencia objetiva: o output do validador aponta `missing_pedagogic_or_operational_blocks`, `missing_test_matrix_section`, `negative_policy_step_mismatch` e `negative_policy_validacao_mismatch` para todos os BKs `MF4`; no `BK-MF4-05` tambem aponta `negative_policy_criterio_mismatch(expected=2,actual=3)`.
- Ficheiro/linha quando possivel: `docs/planificacao/guias-bk/_TEMPLATE-BK.md` ainda descreve `## Bloco pedagogico`, `## Bloco operacional` e `### Matriz minima de testes por prioridade`; `docs/planificacao/sprints/PLANO-SPRINTS.md` ainda contem a matriz minima de testes por prioridade.
- Impacto pedagogico: o gate automatico pode sinalizar como incompletos guias que cumprem a estrutura tutorial mais recente desta prompt.
- Impacto tecnico: o fecho automatizado da planificacao fica bloqueado apesar de cobertura, consistencia e naming passarem.
- Impacto de seguranca/privacidade/legal: indireto; pode atrasar a validacao automatizada de BKs com regras de seguranca e privacidade ja explicitadas.
- Causa provavel: drift entre a prompt editorial atual e o validador/template canonico ainda baseado no formato anterior.
- Correcao recomendada: alinhar `docs/planificacao/scripts/auditar_planificacao.py`, `_TEMPLATE-BK.md` e criterios documentais com a estrutura atual, sem reintroduzir blocos legacy nos BKs `MF4`.
- Validacao necessaria para fechar: `bash scripts/validate-planificacao.sh` deve passar com `overall_pass=true` sem alterar negativamente os BKs `MF4`.
- Bloqueia a MF: bloqueia o gate automatico documental; nao altera a classificacao pedagogica `OK` dos BKs `MF4`.

### `ORELLE-MF4-MF5-HANDOFF-P3-001`
- Severidade: `P3`.
- BK/RF/RNF afetado: handoff `BK-MF4-08 -> BK-MF5-01` e coerencia vizinha `MF5`.
- Estado do finding: `BLOQUEADO_POR_SCOPE`.
- Expected: `BK-MF5-01` deve conseguir consumir o handoff de `BK-MF4-08` com tutorial tecnico linear, passos 1-7, codigo completo e regras de privacidade/anonymizacao.
- Observed: os BKs `MF5` existem, mas continuam em formato curto/legacy; `BK-MF5-01` tem cerca de 124 linhas, nao tem passos `### Passo N - ...` e nao segue a estrutura tutorial exigida para os BKs atuais.
- Evidencia objetiva: inventario estrutural local: `MF5` tem 6 ficheiros, 0 passos lineares e secoes legacy `## Bloco pedagogico`, `## Bloco operacional`, `## Snippet tecnico aplicavel`.
- Ficheiro/linha quando possivel: `docs/planificacao/guias-bk/MF5/BK-MF5-01-painel-para-consultores-admins-reverem-e-aprovarem-pedidos-de-eliminacao-anonymizacao-de-fotografias-e-relatorios.md`.
- Impacto pedagogico: alunos podem receber um handoff forte de `MF4`, mas cair num BK seguinte que ainda nao explica como implementar eliminacao/anonymizacao de dados biometricos de forma executavel.
- Impacto tecnico: continuidade de privacidade operacional fica dependente de hidratacao futura de `MF5`.
- Impacto de seguranca/privacidade/legal: medio, porque `BK-MF5-01` trata eliminacao/anonymizacao de fotografias e relatorios.
- Causa provavel: `MF5` ainda nao foi hidratada para a estrutura nova.
- Correcao recomendada: auditar/hidratar `MF5` em execucao propria, com foco inicial em `BK-MF5-01` e `BK-MF5-04`.
- Validacao necessaria para fechar: reauditoria `MF5` com passos lineares, codigo completo, ownership, roles, auditoria e negativos de dados biometricos.
- Bloqueia a MF: nao bloqueia `MF4`; bloqueia apenas a continuidade `MF4 -> MF5` ate `MF5` ser auditada.

## Pesquisa estatica e falsos positivos
- A pesquisa obrigatoria de termos proibidos/riscos em `docs/planificacao/guias-bk/MF4/*.md` devolveu 3 matches.
- `docs/planificacao/guias-bk/MF4/BK-MF4-08-...md:203`: `diagnóstico médico automático`.
- `docs/planificacao/guias-bk/MF4/BK-MF4-08-...md:747`: `objetivosTexto: "hidratar"`.
- `docs/planificacao/guias-bk/MF4/BK-MF4-08-...md:1282`: `"Gel hidratante"`.
- Justificacao: `diagnóstico médico automático` aparece como limite explicito para impedir claims medicos, e os dois matches de `hidrata` pertencem ao dominio cosmetico documentado em `RF03` e ao exemplo de produto, nao a linguagem interna de auditoria/hidratacao.
- Nao foram encontrados `payload: unknown`, `as any`, `localStorage`, `sessionStorage`, `dangerouslySetInnerHTML`, `eval`, `new Function`, `deleteMany({})`, claims medicos bloqueantes, treino externo, RAG, embeddings, dominios indevidos ou linguagem de scaffold nos BKs `MF4`.
- `GET /api/notifications?userId=...` aparece em `BK-MF4-04` apenas como cenario negativo explicito para evitar enumeracao por `userId`; nao e endpoint implementado.

## Mapa de integracao da MF
| BK | Ficheiros previstos nos guias | Exports/servicos principais | Endpoints | Regras de seguranca/autorizacao | Dependencias seguintes |
| --- | --- | --- | --- | --- | --- |
| `BK-MF4-01` | `user.model.js`, `auth.service.js`, `auth.middleware.js`, `admin-users.service.js`, `admin-users.controller.js`, `admin-users.routes.js`, `AdminUsersPage.jsx`, `App.jsx`, `mf4.admin-users.test.js` | `ACCOUNT_STATUSES`, `listAdminUsers`, `setUserAccountStatus`, `softDeleteUserAccount` | `GET /api/admin/users`, `PATCH /api/admin/users/:id/status`, `DELETE /api/admin/users/:id` | `requireAuth`, `requireRole(ROLES.ADMIN)`, bloqueio de auto-acao, DTO sem `passwordHash`, eliminacao logica sem apagar biometricos | `BK-MF4-02`; `BK-MF5-01` assume que eliminacao/anonymizacao biometrica continua separada. |
| `BK-MF4-02` | `review.model.js`, `admin-review.validator.js`, `admin-review.service.js`, `admin-review.controller.js`, `admin-review.routes.js`, `AdminReviewsPage.jsx`, `App.jsx`, `mf4.admin-reviews.test.js` | `validateReviewModerationInput`, `listAdminReviews`, `moderateReview` | `GET /api/admin/reviews`, `PATCH /api/admin/reviews/:reviewId` | `requireAuth`, `requireRole(ROLES.ADMIN)`, preserva review original e evita endpoint publico de moderacao | `BK-MF4-03` pode exportar dados agregados sem expor comentarios indevidos. |
| `BK-MF4-03` | `admin-export.validator.js`, `admin-export.service.js`, `admin-export.controller.js`, `admin-export.routes.js`, `AdminExportsPage.jsx`, `App.jsx`, `mf4.admin-exports.test.js` | `validateAdminExportRequest`, `buildCsv`, `buildSimplePdf`, `buildAdminExport` | `GET /api/admin/exports/:dataset?format=csv|pdf` | `requireAuth`, `requireRole(ROLES.ADMIN)`, minimizacao, sem `passwordHash`, `storageKey`, imagens, cookies ou paths internos | `BK-MF4-04`; `RNF16/BK-MF7-05` pode evoluir exportacao PDF. |
| `BK-MF4-04` | `notification.model.js`, `notification.validator.js`, `notification.service.js`, `notification.controller.js`, `notification.routes.js`, `NotificationsPage.jsx`, `AdminNotificationsPage.jsx`, `order.service.js`, `mf4.notifications.test.js` | `createCampaignNotification`, `listMyNotifications`, `markMyNotificationAsRead`, `createOrderStatusNotification`, `updateOrderStatusAndNotify` | `GET /api/me/notifications`, `PATCH /api/me/notifications/:notificationId/read`, `POST /api/admin/notifications/campaigns` | ownership por `req.user.id`, admin para campanhas, sem `userId` funcional vindo do browser, sem compra automatica | `BK-MF4-05` reutiliza `Notification`. |
| `BK-MF4-05` | `routine-alert-preference.model.js`, `routine-alert.validator.js`, `routine-alert.service.js`, `routine-alert.controller.js`, `routine-alert.routes.js`, `RoutineAlertsPage.jsx`, `App.jsx`, `mf4.routine-alerts.test.js` | `validateRoutineAlertPreferenceInput`, `getMyRoutineAlertPreference`, `updateMyRoutineAlertPreference`, `createDueRoutineAlerts` | `GET /api/me/routine-alerts`, `PUT /api/me/routine-alerts`, `POST /api/admin/routine-alerts/run` | ownership por sessao, admin para execucao, idempotencia por `lastNotificationKey`, sem promessas clinicas | `BK-MF4-08` deve impedir recomendacoes incompativeis com restricoes. |
| `BK-MF4-08` | `profile.model.js`, `profile.validator.js`, `profile.service.js`, `recommendation-restrictions.service.js`, `recommendation.service.js`, `EditProfilePage.jsx`, `ProductRecommendationsPage.jsx`, `mf4.restrictions.test.js`, `mf4.restrictions.integration.test.js` | `validateCreateProfileInput`, `validateUpdateProfileInput`, `getBlockedIngredientsFromProfile`, `filterProductsBlockedByProfile`, `generateRecommendationsForUser` | `GET/PUT /api/profile/me`, `POST /api/recommendations/generate` | ownership por perfil da sessao, restricoes aplicadas no backend antes de persistir recomendacao, sem diagnostico medico, sem acao automatica de compra | `BK-MF5-01` e `BK-MF5-04` continuam privacidade/anonymizacao/auditoria biometrica; `MF8` reforca explicabilidade e nao discriminacao. |

## Coerencia MF3 -> MF4 -> MF5
- `MF3 -> MF4`: `MF4` consome contratos de `Order`, dashboard, produtos, reviews, rotinas e recomendacoes sem misturar carrinho, encomenda, pagamento e notificacao.
- Dentro de `MF4`: contas, reviews, exportacoes, notificacoes, alertas e restricoes ficam em fronteiras separadas, com endpoints e services distintos.
- `MF4 -> MF5`: `BK-MF4-01` faz eliminacao logica de conta; eliminacao/anonymizacao de fotografias e relatorios fica corretamente para `BK-MF5-01`. Auditoria de acessos biometricos continua em `BK-MF5-04`.
- `MF5` ainda esta em formato legacy e sem tutorial tecnico linear completo; isso nao bloqueia `MF4`, mas e risco real para a continuidade quando `MF5` for auditada.

## Decisoes tecnicas confirmadas
- `CANONICO`: `MF4` cobre `RF33`, `RF34`, `RF35`, `RF36`, `RF37` e `RF40`.
- `CANONICO`: `RF40` impede recomendacoes incompativeis com alergias, ingredientes a evitar e restricoes medicas leves indicadas pelo utilizador.
- `CANONICO`: ownership, role admin e filtragem de dados sensiveis pertencem ao backend.
- `CANONICO`: produtos recomendados nao sao adicionados automaticamente ao carrinho.
- `DERIVADO`: `RF36` e cumprido no MVP por notificacoes internas autenticadas, sem inventar email/SMS/push provider.
- `DERIVADO`: `RF35` usa CSV compativel com Excel e PDF textual simples/minimizado; exportacao PDF avancada fica para `RNF16`.
- `DERIVADO`: `BK-MF4-05` usa execucao admin explicita de alertas devidos em vez de agendador distribuido.
- `DERIVADO`: `BK-MF4-08` compara ingredientes normalizados por igualdade de termos, evitando bloqueios por substring indevida.

## Drift documental encontrado
- `scripts/validate-planificacao.sh` delega para `docs/planificacao/scripts/auditar_planificacao.py`, que ainda valida estrutura legacy para os BKs `MF4`.
- `_TEMPLATE-BK.md` continua a pedir `## Bloco pedagogico`, `## Bloco operacional` e `### Matriz minima de testes por prioridade`, enquanto os BKs `MF4` seguem a estrutura nova exigida pela prompt.
- `PLANO-SPRINTS.md` ainda nomeia `## Matriz minima de testes por prioridade`.
- A prompt desta execucao proibe layout alternativo e exige a ordem `#### ...`; por `STRICT_SCOPE=true`, este drift foi registado e nao corrigido.

## Riscos restantes
- O gate automatico documental falha enquanto o validador/template nao forem alinhados com a estrutura atual.
- `MF4` ainda nao esta implementada no runtime real; os testes MF4 existem como codigo nos guias, nao como ficheiros executados em `real_dev/api/tests`.
- A implementacao real existente de `admin-users` cobre apenas alteracao de role herdada de `MF0`; ao aplicar `BK-MF4-01`, sera necessario estender sem quebrar `updateUserRole`.
- A futura implementacao runtime de `BK-MF4-08` deve filtrar produtos antes de persistir `ProductRecommendation` e deve atualizar a UI sem expor dados sensiveis.
- `MF5` precisa de hidratacao propria para fechar privacidade/anonymizacao/auditoria apos o handoff de `MF4`.

## Validacoes executadas
| Comando/verificacao | Resultado | Observacao |
| --- | --- | --- |
| Inventario estrutural dos BKs `MF4` por script Node local | `PASS` | 6/6 BKs com todas as secoes obrigatorias e itens `1` a `7` em todos os passos. |
| Parsing `esbuild` dos blocos `js/jsx/ts/tsx` dos BKs `MF4` | `PASS` | 51 blocos verificados sem erros de sintaxe/parsing. |
| `rg` de termos proibidos/riscos em `docs/planificacao/guias-bk/MF4/*.md` | `PASS_COM_FALSOS_POSITIVOS` | 3 matches legitimos: limite contra `diagnóstico médico automático`, `hidratar` e `Gel hidratante`. |
| `rg` alargado de tokens, secrets, storage, mocks, stubs, claims, pagamentos e IA em `MF4` + `real_dev` | `INFO` | Matches analisados como testes, exemplos negativos, comentarios de seguranca ou implementacao existente coerente; sem finding novo para `MF4`. |
| `git diff --check` | `PASS` | Sem erros de whitespace apos a escrita deste relatorio. |
| `bash scripts/validate-planificacao.sh` | `FAIL_ESPERADO` | `coverage_pass=true`, `consistency_pass=true`, `naming_pass=true`, `guides_pass=false`, `overall_pass=false`; falha por contrato legacy. |
| `npm --prefix real_dev/web run build` | `PASS` | Vite build concluido; 60 modulos transformados. |
| `npm --prefix real_dev/api test` no sandbox | `FAIL_SANDBOX` | Falhou com `listen EPERM: operation not permitted 0.0.0.0`. |
| `npm --prefix real_dev/api test` fora da sandbox aprovado | `PASS` | 15 ficheiros, 116 testes passados. |

## Validacoes nao executadas
- Nao foram executados testes runtime especificos da `MF4`, porque `real_dev/api/tests/mf4.*.test.js` ainda nao existe no codigo real; esses testes estao documentados nos BKs.
- Nao foi gerado PDF real do `BK-MF4-03`, porque a implementacao runtime de exportacao ainda nao existe.
- Nao foi executado E2E browser da `MF4`, porque esta execucao e auditoria documental/estatica e nao implementou as paginas `MF4` em `real_dev/web`.

## Ordem recomendada de correcao
1. Alinhar `docs/planificacao/scripts/auditar_planificacao.py`, `_TEMPLATE-BK.md` e referencias de sprint com a estrutura nova antes de usar o validador como gate absoluto para `MF4`.
2. Quando a implementacao real da `MF4` comecar, aplicar os BKs por ordem canonica e criar os testes `mf4.*.test.js` indicados nos guias.
3. Auditar/hidratar `MF5` a seguir, sobretudo `BK-MF5-01` e `BK-MF5-04`, porque recebem o handoff de privacidade e dados biometricos.

## Resumo final da auditoria
- MF processada: `MF4`.
- Numero de BKs analisados: `6`.
- Contagem OK/PARCIAL/CRITICO antes desta execucao: `OK=6`, `PARCIAL=0`, `CRITICO=0`.
- Contagem OK/PARCIAL/CRITICO depois desta execucao: `OK=6`, `PARCIAL=0`, `CRITICO=0`.
- BKs editados: nenhum.
- Relatorio atualizado: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF4.md`.
- Principais lacunas corrigidas: nenhuma; modo `auditar_apenas`.
- Decisoes tecnicas confirmadas: endpoints admin/me separados, ownership por sessao, role admin no backend, minimizacao de exportacoes, notificacoes internas MVP, alertas idempotentes e filtro de restricoes antes de recomendacao.
- Decisoes de dominio confirmadas: `RF33` contas, `RF34` moderacao, `RF35` exportacao, `RF36` notificacoes, `RF37` alertas de rotina, `RF40` restricoes cosmeticas declaradas.
- Decisoes marcadas como `DERIVADO`: CSV para Excel, PDF textual simples, notificacoes internas, execucao admin de alertas e comparacao normalizada de ingredientes.
- Drift documental encontrado: validador/template legacy vs estrutura atual dos BKs `MF4`.
- Riscos restantes: validador automatico falha por contrato legacy; runtime `MF4` ainda nao implementado; `MF5` ainda esta em formato legacy.
- Coerencia `MF3 -> MF4 -> MF5`: preservada documentalmente em `MF4`; `MF5` precisa de auditoria propria para continuar o handoff.
- Verificacoes textuais executadas: pesquisa de termos proibidos/riscos em `MF4`, com 2 falsos positivos justificados.
- Resultado de `git diff --check`: `PASS`.
- Resultado de `bash scripts/validate-planificacao.sh`: `FAIL_ESPERADO` por contrato legacy.
- Resultado de `npm --prefix real_dev/api test`: `PASS` fora da sandbox aprovada, `15` ficheiros e `116` testes.
- Resultado de `npm --prefix real_dev/web run build`: `PASS`.
- Bloqueios ou TODOs restantes: `ORELLE-MF4-VALIDADOR-P2-001` e `ORELLE-MF4-MF5-HANDOFF-P3-001`.
