# BK-MF8-13 - Interface integrada cliente/consultor para consulta assistida

## Header
- `doc_id`: `GUIA-BK-MF8-13`
- `bk_id`: `BK-MF8-13`
- `macro`: `MF8`
- `owner`: `Aline`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF8-08, BK-MF8-09, BK-MF8-10, BK-MF8-11, BK-MF8-12`
- `rf_rnf`: `RF42, RF45, RF46, RNF26`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-14`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-13-interface-integrada-cliente-consultor-para-consulta-assistida.md`
- `last_updated`: `2026-07-02`

#### Objetivo

Neste BK vais integrar, numa única experiência de consulta assistida, as páginas criadas nos BKs anteriores: sessão guiada, histórico seguro da interação IA, recomendações enriquecidas, revisão humana por consultor e insights públicos visíveis para o cliente.

No fim, o cliente consegue avançar pela consulta assistida sem procurar ecrãs soltos, e o consultor consegue aceder à revisão humana apenas quando tem o papel certo.

#### Importância

Os BKs `BK-MF8-08` a `BK-MF8-12` criam peças funcionais separadas. Este BK transforma essas peças num fluxo navegável e defendível em apresentação PAP. Sem esta integração, a aplicação até pode ter endpoints e páginas, mas a experiência fica fragmentada: o cliente não percebe a sequência e o consultor não tem uma entrada clara para rever sessões.

Este BK também protege a fronteira de segurança: a UI pode esconder ou mostrar painéis por role para melhorar a navegação, mas a autorização real continua no backend. O frontend nunca deve decidir ownership, nunca deve confiar em IDs enviados pelo utilizador para autorizar acesso e nunca deve expor campos internos dos DTOs.

#### Scope-in

- Criar um contrato de navegação frontend para a consulta assistida.
- Criar a página `AssistedConsultationHubPage.jsx`.
- Integrar a página na aplicação principal em `apps/web/src/App.jsx`.
- Reutilizar páginas e endpoints já ensinados nos BKs `BK-MF8-08`, `BK-MF8-09`, `BK-MF8-10`, `BK-MF8-11` e `BK-MF8-12`.
- Separar painéis visíveis para cliente, consultor e administrador.
- Garantir estados de UI `loading`, `empty`, `error` e `success` nos pontos de integração.
- Criar um script de verificação estática para provar imports, role gates, páginas integradas e ausência de caminhos privados.

#### Scope-out

- Não criar novos endpoints backend.
- Não alterar modelos, services, controllers ou routes criados nos BKs anteriores.
- Não refazer o design visual final. O acabamento visual fica para `BK-MF8-14`.
- Não alterar a política de autorização backend.
- Não misturar consulta/recomendação com compra automática ou carrinho.
- Não criar nova integração de IA externa.

#### Estado antes e depois

- Antes: a MF8 já tem páginas e endpoints documentados para sessão guiada, histórico IA, recomendações enriquecidas, revisão humana e insights do consultor.
- Antes: essas superfícies ainda podem ficar dispersas na app e sem entrada comum.
- Depois: existe uma página central de consulta assistida que mostra ao cliente os painéis certos e mostra ao consultor apenas a área de revisão.
- Depois: `App.jsx` passa a expor essa página no grupo de cliente e preserva a secção de consultoria para roles autorizadas.
- Depois: `BK-MF8-14` pode trabalhar no polimento visual da experiência integrada, sem inventar outro fluxo funcional.

#### Pre-requisitos

- `BK-MF8-08`: criou `GuidedConsultationPage` e endpoints `/api/ai-consultation/sessions`.
- `BK-MF8-09`: criou `AiHistoryPage`, `aiInteractionHistoryApi.js` e endpoint `/api/me/ai-interactions`.
- `BK-MF8-10`: atualizou `ProductRecommendationsPage` para usar contexto de sessão guiada e recomendações enriquecidas.
- `BK-MF8-11`: criou `ConsultantAiReviewPage` e endpoints `/api/consultant/ai-consultation-reviews`.
- `BK-MF8-12`: criou `ClientAiInsightsPage` e endpoint `/api/me/ai-consultation-insights`.
- `BK-MF7-03`: garante sessão autenticada por cookie HttpOnly.
- `BK-MF0-05`: garante roles `cliente`, `consultor` e `administrador`.

#### Glossário

- Consulta assistida: experiência que junta avaliação guiada, histórico IA, recomendações, revisão humana e insights.
- Hub: página central que organiza vários painéis relacionados sem duplicar lógica de cada feature.
- Painel: zona da UI que mostra uma parte do fluxo, como consulta, histórico, recomendações, insights ou revisão.
- Role gate visual: regra de interface que mostra opções diferentes consoante `cliente`, `consultor` ou `administrador`.
- DTO público: resposta API minimizada, sem `userId`, storage keys, prompts internos, fotografias ou campos privados.
- Ownership: regra backend que associa dados ao utilizador autenticado e impede acesso a dados de outra pessoa.
- Handoff: contrato que este BK deixa para o próximo BK continuar sem reescrever a funcionalidade.

#### Conceitos teóricos essenciais

Uma interface integrada não é só uma página bonita. Ela organiza o percurso do utilizador e reduz erro operacional. O cliente deve perceber que primeiro faz a avaliação guiada, depois consulta histórico/recomendações e finalmente lê os insights publicados pelo consultor.

O frontend trabalha com componentes React, `useState`, `useMemo` e props. `useState` guarda o painel ativo e as recomendações carregadas. `useMemo` calcula a lista de painéis visíveis a partir do utilizador autenticado. Props permitem que `ProductRecommendationsPage` envie recomendações para outros pontos sem criar estado global novo.

Role gate visual melhora ergonomia, mas não substitui autorização. Se um cliente tentar chamar endpoint de consultor, o backend deve continuar a devolver `403`. Se um utilizador não autenticado abrir a página, a UI mostra erro amigável, mas a API continua protegida por cookie HttpOnly.

DTO público evita fuga de dados. O cliente pode ver estado, nota pública, recomendações afetadas e datas públicas. Não pode ver nota interna do consultor, IDs de storage, fotografias, prompts internos, consent IDs ou dados biométricos.

Recomendação não é compra. Mesmo que a interface mostre recomendações enriquecidas e insights humanos, a app não adiciona produtos ao carrinho sem ação explícita do cliente. Esta separação preserva o contrato de comércio definido nas macrofases anteriores.

Evidence é a prova de que o BK ficou defensável. Para este BK, a evidence deve mostrar a navegação integrada, os role gates, os estados de UI, os cenários negativos e o build frontend.

#### Arquitetura do BK

- `CANONICO`: `RF42` define avaliação guiada com perguntas cosméticas estruturadas.
- `CANONICO`: `RF45` define revisão humana de sessões IA por consultores.
- `CANONICO`: `RF46` define insights/correções do consultor visíveis para o cliente.
- `CANONICO`: matriz e backlog associam `BK-MF8-13` a `RNF26`; neste BK, `RNF26` é tratado como integração funcional que prepara o acabamento visual do `BK-MF8-14`.
- `CANONICO`: `BK-MF8-13` é `CORE-HIBRIDO`, porque une consulta IA, revisão humana e confiança/conversão.
- `DERIVADO`: a página central chama-se `AssistedConsultationHubPage` para deixar claro que integra páginas existentes sem criar nova regra backend.
- `DERIVADO`: o contrato de navegação fica em `apps/web/src/services/assistedConsultationNavigation.js`, porque é lógica de UI reutilizável e não deve viver misturada no JSX.

Fluxo principal:

1. `AuthProvider` carrega o utilizador autenticado por `/api/auth/me`.
2. `App.jsx` mostra a página de consulta assistida dentro da experiência principal.
3. `AssistedConsultationHubPage` calcula painéis visíveis por role.
4. Cliente vê consulta guiada, histórico IA, recomendações e insights.
5. Consultor ou administrador vê revisão humana.
6. Cada painel continua a chamar os endpoints próprios dos BKs anteriores.
7. O próximo BK usa esta página como base para aproximação visual ao mockup.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/web/src/services/assistedConsultationNavigation.js`
- CRIAR: `apps/web/src/pages/AssistedConsultationHubPage.jsx`
- EDITAR: `apps/web/src/App.jsx`
- CRIAR: `apps/web/scripts/check-mf8-assisted-consultation-ui.mjs`
- CRIAR: `apps/api/tests/evidence/bk-mf8-13.evidence-contract.js`
- REVER: `apps/web/src/pages/GuidedConsultationPage.jsx`
- REVER: `apps/web/src/pages/AiHistoryPage.jsx`
- REVER: `apps/web/src/pages/ProductRecommendationsPage.jsx`
- REVER: `apps/web/src/pages/ConsultantAiReviewPage.jsx`
- REVER: `apps/web/src/pages/ClientAiInsightsPage.jsx`
- REVER: `apps/web/src/context/AuthContext.jsx`
- REVER: `apps/web/src/services/apiClient.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato e fronteiras

1. Objetivo funcional do passo no contexto da app.

Confirmar que a interface integrada consome os BKs anteriores, mas não altera endpoints, modelos nem regras backend.

2. Ficheiros envolvidos:
    - REVER: `docs/RF.md`
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/BACKLOG-MVP.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-08-sessao-guiada-de-avaliacao-cosmetica-com-ia.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-09-historico-seguro-da-interacao-cliente-ia.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-10-recomendacoes-enriquecidas-com-respostas-da-avaliacao-guiada.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-11-revisao-humana-de-sessoes-ia-por-consultores.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-12-insights-correcoes-do-consultor-visiveis-para-o-cliente.md`
    - LOCALIZAÇÃO: entradas `RF42`, `RF45`, `RF46`, `RNF26`, `BK-MF8-13` e handoff `BK-MF8-14`.

