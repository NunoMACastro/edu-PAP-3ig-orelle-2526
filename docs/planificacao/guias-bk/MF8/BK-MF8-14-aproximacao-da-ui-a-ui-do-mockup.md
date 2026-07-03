# BK-MF8-14 - Aproximação da UI à UI do mockup

## Header
- `doc_id`: `GUIA-BK-MF8-14`
- `bk_id`: `BK-MF8-14`
- `macro`: `MF8`
- `owner`: `Aline`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF5-05, BK-MF5-06, BK-MF5-07, BK-MF8-13`
- `rf_rnf`: `RNF26`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-15`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md`
- `last_updated`: `2026-07-03`

#### Objetivo

Neste BK vais aproximar a interface integrada da consulta assistida à referência visual aprovada, preservando os contratos técnicos criados nos BKs anteriores.

O foco é melhorar hierarquia visual, espaçamento, responsividade, legibilidade, navegação e evidence visual dos ecrãs principais. O mockup orienta a experiência, mas não cria endpoints, permissões, campos, regras de biometria, regras de pagamento ou decisões de privacidade.

#### Importância

`RNF26` é um requisito `Must`: a interface final deve aproximar-se do mockup aprovado nos ecrãs principais. Isto é importante para a defesa porque a aplicação precisa de parecer uma experiência coerente e não apenas uma coleção de páginas técnicas.

Também é importante para segurança e manutenção. Ao trabalhar sobre `AssistedConsultationHubPage`, criada no `BK-MF8-13`, o aluno melhora a experiência visual sem criar um segundo fluxo de consulta assistida e sem enfraquecer autorização, ownership, consentimento ou minimização de dados no backend.

#### Scope-in

- Rever `RNF26`, `BK-MF8-13`, `BK-MF8-15` e os contratos visuais de MF5.
- Usar `mockup/` como referência visual se a pasta existir no checkout.
- Criar um checklist técnico de aproximação visual para o caso de o mockup não estar disponível no repo.
- Melhorar a página `AssistedConsultationHubPage` criada no `BK-MF8-13`.
- Adicionar estilos específicos para a experiência de consulta assistida.
- Validar responsividade, contraste, estados vazios/erro e navegação por role.
- Criar verificação estática e evidence mínima para PR/defesa.

#### Scope-out

- Não fazer pixel-perfect.
- Não criar endpoint backend novo.
- Não alterar DTOs, models, services, controllers, rotas, middleware de autenticação ou regras de autorização.
- Não usar o mockup para inventar campos, roles, permissões, pagamentos, biometria ou regras de negócio.
- Não adicionar produtos automaticamente ao carrinho a partir de recomendações.
- Não expor fotografias, relatórios sensíveis, tokens, cookies, paths internos ou dados pessoais em mensagens públicas.

#### Estado antes e depois

- Antes: o `BK-MF8-13` entregou uma interface integrada funcional, mas o polimento visual final ainda não estava guiado neste BK.
- Depois: o aluno tem uma implementação orientada para `RNF26`, com página integrada polida, estilos responsivos, checklist de comparação visual, check estático, evidence mínima e handoff para testes.

#### Pre-requisitos

- `BK-MF5-05`: interface moderna, intuitiva e responsive.
- `BK-MF5-06`: identidade visual, cores suaves e tipografia coerente.
- `BK-MF5-07`: mensagens claras, ícones acessíveis e feedback imediato.
- `BK-MF8-13`: página `AssistedConsultationHubPage`, contrato de navegação e integração em `App.jsx`.
- `RNF26`: aproximação da interface final ao mockup aprovado.

#### Glossário

- Mockup: referência visual e de fluxo. Ajuda a decidir hierarquia, labels e navegação, mas não define contratos técnicos.
- Baseline visual: conjunto mínimo de critérios visuais usado quando o mockup não está disponível no repo.
- Hierarquia visual: ordem de leitura da página, dando mais destaque ao título, etapa atual, ações principais e estados de feedback.
- Responsividade: capacidade da UI adaptar layout, espaçamento e leitura a desktop e mobile.
- Role gate visual: controlo de visibilidade no frontend que melhora a navegação, mas não substitui autorização backend.
- Evidence visual: prova objetiva da entrega, como screenshots desktop/mobile, lista de desvios aceites e comandos de validação.

#### Conceitos teóricos essenciais

O mockup é uma referência visual, não uma fonte de regras de negócio. Se o mockup mostrar um botão, esse botão só pode chamar um endpoint que já exista nos BKs anteriores ou que esteja documentado nos RF/RNF. Isto evita que uma decisão visual crie uma funcionalidade insegura ou impossível de validar.

Aproximação visual não é pixel-perfect. O objetivo do `RNF26` é que os ecrãs principais tenham a mesma intenção de experiência: leitura clara, fluxo previsível, ações visíveis, estados compreensíveis e boa adaptação a mobile. Pequenas diferenças são aceitáveis quando ficam justificadas em evidence.

Sem `mockup/` no checkout, a equipa usa um baseline visual `DERIVADO`. Esse baseline nasce de `RNF26`, dos BKs de MF5 e do handoff do `BK-MF8-13`: página integrada, cartões de etapas, destaque da etapa ativa, estados claros e grelha responsiva. Se o professor fornecer imagens do mockup, o aluno compara screenshots reais contra essas imagens antes de fechar o PR.

No frontend, um componente React organiza dados e estado visual. Neste BK, `AssistedConsultationHubPage` continua a receber a sessão por `useAuth`, calcula painéis permitidos com `getAssistedConsultationPanels` e renderiza páginas já criadas. O polimento visual acrescenta classes, mensagens e estrutura sem mudar endpoints.

Segurança continua no backend. Esconder um painel de consultor no frontend ajuda a navegação, mas não autoriza dados. Se um cliente chamar um endpoint reservado a consultores, a API deve continuar a devolver `403`. O BK preserva esta fronteira para evitar a falha comum de tratar UI como controlo de segurança.

Evidence é parte da entrega. Para um BK `P0`, não basta dizer que a UI ficou bonita. A equipa deve guardar screenshots desktop/mobile, negativos controlados e outputs de comandos. Isto prepara o `BK-MF8-15`, que verifica testes atuais e cria testes em falta.

Erros comuns a evitar: criar uma nova página paralela em vez de polir `AssistedConsultationHubPage`; copiar regras de negócio do mockup; remover estados de autenticação/erro; trocar nomes de painéis definidos no BK anterior; usar cores soltas em vez de tokens CSS; fechar o BK sem screenshots ou sem validar mobile.

#### Arquitetura do BK

- `bk_id`: `BK-MF8-14`
- `flow_id`: `FLOW-MF8-MOCKUP-ALIGNMENT`
- `requisitos`: `RNF26`
- `dependências`: `BK-MF5-05, BK-MF5-06, BK-MF5-07, BK-MF8-13`
- `tema técnico`: polimento visual frontend
- `destino dos alunos`: `apps/web` e contrato de evidence em `apps/api`
- `decisão CANONICO`: `RNF26` exige aproximação aos ecrãs principais do mockup.
- `decisão CANONICO`: `BK-MF8-14` depende de `BK-MF8-13` e entrega handoff para `BK-MF8-15`.
- `decisão DERIVADO`: como `mockup/` pode não existir no checkout, o baseline visual local fica documentado em `mockupAlignmentChecklist.js`.
- `decisão DERIVADO`: o polimento visual é frontend-only, porque o requisito é UX/UI e não altera contratos backend.

#### Ficheiros a criar/editar/rever

- REVER: `docs/RNF.md`
- REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
- REVER: `docs/planificacao/backlogs/BACKLOG-MVP.md`
- REVER: `docs/planificacao/backlogs/MF-VIEWS.md`
- REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-13-interface-integrada-cliente-consultor-para-consulta-assistida.md`
- REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-15-verificacao-dos-testes-atuais-e-criacao-dos-testes-em-falta.md`
- REVER: `mockup/`
- CRIAR: `apps/web/src/services/mockupAlignmentChecklist.js`
- EDITAR: `apps/web/src/pages/AssistedConsultationHubPage.jsx`
- EDITAR: `apps/web/src/styles.css`
- CRIAR: `apps/web/scripts/check-mf8-mockup-alignment.mjs`
- CRIAR: `apps/api/tests/evidence/bk-mf8-14.evidence-contract.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato visual e fronteiras

