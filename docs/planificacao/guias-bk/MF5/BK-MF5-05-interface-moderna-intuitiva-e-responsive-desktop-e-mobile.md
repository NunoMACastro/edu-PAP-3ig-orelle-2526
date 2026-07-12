# BK-MF5-05 - Interface moderna, intuitiva e _responsive_ (desktop e mobile)

## Header
- `doc_id`: `GUIA-BK-MF5-05`
- `bk_id`: `BK-MF5-05`
- `macro`: `MF5`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF01`
- `fase_documental`: `Fase 2`
- `sprint`: `S09-S10`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF5-06`
- `guia_path`: `docs/planificacao/guias-bk/MF5/BK-MF5-05-interface-moderna-intuitiva-e-responsive-desktop-e-mobile.md`
- `last_updated`: `2026-07-11`

> **Contrato atual (2026-07-10):** a shell tem exatamente um `<main>`, skip-link e foco colocado no conteúdo após navegação. Cliente, consultor e administrador recebem menus separados e só é renderizada a rota ativa; agrupar todas as páginas numa pilha deixou de ser estado final aceitável. Modais usam focus trap e devolvem foco ao trigger. Todos os controlos interativos têm alvo mínimo `44x44`, há suporte para `prefers-reduced-motion` e o layout é testado em `320/375/768/1280` px. O gate usa Playwright com navegação por teclado e Axe, sem violações `serious`/`critical`; inspeção manual é evidence complementar, não substituta.

> **Rotas canónicas da consulta — 2026-07-11:** a shell renderiza apenas a rota ativa para `/consulta`, `/consulta/nova`, `/consulta/ativa`, `/consulta/relatorios/:reportId`, `/consulta/historico` e `/consultoria/revisoes`. Fotografias, análise, recomendações, relatório e preview pertencem a esse fluxo; não existem páginas independentes `FacePhotoUploadPage`, `FaceAnalysisPage`, `FaceReportPage`, `ProductRecommendationsPage` ou `BeforeAfterVisualizationPage`. Os exemplos inferiores de `page-stack` que montam essas páginas em simultâneo são históricos e **não devem ser executados**. Ver [plano canónico da consulta OpenAI](../../PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md).

### Critérios de aceitação ativos

- Existe exatamente um `<main>` e apenas a rota ativa é renderizada.
- Menus e guardas separam cliente, consultor e administrador.
- Todas as rotas da consulta são alcançáveis sem introduzir IDs técnicos.
- Playwright valida teclado, foco, Axe e ausência de overflow em `320/375/768/1280` px.

<details class="historical-archive">
<summary><strong>Anexo histórico da shell em page-stack — não executar</strong></summary>

> Todo o conteúdo restante deste ficheiro é o tutorial anterior à navegação canónica. Imperativos, imports, JSX, checklists e smokes que montam várias páginas em simultâneo ficam fora das instruções ativas.

#### Objetivo

Neste BK vais tornar a interface principal da Orélle moderna, intuitiva e responsiva, para que os fluxos de cliente, consultor e administrador sejam utilizáveis em desktop e mobile.

#### Importância

Uma app de cosmética depende de confiança visual, leitura rápida e interação simples. Se a grelha quebrar no telemóvel, os alunos podem ter backend correto mas uma experiência difícil de defender.

#### Scope-in

- Organizar `App.jsx` com zonas claras por papel e um único landmark `<main>`.
- Adicionar skip-link, foco pós-navegação e contrato de modais com focus trap.
- Melhorar `styles.css` com layout responsivo, larguras seguras e estados visuais consistentes.
- Garantir que cartões, formulários e listas não rebentam em mobile.
- Manter `apiRequest` e sessão por cookie HttpOnly.
- Validar `320/375/768/1280` por build, Playwright, teclado e Axe.

#### Scope-out

- Não criar um segundo router nem uma navegação paralela; estender a infraestrutura de rotas existente.
- Não introduzir Tailwind CSS ou biblioteca de componentes.
- Não redesenhar identidade visual final.
- Não alterar contratos de API.
- Não criar funcionalidades novas de negócio.

