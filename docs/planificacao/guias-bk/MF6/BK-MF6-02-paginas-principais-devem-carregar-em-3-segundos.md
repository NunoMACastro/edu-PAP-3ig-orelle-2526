# BK-MF6-02 - Páginas principais devem carregar em <= 3 segundos

## Header
- `doc_id`: `GUIA-BK-MF6-02`
- `bk_id`: `BK-MF6-02`
- `macro`: `MF6`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF06`
- `fase_documental`: `Fase 3`
- `sprint`: `S10-S11`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF6-03`
- `guia_path`: `docs/planificacao/guias-bk/MF6/BK-MF6-02-paginas-principais-devem-carregar-em-3-segundos.md`
- `last_updated`: `2026-07-11`

> **Contrato vigente:** `RNF06` é provado no browser por LCP, CLS, Navigation/Resource Timing e bytes realmente transferidos. O frame seguinte ao mount de um componente mede apenas latência local de primeira pintura do wrapper; não é page load nem substitui LCP. O gate usa Playwright/PerformanceObserver, LCP ≤ 3 s, CLS ≤ 0,1 e JS inicial comprimido ≤ 200 KiB.

> **Páginas principais atuais — 2026-07-11:** medir catálogo, carrinho, checkout e as rotas `/consulta`, `/consulta/nova`, `/consulta/ativa`, `/consulta/relatorios/:reportId`, `/consulta/historico` e `/consultoria/revisoes`. Cada rota é carregada com `React.lazy`, só a rota ativa entra no DOM e a transferência é medida por rota. O `App.jsx` inferior que monta `FaceAnalysisPage`, `FaceReportPage`, `ProductRecommendationsPage`, revisão por recomendação ou `BeforeAfterVisualizationPage` é histórico e **não deve ser executado**. Ver [plano canónico da consulta OpenAI](../../PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md).

### Critérios de aceitação ativos

- LCP ≤ 3 s, CLS ≤ 0,1 e JS inicial comprimido ≤ 200 KiB no perfil de teste documentado.
- As métricas usam Navigation/Resource Timing e `PerformanceObserver`, não o frame seguinte ao mount.
- Chunks lazy não visitados não são somados à transferência da rota atual.
- Catálogo e todas as rotas atuais da consulta têm prova Playwright repetível.

<details class="historical-archive">
<summary><strong>Anexo histórico da medição por páginas antigas — não executar</strong></summary>

> Todo o conteúdo restante deste ficheiro, incluindo o `App.jsx` monolítico, wrappers, page keys, scripts, checklists e evidence baseados nas páginas removidas, é arquivo pedagógico e não constitui instrução atual.

#### Objetivo

Neste BK vais criar uma prova de performance no frontend `apps/web` para confirmar em browser que as páginas principais da Orélle atingem LCP até 3 segundos, conforme `RNF06`.

O resultado final é uma prova browser repetível por rota, acompanhada por budgets do bundle e, opcionalmente, um diagnóstico de primeiro frame visível apenas em desenvolvimento, sem recolher dados pessoais, fotografias, relatórios, carrinho, encomendas, cookies ou segredos de sessão.

#### Importância

Performance é parte da confiança. Catálogo lento, análise facial lenta, recomendações lentas ou checkout lento reduzem a probabilidade de o cliente continuar a rotina ou concluir compra. Como `BK-MF6-02` é `CORE-HIBRIDO`, a rapidez protege os dois eixos da Orélle: consultoria inteligente e conversão comercial.

Este BK também ensina uma regra profissional importante: medir não pode quebrar privacidade nem segurança. A app continua a usar sessão por cookie através do cliente API existente, mantém estados de `loading`, `error`, `empty` e `success`, e não transforma métricas técnicas em dados de utilizador.

#### Scope-in

- Definir o orçamento `PAGE_LOAD_BUDGET_MS = 3_000`.
- Definir a lista fechada de páginas principais de `RNF06`.
- Criar helper de avaliação de orçamento.
- Manter, se útil, um hook React de primeiro frame identificado apenas como diagnóstico local.
- Não apresentar o diagnóstico de primeiro frame como prova de carregamento ao utilizador final.
- Criar wrapper medido para as páginas principais existentes.
- Integrar a medição em `apps/web/src/App.jsx`.
- Adicionar estilos em `apps/web/src/styles.css`.
- Criar scripts locais de evidence para helper e assets do build.
- Formalizar pelo menos 3 cenários negativos.

#### Scope-out

- Não instalar ferramenta externa de observabilidade.
- Não enviar métricas para serviços externos.
- Não criar endpoint de métricas neste BK.
- Não alterar autenticação, autorização, consentimento, roles, carrinho, checkout, recomendações ou análise facial.
- Não remover estados de loading/error para parecer mais rápido.
- Não guardar métricas associadas a pessoa, fotografia, relatório, produto comprado, morada, cookie ou segredo de sessão.

#### Estado antes e depois

- Antes: o frontend compila e já contém páginas de catálogo, análise facial, relatório, recomendações, carrinho e checkout, mas não há medição explícita do orçamento de carregamento de `RNF06`.
- Depois: as páginas principais mantêm a UI existente e têm evidence Playwright para LCP/CLS/transferência, além de gates estáticos do bundle; qualquer medição de primeiro frame fica separada e identificada como diagnóstico.

#### Pre-requisitos

- `BK-MF5-05`: layout responsive desktop/mobile.
- `BK-MF5-06`: estilos globais e tokens visuais em `apps/web/src/styles.css`.
- `BK-MF5-07`: mensagens claras e feedback imediato.
- `BK-MF5-08`: contraste/tema sem duplicar componentes.
- `BK-MF6-01`: disciplina de performance e evidence iniciada no backend.
- `RNF06`: páginas principais em até 3 segundos.
- `BK-MF6-03`: próximo BK, que usa estas páginas como base para smoke de 50 utilizadores.

