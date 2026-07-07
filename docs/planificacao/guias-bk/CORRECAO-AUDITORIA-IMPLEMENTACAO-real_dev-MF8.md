# Correcao de auditoria de implementacao real_dev - MF8

## 2026-07-07 - BK-MF8-15/BK-MF8-16 - corrigir_auditoria P1

### Resultado

- Estado final: `CORRIGIDO`
- BKs corrigidos: `BK-MF8-15`, `BK-MF8-16`
- Findings corrigidos: `ORELLE-MF8-BK15-P1-001`, `ORELLE-MF8-BK16-P1-001`, `ORELLE-MF8-BK16-P1-002`
- Macro-fase canonica: `MF8`
- RF/RNF principais: `RNF27`, `RNF28`
- Implementacao root: `real_dev`
- Docs canonicos alterados: `nao`
- Evidence/relatorios tecnicos alterados: `sim`
- Commits criados: `nao`

### Findings tratados

| Finding | Severidade | Estado final | Resultado |
| --- | --- | --- | --- |
| `ORELLE-MF8-BK15-P1-001` | P1 | `CORRIGIDO` | Criada a matriz `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`, o contrato `real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js`, o teste `real_dev/api/tests/mf8.final-contracts.test.js` e o smoke `real_dev/web/scripts/check-mf8-final-smoke.mjs`. |
| `ORELLE-MF8-BK16-P1-001` | P1 | `CORRIGIDO` | O handoff executavel do `BK-MF8-15` passou a existir e foi consumido no fecho do `BK-MF8-16`. |
| `ORELLE-MF8-BK16-P1-002` | P1 | `CORRIGIDO` | Criada a evidence final `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`, o contrato `real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js` e o teste `real_dev/api/tests/mf8.final-execution-contract.test.js`. |

Sem findings P0, P1 ou P2 abertos para `BK-MF8-15`/`BK-MF8-16` apos esta
correcao. O `proof_e2e` permanece `TODO (BLOCKER)` por falta de runner
browser/E2E aprovado em `real_dev/web/package.json`, classificado como
`bloqueado_por_ambiente_ou_ferramenta` e nao como falha de produto.

### Correcao aplicada

- `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
  - materializa a matriz de testes/lacunas do `BK-MF8-15`;
  - cobre `unit`, `integration`, `smoke`, `build` e `e2e`;
  - inclui minimo de `3` cenarios negativos P0;
  - declara `proof_e2e` como `TODO (BLOCKER)` ate existir comando aprovado.
- `real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js`
  - valida BK, requisito `RNF27`, proofs obrigatorias, camadas, negativos e
    ausencia de marcadores sensiveis no resumo.
- `real_dev/api/tests/mf8.final-contracts.test.js`
  - cobre caminho positivo e negativos de matriz incompleta, `proof_e2e`
    indevidamente marcado como sucesso, negativos insuficientes e output
    sensivel.
- `real_dev/web/scripts/check-mf8-final-smoke.mjs`
  - valida a existencia e os marcadores minimos dos artefactos de handoff do
    `BK-MF8-15`.
- `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
  - regista a bateria final do `BK-MF8-16` com comando, camada, diretoria,
    exit code, estado, resumo, privacy check e impacto;
  - separa `falhou_por_produto` de `bloqueado_por_ambiente_ou_ferramenta`;
  - entrega handoff explicito para `BK-MF8-17`.
- `real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js`
  - valida BK, requisito `RNF28`, `14` proofs obrigatorias, camadas, estados,
    negativos, `proof_e2e` e handoff final.
- `real_dev/api/tests/mf8.final-execution-contract.test.js`
  - cobre caminho positivo e negativos de evidence incompleta, E2E sem runner
    marcado como sucesso, output sensivel e handoff errado.

### Validacoes executadas