3. Instruções do que fazer.

Lê os documentos indicados e confirma três decisões antes de programar:

1. `BK-MF8-13` integra páginas existentes dos BKs `BK-MF8-08` a `BK-MF8-12`.
2. A autorização real continua no backend.
3. `RNF26` entra aqui apenas como base funcional da interface; o polimento visual fica para `BK-MF8-14`.

4. Código completo, correto e integrado com a app final.

Este passo não altera ficheiros da aplicação. A entrega aqui é uma decisão de fronteira: integrar as páginas já definidas nos BKs anteriores sem duplicar endpoints.

5. Explicação do código.

Não há código porque a decisão importante é de fronteira. Se este BK criasse outro endpoint para consulta assistida, a MF8 passaria a ter dois contratos para a mesma experiência. A correção certa é integrar, não duplicar.

6. Validação do passo.

Executa:

```bash
rg -n "BK-MF8-13|RF42|RF45|RF46|RNF26" docs/RF.md docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/BACKLOG-MVP.md
rg -n "GuidedConsultationPage|AiHistoryPage|ProductRecommendationsPage|ConsultantAiReviewPage|ClientAiInsightsPage" docs/planificacao/guias-bk/MF8/BK-MF8-*.md
```

7. Cenário negativo/erro esperado.

Se não encontrares `RF42`, `RF45` ou `RF46`, para a implementação e corrige primeiro a planificação. Se só encontrares `RNF26` ligado ao `BK-MF8-14` num anexo, mantém a matriz/backlog como fonte superior e regista o drift no relatório.

### Passo 2 - Criar contrato de navegação assistida

1. Objetivo funcional do passo no contexto da app.

