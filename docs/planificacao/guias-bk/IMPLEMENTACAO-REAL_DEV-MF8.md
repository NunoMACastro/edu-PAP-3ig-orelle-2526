# Implementacao real_dev - MF8

> **Nota de supersessão — 2026-07-11:** documento histórico de implementação. O contrato OpenAI-only e respetiva evidence estão no [plano canónico da consulta OpenAI](../PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md); o backup redigido antigo não constitui cópia recuperável e a arquitetura IA anterior é apenas história.

## Execucao atual - BK-MF8-14

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF8`
- `BK_IDS`: `BK-MF8-14`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-07

Esta execucao implementou o `BK-MF8-14 - Aproximacao da UI a UI do mockup` contra `RNF26`, reutilizando a base funcional entregue pelo `BK-MF8-13`. O guia publico usa exemplos `apps/web` e `apps/api`; como a prompt definiu `IMPLEMENTATION_ROOT=real_dev`, os caminhos foram mapeados para `real_dev/web` e `real_dev/api` sem alterar `apps/`, BKs, matriz, backlog, prompts ou documentos canonicos.

Nao existe directoria `mockup/` neste checkout. A comparacao visual foi executada em modo `baseline`, com checklist derivado de `RNF26`, `BK-MF5-05`, `BK-MF5-06`, `BK-MF5-07` e do handoff `BK-MF8-13 -> BK-MF8-14`. Nao foram criados endpoints, modelos, services, controllers, rotas, providers IA, regras de autorizacao, regras de biometria, pagamentos, carrinho, checkout ou campos de negocio novos.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-14` | `RNF26` | `IMPLEMENTADO` | `mockupAlignmentChecklist.js`, `AssistedConsultationHubPage.jsx` polida, CSS responsive, `check-mf8-mockup-alignment.mjs`, `bk-mf8-14.evidence-contract.js`, screenshots desktop/mobile em `real_dev/web/evidence/`, build web, suite API, validador de planificacao, pesquisa estatica e `git diff --check`. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Contrato canonico RNF26 | `docs/RNF.md:85` exige aproximacao aos mockups nos ecras principais; `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:90` define `BK-MF8-14` como `P0`, dependente de `BK-MF5-05`, `BK-MF5-06`, `BK-MF5-07` e `BK-MF8-13`. | `CUMPRE` |
| Baseline visual sem mockup | `real_dev/web/src/services/mockupAlignmentChecklist.js` fixa `RNF26`, areas `hero`, `steps`, `panel`, `empty-error`, baseline derivado e validacao de evidence com screenshots desktop/mobile. | `CUMPRE` |
| Hub polido sem fluxo paralelo | `real_dev/web/src/pages/AssistedConsultationHubPage.jsx` consome `buildMockupAlignmentChecklist`, mantem `getAssistedConsultationPanels(user)`, preserva estados sem sessao/sem acesso e reutiliza as paginas dos BKs `08` a `12`. | `CUMPRE` |
| CSS responsive e legivel | `real_dev/web/src/styles.css` adiciona shell, hero, status, steps, painel ativo, empty state e `@media (max-width: 760px)` para mobile, usando tokens `--surface-*`, `--brand-*`, `--line`, `--focus-ring` e `--shadow-soft`. | `CUMPRE` |
| Check estatico BK14 | `real_dev/web/scripts/check-mf8-mockup-alignment.mjs` valida 3 ficheiros e 6 padroes essenciais: checklist, import no hub, shell, `aria-pressed`, grelha e media query. | `CUMPRE` |
| Evidence minima P0 | `real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js` exige `BK-MF8-14`, `RNF26`, todas as areas visuais, 2 screenshots e 3 negativos minimos. | `CUMPRE` |
| Evidence visual | `real_dev/web/evidence/bk-mf8-14-desktop-hub.png` e `real_dev/web/evidence/bk-mf8-14-mobile-hub-focused.png` mostram o hub sem sessao em desktop/mobile; as leituras DOM confirmaram `horizontalOverflow: false` nos dois viewports. | `CUMPRE_COM_RISCO` |

### Contratos consumidos e entregues

- Consumidos de `BK-MF5-05`: grelha responsiva, leitura desktop/mobile e cards de pagina com dimensoes estaveis.
- Consumidos de `BK-MF5-06`: tokens visuais de marca, superficie, linha, foco e sombra ja existentes em `styles.css`.
- Consumidos de `BK-MF5-07`: mensagens claras e feedback controlado sem paths internos, tokens, fotografias ou dados biometricos.
- Consumidos de `BK-MF8-13`: `AssistedConsultationHubPage`, `assistedConsultationNavigation.js`, role gate visual e paginas integradas dos BKs `08` a `12`.
- Consumidos de `MF0`/`MF7`: sessao autenticada por cookie HttpOnly via `useAuth`/`apiRequest`; a UI nao guarda token em `localStorage`/`sessionStorage`.
- Entregues a `BK-MF8-15`: checklist visual, hub polido, CSS responsive, check estatico BK14, contrato de evidence e screenshots desktop/mobile em modo `baseline`.
- Preservados fora de scope: endpoints backend, ownership, autorizacao, consentimento, biometria, dados sensiveis, recomendacao automatica para compra, carrinho, checkout, pagamentos, webhooks, RAG, embeddings, treino externo e provider IA novo.

### Coerencia entre MFs e BKs vizinhos

- `MF5 -> MF8`: preservada. O BK14 usa os tokens e padroes visuais ja existentes em vez de criar sistema visual paralelo.
- `MF7 -> MF8`: preservada. A sessao continua a vir de `useAuth`; o frontend nao substitui autorizacao backend nem decide ownership.
- `BK-MF8-13 -> BK-MF8-14`: fechado. A pagina integrada foi polida diretamente, sem criar outra experiencia de consulta assistida.
- `BK-MF8-14 -> BK-MF8-15`: preparado. O proximo BK pode validar o check estatico, o contrato de evidence, as screenshots e a ausencia de E2E/browser automatizado aprovado.
- `MF seguinte`: nao existe `MF9` na matriz canonica atual (`MF0` a `MF8`); nao foi criado scope futuro.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P1` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 2 | Observacoes: nao existe `mockup/`, por isso a comparacao ficou em modo `baseline`; suite API e dev server falharam no sandbox com `listen EPERM`, mas passaram/arrancaram fora do sandbox. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/web/src/services/mockupAlignmentChecklist.js` | Criado | Checklist `RNF26`, baseline visual e validacao de evidence. |
| `real_dev/web/src/pages/AssistedConsultationHubPage.jsx` | Alterado | Aplica hierarquia visual, estados consistentes, status de sessao e painel ativo sem criar fluxo paralelo. |
| `real_dev/web/src/styles.css` | Alterado | Adiciona estilos responsive especificos da consulta assistida. |
| `real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | Criado | Smoke estatico BK14 para checklist, hub e CSS responsive. |
| `real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js` | Criado | Contrato de evidence visual minima para PR/defesa. |
| `real_dev/web/evidence/bk-mf8-14-desktop-hub.png` | Criado | Screenshot desktop focado no hub. |
| `real_dev/web/evidence/bk-mf8-14-mobile-hub-focused.png` | Criado | Screenshot mobile focado no hub. |
| `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | Alterado | Relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`. |

### Validacoes executadas

| Comando | Diretoria | Resultado |
| --- | --- | --- |
| `git status --short` | repo | `PASS_COM_NOTA` - havia relatorios/docs untracked antes da execucao; `real_dev/` continua ignorado como esperado. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | repo | `PASS` - `.gitignore:2:real_dev/` confirma que a implementacao real esta ignorada neste checkout. |
| `find . -maxdepth 2 -type d -name mockup -print` | repo | `PASS_COM_NOTA` - sem output; nao existe `mockup/` neste checkout. |
| `node --check real_dev/web/src/services/mockupAlignmentChecklist.js` | repo | `PASS` - sem erro de sintaxe. |
| `node --check real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | repo | `PASS` - sem erro de sintaxe. |
| `node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js` | repo | `PASS` - sem erro de sintaxe. |
| `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | repo | `PASS` - `BK-MF8-14 alinhamento visual validado: 3 ficheiros e 6 padroes.` |
| `npm --prefix real_dev/web run smoke:mf8-assisted-consultation` | repo | `PASS` - `BK-MF8-13 UI integrada validada: 8 ficheiros e 32 contratos.` |
| `node --input-type=module -e 'import { validateBKMF814Evidence } ...'` | repo | `PASS` - devolveu `{"bkId":"BK-MF8-14","status":"valid","domain":"mockup_alignment"}`. |
| `npm --prefix real_dev/web run build` | repo | `PASS` - Vite build com 87 modulos transformados. |
| `npm --prefix real_dev/api test` | repo, sandbox | `FAIL_AMBIENTE` - `listen EPERM: operation not permitted 0.0.0.0` e porta nula em testes Supertest. |
| `npm --prefix real_dev/api test` | repo, fora da sandbox | `PASS` - 38 ficheiros, 269 testes. |
| `bash scripts/validate-planificacao.sh` | repo | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias consistentes. |
| Pesquisa estatica obrigatoria em `real_dev/api`, `real_dev/web` e relatorios MF8 | repo | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como historico de relatorio, checks anti-storage, fake secrets de teste, providers/pagamentos MF3/MF7 existentes, disclaimers de treino externo e configuracao segura; nenhum hit novo no BK14 indica fuga de token, cookie, imagem, path interno, prompt, storage key ou dado biometrico. |
| Browser local `http://127.0.0.1:4175/#assisted-consultation-title` | repo, fora da sandbox | `PASS_COM_RISCO` - desktop e mobile focados no hub foram capturados; DOM confirmou `horizontalOverflow: false`. O estado autenticado com paineis nao foi validado em browser por falta de sessao seedada/API real nesse fluxo visual. |
| `git diff --check` | repo | `PASS` - sem whitespace errors em tracked changes. |
| `rg -n "[ \t]+$" ...ficheiros BK14...` | repo | `PASS` - sem trailing whitespace nos ficheiros BK14 criados/alterados. |

### Validacoes nao executadas

- Comparacao contra mockup aprovado: nao executada porque `mockup/` nao existe neste checkout; foi usado `mode: baseline`.
- QA manual autenticada com utilizador cliente, consultor e administrador reais seedados: nao executada; role gates e estados integrados ficaram cobertos por smoke estatico, build, suite API e evidence contract.
- E2E browser automatizado: nao existe script dedicado neste checkout para o fluxo BK14.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.
- Alteracao de guias BK, matriz, backlog ou documentos canonicos: nao executada, conforme `PERMITIR_ALTERAR_DOCS=nao`.

### Decisao

`BK-MF8-14` fica `IMPLEMENTADO`: a implementacao real entrega baseline visual `RNF26`, polimento responsivo do hub do `BK-MF8-13`, evidence visual minima desktop/mobile, check estatico e contrato de evidence para o `BK-MF8-15`, sem criar contratos backend paralelos nem enfraquecer autorizacao, ownership, consentimento, privacidade biometrica, comercio ou IA.

## Execucao atual - BK-MF8-13

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF8`
- `BK_IDS`: `BK-MF8-13`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-06

Esta execucao implementou o `BK-MF8-13 - Interface integrada cliente/consultor para consulta assistida` contra `RF42`, `RF45`, `RF46` e a base funcional de `RNF26`. O guia publico usa exemplos `apps/web` e `apps/api`; como a prompt definiu `IMPLEMENTATION_ROOT=real_dev`, os caminhos foram mapeados para `real_dev/web` e `real_dev/api` sem alterar `apps/`, BKs, matriz, backlog, prompts ou documentos canonicos.

O trabalho fecha a experiencia integrada da MF8 sem criar endpoints backend novos: a app ganhou um contrato de navegacao por role, uma pagina `AssistedConsultationHubPage` que reutiliza `GuidedConsultationPage`, `AiHistoryPage`, `ProductRecommendationsPage`, `ClientAiInsightsPage` e `ConsultantAiReviewPage`, um smoke estatico do BK13, um contrato minimo de evidence e a ligacao no `App.jsx`. A autorizacao real continua nos endpoints existentes; a UI apenas organiza os paineis visiveis.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-13` | `RF42`, `RF45`, `RF46`, `RNF26` | `IMPLEMENTADO` | `assistedConsultationNavigation.js`, `AssistedConsultationHubPage.jsx`, integracao em `App.jsx`, script `smoke:mf8-assisted-consultation`, evidence contract `bk-mf8-13.evidence-contract.js`, build web, smokes MF8, suite API completa, validador de planificacao e pesquisa estatica. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Contrato canonico do BK | `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md:89` e `BACKLOG-MVP.md:117` definem `BK-MF8-13` como P0 dependente de `BK-MF8-08` a `BK-MF8-12`, com `RF42`, `RF45`, `RF46`, `RNF26` e handoff para `BK-MF8-14`. | `CUMPRE` |
| Role gate visual testavel | `real_dev/web/src/services/assistedConsultationNavigation.js:1` a `:80` define os paineis de cliente, painel de consultor/admin e funcoes `canUseClientConsultationPanels`, `canUseConsultantReviewPanel` e `getAssistedConsultationPanels`. | `CUMPRE` |
| Hub integrado sem endpoint novo | `real_dev/web/src/pages/AssistedConsultationHubPage.jsx:21` a `:49` reutiliza paginas existentes por painel; `:57` a `:135` cobre loading, sem sessao, role sem acesso, navegacao por `aria-pressed` e painel ativo com `aria-live`. | `CUMPRE` |
| Sessao e roles preservadas | `real_dev/web/src/pages/AssistedConsultationHubPage.jsx:58` usa `useAuth`; `real_dev/web/src/context/AuthContext.jsx` continua a obter o utilizador por `/auth/me` via cookie HttpOnly e `apiRequest`. | `CUMPRE` |
| Integracao no shell real | `real_dev/web/src/App.jsx:17` importa o hub; `:87` calcula `isClient`; `:134` a `:165` preserva smokes anteriores para cliente e monta `<AssistedConsultationHubPage />` como entrada central. | `CUMPRE` |
| Consultor/admin com entrada de revisao | `real_dev/web/src/services/assistedConsultationNavigation.js:32` a `:37` expoe apenas `CONSULTANT_REVIEW`; `AssistedConsultationHubPage.jsx:39` a `:40` renderiza `ConsultantAiReviewPage` para esse painel. | `CUMPRE` |
| Check estatico BK13 | `real_dev/web/scripts/check-mf8-assisted-consultation-ui.mjs:79` a `:129` valida import do hub, paginas reutilizadas, role gates, estados acessiveis e ausencia de storage local/IDs internos no hub. | `CUMPRE` |
| Evidence minima P0 | `real_dev/api/tests/evidence/bk-mf8-13.evidence-contract.js:1` a `:50` exige `BK-MF8-13`, `RF42`, `RF45`, `RF46`, `RNF26`, 4 provas tecnicas e 3 cenarios negativos. | `CUMPRE` |
| Nenhum contrato backend paralelo | Nao foram criados controller, service, route, model ou endpoint backend novo nesta execucao; o hub chama paginas/endpoints existentes dos BKs `08` a `12`. | `CUMPRE` |

### Contratos consumidos e entregues

- Consumidos de `BK-MF8-08`: `GuidedConsultationPage` e endpoints `/api/ai-consultation/sessions`.
- Consumidos de `BK-MF8-09`: `AiHistoryPage`, `aiInteractionHistoryApi.js` e endpoint `/api/me/ai-interactions`.
- Consumidos de `BK-MF8-10`: `ProductRecommendationsPage` com `onRecommendationsChange`, recomendacoes enriquecidas e separacao de compra/carrinho.
- Consumidos de `BK-MF8-11`: `ConsultantAiReviewPage` e endpoints `/api/consultant/ai-consultation-reviews`, protegidos por `requireAuth`/role no backend.
- Consumidos de `BK-MF8-12`: `ClientAiInsightsPage` e endpoint `/api/me/ai-consultation-insights` com ownership por sessao.
- Consumidos de `MF0`/`MF7`: roles `cliente`, `consultor`, `administrador` e sessao autenticada por cookie HttpOnly.
- Entregues a `BK-MF8-14`: pagina integrada `AssistedConsultationHubPage`, contrato de navegacao, estados de auth/role, smoke estatico e evidence minima para polimento visual sem recriar fluxo funcional.
- Preservados fora de scope: endpoints novos, modelos, services, controllers, provider IA novo, chat livre, diagnostico clinico, checkout, carrinho, pagamento, webhooks, RAG, embeddings e treino externo.

### Coerencia entre MFs e BKs vizinhos