#### Glossário

- Página principal: área de impacto na experiência, como catálogo, análise facial, relatório, recomendações, carrinho ou checkout.
- Performance budget: limite máximo aceitável para uma medição.
- Primeiro frame do componente: diagnóstico local desde o mount até ao frame seguinte; não equivale a LCP ou carregamento da página.
- LCP: momento em que o maior elemento de conteúdo visível foi pintado.
- CLS: soma de mudanças inesperadas de layout sem interação recente.
- Evidence: prova técnica guardada para PR, defesa ou relatório.
- Métrica minimizada: medição técnica sem dados pessoais nem dados sensíveis.
- Wrapper: componente que envolve outro componente para acrescentar comportamento sem alterar a lógica interna.

#### Conceitos teóricos essenciais

Uma página rápida não é apenas uma página com pouco código. O carregamento depende do tamanho do JavaScript, do CSS, do tempo de renderização, das imagens, das chamadas HTTP e do equipamento do utilizador. Por isso, este BK junta três provas: build Vite, tamanho dos assets e medição repetível em browser através de Playwright.

`RNF06` fala de páginas principais. A app final usa routing e code splitting, por isso cada rota é medida após navegação real e conteúdo visível. A lista de rotas é fechada e usa fixtures locais repetíveis.

Medição frontend não substitui segurança backend. Se uma página usa sessão, carrinho, relatório, recomendações ou checkout, a chamada continua a passar pelo cliente API existente. A métrica deste BK fica no browser e só contém `pageKey`, duração, orçamento, estado e label técnico.

`CANONICO`: o limite de 3 segundos vem de `RNF06`; a prioridade `P0` exige evidence forte, incluindo unit, integração/build, smoke/e2e manual e pelo menos 3 negativos.

`DERIVADO`: `PAGE_LOAD_BUDGET_MS`, a lista de rotas, `PerformanceObserver`, o helper Playwright e os scripts de budget são decisões técnicas para aplicar `RNF06`. `usePagePerformance` é opcional e nunca constitui evidence de LCP.

#### Arquitetura do BK

- `apps/web/src/utils/performance-budget.js`: define páginas principais, orçamento e avaliação `ok`/`slow`/`ignored`.
- `apps/web/src/hooks/usePagePerformance.js`: diagnóstico opcional de primeiro frame, sem alegação RNF06.
- `apps/web/tests/e2e/helpers/performance.js`: recolhe LCP, CLS, navigation e transferências.
- `apps/web/tests/e2e/performance.spec.js`: aplica budgets em browser.
- `apps/web/src/components/MeasuredPageSection.jsx`: envolve páginas principais e liga hook, aviso e conteúdo.
- `apps/web/src/App.jsx`: integra o wrapper nas páginas principais.
- `apps/web/src/styles.css`: estiliza o wrapper e os estados de performance.
- `apps/web/scripts/check-mf6-performance-unit.mjs`: valida o helper sem depender de browser.
- `apps/web/scripts/check-mf6-page-budget.mjs`: valida que o build existe e lista assets principais usando paths seguros.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/web/src/utils/performance-budget.js`
- CRIAR: `apps/web/src/hooks/usePagePerformance.js`
- CRIAR: `apps/web/src/components/PagePerformanceNotice.jsx`
- CRIAR: `apps/web/src/components/MeasuredPageSection.jsx`
- EDITAR: `apps/web/src/App.jsx`
- EDITAR: `apps/web/src/styles.css`
- CRIAR: `apps/web/scripts/check-mf6-performance-unit.mjs`
- CRIAR: `apps/web/scripts/check-mf6-page-budget.mjs`
- CRIAR: `apps/web/tests/e2e/helpers/performance.js`
- CRIAR: `apps/web/tests/e2e/performance.spec.js`
- REVER: `apps/web/src/services/apiClient.js`
- REVER: `apps/web/package.json`

#### Tutorial técnico linear

### Passo 1 - Confirmar o contrato RNF06 e as páginas principais

1. Objetivo funcional do passo no contexto da app.

Confirmar que `RNF06` mede páginas principais e que este BK não pode remover segurança, estados de UI ou chamadas reais só para obter um número melhor.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
    - REVER: `apps/web/src/App.jsx`
    - LOCALIZAÇÃO: entradas `RNF06`, `BK-MF6-02` e pilha de páginas no `App.jsx`.

3. Instruções do que fazer.

Regista que as páginas principais deste BK são `catalog`, `face-analysis`, `face-report`, `recommendations`, `cart` e `checkout`. Estas áreas já existem no frontend e ligam partes importantes da experiência: descoberta, análise, recomendação e compra.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Este passo não cria código porque fixa a fronteira do requisito. Antes de medir, tens de saber exatamente o que entra na medição e o que continua fora do escopo.

6. Validação do passo.

Confirma que consegues apontar no `App.jsx` as páginas `ProductSearchPage`, `FaceAnalysisPage`, `FaceReportPage`, `ProductRecommendationsPage`, `CartPage` e `CheckoutPage`.

7. Cenário negativo/erro esperado.

Se medires apenas a navegação inicial do documento e ignorares as áreas principais, podes ter uma app aparentemente rápida e uma página crítica lenta. Isso não fecha `RNF06`.

### Passo 2 - Criar helper de orçamento e lista fechada de páginas

1. Objetivo funcional do passo no contexto da app.

Centralizar o limite de 3 segundos e impedir que cada componente invente nomes ou regras de performance diferentes.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/utils/performance-budget.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Mantém a lista pequena e explícita. Não coloques nesta lista emails, ids reais, fotografias, produtos comprados, moradas ou qualquer outro dado de utilizador.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/src/utils/performance-budget.js
export const PAGE_LOAD_BUDGET_MS = 3_000;

export const MAIN_PAGE_DEFINITIONS = Object.freeze([
    { key: "catalog", label: "Catálogo" },
    { key: "face-analysis", label: "Análise facial" },
    { key: "face-report", label: "Relatório facial" },
    { key: "recommendations", label: "Recomendações" },
    { key: "cart", label: "Carrinho" },
    { key: "checkout", label: "Checkout" },
]);

export const MAIN_PAGE_KEYS = Object.freeze(
    MAIN_PAGE_DEFINITIONS.map((definition) => definition.key),
);

/**
 * Procura a definição técnica de uma página principal.
 *
 * @function getMainPageDefinition
 * @param {string} pageKey - Chave técnica da página medida.
 * @returns {{key: string, label: string}|null} Definição encontrada ou null.
 */
export function getMainPageDefinition(pageKey) {
    return MAIN_PAGE_DEFINITIONS.find((definition) => definition.key === pageKey) ?? null;
}

/**
 * Avalia se uma medição respeita o orçamento de RNF06.
 *
 * @function evaluatePageLoadBudget
 * @param {{pageKey: string, loadMs: number}} input - Página medida e duração observada.
 * @returns {{pageKey: string, pageLabel: string, loadMs: number, budgetMs: number, status: "ok"|"slow"|"ignored"}} Resultado minimizado para UI e evidence.
 */
export function evaluatePageLoadBudget({ pageKey, loadMs }) {
    const definition = getMainPageDefinition(pageKey);
    const safeLoadMs = Number.isFinite(loadMs) ? Math.max(0, Math.round(loadMs)) : 0;

    if (!definition) {
        // Chaves desconhecidas são ignoradas para evitar falsos alertas em páginas fora do RNF06.
        return {
            pageKey,
            pageLabel: "Página fora do orçamento RNF06",
            loadMs: safeLoadMs,
            budgetMs: PAGE_LOAD_BUDGET_MS,
            status: "ignored",
        };
    }

    return {
        pageKey: definition.key,
        pageLabel: definition.label,
        loadMs: safeLoadMs,
        budgetMs: PAGE_LOAD_BUDGET_MS,
        status: safeLoadMs <= PAGE_LOAD_BUDGET_MS ? "ok" : "slow",
    };
}
```