1. Objetivo funcional do passo no contexto da app.

Confirmar que o BK implementa `RNF26`, consome a base do `BK-MF8-13` e não transforma o mockup em contrato técnico.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/BACKLOG-MVP.md`
    - REVER: `docs/planificacao/backlogs/MF-VIEWS.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-13-interface-integrada-cliente-consultor-para-consulta-assistida.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-15-verificacao-dos-testes-atuais-e-criacao-dos-testes-em-falta.md`
    - LOCALIZAÇÃO: entradas `RNF26`, `BK-MF8-13`, `BK-MF8-14`, `BK-MF8-15` e handoff do BK anterior.

3. Instruções do que fazer.

Executa a pesquisa abaixo e confirma três factos antes de editar UI:

1. `RNF26` fala de aproximação visual dos ecrãs principais.
2. `BK-MF8-14` depende de `BK-MF8-13`.
3. `BK-MF8-15` depende de `BK-MF8-14`, por isso precisa de uma entrega visual testável.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é documental e evita que o aluno programe a partir de uma interpretação errada do mockup.

5. Explicação do código.

Sem código neste passo. A decisão importante é separar fonte visual de fonte técnica: `RNF26` e a matriz definem o que deve existir; o mockup ajuda a orientar a aparência; os BKs anteriores definem a base funcional.

6. Validação do passo.

Executa:

```bash
rg -n "RNF26|BK-MF8-13|BK-MF8-14|BK-MF8-15" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/BACKLOG-MVP.md docs/planificacao/backlogs/MF-VIEWS.md docs/planificacao/guias-bk/MF8/BK-MF8-13-interface-integrada-cliente-consultor-para-consulta-assistida.md docs/planificacao/guias-bk/MF8/BK-MF8-15-verificacao-dos-testes-atuais-e-criacao-dos-testes-em-falta.md
```

Resultado esperado: encontras `RNF26`, a linha canónica do `BK-MF8-14`, o handoff do `BK-MF8-13` e a dependência do `BK-MF8-15`.

7. Cenário negativo/erro esperado.

Se `BK-MF8-13` não entregar `AssistedConsultationHubPage`, para este BK e corrige primeiro o BK anterior. O polimento visual não deve criar uma segunda experiência funcional.

### Passo 2 - Criar checklist de aproximação visual

1. Objetivo funcional do passo no contexto da app.

Criar um checklist simples para guiar a comparação com o mockup ou, se `mockup/` não existir, com um baseline visual controlado.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/services/mockupAlignmentChecklist.js`
    - REVER: `mockup/`
    - LOCALIZAÇÃO: ficheiro completo novo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Ele não decide regras de negócio. Serve apenas para orientar evidence visual: que áreas foram comparadas, que critérios foram verificados e que desvios ficam aceites.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/src/services/mockupAlignmentChecklist.js
export const MOCKUP_ALIGNMENT_REQUIREMENT = "RNF26";