#### Estado antes e depois

- Antes: a app já tinha `app-shell`, `page-stack` e breakpoints simples, mas os painéis cresceram por macrofase e precisavam de organização mais previsível.
- Depois: a app fica dividida por secções funcionais, com landmark único, navegação acessível, grelha fluida, formulários em coluna no mobile e cartões que preservam legibilidade.

#### Pre-requisitos

- React + Vite no frontend.
- `apiRequest` com `credentials: "include"`.
- Páginas MF0 a MF4 já importáveis em `App.jsx`.
- Ao seguir a MF5 por ordem, `BiometricDataRequestsAdminPage` vem do `BK-MF5-01` e `BiometricAuditPage` vem do `BK-MF5-04`. Se o build acusar falta destes ficheiros, termina primeiro esses BKs antes de reorganizar o `App.jsx`.
- `RNF01`: interface moderna, intuitiva e responsiva em desktop e mobile.

#### Glossário

- Responsividade: adaptação do layout a várias larguras sem perder conteúdo.
- Breakpoint: largura onde a grelha muda de comportamento.
- Shell: estrutura base da página, incluindo header e área de conteúdo.
- Estado visual: representação de loading, erro, vazio ou sucesso.
- Densidade: quantidade de informação visível sem sobrecarregar o utilizador.
- Skip-link: ligação inicial que permite saltar diretamente para o conteúdo principal.
- Focus trap: contenção temporária do foco dentro de um diálogo modal, com devolução ao elemento que o abriu.

#### Conceitos teóricos essenciais

Responsividade não é apenas reduzir o tamanho da letra. A interface deve mudar estrutura: duas colunas em ecrãs largos, uma coluna em mobile, botões com área de toque suficiente e textos que quebram dentro do contentor.

Uma app operacional não deve parecer uma landing page. A Orélle precisa de painéis repetidos, formulários e listas que suportem uso real por cliente, consultor e administrador.

Sem biblioteca de UI, o CSS global deve definir regras comuns para botões, inputs, cartões e grids. A semântica mantém um único `<main>` na shell; páginas internas usam `<section>`/`<article>`. A responsividade e acessibilidade precisam de testes de browser, porque build não deteta overflow, foco perdido ou violações Axe.

## Bloco pedagogico

### Objetivo

Compreender como organizar a interface da Orélle por papel e tornar os formulários, listas e painéis utilizáveis em desktop e mobile sem alterar regras de negócio.

### Pre-requisitos

- Saber importar páginas React já existentes.
- Conhecer o cliente API com sessão por cookie.
- Perceber o papel de `App.jsx` como shell e da infraestrutura de rotas como seleção de uma única página ativa.
- Conhecer os fluxos de cliente, consultor e administrador já criados.

### Erros comuns

- Usar CSS responsivo para esconder funcionalidades em vez de organizar a experiência.
- Mostrar painéis administrativos a clientes só porque o backend bloqueia depois.
- Criar landing page em vez de melhorar a app real.
- Quebrar checkboxes, radios ou botões ao aplicar regras globais demasiado amplas.

### Check de compreensao

Consegues explicar que a UI pode agrupar páginas por role, mas a autorização real continua no backend? Consegues indicar como a grelha deve mudar entre desktop e mobile?

## Bloco operacional

### Entrada

- Páginas React das MF anteriores.
- `App.jsx`, `styles.css` e cliente API existentes.
- Requisitos de `RNF01` para interface moderna, intuitiva e responsiva.

### Passos

1. Mapear páginas por fluxo de cliente, consultoria e administração.
2. Mapear rotas visíveis para menus separados por role, reutilizando o router existente.
3. Rever CSS global para grelhas fluidas e inputs seguros.
4. Garantir que formulários e listas não rebentam em `320/375/768/1280` px.
5. Validar skip-link, foco pós-navegação, focus trap, reduced motion e alvos `44x44`.
6. Executar Playwright/Axe e pelo menos 3 negativos de layout/acessibilidade.

