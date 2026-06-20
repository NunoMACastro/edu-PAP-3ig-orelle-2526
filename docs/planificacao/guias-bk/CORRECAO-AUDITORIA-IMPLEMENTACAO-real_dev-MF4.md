# Correcao de auditoria da implementacao real - MF4

Data: 2026-06-18

Projeto: Orelle  
Modo executado: `corrigir_auditoria`  
Implementation root: `real_dev`  
Fonte de auditoria usada: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF4.md`  
Resultado geral: `CORRIGIDO`

## Escopo

Foram corrigidos os findings confirmados da auditoria MF4 com severidades `P1`, `P2` e o finding posterior `P3` `ORELLE-MF4-BK05-P3-001`, dentro de `real_dev/api` e `real_dev/web`.

Nao foram alterados BKs, guias canonicos, matriz, backlog, RF, RNF, prompts, `apps/`, `mockup/` ou `agent/legacy/**`.

Pastas ignoradas por escopo:

- `apps/`: trabalho dos alunos, apenas referencia auxiliar.
- `mockup/`: referencia visual, nao contrato tecnico.
- `agent/legacy/**`: explicitamente fora de referencia.

## BKs abrangidos

| BK | Estado | Nota |
| --- | --- | --- |
| BK-MF4-01 | `CORRIGIDO` | A role usada por `requireRole` passa a vir da conta persistida, nao do JWT antigo. |
| BK-MF4-02 | `NAO_APLICAVEL` | Sem finding alvo nesta execucao. |
| BK-MF4-03 | `CORRIGIDO` | Exportacao administrativa passa a devolver ficheiro descarregavel. |
| BK-MF4-04 | `NAO_APLICAVEL` | Sem finding alvo nesta execucao. |
| BK-MF4-05 | `CORRIGIDO` | A execução admin de alertas passa a validar `now` ISO opcional e a usar esse momento no service. |
| BK-MF4-06 | `NAO_APLICAVEL` | Sem finding alvo nesta execucao. |
| BK-MF4-07 | `NAO_APLICAVEL` | Sem finding alvo nesta execucao. |
| BK-MF4-08 | `CORRIGIDO` | Foi adicionada evidencia integrada para exclusao de produtos bloqueados por perfil. |

## Findings por severidade

| Severidade | Total | Corrigidos | Pendentes |
| --- | ---: | ---: | ---: |
| P0 | 0 | 0 | 0 |
| P1 | 3 | 3 | 0 |
| P2 | 1 | 1 | 0 |
| P3 | 1 | 1 | 0 |

## Estado final por finding

| Finding | Severidade | Estado | Evidencia de correcao |
| --- | --- | --- | --- |
| `ORELLE-MF4-BK01-P1-001` | P1 | `CORRIGIDO` | `auth.middleware.js` carrega `role isActive accountStatus` e substitui `req.user.role` pela role persistida antes de `requireRole`. Teste MF4 cobre token admin antigo com conta persistida cliente. |
| `ORELLE-MF4-BK03-P1-002` | P1 | `CORRIGIDO` | `admin-export.controller.js` envia `Content-Type`, `Content-Disposition`, `X-Orelle-Export-Rows` e body binario. Frontend usa `apiDownload` e descarrega `Blob`. Teste MF4 valida headers e conteudo CSV sem `passwordHash`. |
| `ORELLE-MF4-SEC-P1-003` | P1 | `CORRIGIDO` | `.env` local foi higienizado sem registar valores. `env.js` bloqueia segredos ausentes, curtos ou placeholders em producao. Teste MF4 cobre placeholders e segredo forte. Se a credencial antiga tiver sido partilhada fora deste ambiente local, a rotacao no provider continua recomendada operacionalmente. |
| `ORELLE-MF4-BK08-P2-004` | P2 | `CORRIGIDO` | Teste integrado `POST /api/recommendations/generate` confirma que produto com ingrediente declarado em alergia nao e devolvido nem passado a `ProductRecommendation.findOneAndUpdate`. |
| `ORELLE-MF4-BK05-P3-001` | P3 | `CORRIGIDO` | `routine-alert.validator.js` valida `now` ISO opcional, `routine-alert.controller.js` passa `input.now` para `createDueRoutineAlerts(input.now)`, e o teste MF4 cobre execucao deterministica e rejeicao de `now` invalido. |

## Rastreabilidade

| BK/RF/RNF | Ficheiros corrigidos | Testes/evidencia |
| --- | --- | --- |
| BK-MF4-01 / RF33 | `real_dev/api/src/middlewares/auth.middleware.js` | `real_dev/api/tests/mf4.integration.test.js` |
| BK-MF4-03 / RF35 | `real_dev/api/src/services/admin-export.service.js`, `real_dev/api/src/controllers/admin-export.controller.js`, `real_dev/web/src/services/apiClient.js`, `real_dev/web/src/pages/AdminExportsPage.jsx` | `real_dev/api/tests/mf4.integration.test.js`, `npm --prefix real_dev/web run build` |
| RNF14 / seguranca de sessao | `real_dev/api/src/config/env.js`, `real_dev/api/.env` | `real_dev/api/tests/mf4.integration.test.js`, pesquisa estatica de segredos |
| BK-MF4-08 / RF40 | `real_dev/api/tests/mf4.integration.test.js` | `npm --prefix real_dev/api test -- mf4.integration.test.js`, `npm --prefix real_dev/api test` |
| BK-MF4-05 / RF37 | `real_dev/api/src/validators/routine-alert.validator.js`, `real_dev/api/src/controllers/routine-alert.controller.js`, `real_dev/api/tests/mf4.integration.test.js` | `npm --prefix real_dev/api test -- tests/mf4.integration.test.js`, `npm --prefix real_dev/api test` |

## Mapa de integracao da MF

Contratos consumidos:

- Sessao HttpOnly e JWT de MF0 via `requireAuth` e `createSessionToken`.
- Roles canonicas de MF0/MF4 via `ROLES` e `requireRole`.
- Perfil cosmetico, analise facial, relatorio facial, catalogo e recomendacoes de MF2.
- Cliente API React/Vite com `credentials: "include"`.

Contratos entregues:

- Rotas protegidas por role passam a refletir alteracoes administrativas de role imediatamente apos revalidacao da conta.
- Endpoint `GET /api/admin/exports/:dataset?format=csv|pdf` entrega ficheiro descarregavel com headers HTTP apropriados.
- UI administrativa descarrega o ficheiro real da API sem expor conteudo sensivel no DOM.
- Recomendacoes mantem separacao entre recomendacao cosmetica e acao de compra e respeitam alergias/ingredientes a evitar.
- Arranque em producao bloqueia `SESSION_SECRET` inseguro.

## Coerencia entre MFs

MF anterior -> MF4:

- Preservado o contrato de sessao de MF0 com cookies HttpOnly e `credentials: "include"`.
- Preservados os contratos de recomendacao da MF2; a correcao adicionou evidencia integrada, sem alterar a logica de ranking.
- Preservados os contratos de checkout/pagamentos da MF3; apenas aparecem como falsos positivos na pesquisa estatica por gateways documentados.

MF4 -> MF seguinte:

- A role persistida fica mais segura para fluxos administrativos futuros.
- Exportacoes passam a ter contrato HTTP estavel para consumo por frontend e futuras automatizacoes.
- Guardrails de perfil em recomendacoes ficam cobertos por teste integrado reutilizavel.
- A execucao admin de alertas de rotina fica deterministica quando recebe `now` ISO, preservando a idempotencia por dia e melhorando a testabilidade do handoff MF4.

Nao foram detetadas regressao ou incompatibilidade entre MFs causada por esta correcao.

## Ficheiros alterados

- `real_dev/api/src/middlewares/auth.middleware.js`
- `real_dev/api/src/services/admin-export.service.js`
- `real_dev/api/src/controllers/admin-export.controller.js`
- `real_dev/api/src/config/env.js`
- `real_dev/api/.env`
- `real_dev/api/src/validators/routine-alert.validator.js`
- `real_dev/api/src/controllers/routine-alert.controller.js`
- `real_dev/api/tests/mf4.integration.test.js`
- `real_dev/web/src/services/apiClient.js`
- `real_dev/web/src/pages/AdminExportsPage.jsx`
- `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF4.md`

## Comandos executados

| Comando | Resultado |
| --- | --- |
| `npm --prefix real_dev/api test -- tests/mf4.integration.test.js` | Falhou no sandbox com `listen EPERM`; repetido fora do sandbox e passou: 1 ficheiro, 12 testes. |
| `npm --prefix real_dev/api test` | Passou: 16 ficheiros, 129 testes. |
| `npm --prefix real_dev/web run build` | Passou. |
| `git diff --check` | Passou. |
| `rg` de segredos inseguros ativos em `.env` | Sem ocorrencias ativas. |
| Pesquisa estatica ampla em `real_dev/api` e `real_dev/web`, excluindo `.env` | Apenas falsos positivos/ocorrencias esperadas: gateways documentados de pagamento, comentario contra `localStorage/sessionStorage`, texto de proibicao de treino externo e helper/testes de `SESSION_SECRET`. |
| `bash scripts/validate-planificacao.sh` | Falhou por qualidade dos guias MF4 ja existente: blocos pedagogicos/matriz de testes/politica negativa em guias canonicos. Fora de scope porque `PERMITIR_ALTERAR_DOCS=nao`. |

## Blockers e TODOs

Nao ha blockers de codigo para os findings corrigidos.

TODO operacional:

- Se a credencial MongoDB antiga existente no `.env` local tiver sido usada num ambiente real ou partilhada fora desta maquina, deve ser rodada no provider. A correcao local removeu a exposicao no ficheiro de trabalho, mas nao pode revogar credenciais externas.

TODO fora de scope:

- Corrigir qualidade dos guias MF4 reportada por `scripts/validate-planificacao.sh`, caso seja autorizado alterar documentacao canonica noutra execucao.

## Proxima acao recomendada

Validar manualmente o fluxo admin de exportacao no browser com uma sessao de administrador e, numa execucao propria com `PERMITIR_ALTERAR_DOCS=sim`, corrigir os problemas de qualidade dos guias MF4 que o validador documental continua a reportar.
