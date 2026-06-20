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
- `last_updated`: `2026-06-20`

#### Objetivo

Neste BK vais tornar a interface principal da Orélle moderna, intuitiva e responsiva, para que os fluxos de cliente, consultor e administrador sejam utilizáveis em desktop e mobile.

#### Importância

Uma app de cosmética depende de confiança visual, leitura rápida e interação simples. Se a grelha quebrar no telemóvel, os alunos podem ter backend correto mas uma experiência difícil de defender.

#### Scope-in

- Organizar `App.jsx` com zonas claras por papel.
- Melhorar `styles.css` com layout responsivo, larguras seguras e estados visuais consistentes.
- Garantir que cartões, formulários e listas não rebentam em mobile.
- Manter `apiRequest` e sessão por cookie HttpOnly.
- Validar desktop e mobile por build e inspeção manual.

#### Scope-out

- Não criar router completo.
- Não introduzir Tailwind CSS ou biblioteca de componentes.
- Não redesenhar identidade visual final.
- Não alterar contratos de API.
- Não criar funcionalidades novas de negócio.

#### Estado antes e depois

- Antes: a app já tinha `app-shell`, `page-stack` e breakpoints simples, mas os painéis cresceram por macrofase e precisavam de organização mais previsível.
- Depois: a página inicial fica dividida por secções funcionais, com grelha fluida, formulários em coluna no mobile e cartões que preservam legibilidade.

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

#### Conceitos teóricos essenciais

Responsividade não é apenas reduzir o tamanho da letra. A interface deve mudar estrutura: duas colunas em ecrãs largos, uma coluna em mobile, botões com área de toque suficiente e textos que quebram dentro do contentor.

Uma app operacional não deve parecer uma landing page. A Orélle precisa de painéis repetidos, formulários e listas que suportem uso real por cliente, consultor e administrador.

Sem biblioteca de UI, o CSS global deve definir regras comuns para botões, inputs, cartões e grids. Isto reduz repetição nos componentes e ajuda a manter consistência nas próximas MF.

#### Arquitetura do BK

- `App.jsx`: agrupa páginas por papel e mantém gates por role.
- `styles.css`: define shell, grid, secções, formulários e mobile.
- Páginas existentes: continuam a usar `<main>` ou `<section>`.
- Build Vite: valida imports e CSS.

#### Ficheiros a criar/editar/rever

- EDITAR: `real_dev/web/src/App.jsx`
- EDITAR: `real_dev/web/src/styles.css`
- REVER: `real_dev/web/src/services/apiClient.js`
- REVER: páginas em `real_dev/web/src/pages/*.jsx`
- REVER: `real_dev/web/package.json`

#### Tutorial técnico linear

### Passo 1 - Mapear zonas funcionais da interface

1. Objetivo funcional do passo no contexto da app.

Separar visualmente fluxos de cliente, consultor e administrador sem criar routing novo.

2. Ficheiros envolvidos:
    - REVER: `real_dev/web/src/App.jsx`
    - REVER: `docs/planificacao/backlogs/MF-VIEWS.md`
    - LOCALIZAÇÃO: componente `AppContent`.

3. Instruções do que fazer.

Lista as páginas existentes e agrupa-as em três zonas: conta/cliente, consultoria e administração. Mantém gates por `user.role`.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Não há código porque este passo é de arquitetura visual. O objetivo é impedir que a UI cresça como uma lista sem hierarquia. A separação por papel ajuda o utilizador a encontrar o fluxo certo e prepara `BK-MF5-06`.

6. Validação do passo.

Consegues indicar em que zona aparece cada página e que role a pode ver.

7. Cenário negativo/erro esperado.

Mostrar painéis admin a clientes confunde a experiência e pode sugerir acesso indevido, mesmo que o backend bloqueie.

### Passo 2 - Reorganizar App.jsx com secções claras

1. Objetivo funcional do passo no contexto da app.

Criar grupos visuais sem alterar lógica de autenticação.

2. Ficheiros envolvidos:
    - EDITAR: `real_dev/web/src/App.jsx`
    - LOCALIZAÇÃO: função `AppContent`.

3. Instruções do que fazer.

Mantém os imports já existentes, acrescenta `SectionGroup` e liga as páginas biométricas criadas nos BKs anteriores da MF5 às zonas de consultoria e administração.

4. Código completo, correto e integrado com a app final.

```jsx
// real_dev/web/src/App.jsx
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
            <header className="app-header">
                <div>
                    <p className="app-kicker">real_dev</p>
                    <h1>Orélle</h1>
                </div>
                {user && <p className="session-pill">{user.email} · {user.role}</p>}
            </header>

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
        </div>
    );
}
```

5. Explicação do código.