5. Explicação do código.

`PAGE_LOAD_BUDGET_MS` traduz `RNF06` para número. `MAIN_PAGE_DEFINITIONS` cria uma lista fechada, para que a equipa meça sempre as mesmas áreas. `evaluatePageLoadBudget` devolve apenas dados técnicos: chave, label, duração, orçamento e estado. Isto evita associar a métrica a pessoas, fotografias, relatórios, carrinho ou encomendas.

6. Validação do passo.

Confirma mentalmente estes três casos: `catalog` com `2500` ms devolve `ok`; `checkout` com `3200` ms devolve `slow`; `admin` devolve `ignored`.

7. Cenário negativo/erro esperado.

Uma chave fora da lista não deve rebentar a app. Deve devolver `ignored`, porque a página não faz parte do contrato deste BK.

### Passo 3 - Criar diagnóstico opcional de primeiro frame

1. Objetivo funcional do passo no contexto da app.

Medir apenas quanto tempo demora o wrapper a chegar ao frame seguinte, sem confundir esta leitura com page load, LCP ou evidence de `RNF06`.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/hooks/usePagePerformance.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Se mantiveres o hook, usa `performance.now()` e `requestAnimationFrame`, chama-lhe explicitamente diagnóstico de primeiro frame e não o uses para decidir se `RNF06` passou. A prova real será feita no Passo 8 com PerformanceObserver e Playwright.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/src/hooks/usePagePerformance.js
import { useEffect, useState } from "react";
import { evaluatePageLoadBudget } from "../utils/performance-budget.js";

/**
 * Lê um relógio seguro para medição local no browser.
 *
 * @function readPerformanceClock
 * @returns {number} Tempo atual em milissegundos.
 */
function readPerformanceClock() {
    if (typeof window !== "undefined" && window.performance?.now) {
        return window.performance.now();
    }

    return Date.now();
}

/**
 * Mede um diagnóstico local de primeiro frame; não mede LCP/page load.
 *
 * @function usePagePerformance
 * @param {string} pageKey - Chave técnica da página principal.
 * @returns {{pageKey: string, pageLabel: string, loadMs: number, budgetMs: number, status: string}|null} Métrica local minimizada.
 */
export function usePagePerformance(pageKey) {
    const [metric, setMetric] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const startedAt = readPerformanceClock();

        const frameId = window.requestAnimationFrame(() => {
            const renderedAt = readPerformanceClock();
            const loadMs = renderedAt - startedAt;

            // A métrica fica local e mede a área técnica, não a pessoa autenticada.
            if (!cancelled) {
                setMetric(evaluatePageLoadBudget({ pageKey, loadMs }));
            }
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frameId);
        };
    }, [pageKey]);

    return metric;
}
```

5. Explicação do código.

O hook mede o tempo entre o mount do wrapper e o frame seguinte. Esta leitura pode ajudar a diagnosticar regressões de render, mas normalmente será muito inferior ao tempo percebido porque ignora navegação, downloads, imagens e conteúdo assíncrono. O cleanup evita estado atualizado fora de tempo; o hook não fecha `RNF06`.

6. Validação do passo.

Ao usar `usePagePerformance("catalog")`, a métrica deve começar como `null` e depois passar para um objeto com `loadMs`, `budgetMs` e `status`.

7. Cenário negativo/erro esperado.

Se a página for desmontada antes de o frame correr, o hook não deve chamar `setMetric` depois do cleanup.

### Passo 4 - Manter o diagnóstico fora da UI publicada

1. Objetivo funcional do passo no contexto da app.

Disponibilizar o diagnóstico apenas em desenvolvimento, sem o apresentar como estado de produto nem evidence de `RNF06`.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/components/PagePerformanceNotice.jsx`
    - CRIAR: `apps/web/src/components/MeasuredPageSection.jsx`
    - LOCALIZAÇÃO: ficheiros completos.