- `MF7 -> MF8`: preservada. A UI usa `useAuth` e `apiRequest`; nao guarda tokens em `localStorage`/`sessionStorage` e nao decide ownership.
- `BK-MF8-08 -> BK-MF8-13`: preservada. A consulta guiada continua no componente proprio e no endpoint real existente.
- `BK-MF8-09 -> BK-MF8-13`: preservada. O historico IA continua minimizado e carregado pelo cliente API existente.
- `BK-MF8-10 -> BK-MF8-13`: preservada. O hub reutiliza recomendacoes enriquecidas sem criar compra automatica, carrinho ou checkout.
- `BK-MF8-11 -> BK-MF8-13`: preservada. A area de consultor continua no componente existente e a autorizacao efetiva permanece no backend.
- `BK-MF8-12 -> BK-MF8-13`: fechado. Os insights publicos entram como painel de cliente, sem expor notas internas ou audit trail.
- `BK-MF8-13 -> BK-MF8-14`: preparado. O proximo BK pode trabalhar responsividade, hierarquia visual e aproximacao ao mockup sobre a base funcional integrada.
- `MF seguinte`: nao existe `MF9` na matriz canonica atual (`MF0` a `MF8`); nao foi criado scope futuro.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P1` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Observacao ambiental: os testes Supertest falharam dentro da sandbox com `listen EPERM`/porta nula e passaram fora da sandbox. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/web/src/services/assistedConsultationNavigation.js` | Criado | Define paineis e role gates visuais da consulta assistida. |
| `real_dev/web/src/pages/AssistedConsultationHubPage.jsx` | Criado | Integra avaliacao guiada, historico IA, recomendacoes, insights e revisao humana numa pagina central. |
| `real_dev/web/src/App.jsx` | Alterado | Importa/monta o hub e restringe entradas MF8 soltas de cliente a `role=cliente` sem apagar componentes existentes. |
| `real_dev/web/scripts/check-mf8-assisted-consultation-ui.mjs` | Criado | Smoke estatico BK13 para imports, paineis, role gates e negativos de storage/IDs internos. |
| `real_dev/web/package.json` | Alterado | Publica `smoke:mf8-assisted-consultation`. |
| `real_dev/api/tests/evidence/bk-mf8-13.evidence-contract.js` | Criado | Valida evidence minima para PR/defesa. |
| `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | Alterado | Relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`. |

### Validacoes executadas

| Comando | Diretoria | Resultado |
| --- | --- | --- |
| `git status --short --untracked-files=all` | repo | `PASS_COM_NOTA` - antes e depois da execucao aparecem apenas os relatorios tecnicos MF8 untracked; `real_dev/` esta ignorado como esperado. |
| `git check-ignore -v real_dev real_dev/api real_dev/web real_dev/web/src/pages/AssistedConsultationHubPage.jsx real_dev/api/tests/evidence/bk-mf8-13.evidence-contract.js` | repo | `PASS` - `.gitignore:2:real_dev/` confirma que a implementacao real esta ignorada neste checkout. |
| `node --check real_dev/web/src/services/assistedConsultationNavigation.js` | repo | `PASS` - sem erro de sintaxe. |
| `node --check real_dev/web/scripts/check-mf8-assisted-consultation-ui.mjs` | repo | `PASS` - sem erro de sintaxe. |
| `node --check real_dev/api/tests/evidence/bk-mf8-13.evidence-contract.js` | repo | `PASS` - sem erro de sintaxe. |
| `node --input-type=module -e 'import { validateBKMF813Evidence } ...'` | repo | `PASS` - evidence valida devolveu `{"bkId":"BK-MF8-13","status":"valid","domain":"assisted_consultation_ui"}`. |
| `npm --prefix real_dev/web run smoke:mf8-assisted-consultation` | repo | `PASS` - 8 ficheiros e 32 contratos verificados. |
| `npm --prefix real_dev/web run smoke:mf8-consultation` | repo | `PASS` - check BK-MF8-08 preservado. |
| `npm --prefix real_dev/web run smoke:mf8-ai-history` | repo | `PASS` - check BK-MF8-09 preservado. |
| `npm --prefix real_dev/web run build` | repo | `PASS` - Vite build com 86 modulos transformados. |
| `npm --prefix real_dev/api test -- tests/mf8.ai-consultation-review.test.js tests/mf8.client-insights.test.js` | repo, sandbox | `FAIL_AMBIENTE` - `listen EPERM: operation not permitted 0.0.0.0`. |
| `npm --prefix real_dev/api test -- tests/mf8.ai-consultation-review.test.js tests/mf8.client-insights.test.js` | repo, fora da sandbox | `PASS` - 2 ficheiros, 15 testes. |
| `npm --prefix real_dev/api test` | repo, fora da sandbox | `PASS` - 38 ficheiros, 269 testes. |
| `bash scripts/validate-planificacao.sh` | repo | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias consistentes. |
| Pesquisa estatica obrigatoria em `real_dev/api`, `real_dev/web` e relatorios MF8 | repo | `PASS_COM_RESIDUAIS_ESPERADOS` - hits classificados como checks anti-storage, fake secrets de teste, pagamentos/stubs MF3, providers existentes e historico de relatorios; nenhum hit novo no BK13 indica fuga de token, cookie, imagem, path interno, prompt, storage key ou dados biometricos. |
| `git diff --check` | repo | `PASS` - sem whitespace errors em tracked changes. |
| `rg -n "[ \t]+$" ...ficheiros tocados...` | repo | `PASS` - sem trailing whitespace nos ficheiros criados/alterados lidos diretamente. |

### Validacoes nao executadas

- QA manual/browser com utilizadores reais cliente, consultor e administrador: nao executada; o contrato foi coberto por smokes estaticos, build, suite API completa, pesquisa estatica e validador de planificacao.
- Screenshots/mockup visual: nao executado; o checkout atual nao tem pasta `mockup/` e `BK-MF8-14` fica responsavel pelo polimento visual.
- Teste E2E browser automatizado: nao existe script dedicado neste checkout para o fluxo integrado BK13.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.
- Alteracao de guias BK, matriz, backlog ou documentos canonicos: nao executada, conforme `PERMITIR_ALTERAR_DOCS=nao`.

### Decisao

`BK-MF8-13` fica `IMPLEMENTADO`: a implementacao real entrega a pagina central de consulta assistida, organiza paineis por role, preserva autorizacao/ownership no backend, reutiliza os contratos dos BKs `08` a `12`, nao cria endpoints paralelos, nao mistura recomendacao com compra automatica e deixa o handoff funcional para `BK-MF8-14`.

## Execucao atual - BK-MF8-12

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF8`
- `BK_IDS`: `BK-MF8-12`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-06

Esta execucao implementou o `BK-MF8-12 - Insights e correcoes do consultor visiveis para o cliente` contra `RF46`, reutilizando a fronteira de seguranca do `BK-MF8-11` e o requisito de DTO seguro/auditavel de `RNF31`. O guia publico usa exemplos `apps/api` e `apps/web`; como a prompt definiu `IMPLEMENTATION_ROOT=real_dev`, todos os exemplos foram mapeados para `real_dev/api` e `real_dev/web` sem alterar `apps/`, BKs, matriz, backlog, prompts ou documentos canonicos.

O trabalho fecha a superficie cliente da revisao humana: a API passa a expor `GET /api/me/ai-consultation-insights`, autenticado por cookie HttpOnly, com ownership decidido por `req.user.id`, filtro opcional `consultationSessionId`, DTO publico sem notas internas/audit trail/reviewer e listagem apenas de reviews finalizadas com `publicInsight`. O frontend ganhou `ClientAiInsightsPage`, integrada junto das recomendacoes, com estados de carregamento, erro, vazio, sucesso e filtro por sessao IA.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-12` | `RF46`, fronteira `RNF31` herdada de BK11 | `IMPLEMENTADO` | `listPublishedConsultantInsightsForClient`, `validateClientInsightQuery`, controller/route `client-ai-insight`, rota `/api/me/ai-consultation-insights`, pagina `ClientAiInsightsPage`, integracao em `App.jsx`, teste focal `mf8.client-insights.test.js`, suite API completa, build web, validador de planificacao e pesquisa estatica. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| DTO publico de insight do consultor | `real_dev/api/src/services/ai-consultation-review.service.js:229` a `:257` devolve apenas `id`, `consultationSessionId`, `status`, `note`, `publishedAt`, `reviewedAt` e `recommendations`; `internalNote`, `reviewedBy`, `auditTrail` e `actorId` ficam fora da resposta cliente. | `CUMPRE` |
| Listagem por ownership backend | `real_dev/api/src/services/ai-consultation-review.service.js:272` a `:297` filtra por `userId` vindo da sessao, estado final `approved`/`adjusted`, `publicInsight` existente e filtro opcional `consultationSessionId`. | `CUMPRE` |
| Filtro de sessao validado | `real_dev/api/src/validators/client-ai-insight.validator.js:15` a `:29` aceita ausencia de filtro ou ObjectId valido e rejeita valores malformados com `400`. | `CUMPRE` |
| Controller sem ownership vindo do browser | `real_dev/api/src/controllers/client-ai-insight.controller.js:17` a `:30` usa `req.user.id` e nao aceita `userId` de query/body. | `CUMPRE` |
| Endpoint autenticado de cliente | `real_dev/api/src/routes/client-ai-insight.routes.js:17` a `:21` define `GET /me/ai-consultation-insights` com `requireAuth`; `real_dev/api/src/app.js:15` e `:89` a `:91` montam a rota em `/api`. | `CUMPRE` |
| UI cliente integrada | `real_dev/web/src/pages/ClientAiInsightsPage.jsx:73` a `:205` chama `/me/ai-consultation-insights`, envia cookie via `apiRequest`, cobre loading/error/empty/success e apresenta recomendações afetadas sem decidir ownership. | `CUMPRE` |
| Pagina no fluxo de cliente | `real_dev/web/src/App.jsx:23` importa a pagina; `:148` a `:153` integra `ClientAiInsightsPage` junto de `ProductRecommendationsPage`, fora da area privada de consultoria. | `CUMPRE` |
| Negativos automatizados | `real_dev/api/tests/mf8.client-insights.test.js:128` a `:224` cobre sem sessao, `consultationSessionId` invalido, query com `userId` da sessao, filtro por sessao, review sem nota publica e ausencia de campos internos. | `CUMPRE` |
| Handoff BK11 -> BK12 | `real_dev/api/tests/mf8.ai-consultation-review.test.js:270` a `:319` foi atualizado para provar que `toPublishedConsultantInsightDto` entrega `recommendations` publicas e continua sem nota interna. | `CUMPRE` |

### Contratos consumidos e entregues

- Consumidos de `BK-MF8-09`: `consultationSessionId` como referencia de sessao IA minimizada.
- Consumidos de `BK-MF8-10`: recomendacoes enriquecidas com produto, score, estado, motivos, explicacao, fontes publicas e limitacoes.
- Consumidos de `BK-MF8-11`: `AiConsultationReview`, estados finais, `publicInsight`, separacao `internalNote`/`publicInsight`, audit trail privado e DTO publico reutilizavel.
- Consumidos de `MF0`/`MF7`: sessao autenticada por cookie HttpOnly via `requireAuth` e `apiRequest` com `credentials: "include"`.
- Entregues a `BK-MF8-13`: endpoint de cliente, DTO publico estavel, pagina `ClientAiInsightsPage` e estados de UI reutilizaveis na interface integrada.
- Preservados fora de scope: decisao do consultor, fila privada de consultor, interface integrada final, mockup visual final, chat livre, provider IA novo, diagnostico clinico, carrinho, checkout, pagamento, webhooks, RAG, embeddings e treino externo.

### Coerencia entre MFs e BKs vizinhos

- `MF0/MF7 -> MF8`: preservada. A leitura cliente usa sessao HttpOnly; o frontend nao guarda tokens em `localStorage`/`sessionStorage` e nao decide ownership.
- `BK-MF8-09 -> BK-MF8-12`: preservada. O filtro `consultationSessionId` restringe dados dentro do cliente autenticado, sem expor historico bruto, prompts, fotografias, consentimentos ou storage keys.
- `BK-MF8-10 -> BK-MF8-12`: preservada. As recomendacoes afetadas aparecem como DTO publico e nao geram compra/carrinho/checkout automatico.
- `BK-MF8-11 -> BK-MF8-12`: fechado. O cliente ve apenas reviews finalizadas com `publicInsight`; notas internas, revisor, actor IDs e audit trail continuam privados.
- `BK-MF8-12 -> BK-MF8-13`: preparado. A proxima interface integrada pode reutilizar endpoint, pagina e DTO sem criar contrato paralelo.
- `MF seguinte`: nao existe `MF9` na matriz canonica atual (`MF0` a `MF8`); nao foi criado scope futuro.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P1` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Observacao ambiental: os testes Supertest falharam dentro da sandbox com `listen EPERM`/porta nula e passaram fora da sandbox. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/api/src/services/ai-consultation-review.service.js` | Alterado | Reforca o DTO publico e adiciona `listPublishedConsultantInsightsForClient`. |
| `real_dev/api/src/validators/client-ai-insight.validator.js` | Criado | Valida `consultationSessionId` opcional. |
| `real_dev/api/src/controllers/client-ai-insight.controller.js` | Criado | Lista insights do cliente autenticado com ownership de sessao. |
| `real_dev/api/src/routes/client-ai-insight.routes.js` | Criado | Publica `GET /api/me/ai-consultation-insights` com `requireAuth`. |
| `real_dev/api/src/app.js` | Alterado | Monta `clientAiInsightRoutes` no prefixo `/api`. |
| `real_dev/web/src/pages/ClientAiInsightsPage.jsx` | Criado | UI cliente para insights do consultor com filtro e estados completos. |
| `real_dev/web/src/App.jsx` | Alterado | Integra a pagina no grupo de cliente junto das recomendacoes. |
| `real_dev/api/tests/mf8.client-insights.test.js` | Criado | Testes focais de auth, filtro, ownership e DTO seguro. |
| `real_dev/api/tests/mf8.ai-consultation-review.test.js` | Alterado | Atualiza o contrato do DTO publico exportado por BK11 para BK12. |
| `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | Alterado | Relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`. |

### Validacoes executadas

| Comando | Diretoria | Resultado |
| --- | --- | --- |
| `git status --short` | repo | `PASS_COM_NOTA` - antes da execucao existiam apenas os relatorios tecnicos MF8 untracked; `real_dev/` continua ignorado como esperado. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | repo | `PASS` - `.gitignore:2:real_dev/` confirma que a implementacao real esta ignorada neste checkout. |
| `npm --prefix real_dev/api test -- tests/mf8.ai-consultation-review.test.js tests/mf8.client-insights.test.js` | repo, sandbox | `FAIL_AMBIENTE` - `listen EPERM: operation not permitted 0.0.0.0`. |
| `npm --prefix real_dev/api test -- tests/mf8.ai-consultation-review.test.js tests/mf8.client-insights.test.js` | repo, fora da sandbox | `PASS` - 2 ficheiros, 15 testes. |
| `npm --prefix real_dev/api test` | repo, fora da sandbox | `PASS` - 38 ficheiros, 269 testes. |
| `npm --prefix real_dev/web run build` | repo | `PASS` - Vite build com 84 modulos transformados. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/web/src`, `real_dev/web/scripts` | repo | `PASS_COM_RESIDUAIS_ESPERADOS` - hits residuais antigos/legitimos em checks anti-storage, fake secrets de testes, pagamentos MF3 e providers existentes; nenhum hit novo indica fuga de nota interna, token, cookie, imagem, storage key ou prompt no BK12. |
| `bash scripts/validate-planificacao.sh` | repo | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias consistentes. |
| `git diff --check` | repo | `PASS` - sem whitespace errors em tracked changes. |

### Validacoes nao executadas

- QA manual/browser com utilizador cliente e consultor reais seedados: nao executada; o contrato foi coberto por testes HTTP, suite API completa, build web, pesquisa estatica e validador de planificacao.
- Screenshots/mockup visual: nao executado; o checkout atual nao tem pasta `mockup/` e `BK-MF8-14` fica responsavel pelo polimento visual.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.
- Alteracao de guias BK, matriz, backlog ou documentos canonicos: nao executada, conforme `PERMITIR_ALTERAR_DOCS=nao`.

### Decisao

`BK-MF8-12` fica `IMPLEMENTADO`: a implementacao real cumpre `RF46`, preserva a fronteira privada de `RNF31`, expoe os insights publicados do consultor apenas ao utilizador autenticado dono da sessao, valida o filtro opcional, remove reviews sem `publicInsight`, nao devolve campos internos e entrega uma pagina cliente integrada e validada por testes focais, suite API completa, build web, pesquisa estatica, validador de planificacao e `git diff --check`.

## Execucao atual - BK-MF8-11

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF8`
- `BK_IDS`: `BK-MF8-11`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-06