`SectionGroup` é apenas estrutural e não muda permissões. As permissões continuam dependentes de `user.role`, vindo da sessão. O código preserva `recommendations` e `latestMakeupSimulation`, porque esses estados ligam recomendações, revisão por consultor, simulação e visualização antes/depois. A grelha interna permite que cada página continue isolada, mas a experiência deixa de ser uma pilha sem contexto. `BiometricDataRequestsAdminPage` e `BiometricAuditPage` são consumidas dos BKs anteriores da MF5; este BK só as posiciona visualmente nos grupos certos, sem recriar regras de privacidade nem substituir fluxos de MF0 a MF4.

6. Validação do passo.

Build deve passar sem imports em falta. Cliente não vê grupo de administração.

7. Cenário negativo/erro esperado.

Remover `isAdmin` ou `canReview` pode tornar visíveis painéis que o utilizador não deveria sequer tentar usar.

### Passo 3 - Criar CSS responsivo base

1. Objetivo funcional do passo no contexto da app.

Garantir que header, grelhas, formulários e cartões funcionam em desktop e mobile.

2. Ficheiros envolvidos:
    - EDITAR: `real_dev/web/src/styles.css`
    - LOCALIZAÇÃO: regras de layout e media query.

3. Instruções do que fazer.

Atualiza o CSS global com `section-group`, `section-grid`, larguras máximas e breakpoints.

4. Código completo, correto e integrado com a app final.

```css
/* real_dev/web/src/styles.css */
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
.section-grid > main,
.section-grid > section {
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 0.5rem;
    padding: 1.1rem;
    background: var(--surface);
    box-shadow: var(--shadow);
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
```

5. Explicação do código.

`auto-fit` com `minmax(19rem, 1fr)` cria cartões que se ajustam sem esmagar conteúdo. No mobile, a grelha passa para uma coluna e os botões empilhados deixam de competir pelo espaço horizontal. O CSS mantém border radius de `0.5rem`, coerente com a UI já existente, e não depende de biblioteca externa.

6. Validação do passo.

Reduz a janela para largura de telemóvel: cartões devem empilhar, inputs ocupar uma coluna e texto não deve sair do contentor.

7. Cenário negativo/erro esperado.

Usar largura fixa em pixels nos cartões pode criar scroll horizontal em telemóvel.

### Passo 4 - Validar estados visuais recorrentes

1. Objetivo funcional do passo no contexto da app.

Garantir que loading, erro, vazio e sucesso aparecem de forma consistente.

2. Ficheiros envolvidos:
    - REVER: `real_dev/web/src/pages/*.jsx`
    - EDITAR: `real_dev/web/src/styles.css`
    - LOCALIZAÇÃO: seletores `[role="alert"]`, `[role="status"]`, listas e artigos.

3. Instruções do que fazer.

Confirma que mensagens de erro usam `role="alert"` e progresso usa `role="status"`. Acrescenta CSS para listas e artigos.

4. Código completo, correto e integrado com a app final.

```css
/* real_dev/web/src/styles.css */
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

### Passo 5 - Executar build e inspeção manual

1. Objetivo funcional do passo no contexto da app.

Confirmar que a UI compila e é utilizável em larguras diferentes.

2. Ficheiros envolvidos:
    - REVER: `real_dev/web/package.json`
    - REVER: `real_dev/web/src/App.jsx`
    - REVER: `real_dev/web/src/styles.css`
    - LOCALIZAÇÃO: script `build`.

3. Instruções do que fazer.

Executa build Vite e abre a app em largura desktop e mobile. Executar cenários negativos obrigatórios (mínimo 3): largura mobile estreita sem scroll horizontal, cliente sem grupo de administração e erro visual sem detalhe técnico exposto.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix real_dev/web run build
```

5. Explicação do código.

O comando valida imports, JSX e CSS processado pelo Vite. A inspeção manual complementa o build porque responsividade é comportamento visual, não apenas compilação.

6. Validação do passo.

Build sem erro, sem scroll horizontal em mobile e sem texto sobreposto.

7. Cenário negativo/erro esperado.

Build a passar não prova que a UI está legível; por isso a inspeção visual continua obrigatória.

### Passo 6 - Validar formulários e listas em largura mobile

1. Objetivo funcional do passo no contexto da app.

Separar a validação mobile dos formulários, listas e cartões para evitar que a responsividade fique reduzida a uma observação genérica no build.

2. Ficheiros envolvidos:
    - REVER: `real_dev/web/src/pages/*.jsx`
    - REVER: `real_dev/web/src/styles.css`
    - LOCALIZAÇÃO: formulários, listas, artigos, cartões e mensagens dentro dos grupos criados em `AppContent`.