| Comando / verificacao | Resultado |
| --- | --- |
| `node --check real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js` | `PASS` |
| `node --check real_dev/api/tests/mf8.final-contracts.test.js` | `PASS` |
| `node --check real_dev/web/scripts/check-mf8-final-smoke.mjs` | `PASS` |
| `node --check real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js` | `PASS` |
| `node --check real_dev/api/tests/mf8.final-execution-contract.test.js` | `PASS` |
| `npm --prefix real_dev/api test -- tests/mf8.final-contracts.test.js` | `PASS` - `1` ficheiro e `5` testes. |
| `node real_dev/web/scripts/check-mf8-final-smoke.mjs` | `PASS` - `BK-MF8-15 fecho de testes validado: 4 artefactos e 18 contratos.` |
| `npm --prefix real_dev/api test -- tests/mf8.final-execution-contract.test.js` | `PASS` - `1` ficheiro e `5` testes. |
| `rg -n "RNF28\|BK-MF8-16\|BK-MF8-17\|unit \\+ integration \\+ e2e" ...` | `PASS` - confirmou contrato canonico, BK16, BK17 e regra P0. |
| `rg -n "proof_api\|proof_web_build\|proof_mf8_smoke\|proof_e2e\|TODO \\(BLOCKER\\)" docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md` | `PASS` |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com `87` modulos transformados. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| `npm --prefix real_dev/api test` na sandbox | `FAIL_AMBIENTE` - `listen EPERM: operation not permitted 0.0.0.0`. |
| `npm --prefix real_dev/api test` fora da sandbox | `PASS` - `40` ficheiros e `279` testes passaram. |
| `git diff --check` | `PASS` - sem output. |
| Check de privacidade da evidence final | `PASS` - sem marcadores sensiveis na evidence final. |
| `rg -n "proof_api\|proof_web_build\|proof_e2e\|falhou_por_produto\|bloqueado_por_ambiente_ou_ferramenta\|Handoff para BK-MF8-17" docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` | `PASS` |
| Pesquisa estatica obrigatoria em `real_dev/api/src`, `real_dev/api/tests`, `real_dev/web/src`, `real_dev/web/scripts` e `docs/evidence` | `PASS_COM_RESIDUAIS_ESPERADOS` - apenas checks anti-storage, stubs/testes de pagamentos, segredos fake de teste, provider Stripe por env, guards de segredo de sessao, texto defensivo sobre treino externo e observabilidade/redaccao. |
| `rg -nP "[^\\x00-\\x7F]" ...` nos artefactos novos | `PASS` - sem caracteres nao ASCII nos ficheiros novos. |
| `rg -n "[ \\t]+$" ...` nos artefactos novos | `PASS` - sem trailing whitespace. |

### Coerencia entre MFs e BKs

- `MF7 -> MF8`: preservada. A correcao adiciona evidence/contratos de fecho e
  nao altera autenticacao, cookies, roles, consentimento, ownership,
  privacidade biometrica, provider IA ou pagamentos.
- `BK-MF8-14 -> BK-MF8-15`: preservado. A matriz BK15 consome os artefactos de
  mockup/evidence ja existentes e declara os comandos esperados para o fecho.
- `BK-MF8-15 -> BK-MF8-16`: entregue. O BK16 passou a ter matriz, contrato,
  teste e smoke herdados para executar.
- `BK-MF8-16 -> BK-MF8-17`: entregue com ressalva honesta. A evidence final
  separa ausencia de falhas de produto do blocker `proof_e2e`, que fica para
  runner aprovado ou manutencao como bloqueio de ferramenta.

### Notas de escopo

- Nenhum guia BK, matriz canonica, backlog, prompt, `apps/` ou documento
  canonico foi alterado.
- Nenhum endpoint, DTO, model, service, controller, middleware, cliente API ou
  regra de negocio existente foi alterado.
- Foram criados apenas artefactos de evidence/contrato/teste/smoke exigidos
  pelos P1 de `RNF27` e `RNF28`.
- Nenhum commit foi criado.

## 2026-07-07 - BK-MF8-14 - corrigir_auditoria P2-004

### Resultado

- Estado final: `CORRIGIDO`
- BK corrigido: `BK-MF8-14`
- Finding corrigido: `ORELLE-MF8-BK14-P2-004`
- Macro-fase canonica: `MF8`
- RF/RNF principal: `RNF26`
- Implementacao root: `real_dev`
- Docs canonicos alterados: `nao`
- Commits criados: `nao`

### Finding tratado