Criar uma função pequena e testável que decide que painéis aparecem para cada role, sem espalhar regras de navegação por vários componentes.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/services/assistedConsultationNavigation.js`
    - REVER: `apps/web/src/context/AuthContext.jsx`
    - LOCALIZAÇÃO: ficheiro completo novo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Ele só decide navegação visual. Não faz pedidos à API e não tenta autorizar dados sensíveis.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/src/services/assistedConsultationNavigation.js
export const ASSISTED_CONSULTATION_PANELS = {
    GUIDED_SESSION: "guided_session",
    HISTORY: "history",
    RECOMMENDATIONS: "recommendations",
    CLIENT_INSIGHTS: "client_insights",
    CONSULTANT_REVIEW: "consultant_review",
};

const CLIENT_PANELS = [
    {
        id: ASSISTED_CONSULTATION_PANELS.GUIDED_SESSION,
        label: "Avaliação guiada",
        description: "Responde às perguntas cosméticas estruturadas.",
    },
    {
        id: ASSISTED_CONSULTATION_PANELS.HISTORY,
        label: "Histórico IA",
        description: "Consulta eventos públicos e minimizados da interação.",
    },
    {
        id: ASSISTED_CONSULTATION_PANELS.RECOMMENDATIONS,
        label: "Recomendações",
        description: "Gera ou revê recomendações enriquecidas.",
    },
    {
        id: ASSISTED_CONSULTATION_PANELS.CLIENT_INSIGHTS,
        label: "Insights do consultor",
        description: "Lê notas públicas associadas à sessão.",
    },
];

const CONSULTANT_PANELS = [
    {
        id: ASSISTED_CONSULTATION_PANELS.CONSULTANT_REVIEW,
        label: "Revisão humana",
        description: "Revê sessões IA submetidas por clientes.",
    },
];

/**
 * Confirma se o utilizador pode ver a experiência de cliente.
 *
 * @function canUseClientConsultationPanels
 * @param {{role?: string}|null} user - Utilizador devolvido pelo AuthContext.
 * @returns {boolean} Verdadeiro para cliente autenticado.
 */
export function canUseClientConsultationPanels(user) {
    return user?.role === "cliente";
}

/**
 * Confirma se o utilizador pode ver a área de revisão humana.
 *
 * @function canUseConsultantReviewPanel
 * @param {{role?: string}|null} user - Utilizador devolvido pelo AuthContext.
 * @returns {boolean} Verdadeiro para consultor ou administrador.
 */
export function canUseConsultantReviewPanel(user) {
    return user?.role === "consultor" || user?.role === "administrador";
}

/**
 * Devolve os painéis visíveis para a consulta assistida.
 *
 * @function getAssistedConsultationPanels
 * @param {{role?: string}|null} user - Utilizador autenticado.
 * @returns {{id: string, label: string, description: string}[]} Painéis permitidos na UI.
 */
export function getAssistedConsultationPanels(user) {
    if (canUseClientConsultationPanels(user)) {
        return CLIENT_PANELS;
    }

    if (canUseConsultantReviewPanel(user)) {
        return CONSULTANT_PANELS;
    }

    // A UI não autoriza dados: apenas evita mostrar painéis a roles desconhecidas.
    return [];
}
```

5. Explicação do código.

Este ficheiro cria um contrato claro entre role e navegação. `CLIENT_PANELS` contém apenas painéis do próprio cliente. `CONSULTANT_PANELS` contém apenas revisão humana. As funções `canUseClientConsultationPanels` e `canUseConsultantReviewPanel` recebem o utilizador já carregado pelo `AuthContext`, por isso não usam tokens nem IDs enviados pelo browser.

O comentário final é importante: esconder um painel não é segurança suficiente. O backend continua a validar sessão, role, ownership e DTOs. Esta separação evita o erro comum de tratar frontend como fonte de autorização.

6. Validação do passo.

Executa:

```bash
node --check apps/web/src/services/assistedConsultationNavigation.js
rg -n "canUseClientConsultationPanels|canUseConsultantReviewPanel|getAssistedConsultationPanels" apps/web/src/services/assistedConsultationNavigation.js
```

7. Cenário negativo/erro esperado.

Um utilizador sem role reconhecida deve receber `[]` como painéis visíveis. Isso evita mostrar ecrãs errados, mas não substitui os `401` e `403` dos endpoints backend.

### Passo 3 - Criar a página hub da consulta assistida

1. Objetivo funcional do passo no contexto da app.

