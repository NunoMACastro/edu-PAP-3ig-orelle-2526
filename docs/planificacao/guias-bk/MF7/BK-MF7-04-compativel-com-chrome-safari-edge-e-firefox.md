# BK-MF7-04 - Compatível com Chrome, Safari, Edge e Firefox

## Header
- `doc_id`: `GUIA-BK-MF7-04`
- `bk_id`: `BK-MF7-04`
- `macro`: `MF7`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF15`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF7-05`
- `guia_path`: `docs/planificacao/guias-bk/MF7/BK-MF7-04-compativel-com-chrome-safari-edge-e-firefox.md`
- `last_updated`: `2026-07-11`

> **Contrato vigente:** a prova automatizada usa Playwright em Chromium, Firefox e WebKit, com Axe, teclado e viewports 320/375/768/1280. Chromium cobre o motor da família Chrome/Edge e WebKit cobre o motor usado por Safari; uma execução automatizada não deve ser apresentada como validação manual das aplicações comerciais que não tenham sido realmente abertas. A evidence atual está no [plano vivo OpenAI](../../PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md).

#### Objetivo

Validar que conta, catálogo, consulta OpenAI, upload, relatório/revisão, pagamento simulado, voucher, privacidade e administração funcionam nos três motores modernos suportados, sem APIs específicas de browser nem UI paralela.

#### Importância

A Orélle combina cookies, CSRF, multipart, polling, downloads, imagens privadas, modais e navegação por teclado. Diferenças de motor podem afetar estes boundaries mesmo quando o build Vite é verde.

#### Scope-in

- Configurar projetos Playwright `chromium`, `firefox` e `webkit`.
- Iniciar API/web/workers numa base E2E efémera e isolada.
- Testar rotas canónicas `/consulta`, `/consulta/nova`, `/consulta/ativa`, `/consulta/relatorios/:reportId`, `/consulta/historico` e `/consultoria/revisoes`.
- Cobrir login, cookies/CSRF, upload, polling/reload, relatório bloqueado e downloads privados.
- Executar Axe, teclado, responsive e budgets definidos.
- Guardar apenas screenshots sintéticos e sanitizados em falha; manter trace e vídeo desligados porque podem persistir cookies ou provas CSRF.

#### Scope-out

- Não criar branches por `userAgent`, vendor ou nome do browser.
- Não considerar WebKit uma prova manual do Safari comercial.
- Não usar a MongoDB principal/remota nem credenciais OpenAI reais.
- Não repetir a viagem destrutiva em paralelo na mesma base.
- Não restaurar páginas antigas de fotografia, análise, recomendação ou preview.

#### Estado antes e depois

- Antes: build e smoke estático não provavam comportamento em motores distintos.
- Depois: uma bateria reproduzível valida journeys, acessibilidade, viewports e estados assíncronos em Chromium/Firefox/WebKit.

#### Pre-requisitos

- `BK-MF5-05` e `BK-MF5-07`: layout responsive e feedback acessível.
- `BK-MF6-01`: jobs retomáveis e polling.
- `BK-MF7-03`: cookies, CSRF e cliente same-origin.
- Runtime E2E com `MongoMemoryReplSet`, workers e catálogo curado.

#### Glossário

- **Motor:** implementação base do browser, como Chromium, Gecko ou WebKit.
- **Journey destrutiva:** cenário que altera dados e exige isolamento/ordem.
- **Axe:** auditoria automática de acessibilidade.
- **Trace:** artefacto Playwright útil para diagnóstico, mas deliberadamente desativado neste projeto por poder conter dados de sessão.
- **Same-origin:** frontend usa `/api`, sem host fixo no bundle.

#### Conceitos teóricos essenciais

Compatibilidade funcional não significa pixel-perfect. O requisito exige que ações, dados, foco e mensagens permaneçam utilizáveis. As diferenças visuais aceitáveis não podem esconder controlos, criar overflow ou impedir teclado.

Os três projetos Playwright exercitam motores diferentes. As journeys destrutivas podem correr apenas no browser de referência para evitar corridas; os outros motores continuam obrigados a cobrir rotas não destrutivas, Axe, teclado e responsive.

#### Arquitetura do BK