Esta execucao implementou o `BK-MF8-11 - Revisao humana de sessoes IA por consultores` contra `RF45` e `RNF31`, usando `real_dev/api` e `real_dev/web` como raizes reais. O guia publico usa exemplos `apps/api` e `apps/web`; como a prompt definiu `IMPLEMENTATION_ROOT=real_dev`, todos os exemplos foram mapeados para `real_dev` sem alterar `apps/`, BKs, matriz, backlog, prompts ou documentos canonicos.

O trabalho fecha a camada privada de revisao humana da MF8: a API passa a ter modelo persistente de review, validator de decisao, service com DTOs seguros, fila protegida para `consultor`/`administrador`, detalhe minimizado, decisao `approved`/`adjusted`/`needs_clarification`, `auditTrail` e DTO publico exportado para o `BK-MF8-12`. A geracao enriquecida do `BK-MF8-10` agora cria/refresca uma revisao pendente quando existe `consultationSessionId`, para que a fila de consultor tenha origem real e nao seja apenas um CRUD isolado. O frontend ganhou uma pagina de revisao IA no grupo de consultoria existente, mantendo a autorizacao efetiva no backend.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-11` | `RF45`, `RNF31` | `IMPLEMENTADO` | `AiConsultationReview`, `validateReviewDecisionInput`, `createOrRefreshAiConsultationReviewForSession`, `listAiConsultationReviewsForConsultant`, `decideAiConsultationReview`, `toPublishedConsultantInsightDto`, rotas `/api/consultant/ai-consultation-reviews`, pagina `ConsultantAiReviewPage`, teste focal `mf8.ai-consultation-review.test.js`, regressao `mf8.enriched-recommendations.test.js`, suite API completa e build web validados. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Modelo persistente de revisao humana | `real_dev/api/src/models/ai-consultation-review.model.js:12` a `:139` define estados fechados, `publicInsight`, `internalNote`, `reviewedBy`, `reviewedAt`, `auditTrail`, indices por status e ligacao a `userId`, `consultationSessionId` e `ProductRecommendation`. | `CUMPRE` |
| Input validado antes do service | `real_dev/api/src/validators/ai-consultation-review.validator.js:7` a `:126` valida `reviewId`, decisao, nota publica obrigatoria em `approved`/`adjusted`, nota interna obrigatoria em `needs_clarification` e IDs de recomendacoes ajustadas. | `CUMPRE` |
| Fila de consultor com origem real | `real_dev/api/src/services/recommendation.service.js:15` e `:480` a `:484` ligam a geracao enriquecida ao BK11; `real_dev/api/src/services/ai-consultation-review.service.js:182` a `:219` cria/refresca revisao pendente para sessao guiada com fontes e limitacoes publicas. | `CUMPRE` |
| DTO de lista minimizado | `real_dev/api/src/services/ai-consultation-review.service.js:95` a `:106` devolve `id`, `status`, `summary`, fontes/limitacoes, contagem e datas, sem `userId`, `consultationSessionId`, notas internas ou audit actor. | `CUMPRE` |
| Detalhe seguro para decisao humana | `real_dev/api/src/services/ai-consultation-review.service.js:75` a `:85` converte recomendacoes para produto/score/status/motivos/explicacao/fontes publicas/limitacoes; `:116` a `:132` omite `actorId` no `auditTrail`. | `CUMPRE` |
| Decisao auditavel e idempotencia de fecho | `real_dev/api/src/services/ai-consultation-review.service.js:355` a `:400` bloqueia revisao ja fechada com `409`, valida recomendacoes da propria review, grava `reviewedBy`, `reviewedAt`, `internalNote`, `publicInsight` e evento de `auditTrail`. | `CUMPRE` |
| Ajuste sem alteracao cruzada entre clientes | `real_dev/api/src/services/ai-consultation-review.service.js:301` a `:315` rejeita recomendacao fora da review; `:328` a `:342` atualiza recomendações por `_id` e `userId` da propria review. | `CUMPRE` |
| Handoff para BK-MF8-12 | `real_dev/api/src/services/ai-consultation-review.service.js:228` a `:246` exporta `toPublishedConsultantInsightDto`, devolvendo apenas insight publico finalizado, sessao, estado, datas e IDs de recomendacao. | `CUMPRE` |
| Rotas protegidas por sessao e role | `real_dev/api/src/routes/ai-consultation-review.routes.js:18` a `:37` exige `requireAuth` e `requireRole(ROLES.CONSULTOR, ROLES.ADMIN)` em lista, detalhe e decisao; `real_dev/api/src/app.js:13` e `:95` montam a rota em `/api`. | `CUMPRE` |
| UI de consultor integrada | `real_dev/web/src/pages/ConsultantAiReviewPage.jsx:54` a `:137` carrega fila, detalhe e decisao via `apiRequest`; `:143` a `:249` cobre loading, erro, vazio, detalhe e submissao; `real_dev/web/src/App.jsx:23` e `:164` a `:173` integram a pagina no grupo de consultoria. | `CUMPRE` |

### Contratos consumidos e entregues

- Consumidos de `BK-MF2-06`: roles `cliente`, `consultor` e `administrador`, rota de revisao manual existente e convencao `requireRole`.
- Consumidos de `BK-MF8-09`: `consultationSessionId` e contexto IA seguro que permite ao BK10 gerar recomendacoes enriquecidas.
- Consumidos de `BK-MF8-10`: recomendacoes com `reasonCodes`, `sourceSignals`, `limitations`, produto populado e contexto guiado opcional.
- Entregues a `BK-MF8-12`: `toPublishedConsultantInsightDto(review)` e separacao estrita entre `publicInsight` e `internalNote`.
- Preservados fora de scope: endpoint de cliente para insights, interface integrada cliente/consultor, provider IA novo, diagnostico clinico, checkout, carrinho, pagamentos, webhooks, RAG, embeddings e treino externo.

### Coerencia entre MFs e BKs vizinhos

- `MF0/MF7 -> MF8`: preservada. A sessao continua por cookie HttpOnly; o backend e que valida role/ownership; a UI e apenas facilitador visual.
- `BK-MF8-09 -> BK-MF8-10 -> BK-MF8-11`: fechado. Historico seguro alimenta recomendacoes enriquecidas; recomendacoes enriquecidas criam revisao pendente para consultor sem expor IDs internos no DTO de lista.
- `BK-MF8-11 -> BK-MF8-12`: preparado. O DTO publico exportado publica apenas nota aprovada, estado e referencias minimas; `internalNote` e `auditTrail.actorId` nao seguem para cliente.
- `MF seguinte`: nao existe `MF9` na matriz canonica atual (`MF0` a `MF8`); nao foi criado scope futuro.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P1` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Observacao ambiental: os testes Supertest falharam dentro da sandbox com `listen EPERM`/porta nula e passaram fora da sandbox. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/api/src/models/ai-consultation-review.model.js` | Criado | Modelo persistente de revisao humana com estados, notas separadas e `auditTrail`. |
| `real_dev/api/src/validators/ai-consultation-review.validator.js` | Criado | Valida `reviewId`, decisao, notas e recomendacoes ajustadas. |
| `real_dev/api/src/services/ai-consultation-review.service.js` | Criado | Implementa fila, detalhe, decisao, DTO publico e criacao/refresco de review pendente a partir do BK10. |
| `real_dev/api/src/controllers/ai-consultation-review.controller.js` | Criado | Controllers de lista, detalhe e decisao. |
| `real_dev/api/src/routes/ai-consultation-review.routes.js` | Criado | Rotas protegidas `/api/consultant/ai-consultation-reviews`. |
| `real_dev/api/src/app.js` | Alterado | Monta `aiConsultationReviewRoutes` no prefixo `/api`. |
| `real_dev/api/src/services/recommendation.service.js` | Alterado | Chama `createOrRefreshAiConsultationReviewForSession` depois de gerar recomendacoes enriquecidas com sessao guiada. |
| `real_dev/web/src/pages/ConsultantAiReviewPage.jsx` | Criado | UI de fila, detalhe e decisao para consultor/admin. |
| `real_dev/web/src/App.jsx` | Alterado | Integra a pagina no grupo de consultoria ja limitado por role visual. |
| `real_dev/api/tests/mf8.ai-consultation-review.test.js` | Criado | Testes focais de auth, role, detalhe, decisao, negativos e DTO publico para BK12. |
| `real_dev/api/tests/mf8.enriched-recommendations.test.js` | Alterado | Regressao que prova criacao/refresco de review pendente a partir de recomendacoes enriquecidas. |

### Validacoes executadas

| Comando | Diretoria | Resultado |
| --- | --- | --- |
| `node --check` nos ficheiros backend alterados/criados e testes focais | repo | `PASS` |
| `npm --prefix real_dev/api test -- tests/mf8.ai-consultation-review.test.js tests/mf8.enriched-recommendations.test.js` | repo, fora da sandbox | `PASS` - 2 ficheiros, 14 testes |
| `npm --prefix real_dev/api test -- tests/mf2.integration.test.js tests/mf4.integration.test.js tests/mf8.ai-consultation.test.js tests/mf8.ai-interaction-history.test.js tests/mf8.recommendation-explainability.test.js tests/mf8.enriched-recommendations.test.js tests/mf8.ai-consultation-review.test.js` | repo, fora da sandbox | `PASS` - 7 ficheiros, 57 testes |
| `npm --prefix real_dev/api test` | repo, fora da sandbox | `PASS` - 37 ficheiros, 263 testes |
| `npm --prefix real_dev/web run build` | repo | `PASS` - 83 modulos transformados |
| `npm --prefix real_dev/web run smoke:mf2` | repo | `PASS` |
| `npm --prefix real_dev/web run smoke:mf8-consultation` | repo | `PASS` |
| `npm --prefix real_dev/web run smoke:mf8-ai-history` | repo | `PASS` |
| `rg -n "RF45\|RNF31\|BK-MF8-11" docs/RF.md docs/RNF.md docs/planificacao/backlogs/...` | repo | `PASS` - contrato canonico encontrado em RF/RNF/matriz/backlog/anexo |
| `rg` estatico obrigatorio em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/web/src`, `real_dev/web/scripts` | repo | `PASS_COM_RESIDUAIS_ESPERADOS` - hits residuais antigos de pagamentos MF3, storage checks de smokes, segredos fake em testes e provider externo MF7/MF8; nos ficheiros BK11 os hits `userId`, `internalNote`, `actorId` e `sourceSignals` ficam persistidos internamente/testados e nao saem nos DTOs de lista/publico. |
| `bash scripts/validate-planificacao.sh` | repo | `PASS` - `overall_pass: true` |
| `git diff --check` | repo | `PASS` |
| `rg -n "[ \t]+$" ...ficheiros tocados...` | repo | `PASS` - sem trailing whitespace |

### Validacoes nao executadas

- QA manual/browser com dados reais seeded de consultor e cliente: pendente por exigir sessao/dados interativos. A cobertura automatica valida API, role gates, DTOs, build e smokes estaticos existentes.

### Decisao

`BK-MF8-11` fica `IMPLEMENTADO`: a implementacao real cumpre `RF45` e `RNF31`, cria revisao humana persistente e auditavel, protege lista/detalhe/decisao por sessao e role, separa nota publica de nota interna, impede ajuste fora da review, cria fila real a partir de recomendacoes enriquecidas com sessao guiada, entrega DTO publico para `BK-MF8-12` e valida o contrato com testes focais, regressões MF2/MF4/MF8, suite API completa, build web, smokes existentes, pesquisa estatica e validador de planificacao.

## Execucao atual - BK-MF8-09

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF8`
- `BK_IDS`: `BK-MF8-09`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-06

Esta execucao implementou o `BK-MF8-09 - Historico seguro da interacao cliente-IA` contra `RF47` e `RNF30`, usando `real_dev/api` e `real_dev/web` como raizes reais. O guia publico usa exemplos `apps/api` e `apps/web`, mas a prompt desta execucao definiu `IMPLEMENTATION_ROOT=real_dev`; por isso os contratos foram mapeados para `real_dev` sem alterar `apps/`, BKs, matriz, backlog, prompts ou documentos canonicos.

O trabalho cria a fronteira cumulativa para historico IA seguro: a API passa a ter um modulo `ai-interaction-history` com modelo cifrado em repouso, service de minimizacao/validacao, DTO publico sem `userId`/`sessionId`, endpoint autenticado `GET /api/me/ai-interactions`, integracao automatica quando a sessao guiada e submetida e contrato interno reutilizavel por `BK-MF8-10`. O frontend ganhou uma pagina de timeline integrada no shell existente, usando `apiRequest` com cookies HttpOnly e sem `localStorage`/`sessionStorage`.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-09` | `RF47`, `RNF30` | `IMPLEMENTADO` | `AiInteractionHistory`, `recordAiInteractionHistoryEvent`, `listMyAiInteractionHistory`, endpoint `/api/me/ai-interactions`, pagina `AiHistoryPage`, teste `mf8.ai-interaction-history.test.js`, regressao `mf8.ai-consultation.test.js` e smoke `smoke:mf8-ai-history` validados. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Persistencia com ownership interno e cifra em repouso | `real_dev/api/src/models/ai-interaction-history.model.js` guarda `userId`, `sessionId`, `eventType`, `purpose`, `safeSummary`, `safeSignals` e `source`; `safeSummary`/`safeSignals` usam `encryptJson`/`decryptJson` a partir de `utils/encryption.util.js`, preservando MVC. | `CUMPRE` |
| Tipos de evento fechados | `AI_HISTORY_EVENT_TYPES` limita eventos a `consultation_submitted`, `answer_summary_ready` e `recommendation_context_ready`. | `CUMPRE` |
| Minimização e bloqueio de dados sensiveis | `recordAiInteractionHistoryEvent` valida ObjectIds internos, tipo, origem, finalidade, resumo, limite de sinais e termos sensiveis antes de persistir. | `CUMPRE` |
| DTO publico sem IDs internos | `toPublicHistoryItem` devolve apenas `id`, `eventType`, `purpose`, `safeSummary`, `safeSignals`, `source`, `createdAt` e `updatedAt`; nao devolve `userId` nem `sessionId`. | `CUMPRE` |
| Listagem por ownership no backend | `listMyAiInteractionHistory` filtra sempre por `userId` recebido do controller autenticado e normaliza `limit`; o browser nao escolhe dono. | `CUMPRE` |
| Contrato interno para BK seguinte | `listRecommendationHistoryContext` filtra por `userId` e `sessionId` opcional, devolvendo contexto minimizado sem IDs internos para `BK-MF8-10`. | `CUMPRE` |
| Endpoint autenticado | `real_dev/api/src/routes/ai-interaction-history.routes.js` publica apenas `GET /me/ai-interactions` com `requireAuth`; nao existe endpoint publico de escrita. | `CUMPRE` |
| Integracao com sessao guiada | `submitGuidedConsultation` grava a sessao submetida e chama `recordAiInteractionHistoryEvent` com resumo e sinais derivados/minimizados das respostas. | `CUMPRE` |
| UI integrada e acessivel | `AiHistoryPage` carrega a timeline com `listMyAiInteractionHistory`, tem estados `loading`, `empty`, `error` e `success`, usa `role="status"`/`role="alert"` e mostra apenas `safeSummary`/`safeSignals`. | `CUMPRE` |
| Cliente HTTP seguro | `aiInteractionHistoryApi.js` chama `/me/ai-interactions` via `apiRequest`; `apiClient` preserva `credentials: "include"` e nao guarda tokens em storage local. | `CUMPRE` |
| Scope-out preservado | A implementacao nao cria conversa livre, provider IA novo, recomendacoes enriquecidas, revisao humana, checkout, carrinho, pagamentos, webhooks, RAG, embeddings ou treino externo. | `CUMPRE` |

### Contratos consumidos e entregues