export const MOCKUP_ALIGNMENT_AREAS = [
    {
        id: "hero",
        label: "Cabeçalho da consulta assistida",
        expectedEvidence: "Screenshot desktop e mobile com título, descrição e estado de sessão visíveis.",
    },
    {
        id: "steps",
        label: "Etapas da consulta",
        expectedEvidence: "Screenshot com etapa ativa, labels legíveis e navegação por role.",
    },
    {
        id: "panel",
        label: "Painel ativo",
        expectedEvidence: "Screenshot do conteúdo principal sem sobreposição e sem dados sensíveis.",
    },
    {
        id: "empty-error",
        label: "Estados sem sessão, sem acesso e erro",
        expectedEvidence: "Prova de mensagens claras sem paths internos, tokens ou dados biométricos.",
    },
];

export const DEFAULT_VISUAL_BASELINE = [
    "Usar a página AssistedConsultationHubPage criada no BK-MF8-13.",
    "Mostrar hierarquia clara: contexto, título, resumo, etapas e painel ativo.",
    "Garantir leitura confortável em mobile com grelha de uma coluna.",
    "Usar tokens CSS existentes em vez de cores soltas.",
    "Manter role gate visual sem substituir autorização backend.",
    "Registar desvios quando o mockup aprovado não estiver no checkout.",
];

/**
 * Cria a matriz de evidence visual do BK-MF8-14.
 *
 * @function buildMockupAlignmentChecklist
 * @param {{hasMockup: boolean, reviewedAreas?: string[]}} options - Contexto da comparação visual.
 * @returns {{requirement: string, mode: "mockup" | "baseline", areas: typeof MOCKUP_ALIGNMENT_AREAS, baseline: string[], reviewedAreas: string[]}} Checklist normalizado.
 */
export function buildMockupAlignmentChecklist({ hasMockup, reviewedAreas = [] }) {
    const safeReviewedAreas = Array.isArray(reviewedAreas)
        ? reviewedAreas.filter((area) =>
              MOCKUP_ALIGNMENT_AREAS.some((expectedArea) => expectedArea.id === area),
          )
        : [];

    return {
        requirement: MOCKUP_ALIGNMENT_REQUIREMENT,
        mode: hasMockup ? "mockup" : "baseline",
        areas: MOCKUP_ALIGNMENT_AREAS,
        // O baseline só orienta UX; contratos técnicos continuam nos RF/RNF e BKs anteriores.
        baseline: DEFAULT_VISUAL_BASELINE,
        reviewedAreas: safeReviewedAreas,
    };
}

/**
 * Valida se a equipa recolheu evidence visual mínima para o BK.
 *
 * @function assertMockupAlignmentEvidence
 * @param {{requirement: string, reviewedAreas: string[], screenshots: string[], deviations: string[]}} evidence - Evidence recolhida para PR/defesa.
 * @returns {{status: "valid", reviewedAreas: number, screenshots: number, deviations: number}} Resultado resumido.
 * @throws {Error} Quando a evidence não cobre requisito, áreas e screenshots mínimos.
 */
export function assertMockupAlignmentEvidence(evidence) {
    const reviewedAreas = Array.isArray(evidence?.reviewedAreas)
        ? evidence.reviewedAreas
        : [];
    const screenshots = Array.isArray(evidence?.screenshots)
        ? evidence.screenshots
        : [];
    const deviations = Array.isArray(evidence?.deviations)
        ? evidence.deviations
        : [];

    if (evidence?.requirement !== MOCKUP_ALIGNMENT_REQUIREMENT) {
        throw new Error("Evidence visual fora do contrato RNF26.");
    }

    if (reviewedAreas.length < MOCKUP_ALIGNMENT_AREAS.length) {
        throw new Error("Evidence visual não cobre todos os ecrãs principais.");
    }

    // Desktop e mobile são obrigatórios porque RNF26 fecha a experiência final da app.
    if (screenshots.length < 2) {
        throw new Error("Evidence visual precisa de screenshot desktop e mobile.");
    }

    return {
        status: "valid",
        reviewedAreas: reviewedAreas.length,
        screenshots: screenshots.length,
        deviations: deviations.length,
    };
}
```

5. Explicação do código.

`MOCKUP_ALIGNMENT_AREAS` lista as zonas que o aluno deve comparar: cabeçalho, etapas, painel ativo e estados de erro/sem sessão. Isto transforma `RNF26` numa checklist objetiva, sem inventar endpoints.

`DEFAULT_VISUAL_BASELINE` existe para o caso de `mockup/` não estar presente no checkout. A decisão é `DERIVADO`: aproxima a UI com base nos BKs MF5 e BK13, mas obriga a registar desvios se o mockup oficial aparecer mais tarde.

`buildMockupAlignmentChecklist` devolve um objeto com `mode: "mockup"` ou `mode: "baseline"`. Esse modo ajuda a explicar na evidence se a equipa comparou contra imagens reais ou contra baseline local.

`assertMockupAlignmentEvidence` valida a evidence final. Exige `RNF26`, todas as áreas revistas e pelo menos dois screenshots. As mensagens de erro são genéricas e não expõem dados pessoais, fotos ou paths internos.

6. Validação do passo.

Executa:

```bash
node --check apps/web/src/services/mockupAlignmentChecklist.js
rg -n "MOCKUP_ALIGNMENT_AREAS|DEFAULT_VISUAL_BASELINE|assertMockupAlignmentEvidence" apps/web/src/services/mockupAlignmentChecklist.js
```

7. Cenário negativo/erro esperado.

Se a equipa entregar só um screenshot desktop, `assertMockupAlignmentEvidence` deve lançar `Evidence visual precisa de screenshot desktop e mobile.`.

### Passo 3 - Polir a página integrada do BK-MF8-13

1. Objetivo funcional do passo no contexto da app.

Editar `AssistedConsultationHubPage` para apresentar uma experiência visual mais próxima de um ecrã final: cabeçalho forte, cartões de etapas, painel destacado, estados claros e leitura mobile.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/pages/AssistedConsultationHubPage.jsx`
    - REVER: `apps/web/src/services/assistedConsultationNavigation.js`
    - REVER: `apps/web/src/context/AuthContext.jsx`
    - REVER: `apps/web/src/pages/GuidedConsultationPage.jsx`
    - REVER: `apps/web/src/pages/AiHistoryPage.jsx`
    - REVER: `apps/web/src/pages/ProductRecommendationsPage.jsx`
    - REVER: `apps/web/src/pages/ClientAiInsightsPage.jsx`
    - REVER: `apps/web/src/pages/ConsultantAiReviewPage.jsx`
    - LOCALIZAÇÃO: ficheiro completo `apps/web/src/pages/AssistedConsultationHubPage.jsx`.