| Finding | Severidade | Estado final | Resultado |
| --- | --- | --- | --- |
| `ORELLE-MF8-BK14-P2-004` | P2 | `CORRIGIDO` | O conteudo embutido em `.assisted-consultation-panel-body` deixou de herdar texto claro do tema escuro sobre o painel branco do mockup. O titulo interno `Sessao guiada de avaliacao cosmetica` ficou legivel em desktop e mobile. |

Sem findings P0, P1 ou P2 abertos para `BK-MF8-14` apos esta correcao.

### Correcao aplicada

- `real_dev/web/src/styles.css`
  - `.assisted-consultation-panel-body` passou a isolar os tokens semanticos
    usados pelos componentes filhos dentro do painel claro;
  - `--ink`, `--muted`, `--surface`, `--surface-soft`, `--surface-glass`,
    `--status-surface`, `--brand-*` e `--button-*` passam a resolver localmente
    para valores compativeis com a superficie clara do mockup;
  - a correcao e local ao painel da consulta assistida e nao altera navegacao,
    auth, role gates, endpoints, DTOs, models, services ou regras de negocio.
- `real_dev/web/scripts/check-mf8-mockup-alignment.mjs`
  - o gate estatico passou a validar os tokens locais
    `--ink: var(--mockup-text)` e `--muted: rgb(30 30 30 / 72%)`;
  - a validacao BK14 passou de `18` para `20` padroes.

### Evidence visual actualizada

Screenshots regeneradas em browser local autenticado com mock HTTP temporario
apenas para evidence visual:

- `real_dev/web/evidence/bk-mf8-14-desktop-hub-mockup.png` (`97K`)
- `real_dev/web/evidence/bk-mf8-14-mobile-hub-mockup.png` (`42K`)

Verificacao de estilo computado:

- Desktop `1280x900`, tema `dark`, `data-mockup-mode="mockup"`:
  - painel activo: `backgroundColor=rgb(255, 255, 255)` e
    `color=rgb(30, 30, 30)`;
  - titulo interno `Sessao guiada de avaliacao cosmetica`:
    `color=rgb(30, 30, 30)`;
  - step activo `Avaliacao guiada`:
    `strongColor=rgb(245, 239, 231)`;
  - step inactivo `Historico IA`: `strongColor=rgb(30, 30, 30)`.
- Mobile `390x844`, tema `dark`, `data-mockup-mode="mockup"`:
  - painel activo: `backgroundColor=rgb(255, 255, 255)` e
    `color=rgb(30, 30, 30)`;
  - titulo interno `Sessao guiada de avaliacao cosmetica`:
    `color=rgb(30, 30, 30)`;
  - screenshot capturada directamente no painel activo, com `panelTop=12`.

### Validacoes executadas

| Comando / verificacao | Resultado |
| --- | --- |
| `node --check real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` |
| `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` - `BK-MF8-14 alinhamento visual validado: 6 ficheiros e 20 padroes.` |
| `npm --prefix real_dev/web run smoke:mf8-assisted-consultation` | `PASS` - `BK-MF8-13 UI integrada validada: 8 ficheiros e 32 contratos.` |
| `node --check real_dev/web/src/services/mockupAlignmentChecklist.js` | `PASS` |
| `node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js` | `PASS` |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 87 modulos transformados. |
| Contrato positivo `validateBKMF814Evidence(...)` com `mode: "mockup"` | `PASS` - `{"bkId":"BK-MF8-14","status":"valid","domain":"mockup_alignment","mode":"mockup"}` |
| Contrato negativo `validateBKMF814Evidence(...)` com `mode: "baseline"` | `PASS_NEGATIVO` - rejeitado com `Evidence visual deve usar mode mockup quando mockup/ existe.` |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa estatica focada por storage inseguro, `dangerouslySetInnerHTML`, `eval`, `new Function`, ids internos, segredos e placeholders nos ficheiros BK14 | `PASS_COM_NOTA` - apenas texto defensivo/documental; sem uso real de storage/token. |
| Pesquisa estatica focada por repos externos, dominios estranhos, pagamentos, checkout, RAG/embeddings e treino externo nos ficheiros BK14 | `PASS_COM_NOTA` - apenas texto defensivo sobre mockup ausente; sem drift material. |
| Browser local desktop/mobile com mock API temporario | `PASS` - contraste do conteudo do painel activo corrigido; screenshots actualizadas. |

### Validacoes nao executadas