- Consumidos de `BK-MF8-08`: `AiConsultationSession`, `status: "submitted"`, respostas estruturadas e ownership por `req.user.id`.
- Consumidos de `BK-MF6-07`: cifra em repouso via helpers puros `encryptJson`/`decryptJson`, sem dependencia model -> service.
- Consumidos de `MF0`/`MF7`: sessao autenticada por cookie HttpOnly, `requireAuth` e convencoes de erro `AppError`.
- Consumidos de `BK-MF8-07`: o historico nao reabre finalidade de imagem, consentimento de treino externo ou provider facial.
- Entregues a `BK-MF8-10`: `listRecommendationHistoryContext` para contexto minimizado e filtrado por ownership, alem dos eventos `recommendation_context_ready` preparados no modelo.
- Entregues a `BK-MF8-11`/`BK-MF8-13`: timeline segura e DTO publico sem IDs internos, fotografias, consentimentos, prompts, storage keys, cookies ou tokens.

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. A cifra em repouso reutiliza utilitarios puros de encriptacao, sem quebrar a regra de modularidade que impede models dependerem de services.
- `MF7 -> MF8`: preservada. As rotas usam `requireAuth`; a UI usa cookies HttpOnly via `apiRequest`; nao ha tokens em `localStorage`/`sessionStorage`.
- `BK-MF8-08 -> BK-MF8-09`: consumido corretamente. A submissao da sessao guiada cria um evento minimizado, sem expor texto livre bruto de perguntas opcionais.
- `BK-MF8-09 -> BK-MF8-10`: preparado. O service exporta leitura interna de contexto por `userId` autenticado e `sessionId` opcional, sem DTO paralelo nem endpoint publico extra.
- `BK-MF8-11`: preservado fora de escopo. Nao foram criadas filas de consultor, decisoes humanas, notas publicas/internas ou audit trail de revisao humana.
- `MF seguinte`: nao existe `MF9` na matriz canonica atual (`MF0` a `MF8`); nao foi criado scope futuro.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P1` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 2 | Observacoes fechadas: Supertest falhou no sandbox com `listen EPERM` e passou fora do sandbox; a primeira suite completa detectou dependencia indevida model -> service, corrigida para `utils/encryption.util.js` e revalidada com sucesso. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/api/src/models/ai-interaction-history.model.js` | Criado | Modelo cifrado e indexado do historico IA seguro. |
| `real_dev/api/src/services/ai-interaction-history.service.js` | Criado | Validacao, minimizacao, DTO publico, listagem por ownership e contexto interno para `BK-MF8-10`. |
| `real_dev/api/src/controllers/ai-interaction-history.controller.js` | Criado | Controller de listagem do historico do utilizador autenticado. |
| `real_dev/api/src/routes/ai-interaction-history.routes.js` | Criado | Route autenticada `GET /api/me/ai-interactions`. |
| `real_dev/api/src/app.js` | Alterado | Monta `aiInteractionHistoryRoutes` no prefixo `/api`. |
| `real_dev/api/src/services/ai-consultation.service.js` | Alterado | Submissao da consulta guiada passa a criar evento de historico minimizado. |
| `real_dev/api/tests/mf8.ai-interaction-history.test.js` | Criado | Testes de service, contexto interno, endpoint autenticado e negativos de dados sensiveis/auth. |
| `real_dev/api/tests/mf8.ai-consultation.test.js` | Alterado | Regressao que prova criacao de historico quando a sessao guiada completa e submetida. |
| `real_dev/web/src/services/aiInteractionHistoryApi.js` | Criado | Cliente HTTP para `/me/ai-interactions`. |
| `real_dev/web/src/pages/AiHistoryPage.jsx` | Criado | Timeline segura do cliente com estados loading/error/empty/success. |
| `real_dev/web/src/App.jsx` | Alterado | Integra a pagina `AiHistoryPage` apos a consulta guiada. |
| `real_dev/web/scripts/check-mf8-ai-history-page.mjs` | Criado | Smoke estatico da integracao UI/API e ausencia de storage/IDs internos na pagina. |
| `real_dev/web/package.json` | Alterado | Publica o script `smoke:mf8-ai-history`. |
| `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | Alterado | Relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`. |

### Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `git status --short` | Antes da execucao existiam apenas os relatorios tecnicos MF8 untracked; `real_dev/` continua ignorado como esperado. |
| `git check-ignore -v real_dev real_dev/api real_dev/web` | Passou; `.gitignore:2:real_dev/` confirma que a implementacao real esta ignorada neste checkout. |
| `rg -n "RF47\|RNF30\|BK-MF8-09\|BK-MF8-10" ...docs...` | Passou; docs canonicos confirmam `RF47`, `RNF30`, dependencia `BK-MF8-08`/`BK-MF6-07`, prioridade P0 e handoff para `BK-MF8-10`. |
| `npm --prefix real_dev/api test -- tests/mf8.ai-interaction-history.test.js tests/mf8.ai-consultation.test.js` | Primeiro falhou no sandbox por `listen EPERM`/porta nula; repetido fora do sandbox com sucesso: 2 ficheiros, 14 testes. |
| `npm --prefix real_dev/api test` | Primeiro revelou violacao de modularidade em `models/ai-interaction-history.model.js` por import de `../services/`; apos correcao para `../utils/encryption.util.js`, passou fora do sandbox: 35 ficheiros, 249 testes. |
| `npm --prefix real_dev/web run build` | Passou; Vite build com 82 modulos transformados. |
| `npm --prefix real_dev/web run smoke:mf8-ai-history` | Passou; `BK-MF8-09 frontend smoke OK`. |
| `npm --prefix real_dev/web run smoke:mf8-consultation` | Passou; regressao do BK anterior continua verde. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs/guias consistentes. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/web/src` e `real_dev/web/scripts` | Sem finding novo. Hits residuais justificados: stubs/testes Stripe/PayPal/MBWay, checks anti-`localStorage`/`sessionStorage`, fake secrets de teste, providers/pagamentos existentes, comentarios de seguranca e teste negativo `skin_secret`. |
| `git diff --check` | Passou sem output. |
| `rg -n "[ \t]+$" ...ficheiros tocados...` | Passou sem matches; sem whitespace final nos ficheiros alterados/criados. |

### Validacoes nao executadas

- QA manual em browser real autenticado: nao executada; o scope foi coberto por teste HTTP focal, suite API completa, build Vite, smoke estatico da pagina e regressao da consulta guiada.
- Smoke com MongoDB real persistente: nao executado; os testes focais usam mocks de models para provar service/controller sem depender de dados reais.
- Mockup visual: nao consultado porque o checkout atual nao tem pasta `mockup/`.
- Recomendacoes enriquecidas, revisao humana e insights de consultor: nao executados por pertencerem a `BK-MF8-10`, `BK-MF8-11` e `BK-MF8-12`.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.
- Alteracao de guias BK, matriz, backlog ou documentos canonicos: nao executada, conforme `PERMITIR_ALTERAR_DOCS=nao`.

### Blockers/TODOs

- Sem blockers tecnicos para `BK-MF8-09`.
- `TODO operacional`: em QA final da MF8, autenticar um cliente com analise/relatorio e sessao guiada submetida, abrir a app e confirmar visualmente que a timeline mostra apenas resumo/sinais seguros.

### Decisao

`BK-MF8-09` fica `IMPLEMENTADO` em `real_dev`. A API guarda historico IA minimizado e cifrado, lista apenas o historico do cliente autenticado, nao permite escrita pelo browser, nao expõe IDs internos nem dados biometricos/tecnicos, integra-se com a submissao do `BK-MF8-08`, entrega contrato interno para `BK-MF8-10` e preserva os contratos de privacidade, ownership, modularidade e sessao HttpOnly.

Proxima acao recomendada: avancar para `BK-MF8-10 - Recomendacoes enriquecidas com respostas da avaliacao guiada`, consumindo `listRecommendationHistoryContext` sem criar ownership, DTO ou endpoint paralelo.

## Execucao atual - BK-MF8-08

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF8`
- `BK_IDS`: `BK-MF8-08`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-05

Esta execucao implementou o `BK-MF8-08 - Sessao guiada de avaliacao cosmetica com IA` contra `RF42`, usando `real_dev/api` e `real_dev/web` como raizes reais. O guia publico usa exemplos `apps/api` e `apps/web`, mas a prompt desta execucao definiu `IMPLEMENTATION_ROOT=real_dev`; por isso os contratos foram mapeados para `real_dev` sem alterar `apps/`, BKs, matriz, backlog, prompts ou documentos canonicos.

O trabalho cria a fronteira cumulativa para consulta IA guiada: a API passa a ter um modulo `ai-consultation` com modelo, script versionado de perguntas, validacao de respostas, service com ownership por `req.user.id`, endpoints autenticados para iniciar/ler/guardar/submeter e DTO publico sem `userId`, `analysisId` ou `reportId`. O frontend ganhou uma pagina de wizard integrada no shell existente, usando `apiRequest` com cookies HttpOnly e sem `localStorage`/`sessionStorage`.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-08` | `RF42` | `IMPLEMENTADO` | `AiConsultationSession`, `GUIDED_CONSULTATION_SCRIPT`, endpoints `/api/ai-consultation/sessions`, pagina `GuidedConsultationPage`, teste `mf8.ai-consultation.test.js` e smoke `smoke:mf8-consultation` validados. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Script versionado de perguntas | `real_dev/api/src/validators/ai-consultation.validator.js` define `GUIDED_CONSULTATION_SCRIPT` com perguntas controladas e validacao por tipo. | `CUMPRE` |
| Persistencia com ownership interno | `real_dev/api/src/models/ai-consultation-session.model.js` guarda `userId`, `analysisId`, `reportId`, `scriptVersion`, `answers`, `status` e `submittedAt`. | `CUMPRE` |
| Dependencias MF1/MF7 confirmadas antes de criar sessao | `startGuidedConsultation` exige `FaceAnalysis` concluida e `FaceReport` ativo do mesmo `userId`. | `CUMPRE` |
| Backend decide ownership | Service e controllers recebem sempre `req.user.id`; o frontend nao envia `userId`, `analysisId` nem `reportId`. | `CUMPRE` |
| Sessao editavel apenas em rascunho | `findOwnedDraftSession` filtra por `_id`, `userId` e `status: "draft"`. | `CUMPRE` |
| Submissao bloqueada sem obrigatorias | `submitGuidedConsultation` calcula `missingQuestionIds` a partir das perguntas obrigatorias e devolve `400` controlado. | `CUMPRE` |
| Endpoints autenticados | `real_dev/api/src/routes/ai-consultation.routes.js` aplica `requireAuth` a `POST`, `GET`, `PATCH` e `submit`. | `CUMPRE` |
| DTO publico minimizado | `toPublicAiConsultationSession` devolve `id`, `scriptVersion`, `status`, `questions`, `answers`, `submittedAt` e `updatedAt`, sem IDs internos de utilizador/analise/relatorio. | `CUMPRE` |
| UI integrada | `GuidedConsultationPage` inicia, retoma, guarda, avanca e submete a sessao com endpoints reais via `apiRequest`. | `CUMPRE` |
| Sem chat livre, historico ou recomendacoes enriquecidas | A implementacao nao cria provider IA novo, conversa livre, historico seguro, revisao humana, recomendacoes enriquecidas, carrinho ou compra automatica. | `CUMPRE` |

### Contratos consumidos e entregues

- Consumidos de `BK-MF1-06`: `FaceAnalysis` concluida, scoped por `userId` e `status: "completed"`.
- Consumidos de `BK-MF1-07`: `FaceReport` ativo, scoped por `userId` e `privacyStatus: "active"`.
- Consumidos de `BK-MF7-01`: sessao autenticada por cookie HttpOnly e ownership decidido no backend.
- Consumidos de `BK-MF8-07`: a consulta guiada nao reabre finalidade de imagem, treino externo ou provider de analise facial.
- Entregues a `BK-MF8-09`: `AiConsultationSession` com `status`, `answers`, `scriptVersion`, `submittedAt` e regra de que apenas sessoes `submitted` devem alimentar historico seguro.
- Entregues a `BK-MF8-10`/`BK-MF8-13`: respostas estruturadas e minimizadas, sem chat livre nem prompt interno, prontas para enriquecimento posterior dentro de scope proprio.

### Coerencia entre MFs e BKs vizinhos

- `MF1 -> MF8`: preservada. A sessao guiada depende de analise e relatorio existentes em vez de criar novo upload, nova analise ou provider paralelo.
- `MF7 -> MF8`: preservada. Auth por cookie HttpOnly, consentimento facial e ownership no backend continuam a ser a fronteira operacional.
- `BK-MF8-07 -> BK-MF8-08`: preservado. O novo modulo usa contexto facial existente sem alterar politica de finalidade, retencao ou treino externo.
- `BK-MF8-08 -> BK-MF8-09`: preparado. O proximo BK pode consumir sessoes submetidas e criar historico seguro sem alterar o script de perguntas deste BK.
- `MF seguinte`: nao existe `MF9` na matriz canonica atual (`MF0` a `MF8`); nao foi criado scope futuro.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P1` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Observacao ambiental: a suite focal com Supertest falhou no sandbox com `listen EPERM`/porta nula; repetida fora do sandbox com sucesso. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/api/src/models/ai-consultation-session.model.js` | Criado | Modelo da sessao guiada com dono, analise, relatorio, script, respostas e estado. |
| `real_dev/api/src/validators/ai-consultation.validator.js` | Criado | Script versionado e validadores de pergunta, opcao, texto, escala e `sessionId`. |
| `real_dev/api/src/services/ai-consultation.service.js` | Criado | Regras de negocio, ownership, dependencias de analise/relatorio, DTO publico e submissao. |
| `real_dev/api/src/controllers/ai-consultation.controller.js` | Criado | Controllers HTTP para iniciar, ler, guardar resposta e submeter sessao. |
| `real_dev/api/src/routes/ai-consultation.routes.js` | Criado | Rotas autenticadas `RF42` sob `/api/ai-consultation/sessions`. |
| `real_dev/api/src/app.js` | Alterado | Monta `aiConsultationRoutes` junto dos modulos de analise/relatorio. |
| `real_dev/api/tests/mf8.ai-consultation.test.js` | Criado | Testes unitarios/HTTP/negativos para validator, autenticacao, ownership e completude. |
| `real_dev/web/src/pages/GuidedConsultationPage.jsx` | Criado | Wizard cliente para iniciar, retomar, guardar respostas e concluir consulta guiada. |
| `real_dev/web/src/App.jsx` | Alterado | Integra a pagina no grupo de cliente apos o relatorio facial. |
| `real_dev/web/scripts/check-mf8-guided-consultation-page.mjs` | Criado | Smoke estatico da integracao UI/API e ausencia de storage/IDs internos na pagina. |
| `real_dev/web/package.json` | Alterado | Publica o script `smoke:mf8-consultation`. |
| `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | Alterado | Relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`. |

### Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `git status --short` | Antes da execucao existiam apenas os relatorios tecnicos MF8 untracked; `real_dev/` continua ignorado como esperado. |
| `git check-ignore -v ...ficheiros real_dev tocados...` | Passou; `.gitignore:2:real_dev/` confirma que a implementacao real esta ignorada neste checkout. |
| `rg -n "RF42\|BK-MF8-08\|BK-MF8-09" docs/RF.md docs/planificacao/backlogs docs/planificacao/sprints` | Passou; docs canonicos confirmam `RF42`, dependencias `BK-MF1-06`/`BK-MF1-07`/`BK-MF7-01`, prioridade P0 e handoff para `BK-MF8-09`. |
| `node --check` nos ficheiros API criados/tocados e no teste focal | Passou sem output para modelo, validator, service, controller, routes e teste `mf8.ai-consultation`. |
| `npm --prefix real_dev/api test -- tests/mf8.ai-consultation.test.js` | Primeiro falhou no sandbox por `listen EPERM`/porta nula; repetido fora do sandbox com sucesso: 1 ficheiro, 7 testes. |
| `npm --prefix real_dev/api test` | Passou fora do sandbox: 34 ficheiros e 242 testes. |
| `node --check real_dev/web/scripts/check-mf8-guided-consultation-page.mjs` | Passou sem output. |
| `npm --prefix real_dev/web run smoke:mf8-consultation` | Passou; `BK-MF8-08 guided consultation page check passed`. |
| `npm --prefix real_dev/web run build` | Passou; Vite gerou build com 80 modulos transformados. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs/guias consistentes. |
| `find . -maxdepth 2 -type d -name mockup -print` | Passou sem output; sem pasta `mockup/` neste checkout. |
| `rg -n "real[_]dev\|REAL[_]DEV" docs/planificacao/guias-bk/MF8/BK-MF*.md` | Passou sem matches; os guias publicos MF8 nao ganharam leakage de `real_dev`. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests` e `real_dev/web/src` | Sem finding novo. Hits residuais justificados: stubs Stripe/PayPal/MBWay existentes, segredos fake de teste, provider externo MF7/MF8 anterior, comentarios de seguranca, verificacoes anti-storage e negativo `skin_secret` do novo teste. |
| `git diff --check` | Passou sem output. |
| `rg -n "[ \t]+$" ...ficheiros tocados...` | Passou sem matches; sem whitespace final nos ficheiros alterados/criados e no relatorio MF8. |