Criar a página que integra os painéis dos BKs anteriores e mostra apenas a área certa para cliente, consultor ou administrador.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/pages/AssistedConsultationHubPage.jsx`
    - REVER: `apps/web/src/pages/GuidedConsultationPage.jsx`
    - REVER: `apps/web/src/pages/AiHistoryPage.jsx`
    - REVER: `apps/web/src/pages/ProductRecommendationsPage.jsx`
    - REVER: `apps/web/src/pages/ConsultantAiReviewPage.jsx`
    - REVER: `apps/web/src/pages/ClientAiInsightsPage.jsx`
    - REVER: `apps/web/src/context/AuthContext.jsx`
    - LOCALIZAÇÃO: ficheiro completo novo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Ele importa as páginas já criadas nos BKs anteriores e controla o painel ativo sem alterar os contratos dessas páginas.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/AssistedConsultationHubPage.jsx
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
    ASSISTED_CONSULTATION_PANELS,
    getAssistedConsultationPanels,
} from "../services/assistedConsultationNavigation.js";
import { AiHistoryPage } from "./AiHistoryPage.jsx";
import { ClientAiInsightsPage } from "./ClientAiInsightsPage.jsx";
import { ConsultantAiReviewPage } from "./ConsultantAiReviewPage.jsx";
import { GuidedConsultationPage } from "./GuidedConsultationPage.jsx";
import { ProductRecommendationsPage } from "./ProductRecommendationsPage.jsx";

/**
 * Renderiza o painel selecionado da consulta assistida.
 *
 * @function renderAssistedConsultationPanel
 * @param {string} panelId - Identificador do painel ativo.
 * @param {(recommendations: object[]) => void} setRecommendations - Sincroniza recomendações para painéis filhos.
 * @returns {import("react").JSX.Element} Painel React correspondente.
 */
function renderAssistedConsultationPanel(panelId, setRecommendations) {
    switch (panelId) {
        case ASSISTED_CONSULTATION_PANELS.GUIDED_SESSION:
            return <GuidedConsultationPage />;

        case ASSISTED_CONSULTATION_PANELS.HISTORY:
            return <AiHistoryPage />;

        case ASSISTED_CONSULTATION_PANELS.RECOMMENDATIONS:
            return (
                <ProductRecommendationsPage
                    onRecommendationsChange={setRecommendations}
                />
            );

        case ASSISTED_CONSULTATION_PANELS.CLIENT_INSIGHTS:
            return <ClientAiInsightsPage />;

        case ASSISTED_CONSULTATION_PANELS.CONSULTANT_REVIEW:
            return <ConsultantAiReviewPage />;

        default:
            return (
                <p role="alert">
                    Não foi possível abrir este painel da consulta assistida.
                </p>
            );
    }
}

/**
 * Integra consulta guiada, histórico IA, recomendações, insights e revisão humana.
 *
 * @function AssistedConsultationHubPage
 * @returns {import("react").JSX.Element} Página integrada da consulta assistida.
 */
export function AssistedConsultationHubPage() {
    const { user, loading } = useAuth();
    const [activePanelId, setActivePanelId] = useState("");
    const [, setRecommendations] = useState([]);

    const panels = useMemo(() => getAssistedConsultationPanels(user), [user]);
    const selectedPanelId = panels.some((panel) => panel.id === activePanelId)
        ? activePanelId
        : panels[0]?.id || "";

    if (loading) {
        return (
            <section aria-busy="true">
                <h1>Consulta assistida</h1>
                <p>A carregar sessão autenticada.</p>
            </section>
        );
    }

    if (!user) {
        return (
            <section>
                <h1>Consulta assistida</h1>
                <p role="alert">
                    Inicia sessão para aceder à consulta assistida.
                </p>
            </section>
        );
    }

    if (panels.length === 0) {
        return (
            <section>
                <h1>Consulta assistida</h1>
                <p role="alert">
                    O teu perfil não tem acesso a esta área.
                </p>
            </section>
        );
    }

    return (
        <section className="page-stack" aria-labelledby="assisted-consultation-title">
            <header>
                <p className="app-kicker">Consulta IA guiada</p>
                <h1 id="assisted-consultation-title">Consulta assistida</h1>
                <p>
                    Acompanha a avaliação, as recomendações e a revisão humana sem
                    sair do fluxo principal.
                </p>
            </header>

            <nav aria-label="Etapas da consulta assistida">
                {panels.map((panel) => (
                    <button
                        key={panel.id}
                        type="button"
                        aria-pressed={selectedPanelId === panel.id}
                        onClick={() => setActivePanelId(panel.id)}
                    >
                        {panel.label}
                    </button>
                ))}
            </nav>

            <ol>
                {panels.map((panel) => (
                    <li key={`${panel.id}-summary`}>
                        <strong>{panel.label}:</strong> {panel.description}
                    </li>
                ))}
            </ol>

            <div aria-live="polite">
                {/* O painel ativo reutiliza páginas existentes para não criar contratos paralelos. */}
                {renderAssistedConsultationPanel(selectedPanelId, setRecommendations)}
            </div>
        </section>
    );
}
```

5. Explicação do código.

`AssistedConsultationHubPage` lê o utilizador através de `useAuth`, que já usa a sessão por cookie HttpOnly. Depois calcula `panels` com `getAssistedConsultationPanels(user)`. Isto deixa a regra de navegação testável fora do JSX.

O componente cobre quatro estados importantes. `loading` mostra carregamento enquanto a sessão é lida. Sem utilizador mostra erro de autenticação. Role sem acesso mostra erro de autorização amigável. Com painéis válidos, renderiza botões de navegação e o painel selecionado.

`selectedPanelId` só aceita `activePanelId` quando esse painel ainda pertence à lista permitida para a role atual. Se o utilizador fizer logout e voltar a entrar com outra role na mesma SPA, a página volta automaticamente ao primeiro painel permitido para essa role.

`renderAssistedConsultationPanel` reutiliza páginas anteriores. Isso cumpre a sequência da MF8: este BK não reimplementa sessão guiada, histórico, recomendações, revisão ou insights; apenas organiza essas entregas numa experiência única.

O botão usa `aria-pressed` para ajudar acessibilidade. O `aria-live="polite"` ajuda leitores de ecrã quando o painel muda. A UI melhora a experiência, mas o backend continua a proteger endpoints e ownership.

6. Validação do passo.

Executa:

```bash
rg -n "AssistedConsultationHubPage|GuidedConsultationPage|AiHistoryPage|ClientAiInsightsPage|ConsultantAiReviewPage" apps/web/src/pages/AssistedConsultationHubPage.jsx
```

A sintaxe JSX desta página é validada no Passo 4, quando `AssistedConsultationHubPage` passa a ser importada pelo `App.jsx` e o build Vite processa a árvore React.

7. Cenário negativo/erro esperado.

Se um utilizador sem sessão abrir a página, deve ver a mensagem `Inicia sessão para aceder à consulta assistida.`. Se um cliente tentar chamar o endpoint de consultor por fora da UI, o backend deve continuar a devolver `403`.

### Passo 4 - Integrar o hub no App.jsx

1. Objetivo funcional do passo no contexto da app.