3. Instruções do que fazer.

Substitui o ficheiro por esta versão completa. Mantém os imports e nomes entregues pelo `BK-MF8-13`; o objetivo é polir a UI, não recriar a lógica funcional.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/AssistedConsultationHubPage.jsx
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
    ASSISTED_CONSULTATION_PANELS,
    getAssistedConsultationPanels,
} from "../services/assistedConsultationNavigation.js";
import { buildMockupAlignmentChecklist } from "../services/mockupAlignmentChecklist.js";
import { AiHistoryPage } from "./AiHistoryPage.jsx";
import { ClientAiInsightsPage } from "./ClientAiInsightsPage.jsx";
import { ConsultantAiReviewPage } from "./ConsultantAiReviewPage.jsx";
import { GuidedConsultationPage } from "./GuidedConsultationPage.jsx";
import { ProductRecommendationsPage } from "./ProductRecommendationsPage.jsx";

const ALIGNMENT_CHECKLIST = buildMockupAlignmentChecklist({
    hasMockup: false,
    reviewedAreas: ["hero", "steps", "panel", "empty-error"],
});

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
                <p className="assisted-consultation-empty" role="alert">
                    Não foi possível abrir este painel da consulta assistida.
                </p>
            );
    }
}

/**
 * Integra consulta guiada, histórico IA, recomendações, insights e revisão humana.
 *
 * @function AssistedConsultationHubPage
 * @returns {import("react").JSX.Element} Página integrada com acabamento visual RNF26.
 */
export function AssistedConsultationHubPage() {
    const { user, loading } = useAuth();
    const [activePanelId, setActivePanelId] = useState("");
    const [, setRecommendations] = useState([]);

    const panels = useMemo(() => getAssistedConsultationPanels(user), [user]);
    const selectedPanelId = panels.some((panel) => panel.id === activePanelId)
        ? activePanelId
        : panels[0]?.id || "";
    const selectedPanel = panels.find((panel) => panel.id === selectedPanelId);

    if (loading) {
        return (
            <section className="assisted-consultation-shell" aria-busy="true">
                <p className="app-kicker">Consulta IA guiada</p>
                <h1>Consulta assistida</h1>
                <p className="assisted-consultation-empty">
                    A carregar a tua sessão segura.
                </p>
            </section>
        );
    }

    if (!user) {
        return (
            <section className="assisted-consultation-shell">
                <p className="app-kicker">Consulta IA guiada</p>
                <h1>Consulta assistida</h1>
                <p className="assisted-consultation-empty" role="alert">
                    Inicia sessão para aceder à consulta assistida.
                </p>
            </section>
        );
    }

    if (panels.length === 0) {
        return (
            <section className="assisted-consultation-shell">
                <p className="app-kicker">Consulta IA guiada</p>
                <h1>Consulta assistida</h1>
                <p className="assisted-consultation-empty" role="alert">
                    O teu perfil não tem acesso a esta área.
                </p>
            </section>
        );
    }

    return (
        <section
            className="assisted-consultation-shell"
            aria-labelledby="assisted-consultation-title"
        >
            <header className="assisted-consultation-hero">
                <div>
                    <p className="app-kicker">Consulta IA guiada</p>
                    <h1 id="assisted-consultation-title">Consulta assistida</h1>
                    <p>
                        Acompanha avaliação, histórico, recomendações e revisão
                        humana num fluxo visual único.
                    </p>
                </div>

                <aside className="assisted-consultation-status" aria-label="Estado da sessão">
                    <span>Sessão ativa</span>
                    <strong>{user.email}</strong>
                    <small>{user.role}</small>
                </aside>
            </header>

            <div className="assisted-consultation-grid">
                <nav
                    className="assisted-consultation-steps"
                    aria-label="Etapas da consulta assistida"
                >
                    {panels.map((panel, index) => (
                        <button
                            key={panel.id}
                            type="button"
                            className="assisted-consultation-step"
                            aria-pressed={selectedPanelId === panel.id}
                            onClick={() => setActivePanelId(panel.id)}
                        >
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <strong>{panel.label}</strong>
                            <small>{panel.description}</small>
                        </button>
                    ))}
                </nav>

                <article className="assisted-consultation-panel">
                    <header className="assisted-consultation-panel-header">
                        <div>
                            <p className="app-kicker">Etapa atual</p>
                            <h2>{selectedPanel?.label ?? "Consulta assistida"}</h2>
                        </div>
                        <span>{ALIGNMENT_CHECKLIST.requirement}</span>
                    </header>

                    <div className="assisted-consultation-panel-body" aria-live="polite">
                        {/* A UI reutiliza páginas existentes; autorização real continua na API. */}
                        {renderAssistedConsultationPanel(selectedPanelId, setRecommendations)}
                    </div>
                </article>
            </div>
        </section>
    );
}
```

5. Explicação do código.

Este ficheiro continua a consumir `useAuth`, `getAssistedConsultationPanels` e as páginas criadas nos BKs anteriores. Isso preserva a sequência da MF8 e evita criar outro fluxo funcional de consulta.

`ALIGNMENT_CHECKLIST` marca o uso do baseline visual `DERIVADO`. Se `mockup/` existir no checkout da equipa, o aluno pode trocar `hasMockup: false` por `true` depois de anexar screenshots reais à evidence. Esta mudança não altera lógica de negócio.

Os estados `loading`, sem sessão e sem acesso usam a mesma shell visual. Isto faz com que a página pareça consistente mesmo em cenários negativos. As mensagens são claras e não expõem tokens, cookies, fotografias, relatórios ou paths internos.

`selectedPanelId` continua protegido contra mudança de role na mesma SPA. Se um cliente escolher um painel e depois entrar como consultor, o painel ativo volta ao primeiro painel permitido pela nova role.

A grelha separa navegação e painel ativo. Em desktop fica lado a lado; em mobile passa para uma coluna com CSS no próximo passo. Isto cumpre `RNF26` sem criar dependências novas.

6. Validação do passo.

Executa:

```bash
rg -n "assisted-consultation-shell|buildMockupAlignmentChecklist|aria-pressed|aria-live" apps/web/src/pages/AssistedConsultationHubPage.jsx
```

7. Cenário negativo/erro esperado.

Se removeres `getAssistedConsultationPanels(user)` e mostrares todos os painéis a todos os utilizadores, a UI passa a sugerir permissões falsas. O backend ainda deve bloquear, mas a experiência fica errada e deve ser corrigida.

### Passo 4 - Adicionar estilos responsivos ao fluxo

1. Objetivo funcional do passo no contexto da app.

Adicionar estilos para transformar a página integrada numa experiência visual coerente, legível e responsive, sem depender de biblioteca nova.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/styles.css`
    - LOCALIZAÇÃO: acrescentar o bloco no fim do ficheiro.