### Validacoes nao executadas

- QA manual em browser real autenticado: nao executada; o scope foi coberto por teste HTTP focal, suite API completa, build Vite e smoke estatico da pagina.
- Smoke com MongoDB real persistente: nao executado; os testes focais usam mocks de models para provar contratos de service/controller sem depender de dados reais.
- Mockup visual: nao consultado porque o checkout atual nao tem pasta `mockup/`.
- Historico seguro, revisao humana e recomendacoes enriquecidas: nao executados por pertencerem a `BK-MF8-09`, `BK-MF8-10` e `BK-MF8-11`.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.
- Alteracao de guias BK, matriz, backlog ou documentos canonicos: nao executada, conforme `PERMITIR_ALTERAR_DOCS=nao`.

### Blockers/TODOs

- Sem blockers tecnicos para `BK-MF8-08`.
- `TODO operacional`: no QA final da MF8, testar no browser com utilizador autenticado que ja tenha analise concluida e relatorio ativo, confirmando o fluxo completo visualmente.

### Decisao

`BK-MF8-08` fica `IMPLEMENTADO` em `real_dev`. A API entrega sessao guiada autenticada e minimizada, valida respostas no backend, bloqueia ownership indevido e submissao incompleta, preserva contratos de MF1/MF7/MF8-07 e prepara `BK-MF8-09` sem implementar historico, revisao humana ou recomendacoes enriquecidas fora de scope.

Proxima acao recomendada: avancar para `BK-MF8-09 - Historico seguro da interacao cliente-IA`, consumindo apenas sessoes `submitted` e mantendo o DTO publico sem IDs internos.

## Execucao atual - BK-MF8-07

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF8`
- `BK_IDS`: `BK-MF8-07`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-05

Esta execucao implementou o `BK-MF8-07 - As imagens processadas nao devem ser usadas para treinar modelos externos sem consentimento` contra `RNF25`, usando `real_dev/api` como raiz real. O guia publico usa exemplos `apps/api`, mas a prompt desta execucao definiu `IMPLEMENTATION_ROOT=real_dev`; por isso os contratos foram mapeados para `real_dev/api` sem alterar `apps/`, BKs, matriz, backlog ou documentos canonicos.

O trabalho fechou a fronteira de finalidade e minimizacao para imagens faciais: o backend centraliza a finalidade canonica `analise_facial_cosmetica`, declara uma politica reutilizavel de retencao imediata sem aprendizagem por terceiros, passa essa politica do service para o dispatcher/provider, bloqueia finalidades indevidas antes de qualquer `fetch` externo e devolve ao frontend um DTO publico com `imageUse` sem `storageKey`, `consentId`, paths internos, cookies, tokens ou chave de provider.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-07` | `RNF25` | `IMPLEMENTADO` | `FACE_IMAGE_PURPOSE_POLICY`, `assertExternalImagePurposePolicy`, `buildExternalAnalysisPayload`, DTO `imageUse` e teste `mf8.image-purpose-limit.test.js` validado. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Finalidade canonica centralizada | `real_dev/api/src/constants/face-consent.js` exporta `FACE_ANALYSIS_CONSENT_PURPOSE`, `THIRD_PARTY_MODEL_LEARNING_PURPOSE`, `FACE_IMAGE_PROVIDER_RETENTION` e `FACE_IMAGE_PURPOSE_POLICY`. | `CUMPRE` |
| Analise facial exige consentimento da finalidade correta | `real_dev/api/src/services/face-analysis.service.js` continua a consultar `FaceConsent.findOne({ userId, purpose: FACE_ANALYSIS_CONSENT_PURPOSE, revokedAt: null })` antes de ler fotografias cifradas. | `CUMPRE` |
| Politica definida no backend | `createFaceAnalysisForUser` chama `analyzeSkinPhotos` com `requestedPurpose: FACE_ANALYSIS_CONSENT_PURPOSE` e `allowModelLearning: false`; esses valores nao vêm do frontend. | `CUMPRE` |
| DTO publico minimizado | `toFaceAnalysisResponse` devolve `imageUse: { purpose, retention, modelLearningAllowed: false }` e nao devolve `storageKey`, `consentId`, `encryption`, paths internos, tokens ou cookies. | `CUMPRE` |
| Dispatcher local/externo valida finalidade | `real_dev/api/src/providers/skin-analysis.provider.js` valida `requestedPurpose` e bloqueia `allowModelLearning: true` antes de escolher provider local ou externo. | `CUMPRE` |
| Provider externo bloqueia treino antes de `fetch` | `assertExternalImagePurposePolicy` recusa finalidade diferente e aprendizagem por terceiros antes de construir o request remoto. | `CUMPRE` |
| Payload externo minimizado | `buildExternalAnalysisPayload` envia apenas `photos[].kind`, `mimeType`, `sizeBytes`, `contentBase64`, `purpose`, `retention` e `modelLearningAllowed: false`. | `CUMPRE` |
| Provider key fora do body | `analyzeSkinPhotosExternally` mantem `Authorization: Bearer ...` no header e os testes provam que a chave nao entra no JSON externo. | `CUMPRE` |
| HTTPS/fallback MF7 preservados | O adapter externo continua a exigir HTTPS fora de localhost/dev e o dispatcher mantem fallback local honesto para erros remotos 5xx/indisponibilidade. | `CUMPRE` |

### Contratos consumidos e entregues

- Consumidos de `BK-MF6-07`: fotografias continuam a ser lidas por `readEncryptedFacePhotoFile` a partir de storage cifrado e preparadas apenas em memoria temporaria.
- Consumidos de `BK-MF7-01`: `FaceConsent`, finalidade `analise_facial_cosmetica`, ownership por `req.user.id` e bloqueio de upload/analise sem consentimento ativo.
- Consumidos de `BK-MF7-07`: `AI_PROVIDER_MODE`, `AI_PROVIDER_URL`, `AI_PROVIDER_KEY`, adapter externo isolado, HTTPS obrigatorio fora de localhost/dev, timeout e fallback local.
- Consumidos de `BK-MF8-06`: a fronteira etica de recomendacoes permanece intacta; este BK nao altera ranking, fairness, recomendacoes ou checkout.
- Entregues a `BK-MF8-08`: a futura sessao guiada pode usar analise facial com `imageUse` explicito sem criar nova regra de finalidade de imagem.
- Entregues a `BK-MF8-09` e seguintes: historico/revisao/recomendacoes futuras recebem um contrato publico que declara finalidade, retencao e `modelLearningAllowed: false`, sem metadados privados.

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. Encriptacao, storage privado, minimizacao de fotografia, performance budget e tratamento de erro continuam ativos.
- `MF7 -> MF8`: preservada. Consentimento facial, sessao HttpOnly, provider externo, HTTPS e fallback local foram reutilizados em vez de duplicados.
- `BK-MF8-06 -> BK-MF8-07`: preservado. A implementacao nao toca nos guards de fairness, motivos de recomendacao, carrinho, checkout ou compra automatica.
- `BK-MF8-07 -> BK-MF8-08`: preparado. A sessao guiada fica livre para recolher respostas estruturadas sem reabrir provider de imagem ou consentimento de treino.
- `MF seguinte`: nao existe `MF9` na matriz canonica atual (`MF0` a `MF8`); nao foi criado scope futuro.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P1` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Observacao ambiental: suites Supertest falharam no sandbox com `listen EPERM`/porta nula; repetidas fora do sandbox com sucesso. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/api/src/constants/face-consent.js` | Alterado | Centraliza politica `RNF25`: finalidade, retencao e bloqueio de aprendizagem por terceiros. |
| `real_dev/api/src/services/face-analysis.service.js` | Alterado | Passa a politica ao provider e devolve `imageUse` publico minimizado. |
| `real_dev/api/src/providers/skin-analysis.provider.js` | Alterado | Valida finalidade e bloqueia `allowModelLearning` antes de provider local/externo. |
| `real_dev/api/src/providers/external-skin-analysis.provider.js` | Alterado | Exporta policy guard/payload builder e envia `modelLearningAllowed: false` no payload externo. |
| `real_dev/api/tests/mf8.image-purpose-limit.test.js` | Criado | Teste focal `RNF25` com payload minimizado, finalidade invalida, treino externo bloqueado e ausencia de metadados privados no body. |
| `real_dev/api/tests/mf7.external-ai-provider.test.js` | Alterado | Alinha regressao MF7 com a politica explicita de finalidade exigida por MF8. |
| `real_dev/api/tests/mf6.face-analysis-performance.test.js` | Alterado | Atualiza expectativa de chamada ao provider para proteger `requestedPurpose` e `allowModelLearning: false`. |
| `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | Alterado | Relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`. |

### Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | Antes e depois da execucao existem apenas os relatorios tecnicos MF8 untracked; `real_dev/` continua ignorado como esperado. |
| `date +%F` | `2026-07-05`, data local usada nesta seccao do relatorio. |
| `rg -n "RNF25\|BK-MF8-07\|BK-MF7-01\|BK-MF7-07" ...docs...` | Passou; docs canonicos confirmam `RNF25`, dependencias `BK-MF7-01`/`BK-MF7-07`, prioridade P0 e handoff para `BK-MF8-08`. |
| `node --check` nos ficheiros alterados/criados | Passou sem output para constantes, service, providers e testes alterados/criados. |
| `npm --prefix real_dev/api test -- tests/mf8.image-purpose-limit.test.js` | Passou no sandbox: 1 ficheiro, 5 testes. |
| `npm --prefix real_dev/api test -- tests/mf7.external-ai-provider.test.js` | Passou no sandbox: 1 ficheiro, 8 testes. |
| `npm --prefix real_dev/api test -- tests/mf7.consent.test.js` | Primeiro falhou no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso junto de `mf1.face`: 2 ficheiros, 19 testes. |
| `npm --prefix real_dev/api test -- tests/mf1.face.test.js` | Primeiro falhou no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso junto de `mf7.consent`: 2 ficheiros, 19 testes. |
| `npm --prefix real_dev/api test -- tests/mf6.face-analysis-performance.test.js` | Passou fora do sandbox: 1 ficheiro, 6 testes. |
| `npm --prefix real_dev/api test` | Primeiro revelou uma expectativa antiga de teste MF6; apos ajuste, passou fora do sandbox: 33 ficheiros e 235 testes. |
| `npm --prefix real_dev/web run build` | Passou; Vite gerou build com 79 modulos transformados. |
| `npm --prefix real_dev/web run smoke:mf6-images` | Passou; `BK-MF6-04 image checks passed`. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs/guias consistentes. |
| `rg -n "FACE_ANALYSIS_CONSENT_PURPOSE\|FACE_IMAGE_PURPOSE_POLICY\|...modelLearningAllowed..." ...` | Passou; confirmou policy em constantes, service, providers, testes e ausencia de contrato paralelo em `BK-MF8-08`. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests` e `real_dev/web/src` | Sem finding novo. Hits residuais justificados: stubs Stripe/PayPal/MBWay, segredos fake de teste, verificacoes anti-`storageKey`/`consentId`, storage privado interno, provider externo MF7 e testes negativos `RNF25`. |
| `rg -n "real[_]dev\|REAL[_]DEV" docs/planificacao/guias-bk/MF8/BK-MF*.md` | Passou sem matches; os guias publicos MF8 nao ganharam leakage de `real_dev`. |
| `find . -maxdepth 2 -type d -name mockup -print` | Passou sem output; sem pasta `mockup/` neste checkout. |
| `git check-ignore -v ...ficheiros real_dev tocados...` | Passou; `.gitignore:2:real_dev/` confirma que a implementacao real esta ignorada neste checkout. |
| `git diff --check` | Passou sem output. |
| `rg -n "[ \t]+$" ...ficheiros tocados...` | Passou sem matches; sem whitespace final nos ficheiros alterados/criados e no relatorio MF8. |

### Validacoes nao executadas

- QA manual em browser real: nao executada; este BK nao altera UI e foi coberto por service/provider/API tests, suite completa, build e smoke de imagens.
- Smoke real contra provider externo de terceiros: nao executado por nao haver credenciais/provider real configurado; o adapter foi validado com `fetch` mockado, HTTPS guard, timeout e payload minimizado.
- Mockup visual: nao consultado porque este BK nao altera UI e o checkout atual nao tem pasta `mockup/`.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.
- Alteracao de guias BK, matriz, backlog ou documentos canonicos: nao executada, conforme `PERMITIR_ALTERAR_DOCS=nao`.

### Blockers/TODOs

- Sem blockers tecnicos para `BK-MF8-07`.
- `TODO operacional`: quando existir provider externo real e credenciais de teste, executar smoke controlado com `AI_PROVIDER_MODE=external`, `AI_PROVIDER_URL=https://...` e `AI_PROVIDER_KEY` fora do repositorio, confirmando que o provider aceita `modelLearningAllowed: false` e a retencao declarada.

### Decisao

`BK-MF8-07` fica `IMPLEMENTADO` em `real_dev`. A API declara finalidade e retencao de imagem, bloqueia aprendizagem por terceiros antes de qualquer chamada externa, minimiza o payload remoto, preserva consentimento/ownership/HTTPS/fallback local e entrega `imageUse` publico para os BKs seguintes sem expor metadados sensiveis.

Proxima acao recomendada: avancar para `BK-MF8-08 - Sessao guiada de avaliacao cosmetica com IA`, reutilizando a fronteira de finalidade de imagem criada neste BK e sem criar provider ou consentimento paralelo.

## Execucao atual - BK-MF8-06

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF8`
- `BK_IDS`: `BK-MF8-06`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-04

Esta execucao implementou o `BK-MF8-06 - O sistema deve garantir nao discriminacao por genero, idade ou tom de pele` contra `RNF24`, usando `real_dev/api` como raiz real da API. O guia publico usa exemplos `apps/api` e `apps/web`, mas a prompt desta execucao definiu `IMPLEMENTATION_ROOT=real_dev`; por isso os contratos foram mapeados para `real_dev` sem alterar `apps/`, BKs, matriz, backlog ou documentos canonicos.

O trabalho fechou a fronteira etica das recomendacoes explicaveis: o backend passou a ter um guard dedicado para bloquear motivos tecnicos baseados em atributos sensiveis, fontes de ranking como genero/idade/tom de pele e texto publico discriminatorio. O guard e executado antes de persistir recomendacoes e tambem antes de devolver DTOs publicos, para impedir que recomendacoes antigas ou criadas fora do fluxo atual sejam apresentadas ao cliente se violarem `RNF24`.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-06` | `RNF24` | `IMPLEMENTADO` | `assertRecommendationFairness`, DTO com `fairnessStatus`, negativos de fonte/motivo/texto e validacao HTTP das recomendacoes. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Guard dedicado de fairness | `real_dev/api/src/services/ai-fairness-guard.service.js` exporta `assertRecommendationFairness` e `assertRespectfulPublicText`. | `CUMPRE` |
| Motivos sensiveis bloqueados | O guard recusa `gender_match`, `genero_match`, `age_match`, `idade_match`, `skin_tone_match` e `tom_pele_match`. | `CUMPRE` |
| Fontes sensiveis bloqueadas | O guard recusa prefixos como `genero`, `idade`, `gender`, `age`, `skinTone`, `tomPele` e variantes equivalentes. | `CUMPRE` |
| Texto publico respeitoso | `assertRespectfulPublicText` normaliza acentos/capitalizacao e bloqueia frases discriminatorias por genero, idade ou tom de pele. | `CUMPRE` |
| Integracao antes de persistir | `generateRecommendationsForUser` chama o guard depois de `buildRecommendationReason` e antes de `ProductRecommendation.findOneAndUpdate`. | `CUMPRE` |
| Integracao antes de devolver DTO | `toRecommendationDto` revalida `reasonCodes`, `sourceSignals`, `explanation` e `limitations` antes de devolver recomendacoes. | `CUMPRE` |
| DTO publico minimo | O DTO inclui `fairnessStatus: "checked"` e `protectedAttributesChecked`, sem devolver valores reais de genero, idade ou tom de pele. | `CUMPRE` |
| Separacao de comercio | A alteracao nao toca carrinho, checkout, pagamentos, stock ou adicao automatica de produtos. | `CUMPRE` |

### Contratos consumidos e entregues