Ligar a página integrada à aplicação principal sem remover páginas existentes e sem quebrar os fluxos das macrofases anteriores.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/App.jsx`
    - REVER: `apps/web/src/context/AuthContext.jsx`
    - LOCALIZAÇÃO: import no topo e renderização dentro do grupo `Conta e experiencia do cliente`.

3. Instruções do que fazer.

Adiciona o import e renderiza `AssistedConsultationHubPage` depois das recomendações, porque a consulta assistida depende de avaliação guiada, histórico e recomendações enriquecidas.

4. Código completo, correto e integrado com a app final.

Substitui `apps/web/src/App.jsx` pelo ficheiro completo abaixo.

```jsx
// apps/web/src/App.jsx
/**
 * Composição principal do frontend da Orelle.
 *
 * A aplicação expõe os fluxos criados pelos BKs por grupos funcionais. A
 * autorização real continua na API; esta página organiza navegação e smoke
 * testing manual.
 */
import React, { useState } from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage.jsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.jsx";
import { AdminExportsPage } from "./pages/AdminExportsPage.jsx";
import { AdminNotificationsPage } from "./pages/AdminNotificationsPage.jsx";
import { AdminProductCreatePage } from "./pages/AdminProductCreatePage.jsx";
import { AdminReviewsPage } from "./pages/AdminReviewsPage.jsx";
import { AdminUsersPage } from "./pages/AdminUsersPage.jsx";
import { AssistedConsultationHubPage } from "./pages/AssistedConsultationHubPage.jsx";
import { BiometricAuditPage } from "./pages/BiometricAuditPage.jsx";
import { BiometricDataRequestPage } from "./pages/BiometricDataRequestPage.jsx";
import { BiometricDataRequestsAdminPage } from "./pages/BiometricDataRequestsAdminPage.jsx";
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
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { RelatedProductsPage } from "./pages/RelatedProductsPage.jsx";
import { RoutineAlertsPage } from "./pages/RoutineAlertsPage.jsx";
import { SkinComparisonPage } from "./pages/SkinComparisonPage.jsx";
import { SkinEvolutionPage } from "./pages/SkinEvolutionPage.jsx";
import { SkinHistoryPage } from "./pages/SkinHistoryPage.jsx";
import { StockAdminPage } from "./pages/StockAdminPage.jsx";
import { MeasuredPageSection } from "./components/MeasuredPageSection.jsx";
import { ThemeControls } from "./components/ThemeControls.jsx";
import { useAuth } from "./context/AuthContext.jsx";

/**
 * Agrupa páginas por responsabilidade visual sem substituir autorização.
 *
 * @function SectionGroup
 * @param {{title: string, description: string, children: React.ReactNode}} props - Conteúdo e contexto do grupo.
 * @returns {import("react").JSX.Element} Grupo responsivo de páginas.
 */
function SectionGroup({ title, description, children }) {
    return (
        <section className="section-group">
            <header className="section-group-header">
                <h2>{title}</h2>
                <p>{description}</p>
            </header>
            <div className="section-grid">{children}</div>
        </section>
    );
}

/**
 * Conteúdo da aplicação com acesso ao estado autenticado.
 *
 * @function AppContent
 * @returns {import("react").JSX.Element} Páginas agrupadas por papel.
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
                    <p className="app-kicker">Experiência Orelle</p>
                    <h1>Orelle</h1>
                </div>
                <div className="app-header__actions">
                    {/* O tema é visual; autenticação e roles continuam no AuthContext/API. */}
                    <ThemeControls />

                    {user && (
                        <p className="session-pill">
                            {user.email} · {user.role}
                        </p>
                    )}
                </div>
            </header>

            <SectionGroup
                title="Conta e experiência do cliente"
                description="Fluxos principais de perfil, catálogo, recomendações, carrinho e acompanhamento pessoal."
            >
                <RegisterPage />
                <LoginPage />
                <ProfileSetupPage />
                <EditProfilePage />
                <PreferencesPage />
                <MeasuredPageSection pageKey="catalog" label="Catálogo">
                    <ProductSearchPage />
                </MeasuredPageSection>
                <ProductDetailsPage />
                <ProductReviewPage />
                <RelatedProductsPage />
                <FacePhotoUploadPage />
                <BiometricDataRequestPage />
                <MeasuredPageSection pageKey="face-analysis" label="Análise facial">
                    <FaceAnalysisPage />
                </MeasuredPageSection>
                <MeasuredPageSection pageKey="face-report" label="Relatório facial">
                    <FaceReportPage />
                </MeasuredPageSection>
                <SkinHistoryPage />
                <SkinEvolutionPage />
                <MeasuredPageSection
                    pageKey="recommendations"
                    label="Recomendações"
                >
                    <ProductRecommendationsPage
                        onRecommendationsChange={setRecommendations}
                    />
                </MeasuredPageSection>
                <AssistedConsultationHubPage />
                <DailyRoutinePage />
                <MakeupSimulationPage
                    onSimulationCreated={setLatestMakeupSimulation}
                />
                <BeforeAfterVisualizationPage simulation={latestMakeupSimulation} />
                <SkinComparisonPage />
                <MeasuredPageSection pageKey="cart" label="Carrinho">
                    <CartPage />
                </MeasuredPageSection>
                <MeasuredPageSection pageKey="checkout" label="Checkout">
                    <CheckoutPage />
                </MeasuredPageSection>
                <PurchaseHistoryPage />
                <NotificationsPage />
                <RoutineAlertsPage />
            </SectionGroup>

            {canReviewRecommendations && (
                <SectionGroup
                    title="Consultoria e privacidade"
                    description="Revisão assistida e tratamento operacional de pedidos biométricos sem expor dados sensíveis."
                >
                    <ConsultantRecommendationReviewPage
                        recommendations={recommendations}
                    />
                    <BiometricDataRequestsAdminPage />
                </SectionGroup>
            )}

            {isAdmin && (
                <SectionGroup
                    title="Administração"
                    description="Gestão operacional, auditoria e métricas reservadas a administradores."
                >
                    <AdminProductCreatePage />
                    <AdminCategoriesPage />
                    <AdminUsersPage />
                    <AdminReviewsPage />
                    <AdminExportsPage />
                    <AdminNotificationsPage />
                    <AdminDashboardPage />
                    <StockAdminPage />
                    <BiometricAuditPage />
                </SectionGroup>
            )}
        </div>
    );
}