- `npm --prefix real_dev/api test` nao foi reexecutado nesta correcao porque a
  alteracao ficou limitada a CSS, gate estatico web e screenshots de evidence.
  A suite API ja tinha sido repetida fora da sandbox na re-auditoria anterior e
  passado com 38 ficheiros e 269 testes.

### Coerencia entre MFs e BKs

- `MF5 -> MF8`: preservada. A correcao reforca a legibilidade local sem criar
  sistema visual paralelo.
- `MF7 -> MF8`: preservada. Nao houve alteracao em autenticacao, cookies,
  ownership, consentimento, roles ou privacidade.
- `BK-MF8-13 -> BK-MF8-14`: preservado. A pagina integrada continua a ser a
  base do polimento visual.
- `BK-MF8-14 -> BK-MF8-15/BK-MF8-16`: entregue. O BK disponibiliza gates,
  contrato de evidence e screenshots desktop/mobile actualizadas para a camada
  de verificacao/finalizacao.

### Notas de escopo

- Nenhum guia BK, matriz canonica, backlog, prompt, `apps/` ou documento
  canonico foi alterado.
- Nenhum endpoint, DTO, model, service, controller, middleware, cliente API ou
  regra de negocio foi criado/alterado.
- O mock API e o Vite local foram usados apenas para evidence visual e nao fazem
  parte da implementacao entregue.
- Nenhum commit foi criado.

## 2026-07-07 - BK-MF8-14 - corrigir_auditoria

### Resultado

- Estado final: `CORRIGIDO`
- BK corrigido: `BK-MF8-14`
- Macro-fase canonica: `MF8`
- RF/RNF principal: `RNF26`
- Implementacao root: `real_dev`
- Docs canonicos alterados: `nao`
- Commits criados: `nao`

### Findings tratados

| Finding | Severidade | Estado final | Resultado |
| --- | --- | --- | --- |
| `ORELLE-MF8-BK14-P1-001` | P1 | `JA_CORRIGIDO` | O finding ja estava fechado antes desta execucao: a UI usa `hasMockup: true`, `data-mockup-mode="mockup"` e contrato de evidence em `mode: "mockup"`. |
| `ORELLE-MF8-BK14-P2-003` | P2 | `CORRIGIDO` | Corrigido contraste dos titulos dos steps inactivos/activos em tema escuro. |
| `ORELLE-MF8-BK14-P3-002` | P3 | `NAO_REPRODUZIDO` | Ruido ambiental de `listen EPERM`; a suite API completa passou fora da sandbox. |

Sem findings P0, P1 ou P2 abertos apos esta execucao.

### Correcao aplicada

- `real_dev/web/src/styles.css`
  - adicionada regra local `.assisted-consultation-step strong` com
    `color: var(--mockup-text)`;
  - adicionada regra local `.assisted-consultation-step[aria-pressed="true"] strong`
    com `color: var(--mockup-background)`;
  - a correcao fica limitada aos steps da consulta assistida e nao altera
    navegacao, auth, role gates, endpoints, DTOs, models, services ou regras de
    negocio.

### Evidence visual actualizada

Screenshots regeneradas em browser local autenticado com mock HTTP temporario
apenas para evidence visual:

- `real_dev/web/evidence/bk-mf8-14-desktop-hub-mockup.png` (`89K`)
- `real_dev/web/evidence/bk-mf8-14-mobile-hub-mockup.png` (`38K`)

Verificacao de estilo computado:

- Desktop `1280x900`, tema `dark`, `data-mockup-mode="mockup"`:
  - step activo `Avaliacao guiada`: `strongColor=rgb(245, 239, 231)` sobre
    `buttonBackground=rgb(89, 28, 33)`;
  - steps inactivos `Historico IA`, `Recomendacoes` e `Insights do consultor`:
    `strongColor=rgb(30, 30, 30)` sobre `buttonBackground=rgb(255, 255, 255)`.
- Mobile `390x844`, tema `dark`, `data-mockup-mode="mockup"`:
  - mesmos valores de contraste para step activo e steps inactivos;
  - steps em coluna e painel activo visiveis sem sobreposicao.

### Validacoes executadas