3. Instruções do que fazer.

Cria primeiro o aviso técnico protegido por `import.meta.env.DEV` e depois o wrapper. O wrapper pode expor `data-mf6-page` para testes, mas o aviso não aparece no build publicado.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/components/PagePerformanceNotice.jsx

/**
 * Mostra apenas um diagnóstico de primeiro frame em desenvolvimento.
 *
 * @function PagePerformanceNotice
 * @param {{metric: {pageLabel: string, loadMs: number, budgetMs: number, status: string}|null}} props - Métrica minimizada.
 * @returns {JSX.Element|null} Aviso técnico discreto.
 */
export function PagePerformanceNotice({ metric }) {
    if (!import.meta.env.DEV || !metric || metric.status === "ignored") {
        return null;
    }

    const isSlow = metric.status === "slow";
    const statusClassName = isSlow
        ? "mf6-performance mf6-performance--slow"
        : "mf6-performance mf6-performance--ok";

    return (
        <p className={statusClassName} role="status">
            <strong>{metric.pageLabel}</strong>:{" "}
            {isSlow
                ? `diagnóstico de primeiro frame lento (${metric.loadMs} ms).`
                : `diagnóstico de primeiro frame (${metric.loadMs} ms).`}
        </p>
    );
}
```

```jsx
// apps/web/src/components/MeasuredPageSection.jsx
import { usePagePerformance } from "../hooks/usePagePerformance.js";
import { getMainPageDefinition } from "../utils/performance-budget.js";
import { PagePerformanceNotice } from "./PagePerformanceNotice.jsx";

/**
 * Envolve uma página principal com diagnóstico opcional e seletor de teste.
 *
 * @function MeasuredPageSection
 * @param {{pageKey: string, children: import("react").ReactNode}} props - Página técnica e conteúdo React.
 * @returns {JSX.Element} Secção identificável por testes, sem alterar o conteúdo.
 */
export function MeasuredPageSection({ pageKey, children }) {
    const metric = usePagePerformance(pageKey);
    const definition = getMainPageDefinition(pageKey);
    const label = definition?.label ?? pageKey;

    return (
        <div className="mf6-page-measure" data-mf6-page={pageKey}>
            {/* O aviso é DEV-only; a evidence RNF06 vem do Playwright. */}
            <PagePerformanceNotice metric={metric} />
            <div className="mf6-page-measure__content" aria-label={`Área medida: ${label}`}>
                {children}
            </div>
        </div>
    );
}
```

5. Explicação do código.

`PagePerformanceNotice` só existe em desenvolvimento e identifica explicitamente a leitura como primeiro frame. `MeasuredPageSection` mantém `data-mf6-page` para seletores de teste sem alterar regras de carrinho, recomendações, sessão ou checkout. A evidence de performance continua exclusivamente no browser E2E.

6. Validação do passo.

Em desenvolvimento, o wrapper pode mostrar o diagnóstico. Num build/preview publicado, `data-mf6-page="catalog"` permanece para teste e não existe aviso técnico visível.

7. Cenário negativo/erro esperado.

Se passares `pageKey="admin"`, o helper devolve `ignored` e o aviso não aparece.

### Passo 5 - Integrar a medição no App.jsx

1. Objetivo funcional do passo no contexto da app.

Ligar a medição às páginas principais reais, mantendo o resto da pilha de páginas sem alterações funcionais.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/App.jsx`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o ficheiro por esta versão completa. A alteração importante é importar `MeasuredPageSection` e envolver as seis páginas principais. Repara que o texto do cabeçalho é neutro e não usa nomes de pastas privadas.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/App.jsx
/**
 * Composição principal do frontend Orélle.
 *
 * Os guias ainda não introduzem routing final. Por isso, o App expõe as páginas
 * criadas pelos BKs em sequência e mede as áreas principais exigidas por RNF06.
 */
import React, { useState } from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import { MeasuredPageSection } from "./components/MeasuredPageSection.jsx";
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage.jsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.jsx";
import { AdminExportsPage } from "./pages/AdminExportsPage.jsx";
import { AdminNotificationsPage } from "./pages/AdminNotificationsPage.jsx";
import { AdminProductCreatePage } from "./pages/AdminProductCreatePage.jsx";
import { AdminReviewsPage } from "./pages/AdminReviewsPage.jsx";
import { AdminUsersPage } from "./pages/AdminUsersPage.jsx";
import { BeforeAfterVisualizationPage } from "./pages/BeforeAfterVisualizationPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import { CheckoutPage } from "./pages/CheckoutPage.jsx";
import { ConsultantRecommendationReviewPage } from "./pages/ConsultantRecommendationReviewPage.jsx";
import { DailyRoutinePage } from "./pages/DailyRoutinePage.jsx";
import { EditProfilePage } from "./pages/EditProfilePage.jsx";
import { FaceAnalysisPage } from "./pages/FaceAnalysisPage.jsx";
import { FacePhotoUploadPage } from "./pages/FacePhotoUploadPage.jsx";
import { FaceReportPage } from "./pages/FaceReportPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { MakeupSimulationPage } from "./pages/MakeupSimulationPage.jsx";
import { NotificationsPage } from "./pages/NotificationsPage.jsx";
import { PreferencesPage } from "./pages/PreferencesPage.jsx";
import { ProductDetailsPage } from "./pages/ProductDetailsPage.jsx";
import { ProductRecommendationsPage } from "./pages/ProductRecommendationsPage.jsx";
import { ProductReviewPage } from "./pages/ProductReviewPage.jsx";
import { ProductSearchPage } from "./pages/ProductSearchPage.jsx";
import { ProfileSetupPage } from "./pages/ProfileSetupPage.jsx";
import { PurchaseHistoryPage } from "./pages/PurchaseHistoryPage.jsx";
import { RelatedProductsPage } from "./pages/RelatedProductsPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { RoutineAlertsPage } from "./pages/RoutineAlertsPage.jsx";
import { SkinComparisonPage } from "./pages/SkinComparisonPage.jsx";
import { SkinEvolutionPage } from "./pages/SkinEvolutionPage.jsx";
import { SkinHistoryPage } from "./pages/SkinHistoryPage.jsx";
import { StockAdminPage } from "./pages/StockAdminPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