/**
 * Renderiza a aplicação React com contexto de autenticação.
 *
 * @function App
 * @returns {import("react").JSX.Element} Aplicação com sessão HttpOnly.
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

O ficheiro mantém as páginas antigas e acrescenta apenas `AssistedConsultationHubPage`. Isto evita quebrar MF0-MF7 e evita duplicar regras dos BKs anteriores.

A página integrada entra depois de `ProductRecommendationsPage`, porque depende do contexto de recomendações e dos contratos IA da MF8. A secção de consultoria antiga continua a existir para recomendações manuais da MF2; a nova revisão humana de sessões IA fica dentro do hub e usa os endpoints do `BK-MF8-11`.

O código não cria autorização no frontend. `canReviewRecommendations` só controla visibilidade da UI antiga; os endpoints continuam protegidos por `requireAuth` e role middleware no backend. Isto evita a falha comum de considerar um botão escondido como controlo de segurança.

6. Validação do passo.

Executa:

```bash
rg -n "AssistedConsultationHubPage" apps/web/src/App.jsx apps/web/src/pages/AssistedConsultationHubPage.jsx
npm --prefix apps/web run build
```

7. Cenário negativo/erro esperado.

Se o import de `AssistedConsultationHubPage` estiver errado, o build Vite falha com erro de módulo não encontrado. Corrige o caminho antes de avançar.

### Passo 5 - Criar evidence mínima do BK

1. Objetivo funcional do passo no contexto da app.

Criar um contrato de evidence para impedir que a equipa feche o BK só com screenshots ou texto solto.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/evidence/bk-mf8-13.evidence-contract.js`
    - LOCALIZAÇÃO: ficheiro completo novo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Ele valida que a evidence menciona o BK certo, os requisitos certos, provas técnicas e cenários negativos mínimos.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/evidence/bk-mf8-13.evidence-contract.js
const BK_ID = "BK-MF8-13";
const REQUIRED_REQUIREMENTS = ["RF42", "RF45", "RF46", "RNF26"];
const MINIMUM_PROOFS = 4;
const MINIMUM_NEGATIVE_SCENARIOS = 3;

/**
 * Valida a evidence mínima da interface integrada cliente/consultor.
 *
 * @function validateBKMF813Evidence
 * @param {{bkId: string, requirements: string[], proofs: string[], negativeScenarios: string[]}} evidence - Evidence recolhida para PR/defesa.
 * @returns {{bkId: string, status: "valid", domain: "assisted_consultation_ui"}} Resultado normalizado.
 * @throws {Error} Quando a evidence não prova rastreabilidade, integração ou negativos.
 */
export function validateBKMF813Evidence(evidence) {
    const requirements = Array.isArray(evidence?.requirements)
        ? evidence.requirements
        : [];
    const proofs = Array.isArray(evidence?.proofs) ? evidence.proofs : [];
    const negativeScenarios = Array.isArray(evidence?.negativeScenarios)
        ? evidence.negativeScenarios
        : [];

    // A evidence fica presa ao BK e aos requisitos para evitar prova genérica sem rastreabilidade.
    if (evidence?.bkId !== BK_ID) {
        throw new Error("Evidence associada ao BK errado.");
    }

    const missingRequirement = REQUIRED_REQUIREMENTS.find(
        (requirement) => !requirements.includes(requirement),
    );

    if (missingRequirement) {
        throw new Error(`Evidence sem requisito obrigatório: ${missingRequirement}.`);
    }

    // Quatro provas cobrem navegação, role gate visual, build e verificação estática.
    if (proofs.length < MINIMUM_PROOFS) {
        throw new Error("Evidence técnica insuficiente para a interface integrada.");
    }

    if (negativeScenarios.length < MINIMUM_NEGATIVE_SCENARIOS) {
        throw new Error("Cenários negativos abaixo do mínimo P0.");
    }

    return {
        bkId: BK_ID,
        status: "valid",
        domain: "assisted_consultation_ui",
    };
}
```

5. Explicação do código.

Este contrato valida evidence, não valida a feature inteira. Ele existe para impedir que o BK seja fechado sem provas mínimas. `REQUIRED_REQUIREMENTS` garante rastreabilidade a `RF42`, `RF45`, `RF46` e `RNF26`. `MINIMUM_PROOFS` exige quatro sinais: navegação integrada, role gate visual, build e verificação estática. `MINIMUM_NEGATIVE_SCENARIOS` respeita prioridade `P0`.

As mensagens de erro são claras e não expõem dados pessoais. O ficheiro usa JavaScript simples, sem dependência nova, e pode ser importado por Vitest num teste de evidence da equipa.

6. Validação do passo.

Executa:

```bash
node --check apps/api/tests/evidence/bk-mf8-13.evidence-contract.js
```

7. Cenário negativo/erro esperado.

Se a evidence não incluir `RF45`, a função deve lançar `Evidence sem requisito obrigatório: RF45.`.

### Passo 6 - Criar verificação estática da UI integrada

1. Objetivo funcional do passo no contexto da app.

Criar um script simples que confirma se a integração foi realmente aplicada nos ficheiros esperados.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/scripts/check-mf8-assisted-consultation-ui.mjs`
    - REVER: `apps/web/src/App.jsx`
    - REVER: `apps/web/src/pages/AssistedConsultationHubPage.jsx`
    - REVER: `apps/web/src/services/assistedConsultationNavigation.js`
    - LOCALIZAÇÃO: ficheiro completo novo.

