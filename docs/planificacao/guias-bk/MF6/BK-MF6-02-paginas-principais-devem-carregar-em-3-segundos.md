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
- `last_updated`: `2026-06-23`

#### Objetivo

Neste BK vais criar uma camada simples de medição de performance no frontend `apps/web` para confirmar que as páginas principais da Orélle carregam em até 3 segundos, conforme `RNF06`.

O resultado final é uma medição local por área principal da app, um aviso técnico discreto, estilos integrados no tema atual e scripts de evidence que ajudam a provar o build, o orçamento e os cenários negativos sem recolher dados pessoais, fotografias, relatórios, carrinho, encomendas, cookies ou segredos de sessão.

#### Importância

Performance é parte da confiança. Catálogo lento, análise facial lenta, recomendações lentas ou checkout lento reduzem a probabilidade de o cliente continuar a rotina ou concluir compra. Como `BK-MF6-02` é `CORE-HIBRIDO`, a rapidez protege os dois eixos da Orélle: consultoria inteligente e conversão comercial.

Este BK também ensina uma regra profissional importante: medir não pode quebrar privacidade nem segurança. A app continua a usar sessão por cookie através do cliente API existente, mantém estados de `loading`, `error`, `empty` e `success`, e não transforma métricas técnicas em dados de utilizador.

#### Scope-in

- Definir o orçamento `PAGE_LOAD_BUDGET_MS = 3_000`.
- Definir a lista fechada de páginas principais de `RNF06`.
- Criar helper de avaliação de orçamento.
- Criar hook React para medir o primeiro render de cada área principal.
- Criar componente de aviso técnico minimizado.
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
- Depois: as páginas principais ficam embrulhadas por uma camada de medição local, mostram um aviso técnico `ok`/`slow`, mantêm a UI existente e têm scripts de evidence para orçamento, build e assets.

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
- Primeiro render: primeiro momento em que a área principal foi montada e o browser conseguiu desenhar um frame.
- Evidence: prova técnica guardada para PR, defesa ou relatório.
- Métrica minimizada: medição técnica sem dados pessoais nem dados sensíveis.
- Wrapper: componente que envolve outro componente para acrescentar comportamento sem alterar a lógica interna.

#### Conceitos teóricos essenciais

Uma página rápida não é apenas uma página com pouco código. O carregamento depende do tamanho do JavaScript, do CSS, do tempo de renderização, das imagens, das chamadas HTTP e do equipamento do utilizador. Por isso, este BK junta três provas: build Vite, tamanho dos assets e medição local no browser.

`RNF06` fala de páginas principais. A app atual ainda não tem routing final; o `App.jsx` monta várias páginas numa pilha. Por isso, neste BK a decisão técnica segura é medir áreas principais reais dentro dessa pilha, usando uma lista fechada. Esta decisão é `DERIVADO`: não inventa requisito novo, apenas adapta `RNF06` à estrutura React/Vite existente.

Medição frontend não substitui segurança backend. Se uma página usa sessão, carrinho, relatório, recomendações ou checkout, a chamada continua a passar pelo cliente API existente. A métrica deste BK fica no browser e só contém `pageKey`, duração, orçamento, estado e label técnico.

`CANONICO`: o limite de 3 segundos vem de `RNF06`; a prioridade `P0` exige evidence forte, incluindo unit, integração/build, smoke/e2e manual e pelo menos 3 negativos.

`DERIVADO`: os nomes `PAGE_LOAD_BUDGET_MS`, `MAIN_PAGE_DEFINITIONS`, `usePagePerformance`, `PagePerformanceNotice`, `MeasuredPageSection` e os scripts locais são decisões técnicas mínimas para aplicar `RNF06` sem dependências novas.

#### Arquitetura do BK

- `apps/web/src/utils/performance-budget.js`: define páginas principais, orçamento e avaliação `ok`/`slow`/`ignored`.
- `apps/web/src/hooks/usePagePerformance.js`: mede o primeiro render de cada área principal.
- `apps/web/src/components/PagePerformanceNotice.jsx`: apresenta a métrica técnica.
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

### Passo 3 - Criar hook React para medir primeiro render

1. Objetivo funcional do passo no contexto da app.

Medir, no browser, quanto tempo demora a montar e desenhar cada área principal da pilha de páginas.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/hooks/usePagePerformance.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Usa `performance.now()` e `requestAnimationFrame`. Não uses a métrica de navegação inicial do documento como prova principal, porque esse valor não mede cada área React da app.

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
 * Mede o primeiro render de uma área principal da Orélle.
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