- `apps/web/playwright.config.js`: três projetos, base URL loopback, execução serial, screenshots e timeouts.
- `apps/web/tests/e2e/client-journey.spec.js`: percurso cliente/consultor.
- `apps/web/tests/e2e/public-accessibility.spec.js`: páginas públicas e Axe.
- `apps/web/tests/e2e/responsive-keyboard.spec.js`: teclado e viewports.
- `apps/web/tests/e2e/performance.spec.js`: budgets browser.
- `apps/api/scripts/run-e2e.mjs`: base efémera, API, web, workers e teardown.
- `apps/api/scripts/e2e-runtime.core.mjs`: seed curado e isolamento.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/web/playwright.config.js`
- EDITAR: `apps/web/tests/e2e/client-journey.spec.js`
- EDITAR: `apps/web/tests/e2e/public-accessibility.spec.js`
- EDITAR: `apps/web/tests/e2e/responsive-keyboard.spec.js`
- EDITAR: `apps/web/tests/e2e/performance.spec.js`
- EDITAR: `apps/api/scripts/run-e2e.mjs`
- EDITAR: `apps/api/scripts/e2e-runtime.core.mjs`
- REVER: `apps/web/src/features/consultation/`

#### Tutorial técnico linear

### Passo 1 - Mapear journeys e motores

Separa o percurso destrutivo principal das verificações repetíveis. Define o que cada projeto cobre e não marques um browser como aprovado se foi omitido, não arrancou ou terminou com falha.

### Passo 2 - Configurar os três projetos Playwright

Usa devices oficiais e o mesmo `baseURL` validado pelo helper E2E. Mantém um worker, sem paralelismo destrutivo, screenshots apenas em falha e trace/vídeo desligados.

```js
import { defineConfig, devices } from "@playwright/test";
import { getE2EBaseUrl } from "./tests/e2e/helpers/environment.js";

