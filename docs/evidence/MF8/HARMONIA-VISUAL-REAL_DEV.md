# Harmonia visual real_dev/web

## Objetivo

Harmonizar as páginas de `real_dev/web` com a home da Orélle como referência visual, preservando rotas, API, autenticação, autorização e comportamento funcional.

## Regras de execução

- Cada grupo de páginas deve ser auditado contra a home antes e depois da alteração.
- Erros de build, smoke, consola, layout, contraste, responsividade ou navegação bloqueiam o avanço até nova correção e reauditoria.
- Alterações fora de `real_dev/web` e deste log não fazem parte desta intervenção.
- Alterações pré-existentes no worktree devem ser preservadas.

## Inventário inicial

| Grupo | Rotas / páginas | Estado inicial contra a home |
| --- | --- | --- |
| Base visual | `/`, shells, tokens, estados globais | Home alinhada; restantes shells pareciam uma aplicação paralela. |
| Público/comercial | `/login`, `/registo`, `/produtos`, `/produtos/:productId`, `/produtos/:productId/relacionados` | Catálogo parcial; auth e detalhe/relacionados genéricos. |
| Consulta/IA | `/consulta`, `/consulta/sessao`, `/consulta/historico`, `/consulta/insights`, `/consulta/recomendacoes`, `ConsultantRecommendationReviewPage` | Hub próximo da home; páginas internas ainda genéricas. |
| Pele/beleza | `/pele/*` | Funcional, mas com pouca linguagem visual de beleza/consultoria. |
| Cliente/comércio | `/conta/*`, avaliação, rotina, carrinho, checkout, compras, notificações | Funcional/genérico; carrinho tinha apenas um CTA alinhado. |
| Consultor/admin | `/consultoria/*`, `/admin/*` | Backoffice funcional; precisava de tokens e cartões coerentes sem perder densidade. |
| Fallback | `*`, redirects | Simples e genérico. |

## Execução

### 2026-07-08 - Base visual, shells e público/comercial

- Estado inicial: `PublicLayout`, `ClientLayout`, `ConsultantLayout` e `AdminLayout` usavam a mesma `professional-shell` com topbar translúcida, heading duplicado e tema inicial dependente do sistema; a home usava `mockup-*` fixo e topbar própria.
- Alterações:
  - `AppLayoutShell` passou a expor variantes `public`, `client`, `consultant` e `admin`.
  - A heading da shell deixou de criar um segundo `h1`, ficando como contexto visual.
  - Áreas pública, cliente e consultoria ganharam CTA flutuante para IA; admin não.
  - Áreas pública e cliente ganharam pesquisa compacta de produtos na topbar, alinhada com a home.
  - Tema inicial passou a `light` para evitar salto visual inesperado entre home e páginas internas.
  - `styles.css` recebeu uma camada de harmonia centralizada para topbar, page panels, formulários, cards, listas, estados, catálogo, performance notice, fallback e responsividade.
  - A topbar mobile da home foi corrigida para impedir overflow horizontal em 390px.
- Erros encontrados:
  - A pesquisa da shell recebeu indevidamente estilo de painel de formulário; corrigido com exclusão de `.app-topbar-search`.
  - A home mobile deixava a navegação sair da viewport; corrigido com grid empilhado em `max-width: 620px`.
- Auditoria pós-alteração:
  - Desktop browser: `/`, `/login`, `/registo`, `/produtos`, `/consulta` anónimo.
  - Mobile browser 390x844: `/`, `/login`, `/produtos`.
  - Build: `npm run build` OK.
  - Smokes: `smoke:mf5-theme`, `smoke:mf6-page-budget`, `smoke:mf6-performance-unit`, `smoke:mf8-assisted-consultation`, `smoke:mf8-consultation`, `smoke:mf8-ai-history` OK.
- Estado: OK.

### 2026-07-08 - Grupos autenticados por harmonização global

- Estado inicial: páginas de conta, pele, rotina, carrinho, checkout, consultoria e admin usavam maioritariamente markup genérico sem classes próprias; a inconsistência vinha sobretudo da shell e dos estilos globais.
- Alterações:
  - A camada `.app-layout` aplica painéis, formulários, cartões, listas, links, estados e performance notices a todas as páginas internas sem alterar lógica React nem chamadas API.
  - Admin e consultoria usam a mesma marca e tokens com densidade operacional preservada.