3. Instruções do que fazer.

Cria o script abaixo e executa-o a partir da raiz do projeto com `node apps/web/scripts/check-mf8-assisted-consultation-ui.mjs`.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/scripts/check-mf8-assisted-consultation-ui.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const REQUIRED_FILES = [
    "apps/web/src/services/assistedConsultationNavigation.js",
    "apps/web/src/pages/AssistedConsultationHubPage.jsx",
    "apps/web/src/pages/GuidedConsultationPage.jsx",
    "apps/web/src/pages/AiHistoryPage.jsx",
    "apps/web/src/pages/ProductRecommendationsPage.jsx",
    "apps/web/src/pages/ConsultantAiReviewPage.jsx",
    "apps/web/src/pages/ClientAiInsightsPage.jsx",
    "apps/web/src/App.jsx",
];

const REQUIRED_PATTERNS = [
    {
        file: "apps/web/src/App.jsx",
        pattern: "AssistedConsultationHubPage",
    },
    {
        file: "apps/web/src/pages/AssistedConsultationHubPage.jsx",
        pattern: "getAssistedConsultationPanels",
    },
    {
        file: "apps/web/src/pages/AssistedConsultationHubPage.jsx",
        pattern: "GuidedConsultationPage",
    },
    {
        file: "apps/web/src/pages/AssistedConsultationHubPage.jsx",
        pattern: "AiHistoryPage",
    },
    {
        file: "apps/web/src/pages/AssistedConsultationHubPage.jsx",
        pattern: "ClientAiInsightsPage",
    },
    {
        file: "apps/web/src/pages/AssistedConsultationHubPage.jsx",
        pattern: "ConsultantAiReviewPage",
    },
    {
        file: "apps/web/src/services/assistedConsultationNavigation.js",
        pattern: "canUseConsultantReviewPanel",
    },
];

/**
 * Lê um ficheiro obrigatório do projeto.
 *
 * @function readProjectFile
 * @param {string} relativePath - Caminho relativo à raiz do projeto.
 * @returns {string} Conteúdo textual do ficheiro.
 * @throws {Error} Quando o ficheiro não existe.
 */
