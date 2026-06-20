# BK-MF5-08 - Modo escuro e contraste ajustado

## Header
- `doc_id`: `GUIA-BK-MF5-08`
- `bk_id`: `BK-MF5-08`
- `macro`: `MF5`
- `owner`: `Daniel Bulica`
- `apoio`: `Aline`
- `prioridade`: `P2`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `-`
- `rf_rnf`: `RNF04`
- `fase_documental`: `Fase 2`
- `sprint`: `S09-S10`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF6-01`
- `guia_path`: `docs/planificacao/guias-bk/MF5/BK-MF5-08-modo-escuro-e-contraste-ajustado.md`
- `last_updated`: `2026-06-20`

#### Objetivo

Neste BK vais acrescentar modo escuro e contraste ajustado à interface da Orélle, usando tokens CSS, um hook React e um controlo acessível de tema no frontend `real_dev/web`.

#### Importância

`RNF04` exige modo escuro e contraste ajustado. Na Orélle, isto é importante porque a aplicação tem formulários, painéis administrativos, mensagens de feedback, uploads faciais e relatórios visuais. O utilizador deve conseguir ler, preencher e rever informação com conforto, sem perder contraste, foco ou orientação.

#### Scope-in

- Definir tokens CSS para os temas `light`, `dark` e `contrast`.
- Criar `useThemePreference` em `real_dev/web`.
- Criar `ThemeControls` em `real_dev/web`.
- Aplicar o tema no atributo `data-theme` do elemento HTML raiz.
- Integrar os controlos de tema no header da aplicação.
- Validar contraste visual em botões, inputs, mensagens e cartões.
- Formalizar validação `P2` com teste focal e 1 cenário negativo obrigatório.

#### Scope-out

- Não alterar autenticação, autorização, roles, consentimento ou endpoints.
- Não guardar tokens, cookies, fotografias, relatórios ou dados pessoais em preferências visuais.
- Não criar preferência persistente no backend.
- Não mudar conteúdo funcional das páginas.
- Não instalar biblioteca visual.
- Não substituir testes de acessibilidade por mera observação de cores.

#### Estado antes e depois

- Antes: a UI tem base clara e tokens visuais, mas não oferece alternância explícita entre tema claro, escuro e contraste.
- Depois: a UI consegue alternar entre `light`, `dark` e `contrast`, preservando legibilidade, foco, mensagens e feedback acessível.

#### Pre-requisitos

- `BK-MF5-05`: estrutura responsive base em `real_dev/web`.
- `BK-MF5-06`: tokens visuais, tipografia e estética da marca.
- `BK-MF5-07`: mensagens e botões com feedback acessível.
- `real_dev/web/src/App.jsx`: shell principal do frontend.
- `real_dev/web/src/styles.css`: CSS global da aplicação.
- `RNF04`: modo escuro e contraste ajustado.

#### Glossário

- Tema: conjunto de tokens visuais ativos.
- Modo escuro: tema com fundos escuros e texto claro.
- Alto contraste: tema com separação reforçada entre texto, fundo, foco e ações.
- Token CSS: variável CSS reutilizada por componentes.
- Dataset: atributo `data-theme` no elemento HTML raiz.
- Preferência do sistema: escolha visual indicada pelo sistema operativo do utilizador.
- Foco visível: indicação clara de que um input, botão ou controlo está ativo por teclado.

#### Conceitos teóricos essenciais

Tema deve ser aplicado por tokens, não por estilos soltos em cada componente. Assim, o mesmo botão ou mensagem funciona nos três modos sem duplicar JSX.

O tema é apenas preferência visual. Não transporta identidade, sessão, permissões, consentimento, fotografias, relatórios ou dados pessoais. A autenticação continua separada no contrato já existente da app.

Alto contraste não é o mesmo que modo escuro. Modo escuro reduz luminosidade; alto contraste aumenta a diferença entre texto, fundo, contorno e foco para facilitar leitura.

`data-theme` é uma fronteira simples entre React e CSS. React decide o tema ativo; CSS responde a esse atributo com tokens diferentes. Esta solução evita dependências novas e mantém a app fácil de testar.

`DERIVADO`: os nomes `useThemePreference`, `ThemeControls`, `light`, `dark`, `contrast`, `.theme-controls` e `.theme-controls__button` são decisões técnicas mínimas para cumprir `RNF04` dentro do frontend atual.

#### Arquitetura do BK

- `real_dev/web/src/styles.css`: define tokens por `:root`, `[data-theme="light"]`, `[data-theme="dark"]` e `[data-theme="contrast"]`.
- `real_dev/web/src/hooks/useThemePreference.js`: calcula tema inicial, aplica `data-theme` e valida escolhas permitidas.
- `real_dev/web/src/components/ThemeControls.jsx`: apresenta botões acessíveis para escolher tema.
- `real_dev/web/src/App.jsx`: coloca os controlos de tema no header sem alterar sessão, roles ou páginas.
- `BK-MF6-01`: deve medir performance depois desta alteração sem desfazer o sistema de temas.

#### Ficheiros a criar/editar/rever

- EDITAR: `real_dev/web/src/styles.css`
- CRIAR: `real_dev/web/src/hooks/useThemePreference.js`
- CRIAR: `real_dev/web/src/components/ThemeControls.jsx`
- EDITAR: `real_dev/web/src/App.jsx`
- REVER: `real_dev/web/src/components/FeedbackMessage.jsx`
- REVER: `real_dev/web/src/pages/RegisterPage.jsx`
- REVER: `real_dev/web/src/pages/FacePhotoUploadPage.jsx`
- REVER: `real_dev/web/package.json`
- REVER: `docs/RNF.md`
- REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
- REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato e fronteiras do RNF04

1. Objetivo funcional do passo no contexto da app.

Confirmar que `RNF04` trata apenas experiência visual, acessibilidade e contraste.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
    - LOCALIZAÇÃO: entradas `RNF04` e `BK-MF5-08`.

3. Instruções do que fazer.

Regista que este BK muda apresentação visual. Não alteres sessão, permissões, consentimento, endpoints, payloads, fotografias, relatórios ou regras de negócio.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Não há código porque este passo define a fronteira técnica. Primeiro confirmas que o requisito é visual; depois implementas a solução sem mexer em autenticação, API ou dados sensíveis.

6. Validação do passo.

Consegues explicar que alternar tema não deve chamar endpoint de login, perfil, consentimento, upload ou relatório.

7. Cenário negativo/erro esperado.

Uma alteração que use o tema para guardar identidade, token, role ou consentimento deve ser rejeitada.

### Passo 2 - Criar tokens para tema claro, escuro e contraste

1. Objetivo funcional do passo no contexto da app.

Permitir que a mesma UI mude aparência através de `data-theme`, sem duplicar componentes.

2. Ficheiros envolvidos:
    - EDITAR: `real_dev/web/src/styles.css`
    - LOCALIZAÇÃO: perto do bloco `:root`, preservando tokens criados nos BKs anteriores.

3. Instruções do que fazer.

Atualiza os tokens globais e acrescenta blocos para `dark` e `contrast`. Mantém aliases para tokens já usados pelo frontend, como `--bordo`, `--wine`, `--surface`, `--ink`, `--line`, `--shadow` e `--focus-ring`.

4. Código completo, correto e integrado com a app final.

```css
/* real_dev/web/src/styles.css */
:root,
[data-theme="light"] {
    color-scheme: light;
    --surface: #ffffff;
    --surface-soft: #fff5f4;
    --ink: #2f1f25;
    --muted: #725e65;
    --line: #ecd6dc;
    --bordo: #7a1f35;
    --bordo-dark: #541424;
    --wine: #9a2f49;
    --plum: #5c3147;
    --blush: #fff0f2;
    --powder: #f3e4e8;
    --focus-ring: rgb(154 47 73 / 16%);
    --shadow: 0 18px 42px rgb(122 31 53 / 12%);
    --app-background: linear-gradient(135deg, #fff8f5 0%, #fff0f2 55%, #f8eef3 100%);
}

[data-theme="dark"] {
    color-scheme: dark;
    --surface: #21171c;
    --surface-soft: #171014;
    --ink: #fff7fa;
    --muted: #dcc2cc;
    --line: #5f4251;
    --bordo: #f2a0b6;
    --bordo-dark: #ffd2dd;
    --wine: #ffb3c7;
    --plum: #f0c1d1;
    --blush: #321f29;
    --powder: #432c37;
    --focus-ring: rgb(255 179 199 / 34%);
    --shadow: 0 18px 42px rgb(0 0 0 / 30%);
    --app-background: linear-gradient(135deg, #140d11 0%, #21151c 58%, #2f1d28 100%);
}

[data-theme="contrast"] {
    color-scheme: light;
    --surface: #ffffff;
    --surface-soft: #f6f6f6;
    --ink: #111111;
    --muted: #242424;
    --line: #111111;
    --bordo: #000000;
    --bordo-dark: #333333;
    --wine: #005fcc;
    --plum: #003a7a;
    --blush: #ffffff;
    --powder: #f0f0f0;
    --focus-ring: rgb(0 95 204 / 42%);
    --shadow: none;
    --app-background: #ffffff;
}

body {
    color: var(--ink);
    background: var(--app-background);
}

input,
select,
textarea {
    /* Inputs herdam os tokens para não ficarem claros dentro do modo escuro. */
    color: var(--ink);
    background: var(--surface);
    border-color: var(--line);
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
    /* O foco precisa de sobreviver aos três temas, sobretudo no modo de contraste. */
    outline: 3px solid transparent;
    box-shadow: 0 0 0 3px var(--focus-ring);
}
```

5. Explicação do código.

O bloco `:root` e `[data-theme="light"]` define o tema claro como comportamento base. Os blocos `dark` e `contrast` mudam apenas tokens. A entrada é o valor de `data-theme`; a saída é uma paleta completa para superfícies, texto, contornos, foco e sombra.

Os inputs e o foco usam tokens porque formulários são o local onde a perda de contraste causa mais problemas. Ao adaptar este passo, podes afinar cores, mas não deves remover `color-scheme`, `--focus-ring`, `--line`, `--ink` ou `--surface`, porque estes tokens mantêm legibilidade e navegação por teclado.

6. Validação do passo.

No DevTools, muda manualmente `data-theme` no elemento HTML para `light`, `dark` e `contrast`. Confirma que inputs, botões, cartões e texto mudam sem editar JSX.

7. Cenário negativo/erro esperado.

Se um input continuar com fundo claro e texto claro no modo escuro, falta ligar esse estado aos tokens.

### Passo 3 - Criar o hook useThemePreference

1. Objetivo funcional do passo no contexto da app.

Controlar o tema ativo no frontend sem tocar em sessão, API ou backend.

2. Ficheiros envolvidos:
    - CRIAR: `real_dev/web/src/hooks/useThemePreference.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria a pasta `real_dev/web/src/hooks` se ainda não existir. Depois cria o hook abaixo. O tema inicial pode respeitar a preferência escura do sistema, mas a escolha do utilizador fica apenas no estado React e no DOM.

4. Código completo, correto e integrado com a app final.

```js
// real_dev/web/src/hooks/useThemePreference.js
import { useCallback, useEffect, useState } from "react";

export const THEMES = Object.freeze(["light", "dark", "contrast"]);

const DEFAULT_THEME = "light";
const DARK_THEME_QUERY = "(prefers-color-scheme: dark)";

/**
 * Confirma se o browser suporta consulta de preferência escura.
 *
 * @function canReadSystemTheme
 * @returns {boolean} True quando window.matchMedia está disponível.
 */
function canReadSystemTheme() {
    return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

/**
 * Normaliza valores externos para um tema conhecido.
 *
 * @function normalizeTheme
 * @param {string} candidate - Valor recebido da UI.
 * @returns {"light"|"dark"|"contrast"} Tema seguro para aplicar no DOM.
 */
export function normalizeTheme(candidate) {
    return THEMES.includes(candidate) ? candidate : DEFAULT_THEME;
}

/**
 * Obtém o tema inicial a partir da preferência visual do sistema.
 *
 * @function getInitialTheme
 * @returns {"light"|"dark"|"contrast"} Tema inicial seguro.
 */
export function getInitialTheme() {
    if (canReadSystemTheme() && window.matchMedia(DARK_THEME_QUERY).matches) {
        return "dark";
    }

    return DEFAULT_THEME;
}

/**
 * Gere o tema visual da aplicação.
 *
 * @function useThemePreference
 * @returns {{theme: string, themes: readonly string[], selectTheme: (theme: string) => void}} Estado e ação de tema.
 */
export function useThemePreference() {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;

        // O tema fica limitado ao DOM; não transporta sessão, role, token ou dados pessoais.
        root.dataset.theme = theme;
        root.style.colorScheme = theme === "dark" ? "dark" : "light";
    }, [theme]);

    useEffect(() => {
        if (!canReadSystemTheme()) {
            return undefined;
        }

        const mediaQuery = window.matchMedia(DARK_THEME_QUERY);

        /**
         * Sincroniza a preferência do sistema enquanto o utilizador não escolhe contraste.
         *
         * @param {MediaQueryListEvent} event - Alteração da preferência visual do sistema.
         * @returns {void}
         */
        function handleSystemThemeChange(event) {
            // O modo de contraste é uma escolha explícita e não deve ser substituído pelo sistema.
            setTheme((currentTheme) => {
                if (currentTheme === "contrast") {
                    return currentTheme;
                }

                return event.matches ? "dark" : "light";
            });
        }

        mediaQuery.addEventListener("change", handleSystemThemeChange);

        return () => {
            mediaQuery.removeEventListener("change", handleSystemThemeChange);
        };
    }, []);

    const selectTheme = useCallback((nextTheme) => {
        // Valores fora da lista voltam ao tema base para impedir data-theme arbitrário.
        setTheme(normalizeTheme(nextTheme));
    }, []);

    return { theme, themes: THEMES, selectTheme };
}
```

5. Explicação do código.

O hook começa por declarar os temas aceites. `normalizeTheme` impede que valores arbitrários cheguem ao atributo `data-theme`. `getInitialTheme` usa a preferência escura do sistema apenas como ponto de partida. `useEffect` aplica o tema no elemento HTML raiz, que é a ponte entre React e CSS.

O segundo `useEffect` escuta mudanças do sistema e só alterna entre claro e escuro. O modo `contrast` é preservado porque representa uma decisão explícita de acessibilidade. O hook não chama API, não lê credenciais e não grava dados pessoais. Ao adaptar este hook, podes mudar nomes internos, mas não deves remover a validação da lista `THEMES`.

6. Validação do passo.

Selecionar `dark` deve colocar `data-theme="dark"` no elemento HTML. Selecionar um valor desconhecido através de DevTools deve voltar a `light` quando passar por `selectTheme`.

7. Cenário negativo/erro esperado.

Um tema inválido como `danger` não pode ficar aplicado no DOM como valor final.

### Passo 4 - Criar o componente ThemeControls

1. Objetivo funcional do passo no contexto da app.

Dar ao utilizador uma forma visível e acessível de alternar entre os três temas.

2. Ficheiros envolvidos:
    - CRIAR: `real_dev/web/src/components/ThemeControls.jsx`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria `ThemeControls.jsx` na pasta de componentes. Usa botões com `aria-pressed`, porque o controlo funciona como um pequeno grupo de opções mutuamente exclusivas.

4. Código completo, correto e integrado com a app final.

```jsx
// real_dev/web/src/components/ThemeControls.jsx
import { useThemePreference } from "../hooks/useThemePreference.js";

const THEME_LABELS = Object.freeze({
    light: "Claro",
    dark: "Escuro",
    contrast: "Contraste",
});

/**
 * Controlos acessíveis para alternar o tema visual da Orélle.
 *
 * @function ThemeControls
 * @returns {JSX.Element} Grupo de botões para claro, escuro e contraste.
 */
export function ThemeControls() {
    const { theme, themes, selectTheme } = useThemePreference();

    return (
        <div className="theme-controls" aria-label="Escolher tema visual">
            {themes.map((themeOption) => {
                const isSelected = themeOption === theme;

                return (
                    <button
                        key={themeOption}
                        type="button"
                        className="theme-controls__button"
                        aria-pressed={isSelected}
                        onClick={() => selectTheme(themeOption)}
                    >
                        {/* A label textual evita depender apenas da cor do botão ativo. */}
                        <span>{THEME_LABELS[themeOption]}</span>
                    </button>
                );
            })}
        </div>
    );
}
```

5. Explicação do código.

O componente consome `useThemePreference` e mostra um botão por tema. Cada botão tem `type="button"` para não submeter formulários por acidente, e `aria-pressed` para anunciar qual opção está ativa. A label textual é obrigatória porque o utilizador não deve depender apenas de cor para saber o estado.

O componente não conhece sessão nem roles. Ele só chama `selectTheme`, que já valida a escolha. Ao adaptar este componente, podes trocar labels ou posicionamento, mas não deves remover `aria-pressed`, `type="button"` ou a label textual.

6. Validação do passo.

Clicar em `Escuro` deve ativar visualmente esse botão e mudar `data-theme` para `dark`.

7. Cenário negativo/erro esperado.

Se o botão ativo só for distinguido por cor e não tiver `aria-pressed`, o controlo falha acessibilidade.

### Passo 5 - Estilizar controlos e compatibilidade visual

1. Objetivo funcional do passo no contexto da app.

Garantir que os controlos de tema, cartões, mensagens e inputs mantêm leitura estável nos três temas.

2. Ficheiros envolvidos:
    - EDITAR: `real_dev/web/src/styles.css`
    - LOCALIZAÇÃO: junto das regras de header, cartões e feedback.

3. Instruções do que fazer.

Acrescenta estes estilos depois das regras de `.app-header` e mantém as regras de feedback do `BK-MF5-07` a usar tokens.

4. Código completo, correto e integrado com a app final.

```css
/* real_dev/web/src/styles.css */
.app-header__actions {
    align-items: flex-end;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-end;
}

.theme-controls {
    align-items: center;
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.theme-controls__button {
    border: 1px solid var(--line);
    box-shadow: none;
    min-height: 2.25rem;
    padding: 0.45rem 0.65rem;
    color: var(--ink);
    background: var(--surface);
}

.theme-controls__button:hover {
    background: var(--blush);
    box-shadow: none;
    transform: none;
}

.theme-controls__button[aria-pressed="true"] {
    /* O estado ativo tem texto, borda e fundo próprios para não depender apenas da cor. */
    border-color: var(--wine);
    color: var(--surface);
    background: var(--bordo);
}

.session-pill,
.page-stack > main,
.page-stack > section {
    /* Superfícies principais passam a responder ao tema ativo. */
    border-color: var(--line);
    color: var(--ink);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
}

.feedback,
.feedback__label,
main > h1,
section > h1,
h2,
h3 {
    color: var(--ink);
}

@media (max-width: 720px) {
    .app-header,
    .app-header__actions {
        align-items: flex-start;
        flex-direction: column;
    }

    .theme-controls {
        width: 100%;
    }

    .theme-controls__button {
        flex: 1 1 6rem;
    }
}
```

5. Explicação do código.

`.app-header__actions` agrupa sessão e controlos de tema sem sobrepor texto em mobile. `.theme-controls__button[aria-pressed="true"]` mostra o estado ativo com fundo, texto e borda. As superfícies principais usam tokens para que os cartões não fiquem presos ao tema claro.

O `@media` impede que header, sessão e controlos disputem espaço em ecrãs pequenos. Ao adaptar, podes ajustar espaçamentos, mas não deves remover `flex-wrap`, `aria-pressed` no seletor ativo nem tokens em superfícies principais.

6. Validação do passo.

Em largura mobile, os controlos devem quebrar linha sem tapar email, role ou título.

7. Cenário negativo/erro esperado.

Se o botão de contraste ficar visualmente ativo mas a label desaparecer por falta de contraste, os tokens precisam de ser corrigidos.

### Passo 6 - Integrar ThemeControls no App

1. Objetivo funcional do passo no contexto da app.

Mostrar os controlos de tema no header principal sem alterar a sequência de páginas nem as condições por role.

2. Ficheiros envolvidos:
    - EDITAR: `real_dev/web/src/App.jsx`
    - LOCALIZAÇÃO: imports e bloco `<header className="app-header">`.

3. Instruções do que fazer.

Adiciona o import de `ThemeControls` e ajusta apenas o header. Mantém `AuthProvider`, `useAuth`, `isAdmin`, `canReviewRecommendations` e a ordem das páginas.

4. Código completo, correto e integrado com a app final.

```jsx
// real_dev/web/src/App.jsx
import { ThemeControls } from "./components/ThemeControls.jsx";

/**
 * Conteudo da aplicacao com acesso ao estado autenticado.
 *
 * @function AppContent
 * @returns {JSX.Element} Paginas MF0-MF5 com controlos admin protegidos por role.
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
                    <p className="app-kicker">real_dev</p>
                    <h1>Orélle</h1>
                </div>

                <div className="app-header__actions">
                    {/* O tema é visual; a sessão continua a vir do AuthContext. */}
                    <ThemeControls />

                    {user && (
                        <p className="session-pill">
                            {/* Email e role mantêm a mesma origem e não são guardados pelo tema. */}
                            {user.email} · {user.role}
                        </p>
                    )}
                </div>
            </header>

            <div className="page-stack">
                <RegisterPage />
                <LoginPage />
                <ProfileSetupPage />
                <EditProfilePage />
                <PreferencesPage />
                <ProductSearchPage />
                <ProductDetailsPage />
                <ProductReviewPage />
                <RelatedProductsPage />
                <FacePhotoUploadPage />
                <FaceAnalysisPage />
                <FaceReportPage />
                <SkinHistoryPage />
                <SkinEvolutionPage />
                <ProductRecommendationsPage
                    onRecommendationsChange={setRecommendations}
                />
                <DailyRoutinePage />
                <MakeupSimulationPage
                    onSimulationCreated={setLatestMakeupSimulation}
                />
                <BeforeAfterVisualizationPage simulation={latestMakeupSimulation} />
                <SkinComparisonPage />
                <CartPage />
                <CheckoutPage />
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
                        {/* A visibilidade admin continua protegida pela role existente. */}
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
```

5. Explicação do código.

O import liga o componente novo ao `App.jsx`. No header, `ThemeControls` fica ao lado da pill de sessão, mas não lê nem altera `user`. As variáveis `isAdmin` e `canReviewRecommendations` continuam iguais, por isso as páginas administrativas e de consultor mantêm as mesmas regras.

O bloco mostra a função completa com a lista de páginas atual. Ao aplicar no ficheiro real, o único comportamento novo é o controlo de tema no header; a ordem das páginas, os estados React e as condições por role continuam preservados.

6. Validação do passo.

Com e sem utilizador autenticado, o header deve mostrar os controlos de tema. As páginas admin continuam visíveis apenas para `administrador`.

7. Cenário negativo/erro esperado.

Uma integração que remova `useAuth`, apague páginas ou mostre páginas admin a qualquer utilizador deve ser rejeitada.

### Passo 7 - Validar build, contraste e cenário negativo

1. Objetivo funcional do passo no contexto da app.

Provar que o BK compila, que os três temas são testáveis e que o cenário negativo mínimo de `P2` foi executado.

2. Ficheiros envolvidos:
    - REVER: `real_dev/web/package.json`
    - REVER: `real_dev/web/src/App.jsx`
    - REVER: `real_dev/web/src/styles.css`
    - REVER: `real_dev/web/src/hooks/useThemePreference.js`
    - REVER: `real_dev/web/src/components/ThemeControls.jsx`

3. Instruções do que fazer.

Executar cenários negativos obrigatórios (mínimo 1). O cenário negativo obrigatório deste BK é tentar selecionar um tema inválido e confirmar que `normalizeTheme` devolve `light`, sem manter valor arbitrário no DOM.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix real_dev/web run build
bash scripts/validate-planificacao.sh
```

5. Explicação do código.

O primeiro comando valida o frontend Vite no root operativo. O segundo comando valida a planificação e a qualidade documental. A validação manual completa estes comandos porque contraste visual precisa de observação em ecrã real ou browser.

6. Validação do passo.

Confirma estes pontos:

- `npm --prefix real_dev/web run build` termina sem erro.
- `ThemeControls` aparece no header.
- `light`, `dark` e `contrast` alteram `data-theme`.
- Inputs, botões, mensagens e cartões continuam legíveis.
- O foco por teclado continua visível nos três temas.
- O cenário inválido volta a `light` e não deixa tema arbitrário aplicado.

7. Cenário negativo/erro esperado.

Se `selectTheme("danger")` mantiver `data-theme="danger"`, a validação de tema permitido está incorreta.

#### Expected results

- A aplicação compila em `real_dev/web`.
- O header mostra controlos `Claro`, `Escuro` e `Contraste`.
- O tema ativo é refletido em `document.documentElement.dataset.theme`.
- Inputs, botões, mensagens, cartões e foco mantêm legibilidade.
- Não há alteração de endpoints, sessão, roles, consentimento, fotografias ou relatórios.
- `BK-MF6-01` pode medir performance sem desfazer o sistema de temas.

#### Critérios de aceite

- `real_dev/web/src/hooks/useThemePreference.js` existe e valida temas permitidos.
- `real_dev/web/src/components/ThemeControls.jsx` existe e usa `aria-pressed`.
- `real_dev/web/src/styles.css` define tokens para `light`, `dark` e `contrast`.
- `real_dev/web/src/App.jsx` integra `ThemeControls` no header.
- `npm --prefix real_dev/web run build` passa.
- `bash scripts/validate-planificacao.sh` foi executado e o resultado ficou registado.
- Cenários negativos concluídos: mínimo `1`.
- Evidência de testes por camada registada para static/build, UI manual e negativo.
- Nenhuma alteração deste BK guarda sessão, role, token, consentimento, fotografia, relatório ou dados pessoais.

#### Validação final

### Matriz mínima de testes por prioridade

| Prioridade | Teste focal | Negativos mínimos | Evidence esperada |
| --- | --- | ---: | --- |
| `P2` | Build do frontend, teste visual dos três temas e validação de tema inválido | 1 | Output do build, screenshot ou descrição visual, resultado do negativo e resultado do validador |

- [ ] Build: `npm --prefix real_dev/web run build`.
- [ ] Static/doc: `bash scripts/validate-planificacao.sh`.
- [ ] UI manual: alternar `Claro`, `Escuro` e `Contraste`.
- [ ] Acessibilidade: confirmar foco por teclado e `aria-pressed`.
- [ ] Negativos: mínimo `1` cenários com resultado controlado.
- [ ] Sem regressão: sessão, roles e páginas continuam com o mesmo comportamento.

#### Evidence para PR/defesa

Evidência de testes por camada:

- Static/build: output do `npm --prefix real_dev/web run build`.
- Documental: output de `bash scripts/validate-planificacao.sh`.
- UI manual: registo dos três temas testados em desktop e mobile.
- Acessibilidade: confirmação de foco visível e `aria-pressed`.
- Negativo: `selectTheme("danger")` ou chamada equivalente volta a `light`.
- Segurança/privacidade: confirmação de que tema não guarda credenciais, sessão, consentimento, fotografias, relatórios ou dados pessoais.

#### Handoff

- Para `BK-MF6-01`: medir performance com os três temas disponíveis, sem remover tokens ou controlos.
- Para futuras melhorias visuais: manter tokens centralizados em `styles.css`.
- Para QA: validar contraste em formulários sensíveis, principalmente upload facial, registo, checkout e páginas admin.

#### Changelog

- `2026-06-20`: corrigido o guia para `real_dev/web`, formalizada a matriz `P2`, acrescentados negativos obrigatórios e reforçados comentários didáticos nos blocos de código.