- Consumidos de `BK-MF8-05`: `reasonCodes`, `sourceSignals`, `sourceLabels`, `explanation` e `limitations` continuam a ser a base controlada para recomendacoes explicaveis.
- Consumidos de `MF2`: endpoints existentes `POST /api/recommendations/generate`, `GET /api/recommendations` e `POST /api/recommendations/:recommendationId/feedback`, sem criar endpoint paralelo.
- Consumidos de `MF4`: `filterProductsBlockedByProfile` continua a impedir produtos incompatíveis com alergias, ingredientes a evitar e restricoes medicas leves antes do ranking.
- Consumidos de `MF7`: sessao autenticada por cookie HttpOnly e provider IA isolado continuam intactos; este BK nao altera upload, consentimento, provider externo nem imagens.
- Entregues a `BK-MF8-07`: fronteira etica para recomendacoes sem misturar atributos sensiveis com uso de imagens/providers externos.
- Entregues a `BK-MF8-10`: DTO e guard reutilizaveis para recomendacoes enriquecidas, mantendo fontes sensiveis fora do ranking e da justificacao publica.

### Coerencia entre MFs e BKs vizinhos

- `MF7 -> MF8`: preservada. Consentimento, sessao HttpOnly, ownership, provider externo, pagamentos e exports admin nao foram alterados.
- `MF8-05 -> MF8-06`: consumido. O guard usa os campos de explicabilidade entregues pelo BK anterior em vez de duplicar o motor de recomendacao.
- `MF8-06 -> MF8-07`: preparado. O proximo BK pode tratar privacidade de imagens e treino externo sem reabrir fairness de recomendacoes.
- `MF8-06 -> MF8-10`: preparado. Qualquer enriquecimento futuro deve continuar a passar pelo guard antes de persistir/devolver recomendacoes.
- `MF seguinte`: nao existe `MF9` na matriz canonica atual (`MF0` a `MF8`); nao foi criado scope futuro.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P1` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Observacao ambiental: suites HTTP falharam no sandbox com `listen EPERM`/`Cannot read properties of null (reading 'port')`; repetidas fora do sandbox com sucesso. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/api/src/services/ai-fairness-guard.service.js` | Criado | Implementa guard de `RNF24` para motivos, fontes e texto publico. |
| `real_dev/api/src/services/recommendation.service.js` | Alterado | Chama o guard antes de persistir e antes de devolver DTOs; adiciona `fairnessStatus` e `protectedAttributesChecked`. |
| `real_dev/api/tests/mf8.fairness-guard.test.js` | Criado | Teste focal com positivo e negativos materiais de fonte sensivel, motivo sensivel e texto discriminatorio. |
| `real_dev/api/tests/mf2.integration.test.js` | Alterado | Acrescenta prova HTTP de `fairnessStatus` e atributos protegidos no DTO publico. |
| `real_dev/api/tests/mf4.integration.test.js` | Alterado | Alinha mock de recomendacao com `sourceSignals` persistidos e valida `fairnessStatus` no fluxo com restricoes. |
| `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | Alterado | Relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`. |

### Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `git status --short` | Antes da execucao existiam relatorios MF8 untracked; `real_dev/` continua ignorado como esperado. |
| `rg -n "RNF24|BK-MF8-06|RF18|RF19|RF40|RF43" ...docs...` | Passou; docs canonicos confirmam `RNF24`, dependencias e handoff `BK-MF8-05 -> BK-MF8-06 -> BK-MF8-07`. |
| `node --check real_dev/api/src/services/ai-fairness-guard.service.js` | Passou sem output. |
| `node --check real_dev/api/src/services/recommendation.service.js` | Passou sem output. |
| `node --check real_dev/api/tests/mf8.fairness-guard.test.js` | Passou sem output. |
| `node --check real_dev/api/tests/mf2.integration.test.js` | Passou sem output. |
| `node --check real_dev/api/tests/mf4.integration.test.js` | Passou sem output. |
| `npm --prefix real_dev/api test -- tests/mf8.fairness-guard.test.js` | Passou no sandbox: 1 ficheiro, 4 testes. |
| `npm --prefix real_dev/api test -- tests/mf2.integration.test.js` | Primeiro falhou no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 1 ficheiro, 12 testes. |
| `npm --prefix real_dev/api test -- tests/mf4.integration.test.js` | Primeiro falhou no sandbox por `listen EPERM`; repetido fora do sandbox mostrou uma falha real no mock sem `sourceSignals`; corrigido o mock, repetido fora do sandbox com sucesso: 1 ficheiro, 13 testes. |
| `npm --prefix real_dev/api test` | Passou fora do sandbox: 32 ficheiros e 230 testes. |
| `npm --prefix real_dev/web run build` | Passou; Vite gerou build com 79 modulos transformados. |
| `npm --prefix real_dev/web run smoke:mf2` | Passou; contratos de montagem, API e UI de recomendacoes presentes. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs/guias consistentes. |
| `rg -n "real[_]dev|REAL[_]DEV" docs/planificacao/guias-bk/MF8/BK-MF*.md` | Passou sem matches; os guias publicos MF8 nao ganharam leakage de `real_dev`. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/api/scripts`, `real_dev/web/src` e `real_dev/web/scripts` | Sem finding novo. Hits residuais justificados: stubs Stripe/PayPal/MBWay, segredos fake de teste, verificacoes anti-`localStorage`/`sessionStorage`, storage privado, provider externo MF7, disclaimers de treino externo e os proprios negativos do guard. |
| `git check-ignore -v ...ficheiros real_dev tocados...` | Passou; `.gitignore:2:real_dev/` confirma que a implementacao real esta ignorada neste checkout. |
| `git diff --check` | Passou sem output. |
| `rg -n "[ \t]+$" ...ficheiros tocados...` | Passou sem matches; sem whitespace final nos ficheiros alterados/criados e no relatorio MF8. |

### Validacoes nao executadas

- QA manual em browser real: nao executada; build, smoke estatico e suites HTTP/API validaram os contratos tecnicos.
- Teste E2E browser autenticado com catalogo e analise seedados: nao existe script especifico para este BK.
- Mockup visual: nao consultado porque este BK nao altera UI e o checkout atual nao tem pasta `mockup/`.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.
- Alteracao de guias BK, matriz, backlog ou documentos canonicos: nao executada, conforme `PERMITIR_ALTERAR_DOCS=nao`.

### Blockers/TODOs

- Sem blockers tecnicos para `BK-MF8-06`.
- `TODO operacional`: em QA final de MF8, validar no browser com utilizador autenticado, analise/relatorio/perfil/catalogo seedados e confirmar visualmente que as recomendacoes continuam claras.

### Decisao

`BK-MF8-06` fica `IMPLEMENTADO` em `real_dev`. A API tem guard dedicado de fairness, bloqueia fonte/motivo/texto discriminatorio, valida antes de persistir e antes de devolver recomendacoes, mantem recomendacao separada de compra/checkout e tem evidence focal, regressiva e de suite completa.

Proxima acao recomendada: avancar para `BK-MF8-07 - As imagens processadas nao devem ser usadas para treinar modelos externos sem consentimento`, preservando a fronteira criada neste BK para recomendacoes.

## Execucao atual - BK-MF8-05

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF8`
- `BK_IDS`: `BK-MF8-05`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-04

Esta execucao implementou o `BK-MF8-05 - A IA deve indicar como chegou as recomendacoes (explicabilidade)` contra `RNF23`, usando `real_dev/api` e `real_dev/web` como raizes reais. O guia publico usa exemplos `apps/api` e `apps/web`, mas a prompt desta execucao definiu `IMPLEMENTATION_ROOT=real_dev`; por isso os contratos foram mapeados para `real_dev` sem alterar `apps/`, BKs, matriz, backlog ou documentos canonicos.

O trabalho fechou a fronteira de explicabilidade das recomendacoes: o backend normaliza `reasonCodes`, converte `sourceSignals` em `sourceLabels` publicos, bloqueia recomendacoes sem motivo/fonte publica, adiciona limitacoes cosmeticas e garante que o DTO publico mostra explicacao e fontes sem devolver sinais internos, fotografias, prompts, consentimentos, cookies, tokens ou paths privados. A UI passou a apresentar explicacao, fontes e limitacoes recebidas da API, sem inventar texto no frontend.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-05` | `RNF23` | `IMPLEMENTADO` | `buildRecommendationReason`, `buildPublicSourceLabels`, DTO com `sourceLabels`, UI com fontes/limitacoes e teste `mf8.recommendation-explainability.test.js` validado. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Motivos tecnicos controlados | `real_dev/api/src/services/recommendation-reason.service.js` aceita apenas `reasonCodes` conhecidos como `skin_type_match`, `oiliness_support`, `acne_support`, `spots_support` e `wrinkles_support`. | `CUMPRE` |
| Fontes publicas seguras | `buildPublicSourceLabels` converte apenas prefixos permitidos (`skinType`, `oleosidade`, `acne`, `manchas`, `rugas`, `report`, `restriction`) e ignora sinais desconhecidos como prompt/storage. | `CUMPRE` |
| Bloqueio de recomendacao opaca | `buildRecommendationReason` lança `AppError(400, "Recomendacao sem motivo cosmetico suficiente")` quando faltam motivos ou fontes publicas. | `CUMPRE` |
| Guardrail contra claims clinicos | `assertSafePublicExplanation` bloqueia texto com cura, diagnostico, garantia, resultado garantido ou tratamento definitivo. | `CUMPRE` |
| DTO publico minimizado | `real_dev/api/src/services/recommendation.service.js` devolve `reasonCodes`, `explanation`, `sourceLabels`, `limitations`, estado e produto publico; nao devolve `sourceSignals`, fotografias, prompts, consentimentos, tokens, cookies nem paths internos. | `CUMPRE` |
| Integracao com recomendacoes existentes | `generateRecommendationsForUser` reutiliza `FaceAnalysis`, `FaceReport`, `Profile`, `Product`, `ProductRecommendation` e `filterProductsBlockedByProfile`, sem criar endpoint, model ou provider novo. | `CUMPRE` |
| UI explicavel | `real_dev/web/src/pages/ProductRecommendationsPage.jsx` apresenta explicacao, fontes usadas, limitacoes, estados loading/error/empty/success e feedback, mantendo recomendacao separada de carrinho/checkout. | `CUMPRE` |
| Negativos RNF23 | `real_dev/api/tests/mf8.recommendation-explainability.test.js` cobre recomendacao sem motivo, sem fonte publica, fonte desconhecida e texto com promessa clinica. | `CUMPRE` |

### Contratos consumidos e entregues

- Consumidos de `MF2`: endpoints existentes `POST /api/recommendations/generate`, `GET /api/recommendations`, `POST /api/recommendations/:recommendationId/feedback`, modelo `ProductRecommendation`, feedback `util`/`nao_relevante` e recomendacoes baseadas em analise/historico.
- Consumidos de `MF4`: `filterProductsBlockedByProfile` continua a impedir produtos incompatíveis com alergias, ingredientes a evitar e restricoes leves antes do ranking.
- Consumidos de `MF7`: sessao autenticada por cookie HttpOnly e provider IA isolado continuam intactos; este BK nao cria provider nem envia imagens para treino externo.
- Entregues a `BK-MF8-06`: campos estaveis `reasonCodes`, `sourceSignals` internos, `sourceLabels`, `explanation` e `limitations`, que permitem validar fairness sem duplicar explicabilidade.
- Entregues a `BK-MF8-10`: base publica de explicabilidade para futuras recomendacoes enriquecidas com respostas guiadas, sem novo endpoint paralelo.

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. Nao foram alterados uploads, encriptacao, `privacyStatus`, performance, timeouts, logs seguros ou contratos de protecao de dados biometricos.
- `MF7 -> MF8`: preservada. Consentimento, sessao HttpOnly, ownership, provider IA externo, pagamentos e exports admin nao foram alterados.
- `BK-MF8-04 -> BK-MF8-05`: consumido. A camada operacional de backup/teste ficou intacta e nao cria dependencia na explicabilidade.
- `BK-MF8-05 -> BK-MF8-06`: preparado. O proximo BK pode validar nao discriminacao sobre motivos, fontes publicas, explicacao e limitacoes ja normalizados.
- `BK-MF8-10`: preparado. `RNF23` fica disponivel para recomendacoes enriquecidas sem duplicar endpoints ou services.
- `MF8 futura`: preservada. Nao foram introduzidos endpoints novos, providers externos, webhooks, pagamentos, carrinho automatico, RAG, embeddings, treino externo ou revisao humana fora de scope.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Observacao ambiental: `tests/mf2.integration.test.js` falhou no sandbox com `listen EPERM`; repeticao fora do sandbox passou. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/api/src/services/recommendation-reason.service.js` | Alterado | Implementa explicabilidade publica com `sourceLabels`, limitacoes, deduplicacao, fontes permitidas e guardrails contra claims clinicos. |
| `real_dev/api/src/services/recommendation.service.js` | Alterado | Integra `sourceLabels` no DTO publico e passa perfil/relatorio para construir explicacao e limitacoes. |
| `real_dev/api/tests/mf8.recommendation-explainability.test.js` | Criado | Teste focal de `RNF23`, positivos e negativos sem servidor ou base de dados. |
| `real_dev/web/src/pages/ProductRecommendationsPage.jsx` | Alterado | Mostra explicacao, fontes usadas, limitacoes e estados de UI consumindo o DTO real da API. |
| `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | Alterado | Relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`. |

### Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `git status --short` | Antes da execucao existiam apenas os relatorios MF8 untracked; depois permanecem apenas `IMPLEMENTACAO-REAL_DEV-MF8.md` e `AUDITORIA-IMPLEMENTACAO-real_dev-MF8.md` como untracked. `real_dev/` continua ignorado como esperado. |
| `rg -n "RF18|RF19|RF40|RF43|RNF23|BK-MF8-05" ...docs...` | Passou; docs canonicos confirmam `RNF23`, dependencias de recomendacao/restricoes e handoff para `BK-MF8-06`. |
| `find mockup -maxdepth 2 -type f -print` | Falhou com `No such file or directory`; sem pasta `mockup/` neste checkout. Nao bloqueia porque o BK toca UI simples e o contrato vem dos docs/codigo. |
| `node --check real_dev/api/src/services/recommendation-reason.service.js` | Passou sem output. |
| `node --check real_dev/api/src/services/recommendation.service.js` | Passou sem output. |
| `node --check real_dev/api/tests/mf8.recommendation-explainability.test.js` | Passou sem output. |
| `npm --prefix real_dev/api test -- tests/mf8.recommendation-explainability.test.js` | Passou no sandbox: 1 ficheiro, 4 testes. |
| `npm --prefix real_dev/api test -- tests/mf2.contracts.test.js` | Passou no sandbox: 1 ficheiro, 7 testes. |
| `npm --prefix real_dev/api test -- tests/mf2.integration.test.js` | Primeiro falhou no sandbox por `listen EPERM`; repetido fora do sandbox com sucesso: 1 ficheiro, 12 testes. |
| `npm --prefix real_dev/api test` | Passou fora do sandbox: 31 ficheiros e 226 testes. |
| `npm --prefix real_dev/web run build` | Passou; Vite gerou build com 79 modulos transformados. |
| `npm --prefix real_dev/web run smoke:mf2` | Passou; contratos de montagem, API e UI de recomendacoes presentes. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs/guias consistentes. |
| `rg -n "real[_]dev|REAL[_]DEV" docs/planificacao/guias-bk/MF8/BK-MF*.md` | Passou sem matches; os guias publicos MF8 nao ganharam leakage de `real_dev`. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/api/scripts`, `real_dev/web/src`, `real_dev/web/scripts` e relatorios MF8 | Sem finding novo. Hits residuais justificados: historico dos relatorios, testes/stubs de Stripe/PayPal/MBWay, segredos fake de teste, verificacoes anti-`localStorage`/`sessionStorage`, storage privado do BK-MF8-04, provider externo MF7, disclaimers de treino externo e novo teste negativo que prova que `storageKey`/`consentId` nao saem no DTO. |
| `git check-ignore -v real_dev/api/src/services/recommendation-reason.service.js real_dev/api/src/services/recommendation.service.js real_dev/api/tests/mf8.recommendation-explainability.test.js real_dev/web/src/pages/ProductRecommendationsPage.jsx` | Passou; `.gitignore:2:real_dev/` confirma que a implementacao real esta ignorada neste checkout. |
| `git diff --check` | Passou sem output. |
| `rg -n "[ \t]+$" ...ficheiros tocados...` | Passou sem matches; sem whitespace final nos ficheiros alterados/criados e relatorios MF8. |

### Validacoes nao executadas

- QA manual em browser real: nao executada; o build e o smoke estatico validaram a pagina e contratos, mas nao houve sessao manual autenticada.
- Teste E2E real com MongoDB persistente e utilizador seedado no browser: nao executado por nao existir script especifico para este BK.
- Mockup visual: nao consultado porque nao existe pasta `mockup/` neste checkout.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.
- Alteracao de guias BK, matriz, backlog ou documentos canonicos: nao executada, conforme `PERMITIR_ALTERAR_DOCS=nao`.

### Blockers/TODOs

- Sem blockers tecnicos para `BK-MF8-05`.
- `TODO operacional`: quando houver QA final de MF8, validar no browser com utilizador autenticado, analise/relatorio/perfil/catalogo seedados e recomendações reais visíveis.

### Decisao

`BK-MF8-05` fica `IMPLEMENTADO` em `real_dev`. A API entrega recomendações explicáveis com motivos, fontes públicas e limitações; bloqueia recomendações opacas e texto inseguro; o frontend apresenta a explicação sem inventar dados; e as validações focais, regressivas, build, smoke e planificação passaram. A única anomalia foi ambiental no sandbox para Supertest, mitigada com execução fora do sandbox.

Proxima acao recomendada: avançar para `BK-MF8-06 - O sistema deve garantir nao discriminacao por genero, idade ou tom de pele`, usando os campos `reasonCodes`, `sourceSignals`, `sourceLabels`, `explanation` e `limitations` entregues neste BK.

## Execucao atual - BK-MF8-04

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF8`
- `BK_IDS`: `BK-MF8-04`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-04