3. Instruções do que fazer.

Abre a app numa largura próxima de `375px` e percorre formulários de conta, perfil, fotografias, carrinho, pedidos biométricos e painéis administrativos disponíveis no estado atual do projeto. Confirma que cada input ocupa largura suficiente, que botões não se sobrepõem e que listas longas quebram linha sem criar scroll horizontal.

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
    - REVER: `real_dev/web/src/App.jsx`
    - REVER: `real_dev/api/src/middlewares`
    - REVER: `real_dev/api/src/routes`
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
    - REVER: `real_dev/web/package.json`
    - REVER: `real_dev/web/src/App.jsx`
    - REVER: `real_dev/web/src/styles.css`
    - LOCALIZAÇÃO: comandos e notas de validação anexadas à PR ou defesa.

3. Instruções do que fazer.

Guarda evidência de quatro camadas: build Vite, inspeção desktop, inspeção mobile e três negativos controlados. Os negativos mínimos são: mobile estreito sem scroll horizontal, cliente sem grupo admin e erro visual sem detalhes técnicos internos.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix real_dev/web run build
```

5. Explicação do código.

O comando valida a camada técnica do frontend, enquanto as notas e capturas validam comportamento visual. A evidência por camada evita que um BK P0 seja marcado como concluído apenas porque "parece funcionar" numa largura de ecrã.

6. Validação do passo.

A PR ou defesa deve incluir output do build, captura desktop, captura mobile e lista dos três negativos com resultado esperado e observado.

7. Cenário negativo/erro esperado.

Se só existir uma captura desktop, a evidência está incompleta. A correção é acrescentar mobile e negativos, porque `RNF01` exige desktop e mobile.

#### Expected results

- Interface com grupos visuais claros.
- Desktop com grelha de cartões equilibrada.
- Mobile em uma coluna, sem scroll horizontal.
- Formulários e botões legíveis em ecrãs pequenos.
- Estados `loading`, `error`, `empty` e `success` visíveis e consistentes.
- Evidence responsiva separada por build, desktop, mobile e negativos.

#### Critérios de aceite

- `App.jsx` preserva gates de consultor/admin.
- `styles.css` define grelha responsiva e breakpoint mobile.
- Não são criadas dependências novas.
- Não há alteração de endpoints nem payloads.
- O guia tem 8 passos, com validação separada de formulários/listas mobile, visibilidade por role e evidence por camada.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.

#### Validação final

- Executar `npm --prefix real_dev/web run build` ou equivalente no root usado.
- Testar largura desktop e largura mobile.
- Confirmar que botões não ficam sobrepostos.
- [ ] Build: `npm --prefix real_dev/web run build` termina sem erro.
- [ ] Integração visual: grupos de cliente, consultoria e administração aparecem com as páginas esperadas depois de aplicar os BKs anteriores da MF5.
- [ ] E2E ou smoke visual: desktop e mobile não têm scroll horizontal nem texto sobreposto.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Evidência de testes por camada: build, integração visual, smoke/E2E responsivo e negativos ficam registados na PR ou defesa.

### Matriz mínima de testes por prioridade

| Prioridade | Camadas obrigatórias | Evidência esperada |
| --- | --- | --- |
| `P0` | Build frontend + integração visual + smoke/E2E responsivo + 3 negativos | Output do build, captura desktop, captura mobile, nota de role visibility e lista dos três negativos controlados. |
| `P1` | Revisão de formulários/listas em mobile | Confirmação de que inputs, listas e cartões não criam scroll horizontal nem texto sobreposto. |
| `P2` | Revisão de regressão visual | Confirmação de que `BK-MF5-06`, `BK-MF5-07` e `BK-MF5-08` podem reutilizar a estrutura sem reescrever o layout. |

#### Evidence para PR/defesa

- Output do build Vite.
- Captura desktop.
- Captura mobile.
- Nota de inspeção com duas larguras testadas.

#### Handoff

`BK-MF5-06` deve usar esta estrutura responsiva para consolidar tokens visuais da marca sem voltar a alterar contratos de API ou permissões.

#### Changelog

- `2026-06-20`: acrescentados campos core dual no header, passos 6 a 8 e matriz mínima de testes P0 para fechar a granularidade de responsividade, roles e evidence por camada.
- `2026-06-19`: comentários didáticos reforçados nos blocos CSS longos e matriz mínima de testes integrada na validação final.
- `2026-06-19`: paths alinhados para `real_dev/web`, origem das páginas biométricas clarificada e matriz mínima de testes P0 adicionada.
- `2026-06-18`: guia reescrito para RNF01 com organização de `App.jsx`, CSS responsivo, estados visuais e validação desktop/mobile.