function readProjectFile(relativePath) {
    const absolutePath = path.join(ROOT, relativePath);

    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Ficheiro obrigatório em falta: ${relativePath}`);
    }

    return fs.readFileSync(absolutePath, "utf8");
}

/**
 * Executa a verificação estática da interface integrada.
 *
 * @function checkAssistedConsultationUi
 * @returns {{files: number, patterns: number}} Contagem de provas verificadas.
 * @throws {Error} Quando um ficheiro ou padrão obrigatório está em falta.
 */
export function checkAssistedConsultationUi() {
    const contentsByFile = new Map();

    for (const file of REQUIRED_FILES) {
        contentsByFile.set(file, readProjectFile(file));
    }

    for (const item of REQUIRED_PATTERNS) {
        const content = contentsByFile.get(item.file) ?? readProjectFile(item.file);

        // Cada padrão prova uma ligação concreta entre o hub, o App e os painéis da MF8.
        if (!content.includes(item.pattern)) {
            throw new Error(`Padrão obrigatório em falta: ${item.pattern}`);
        }
    }

    return {
        files: REQUIRED_FILES.length,
        patterns: REQUIRED_PATTERNS.length,
    };
}

const result = checkAssistedConsultationUi();
console.log(
    `BK-MF8-13 UI integrada validada: ${result.files} ficheiros e ${result.patterns} padrões.`,
);
```

5. Explicação do código.

O script usa apenas `fs` e `path` da biblioteca nativa do Node.js. Não precisa de dependências novas. Primeiro confirma que todos os ficheiros esperados existem. Depois procura padrões críticos: importação do hub no `App.jsx`, uso de `getAssistedConsultationPanels`, importação dos painéis dos BKs anteriores e função de role gate para consultor.

Este script não substitui o build nem testes manuais. Ele protege contra uma falha simples e comum: criar o ficheiro do hub mas esquecer de o ligar à aplicação ou esquecer uma página anterior.

6. Validação do passo.

Executa:

```bash
node apps/web/scripts/check-mf8-assisted-consultation-ui.mjs
```

Resultado esperado:

```txt
BK-MF8-13 UI integrada validada: 8 ficheiros e 7 padrões.
```

7. Cenário negativo/erro esperado.

Se `AssistedConsultationHubPage` não estiver importado no `App.jsx`, o script deve falhar com `Padrão obrigatório em falta: AssistedConsultationHubPage`.

### Passo 7 - Validar fluxo, negativos e handoff

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com comandos reais, cenários negativos e passagem explícita para `BK-MF8-14`.

2. Ficheiros envolvidos:
    - REVER: `apps/web/package.json`
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/src/pages/AssistedConsultationHubPage.jsx`
    - REVER: `apps/web/src/services/assistedConsultationNavigation.js`
    - REVER: `apps/web/src/App.jsx`
    - LOCALIZAÇÃO: comandos de validação e evidence para PR/defesa.

3. Instruções do que fazer.

Executar cenários negativos obrigatórios (mínimo 3), recolhendo outputs e registando o resultado de cada um. Usa os exemplos abaixo e acrescenta outro negativo se a equipa precisar de mais evidence:

1. utilizador sem sessão abre a página;
2. cliente tenta aceder à revisão humana;
3. consultor tenta ver painéis de cliente;
4. cliente escolhe um painel, faz logout e entra como consultor, confirmando que o painel ativo volta para revisão humana;
5. endpoint de consultor chamado com role cliente devolve `403`;
6. build falha se faltar import de página anterior.

4. Código completo, correto e integrado com a app final.

Este passo não adiciona ficheiros novos. A entrega aqui é a validação final, a recolha de evidence e o handoff para o próximo BK.

5. Explicação do código.

Não há código novo aqui porque a funcionalidade já foi implementada nos passos anteriores. A parte importante é provar que a integração funciona com sessão real, role gate visual, backend protegido e build frontend.

6. Validação do passo.

Executa:

```bash
node --check apps/web/src/services/assistedConsultationNavigation.js
node --check apps/web/scripts/check-mf8-assisted-consultation-ui.mjs
node apps/web/scripts/check-mf8-assisted-consultation-ui.mjs
npm --prefix apps/web run build
npm --prefix apps/api test
bash scripts/validate-planificacao.sh
git diff --check
```

7. Cenário negativo/erro esperado.

Se `npm --prefix apps/web run build` falhar por import inexistente, não avances para o `BK-MF8-14`. Corrige primeiro a ligação da página integrada, porque o próximo BK depende desta base funcional.

#### Expected results

- `AssistedConsultationHubPage` existe e compila.
- Cliente autenticado vê avaliação guiada, histórico IA, recomendações e insights públicos.
- Consultor ou administrador vê revisão humana.
- Utilizador sem sessão vê mensagem clara e não recebe dados sensíveis.
- Role gate visual não substitui autorização backend.
- `App.jsx` mantém fluxos anteriores e acrescenta a consulta assistida.
- `BK-MF8-14` recebe uma base funcional para aproximação visual.

#### Critérios de aceite

- `apps/web/src/services/assistedConsultationNavigation.js` criado com funções de role gate visual.
- `apps/web/src/pages/AssistedConsultationHubPage.jsx` criado com estados de autenticação, role desconhecida, navegação e painel ativo.
- `apps/web/src/App.jsx` integra `AssistedConsultationHubPage`.
- `apps/web/scripts/check-mf8-assisted-consultation-ui.mjs` valida ficheiros e padrões críticos.
- `apps/api/tests/evidence/bk-mf8-13.evidence-contract.js` valida evidence mínima P0.
- Nenhum endpoint backend novo foi criado para responsabilidade já coberta nos BKs anteriores.
- Nenhuma recomendação adiciona produto ao carrinho sem ação do cliente.
- Cenários negativos concluídos: mínimo `3`.
- Evidência de testes por camada: check estático/unit, build frontend, teste API relevante e smoke manual documentado.

### Matriz minima de testes por prioridade

- Para `P0`: unit ou check estático, build frontend, teste API relevante, smoke manual do fluxo principal e mínimo de 3 cenários negativos.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) preservados.
- Evidence pronta para PR/defesa.

#### Validação final

- [ ] `node --check apps/web/src/services/assistedConsultationNavigation.js` passa.
- [ ] `node --check apps/web/scripts/check-mf8-assisted-consultation-ui.mjs` passa.
- [ ] `node apps/web/scripts/check-mf8-assisted-consultation-ui.mjs` passa.
- [ ] `npm --prefix apps/web run build` passa.
- [ ] `npm --prefix apps/api test` passa ou falha por bloqueio de ambiente registado.
- [ ] `bash scripts/validate-planificacao.sh` passa.
- [ ] `git diff --check` passa.
- [ ] Negativos: mínimo `3` cenários controlados e registados.
- [ ] Cliente sem sessão vê erro controlado.
- [ ] Cliente não vê painel de revisão humana.
- [ ] Consultor não vê painéis privados de cliente.
- [ ] Mudança cliente -> logout -> consultor não mantém painel privado de cliente ativo.
- [ ] Endpoint de consultor mantém `403` para role cliente.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite`, `## Evidence para PR/defesa`.

#### Evidence para PR/defesa

- `proof_contrato`: output de `rg -n "BK-MF8-13|RF42|RF45|RF46|RNF26" docs/RF.md docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`.
- `proof_ui`: captura da página `AssistedConsultationHubPage` com cliente autenticado.
- `proof_consultor`: captura da mesma página com consultor ou administrador.
- `proof_negativos`: cliente sem sessão, cliente sem painel de consultor e consultor sem painéis de cliente.
- `proof_static`: output de `node apps/web/scripts/check-mf8-assisted-consultation-ui.mjs`.
- `proof_build`: output de `npm --prefix apps/web run build`.
- `proof_api`: output de `npm --prefix apps/api test` ou motivo técnico registado.
- `proof_planificacao`: output de `bash scripts/validate-planificacao.sh`.
- `proof_handoff`: nota a explicar que `BK-MF8-14` deve trabalhar sobre `AssistedConsultationHubPage`.

#### Handoff

Para o `BK-MF8-14`, entrega:

1. Página integrada `AssistedConsultationHubPage`.
2. Contrato de navegação `assistedConsultationNavigation.js`.
3. Pontos claros para cliente e consultor.
4. Estados de autenticação, autorização visual e navegação.
5. Script estático de validação.
6. Evidence mínima para defesa.

O `BK-MF8-14` deve melhorar hierarquia visual, responsividade, espaçamento, legibilidade e aproximação ao mockup sobre esta base. Não deve criar outro fluxo funcional de consulta assistida.

#### Changelog

| Data | Alteração |
| --- | --- |
| 2026-07-02 | Corrigido para transformar o BK numa implementação guiada: contrato de navegação, hub React, integração em `App.jsx`, evidence contract, check estático, validação e handoff para `BK-MF8-14`. |
| 2026-06-30 | Versão inicial revista para a estrutura tutorial MF8, com caminhos públicos `apps/...`, contrato de evidence, negativos mínimos e handoff explícito. |