Esta execucao implementou o `BK-MF8-04 - Base de dados com backups automaticos diarios` contra `RNF21`, usando `real_dev/api` como raiz real da API. O guia publico usa exemplos `apps/api`, mas a prompt desta execucao definiu `IMPLEMENTATION_ROOT=real_dev`; por isso os contratos foram mapeados para `real_dev/api` sem alterar `apps/`, BKs, matriz, backlog ou documentos canonicos.

O trabalho fechou o procedimento operacional de backup em modo controlado: existe comando `backup:daily`, script Node.js com `--dry-run`, validacao obrigatoria de ambiente de teste via `assertTestEnvironmentIsIsolated`, destino privado dentro de `real_dev/storage/private/backups`, redacao de campos sensiveis antes de escrever artefactos e teste Vitest focal com negativos `P1`.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-04` | `RNF21` | `IMPLEMENTADO` | `backup:daily`, `scripts/backup-daily.mjs`, manifesto dry-run, redacao de campos sensiveis e teste `mf8.backup.contract.test.js` validado. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Comando operacional | `real_dev/api/package.json` expoe `backup:daily` apontado para `node scripts/backup-daily.mjs`. | `CUMPRE` |
| Ambiente de teste obrigatorio | `validateBackupConfiguration` consome `assertTestEnvironmentIsIsolated` do `BK-MF8-03`, bloqueando `NODE_ENV` errado, URI sem marcador de teste e credenciais reais detetaveis. | `CUMPRE` |
| Destino privado | `resolveBackupRoot` aceita apenas caminhos dentro de `real_dev/storage/private` e recusa destinos fora dessa area. | `CUMPRE` |
| Dry-run sem base real | `runBackup({ dryRun: true })` cria manifesto sem abrir ligacao MongoDB, permitindo evidence segura do contrato. | `CUMPRE` |
| Redacao de campos sensiveis | `redactSensitiveFields` redige chaves como `password`, `token`, `cookie`, `secret`, `storageKey`, `photo`, `image`, `report` e `biometric`. | `CUMPRE` |
| Output publico minimizado | `assertPublicOutputDoesNotExposeSecrets` bloqueia URI MongoDB, paths internos, segredos e `storageKey` no resumo publico. | `CUMPRE` |
| Negativos obrigatorios P1 | `real_dev/api/tests/mf8.backup.contract.test.js` cobre destino fora de `storage/private`, URI vazia, redacao e output inseguro. | `CUMPRE` |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. O BK nao altera encriptacao, `storageKey`, `privacyStatus`, uploads, relatórios biometricos nem contratos de eliminacao/anonymizacao.
- `MF7 -> MF8`: preservada. Consentimento, sessao HttpOnly, roles, pagamentos, provider IA e exports admin nao foram alterados.
- `BK-MF8-03 -> BK-MF8-04`: consumido. O backup reutiliza o guard de ambiente isolado e a base `orelle_test` entregue no BK anterior.
- `BK-MF8-04 -> BK-MF8-05`: entregue. A camada de fiabilidade `RNF21` fica fechada sem criar dependencia tecnica nova para explicabilidade IA.
- `BK-MF8-15 -> BK-MF8-17`: preparado. A suite final passa a ter script, dry-run, manifesto e teste focal para incluir evidence de backup.
- `MF8 futura`: preservada. Nao foram introduzidos endpoints, UI, cron real, cloud storage, webhooks, providers externos, restore destrutivo, pagamentos novos, RAG, embeddings ou treino externo.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Observacao operacional: a suite API completa falha no sandbox com `listen EPERM`; repeticao fora do sandbox passou. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/api/package.json` | Alterado | Adiciona o comando `backup:daily`. |
| `real_dev/api/scripts/backup-daily.mjs` | Criado | Implementa backup/dry-run seguro, destino privado, redacao e output minimizado. |
| `real_dev/api/tests/mf8.backup.contract.test.js` | Criado | Contrato automatizado para `RNF21`, happy path dry-run e negativos P1. |
| `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | Alterado | Relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`. |

### Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `git status --short` | Antes/depois aparecem apenas os relatorios MF8 untracked; `real_dev/` continua ignorado como esperado. |
| `git check-ignore -v real_dev/storage/private/backups/test.backup.json real_dev/storage/private/backups-test/test.backup.json real_dev/api/scripts/backup-daily.mjs real_dev/api/tests/mf8.backup.contract.test.js` | Passou; `.gitignore:2:real_dev/` confirma que artefactos e ficheiros de trabalho em `real_dev/` estao ignorados. |
| `node --check real_dev/api/scripts/backup-daily.mjs` | Passou sem output. |
| `node --check real_dev/api/tests/mf8.backup.contract.test.js` | Passou sem output. |
| `npm --prefix real_dev/api run` | Passou; `backup:daily` aparece na lista de scripts. |
| `npm --prefix real_dev/api test -- tests/mf8.backup.contract.test.js` | Passou no sandbox: 1 ficheiro, 5 testes. |
| `NODE_ENV=test MONGODB_URI=mongodb://127.0.0.1:27017/orelle_test npm --prefix real_dev/api run backup:daily -- --dry-run` | Passou; devolveu `status: "ok"`, `dryRun: true`, `databaseName: "orelle_test"` e `backupId: "bk-mf8-04-2026-07-04T00-21-59-282Z"`, sem URI nem paths internos. |
| `npm --prefix real_dev/api test` | No sandbox falhou por `listen EPERM`; repetido fora do sandbox com sucesso: 30 ficheiros e 222 testes passed. |
| `npm --prefix real_dev/web run build` | Passou; Vite gerou build com 79 modulos transformados. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs/guias consistentes. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/api/scripts`, `real_dev/web/src`, `real_dev/web/scripts` e relatorios MF8 | Sem finding novo. Hits residuais justificados: URIs Mongo de teste, storage privado esperado no BK, `storageKey` em testes/servicos que provam minimizacao, Stripe/PayPal/MBWay ja cobertos por contratos/stubs, segredos fake de teste, comentarios anti-`localStorage`/`sessionStorage`, disclaimers de treino externo e historico dos relatorios. |
| `git diff --check` | Passou sem output. |
| `rg -n "[ \t]+$" ...ficheiros tocados...` | Passou sem matches; sem whitespace final nos ficheiros alterados/criados e relatorios MF8. |

### Validacoes nao executadas

- Backup sem `--dry-run` contra MongoDB local: nao executado para nao ler colecoes nem gerar copia de documentos sem necessidade para fechar o contrato automatizado; fica reservado para ambiente operacional controlado com MongoDB local de teste.
- Restore destrutivo, cron real, cloud storage, S3 ou agendador de servidor: fora do scope do BK.
- QA manual em browser real: nao aplicavel a este BK, que e operacional/backend.
- Mockup visual: nao consultado por nao haver alteracao de UI.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.
- Alteracao de guias BK, matriz, backlog ou documentos canonicos: nao executada, conforme `PERMITIR_ALTERAR_DOCS=nao`.

### Blockers/TODOs

- Sem blockers tecnicos para `BK-MF8-04`.
- `TODO operacional`: se a equipa quiser evidence com documentos reais de teste, executar `backup:daily` sem `--dry-run` apenas contra MongoDB local isolado `orelle_test`, nunca contra desenvolvimento/producao.

### Decisao

`BK-MF8-04` fica `IMPLEMENTADO` em `real_dev`. A API tem comando de backup, script seguro, dry-run validado, manifesto de evidence, redacao de dados sensiveis, output publico minimizado, destino privado e teste focal com negativos suficientes para prioridade `P1`.

Proxima acao recomendada: avançar para `BK-MF8-05 - A IA deve indicar como chegou as recomendacoes`, consumindo a MF8 com `RNF21` fechado e sem dependencias operacionais abertas neste BK.

## Execucao atual - BK-MF8-03

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF8`
- `BK_IDS`: `BK-MF8-03`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-04

Esta execucao implementou o `BK-MF8-03 - Ambiente de testes separado do ambiente de producao` contra `RNF22`, usando `real_dev/api` como raiz real da API. O guia publico usa exemplos `apps/api`, mas a prompt desta execucao definiu `IMPLEMENTATION_ROOT=real_dev`; por isso os contratos foram mapeados para `real_dev/api` sem alterar `apps/`, BKs, matriz, backlog ou documentos canonicos.

O trabalho fechou o isolamento de testes da API: `NODE_ENV=test` passa a usar `orelle_test` como default seguro, o script `test` injeta `NODE_ENV=test` e `MONGODB_URI=mongodb://127.0.0.1:27017/orelle_test` antes do `dotenv` carregar a `.env` local, e `env.js` bloqueia configuracoes perigosas em modo de teste antes de qualquer ligacao MongoDB.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-03` | `RNF22` | `IMPLEMENTADO` | `ENVIRONMENT_NAMES`, default `orelle_test`, `assertTestEnvironmentIsIsolated`, script `npm test` com URI de teste e teste `mf8.test-env.contract.test.js` validado. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Ambiente de teste explicito | `real_dev/api/package.json` executa Vitest com `NODE_ENV=test` e `MONGODB_URI=mongodb://127.0.0.1:27017/orelle_test`. | `CUMPRE` |
| Default de teste separado | `real_dev/api/src/config/env.js` usa `DEFAULT_TEST_MONGO_URI` quando `NODE_ENV=test`, preservando `orelle` como default de desenvolvimento. | `CUMPRE` |
| Guard central RNF22 | `assertTestEnvironmentIsIsolated` valida `NODE_ENV=test`, base com marcador `_test`/`-test` e ausencia de credenciais reais detetaveis. | `CUMPRE` |
| Negativo `NODE_ENV` errado | `real_dev/api/tests/mf8.test-env.contract.test.js` bloqueia execucao fora de `NODE_ENV=test`. | `CUMPRE` |
| Negativo base sem marcador de teste | O teste bloqueia `mongodb://127.0.0.1:27017/orelle`. | `CUMPRE` |
| Negativo base com aspeto de producao | O teste bloqueia `orelle-prod`, mesmo com `NODE_ENV=test`. | `CUMPRE` |
| Negativo credencial real | O teste bloqueia `STRIPE_SECRET_KEY=sk_live_real_value` via `getUnsafeTestSecretNames`. | `CUMPRE` |
| Exemplo publico seguro | `real_dev/api/.env.example` documenta `NODE_ENV=test` e `orelle_test` sem segredos reais. | `CUMPRE` |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. A suite continua a cobrir robustez, HTTPS, timeouts, hash bcrypt e encriptacao; o novo guard nao altera armazenamento cifrado nem contratos biometricos.
- `MF7 -> MF8`: preservada. Os campos `AI_PROVIDER_MODE`, `AI_PROVIDER_URL` e `AI_PROVIDER_KEY` foram mantidos em `env.js`; a regra nova apenas bloqueia configuracao insegura quando `NODE_ENV=test`.
- `BK-MF8-02 -> BK-MF8-03`: consumido. Logs seguros e metricas continuam intactos, e as falhas de ambiente passam a ser bloqueadas antes de chamadas a base real.
- `BK-MF8-03 -> BK-MF8-04`: entregue. O proximo BK pode simular backups contra `orelle_test` ou outra base com `_test`/`-test`, sem tocar em dados normais de desenvolvimento/producao.
- `BK-MF8-15 -> BK-MF8-17`: preparado. A suite final passa a ter um script de teste deterministico e um contrato automatizado para ambiente isolado.
- `MF8 futura`: preservada. Nao foram introduzidos endpoints, roles, providers externos, webhooks, pagamentos novos, RAG, embeddings, treino externo ou fluxos de UI.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Observacao operacional: a suite API completa falha no sandbox com `listen EPERM`; repeticao fora do sandbox passou. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/api/src/config/env.js` | Alterado | Centraliza nomes de ambiente, defaults dev/test, parsing de URI MongoDB, deteccao de credenciais reais e guard `assertTestEnvironmentIsIsolated`. |
| `real_dev/api/package.json` | Alterado | Faz o script `test` correr com `NODE_ENV=test` e base `orelle_test`, evitando dependencia da `.env` local. |
| `real_dev/api/.env.example` | Alterado | Documenta configuracao de teste segura com `_test`. |
| `real_dev/api/tests/mf8.test-env.contract.test.js` | Criado | Contrato Vitest para `RNF22`, caminho seguro e negativos obrigatorios. |
| `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | Alterado | Relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`. |

### Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `git status --short --untracked-files=all` | Antes da execucao havia apenas os relatorios MF8 untracked; `real_dev/` esta ignorado como esperado. |
| `git check-ignore -v real_dev real_dev/api real_dev/api/.env real_dev/api/src/config/env.js ...` | Passou; `.gitignore:2:real_dev/` confirma que `real_dev/` e area ignorada. |
| `node --check real_dev/api/src/config/env.js` | Passou sem output. |
| `node --check real_dev/api/tests/mf8.test-env.contract.test.js` | Passou sem output. |
| `npm --prefix real_dev/api test -- tests/mf8.test-env.contract.test.js` | Passou no sandbox: 1 ficheiro, 5 testes. |
| `npm --prefix real_dev/api test` | No sandbox falhou por `listen EPERM`; repetido fora do sandbox com sucesso: 29 ficheiros e 217 testes passed. |
| `npm --prefix real_dev/web run build` | Passou; Vite gerou build com 79 modulos transformados. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs/guias consistentes. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/web/src`, `real_dev/web/scripts` e relatorio MF8 | Sem finding novo. Hits residuais justificados: pagamentos Stripe/PayPal/MBWay ja cobertos por testes/stubs, comentarios anti-`localStorage`/`sessionStorage`, segredos fake de teste, guards de configuracao, disclaimers de treino externo e texto historico do relatorio. |
| `git diff --check` | Passou sem output. |
| `rg -n "[ \t]+$" ...ficheiros tocados...` | Passou sem matches; sem whitespace final nos ficheiros alterados/criados. |

### Validacoes nao executadas

- QA manual em browser real: nao aplicavel a este BK, que altera apenas configuracao/testes da API.
- Mockup visual: nao consultado por nao haver alteracao de UI.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.
- Alteracao de guias BK, matriz ou documentos canonicos: nao executada, conforme `PERMITIR_ALTERAR_DOCS=nao`.

### Blockers/TODOs

- Sem blockers tecnicos para `BK-MF8-03`.
- `TODO`: no `BK-MF8-04`, executar simulacoes de backup apenas contra base com marcador `_test`/`-test`, reutilizando o contrato entregue neste BK.

### Decisao

`BK-MF8-03` fica `IMPLEMENTADO` em `real_dev`. A API tem ambiente de testes isolado por default, guard central contra configuracao perigosa, script de teste deterministico, exemplo `.env` seguro e evidence automatizada com negativos suficientes para prioridade `P1`.

Proxima acao recomendada: avançar para `BK-MF8-04 - Base de dados com backups automaticos diarios`, consumindo `orelle_test` como base segura para simulacoes.