3. Instruções do que fazer.

Acrescenta o bloco abaixo ao fim de `apps/web/src/styles.css`. Usa os tokens CSS já existentes (`--surface`, `--brand-primary`, `--line`, `--shadow-soft`) para manter coerência com MF5.

4. Código completo, correto e integrado com a app final.

```css
/* apps/web/src/styles.css */
.assisted-consultation-shell {
    display: grid;
    gap: 1.25rem;
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 0.75rem;
    padding: clamp(1rem, 2vw, 1.5rem);
    background: var(--surface-glass);
    box-shadow: var(--shadow-soft);
}

.assisted-consultation-hero {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 1rem;
}

.assisted-consultation-hero h1 {
    margin: 0;
    color: var(--brand-primary-strong);
}

.assisted-consultation-hero p {
    max-width: 62ch;
    margin: 0.35rem 0 0;
    color: var(--muted);
}

.assisted-consultation-status {
    display: grid;
    min-width: 14rem;
    border: 1px solid var(--line);
    border-radius: 0.75rem;
    padding: 0.9rem;
    background: var(--session-surface);
}

.assisted-consultation-status span,
.assisted-consultation-status small {
    color: var(--muted);
}

.assisted-consultation-status strong {
    overflow-wrap: anywhere;
}

.assisted-consultation-grid {
    display: grid;
    grid-template-columns: minmax(14rem, 0.85fr) minmax(0, 2fr);
    gap: 1rem;
    align-items: start;
}

.assisted-consultation-steps {
    display: grid;
    gap: 0.65rem;
}

.assisted-consultation-step {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.15rem 0.75rem;
    width: 100%;
    min-height: 5.25rem;
    border: 1px solid var(--line);
    border-radius: 0.75rem;
    padding: 0.85rem;
    color: var(--ink);
    background: var(--surface);
    box-shadow: none;
    text-align: left;
}

.assisted-consultation-step:hover {
    transform: none;
}

.assisted-consultation-step[aria-pressed="true"] {
    border-color: var(--brand-primary);
    background: var(--brand-blush);
    box-shadow: 0 0 0 3px var(--focus-ring);
}

.assisted-consultation-step span {
    grid-row: span 2;
    color: var(--brand-primary);
    font-weight: 800;
}

.assisted-consultation-step small {
    color: var(--muted);
}

.assisted-consultation-panel {
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 0.75rem;
    background: var(--surface);
    overflow: hidden;
}

.assisted-consultation-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--line);
    padding: 1rem;
    background: var(--surface-soft);
}

.assisted-consultation-panel-header h2 {
    margin: 0;
}

.assisted-consultation-panel-header span {
    border-radius: 999px;
    padding: 0.25rem 0.6rem;
    color: var(--button-foreground);
    background: var(--brand-primary);
    font-size: 0.85rem;
    font-weight: 700;
}

.assisted-consultation-panel-body {
    display: grid;
    gap: 1rem;
    padding: 1rem;
}

.assisted-consultation-empty {
    border: 1px dashed var(--line);
    border-radius: 0.75rem;
    padding: 1rem;
    color: var(--muted);
    background: var(--status-surface);
}

@media (max-width: 760px) {
    .assisted-consultation-hero,
    .assisted-consultation-panel-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .assisted-consultation-grid {
        grid-template-columns: 1fr;
    }

    .assisted-consultation-status {
        width: 100%;
    }
}
```

5. Explicação do código.

O bloco cria uma shell visual para a consulta assistida. A página fica destacada, mas continua dentro do sistema visual existente porque usa tokens CSS já definidos nos BKs de MF5.

`.assisted-consultation-grid` cria duas zonas em desktop: navegação por etapas e painel ativo. O `@media` muda para uma coluna em ecrãs pequenos, evitando texto apertado ou sobreposto.

Os botões de etapa usam `aria-pressed` no JSX e `[aria-pressed="true"]` no CSS. Assim, o estado ativo é visível para utilizadores e continua legível para tecnologia assistiva.