O hook mede o tempo entre a montagem do wrapper e o primeiro frame desenhado pelo browser. Isto é mais adequado à app atual do que medir apenas a navegação inicial do documento, porque cada área principal é um componente React dentro de `App.jsx`. O cleanup cancela a medição se o componente desmontar antes do frame, evitando estado atualizado fora de tempo.

6. Validação do passo.

Ao usar `usePagePerformance("catalog")`, a métrica deve começar como `null` e depois passar para um objeto com `loadMs`, `budgetMs` e `status`.

7. Cenário negativo/erro esperado.

Se a página for desmontada antes de o frame correr, o hook não deve chamar `setMetric` depois do cleanup.

### Passo 4 - Criar aviso técnico e wrapper medido

1. Objetivo funcional do passo no contexto da app.

Mostrar a medição de forma discreta e reutilizar a mesma lógica em várias páginas principais sem alterar a lógica interna dessas páginas.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/components/PagePerformanceNotice.jsx`
    - CRIAR: `apps/web/src/components/MeasuredPageSection.jsx`
    - LOCALIZAÇÃO: ficheiros completos.

3. Instruções do que fazer.

Cria primeiro o aviso técnico e depois o wrapper. O aviso recebe uma métrica já calculada; o wrapper chama o hook, define `data-mf6-page` e renderiza a página original.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/components/PagePerformanceNotice.jsx

/**
 * Mostra evidence local de carregamento para uma página principal.
 *
 * @function PagePerformanceNotice
 * @param {{metric: {pageLabel: string, loadMs: number, budgetMs: number, status: string}|null}} props - Métrica minimizada.
 * @returns {JSX.Element|null} Aviso técnico discreto.
 */
export function PagePerformanceNotice({ metric }) {
    if (!metric || metric.status === "ignored") {
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
                ? `acima do orçamento (${metric.loadMs} ms / ${metric.budgetMs} ms).`
                : `dentro do orçamento (${metric.loadMs} ms / ${metric.budgetMs} ms).`}
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
 * Envolve uma página principal com medição RNF06.
 *
 * @function MeasuredPageSection
 * @param {{pageKey: string, children: import("react").ReactNode}} props - Página técnica e conteúdo React.
 * @returns {JSX.Element} Secção medida para evidence local.
 */
export function MeasuredPageSection({ pageKey, children }) {
    const metric = usePagePerformance(pageKey);
    const definition = getMainPageDefinition(pageKey);
    const label = definition?.label ?? pageKey;

    return (
        <div className="mf6-page-measure" data-mf6-page={pageKey}>
            {/* O aviso aparece antes da página para ser fácil recolher evidence sem tocar na lógica interna. */}
            <PagePerformanceNotice metric={metric} />
            <div className="mf6-page-measure__content" aria-label={`Área medida: ${label}`}>
                {children}
            </div>
        </div>
    );
}
```

5. Explicação do código.

`PagePerformanceNotice` só apresenta dados técnicos e minimizados. `MeasuredPageSection` permite medir páginas sem editar `ProductSearchPage`, `FaceAnalysisPage`, `FaceReportPage`, `ProductRecommendationsPage`, `CartPage` ou `CheckoutPage`. Assim, este BK acrescenta performance evidence sem duplicar regras de carrinho, recomendações, sessão ou checkout.

6. Validação do passo.

Quando envolveres uma página com `<MeasuredPageSection pageKey="catalog">`, deve surgir um elemento com `data-mf6-page="catalog"` e um aviso com `role="status"`.

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

Dar evidence P0 sem instalar dependências novas: um script unitário para o helper e um script de assets após build.

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
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const distAssetsDir = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const MAX_MAIN_JS_ASSET_BYTES = 350_000;

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
const oversizedJsAssets = jsAssets.filter(
    (asset) => asset.bytes > MAX_MAIN_JS_ASSET_BYTES,
);

// O script mede ficheiros gerados pelo build e não lê sessão, fotografias ou dados pessoais.
console.table(assets);

if (oversizedJsAssets.length > 0) {
    throw new Error(
        `Assets JS acima do limite derivado de ${MAX_MAIN_JS_ASSET_BYTES} bytes: ${oversizedJsAssets
            .map((asset) => asset.name)
            .join(", ")}`,
    );
}