### Validacao

- Build Vite passa sem imports partidos.
- Secções de cliente, consultoria e administração ficam visualmente separadas.
- Mobile usa uma coluna, sem overflow, e mantém controlos com alvo mínimo `44x44`.
- A shell tem um único `<main>`; skip-link e foco pós-navegação funcionam por teclado.
- Axe não encontra violações `serious`/`critical` nas rotas principais.
- [ ] Negativos: minimo `3` cenarios controlados de overflow, role visual e formulário compacto.

### Handoff

`BK-MF5-06`, `BK-MF5-07` e `BK-MF5-08` reutilizam esta base visual para tokens de marca, feedback e temas sem reescrever a estrutura da app.

#### Arquitetura do BK

- `App.jsx`: shell única, menus por role e outlet de uma única rota ativa.
- `styles.css`: define shell, grid, secções, formulários e mobile.
- Páginas existentes: usam `<section>`/`<article>`; apenas a shell cria `<main id="main-content">`.
- `ConfirmDialog`: aplica focus trap, Escape, devolução de foco e nome acessível.
- Playwright + Axe: validam viewports, teclado e violações automatizáveis.
- Build Vite: valida imports e CSS, sem substituir os testes de browser.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/web/src/App.jsx`
- EDITAR: `apps/web/src/styles.css`
- REVER: `apps/web/src/services/apiClient.js`
- REVER: páginas em `apps/web/src/pages/*.jsx`
- REVER: `apps/web/package.json`

#### Tutorial técnico linear

### Passo 1 - Mapear zonas funcionais da interface

1. Objetivo funcional do passo no contexto da app.

Separar navegação de cliente, consultor e administrador sem duplicar routing.

2. Ficheiros envolvidos:
    - REVER: `apps/web/src/App.jsx`
    - REVER: `docs/planificacao/backlogs/MF-VIEWS.md`
    - LOCALIZAÇÃO: componente `AppContent`.

3. Instruções do que fazer.

Lista as rotas existentes e cria três mapas de navegação: conta/cliente, consultoria e administração. Mantém gates por `user.role`; links proibidos não aparecem e a rota continua protegida no backend.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Não há código porque este passo é de arquitetura visual. O objetivo é impedir que a UI cresça como uma lista sem hierarquia e renderize dezenas de páginas simultaneamente. A separação por papel ajuda o utilizador a encontrar o fluxo certo e prepara `BK-MF5-06`.

6. Validação do passo.

Consegues indicar em que zona aparece cada página e que role a pode ver.

7. Cenário negativo/erro esperado.

Mostrar painéis admin a clientes confunde a experiência e pode sugerir acesso indevido, mesmo que o backend bloqueie.

### Passo 2 - Reorganizar App.jsx com secções claras

1. Objetivo funcional do passo no contexto da app.

Ligar o menu da role e a rota ativa sem alterar lógica de autenticação.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/App.jsx`
    - LOCALIZAÇÃO: função `AppContent`.

3. Instruções do que fazer.

O bloco histórico de `SectionGroup` abaixo mostra apenas a classificação por role. Não o uses como composição final: transfere cada entrada para o mapa de rotas/menu existente e renderiza somente a rota ativa dentro de `#main-content`.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/App.jsx
// Estes imports vêm dos BKs anteriores da MF5 e tornam a navegação responsiva capaz de mostrar os fluxos de privacidade no grupo correto.
import { BiometricAuditPage } from "./pages/BiometricAuditPage.jsx";
import { BiometricDataRequestsAdminPage } from "./pages/BiometricDataRequestsAdminPage.jsx";

/**
 * Agrupa páginas por responsabilidade visual sem criar router.
 *
 * @function SectionGroup
 * @param {{title: string, children: React.ReactNode}} props - Título e conteúdo.
 * @returns {JSX.Element} Secção responsiva.
 */
function SectionGroup({ title, children }) {
    return (
        <section className="section-group">
            <h2>{title}</h2>
            <div className="section-grid">{children}</div>
        </section>
    );
}