`overflow-wrap: anywhere` no email evita que uma sessão com email longo quebre o layout mobile. Este detalhe protege a experiência sem esconder o email nem expor dados extra.

6. Validação do passo.

Executa:

```bash
rg -n "assisted-consultation-shell|assisted-consultation-grid|@media \\(max-width: 760px\\)" apps/web/src/styles.css
npm --prefix apps/web run build
```

7. Cenário negativo/erro esperado.

Se a grelha ficar sempre em duas colunas no mobile, o painel pode ficar apertado e gerar texto sobreposto. A regra `@media` deve existir antes de fechar o BK.

### Passo 5 - Criar verificação estática do BK-MF8-14

1. Objetivo funcional do passo no contexto da app.

Criar um script que confirma se o polimento visual foi aplicado nos ficheiros certos e se o BK consome o handoff do `BK-MF8-13`.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/scripts/check-mf8-mockup-alignment.mjs`
    - REVER: `apps/web/src/pages/AssistedConsultationHubPage.jsx`
    - REVER: `apps/web/src/services/mockupAlignmentChecklist.js`
    - REVER: `apps/web/src/styles.css`
    - LOCALIZAÇÃO: ficheiro completo novo.

3. Instruções do que fazer.

Cria o script abaixo. Ele deve correr a partir da raiz do projeto com `node apps/web/scripts/check-mf8-mockup-alignment.mjs`.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/scripts/check-mf8-mockup-alignment.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const REQUIRED_FILES = [
    "apps/web/src/services/mockupAlignmentChecklist.js",
    "apps/web/src/pages/AssistedConsultationHubPage.jsx",
    "apps/web/src/styles.css",
];

const REQUIRED_PATTERNS = [
    {
        file: "apps/web/src/services/mockupAlignmentChecklist.js",
        pattern: "MOCKUP_ALIGNMENT_REQUIREMENT",
    },
    {
        file: "apps/web/src/pages/AssistedConsultationHubPage.jsx",
        pattern: "buildMockupAlignmentChecklist",
    },
    {
        file: "apps/web/src/pages/AssistedConsultationHubPage.jsx",
        pattern: "assisted-consultation-shell",
    },
    {
        file: "apps/web/src/pages/AssistedConsultationHubPage.jsx",
        pattern: "aria-pressed",
    },
    {
        file: "apps/web/src/styles.css",
        pattern: ".assisted-consultation-grid",
    },
    {
        file: "apps/web/src/styles.css",
        pattern: "@media (max-width: 760px)",
    },
];

/**
 * Lê um ficheiro obrigatório do projeto.
 *
 * @function readRequiredFile
 * @param {string} relativePath - Caminho relativo à raiz do projeto.
 * @returns {string} Conteúdo textual do ficheiro.
 * @throws {Error} Quando o ficheiro não existe.
 */
function readRequiredFile(relativePath) {
    const absolutePath = path.join(ROOT, relativePath);

    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Ficheiro obrigatório em falta: ${relativePath}`);
    }

    return fs.readFileSync(absolutePath, "utf8");
}

/**
 * Valida a presença dos ficheiros e padrões essenciais do BK-MF8-14.
 *
 * @function checkMockupAlignment
 * @returns {{files: number, patterns: number}} Contagem de provas verificadas.
 * @throws {Error} Quando falta um ficheiro ou padrão obrigatório.
 */
export function checkMockupAlignment() {
    const contents = new Map();

    for (const file of REQUIRED_FILES) {
        contents.set(file, readRequiredFile(file));
    }

    for (const item of REQUIRED_PATTERNS) {
        const content = contents.get(item.file) ?? readRequiredFile(item.file);

        // Cada padrão prova que RNF26 ficou ligado ao hub do BK13 e ao CSS responsive.
        if (!content.includes(item.pattern)) {
            throw new Error(`Padrão obrigatório em falta: ${item.pattern}`);
        }
    }

    return {
        files: REQUIRED_FILES.length,
        patterns: REQUIRED_PATTERNS.length,
    };
}

const result = checkMockupAlignment();
console.log(
    `BK-MF8-14 alinhamento visual validado: ${result.files} ficheiros e ${result.patterns} padrões.`,
);
```

5. Explicação do código.

O script usa apenas APIs nativas do Node.js. Primeiro confirma que os ficheiros do BK existem. Depois procura padrões mínimos que provam o essencial: checklist visual, consumo do checklist pela página, classes de UI, `aria-pressed` e media query mobile.

Este check não substitui screenshots nem revisão manual. Ele impede uma entrega incompleta, por exemplo criar o checklist mas esquecer de o importar no hub, ou escrever CSS sem media query.

6. Validação do passo.

Executa:

```bash
node --check apps/web/scripts/check-mf8-mockup-alignment.mjs
node apps/web/scripts/check-mf8-mockup-alignment.mjs
```

Resultado esperado:

```txt
BK-MF8-14 alinhamento visual validado: 3 ficheiros e 6 padrões.
```

7. Cenário negativo/erro esperado.

Se removeres `.assisted-consultation-grid` do CSS, o script deve falhar com `Padrão obrigatório em falta: .assisted-consultation-grid`.

### Passo 6 - Criar contrato de evidence do BK

1. Objetivo funcional do passo no contexto da app.

Criar um contrato de evidence que obriga a equipa a provar `RNF26` com screenshots, áreas revistas e cenários negativos.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/evidence/bk-mf8-14.evidence-contract.js`
    - LOCALIZAÇÃO: ficheiro completo novo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Ele valida evidence para PR/defesa; não substitui testes unitários, build ou revisão visual.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/evidence/bk-mf8-14.evidence-contract.js