console.log("BK-MF6-02 asset checks passed");
```

5. Explicação do código.

O script unitário fecha o comportamento do helper: página dentro do limite, página lenta e página fora da lista. O script de assets valida que o build existe e usa `fileURLToPath`, evitando falhas quando o projeto está dentro de pastas com espaços. O limite de bytes é `DERIVADO`; serve como alerta local simples, não como substituto da medição no browser.

6. Validação do passo.

Executa:

```bash
node apps/web/scripts/check-mf6-performance-unit.mjs
npm --prefix apps/web run build
node apps/web/scripts/check-mf6-page-budget.mjs
```

7. Cenário negativo/erro esperado.

Sem `dist/assets`, o script de assets falha com a instrução para executar build. Com uma página fora da lista, o script unitário espera `ignored`.

### Passo 8 - Recolher evidence desktop/mobile e fechar negativos

1. Objetivo funcional do passo no contexto da app.

Fechar `RNF06` com evidence que um professor ou colega consegue repetir.

2. Ficheiros envolvidos:
    - REVER: `apps/web/src/App.jsx`
    - REVER: `apps/web/src/styles.css`
    - REVER: `apps/web/scripts/check-mf6-performance-unit.mjs`
    - REVER: `apps/web/scripts/check-mf6-page-budget.mjs`
    - LOCALIZAÇÃO: secções editadas neste BK.

3. Instruções do que fazer.

Executa os comandos finais, abre a app em desktop e mobile, e regista no PR/defesa os valores observados para as seis páginas principais. Se alguma página aparecer como `slow`, não escondas o resultado; regista a duração, o ambiente e uma ação de otimização futura.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Este passo é de validação. O objetivo é provar que o código criado nos passos anteriores funciona e que os negativos foram tratados.

6. Validação do passo.

Regista evidence com:

- output de `node apps/web/scripts/check-mf6-performance-unit.mjs`;
- output de `npm --prefix apps/web run build`;
- output de `node apps/web/scripts/check-mf6-page-budget.mjs`;
- captura ou nota manual de desktop para `catalog`, `face-analysis`, `face-report`, `recommendations`, `cart` e `checkout`;
- captura ou nota manual de mobile para as mesmas áreas.

7. Cenário negativo/erro esperado.

Fecha no mínimo estes negativos:

- `pageKey` fora de `MAIN_PAGE_DEFINITIONS` devolve `ignored`;
- `loadMs` acima de `3_000` mostra aviso `slow` sem bloquear a página;
- `dist/assets` ausente faz o script falhar com mensagem clara;
- os avisos não apresentam email, fotografia, relatório, produto comprado, morada, cookie ou segredo de sessão.

#### Expected results

- `PAGE_LOAD_BUDGET_MS` está fixo em `3_000`.
- As seis páginas principais têm `data-mf6-page`.
- Cada página medida mostra estado `ok` ou `slow`.
- O script unitário passa.
- O build Vite passa.
- O script de assets lista ficheiros e não falha em caminhos com espaços.
- A app mantém sessão, estados de loading/error e chamadas API existentes.
- Nenhuma métrica inclui dados pessoais, biométricos, comerciais sensíveis, cookies ou segredos de sessão.

#### Critérios de aceite

- O guia tem pelo menos 8 passos e pelo menos 3 negativos.
- A medição deixa de depender apenas da navegação inicial do documento.
- `apps/web/src/App.jsx` mostra integração completa com as páginas principais reais.
- `apps/web/src/styles.css` contém estilos para `mf6-performance` e `mf6-page-measure`.
- Existe evidence unitária, integração/build, assets e smoke manual desktop/mobile.
- `BK-MF6-03` consegue reutilizar as páginas principais medidas como base para teste de concorrência.
- Não há dependências novas.

#### Validação final

```bash
node apps/web/scripts/check-mf6-performance-unit.mjs
npm --prefix apps/web run build
node apps/web/scripts/check-mf6-page-budget.mjs
bash scripts/validate-planificacao.sh
```

#### Evidence para PR/defesa

- `proof_unit`: output de `node apps/web/scripts/check-mf6-performance-unit.mjs`.
- `proof_integration`: output de `npm --prefix apps/web run build`.
- `proof_assets`: tabela de assets de `node apps/web/scripts/check-mf6-page-budget.mjs`.
- `proof_e2e_manual`: notas ou capturas desktop/mobile com as seis áreas principais.
- `proof_negativos`: `ignored`, `slow`, build ausente e ausência de dados sensíveis nos avisos.
- `proof_core_dual`: catálogo, análise, recomendações, carrinho e checkout continuam acessíveis e medidos.

#### Handoff

`BK-MF6-03` deve usar as páginas principais medidas aqui como base de smoke. O script de concorrência desse BK não deve remover autenticação nem chamar endpoints protegidos sem sessão; deve separar health check público de fluxos autenticados.

#### Changelog

- `2026-06-23`: guia corrigido para o contrato ativo: 8 passos, medição por área React, integração completa em `App.jsx`, CSS, scripts de evidence, correção de paths com `fileURLToPath` e negativos P0.