| Comando / verificacao | Resultado |
| --- | --- |
| `node --check real_dev/web/src/services/mockupAlignmentChecklist.js` | `PASS` |
| `node --check real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` |
| `node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js` | `PASS` |
| `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs` | `PASS` - `BK-MF8-14 alinhamento visual validado: 6 ficheiros e 18 padroes.` |
| `npm --prefix real_dev/web run smoke:mf8-assisted-consultation` | `PASS` - `BK-MF8-13 UI integrada validada: 8 ficheiros e 32 contratos.` |
| Contrato positivo `validateBKMF814Evidence(...)` com `mode: "mockup"` | `PASS` - `{"bkId":"BK-MF8-14","status":"valid","domain":"mockup_alignment","mode":"mockup"}` |
| Contrato negativo `validateBKMF814Evidence(...)` com `mode: "baseline"` | `PASS_NEGATIVO` - rejeitado com `Evidence visual deve usar mode mockup quando mockup/ existe.` |
| `npm --prefix real_dev/web run build` | `PASS` - Vite build com 87 modulos transformados. |
| `npm --prefix real_dev/api test` | `PASS` fora da sandbox - 38 ficheiros, 269 testes. |
| `bash scripts/validate-planificacao.sh` | `PASS` - `overall_pass: true`, 44 RF, 31 RNF, 74 BKs/guias. |
| Pesquisa estatica focada por storage inseguro, `dangerouslySetInnerHTML`, `eval`, `new Function`, ids internos, segredos e placeholders nos ficheiros BK14 | `PASS_COM_NOTA` - apenas texto defensivo/documental; sem uso real de storage/token. |
| Pesquisa estatica focada por repos externos, dominios estranhos, pagamentos, checkout, RAG/embeddings e treino externo nos ficheiros BK14 | `PASS_COM_NOTA` - apenas texto defensivo sobre mockup ausente; sem drift material. |
| Browser local desktop/mobile com mock API temporario | `PASS` - contraste dos steps corrigido e screenshots actualizadas. |
| `git diff --check` | `PASS` |
| `rg -n "[ \t]+$" real_dev/web/src/styles.css ...relatorios...` | `PASS` |

### Coerencia entre MFs e BKs

- `MF5 -> MF8`: preservada. A correcao reforca legibilidade visual local sem
  alterar identidade visual global nem criar sistema paralelo.
- `MF7 -> MF8`: preservada. Nao houve alteracao em autenticacao, cookies,
  ownership, consentimento, roles ou privacidade.
- `BK-MF8-13 -> BK-MF8-14`: preservado. A pagina integrada continua a ser a
  base do polimento visual.
- `BK-MF8-14 -> BK-MF8-15/BK-MF8-16`: entregue. O BK volta a disponibilizar
  evidence visual desktop/mobile e gates de teste reutilizaveis pelos BKs de
  verificacao/finalizacao.

### Notas de escopo

- Nenhum guia BK, matriz canonica, backlog, prompt, `apps/` ou documento
  canonico foi alterado.
- Nenhum endpoint, DTO, model, service, controller, middleware, cliente API ou
  regra de negocio foi criado/alterado.
- O mock API e o Vite local foram usados apenas para evidence visual e nao fazem
  parte da implementacao entregue.
- Nenhum commit foi criado.

Data: 2026-07-07
Projeto: Orelle
Modo executado: corrigir_auditoria
Escopo: BK-MF8-14
Implementation root: real_dev
Permitir alterar docs canonicos: nao
Permitir commits: nao

## Resultado

Estado final: PASS

Finding corrigido:

- ORELLE-MF8-BK14-P1-001 - CORRIGIDO

O hub de consulta assistida deixou de operar em baseline quando a pasta `mockup/`
existe. A implementacao passou a declarar `mode: "mockup"`, a referenciar os
ficheiros locais do mockup e a aplicar a paleta RNF26 validada no hub visual.

## Correcao aplicada

Ficheiros alterados em `real_dev`:

- `real_dev/web/src/services/mockupAlignmentChecklist.js`
  - adicionada `MOCKUP_REFERENCE_SUMMARY` com `mockup/README.md`,
    `mockup/src/app/docs/DESIGN-SYSTEM.md` e `mockup/src/app/App.tsx`;
  - checklist passa a devolver `mockupReference` e `checkpoints`;
  - `assertMockupAlignmentEvidence` rejeita evidence sem modo valido e exige
    referencias locais quando `mode === "mockup"`.