const BK_ID = "BK-MF8-14";
const REQUIRED_REQUIREMENTS = ["RNF26"];
const REQUIRED_AREAS = ["hero", "steps", "panel", "empty-error"];
const MINIMUM_SCREENSHOTS = 2;
const MINIMUM_NEGATIVE_SCENARIOS = 3;

/**
 * Valida evidence mínima da aproximação visual ao mockup.
 *
 * @function validateBKMF814Evidence
 * @param {{bkId: string, requirements: string[], reviewedAreas: string[], screenshots: string[], negativeScenarios: string[], deviations: string[]}} evidence - Evidence recolhida para PR/defesa.
 * @returns {{bkId: string, status: "valid", domain: "mockup_alignment"}} Resultado normalizado.
 * @throws {Error} Quando a evidence não cobre requisito, screenshots, áreas ou negativos mínimos.
 */
export function validateBKMF814Evidence(evidence) {
    const requirements = Array.isArray(evidence?.requirements)
        ? evidence.requirements
        : [];
    const reviewedAreas = Array.isArray(evidence?.reviewedAreas)
        ? evidence.reviewedAreas
        : [];
    const screenshots = Array.isArray(evidence?.screenshots)
        ? evidence.screenshots
        : [];
    const negativeScenarios = Array.isArray(evidence?.negativeScenarios)
        ? evidence.negativeScenarios
        : [];

    if (evidence?.bkId !== BK_ID) {
        throw new Error("Evidence associada ao BK errado.");
    }

    const missingRequirement = REQUIRED_REQUIREMENTS.find(
        (requirement) => !requirements.includes(requirement),
    );

    if (missingRequirement) {
        throw new Error(`Evidence sem requisito obrigatório: ${missingRequirement}.`);
    }

    const missingArea = REQUIRED_AREAS.find(
        (area) => !reviewedAreas.includes(area),
    );

    if (missingArea) {
        throw new Error(`Evidence sem área visual obrigatória: ${missingArea}.`);
    }

    // O BK é P0: a equipa tem de mostrar pelo menos desktop e mobile.
    if (screenshots.length < MINIMUM_SCREENSHOTS) {
        throw new Error("Evidence visual precisa de screenshots desktop e mobile.");
    }

    if (negativeScenarios.length < MINIMUM_NEGATIVE_SCENARIOS) {
        throw new Error("Cenários negativos abaixo do mínimo P0.");
    }

    return {
        bkId: BK_ID,
        status: "valid",
        domain: "mockup_alignment",
    };
}
```

5. Explicação do código.

`BK_ID` impede usar evidence de outro BK. `REQUIRED_REQUIREMENTS` prende a entrega a `RNF26`. `REQUIRED_AREAS` obriga a equipa a provar cabeçalho, etapas, painel ativo e estados negativos.

Os screenshots mínimos são dois: desktop e mobile. Isto não garante design perfeito, mas evita fechar um requisito visual sem prova da responsividade. Os negativos mínimos são três porque o BK é `P0`.

As mensagens de erro não incluem dados pessoais nem caminhos internos. O ficheiro usa JavaScript simples e pode ser importado por Vitest no `BK-MF8-15`.

6. Validação do passo.

Executa:

```bash
node --check apps/api/tests/evidence/bk-mf8-14.evidence-contract.js
```

7. Cenário negativo/erro esperado.

Se a evidence não incluir a área `empty-error`, a função deve lançar `Evidence sem área visual obrigatória: empty-error.`.

### Passo 7 - Validar fluxo visual, negativos e handoff

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com comandos reais, screenshots, cenários negativos e passagem explícita para o `BK-MF8-15`.

2. Ficheiros envolvidos:
    - REVER: `apps/web/package.json`
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/src/pages/AssistedConsultationHubPage.jsx`
    - REVER: `apps/web/src/services/mockupAlignmentChecklist.js`
    - REVER: `apps/web/scripts/check-mf8-mockup-alignment.mjs`
    - REVER: `apps/api/tests/evidence/bk-mf8-14.evidence-contract.js`
    - LOCALIZAÇÃO: comandos de validação e evidence para PR/defesa.

3. Instruções do que fazer.

Executa os comandos abaixo e recolhe evidence. Se `mockup/` existir, guarda screenshots lado a lado com os ecrãs reais. Se não existir, regista `mode: "baseline"` e justifica que a comparação usou o baseline visual documentado.

Cenários negativos mínimos:

1. utilizador sem sessão abre a consulta assistida;
2. cliente não vê painel de revisão humana;
3. consultor não vê painéis privados de cliente;
4. email longo na sessão não parte o layout mobile;
5. ausência de screenshot mobile invalida a evidence;
6. mockup tenta justificar endpoint novo e a decisão é rejeitada.

7. Executar cenarios negativos obrigatorios (minimo 3) e guardar evidence.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. A entrega aqui é validação final, evidence e handoff.

5. Explicação do código.

Sem código neste passo porque os ficheiros já foram criados nos passos anteriores. A validação prova que os ficheiros encaixam entre si, que a UI compila, que a planificação continua coerente e que a equipa não fechou `RNF26` sem evidence visual.

6. Validação do passo.

Executa:

```bash
node --check apps/web/src/services/mockupAlignmentChecklist.js
node --check apps/web/scripts/check-mf8-mockup-alignment.mjs
node apps/web/scripts/check-mf8-mockup-alignment.mjs
node --check apps/api/tests/evidence/bk-mf8-14.evidence-contract.js
npm --prefix apps/web run build
npm --prefix apps/api test
bash scripts/validate-planificacao.sh
git diff --check
```

7. Cenário negativo/erro esperado.

Se `node apps/web/scripts/check-mf8-mockup-alignment.mjs` falhar, não avances para o `BK-MF8-15`. Corrige primeiro a ligação entre checklist, página e CSS.