/**
 * Conteúdo da aplicação com acesso ao estado autenticado.
 *
 * @function AppContent
 * @returns {JSX.Element} Páginas da Orélle com medição RNF06 nas áreas principais.
 */
function AppContent() {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [latestMakeupSimulation, setLatestMakeupSimulation] = useState(null);
    const isAdmin = user?.role === "administrador";
    const canReviewRecommendations =
        user?.role === "consultor" || user?.role === "administrador";

    return (
        <div className="app-shell">
            <header className="app-header">
                <div>
                    <p className="app-kicker">PAP 2025/2026</p>
                    <h1>Orélle</h1>
                </div>
                {user && (
                    <p className="session-pill">
                        {user.email} · {user.role}
                    </p>
                )}
            </header>

            <div className="page-stack">
                <RegisterPage />
                <LoginPage />
                <ProfileSetupPage />
                <EditProfilePage />
                <PreferencesPage />
                <MeasuredPageSection pageKey="catalog">
                    <ProductSearchPage />
                </MeasuredPageSection>
                <ProductDetailsPage />
                <ProductReviewPage />
                <RelatedProductsPage />
                <FacePhotoUploadPage />
                <MeasuredPageSection pageKey="face-analysis">
                    <FaceAnalysisPage />
                </MeasuredPageSection>
                <MeasuredPageSection pageKey="face-report">
                    <FaceReportPage />
                </MeasuredPageSection>
                <SkinHistoryPage />
                <SkinEvolutionPage />
                <MeasuredPageSection pageKey="recommendations">
                    <ProductRecommendationsPage
                        onRecommendationsChange={setRecommendations}
                    />
                </MeasuredPageSection>
                <DailyRoutinePage />
                <MakeupSimulationPage
                    onSimulationCreated={setLatestMakeupSimulation}
                />
                <BeforeAfterVisualizationPage simulation={latestMakeupSimulation} />
                <SkinComparisonPage />
                <MeasuredPageSection pageKey="cart">
                    <CartPage />
                </MeasuredPageSection>
                <MeasuredPageSection pageKey="checkout">
                    <CheckoutPage />
                </MeasuredPageSection>
                <PurchaseHistoryPage />
                <NotificationsPage />
                <RoutineAlertsPage />
                {canReviewRecommendations && (
                    <ConsultantRecommendationReviewPage
                        recommendations={recommendations}
                    />
                )}
                {isAdmin && (
                    <>
                        <AdminProductCreatePage />
                        <AdminCategoriesPage />
                        <AdminUsersPage />
                        <AdminReviewsPage />
                        <AdminExportsPage />
                        <AdminNotificationsPage />
                        <AdminDashboardPage />
                        <StockAdminPage />
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * Renderiza a aplicação Orélle.
 *
 * @function App
 * @returns {JSX.Element} Aplicação React com contexto de autenticação.
 */
export function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
```

5. Explicação do código.

O `App.jsx` continua a usar as páginas existentes. A diferença é que as seis áreas principais ficam embrulhadas por `MeasuredPageSection`. Isto dá uma medição por área sem alterar os services, sem mexer em cookies e sem mudar o comportamento de catálogo, análise, relatório, recomendações, carrinho ou checkout.

6. Validação do passo.

Executa a app e confirma no HTML que existem seis elementos com `data-mf6-page`: `catalog`, `face-analysis`, `face-report`, `recommendations`, `cart` e `checkout`.

7. Cenário negativo/erro esperado.

Se esqueceres uma das seis páginas principais, a evidence de `RNF06` fica incompleta e `BK-MF6-03` perde uma base clara para o smoke de concorrência.

### Passo 6 - Adicionar estilos de performance

1. Objetivo funcional do passo no contexto da app.

Garantir que o aviso técnico é legível, discreto, responsive e coerente com os estilos globais da Orélle.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/styles.css`
    - LOCALIZAÇÃO: acrescentar o bloco antes do `@media (max-width: 860px)`.

3. Instruções do que fazer.

Acrescenta o bloco abaixo ao ficheiro de estilos existente. Não cries `App.css`, porque o projeto já usa `styles.css`.

4. Código completo, correto e integrado com a app final.

```css
/* apps/web/src/styles.css */
.page-stack > .mf6-page-measure {
    min-width: 0;
    border: 1px solid rgb(236 214 220 / 92%);
    border-radius: 0.5rem;
    padding: 1.2rem;
    background: rgb(255 255 255 / 88%);
    box-shadow: var(--shadow);
    backdrop-filter: blur(14px);
}

.mf6-page-measure:nth-child(6),
.mf6-page-measure:nth-child(n + 11) {
    grid-column: 1 / -1;
}

.mf6-page-measure__content > main,
.mf6-page-measure__content > section {
    /* A página interna mantém a sua semântica, mas o cartão visual fica no wrapper medido. */
    border: 0;
    padding: 0;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
}

.mf6-performance {
    margin: 0 0 0.85rem;
    border: 1px solid var(--line);
    border-left-width: 0.35rem;
    border-radius: 0.5rem;
    padding: 0.7rem 0.85rem;
    font-size: 0.9rem;
}

.mf6-performance--ok {
    border-left-color: #2f7d51;
    color: #24583c;
    background: #eefaf2;
}

.mf6-performance--slow {
    /* O aviso lento é claro, mas não bloqueia o fluxo principal do cliente. */
    border-left-color: var(--wine);
    color: var(--bordo-dark);
    background: var(--blush);
}
```

5. Explicação do código.

O wrapper recebe o mesmo padrão visual dos cartões existentes para não quebrar a grelha. O conteúdo interno perde borda e sombra para evitar duplicação visual. Os estados `ok` e `slow` usam cor e texto, não apenas cor, para manter acessibilidade.

6. Validação do passo.

Abre a app em desktop e mobile. As páginas medidas devem continuar alinhadas na grelha, e o aviso deve aparecer dentro do cartão correspondente.

7. Cenário negativo/erro esperado.

Se o aviso lento aparecer, a página continua utilizável. Não se deve esconder catálogo, análise, recomendações ou checkout por causa da medição.

### Passo 7 - Criar scripts de testes e assets

1. Objetivo funcional do passo no contexto da app.

Dar gates estáticos complementares à prova de browser: um script unitário para o helper e um script de assets após build.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/scripts/check-mf6-performance-unit.mjs`
    - CRIAR: `apps/web/scripts/check-mf6-page-budget.mjs`
    - LOCALIZAÇÃO: ficheiros completos.

3. Instruções do que fazer.

Cria os dois scripts. O primeiro valida regras puras de JavaScript. O segundo usa `fileURLToPath`, não `URL.pathname`, para funcionar em caminhos com espaços.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/scripts/check-mf6-performance-unit.mjs
import assert from "node:assert/strict";
import {
    evaluatePageLoadBudget,
    MAIN_PAGE_KEYS,
    PAGE_LOAD_BUDGET_MS,
} from "../src/utils/performance-budget.js";

assert.equal(PAGE_LOAD_BUDGET_MS, 3_000);
assert.deepEqual(MAIN_PAGE_KEYS, [
    "catalog",
    "face-analysis",
    "face-report",
    "recommendations",
    "cart",
    "checkout",
]);

// Estes asserts provam os três estados técnicos sem usar dados reais de clientes.
assert.equal(
    evaluatePageLoadBudget({ pageKey: "catalog", loadMs: 2_500 }).status,
    "ok",
);
assert.equal(
    evaluatePageLoadBudget({ pageKey: "checkout", loadMs: 3_200 }).status,
    "slow",
);
assert.equal(
    evaluatePageLoadBudget({ pageKey: "admin", loadMs: 100 }).status,
    "ignored",
);

console.log("BK-MF6-02 unit checks passed");
```

```js
// apps/web/scripts/check-mf6-page-budget.mjs
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const distAssetsDir = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const MAX_INITIAL_JS_GZIP_BYTES = 200 * 1024;

if (!existsSync(distAssetsDir)) {
    throw new Error("Executa primeiro: npm --prefix apps/web run build");
}

const assets = readdirSync(distAssetsDir)
    .map((name) => {
        const fullPath = join(distAssetsDir, name);
        return { name, bytes: statSync(fullPath).size };
    })
    .sort((left, right) => right.bytes - left.bytes);

const jsAssets = assets.filter((asset) => asset.name.endsWith(".js"));
const initialJsAssets = jsAssets.filter((asset) =>
    /^index-[^.]+\.js$/.test(asset.name),
);

// O script mede ficheiros gerados pelo build e não lê sessão, fotografias ou dados pessoais.
console.table(assets);

if (initialJsAssets.length !== 1) {
    throw new Error(`Esperado um entry JS inicial; encontrados ${initialJsAssets.length}`);
}

const initialJsPath = join(distAssetsDir, initialJsAssets[0].name);
const initialJsGzipBytes = gzipSync(readFileSync(initialJsPath)).byteLength;

if (initialJsGzipBytes > MAX_INITIAL_JS_GZIP_BYTES) {
    throw new Error(
        `JS inicial excede ${MAX_INITIAL_JS_GZIP_BYTES} bytes gzip: ${initialJsGzipBytes}`,
    );
}

console.log(`BK-MF6-02 asset checks passed: ${initialJsGzipBytes} bytes gzip`);
```

5. Explicação do código.

O script unitário fecha apenas o comportamento do helper diagnóstico. O script de assets valida que o build existe, usa `fileURLToPath` e mede o entry JS comprimido com gzip. O limite de 200 KiB é um gate real do bundle, mas não substitui LCP/CLS e transferência medidos no browser.

6. Validação do passo.

Executa:

```bash
node apps/web/scripts/check-mf6-performance-unit.mjs
npm --prefix apps/web run build
node apps/web/scripts/check-mf6-page-budget.mjs
```

7. Cenário negativo/erro esperado.

Sem `dist/assets`, o script de assets falha com a instrução para executar build. Com uma página fora da lista, o script unitário espera `ignored`.

### Passo 8 - Medir LCP, CLS e transferência com Playwright

1. Objetivo funcional do passo no contexto da app.

Fechar `RNF06` com métricas browser reais que um professor ou colega consegue repetir.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/tests/e2e/helpers/performance.js`
    - CRIAR: `apps/web/tests/e2e/performance.spec.js`
    - REVER: `apps/web/scripts/check-mf6-page-budget.mjs`
    - LOCALIZAÇÃO: ficheiros completos.

3. Instruções do que fazer.

Instala os observers antes de navegar, espera pelo conteúdo real e recolhe LCP, CLS, JS e transferência. LCP/CLS são medidos em Chromium porque as APIs não têm suporte equivalente em todos os engines; os restantes fluxos E2E continuam multi-engine. Se uma rota falhar o budget, regista o valor e corrige a causa.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/tests/e2e/helpers/performance.js
export const PERFORMANCE_BUDGETS = Object.freeze({
    lcpMs: 3_000,
    cls: 0.1,
    initialJavascriptBytes: 200 * 1024,
    totalPageTransferBytes: 2 * 1024 * 1024,
});

export async function installPerformanceObservers(page) {
    await page.addInitScript(() => {
        const supported = new Set(
            globalThis.PerformanceObserver?.supportedEntryTypes ?? [],
        );
        globalThis.__orellePerformance = {
            lcp: 0,
            cls: 0,
            supportsLcp: supported.has("largest-contentful-paint"),
            supportsCls: supported.has("layout-shift"),
        };

        if (globalThis.__orellePerformance.supportsLcp) {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    globalThis.__orellePerformance.lcp = Math.max(
                        globalThis.__orellePerformance.lcp,
                        entry.renderTime || entry.loadTime || entry.startTime || 0,
                    );
                }
            }).observe({ type: "largest-contentful-paint", buffered: true });
        }

        if (globalThis.__orellePerformance.supportsCls) {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        globalThis.__orellePerformance.cls += entry.value;
                    }
                }
            }).observe({ type: "layout-shift", buffered: true });
        }
    });
}

export async function collectPerformanceMetrics(page) {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(750);

    return page.evaluate(() => {
        const bytes = (entry) =>
            Number(entry.transferSize || entry.encodedBodySize || 0);
        const resources = performance.getEntriesByType("resource");
        const navigation = performance.getEntriesByType("navigation")[0];
        const scripts = resources.filter((entry) =>
            entry.initiatorType === "script" || /\.js$/i.test(entry.name),
        );

        return {
            lcpMs: globalThis.__orellePerformance?.lcp ?? 0,
            cls: globalThis.__orellePerformance?.cls ?? 0,
            supportsLcp: globalThis.__orellePerformance?.supportsLcp === true,
            supportsCls: globalThis.__orellePerformance?.supportsCls === true,
            initialJavascriptBytes: scripts.reduce(
                (total, entry) => total + bytes(entry),
                0,
            ),
            totalPageTransferBytes:
                bytes(navigation ?? {}) +
                resources.reduce((total, entry) => total + bytes(entry), 0),
        };
    });
}
```

```js
// apps/web/tests/e2e/performance.spec.js
import { expect, test } from "@playwright/test";
import {
    collectPerformanceMetrics,
    installPerformanceObservers,
    PERFORMANCE_BUDGETS,
} from "./helpers/performance.js";

for (const path of ["/", "/produtos"]) {
    test(`budgets reais em ${path}`, async ({ page, browserName }) => {
        test.skip(
            browserName !== "chromium",
            "LCP/CLS não têm suporte equivalente nos três engines",
        );

        await installPerformanceObservers(page);
        await page.goto(path);
        await expect(page.locator("main")).toBeVisible();
        const metrics = await collectPerformanceMetrics(page);

        expect(metrics.supportsLcp).toBe(true);
        expect(metrics.supportsCls).toBe(true);
        expect(metrics.lcpMs).toBeGreaterThan(0);
        expect(metrics.lcpMs).toBeLessThanOrEqual(PERFORMANCE_BUDGETS.lcpMs);
        expect(metrics.cls).toBeLessThanOrEqual(PERFORMANCE_BUDGETS.cls);
        expect(metrics.initialJavascriptBytes).toBeLessThanOrEqual(
            PERFORMANCE_BUDGETS.initialJavascriptBytes,
        );
        expect(metrics.totalPageTransferBytes).toBeLessThanOrEqual(
            PERFORMANCE_BUDGETS.totalPageTransferBytes,
        );
    });
}
```

5. Explicação do código.

Os observers são instalados antes da navegação, por isso capturam as entradas buffered da página real. `networkidle` e uma janela curta permitem estabilizar conteúdo assíncrono. A evidence contém apenas métricas agregadas; paths completos, cookies e payloads não são serializados.

6. Validação do passo.

Regista evidence com:

- output de `node apps/web/scripts/check-mf6-performance-unit.mjs`;
- output de `npm --prefix apps/web run build`;
- output de `node apps/web/scripts/check-mf6-page-budget.mjs`;
- output de `npm --prefix apps/web run test:e2e -- performance.spec.js`;
- LCP, CLS, JS e transferência por rota/perfil, sem PII;
- expansão das rotas autenticadas com fixtures locais quando estiverem disponíveis.

7. Cenário negativo/erro esperado.

Fecha no mínimo estes negativos:

- `pageKey` fora de `MAIN_PAGE_DEFINITIONS` devolve `ignored`;
- LCP acima de `3_000`, CLS acima de `0,1` ou transferência acima do budget faz o E2E falhar;
- `dist/assets` ausente faz o script falhar com mensagem clara;
- os avisos não apresentam email, fotografia, relatório, produto comprado, morada, cookie ou segredo de sessão.

#### Expected results

- `PAGE_LOAD_BUDGET_MS` está fixo em `3_000`.
- As seis páginas principais têm `data-mf6-page`.
- O diagnóstico de primeiro frame, quando mantido, só aparece em desenvolvimento e não decide o gate.
- O script unitário passa.
- O build Vite passa.
- O script de assets mede o entry JS gzip e não falha em caminhos com espaços.
- O Playwright recolhe LCP/CLS/transferência real e aplica os budgets.
- A app mantém sessão, estados de loading/error e chamadas API existentes.
- Nenhuma métrica inclui dados pessoais, biométricos, comerciais sensíveis, cookies ou segredos de sessão.

#### Critérios de aceite

- O guia tem pelo menos 8 passos e pelo menos 3 negativos.
- A medição usa navegação real, PerformanceObserver e Resource Timing; o frame seguinte ao mount fica apenas como diagnóstico.
- `apps/web/src/App.jsx` mostra integração completa com as páginas principais reais.
- `apps/web/src/styles.css` contém estilos para `mf6-performance` e `mf6-page-measure`.
- Existe evidence unitária, integração/build, bundle gzip e Playwright browser.
- `BK-MF6-03` consegue reutilizar as páginas principais medidas como base para teste de concorrência.
- Playwright é dependência de teste justificada para medir o browser; não é enviado no bundle de produção.

#### Validação final

```bash
node apps/web/scripts/check-mf6-performance-unit.mjs
npm --prefix apps/web run build
node apps/web/scripts/check-mf6-page-budget.mjs
npm --prefix apps/web run test:e2e -- performance.spec.js
bash scripts/validate-planificacao.sh
```

#### Evidence para PR/defesa

- `proof_unit`: output de `node apps/web/scripts/check-mf6-performance-unit.mjs`.
- `proof_integration`: output de `npm --prefix apps/web run build`.
- `proof_assets`: tabela de assets de `node apps/web/scripts/check-mf6-page-budget.mjs`.
- `proof_e2e`: LCP, CLS, JS e transferência observados por Playwright.
- `proof_negativos`: rota fora da lista, LCP/CLS/transferência acima do budget, build ausente e ausência de dados sensíveis.
- `proof_core_dual`: catálogo, análise, recomendações, carrinho e checkout continuam acessíveis e medidos.

#### Handoff

`BK-MF6-03` deve usar as páginas principais medidas aqui como base de smoke. O script de concorrência desse BK não deve remover autenticação nem chamar endpoints protegidos sem sessão; deve separar health check público de fluxos autenticados.

#### Changelog

- `2026-07-10`: prova RNF06 migrada para LCP/CLS/Resource Timing em Playwright; primeiro frame ficou apenas diagnóstico DEV e JS inicial passou a budget gzip de 200 KiB.
- `2026-06-23`: guia corrigido para o contrato ativo: 8 passos, medição por área React, integração completa em `App.jsx`, CSS, scripts de evidence, correção de paths com `fileURLToPath` e negativos P0.

## Suplemento de validacao documental
Este suplemento fecha lacunas formais detetadas pelo validador de planificacao sem alterar o contrato funcional original do guia.

## Bloco pedagogico
### Objetivo
O aluno deve completar `Páginas principais devem carregar em ≤ 3 segundos.` com rastreabilidade direta a `RNF06`, mantendo evidence objetiva, negativos por prioridade e handoff claro.

### Pre-requisitos
- Rever `RNF06` nos documentos RF/RNF aplicáveis.
- Confirmar dependencias declaradas: `-`.
- Consultar `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md` e o guia atual antes de implementar.

### Erros comuns
- Fechar o BK sem negativos minimos por prioridade.
- Alterar comportamento sem alinhar matriz, backlog, anexos e guia.
- Registar evidence sem output, screenshot, request/response ou teste verificavel.

### Check de compreensao
- [ ] Sei explicar o objetivo do BK e o requisito associado.
- [ ] Sei quais sao entradas, saidas, dependencias e criterio de sucesso.
- [ ] Sei executar o smoke principal e os negativos obrigatorios.

## Bloco operacional
### Entrada
- BK: `BK-MF6-02`
- Requisito: `RNF06`
- Dependencias: `-`
- Sprint: `S10-S11`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF6-02` e do requisito `RNF06`.
2. Validar pre-condicoes e dependencias declaradas (`-`).
3. Rever ficheiros reais ligados ao BK e identificar o fluxo principal.
4. Consolidar contrato de entrada/saida com validacao, ownership e erros controlados.
5. Executar smoke test do caminho principal e validar integracao com BKs adjacentes.
6. Registar evidencia tecnica objetiva antes do handoff.
7. Executar cenarios negativos obrigatorios (minimo 3) e registar o resultado.
8. Reexecutar validacao afetada e guardar evidence final para defesa/PR.

### Validacao
- [ ] Smoke: fluxo principal executa sem erro bloqueante.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: metadados alinhados entre guia, backlog, matriz e anexos.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF6-03`
- Registar riscos, dependencias pendentes e validacoes executadas antes do fecho.

## Criterios de aceite
- Entrega funcional especifica de `Páginas principais devem carregar em ≤ 3 segundos.` validada contra `RNF06`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Metadados do guia alinhados com matriz, backlog e anexos.

## Evidence para PR/defesa
- `proof_tecnico`: output, log, screenshot ou request/response do fluxo principal.
- `proof_negativos`: cenarios negativos executados e resultados observados.
- `proof_handoff`: estado final, riscos e proximo BK.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF6-02';
const MIN_NEGATIVOS = 3;

export function validarEvidenceDocumental(evidence) {
  const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;

  if (evidence?.bkId !== BK_ID) {
    throw new Error('Evidence fora do contrato do BK');
  }

  if (negativos < 3) {
    throw new Error('Cenarios negativos abaixo do minimo exigido');
  }

  return { bkId: BK_ID, estado: 'validado' };
}
```

## Changelog
- `2026-06-30`: suplemento documental adicionado para cumprir validador de planificacao.

</details>