/**
 * Conteúdo principal com zonas de cliente, consultoria e administração.
 *
 * @function AppContent
 * @returns {JSX.Element} Interface principal responsiva sem regressão das páginas já existentes.
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
            <a className="skip-link" href="#main-content">
                Saltar para o conteúdo principal
            </a>
            <header className="app-header">
                <div>
                    <p className="app-kicker">Experiência Orélle</p>
                    <h1>Orélle</h1>
                </div>
                {user && <p className="session-pill">{user.email} · {user.role}</p>}
            </header>

            {/* Só a shell cria o landmark principal; cada página interna usa section/article. */}
            <main id="main-content" tabIndex={-1}>
            <SectionGroup title="Conta e experiência do cliente">
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
            </SectionGroup>

            {canReviewRecommendations && (
                <SectionGroup title="Consultoria e privacidade">
                    <ConsultantRecommendationReviewPage
                        recommendations={recommendations}
                    />
                    <BiometricDataRequestsAdminPage />
                </SectionGroup>
            )}

            {isAdmin && (
                <SectionGroup title="Administração">
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
            </main>
        </div>
    );
}
```

5. Explicação do código.

`SectionGroup` é apenas estrutural e não muda permissões. As permissões continuam dependentes de `user.role`, vindo da sessão. O skip-link aponta para o único `<main>`, que aceita foco programático após navegação. As páginas internas não criam landmarks `<main>` adicionais. O código preserva os estados que ligam os fluxos já existentes e posiciona os painéis biométricos sem recriar regras de privacidade.

6. Validação do passo.

Build deve passar sem imports em falta, `document.querySelectorAll("main")` deve devolver um elemento e o skip-link deve mover o foco para `#main-content`. Cliente não vê grupo de administração.

7. Cenário negativo/erro esperado.

Remover `isAdmin` ou `canReview` pode tornar visíveis painéis que o utilizador não deveria sequer tentar usar.

### Passo 3 - Criar CSS responsivo base

1. Objetivo funcional do passo no contexto da app.

Garantir que header, grelhas, formulários e cartões funcionam em desktop e mobile.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/styles.css`
    - LOCALIZAÇÃO: regras de layout e media query.

3. Instruções do que fazer.

Atualiza o CSS global com `section-group`, `section-grid`, larguras máximas e breakpoints.

4. Código completo, correto e integrado com a app final.

```css
/* apps/web/src/styles.css */
.app-shell {
    width: min(1180px, calc(100% - 2rem));
    margin: 0 auto;
    padding: 2rem 0 4rem;
}

.app-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid rgb(122 31 53 / 14%);
}

.section-group {
    margin-bottom: 1.25rem;
}

.section-group > h2 {
    margin: 0 0 0.75rem;
    font-size: 1.05rem;
}

/* A grelha fluida evita criar regras por página e mantém cada painel legível em desktop. */
.section-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr));
    gap: 1rem;
}

/* min-width: 0 impede que textos, tabelas ou formulários largos forcem scroll horizontal no mobile. */
.section-grid > section {
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 0.5rem;
    padding: 1.1rem;
    background: var(--surface);
    box-shadow: var(--shadow);
}

.skip-link {
    position: fixed;
    inset: 0 auto auto 0;
    z-index: 1000;
    transform: translateY(-150%);
    padding: 0.75rem 1rem;
    background: var(--surface);
    color: var(--ink);
}

.skip-link:focus-visible {
    transform: translateY(0);
}

button,
[role="button"],
input,
select,
textarea {
    min-block-size: 44px;
}

a[href] {
    display: inline-flex;
    min-inline-size: 44px;
    min-block-size: 44px;
    align-items: center;
}

/* Os formulários começam em duas colunas para aproveitar desktop sem perder a adaptação mobile. */
form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
    align-items: end;
}

