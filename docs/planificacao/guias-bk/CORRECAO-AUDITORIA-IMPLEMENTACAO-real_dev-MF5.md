# Follow-up de correcao P3 documental - MF5 completa

## Metadados desta execucao

- Projeto: Orelle.
- Data: 2026-06-22.
- Pedido: corrigir o `P3` documental ainda aberto para a MF5.
- Finding corrigido: `ORELLE-MF5-DOC-P3-001`.
- Tipo de correcao: documental/canonica, autorizada explicitamente no chat.
- Guias canonicos corrigidos: `BK-MF5-01`, `BK-MF5-04`, `BK-MF5-05`, `BK-MF5-07`.
- Relatorio de auditoria atualizado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`.
- Resultado geral: `P3_MF5_CORRIGIDO_COM_VALIDADOR_GLOBAL_AINDA_VERMELHO_POR_MF4`.

## Sumario executivo

Foi corrigido o `P3` documental `ORELLE-MF5-DOC-P3-001`. Os quatro guias MF5 que ainda apareciam no validador ganharam a estrutura canonica exigida: `Bloco pedagogico`, `Bloco operacional`, subsecções `Objetivo`, `Pre-requisitos`, `Erros comuns`, `Check de compreensao`, `Entrada`, `Passos`, `Validacao`, `Handoff`, e headings normalizados `Criterios de aceite` e `Evidence para PR/defesa`.

O comando `bash scripts/validate-planificacao.sh` deixou de listar qualquer BK da MF5 em `guides_quality.guide_content_issues`. O validador global continua com `overall_pass=false` por issues MF4 preexistentes e fora deste pedido.

## Estado final do finding

| Finding | Severidade | Estado final | Evidencia |
| --- | --- | --- | --- |
| `ORELLE-MF5-DOC-P3-001` | `P3` | `CORRIGIDO` | `bash scripts/validate-planificacao.sh` ja nao lista `BK-MF5-01`, `BK-MF5-04`, `BK-MF5-05` nem `BK-MF5-07`; permanecem apenas issues MF4. |

## Alteracoes aplicadas

- `docs/planificacao/guias-bk/MF5/BK-MF5-01-painel-para-consultores-admins-reverem-e-aprovarem-pedidos-de-eliminacao-anonymizacao-de-fotografias-e-relatorios.md`
  - Atualizado `last_updated` para `2026-06-22`.
  - Adicionado `Bloco pedagogico` e `Bloco operacional`.
  - Normalizados headings `Criterios de aceite` e `Evidence para PR/defesa`.
- `docs/planificacao/guias-bk/MF5/BK-MF5-04-registo-auditoria-de-acessos-a-dados-biometricos-com-alertas-para-usos-indevidos.md`
  - Atualizado `last_updated` para `2026-06-22`.
  - Adicionado `Bloco pedagogico` e `Bloco operacional`.
  - Normalizados headings `Criterios de aceite` e `Evidence para PR/defesa`.
- `docs/planificacao/guias-bk/MF5/BK-MF5-05-interface-moderna-intuitiva-e-responsive-desktop-e-mobile.md`
  - Atualizado `last_updated` para `2026-06-22`.
  - Adicionado `Bloco pedagogico` e `Bloco operacional`.
  - Normalizados headings `Criterios de aceite` e `Evidence para PR/defesa`.
- `docs/planificacao/guias-bk/MF5/BK-MF5-07-mensagens-claras-icones-acessiveis-e-feedback-imediato-em-formularios.md`
  - Atualizado `last_updated` para `2026-06-22`.
  - Adicionado `Bloco pedagogico` e `Bloco operacional`.
  - Normalizados headings `Criterios de aceite` e `Evidence para PR/defesa`.
- `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`
  - Atualizado estado pos-correcao de `ORELLE-MF5-DOC-P3-001`.
- `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`
  - Adicionado este follow-up.

## Validacoes executadas

| Validacao | Resultado | Observacao |
| --- | --- | --- |
| `bash scripts/validate-planificacao.sh` | `FAIL_GLOBAL_COM_MF5_CORRIGIDA` | Nenhum BK MF5 aparece em `guide_content_issues`; continuam issues MF4 preexistentes. |
| Pesquisa de headings obrigatorios nos quatro BKs MF5 corrigidos | `PASS` | Confirmados `Bloco pedagogico`, `Bloco operacional`, `Criterios de aceite` e `Evidence para PR/defesa`. |
| `git diff --check` | `PASS` | Sem erros de whitespace no diff tracked. |
| `rg -n "[ \t]+$"` nos ficheiros alterados | `PASS` | Sem trailing whitespace nos guias e relatorios atualizados. |

## Blockers restantes

- Validador global ainda falha por issues documentais em `BK-MF4-01`, `BK-MF4-02`, `BK-MF4-03`, `BK-MF4-04`, `BK-MF4-05` e `BK-MF4-08`.
- Nenhum blocker restante para o `P3` documental da MF5.

---

# Historico preservado - correcao anterior do P1 funcional

## Correcao da auditoria de implementacao real_dev - MF5 completa / BK-MF5-01

## Metadados desta execucao

- Projeto: Orelle.
- Data: 2026-06-22.
- Prompt executada: `/Users/nuno/.codex/attachments/8c2ec966-b3ea-4511-a165-ae929ff76379/pasted-text.txt`.
- Modo: `corrigir_auditoria`.
- Implementation root: `real_dev`.
- MF alvo: `MF5`.
- BKs abrangidos pela leitura: `BK-MF5-01`, `BK-MF5-04`, `BK-MF5-05`, `BK-MF5-06`, `BK-MF5-07`, `BK-MF5-08`.
- Finding funcional corrigido: `ORELLE-MF5-BK01-P1-001`.
- Finding documental revalidado e bloqueado: `ORELLE-MF5-DOC-P3-001`.
- Permissao de docs canonicos: `PERMITIR_ALTERAR_DOCS=nao`.
- Permissao de commits: `PERMITIR_COMMITS=nao`.
- Resultado geral: `CORRIGIDO_COM_P3_BLOQUEADO_POR_SCOPE`.

## Sumario executivo

Foi corrigido o finding `P1` confirmado para `BK-MF5-01` / `RF41`: o frontend real tinha painel de consultor/admin para rever pedidos biometricos, mas nao tinha UI de cliente para criar pedidos em `POST /api/me/biometric-data-requests`.

A correcao adiciona uma pagina de cliente em `real_dev/web`, integrada no grupo "Conta e experiencia do cliente", com formulario para escolher `delete` ou `anonymize`, selecionar `photos` e/ou `reports`, indicar motivo opcional e submeter para o endpoint autenticado existente. A UI nao envia `requesterId`; ownership, role e sessao continuam decididos no backend.

O finding `P3` documental permanece `BLOQUEADO_POR_SCOPE`, porque a correcao exige alterar guias BK/documentos canonicos e esta execucao proibiu alteracoes documentais fora de relatorios tecnicos.

## Estado final dos findings desta execucao

| Finding | Severidade | Estado final | Evidencia |
| --- | --- | --- | --- |
| `ORELLE-MF5-BK01-P1-001` | `P1` | `CORRIGIDO` | `real_dev/web/src/pages/BiometricDataRequestPage.jsx:120` chama `apiRequest("/me/biometric-data-requests")`; `App.jsx:18` e `App.jsx:118` montam a pagina no fluxo de cliente; `npm --prefix real_dev/web run smoke:mf5-privacy-request`, build web e suite API passaram. |
| `ORELLE-MF5-DOC-P3-001` | `P3` | `BLOQUEADO_POR_SCOPE` | `bash scripts/validate-planificacao.sh` continua com `guides_pass=false` em qualidade documental de guias MF4/MF5; corrigir exige editar BKs/docs canonicos, proibido por esta prompt. |

## Alteracoes aplicadas

- `real_dev/web/src/pages/BiometricDataRequestPage.jsx`
  - Criada pagina de cliente para pedidos de privacidade biometrica.
  - Adicionada validacao frontend minima para impedir submissao sem recursos selecionados.
  - Usados `FeedbackMessage` e `SubmitButton` para estados loading/error/success.
  - A submissao envia apenas `action`, `resources` e `reason`.
- `real_dev/web/src/App.jsx`
  - Importada e montada `BiometricDataRequestPage` na secao "Conta e experiencia do cliente".
- `real_dev/web/scripts/check-mf5-biometric-request-client.mjs`
  - Criado smoke estatico para garantir chamada real a `/me/biometric-data-requests`, uso de feedback/botao e ausencia de `requesterId` na pagina cliente.
- `real_dev/web/package.json`
  - Adicionado script `smoke:mf5-privacy-request`.
- `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`
  - Atualizado com estado pos-correcao do `P1`.
- `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`
  - Atualizado com este follow-up.

Nao foram alterados BKs canonicos, documentos de planificacao canonicos, prompts, `apps/`, `mockup/` ou `agent/legacy/**`.

## Rastreabilidade BK -> RF/RNF -> ficheiros -> validacoes

| BK | RF/RNF | Ficheiros corrigidos | Validacoes/evidencia |
| --- | --- | --- | --- |
| `BK-MF5-01` | `RF41` | `real_dev/web/src/pages/BiometricDataRequestPage.jsx`, `real_dev/web/src/App.jsx`, `real_dev/web/scripts/check-mf5-biometric-request-client.mjs`, `real_dev/web/package.json` | `npm --prefix real_dev/web run smoke:mf5-privacy-request`; `npm --prefix real_dev/web run build`; `npm --prefix real_dev/api test` fora da sandbox; `rg -n "requesterId" real_dev/web/src/pages/BiometricDataRequestPage.jsx` sem resultados. |

## Contratos consumidos e entregues

### Consumidos

- `MF0`: `AuthContext`, sessao por cookie HttpOnly e `apiRequest` com `credentials: "include"` continuam a ser usados.
- `MF1`: fotografias faciais e relatorios cosmeticos continuam a ser os recursos-alvo; a UI nao acede a imagens, storage keys ou relatorios completos.
- `BK-MF5-01`: endpoint `POST /api/me/biometric-data-requests` ja existente, com `requireAuth`, `requireRole(cliente)` e ownership por `req.user.id`.
- `BK-MF5-07`: `FeedbackMessage` e `SubmitButton` foram reutilizados para feedback acessivel.

### Entregues

- UI de cliente para criar pedidos `delete` ou `anonymize`.
- Payload frontend alinhado com o validator backend: `{ action, resources, reason }`.
- Handoff preservado para o painel consultor/admin, que passa a conseguir rever pedidos criados pela UI real.
- Smoke especifico para evitar regressao do elo frontend/backend de `RF41`.

## Coerencia entre MFs

| Ligacao | Estado | Observacao |
| --- | --- | --- |
| `MF4 -> MF5` | `PRESERVADA` | Nao houve alteracao de auth, roles, perfil, recomendacoes ou restricoes herdadas. |
| Dentro de `MF5` | `CORRIGIDA` | O fluxo de cliente agora cria pedidos reais e o painel consultor/admin continua a decidir pedidos pelo backend existente. |
| `MF5 -> MF6` | `PRESERVADA` | A MF5 continua a entregar API, layout, feedback e tema estaveis para validacoes de performance/usabilidade; resta apenas o P3 documental fora de runtime. |

## Validacoes executadas nesta execucao

| Comando/verificacao | Resultado | Notas |
| --- | --- | --- |
| `npm --prefix real_dev/web run smoke:mf5-privacy-request` | `PASS` | Confirma pagina cliente, endpoint real e ausencia de `requesterId` na UI. |
| `npm --prefix real_dev/web run smoke:mf5-feedback` | `PASS` | Contratos MF5 de feedback preservados. |
| `npm --prefix real_dev/web run smoke:mf5-theme` | `PASS` | Contratos MF5 de tema preservados. |
| `npm --prefix real_dev/web run build` | `PASS` | Vite compilou 73 modulos. |
| `npm --prefix real_dev/api test` no sandbox | `FAIL_AMBIENTE` | Falhou com `listen EPERM: operation not permitted 0.0.0.0`. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` | 18 ficheiros, 143 testes. |
| Pesquisa estatica obrigatoria com `rg` | `PASS_COM_FALSOS_POSITIVOS` | Ocorrencias revistas: Stripe/PayPal/MBWay canonicos MF3, `SESSION_SECRET`, comentario anti-localStorage/sessionStorage, texto de nao treino externo e testes/config. |
| `rg -n "requesterId" real_dev/web/src/pages/BiometricDataRequestPage.jsx` | `PASS` | Sem resultados; a UI de cliente nao envia ownership. |
| `bash scripts/validate-planificacao.sh` | `FAIL_DOCS_QUALITY_PRE_EXISTENTE` | `coverage_pass=true`, `consistency_pass=true`, `naming_pass=true`, `guides_pass=false`. |
| `git diff --check` | `PASS` | Sem erros de whitespace no diff tracked. |
| `rg -n "[ \t]+$"` nos ficheiros alterados desta execucao | `PASS` | Sem trailing whitespace nos ficheiros novos/alterados. |

## Validacoes nao executadas nesta execucao

- Browser autenticado real com utilizadores `cliente`, `consultor` e `administrador`: nao executado por falta de credenciais/sessoes fornecidas; o fluxo foi coberto por build, smoke estatico e suite API.
- Correcao do `P3` documental: nao executada porque exigiria alterar BKs/docs canonicos, proibido por `PERMITIR_ALTERAR_DOCS=nao`.
- Commit/push: nao executado porque `PERMITIR_COMMITS=nao`.

## Blockers/TODOs desta execucao

- `TODO P3`: corrigir qualidade documental de `BK-MF5-01`, `BK-MF5-04`, `BK-MF5-05`, `BK-MF5-07` e restantes issues MF4 numa execucao documental propria com permissao explicita para editar guias.

## Proxima acao recomendada desta execucao

Executar uma prompt documental separada com `PERMITIR_ALTERAR_DOCS=sim` para fechar `ORELLE-MF5-DOC-P3-001` e levar `bash scripts/validate-planificacao.sh` a `overall_pass=true`.

---

# Follow-up de correcao P3 - MF5 / BK-MF5-08

## Metadados desta execucao

- Projeto: Orelle.
- Data: 2026-06-22.
- Pedido: corrigir o finding `P3` aberto para `BK-MF5-08`.
- Finding corrigido: `ORELLE-MF5-BK08-P3-001`.
- Tipo de correcao: documental/canonica.
- Guia canonico corrigido: `docs/planificacao/guias-bk/MF5/BK-MF5-08-modo-escuro-e-contraste-ajustado.md`.
- Relatorio de auditoria atualizado: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`.
- Resultado geral: `P3_CORRIGIDO_COM_VALIDADOR_GLOBAL_AINDA_VERMELHO`.

## Sumario executivo

Foi corrigido o `P3` documental de `BK-MF5-08`. O guia alvo passou a conter os blocos que o validador canonico ainda exige para guias BK: `Bloco pedagogico`, `Bloco operacional`, `Criterios de aceite` e `Evidence para PR/defesa`.

A correcao preservou o contrato funcional do BK: o guia continua a publicar caminhos canonicos de aluno em `apps/web`, mantém `RNF04`, mantém a politica `P2` de 1 negativo obrigatório, e não altera codigo em `real_dev`.

## Estado final do finding

| Finding | Estado final | Evidencia |
| --- | --- | --- |
| `ORELLE-MF5-BK08-P3-001` | `CORRIGIDO` | `bash scripts/validate-planificacao.sh` continua a falhar por outros BKs, mas deixou de listar `BK-MF5-08` em `guides_quality.guide_content_issues`. |

## Alteracoes aplicadas

- `docs/planificacao/guias-bk/MF5/BK-MF5-08-modo-escuro-e-contraste-ajustado.md`
  - Atualizado `last_updated` para `2026-06-22`.
  - Adicionado `## Bloco pedagogico` com objetivo, pre-requisitos, erros comuns e check de compreensao.
  - Adicionado `## Bloco operacional` com entrada, passos, validacao e handoff.
  - Promovidos os headings `Criterios de aceite` e `Evidence para PR/defesa` para o formato esperado pelo validador.
  - Adicionado changelog da correcao.
- `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`
  - Adicionado estado pos-correcao do finding `ORELLE-MF5-BK08-P3-001`.

## Validacoes executadas

| Validacao | Resultado | Observacao |
| --- | --- | --- |
| `bash scripts/validate-planificacao.sh` | `FAIL_GLOBAL_COM_BK08_CORRIGIDO` | `BK-MF5-08` ja nao aparece nos issues; continuam falhas pre-existentes em outros BKs de MF4/MF5. |
| `rg -n "[ \t]+$" docs/planificacao/guias-bk/MF5/BK-MF5-08-modo-escuro-e-contraste-ajustado.md` | `PASS` | Sem trailing whitespace no guia corrigido. |
| `git diff --check` | `PASS` | Sem whitespace errors no diff atual. |

## Blockers restantes

- Validador global ainda falha por issues documentais fora deste pedido: `BK-MF4-01`, `BK-MF4-02`, `BK-MF4-03`, `BK-MF4-04`, `BK-MF4-05`, `BK-MF4-08`, `BK-MF5-01`, `BK-MF5-04`, `BK-MF5-05` e `BK-MF5-07`.
- Nenhum blocker restante para `BK-MF5-08`.

---

# Historico preservado - correcao anterior MF5 / BK-MF5-06

# Follow-up de correcao P3 - MF5 / BK-MF5-06

## Metadados desta execucao

- Projeto: Orelle.
- Data: 2026-06-22.
- Pedido: corrigir os findings `P3` encontrados para `BK-MF5-06`.
- Scope autorizado pelo pedido: correcoes documentais no guia alvo e atualizacao dos relatorios tecnicos.
- Implementation root de referencia operacional: `real_dev`.
- Guia canonico corrigido: `docs/planificacao/guias-bk/MF5/BK-MF5-06-design-coerente-com-estetica-da-marca-cores-suaves-tipografia-moderna.md`.
- Resultado geral: `CORRIGIDO_COM_P3_BLOQUEADO_AMBIENTE`.

## Sumario executivo

Foram corrigidos os dois findings `P3` documentais do `BK-MF5-06`:

- `ORELLE-MF5-BK06-P3-002`: corrigido por clarificacao explicita da politica de paths. O guia continua a usar `apps/web` como raiz canonica de aluno, mas agora documenta que execucoes privadas com `IMPLEMENTATION_ROOT=real_dev` devem remapear o contrato para `real_dev/web` sem editar `apps/web`.
- `ORELLE-MF5-BK06-P3-003`: corrigido no guia alvo com os blocos exigidos pelo validador (`Bloco pedagogico`, `Bloco operacional`, criterios/evidence e validacao). A revalidacao confirma que `BK-MF5-06` ja nao aparece em `guides_quality`.

O finding `ORELLE-MF5-BK06-P3-001` permanece bloqueado por ambiente: nao ha Playwright/Puppeteer nem Chrome/Chromium disponiveis; `safaridriver` existe, mas exige ativar `Allow remote automation` no Safari, o que pediu password local do macOS na tentativa anterior.

## Estado final dos findings P3

| Finding | Estado final | Evidencia |
| --- | --- | --- |
| `ORELLE-MF5-BK06-P3-001` | `BLOQUEADO` | Browser automation depende de configuracao local do Safari ou instalacao de browser automatizavel. |
| `ORELLE-MF5-BK06-P3-002` | `CORRIGIDO` | Guia alvo ganhou a secao `Politica de paths para aluno e validacao real_dev`, com tabela `apps/web` vs `real_dev/web`. |
| `ORELLE-MF5-BK06-P3-003` | `CORRIGIDO` | `bash scripts/validate-planificacao.sh` continua a falhar por outros BKs, mas deixou de listar `BK-MF5-06`. |

## Alteracoes aplicadas

- `docs/planificacao/guias-bk/MF5/BK-MF5-06-design-coerente-com-estetica-da-marca-cores-suaves-tipografia-moderna.md`
  - Adicionada politica explicita de paths para separar guia de aluno (`apps/web`) de execucao privada (`real_dev/web`).
  - Adicionado `## Bloco pedagogico` com objetivo, pre-requisitos, erros comuns e check de compreensao.
  - Adicionado `## Bloco operacional` com entrada, passos, validacao e handoff.
- `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`
  - Atualizado com estado pos-correcao dos `P3`.
- `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`
  - Atualizado com este follow-up.

## Validacoes executadas

| Validacao | Resultado | Observacao |
| --- | --- | --- |
| `bash scripts/validate-planificacao.sh` | `FAIL_GLOBAL_COM_BK06_CORRIGIDO` | `BK-MF5-06` ja nao aparece nos issues; continuam falhas pre-existentes em outros BKs de MF4/MF5. |
| `npm --prefix real_dev/web run build` | `PASS` | Vite compilou 68 modulos em 431 ms. |
| `node -e "import('playwright')"` | `FALHA_AMBIENTE` | `ERR_MODULE_NOT_FOUND`. |
| `safaridriver --version` | `PASS_AMBIENTE` | Safari WebDriver existe, mas a automacao remota ainda depende de configuracao local. |

## Blockers restantes

- `ORELLE-MF5-BK06-P3-001`: para fechar totalmente, ativar manualmente `Allow remote automation` no Safari ou disponibilizar Playwright/Chrome/Chromium e repetir a captura/inspecao desktop-mobile-foco.
- Validador global: ainda falha por issues documentais em outros BKs de MF4/MF5, fora deste pedido centrado em `BK-MF5-06`.

---

# Historico preservado - correcao anterior MF5 / BK-MF5-06

# Correcao da auditoria de implementacao real_dev - MF5 / BK-MF5-06

## Metadados desta execucao

- Projeto: Orelle.
- Data: 2026-06-22.
- Prompt executada: `/Users/nuno/.codex/attachments/872a76f0-1e4e-44e1-b932-d8536c7887ca/pasted-text.txt`.
- Modo: `corrigir_auditoria`.
- Implementation root: `real_dev`.
- MF alvo: `MF5`.
- BK corrigido/a revalidar: `BK-MF5-06`.
- Relatorio de auditoria fonte: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`.
- Severidades abrangidas: `P0`, `P1`, `P2`, `P3`.
- `INCLUIR_P3`: `sim`.
- Permissao de docs: `PERMITIR_ALTERAR_DOCS=nao`.
- Permissao de commits: `PERMITIR_COMMITS=nao`.
- Resultado geral: `BLOQUEADO`.

## Sumario executivo desta execucao

Foram revalidados os tres findings `P3` registados para o `BK-MF5-06`.

Nao existiam findings `P0`, `P1` ou `P2` no relatorio fonte. Nao foi aplicada alteracao de codigo porque o runtime do `BK-MF5-06` continuou conforme nos pontos principais de `RNF02`: tokens de marca, aliases antigos, foco visivel, classes reutilizaveis, contraste e build frontend.

O unico finding potencialmente corrigivel sem alterar docs canonicas era `ORELLE-MF5-BK06-P3-001`, relativo a evidencia visual automatizada. Foi tentada a validacao por browser, mas o ambiente nao permitiu fechar a sessao WebDriver: nao ha Playwright/Puppeteer, nao ha Chrome/Chromium, e o `safaridriver` nativo recusou criar sessao porque o Safari Remote Automation nao esta ativo. A tentativa de ativacao com `safaridriver --enable` pediu palavra-passe local do macOS e foi interrompida.

Os outros dois findings `P3` continuam bloqueados por scope, porque corrigir os paths `apps/web` do guia canonico ou a qualidade documental global exigiria alterar BKs/docs canonicos, o que esta proibido por `PERMITIR_ALTERAR_DOCS=nao`.

## Estado final dos findings desta execucao

| Finding | Severidade | Estado final | Evidencia |
| --- | --- | --- | --- |
| `ORELLE-MF5-BK06-P3-001` | `P3` | `BLOQUEADO` | Playwright/Puppeteer ausentes; Chrome/Chromium ausentes; `safaridriver` existe, mas devolveu erro de Remote Automation desativado; `safaridriver --enable` pediu password local e nao foi concluido. |
| `ORELLE-MF5-BK06-P3-002` | `P3` | `BLOQUEADO_POR_SCOPE` | Correcao exigiria editar o guia canonico `BK-MF5-06`, mas docs canonicos estao proibidos nesta execucao. |
| `ORELLE-MF5-BK06-P3-003` | `P3` | `BLOQUEADO_POR_SCOPE` | Correcao exigiria editar qualidade documental de guias MF4/MF5, mas docs canonicos estao proibidos nesta execucao. |

## Alteracoes aplicadas nesta execucao

Nao foram aplicadas alteracoes de codigo.

Foi atualizado apenas este relatorio tecnico de correcao para registar a revalidacao dos findings, os blockers objetivos e as validacoes executadas.

## Rastreabilidade BK -> RNF -> ficheiros -> validacoes

| BK | RF/RNF | Ficheiros revalidados | Validacoes/evidencia |
| --- | --- | --- | --- |
| `BK-MF5-06` | `RNF02` | `real_dev/web/src/styles.css`, `real_dev/web/src/App.jsx`, `real_dev/web/src/services/apiClient.js`, `real_dev/web/src/context/AuthContext.jsx` | `npm --prefix real_dev/web run build`; pesquisa dirigida a tokens/classes CSS; contraste por tokens; smoke HTTP Vite fora da sandbox; tentativa WebDriver Safari bloqueada por configuracao local. |

## Contratos consumidos e entregues

### Consumidos

- `BK-MF5-05`: a grelha responsiva, o ajuste de checkboxes/radios e a estrutura de `SectionGroup` permanecem preservados.
- `BK-MF5-06`: tokens `--brand-*`, aliases antigos e classes `.brand-panel`, `.metric-strip` e `.status-chip` continuam presentes em `real_dev/web/src/styles.css`.
- `BK-MF0-02`: autenticacao por cookie HttpOnly e `credentials: "include"` permanecem intactas no cliente API; nao houve alteracao de sessao.

### Entregues

- Estado de correcao documentado para os tres findings `P3` do `BK-MF5-06`.
- Evidence atualizada de build, contraste, smoke HTTP e bloqueio WebDriver.
- Handoff claro para futura execucao visual/documental sem mexer no runtime atual.

## Coerencia entre MFs

| Ligacao | Estado | Observacao |
| --- | --- | --- |
| `MF4 -> MF5` | `PRESERVADA` | Nao houve alteracoes de API, roles, dados biometricos, consentimento, recomendacoes, rotina ou restricoes herdadas de MF4. |
| `MF5` | `BLOQUEADA_EM_P3` | Runtime do `BK-MF5-06` continua conforme nos pontos principais; fecho completo ficou bloqueado por evidencia visual automatizada e docs proibidos. |
| `MF5 -> MF6` | `PRESERVADA` | Tokens e layout base continuam disponiveis para performance, seguranca, contraste e otimizar imagens nas RNFs seguintes. |

## Validacoes executadas nesta execucao

| Comando/verificacao | Resultado | Notas |
| --- | --- | --- |
| `npm --prefix real_dev/web run build` | `PASS` | Vite compilou 68 modulos em 432 ms. |
| Pesquisa dirigida em `real_dev/web/src/styles.css` | `PASS` | Confirmou tokens `--brand-*`, aliases antigos, foco, `.brand-panel`, `.metric-strip`, `.status-chip` e preservacao de checkbox/radio. |
| Contraste por tokens via `node -e` | `PASS` | Pares principais entre `5.60` e `14.88`; todos acima de 4.5:1 nos pares testados. |
| `npm --prefix real_dev/web run dev -- --host 127.0.0.1 --port 4174` no sandbox | `FALHA_AMBIENTE` | `listen EPERM: operation not permitted 127.0.0.1:4174`. |
| `npm --prefix real_dev/web run dev -- --host 127.0.0.1 --port 4174` fora da sandbox | `PASS` | Vite arrancou em `http://127.0.0.1:4174/`. |
| `curl -I http://127.0.0.1:4174/` no sandbox | `FALHA_AMBIENTE` | A ligacao local ao servidor fora da sandbox foi recusada a partir da sandbox. |
| `curl -I http://127.0.0.1:4174/` fora da sandbox | `PASS` | Devolveu `HTTP/1.1 200 OK`. |
| `node -e "import('playwright')"` | `FALHA_AMBIENTE` | `ERR_MODULE_NOT_FOUND`; dependencia nao instalada. |
| `node -e "import('puppeteer')"` | `FALHA_AMBIENTE` | `ERR_MODULE_NOT_FOUND`; dependencia nao instalada. |
| `which chromium` / `which google-chrome` | `FALHA_AMBIENTE` | Binarios nao encontrados. |
| `safaridriver --version` | `PASS_AMBIENTE` | `Included with Safari 26.5 (21624.2.5.11.4)`. |
| Sessao WebDriver via `safaridriver` | `BLOQUEADO` | `Could not create a session: You must enable 'Allow remote automation' in the Developer section of Safari Settings to control Safari via WebDriver.` |
| `safaridriver --enable` | `BLOQUEADO` | Pediu `Password:` local do macOS; nao foi concluido. |
| Pesquisa estatica obrigatoria com `rg` | `PASS_COM_FALSOS_POSITIVOS` | Ocorrencias pertencem a relatorios, config segura, Stripe/PayPal/MBWay canonicos de MF3, comentario contra `localStorage/sessionStorage` e texto de nao treino externo. |
| `bash scripts/validate-planificacao.sh` | `FAIL_DOCS_QUALITY_PREEXISTENTE` | `coverage_pass=true`, `consistency_pass=true`, `naming_pass=true`, `guides_pass=false`; inclui `BK-MF5-06`, bloqueado por `PERMITIR_ALTERAR_DOCS=nao`. |

## Validacoes nao executadas nesta execucao

- Screenshots desktop/mobile/foco por browser automatizado: nao executadas porque a unica opcao de browser local automatizavel, Safari WebDriver, exigia ativacao com palavra-passe local.
- Smoke autenticado por roles `cliente`, `consultor` e `administrador`: nao executado por falta de credenciais/sessao de teste e por o finding alvo ser visual/CSS, sem alteracao backend.
- Correcao dos findings documentais `P3`: nao executada porque exigiria alterar BKs/docs canonicos.

## Ficheiros alterados nesta execucao

- `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`

Nao foram alterados ficheiros de codigo, BKs canonicos, documentos de planificacao canonicos, prompts, `apps/`, `mockup/`, `agent/legacy/**`, endpoints backend ou testes.

## Estado final desta execucao

| Severidade | Confirmados no relatorio fonte | Corrigidos | Bloqueados por ambiente | Bloqueados por scope |
| --- | ---: | ---: | ---: | ---: |
| `P0` | 0 | 0 | 0 | 0 |
| `P1` | 0 | 0 | 0 | 0 |
| `P2` | 0 | 0 | 0 | 0 |
| `P3` | 3 | 0 | 1 | 2 |

## Blockers/TODOs desta execucao

- `TODO P3`: ativar Safari Remote Automation manualmente ou instalar um browser automatizavel/Playwright para recolher screenshots desktop/mobile/foco.
- `TODO P3`: corrigir paths `apps/web` no guia `BK-MF5-06` apenas numa prompt com `PERMITIR_ALTERAR_DOCS=sim`.
- `TODO P3`: resolver falhas globais de `guides_quality` de MF4/MF5 numa execucao documental propria.

## Proxima acao recomendada desta execucao

Para fechar o unico `P3` nao documental, ativar `Allow remote automation` no Safari ou disponibilizar Playwright/Chrome e repetir a validacao visual. Para fechar os restantes `P3`, executar uma prompt documental separada com permissao explicita para alterar BKs/docs canonicos.

---

# Historico preservado - correcao anterior MF5 / BK-MF5-05

# Correcao da auditoria de implementacao real_dev - MF5 / BK-MF5-05

## Metadados desta execucao

- Projeto: Orelle.
- Data: 2026-06-22.
- Prompt executada: `/Users/nuno/.codex/attachments/53bf6414-8a83-4859-8426-715a5642b57a/pasted-text.txt`.
- Modo: `corrigir_auditoria`.
- Implementation root: `real_dev`.
- MF alvo: `MF5`.
- BK corrigido: `BK-MF5-05`.
- Relatorio de auditoria fonte: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`.
- Severidades abrangidas: `P0`, `P1`, `P2`, `P3`.
- `INCLUIR_P3`: `sim`.
- Permissao de docs: `PERMITIR_ALTERAR_DOCS=nao`.
- Permissao de commits: `PERMITIR_COMMITS=nao`.
- Resultado geral: `CORRIGIDO_COM_P3_BLOQUEADO_POR_SCOPE`.

## Sumario executivo desta execucao

Foi corrigido o finding `P2` confirmado para o `BK-MF5-05`:

- `ORELLE-MF5-BK05-P2-001`: corrigido em `real_dev/web/src/styles.css`, retirando `checkbox`/`radio` da regra global de inputs full-width e adicionando layout especifico para controlos de escolha.

Os findings `P3` tambem foram revalidados porque `INCLUIR_P3=sim`, mas nao foram corrigidos por estarem em documentos canonicos e a prompt definir `PERMITIR_ALTERAR_DOCS=nao`:

- `ORELLE-MF5-BK05-P3-001`: continua `BLOQUEADO_POR_SCOPE`; o guia canonico `BK-MF5-05` ainda referencia `apps/...`.
- `ORELLE-MF5-BK05-P3-002`: continua `BLOQUEADO_POR_SCOPE`; `scripts/validate-planificacao.sh` continua a falhar em `guides_quality`.

Nao foram encontrados findings `P0` ou `P1` no relatorio fonte.

## Estado final dos findings desta execucao

| Finding | Severidade | Estado final | Evidencia |
| --- | --- | --- | --- |
| `ORELLE-MF5-BK05-P2-001` | `P2` | `CORRIGIDO` | Browser desktop/mobile confirma `input[type="checkbox"]` com `inputWidth=13`, `cssWidth="13px"` e labels em `display:flex`; build web passou. |
| `ORELLE-MF5-BK05-P3-001` | `P3` | `BLOQUEADO_POR_SCOPE` | Correcao exigiria editar guia canonico `BK-MF5-05`; docs canonicos estao proibidos nesta execucao. |
| `ORELLE-MF5-BK05-P3-002` | `P3` | `BLOQUEADO_POR_SCOPE` | Correcao exigiria editar qualidade documental de guias MF4/MF5; docs canonicos estao proibidos nesta execucao. |

## Alteracoes aplicadas nesta execucao

### CSS responsivo de formularios

Ficheiro: `real_dev/web/src/styles.css`

- O selector global de campos passou de `input, select, textarea` para `input:not([type="checkbox"]):not([type="radio"]), select, textarea`.
- Foi adicionada regra dedicada para `input[type="checkbox"]` e `input[type="radio"]` com `width: auto`, `flex: 0 0 auto` e `accent-color`.
- Labels que contem checkbox/radio passaram a usar `display: flex`, `align-items: flex-start`, `gap` controlado e `grid-column: 1 / -1`.

Motivo: cumprir `RNF01` sem redesign global, mantendo a grelha responsiva existente e evitando que checkboxes parecam campos de texto full-width.

## Rastreabilidade BK -> RNF -> ficheiros -> validacoes

| BK | RF/RNF | Ficheiros corrigidos | Validacoes/evidencia |
| --- | --- | --- | --- |
| `BK-MF5-05` | `RNF01` | `real_dev/web/src/styles.css` | `npm --prefix real_dev/web run build`; browser desktop 1280x720; browser mobile 375x812; suite API completa para regressao. |

## Contratos consumidos e entregues

### Consumidos

- `BK-MF5-04`: estados e mensagens de auditoria continuam apenas consumidos pela UI; nenhum endpoint ou contrato backend foi alterado.
- `BK-MF5-05`: grelha responsiva e organizacao por `SectionGroup` foram preservadas.
- `BK-MF0-02`: autenticacao por cookie HttpOnly e `credentials: "include"` permanecem intactas.

### Entregues

- Formularios React com checkboxes/radios visualmente compactos e coerentes com controlos nativos.
- Base CSS do `BK-MF5-05` preservada para `BK-MF5-06`, `BK-MF5-07` e `BK-MF5-08`.

## Coerencia entre MFs

| Ligacao | Estado | Observacao |
| --- | --- | --- |
| `MF4 -> MF5` | `PRESERVADA` | A correcao e apenas CSS; nao altera alertas, recomendacoes, restricoes, roles, API ou dados biometricos. |
| `MF5` | `CORRIGIDA_COM_P3_BLOQUEADO` | O finding runtime/UI `P2` foi corrigido; os dois `P3` documentais permanecem bloqueados por scope. |
| `MF5 -> MF6` | `PRESERVADA` | Layout base continua responsivo e reutilizavel por performance, seguranca e futuras RNFs. |

## Validacoes executadas nesta execucao

| Comando/verificacao | Resultado | Notas |
| --- | --- | --- |
| `npm --prefix real_dev/web run build` | `PASS` | Vite compilou 68 modulos em 431 ms. |
| `npm --prefix real_dev/api test` no sandbox | `FALHA_AMBIENTE` | Falhou por `listen EPERM: operation not permitted 0.0.0.0`, erro de ambiente conhecido com Supertest/listeners locais. |
| `npm --prefix real_dev/api test` fora do sandbox | `PASS` | 18 ficheiros e 143 testes passaram. |
| Browser desktop 1280x720 | `PASS` | 24 cards, 3 colunas, `viewportOverflowX=0`, `buttonOverflows=0`, `cardOverflows=0`; checkboxes com `inputWidth=13`. |
| Browser mobile 375x812 | `PASS` | 24 cards, 1 coluna, `viewportOverflowX=0`, sem overflow samples; checkboxes com `inputWidth=13`. |
| Logs de erro do browser | `PASS` | Sem erros registados durante o smoke responsivo. |
| Pesquisa estatica obrigatoria com `rg` | `PASS_COM_FALSOS_POSITIVOS` | Ocorrencias pertencem a relatorios, config segura, Stripe canonico MF3, comentario contra `localStorage/sessionStorage` e mensagem de nao treino externo. |
| `bash scripts/validate-planificacao.sh` | `FAIL_DOCS_QUALITY_PREEXISTENTE` | `coverage_pass=true`, `consistency_pass=true`, `naming_pass=true`, `guides_pass=false`; bloqueado por `PERMITIR_ALTERAR_DOCS=nao`. |
| `git diff --check` | `PASS` | Sem whitespace errors antes da atualizacao deste relatorio; repetido na higiene final. |

## Validacoes nao executadas nesta execucao

- Smoke autenticado com utilizadores reais `cliente`, `consultor` e `administrador`: nao executado por falta de credenciais/sessao de teste.
- Correcao dos dois findings `P3`: nao executada porque exigiria alterar documentos canonicos/BKs e a prompt proibiu docs.

## Ficheiros alterados nesta execucao

- `real_dev/web/src/styles.css`
- `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`

Nao foram alterados BKs canonicos, documentos de planificacao canonicos, prompts, `apps/`, `mockup/`, `agent/legacy/**`, endpoints backend ou testes.

## Estado final desta execucao

| Severidade | Confirmados | Corrigidos | Bloqueados por scope |
| --- | ---: | ---: | ---: |
| `P0` | 0 | 0 | 0 |
| `P1` | 0 | 0 | 0 |
| `P2` | 1 | 1 | 0 |
| `P3` | 2 | 0 | 2 |

## Blockers/TODOs desta execucao

- `TODO P3`: corrigir paths `apps/...` no guia `BK-MF5-05` apenas numa prompt com `PERMITIR_ALTERAR_DOCS=sim`.
- `TODO P3`: resolver falhas globais de `guides_quality` de MF4/MF5 apenas numa execucao documental propria.
- `TODO validacao`: complementar com smoke autenticado por role quando houver credenciais de teste.

## Proxima acao recomendada desta execucao

Executar uma prompt documental separada para os dois `P3`, se o objetivo for fechar tambem drift/qualidade dos guias. Para o scope atual de codigo em `real_dev`, o finding runtime/UI `P2` do `BK-MF5-05` ficou corrigido.

---

# Historico preservado - correcao anterior MF5 / BK-MF5-01

# Correcao da auditoria de implementacao real_dev - MF5

## Metadados

- Projeto: Orelle
- Data: 2026-06-22
- Prompt executada: `/Users/nuno/.codex/attachments/f0d82aae-7129-4485-b0d5-16d3fb0eada9/pasted-text.txt`
- Modo: `corrigir_auditoria`
- Implementation root: `real_dev`
- MF alvo: `MF5`
- BK corrigido: `BK-MF5-01`
- Relatorio de auditoria fonte: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`
- Severidades abrangidas: `P0`, `P1`, `P2`, `P3`
- Permissao de docs: `PERMITIR_ALTERAR_DOCS=nao`
- Permissao de commits: `PERMITIR_COMMITS=nao`
- Resultado geral: `CORRIGIDO`

## Sumario executivo

Foram corrigidos os dois findings `P2` confirmados na auditoria do
`BK-MF5-01`.

- `ORELLE-MF5-BK01-P2-001`: corrigido com suporte a transacao MongoDB quando o
  runtime suporta replica set e fallback duravel `processing`/`failed` quando
  nao ha transacao disponivel.
- `ORELLE-MF5-BK01-P2-002`: corrigido com testes adicionais para `delete`,
  `rejected`, `401` sem sessao, falha parcial recuperavel e ramo transacional.

Nao foram alterados BKs, documentos canonicos, planificacao, prompts, `apps/`
ou `agent/legacy/**`.

## Findings corrigidos

| Finding | Severidade | Estado final | Evidencia |
| --- | --- | --- | --- |
| `ORELLE-MF5-BK01-P2-001` | `P2` | `CORRIGIDO` | Estados `processing`/`failed` e `decisionError` no modelo; transacao opcional e fallback duravel no service; testes de falha e transacao. |
| `ORELLE-MF5-BK01-P2-002` | `P2` | `CORRIGIDO` | Suite MF5 expandida de 6 para 11 testes, cobrindo `delete`, rejeicao, `401`, falha parcial e transacao. |

## Alteracoes aplicadas

### Modelo de pedido biometrico

Ficheiro: `real_dev/api/src/models/biometric-data-request.model.js`

- `BIOMETRIC_REQUEST_STATUSES` passou a incluir `processing` e `failed`
  (`:21-27`).
- O schema passou a guardar `decisionError` minimizado e limitado a 500
  caracteres (`:76-80`).

Motivo: impedir que uma aprovacao parcialmente falhada deixe o pedido como
`pending` sem sinal operacional de recuperacao.

### Service RF41

Ficheiro: `real_dev/api/src/services/biometric-data-request.service.js`

- O DTO seguro passou a devolver `decisionError` sem expor dados biometricos
  (`:36-50`).
- Foi adicionada deteccao de suporte transacional MongoDB (`:64-91`).
- Foi adicionada execucao com `withTransaction` quando disponivel (`:94-118`).
- Queries, saves e updates passam a receber `session` quando ha transacao
  (`:129-155`, `:202-270`).
- O fluxo de aprovacao grava `processing`, aplica recursos e fecha em
  `completed`; em fallback sem transacao, falhas ficam em `failed` com mensagem
  recuperavel (`:331-367`).
- `decideBiometricDataRequest` passou a decidir dentro do guard
  transacional/fallback e rejeita estados ja fechados ou ainda em processamento
  (`:381-407`).

Motivo: preservar coerencia entre pedido e recursos em ambientes com transacao e
dar recuperacao operacional em ambientes MongoDB standalone.

### Testes MF5

Ficheiro: `real_dev/api/tests/mf5.biometric-data-requests.test.js`

- Mock de estados atualizado para `processing` e `failed` (`:33-39`).
- Documento de teste inclui `decisionError` (`:119-135`).
- Novo teste `401` sem sessao para criacao, listagem e decisao (`:215-232`).
- Novo teste de rejeicao sem mutar recursos biometricos (`:249-271`).
- Novo teste de `delete` para fotografias e relatorios (`:273-304`).
- Teste de `anonymize` mantido e separado do `delete` (`:306-341`).
- Novo teste de falha parcial sem transacao, marcando pedido como `failed`
  (`:344-363`).
- Novo teste de ramo transacional com `withTransaction`, `session` em query,
  update e save (`:365-430`).

## Rastreabilidade BK -> RF/RNF -> ficheiros -> testes

| BK | RF/RNF | Ficheiros corrigidos | Testes/evidencia |
| --- | --- | --- | --- |
| `BK-MF5-01` | `RF41` | `biometric-data-request.model.js`, `biometric-data-request.service.js`, `mf5.biometric-data-requests.test.js` | `npm --prefix real_dev/api test -- mf5.biometric-data-requests.test.js`: 11 testes passam. |

## Contratos consumidos e entregues

### Consumidos

- `BK-MF1-05`: `FacePhoto` continua a usar `userId`, `status` e storage privado.
- `BK-MF1-07`: `FaceReport` continua a usar `privacyStatus` e conteudo
  operacional.
- `BK-MF4-08`: recomendacoes continuam a excluir relatorios `deleted` e
  `anonymized` via `recommendation.service.js:141-145`.
- `BK-MF0-02`/`BK-MF0-05`: autenticacao por cookie e roles continuam impostas
  pelas rotas existentes.

### Entregues

- Pedido de privacidade biometrica com estados recuperaveis para aprovacao.
- Efeitos `delete` e `anonymize` idempotentes por recurso.
- Base mais coerente para o handoff `BK-MF5-04` de auditoria de acessos
  biometricos.

## Coerencia entre MFs

| Ligacao | Estado | Observacao |
| --- | --- | --- |
| `MF4 -> MF5` | `PRESERVADA` | A correcao nao altera recomendacoes, perfil, alergias ou restricoes; mantem a exclusao de relatorios eliminados/anonymizados. |
| `MF5` | `CORRIGIDA` | `BK-MF5-01` passa a ter consistencia operacional e cobertura de negativos alinhada ao guia. |
| `MF5 -> MF6` | `PRESERVADA` | Nao foram alterados contratos de performance, storage encriptado, HTTPS ou imagens; a correcao permanece no fluxo RF41. |
| `BK-MF5-01 -> BK-MF5-04` | `REFORCADA` | Estados `processing`/`failed` e `decisionError` tornam a futura auditoria de acessos/decisoes mais rastreavel. |

## Validacoes executadas

| Comando | Resultado | Notas |
| --- | --- | --- |
| `npm --prefix real_dev/api test -- mf5.biometric-data-requests.test.js` | `PASS` | 1 ficheiro, 11 testes. Executado fora do sandbox por causa de `listen EPERM` conhecido em Supertest. |
| `npm --prefix real_dev/api test` | `PASS` | 17 ficheiros, 140 testes. |
| `npm --prefix real_dev/web run build` | `PASS` | Build Vite concluido. |
| Pesquisa estatica obrigatoria com `rg` | `PASS_COM_FALSOS_POSITIVOS` | Ocorrencias pertencem a gateways de pagamento ja existentes, validacao de `SESSION_SECRET`, comentario contra `localStorage/sessionStorage` e texto de nao envio para treino externo. |
| `bash scripts/validate-planificacao.sh` | `FAIL_DOCS_QUALITY_PREEXISTENTE` | `coverage_pass=true`, `consistency_pass=true`, `guides_pass=false`; falhas em qualidade de guias MF4/MF5 fora do scope e nao corrigidas por `PERMITIR_ALTERAR_DOCS=nao`. |

## Validacoes nao executadas

- Smoke manual em browser nao executado porque os findings corrigidos sao de
  backend/service/testes e o build web passou.
- Teste com MongoDB replica set real nao executado; o ramo transacional foi
  validado por teste automatizado com runtime Mongoose mockado.

## Ficheiros alterados

- `real_dev/api/src/models/biometric-data-request.model.js`
- `real_dev/api/src/services/biometric-data-request.service.js`
- `real_dev/api/tests/mf5.biometric-data-requests.test.js`
- `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF5.md`

## Estado final

| Severidade | Antes | Depois |
| --- | ---: | ---: |
| `P0` | 0 | 0 |
| `P1` | 0 | 0 |
| `P2` | 2 | 0 |
| `P3` | 0 | 0 |

## Blockers/TODOs

- `scripts/validate-planificacao.sh` continua a falhar por qualidade documental
  preexistente em guias MF4/MF5. Nao foi corrigido nesta execucao por estar fora
  do scope de `corrigir_auditoria` do `BK-MF5-01` e porque
  `PERMITIR_ALTERAR_DOCS=nao`.

## Proxima acao recomendada

Executar uma validacao final em ambiente com MongoDB real/replica set se a
defesa exigir prova operacional de transacoes reais. Para o scope desta prompt,
os findings confirmados da auditoria foram corrigidos e validados por testes
automatizados.