## Execucao atual - BK-MF8-02

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO`: `MF8`
- `BK_IDS`: `BK-MF8-02`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-03

Esta execucao implementou o `BK-MF8-02 - Logs de erros e metricas de desempenho` contra `RNF20`, usando `real_dev/api` como raiz real da API. O guia publico usa exemplos `apps/api`, mas a prompt desta execucao definiu `IMPLEMENTATION_ROOT=real_dev`; por isso os contratos foram mapeados para `real_dev/api` sem alterar `apps/`, BKs, matriz, backlog ou documentos canonicos.

O trabalho acrescentou observabilidade segura e minimizada: cada pedido recebe `requestId`, a API devolve erro publico sanitizado, os logs usam lista fechada de campos permitidos, as metricas HTTP reutilizam `PerformanceMetric` sem dados pessoais, e o teste focal prova dois negativos obrigatorios: detalhes sensiveis redigidos e erro interno com path local escondido.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-02` | `RNF20` | `IMPLEMENTADO` | `PerformanceMetric` alargado para `http_request`, `observability.service.js`, `request-observability.middleware.js`, `error.middleware.js` sanitizado, `createApp` com middlewares de observabilidade e teste `mf8.safe-logging.contract.test.js` validado. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| `requestId` por pedido | `real_dev/api/src/middlewares/request-observability.middleware.js` cria `req.requestId`, `req.requestStartedAt` e header `X-Request-Id`. | `CUMPRE` |
| Logs de erro minimizados | `real_dev/api/src/services/observability.service.js` cria entradas com `level`, `event`, `requestId`, `method`, `route`, `statusCode`, `errorName` e `message`. | `CUMPRE` |
| Resposta publica segura | `real_dev/api/src/middlewares/error.middleware.js` usa `buildPublicErrorResponse`, preserva mensagens controladas de `AppError` e esconde `500` interno. | `CUMPRE` |
| Sanitizacao de detalhes | `sanitizePublicDetails` redige chaves e valores sensiveis como cookie, token, imagePath, storage, path, report e biometric. | `CUMPRE` |
| Metricas HTTP minimizadas | `PerformanceMetric` preserva `face_analysis` e aceita `http_request` com `method`, `route`, `statusCode`, `durationMs`, `status` e `budgetMs`. | `CUMPRE` |
| Persistencia auxiliar segura | `recordHttpRequestMetric` nao bloqueia a resposta e evita writes reais quando a ligacao Mongoose nao esta pronta, mantendo compatibilidade com testes sem Mongo. | `CUMPRE` |
| Teste automatizado RNF20 | `real_dev/api/tests/mf8.safe-logging.contract.test.js` cobre resposta/log sanitizados, erro interno generico e metrica HTTP minimizada. | `CUMPRE` |

### Coerencia entre MFs e BKs vizinhos

- `MF6 -> MF8`: preservada. `PerformanceMetric` continua compativel com `face_analysis`, `runWithPerformanceBudget` e os testes `MF6`; os novos campos tem defaults seguros para metricas antigas.
- `MF7 -> MF8`: preservada. Sessao por cookie HttpOnly, consentimento, ownership, roles, pagamentos e provider IA nao foram alterados. Logs nao guardam cookies, tokens, headers, body, fotografias, relatorios ou storage keys.
- `BK-MF8-01 -> BK-MF8-02`: consumido. A modularidade do BK anterior permitiu adicionar `observability.service.js` e middleware proprio sem espalhar regras por controllers.
- `BK-MF8-02 -> BK-MF8-03`: entregue. O proximo BK pode usar `requestId`, logs seguros e metricas HTTP para diagnosticar falhas de ambiente/teste sem expor dados sensiveis.
- `MF8 futura`: preservada. Nao foram introduzidos dashboards, providers externos, webhooks, RAG, embeddings, treino externo, pagamentos novos, endpoints de negocio paralelos ou fluxos de compra automatica.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 0 | Sem findings confirmados apos implementacao e validacao. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Observacao operacional: Supertest falha no sandbox com `listen EPERM`; repeticao fora do sandbox passou. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/api/src/models/performance-metric.model.js` | Alterado | Preserva metricas `face_analysis` e acrescenta metricas HTTP minimizadas. |
| `real_dev/api/src/services/observability.service.js` | Criado | Centraliza `requestId`, rota segura, sanitizacao, log seguro e metrica HTTP. |
| `real_dev/api/src/middlewares/request-observability.middleware.js` | Criado | Cria contexto do pedido e regista metrica no fim da resposta. |
| `real_dev/api/src/middlewares/error.middleware.js` | Alterado | Devolve erro publico seguro com `requestId` e log minimizado. |
| `real_dev/api/src/app.js` | Alterado | Monta middlewares de observabilidade antes dos restantes middlewares/routes. |
| `real_dev/api/tests/mf8.safe-logging.contract.test.js` | Criado | Contrato automatizado de logs seguros, erro publico e metricas HTTP. |
| `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | Alterado | Relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`. |

### Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `git status --short` | Apenas relatorios MF8 untracked antes/depois; `real_dev/` esta ignorado como esperado. |
| `git check-ignore -v real_dev` | Passou; `.gitignore:2:real_dev/` confirma que `real_dev/` e area ignorada. |
| `rg -n "RNF20\|BK-MF8-02\|..." ...` | Confirmou `RNF20`, matriz, backlog, guia MF8, core dual, sprint S12 e handoff `BK-MF8-03`. |
| `npm --prefix real_dev/api test -- tests/mf8.safe-logging.contract.test.js` | No sandbox falhou por `listen EPERM`; repetido fora do sandbox com sucesso: 1 ficheiro, 3 testes passed. |
| `npm --prefix real_dev/api test -- tests/mf8.safe-logging.contract.test.js tests/mf3.integration.test.js tests/mf6.robustness-security.test.js` | Passou fora do sandbox: 3 ficheiros, 38 testes passed. |
| `npm --prefix real_dev/api test` | Passou fora do sandbox: 28 ficheiros e 212 testes passed. |
| `npm --prefix real_dev/web run build` | Passou; Vite gerou build com 79 modulos transformados. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs/guias consistentes. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/web/src`, `real_dev/web/scripts` e relatorio MF8 | Sem finding novo. Hits residuais justificados: testes de Stripe/PayPal/MBWay, segredos fake de teste, comentarios anti-`localStorage`/`sessionStorage`, configuracao de env, disclaimers de treino externo e negativos do novo teste de logging. |
| `git diff --check` | Passou sem output. |
| `rg -n "[ \t]+$" ...ficheiros tocados...` | Passou sem matches; sem whitespace final nos ficheiros alterados/criados. |

### Validacoes nao executadas

- QA manual em browser real: nao aplicavel a este BK, que altera observabilidade backend e nao fluxo visual.
- Mockup visual: nao consultado por nao haver alteracao de UI.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.
- Alteracao de guias BK, matriz ou documentos canonicos: nao executada, conforme `PERMITIR_ALTERAR_DOCS=nao`.

### Blockers/TODOs

- Sem blockers tecnicos para `BK-MF8-02`.
- `TODO`: quando necessario auditar ambiente de testes no `BK-MF8-03`, reutilizar `requestId` e metricas HTTP para separar falha de ambiente, falha de teste e falha real de runtime.

### Decisao

`BK-MF8-02` fica `IMPLEMENTADO` em `real_dev`. A API tem logs seguros, resposta publica sanitizada, `requestId` por pedido, metricas HTTP minimizadas, protecao contra escrita Mongoose sem ligacao em testes e validacoes completas verdes fora do sandbox.

Proxima acao recomendada: avançar para `BK-MF8-03 - Ambiente de testes separado do ambiente de producao`, reutilizando `requestId` e metricas HTTP como evidence operacional.

## Execucao atual - BK-MF8-01

- `PROJECT_NAME`: Orelle
- `MODO`: `implementar`
- `MF_ALVO` recebido: `MF7`
- `MF_ALVO` normalizado por BK canonico: `MF8`
- `BK_IDS`: `BK-MF8-01`
- `IMPLEMENTATION_ROOT`: `real_dev`
- `STRICT_SCOPE`: `true`
- `PERMITIR_ALTERAR_DOCS`: `nao`
- `PERMITIR_COMMITS`: `nao`
- `resultado`: `IMPLEMENTADO`
- `data`: 2026-07-03

Esta execucao implementou o `BK-MF8-01 - Codigo modular (MVC) com documentacao e docstrings` contra `RNF19`, usando `real_dev/api` como raiz real da API. A prompt recebida tinha drift de entrada (`MF_ALVO=MF7` com `BK_IDS=[BK-MF8-01]`), mas a matriz canonica, o backlog e o guia oficial confirmam que `BK-MF8-01` pertence a `MF8`; por isso o alvo efetivo foi normalizado para `MF8` e o drift ficou registado sem editar documentos canonicos.

O trabalho concentrou a modularidade verificavel: constantes de dominio partilhadas sairam dos models para `constants/domain.constants.js`, a encriptacao usada por schemas passou para `utils/encryption.util.js` mantendo `services/encryption.service.js` como fachada compativel, validators/services/providers deixaram de importar enums a partir de models, e os controllers acusados pelo contrato receberam JSDoc direto.

### Estado do BK

| BK | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| `BK-MF8-01` | `RNF19` | `IMPLEMENTADO` | `domain.constants.js`, `encryption.util.js`, `encryption.service.js` como fachada, imports corrigidos em models/validators/services/providers, JSDoc em controllers e teste `mf8.modularidade.contract.test.js` validado. |

### Rastreabilidade e contratos

| Contrato | Evidencia real_dev | Estado |
| --- | --- | --- |
| Camadas MVC existentes | `real_dev/api/src/controllers`, `services`, `models`, `routes`, `validators` e `middlewares` existem e sao verificadas pelo teste de contrato. | `CUMPRE` |
| `app.js` como composicao HTTP | O teste confirma `createApp`, `app.use`, routes e `errorMiddleware`, sem mover regras de dominio para o bootstrap. | `CUMPRE` |
| Constantes fora dos models | `real_dev/api/src/constants/domain.constants.js` centraliza `SKIN_TYPES`, `GENDERS`, pedidos biometricos, encomendas, pagamentos e notificacoes. | `CUMPRE` |
| Models focados em persistencia | `Profile`, `Product`, `Order`, `Notification` e `BiometricDataRequest` importam enums de `domain.constants.js` e deixam de exportar constantes partilhadas. | `CUMPRE` |
| Validators sem dependencia de models | `profile`, `product`, `catalog-query`, `checkout`, `notification` e `biometric-data-request` importam enums de `domain.constants.js`. | `CUMPRE` |
| Services/providers com contratos estaveis | `order`, `admin-dashboard`, `stock`, `notification`, `routine-alert`, `biometric-data-request` e `payment.provider` usam constantes neutras sem duplicar enums. | `CUMPRE` |
| Encriptacao compatibilizada | `real_dev/api/src/utils/encryption.util.js` contem AES-256-GCM; `real_dev/api/src/services/encryption.service.js` reexporta a API antiga para preservar consumidores. | `CUMPRE` |
| JSDoc nas unidades publicas acusadas | `notification.controller.js` e `routine-alert.controller.js` documentam parametros, retornos e razoes de ownership/validacao. | `CUMPRE` |
| Teste automatizado RNF19 | `real_dev/api/tests/mf8.modularidade.contract.test.js` valida diretorias, `app.js`, fronteiras MVC, constantes fora dos models e JSDoc. | `CUMPRE` |

### Coerencia entre MFs e BKs vizinhos

- `MF7 -> MF8`: preservada. `BK-MF7-07` entregou providers de IA e resposta normalizada; `BK-MF8-01` reforcou modularidade/documentacao sem alterar comportamento de IA, consentimento, ownership, pagamentos ou privacidade.
- `MF6 -> MF8`: preservada. A encriptacao AES-256-GCM continua igual; apenas foi movida para `utils` para evitar dependencia de service dentro de schema/model.
- `BK-MF8-01 -> BK-MF8-02`: entregue. O proximo BK pode implementar logs/metricas sobre fronteiras mais estaveis e constantes partilhadas sem importar models para validacao.
- `MF8 futura`: preservada. Nao foram introduzidos endpoints, roles, providers externos, webhooks, treino externo, RAG, embeddings nem fluxos de compra automatica.

### Findings por severidade

| Severidade | Quantidade | Estado |
| --- | ---: | --- |
| `P0` | 0 | Sem findings confirmados. |
| `P1` | 0 | Sem findings confirmados. |
| `P2` | 0 | Sem findings confirmados. |
| `P3` | 1 | Drift de prompt: `MF_ALVO=MF7` contradizia `BK_IDS=[BK-MF8-01]`; resolvido por normalizacao canonica e registado neste relatorio. |

### Ficheiros alterados/criados

| Ficheiro | Tipo | Motivo |
| --- | --- | --- |
| `real_dev/api/src/constants/domain.constants.js` | Criado | Fonte neutra dos enums partilhados. |
| `real_dev/api/src/utils/encryption.util.js` | Criado | Util de encriptacao sem dependencia da camada de services. |
| `real_dev/api/src/services/encryption.service.js` | Alterado | Fachada compativel para consumidores existentes. |
| `real_dev/api/src/models/profile.model.js` | Alterado | Importa `GENDERS`/`SKIN_TYPES` de constants. |
| `real_dev/api/src/models/product.model.js` | Alterado | Importa `SKIN_TYPES` de constants. |
| `real_dev/api/src/models/order.model.js` | Alterado | Importa estados/gateways de constants. |
| `real_dev/api/src/models/notification.model.js` | Alterado | Importa tipos de notificacao de constants. |
| `real_dev/api/src/models/biometric-data-request.model.js` | Alterado | Importa enums biometricos de constants. |
| `real_dev/api/src/models/face-report.model.js` | Alterado | Usa util de encriptacao para evitar model -> service. |
| `real_dev/api/src/validators/*.js` | Alterado | Validators deixam de importar enums dos models. |
| `real_dev/api/src/services/*.js` e `real_dev/api/src/providers/payment.provider.js` | Alterado | Services/providers usam constantes neutras. |
| `real_dev/api/src/controllers/notification.controller.js` | Alterado | JSDoc e comentario de ownership/validacao. |
| `real_dev/api/src/controllers/routine-alert.controller.js` | Alterado | JSDoc e comentario de ownership. |
| `real_dev/api/tests/mf8.modularidade.contract.test.js` | Criado | Contrato automatizado de RNF19. |
| `docs/planificacao/guias-bk/IMPLEMENTACAO-REAL_DEV-MF8.md` | Criado | Relatorio tecnico permitido por `OUTPUT_MODE=relatorio_e_resumo`. |

### Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `git status --short` | Sem alteracoes tracked antes do relatorio; `real_dev/` esta ignorado como esperado. |
| `git check-ignore -v real_dev real_dev/api real_dev/web ...` | Passou; `.gitignore:2:real_dev/` confirma que a implementacao real e area ignorada. |
| `rg -n "RNF19\|BK-MF8-01" ...` | Confirmou `RNF19`, matriz, backlog, guia MF8 e handoff MF7 -> MF8. |
| `npm --prefix real_dev/api test -- tests/mf8.modularidade.contract.test.js` | Passou: 1 ficheiro, 5 testes. |
| `npm --prefix real_dev/api test` | No sandbox falhou por `listen EPERM`; repetido fora do sandbox com sucesso: 27 ficheiros e 209 testes passed. |
| `npm --prefix real_dev/web run build` | Passou; Vite gerou build com 79 modulos transformados. |
| `bash scripts/validate-planificacao.sh` | Passou; `overall_pass: true`, 44 RF, 31 RNF e 74 BKs/guias consistentes. |
| `git diff --check` | Passou sem output. |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/web/src` e `real_dev/web/scripts` | Sem finding novo. Hits residuais eram esperados: testes de Stripe/PayPal/MBWay, segredos fake de teste, comentarios anti-`localStorage`/`sessionStorage`, config de env e disclaimers de treino externo. |

### Validacoes nao executadas

- QA manual em browser real: nao aplicavel a este BK, que e de modularidade/API/documentacao tecnica sem alteracao UI.
- Mockup visual: nao consultado por nao haver alteracao de fluxo visual.
- Commits, push ou PR: nao executados, conforme `PERMITIR_COMMITS=nao`.
- Alteracao de guias BK, matriz ou documentos canonicos: nao executada, conforme `PERMITIR_ALTERAR_DOCS=nao`.

### Blockers/TODOs

- Sem blockers tecnicos para `BK-MF8-01`.
- `TODO`: em execucoes futuras, corrigir a variavel de entrada para `MF_ALVO=MF8` quando o BK alvo for `BK-MF8-01`, para evitar drift operacional.

### Decisao

`BK-MF8-01` fica `IMPLEMENTADO` em `real_dev`. A API tem contrato automatizado de modularidade, constantes partilhadas fora de models, encriptacao compativel sem dependencia model -> service, JSDoc nas unidades publicas acusadas e validacoes completas verdes fora do sandbox.

Proxima acao recomendada: avançar para `BK-MF8-02 - Logs de erros e metricas de desempenho`, reutilizando `domain.constants.js`, `encryption.util.js` e o teste de fronteiras como base de qualidade.