- Auditoria pós-alteração:
  - Validação estática por inventário de rotas e classes.
  - Build e smokes acima cobrem as páginas medidas e fluxos IA reutilizados.
  - Rotas autenticadas não foram navegadas como utilizador real porque dependem de API/sessão; os contratos `RequireRole`, redirects e `apiRequest` não foram alterados.
- Estado: OK_COM_RESSALVA_DE_SESSAO.

### 2026-07-08 - Menus de topo com ícones e labels

- Estado inicial: a home e as shells internas usavam navegação textual; a shell de admin concentrava 9 links e era o caso com maior risco de ocupar espaço excessivo.
- Alterações:
  - Criado `NavIcon.jsx` com ícones SVG inline, sem dependências novas.
  - `PUBLIC_LINKS`, `CLIENT_LINKS`, `CONSULTANT_LINKS` e `ADMIN_LINKS` passaram a declarar `icon` e, nos itens longos, `shortLabel`.
  - `AppNavLink` passou a renderizar ícone + label visível, mantendo `aria-label` com o nome completo da rota.
  - A home passou a usar `HomeNavLink` com o mesmo padrão visual.
  - CSS da navegação foi ajustado para links compactos, sem quebra de label interna e com wrapping responsivo.
- Erros encontrados:
  - O servidor Vite voltou a falhar dentro da sandbox com `listen EPERM`; validação browser executada em servidor aprovado fora da sandbox.
  - `/consulta` anónimo redireciona para `/login`, comportamento esperado por `RequireRole`.
- Auditoria pós-alteração:
  - Auditoria estática: todos os links de topo declarados em home, público, cliente, consultoria e admin têm ícone.
  - Browser desktop 1280x720: `/`, `/login`, `/produtos`, `/consulta` sem overflow horizontal; todos os links visíveis com SVG.
  - Browser mobile 390x844: `/`, `/login`, `/produtos` sem overflow horizontal; links quebram em linhas sem sobreposição.
  - Consola browser: apenas avisos conhecidos do React Router future flags.
  - Build: `npm run build` OK.
  - Smokes: `smoke:mf5-theme`, `smoke:mf6-page-budget`, `smoke:mf8-assisted-consultation` OK.
- Estado: OK.

### 2026-07-08 - Menus icon-only e tema no rodapé

- Estado inicial: a navegação já tinha ícones, mas mantinha labels visíveis em todos os links; os controlos `Claro`, `Escuro` e `Contraste` continuavam na topbar das shells internas.
- Alterações:
  - Links normais da home e das shells passaram a ser icon-only com `aria-label` e `title`.
  - O link de IA mantém texto visível `IA` e estilo destacado.
  - `ThemeControls` passou a usar ícones SVG para claro, escuro e contraste, mantendo `aria-pressed` e labels acessíveis.
  - Os controlos de tema saíram da topbar interna e foram movidos para o rodapé da shell.
  - A home ganhou controlos de tema no rodapé, numa coluna discreta `Aparencia`.
  - CSS ajustado para footer responsivo e para neutralizar a margem mobile global entre botões dentro dos controlos de tema.
- Erros encontrados:
  - A regra mobile global `button + button { margin-top: 0.45rem; }` desalinhava os ícones de tema no rodapé; corrigido com override específico em `.theme-controls__button + .theme-controls__button`.
  - O servidor Vite voltou a falhar dentro da sandbox com `listen EPERM`; validação browser executada em servidor aprovado fora da sandbox.
- Auditoria pós-alteração:
  - Browser desktop 1280x720: `/`, `/login`, `/produtos` sem overflow horizontal; só `IA` mantém texto na topbar; restantes links icon-only.
  - Browser mobile 390x844: `/`, `/login`, `/produtos` sem overflow horizontal; tema ausente da topbar e presente no rodapé.
  - Consola browser: apenas avisos conhecidos do React Router future flags.
- Estado: OK.

## Validação final

- `npm run build`: OK.
- `npm run smoke:mf5-theme`: OK.
- `npm run smoke:mf6-page-budget`: OK.
- `npm run smoke:mf6-performance-unit`: OK.
- `npm run smoke:mf8-assisted-consultation`: OK.
- `npm run smoke:mf8-consultation`: OK.
- `npm run smoke:mf8-ai-history`: OK.
- Browser desktop: `/`, `/login`, `/registo`, `/produtos`, `/consulta` anónimo OK.
- Browser mobile 390x844: `/`, `/login`, `/produtos` OK depois da correcção de overflow da home.
- Consola browser: apenas avisos conhecidos do React Router future flags; sem erro novo de UI observado.
- `git diff --check`: OK.
- Pesquisa de whitespace nos ficheiros alterados: OK.