/** Configuração cross-engine da aplicação académica local. */
export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: false,
    workers: 1,
    use: {
        baseURL: getE2EBaseUrl(),
        trace: "off",
        video: "off",
        screenshot: "only-on-failure",
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
    ],
});
```

### Passo 3 - Isolar o runtime E2E

`apps/api/scripts/run-e2e.mjs` cria `MongoMemoryReplSet`, aplica migrations 001–015, cura produtos `aiEligible`, inicia worker IA e worker de ficheiros e só depois abre os browsers. O teardown corre sempre.

### Passo 4 - Cobrir as rotas canónicas da consulta

Testa `/consulta/nova` para objetivos/consentimento/fotos, `/consulta/ativa` para análise/perguntas/retry, `/consulta/relatorios/:reportId` para teaser/revisão/freeze/unlock/voucher/preview e `/consultoria/revisoes` para a role consultor. Redirects temporários não são uma segunda implementação.

### Passo 5 - Validar boundaries Web sensíveis

Confirma cookies `HttpOnly`, `X-CSRF-Token`, `Origin`, `FormData`, `AbortSignal`, respostas `401/403/409`, imagens `no-store`, download e foco depois de navegação/pergunta. Nenhum teste introduz URL absoluta localhost no código publicado.

### Passo 6 - Executar Axe, teclado e responsive

Em cada motor, valida skip-link, um `main`, ordem de foco, modal com focus trap, touch targets e ausência de overflow a 320/375/768/1280. Axe não pode ter violações serious/critical nas rotas principais.

### Passo 7 - Medir performance sem claims falsos

No perfil definido, mede LCP ≤ 3 s, CLS ≤ 0,1, JS inicial comprimido ≤ 200 KiB, thumbnail ≤ 120 KiB e imagem crítica ≤ 300 KiB. Se uma métrica ou browser não correr, regista `SKIP/BLOQUEADO`, não `PASS`.

### Passo 8 - Executar cenários negativos obrigatórios (mínimo 3)

1. Forçar indisponibilidade de um browser e confirmar gate bloqueado, não verde.
2. Simular timeout/401/409 durante a consulta e provar que transcript/conteúdo carregado permanece.
3. Abrir relatório bloqueado e confirmar que o conteúdo integral não existe no DOM.
4. Testar upload sem consentimento/foto inválida e confirmar que a OpenAI não é chamada.
5. Tentar fotografia de revisão sem grant e confirmar 403/404 auditado.

#### Expected results

- Playwright executa Chromium, Firefox e WebKit no mesmo estado de código.
- Rotas OpenAI-only são conduzidas por `flowState` e retomam após reload.
- Relatório bloqueado não contém dados escondidos no HTML.
- Pagamento/voucher continuam exclusivamente simulados.
- Axe, teclado, responsive e budgets produzem evidence separada.
- Browser não executado nunca é convertido em sucesso.

#### Critérios de aceite

- Projetos Chromium/Firefox/WebKit configurados e identificáveis no output.
- Journey crítica, rotas não destrutivas e roles cobertas sem base remota.
- Upload, cookies/CSRF, polling, imagens privadas e downloads testados.
- Zero violações Axe serious/critical nas rotas principais.
- Viewports definidos sem overflow.
- Cenarios negativos concluídos: mínimo `3`.
- Evidencia de testes por camada: contract, build, E2E cross-engine, Axe e performance.

### Matriz mínima de testes por prioridade

| Prioridade | Camada | Prova mínima |
|---|---|---|
| P0 | Contract/build | config, rotas, cliente same-origin e bundle |
| P0 | E2E | Chromium, Firefox e WebKit |
| P0 | Acessibilidade | Axe, teclado, foco e viewports |
| P0 | Negativos | pelo menos três cenários materiais |

#### Validação final

- [ ] Output identifica os três projetos Playwright.
- [ ] Consulta, relatório, revisão e pagamento simulado estão cobertos.
- [ ] Relatório bloqueado não envia conteúdo integral ao browser.
- [ ] Axe/viewports/budgets ficam separados do claim manual de browsers comerciais.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Falhas e skips permanecem visíveis na evidence.

#### Evidence para PR/defesa

Guarda summary Playwright, browsers/projetos executados, skips justificados, Axe, viewports e budgets. Screenshots usam apenas dados sintéticos e não contêm fotografias reais, cookies ou tokens; trace e vídeo permanecem desligados.

#### Handoff

O `BK-MF7-05` reutiliza os mesmos browsers para validar download de PDF autenticado, sem tratar um Blob ou link público como equivalente.

## Bloco pedagogico

### Objetivo

Compreender a diferença entre build, smoke estático, motor automatizado e validação manual de um browser comercial.

### Pre-requisitos

Rever Playwright, async/await, selectors acessíveis, cookies, FormData e foco.

### Erros comuns

- Correr apenas Chromium e declarar quatro browsers.
- Paralelizar journeys destrutivas na mesma base.
- Selecionar elementos por classes visuais frágeis.
- Esconder skips ou ativar traces com dados sensíveis.

### Check de compreensao

1. Por que WebKit não é automaticamente uma prova manual do Safari instalado?
2. Que cenários podem correr nos três motores sem conflito?
3. O que distingue conteúdo bloqueado de conteúdo escondido por CSS?

## Bloco operacional

### Entrada

Build verde, browsers Playwright instalados, portas loopback e runtime E2E isolado.

### Passos

Arrancar runtime, migrar/seedar, executar projetos, recolher Axe/budgets e fazer teardown.

### Validacao

```bash
npm --prefix apps/web run build
npm --prefix apps/api run test:e2e
```

### Handoff

Entregar matriz browser × journey, skips justificados e artefactos sanitizados ao `BK-MF7-05`.

## Criterios de aceite

- Compatibilidade é provada por motores executados, não por intenção.
- Rotas canónicas substituem páginas independentes antigas.
- Cenarios negativos concluidos: minimo `3`.
- Evidencia de testes por camada registada.

## Evidence para PR/defesa

Apresentar o output cross-engine, um cenário de retoma e um bloqueio honesto quando um motor não estiver disponível.

## Snippet tecnico aplicavel

```js
const BK_ID = "BK-MF7-04";
const MIN_NEGATIVOS = 3;

/** Valida evidence cross-engine antes do handoff. */
export function validarEvidenceBkMf704(evidence) {
    const browsers = new Set(evidence?.browsers ?? []);
    const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;
    const engines = ["chromium", "firefox", "webkit"];
    if (evidence?.bkId !== BK_ID || negativos < MIN_NEGATIVOS) {
        throw new Error("Evidence incompleta para BK-MF7-04");
    }
    if (!engines.every((engine) => browsers.has(engine))) {
        throw new Error("Cobertura cross-engine incompleta");
    }
    return true;
}
```

## Changelog

- `2026-07-11`: guia alinhado a Playwright Chromium/Firefox/WebKit, rotas OpenAI-only, Axe, responsive, performance e evidence honesta.
- `2026-07-10`: checklist manual e páginas do fluxo anterior ficaram supersedidos; o histórico permanece nos relatórios datados.