/* Este breakpoint muda estrutura, não apenas tamanho, para preservar toque e leitura. */
@media (max-width: 860px) {
    .app-shell {
        width: min(100% - 1rem, 42rem);
        padding-top: 1rem;
    }

    .app-header,
    form {
        grid-template-columns: 1fr;
        align-items: start;
    }

    .app-header {
        flex-direction: column;
    }

    .section-grid {
        grid-template-columns: 1fr;
    }

    button + button {
        margin-top: 0.45rem;
        margin-left: 0;
    }
}

@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        scroll-behavior: auto !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

5. Explicação do código.

`auto-fit` com `minmax(19rem, 1fr)` cria cartões que se ajustam sem esmagar conteúdo. No mobile, a grelha passa para uma coluna. O skip-link só aparece com foco, os alvos mantêm pelo menos `44x44` e reduced motion elimina animações não essenciais sem esconder estado ou conteúdo.

6. Validação do passo.

Testa `320`, `375`, `768` e `1280` px: cartões devem empilhar quando necessário, inputs ocupar espaço útil, texto não sair do contentor e nenhum viewport ter scroll horizontal.

7. Cenário negativo/erro esperado.

Usar largura fixa em pixels nos cartões pode criar scroll horizontal em telemóvel.

### Passo 4 - Validar estados visuais recorrentes

1. Objetivo funcional do passo no contexto da app.

Garantir que loading, erro, vazio e sucesso aparecem de forma consistente.

2. Ficheiros envolvidos:
    - REVER: `apps/web/src/pages/*.jsx`
    - EDITAR: `apps/web/src/styles.css`
    - LOCALIZAÇÃO: seletores `[role="alert"]`, `[role="status"]`, listas e artigos.

3. Instruções do que fazer.

Confirma que mensagens de erro usam `role="alert"` e progresso usa `role="status"`. Acrescenta CSS para listas e artigos.

4. Código completo, correto e integrado com a app final.

```css
/* apps/web/src/styles.css */
/* Alertas ficam visualmente fortes e semanticamente claros para erros que o aluno ou utilizador precisa de resolver. */
[role="alert"] {
    border-left: 0.35rem solid var(--wine);
    border-radius: 0.5rem;
    padding: 0.75rem 0.85rem;
    color: var(--bordo-dark);
    background: var(--blush);
}

/* Estados informativos usam role="status" para comunicar progresso sem parecerem erros bloqueantes. */
[role="status"],
main > p:not([role]),
section > p:not([role]) {
    border-radius: 0.5rem;
    padding: 0.7rem 0.85rem;
    color: var(--bordo-dark);
    background: rgb(255 240 242 / 72%);
}

/* Listas em grelha evitam cartões demasiado estreitos e preservam leitura em catálogos, relatórios e painéis. */
main > ul,
section > ul,
article > ul {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 0.75rem;
    padding: 0;
    list-style: none;
}
```

5. Explicação do código.

Os roles melhoram acessibilidade e tornam os estados previsíveis. A grelha de listas evita listas longas com cartões demasiado estreitos. O CSS não altera regras de negócio; apenas dá uma base visual consistente para todos os BKs.

6. Validação do passo.

Força erro numa chamada API e confirma que a mensagem aparece com destaque, sem revelar detalhes internos.

7. Cenário negativo/erro esperado.

Mostrar erros técnicos crus na UI enfraquece segurança e torna a experiência menos profissional.

### Passo 5 - Executar build e preparar validação de browser

1. Objetivo funcional do passo no contexto da app.

Confirmar que a UI compila antes de executar a validação automatizada em quatro larguras.

2. Ficheiros envolvidos:
    - REVER: `apps/web/package.json`
    - REVER: `apps/web/src/App.jsx`
    - REVER: `apps/web/src/styles.css`
    - LOCALIZAÇÃO: script `build`.

3. Instruções do que fazer.