#### Expected results

- `AssistedConsultationHubPage` consome `buildMockupAlignmentChecklist`.
- A página mostra cabeçalho, estado de sessão, etapas e painel ativo com hierarquia visual clara.
- A navegação por etapas continua a usar painéis permitidos pela role atual.
- O layout desktop usa duas zonas principais e o layout mobile usa uma coluna.
- As mensagens sem sessão e sem acesso são claras e não expõem dados sensíveis.
- `mockupAlignmentChecklist.js` permite evidence em modo `mockup` ou `baseline`.
- `check-mf8-mockup-alignment.mjs` valida ficheiros e padrões essenciais.
- `bk-mf8-14.evidence-contract.js` obriga a screenshots desktop/mobile, áreas revistas e negativos mínimos.
- O `BK-MF8-15` recebe uma entrega visual verificável para criar testes em falta.

#### Critérios de aceite

- `apps/web/src/services/mockupAlignmentChecklist.js` criado com checklist, baseline e validação de evidence visual.
- `apps/web/src/pages/AssistedConsultationHubPage.jsx` editado para consumir o checklist, manter role gate visual e aplicar classes do BK14.
- `apps/web/src/styles.css` atualizado com estilos responsive da consulta assistida.
- `apps/web/scripts/check-mf8-mockup-alignment.mjs` criado e executado com sucesso.
- `apps/api/tests/evidence/bk-mf8-14.evidence-contract.js` criado com validação de `RNF26`.
- Nenhum endpoint backend novo foi criado.
- Nenhuma regra de autorização, ownership, consentimento, biometria ou pagamento foi movida para o frontend.
- Evidence inclui screenshots desktop/mobile ou justificação `baseline` se `mockup/` não estiver disponível.
- Cenários negativos concluídos: mínimo `3`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).

### Matriz minima de testes por prioridade

- Para `P0`: check estático, build frontend, teste API relevante, validação da planificação, smoke manual desktop/mobile e mínimo de 3 cenários negativos.
- Para `P1`: check estático ou unitário, build quando tocar frontend e mínimo de 2 cenários negativos.
- Para `P2`: validação focal do ficheiro alterado e mínimo de 1 cenário negativo.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) preservados.
- Evidence pronta para PR/defesa.

#### Validação final

- [ ] `node --check apps/web/src/services/mockupAlignmentChecklist.js` passa.
- [ ] `node --check apps/web/scripts/check-mf8-mockup-alignment.mjs` passa.
- [ ] `node apps/web/scripts/check-mf8-mockup-alignment.mjs` passa.
- [ ] `node --check apps/api/tests/evidence/bk-mf8-14.evidence-contract.js` passa.
- [ ] `npm --prefix apps/web run build` passa.
- [ ] `npm --prefix apps/api test` passa ou falha por bloqueio de ambiente registado.
- [ ] `bash scripts/validate-planificacao.sh` passa.
- [ ] `git diff --check` passa.
- [ ] Screenshots desktop e mobile ficam anexados à evidence.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Sem sessão: a página mostra erro controlado.
- [ ] Cliente não vê revisão humana.
- [ ] Consultor não vê painéis privados de cliente.
- [ ] Email longo não quebra o cartão de sessão em mobile.
- [ ] Mockup não cria endpoint, campo, role ou regra de negócio.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite`, `## Evidence para PR/defesa`.

#### Evidence para PR/defesa

- `proof_contrato`: output de `rg -n "RNF26|BK-MF8-14" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`.
- `proof_handoff_bk13`: output de `rg -n "AssistedConsultationHubPage|BK-MF8-14" docs/planificacao/guias-bk/MF8/BK-MF8-13-interface-integrada-cliente-consultor-para-consulta-assistida.md`.
- `proof_ui_desktop`: screenshot desktop da consulta assistida.
- `proof_ui_mobile`: screenshot mobile da consulta assistida.
- `proof_negativos`: evidência dos negativos sem sessão, cliente sem revisão humana e consultor sem painéis privados de cliente.
- `proof_static`: output de `node apps/web/scripts/check-mf8-mockup-alignment.mjs`.
- `proof_build`: output de `npm --prefix apps/web run build`.
- `proof_api`: output de `npm --prefix apps/api test` ou motivo técnico registado.
- `proof_planificacao`: output de `bash scripts/validate-planificacao.sh`.
- `proof_diff`: output de `git diff --check`.
- `proof_desvios`: lista de diferenças aceites face ao mockup ou indicação `baseline` se `mockup/` não estiver disponível.

#### Handoff

Para o `BK-MF8-15`, entrega:

1. checklist visual em `apps/web/src/services/mockupAlignmentChecklist.js`;
2. página `AssistedConsultationHubPage` polida e ligada ao fluxo do `BK-MF8-13`;
3. estilos responsive em `apps/web/src/styles.css`;
4. check estático `apps/web/scripts/check-mf8-mockup-alignment.mjs`;
5. contrato de evidence `apps/api/tests/evidence/bk-mf8-14.evidence-contract.js`;
6. screenshots desktop/mobile ou justificação do modo `baseline`;
7. negativos mínimos registados.

O `BK-MF8-15` deve usar estes ficheiros para verificar os testes atuais e criar testes em falta. Não deve reabrir contratos de backend nem criar outro fluxo de consulta assistida.

#### Changelog

| Data | Alteração |
| --- | --- |
| 2026-07-03 | Corrigido para consumir `AssistedConsultationHubPage`, criar checklist visual, adicionar CSS responsive, check estático, evidence contract e fallback `DERIVADO` quando `mockup/` não está disponível. |
| 2026-06-30 | Versão inicial revista para a estrutura tutorial MF8, com caminhos públicos `apps/...`, contrato de evidence, negativos mínimos e handoff explícito. |