- `real_dev/web/src/pages/AssistedConsultationHubPage.jsx`
  - `hasMockup` passou para `true`;
  - shell exposta com `data-mockup-mode="mockup"` e
    `data-mockup-source="mockup/"`;
  - hero, chips, estado autenticado e badge do painel foram alinhados ao fluxo
    visual do mockup sem introduzir endpoints, roles ou dados de negocio novos.
- `real_dev/web/src/styles.css`
  - adicionados tokens `--mockup-background`, `--mockup-primary`,
    `--mockup-secondary`, `--mockup-highlight`, `--mockup-text`;
  - selector principal reforcado para `section.assisted-consultation-shell`,
    evitando override por `.section-grid > section`;
  - shell, hero, passos, painel e estados vazios passaram a usar paleta areia,
    borgonha, rosa metalico, dourado e superficies brancas.
- `real_dev/web/scripts/check-mf8-mockup-alignment.mjs`
  - gate estatico passou a validar a existencia de `mockup/`, os tokens do
    design system e os marcadores `hasMockup: true` / `data-mockup-mode`.
- `real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js`
  - contrato de evidence passou a exigir `mode: "mockup"` e pelo menos duas
    referencias locais ao mockup.

Artefactos de evidence adicionados em `real_dev`:

- `real_dev/web/evidence/bk-mf8-14-desktop-hub-mockup.png`
- `real_dev/web/evidence/bk-mf8-14-mobile-hub-mockup.png`

## Evidence visual

Browser local autenticado com mock HTTP temporario apenas para validacao:

- Desktop 1280x900:
  - `data-mockup-mode`: `mockup`
  - `data-mockup-source`: `mockup/`
  - background do shell: `linear-gradient(135deg, rgb(245, 239, 231) 0%, rgb(255, 253, 249) 62%, rgb(248, 232, 227) 100%)`
  - passo ativo: `rgb(89, 28, 33)`
  - passos visiveis: Avaliacao guiada, Historico IA, Recomendacoes, Insights do consultor
- Mobile 390x844:
  - `data-mockup-mode`: `mockup`
  - `data-mockup-source`: `mockup/`
  - background do shell: `linear-gradient(135deg, rgb(245, 239, 231) 0%, rgb(255, 253, 249) 62%, rgb(248, 232, 227) 100%)`
  - passo ativo: `rgb(89, 28, 33)`
  - passos em coluna e painel ativo visiveis sem sobreposicao.

O mock API temporario foi desligado apos a captura. O Vite local ficou ativo em
`http://127.0.0.1:4174/` para inspecao manual.

## Validacoes executadas

Passaram:

- `node --check real_dev/web/src/services/mockupAlignmentChecklist.js`
- `node --check real_dev/web/scripts/check-mf8-mockup-alignment.mjs`
- `node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js`
- `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs`
  - resultado: `6 ficheiros e 18 padroes`
- contrato de evidence positivo com `mode: "mockup"` e referencias locais
- contrato de evidence negativo sem `mode: "mockup"`
  - resultado esperado: rejeitado com `Evidence visual deve usar mode mockup quando mockup/ existe.`
- `npm --prefix real_dev/web run smoke:mf8-assisted-consultation`
  - resultado: `8 ficheiros e 32 contratos`
- `npm --prefix real_dev/web run build`
  - resultado: build Vite concluido
- `npm --prefix real_dev/api test`
  - primeira execucao sandbox: falhou por `listen EPERM: operation not permitted 0.0.0.0`
  - repeticao fora da sandbox: `38 passed (38)`, `269 passed (269)`
- `bash scripts/validate-planificacao.sh`
  - resultado: `overall_pass: true`
- `git diff --check`
  - resultado: sem erros

## Notas de escopo

- Nao foram alterados guias BK, matriz canonica, backlog, prompts ou docs
  canonicos.
- Nao foi feito commit.
- Alteracoes ficaram restritas ao `real_dev` e a este relatorio tecnico.
- Finding P3 historico de `listen EPERM` continua classificado como ruido de
  sandbox, confirmado pela repeticao verde fora da sandbox.