Executa build Vite. Depois, o Passo 9 cobre `320/375/768/1280`, teclado e Axe. Os negativos mínimos são: overflow a `320`, foco que escapa de um modal e violação Axe `serious`/`critical`.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix apps/web run build
```

5. Explicação do código.

O comando valida imports, JSX e CSS processado pelo Vite. Playwright/Axe complementam o build porque responsividade, foco e landmarks são comportamento de browser.

6. Validação do passo.

Build sem erro; os restantes critérios só ficam provados depois do teste de browser.

7. Cenário negativo/erro esperado.

Build a passar não prova que a UI está legível ou acessível; fechar o BK sem Playwright/Axe é uma falha de gate.

### Passo 6 - Validar formulários e listas em largura mobile

1. Objetivo funcional do passo no contexto da app.

Separar a validação mobile dos formulários, listas e cartões para evitar que a responsividade fique reduzida a uma observação genérica no build.

2. Ficheiros envolvidos:
    - REVER: `apps/web/src/pages/*.jsx`
    - REVER: `apps/web/src/styles.css`
    - LOCALIZAÇÃO: formulários, listas, artigos, cartões e mensagens dentro dos grupos criados em `AppContent`.

3. Instruções do que fazer.

Percorre os fluxos nos viewports `320/375/768/1280`. Confirma que cada input ocupa largura suficiente, os alvos interativos medem pelo menos `44x44`, botões não se sobrepõem e listas longas quebram linha sem criar scroll horizontal.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Este passo é de validação visual e pedagógica. O código já foi escrito nos passos anteriores; aqui o aluno aprende a procurar problemas que o compilador não encontra, como texto a sair do cartão, botões lado a lado em ecrãs estreitos ou listas que obrigam o utilizador a fazer scroll horizontal.

6. Validação do passo.

Regista uma nota com a largura testada, os ecrãs revistos e o resultado observado. A evidência mínima é confirmar que não há scroll horizontal, texto sobreposto ou botão inacessível.

7. Cenário negativo/erro esperado.

Se uma lista de relatórios ou produtos rebentar o cartão em mobile, a correção esperada é ajustar `min-width: 0`, `overflow-wrap` ou a grelha, não esconder conteúdo.

### Passo 7 - Confirmar visibilidade por role sem depender da UI

1. Objetivo funcional do passo no contexto da app.

Garantir que a reorganização visual não cria a ideia errada de que esconder uma secção no frontend substitui autorização no backend.

2. Ficheiros envolvidos:
    - REVER: `apps/web/src/App.jsx`
    - REVER: `apps/api/src/middlewares`
    - REVER: `apps/api/src/routes`
    - LOCALIZAÇÃO: gates `isAdmin`, `canReviewRecommendations` e routes protegidas por autenticação/role.

3. Instruções do que fazer.

Confirma que clientes não vêem painéis administrativos, consultores vêem apenas áreas permitidas e administradores vêem os painéis de gestão. Depois verifica que os endpoints sensíveis continuam protegidos no backend, porque a UI apenas reduz confusão de navegação.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Não há código novo porque a regra já existe nos BKs anteriores: o frontend melhora experiência, mas não decide segurança. Este passo ensina a diferença entre visibilidade e autorização. Mesmo que uma página admin fique escondida, uma chamada direta ao endpoint tem de continuar bloqueada pelo backend quando a role não permite acesso.

6. Validação do passo.

Compara a UI em sessão de cliente, consultor e administrador. Regista que a visibilidade muda, mas que a autorização real permanece nas routes e middlewares da API.

7. Cenário negativo/erro esperado.

Se removeres o gate visual e um cliente vir uma página admin, o backend ainda deve devolver `401` ou `403` nas chamadas protegidas. Se devolver `200`, o problema é de segurança backend e não de CSS.

### Passo 8 - Registar evidence responsiva por camada

1. Objetivo funcional do passo no contexto da app.

Fechar o BK P0 com evidência suficiente para defesa, cobrindo build, integração visual, smoke manual/e2e responsivo e negativos.

2. Ficheiros envolvidos:
    - REVER: `apps/web/package.json`
    - REVER: `apps/web/src/App.jsx`
    - REVER: `apps/web/src/styles.css`
    - LOCALIZAÇÃO: comandos e notas de validação anexadas à PR ou defesa.

3. Instruções do que fazer.

Guarda evidência de quatro camadas: build Vite, Playwright em quatro viewports, Axe/teclado e três negativos controlados. Capturas desktop/mobile são úteis, mas não substituem os resultados automatizados.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix apps/web run build
```

5. Explicação do código.

O comando valida a camada técnica do frontend, enquanto as notas e capturas validam comportamento visual. A evidência por camada evita que um BK P0 seja marcado como concluído apenas porque "parece funcionar" numa largura de ecrã.

6. Validação do passo.

A PR ou defesa deve incluir output do build, captura desktop, captura mobile e lista dos três negativos com resultado esperado e observado.

7. Cenário negativo/erro esperado.

Se só existir uma captura desktop, a evidência está incompleta. A correção é acrescentar mobile e negativos, porque `RNF01` exige desktop e mobile.

### Passo 9 - Validar landmarks, foco, teclado, modais e Axe

1. Objetivo funcional do passo no contexto da app.

Transformar os requisitos visuais em gates repetíveis no browser.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/hooks/useFocusAfterNavigation.js`
    - REVER: `apps/web/src/components/ConfirmDialog.jsx`
    - CRIAR: `apps/web/tests/e2e/accessibility-responsive.spec.js`

3. Instruções do que fazer.

Liga o hook à chave da rota/ecrã ativo. `ConfirmDialog` deve mover foco para o primeiro controlo, conter `Tab`/`Shift+Tab`, fechar com Escape e devolver foco ao trigger. Não dupliques `<main>` nas páginas.

Executar cenarios negativos obrigatorios (minimo 3): introduzir overflow a `320px`, permitir que o foco escape do diálogo e injetar uma violação Axe `serious`/`critical`; confirmar que cada caso faz o gate falhar antes de repor a correção.

```js
// apps/web/src/hooks/useFocusAfterNavigation.js
import { useEffect } from "react";

export function useFocusAfterNavigation(routeKey) {
    useEffect(() => {
        document.querySelector("main#main-content")?.focus();
    }, [routeKey]);
}
```

O teste percorre a matriz de rotas principais com fixtures locais:

```js
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { MAIN_ROUTES } from "./fixtures/main-routes.js";

const VIEWPORTS = [
    { width: 320, height: 720 },
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
];

for (const viewport of VIEWPORTS) {
    test(`sem overflow e sem violações graves a ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        for (const route of MAIN_ROUTES) {
            await page.goto(route.path);
            await expect(page.locator("main#main-content")).toHaveCount(1);
            const hasOverflow = await page.evaluate(
                () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
            );
            expect(hasOverflow).toBe(false);

            const undersizedTargets = await page
                .locator('button, [role="button"], a[href], input, select, textarea')
                .evaluateAll((nodes) => nodes
                    .filter((node) => {
                        const rect = node.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
                    })
                    .map((node) => node.outerHTML.slice(0, 160)));
            expect(undersizedTargets).toEqual([]);

            const results = await new AxeBuilder({ page }).analyze();
            expect(
                results.violations.filter(({ impact }) =>
                    impact === "serious" || impact === "critical"),
            ).toEqual([]);
        }
    });
}

test("skip-link, foco pós-navegação e diálogo são operáveis por teclado", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main-content")).toBeFocused();

    const trigger = page.getByRole("button", { name: /abrir confirmação/i });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    for (let index = 0; index < 6; index += 1) {
        await page.keyboard.press("Tab");
        expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
});
```

4. Validação do passo.

Executa `npm --prefix apps/web run test:e2e -- accessibility-responsive.spec.js`. Testa também `prefers-reduced-motion: reduce` e verifica que animações decorativas deixam de correr. O cenário de diálogo usa uma fixture autenticada que disponibiliza o trigger de confirmação, sem depender de IDs técnicos.

5. Cenários negativos/erro esperado.

Um segundo `<main>`, overflow a `320px`, alvo inferior a `44x44`, foco fora do diálogo ou qualquer violação Axe `serious`/`critical` fazem o gate falhar.

#### Expected results

- Interface com grupos visuais claros.
- Desktop com grelha de cartões equilibrada.
- Mobile em uma coluna, sem scroll horizontal.
- Formulários e botões legíveis em ecrãs pequenos, com alvos `44x44`.
- Um único `<main>`, skip-link funcional, foco pós-navegação e modais com focus trap/devolução de foco.
- Reduced motion respeitado e Axe sem violações `serious`/`critical` nas rotas principais.
- Estados `loading`, `error`, `empty` e `success` visíveis e consistentes.
- Evidence responsiva separada por build, desktop, mobile e negativos.

## Criterios de aceite

- `App.jsx` preserva gates de consultor/admin.
- Cliente, consultor e administrador têm menus distintos; apenas a rota ativa é renderizada e acesso direto continua protegido pela API.
- `styles.css` define grelha responsiva e breakpoint mobile.
- A shell possui um único `<main>` e as páginas internas usam `<section>`/`<article>`.
- Playwright cobre `320/375/768/1280`, teclado, focus trap, reduced motion e Axe.
- Não são criadas dependências novas.
- Não há alteração de endpoints nem payloads.
- O guia tem 9 passos, com validação separada de formulários/listas, visibilidade por role, acessibilidade e evidence por camada.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.

#### Validação final

- Executar `npm --prefix apps/web run build` ou equivalente no root usado.
- Executar `npm --prefix apps/web run test:e2e -- accessibility-responsive.spec.js`.
- Testar `320/375/768/1280` px.
- Confirmar que botões não ficam sobrepostos.
- [ ] Build: `npm --prefix apps/web run build` termina sem erro.
- [ ] Integração visual: grupos de cliente, consultoria e administração aparecem com as páginas esperadas depois de aplicar os BKs anteriores da MF5.
- [ ] E2E: os quatro viewports não têm scroll horizontal nem texto sobreposto.
- [ ] Acessibilidade: um `<main>`, skip-link, foco pós-navegação, focus trap e zero Axe `serious`/`critical`.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Evidência de testes por camada: build, integração visual, smoke/E2E responsivo e negativos ficam registados na PR ou defesa.

### Matriz mínima de testes por prioridade

| Prioridade | Camadas obrigatórias | Evidência esperada |
| --- | --- | --- |
| `P0` | Build frontend + Playwright em quatro viewports + teclado/foco + Axe + 3 negativos | Output do build/E2E, relatório Axe, matriz de viewports, role visibility e negativos controlados. |
| `P1` | Revisão de formulários/listas em mobile | Confirmação de que inputs, listas e cartões não criam scroll horizontal nem texto sobreposto. |
| `P2` | Revisão de regressão visual | Confirmação de que `BK-MF5-06`, `BK-MF5-07` e `BK-MF5-08` podem reutilizar a estrutura sem reescrever o layout. |

## Evidence para PR/defesa

- Output do build Vite.
- Captura desktop.
- Captura mobile.
- Output Playwright dos quatro viewports e relatório Axe.
- Registo do percurso de teclado, focus trap/devolução de foco e reduced motion.

#### Handoff

`BK-MF5-06` deve usar esta estrutura responsiva para consolidar tokens visuais da marca sem voltar a alterar contratos de API ou permissões.

#### Changelog

- `2026-07-10`: contrato atualizado para menus/rotas separados por role, um único `<main>`, skip-link, foco pós-navegação, focus trap, alvos `44x44`, reduced motion, viewports `320/375/768/1280` e gate Playwright/Axe.
- `2026-06-20`: acrescentados campos core dual no header, passos 6 a 8 e matriz mínima de testes P0 para fechar a granularidade de responsividade, roles e evidence por camada.
- `2026-06-19`: comentários didáticos reforçados nos blocos CSS longos e matriz mínima de testes integrada na validação final.
- `2026-06-19`: paths alinhados para `apps/web`, origem das páginas biométricas clarificada e matriz mínima de testes P0 adicionada.
- `2026-06-18`: guia reescrito para RNF01 com organização de `App.jsx`, CSS responsivo, estados visuais e validação desktop/mobile.

</details>
