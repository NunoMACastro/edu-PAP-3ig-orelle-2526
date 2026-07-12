# BK-MF0-02 - Login e logout com sessão segura (cookie HttpOnly)

## Header

- `doc_id`: `GUIA-BK-MF0-02`
- `bk_id`: `BK-MF0-02`
- `macro`: `MF0`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RF02`
- `fase_documental`: `Fase 1`
- `sprint`: `S01-S02`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF0-03`
- `guia_path`: `docs/planificacao/guias-bk/MF0/BK-MF0-02-login-e-logout-com-sessao-segura-cookie-httponly.md`
- `last_updated`: `2026-07-10`

#### BK-MF0-02 - Login e logout com sessão segura (cookie HttpOnly)

##### O que vamos fazer neste BK

Neste BK vamos implementar autenticação com login, logout e leitura do utilizador autenticado. O login deve validar email/password contra o `User` criado em `BK-MF0-01` quando esse BK já existir, mas a dependência canónica permanece `-`, tal como está na matriz.

O contrato técnico é `POST /api/auth/login`, `GET /api/auth/csrf`, `POST /api/auth/logout`, `POST /api/auth/logout-all` e `GET /api/auth/me`. O browser recebe num cookie `HttpOnly` um token opaco aleatório de 256 bits; a base de dados guarda apenas o respetivo hash e metadados de ciclo de vida, nunca a credencial reutilizável.

A revisão manual/Figma foi dispensada no alvo académico/local e RNF26 está `ACEITE_RISCO`. A árvore visual disponível não está confirmada como versão aprovada e não prova paridade; este BK valida feedback, teclado, responsive e segurança do login.

##### Porque é que isto é importante

- Permite proteger rotas futuras de perfil, preferências, produtos administrativos e uploads.
- Aplica `RF02` e antecipa `RNF14`, mantendo sessão fora de `localStorage`.
- Ensina o fluxo `request -> middleware -> controller -> service -> response`.
- Cria o middleware `requireAuth`, reutilizado por quase todos os BKs seguintes.

##### O que entra (scope)

- Login com email e password.
- Logout da sessão atual e logout de todas as sessões, ambos com revogação persistida imediata.
- Endpoint `GET /api/auth/me`.
- Cookie `HttpOnly`, `SameSite` e `Secure` em produção.
- Middleware `requireAuth`.
- Proteção CSRF de mutações autenticadas através de `GET /api/auth/csrf`, `X-CSRF-Token` e `Origin` allowlisted.
- Página React de login e estado de autenticação básico.
- Testes negativos de credenciais, ausência de cookie e logout.

##### O que não entra (scope-out)

- Recuperação de password.
- Refresh tokens complexos.
- OAuth, Google Login ou autenticação externa.
- Gestão avançada de roles, que fica para `BK-MF0-05`.

##### Como saber que isto ficou bem

- Login válido devolve `200` e define cookie `HttpOnly`.
- Login inválido devolve `401` sem criar cookie.
- `GET /api/auth/me` devolve o utilizador apenas com cookie válido.
- Logout revoga a sessão persistida e limpa o cookie; o token antigo deixa de funcionar imediatamente.
- Logout-all revoga todas as sessões ativas do utilizador.
- Uma mutação autenticada sem prova CSRF válida ou com origem não autorizada devolve `403`.
- O frontend não guarda token em `localStorage` nem em `sessionStorage`.

#### Metadados do BK (CANONICO/DERIVADO):

- Prioridade: `P0` (CANONICO)
- Estado: `TODO` (CANONICO)
- Esforco: `M` (CANONICO)
- macro: `MF0` (CANONICO)
- Owner: `Bruna` (CANONICO)
- Apoio: `Izelicks` (CANONICO)
- Dependências (BK IDs): `-` (CANONICO)
- Pré-condições: backend criado ou preparado; utilizador de teste criado por registo ou seed local (DERIVADO)
- Ref. Plano: `RF02`, `Fase 1`, `S01-S02`, `Reforco` (CANONICO)
- Flow ID: `FLOW-AUTH-SESSION` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF02` (CANONICO)
- Fonte de verdade: `docs/RNF.md` -> `RNF14` como restrição transversal (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-02` (CANONICO)
- Descrição: Login e logout com sessão segura baseada em cookie `HttpOnly` (CANONICO)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: existe ou está planeado o modelo `User` com `email` e `passwordHash`.
- Estado esperado depois do BK: a app tem sessão autenticada, logout e middleware para proteger rotas.
- Ficheiros a criar: `apps/api/src/services/session.service.js`, `apps/api/src/middlewares/auth.middleware.js`, `apps/web/src/pages/LoginPage.jsx`, `apps/web/src/context/AuthContext.jsx`.
- Ficheiros a editar: `apps/api/src/routes/auth.routes.js`, `apps/api/src/controllers/auth.controller.js`, `apps/api/src/services/auth.service.js`, `apps/web/src/services/apiClient.js`, `apps/web/src/App.jsx`.
- Dependências de BK anteriores: dependência canónica `-`; reutilização técnica do `User` de `BK-MF0-01` se já estiver implementado.
- Impacto na arquitetura: introduz autenticação transversal e middleware reutilizável.
- Impacto em frontend: cria estado autenticado e formulário de login.
- Impacto em backend: adiciona criação/validação de sessão opaca persistida, revogação, rotação de prova CSRF e leitura segura via cookie.
- Impacto em dados: `AuthSession` guarda apenas `tokenHash`, `userId`, `expiresAt`, `revokedAt`, `lastSeenAt` e `csrfHash`; nunca guarda o token bruto.
- Impacto em segurança: cookie `HttpOnly`, `sameSite: 'lax'`, `secure` quando HTTPS é obrigatório, segredo/pepper fora do código, CSRF ligado à sessão e `Origin` allowlisted.
- Impacto em testes: testar login válido, login inválido, rota protegida sem cookie e logout.
- Handoff para o próximo BK: `BK-MF0-03` deve usar `requireAuth` para criar perfil apenas do utilizador autenticado.

#### Pre-leitura mínima (10-15 min) (DERIVADO):

- `docs/RF.md`: `RF02`.
- `docs/RNF.md`: `RNF14`, `RNF10`, `RNF19`.
- `docs/planificacao/backlogs/BACKLOG-MVP.md`: linha `BK-MF0-02`.
- Guia `BK-MF0-01`, se já tiver sido executado, para confirmar `User.passwordHash`.
- `mockup/`: árvore disponível apenas como referência não aprovada; revisão manual/Figma dispensada no alvo académico/local, com risco residual `ACEITE_RISCO` e sem alegação de paridade.

#### Glossario (rapido) (DERIVADO):

- `Sessão`: prova temporária de que o utilizador já fez login.
- `Cookie HttpOnly`: cookie inacessível por JavaScript no browser.
- `SameSite`: política que reduz envio de cookies em navegações de outros sites.
- `Token opaco`: credencial aleatória sem identidade ou permissões no próprio valor; a API resolve-a através do hash persistido.
- `Revogação`: marcação persistida que torna a sessão inválida antes do fim do TTL.
- `CSRF`: pedido forjado que tenta aproveitar o envio automático do cookie; é mitigado com prova ligada à sessão e origem autorizada.
- `Middleware`: função que corre antes do controller.
- `requireAuth`: middleware que bloqueia pedidos sem sessão válida.
- `401`: erro para utilizador não autenticado.
- `403`: erro para utilizador autenticado mas sem permissão.

#### Conceitos teoricos essenciais (DERIVADO):

Um cookie `HttpOnly` é mais seguro do que guardar tokens no `localStorage` porque não pode ser lido diretamente por scripts no frontend. Isto reduz o impacto de ataques XSS, embora não dispense validação, escape de conteúdo e boas práticas de frontend.

O login não compara a password recebida com uma password guardada. Compara a password recebida com o `passwordHash` usando `bcrypt.compare`. Se a comparação passar, o servidor emite uma sessão.

O middleware `requireAuth` é uma peça de arquitetura. Ele lê o cookie, válida a sessão e coloca o utilizador em `req.user`. Assim, controllers futuros não precisam repetir lógica de autenticação.

Decisão técnica fechada: a Orélle usa apenas sessões opacas persistidas. O token aleatório tem 256 bits, só o hash é guardado, o TTL é verificado em cada pedido e `revokedAt`/`lastSeenAt` suportam revogação imediata e observação do ciclo de vida.

#### Guia de execução (passo-a-passo) (DERIVADO):

0. **Objetivo (~15 min): confirmar o contrato de sessão opaca**
    - Descrição detalhada do objetivo: confirmar persistência, revogação e proteção CSRF antes de editar controllers.
    - Justificação: login, guards, logout e cliente HTTP dependem do mesmo contrato.
    - Como fazer (0.1): usar exclusivamente `AuthSession` e token opaco de 256 bits.
    - Como fazer (0.2): guardar `SESSION_SECRET` em `.env`, nunca no código; é usado como pepper HMAC, não como conteúdo do cookie.
    - Ficheiro a rever: `docs/RNF.md`.
    - Ficheiro alvo: `apps/api/src/config/env.js`.
    - Snippet de referência: `sessionSecret: process.env.SESSION_SECRET`.
    - O que verificar: app falha com erro claro se faltar segredo em ambiente real.

1. **Objetivo (~25 min): criar validação de login**
    - Descrição detalhada do objetivo: validar email e password antes do service.
    - Justificação: evita chamadas desnecessárias à BD e respostas inconsistentes.
    - Como fazer (1.1): criar `validateLoginInput`.
    - Como fazer (1.2): devolver erro genérico quando credenciais estiverem erradas.
    - Ficheiro a rever: `apps/api/src/validators/auth.validator.js`.
    - Ficheiro alvo: `apps/api/src/validators/auth.validator.js`.
    - Snippet de referência: `if (!email || !password) errors.credentials = 'Credenciais inválidas';`.
    - O que verificar: dados vazios devolvem `400`.

2. **Objetivo (~35 min): implementar service de login**
    - Descrição detalhada do objetivo: procurar utilizador por email e comparar password com `bcrypt`.
    - Justificação: a regra de autenticação fica testável e separada do HTTP.
    - Como fazer (2.1): procurar `User.findOne({ email })`.
    - Como fazer (2.2): usar `await bcrypt.compare(password, user.passwordHash)`.
    - Ficheiro a rever: `apps/api/src/models/user.model.js`.
    - Ficheiro alvo: `apps/api/src/services/auth.service.js`.
    - Snippet de referência: `const ok = await bcrypt.compare(password, user.passwordHash);`.
    - O que verificar: password errada não revela se o email existe.

3. **Objetivo (~45 min): criar sessão persistida e emitir o cookie**
    - Descrição detalhada do objetivo: gerar 32 bytes aleatórios, persistir só o HMAC e definir o cookie seguro.
    - Justificação: uma leitura da BD não deve revelar credenciais reutilizáveis e uma sessão deve poder ser revogada.
    - Como fazer (3.1): criar `AuthSession` com `tokenHash`, titular, expiração, `revokedAt: null`, `lastSeenAt` e `csrfHash: null`.
    - Como fazer (3.2): usar `httpOnly: true`, `sameSite: 'lax'`, `secure: env.forceHttps`, `path: '/'` e `maxAge` igual ao TTL.
    - Ficheiro a rever: `docs/RNF.md`.
    - Ficheiro alvo: `apps/api/src/services/session.service.js`.
    - Snippet de referência: `res.cookie('orelle_session', token, cookieOptions);`.
    - O que verificar: DevTools mostra cookie como `HttpOnly`.

4. **Objetivo (~40 min): criar login, CSRF, logout, logout-all e me**
    - Descrição detalhada do objetivo: expor endpoints de sessão.
    - Justificação: frontend e BKs seguintes precisam de saber quem está autenticado.
    - Como fazer (4.1): adicionar `POST /login`, `GET /csrf`, `POST /logout`, `POST /logout-all` e `GET /me`.
    - Como fazer (4.2): revogar primeiro a sessão persistida e só depois limpar o cookie com os mesmos atributos; logout-all usa o `userId` autenticado.
    - Ficheiro a rever: `apps/api/src/routes/auth.routes.js`.
    - Ficheiro alvo: `apps/api/src/controllers/auth.controller.js`.
    - Snippet de referência: `res.clearCookie('orelle_session', cookieOptions);`.
    - O que verificar: os tokens revogados deixam de aceder a `/me`, mesmo se o cookie for reapresentado manualmente.

5. **Objetivo (~35 min): criar requireAuth**
    - Descrição detalhada do objetivo: bloquear rotas sem sessão válida.
    - Justificação: perfil, preferências e admin dependem deste middleware.
    - Como fazer (5.1): ler cookie do pedido.
    - Como fazer (5.2): procurar o hash numa sessão não revogada/não expirada, atualizar `lastSeenAt`, revalidar a conta e anexar identidade mínima a `req.user` e metadata a `req.authSession`.
    - Ficheiro a rever: `apps/api/src/services/session.service.js`.
    - Ficheiro alvo: `apps/api/src/middlewares/auth.middleware.js`.
    - Snippet de referência: `req.user = sessionUser; return next();`.
    - O que verificar: sem cookie devolve `401`.

6. **Objetivo (~45 min): criar UI de login**
    - Descrição detalhada do objetivo: permitir login sem guardar token no browser.
    - Justificação: cookies HttpOnly são enviados pelo browser automaticamente.
    - Como fazer (6.1): usar `/api` same-origin, `credentials: 'include'`, obter `/auth/csrf` e enviar `X-CSRF-Token` nas mutações autenticadas.
    - Como fazer (6.2): criar `LoginPage` com estados loading/error/success.
    - Ficheiro a rever: `apps/web/src/services/apiClient.js`.
    - Ficheiro alvo: `apps/web/src/pages/LoginPage.jsx`.
    - Snippet de referência: `fetch(url, { credentials: 'include', ...options })`.
    - O que verificar: `localStorage` não contém tokens.

7. **Objetivo (~45 min): validar sessão e preparar handoff**
    - Descrição detalhada do objetivo: testar login, CSRF, logout, logout-all, `/me` e rota protegida.
    - Justificação: bugs de auth bloqueiam todos os BKs seguintes.
    - Como fazer (7.1): criar smoke com utilizador válido.
    - Como fazer (7.2): Executar cenários negativos obrigatórios (mínimo 3) e registar resultados.
    - Ficheiro a rever: `docs/planificacao/sprints/PLANO-SPRINTS.md`.
    - Ficheiro alvo: `apps/api/tests/auth.session.test.js`.
    - Snippet de referência: `expect(response.headers['set-cookie']).toContain('HttpOnly');`.
    - O que verificar: evidência mostra cookie `HttpOnly` e logout efetivo.

#### Checklist de validação (DERIVADO):

- Smoke: login válido devolve `200`, cria sessão/hash e cookie, e `/api/auth/me` devolve utilizador seguro.
- Negativo 1: passo 2; password errada; resultado esperado `401` sem cookie; risco que cobre: autenticação indevida.
- Negativo 2: passo 5; chamada a `/me` sem cookie; resultado esperado `401`; risco que cobre: acesso anónimo.
- Negativo 3: passo 6; verificar `localStorage`; resultado esperado sem token; risco que cobre: roubo de sessão por XSS.
- Negativo 4: mutação sem `X-CSRF-Token`, com token errado ou `Origin` fora da allowlist; resultado esperado `403`; risco que cobre: CSRF.
- Concorrência/revogação: depois de `logout-all`, todos os cookies anteriores devolvem `401`.
- Técnico: `requireAuth` existe e é reutilizável.
- Regressão das fases anteriores: confirmar que registo de `BK-MF0-01` continua a criar utilizador.
- UI/mockup: validar comportamento responsive/acessível pelos gates locais; a revisão manual/Figma foi dispensada como `ACEITE_RISCO`, sem alegar aprovação, alinhamento exato ou screenshots inexistentes.
- Segurança: cookie `HttpOnly`; segredo em `.env`; mensagem de erro de credenciais não enumera emails.

#### Critérios de aceite:

- Outputs: endpoints `POST /api/auth/login`, `GET /api/auth/csrf`, `POST /api/auth/logout`, `POST /api/auth/logout-all`, `GET /api/auth/me` e middlewares `requireAuth`/CSRF.
- Verificações: cookie `HttpOnly` criado no login; sessão revogada no logout; todas as sessões revogadas no logout-all; mutações protegidas por token e origem.
- Qualidade: não há tokens em `localStorage`/`sessionStorage`.
- Continuidade: `BK-MF0-03`, `BK-MF0-04`, `BK-MF0-06` e `BK-MF0-07` podem proteger rotas.
- Evidência: output de testes/curl com headers `Set-Cookie` e teste negativo de cookie ausente.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher após validação`
- `neg`: `A preencher após testes negativos`
- `files`: `apps/api/src/middlewares/auth.middleware.js`, `apps/api/src/services/session.service.js`, `apps/web/src/pages/LoginPage.jsx`
- `commands`: `curl -i -X POST /api/auth/login`, `curl -i /api/auth/me`
- `screenshots`: login com erro e login com sucesso
- `notes`: sessão opaca persistida é a única estratégia ativa; registar hashes/contagens, nunca tokens ou cookies

#### TODOs

- TODO (BLOCKER): definir `SESSION_SECRET` forte no ambiente autorizado, sem o copiar para evidence.
- Decisão confirmada: cookie `orelle_session` com `HttpOnly`, `SameSite=Lax` e `Secure` quando HTTPS é obrigatório.
- Decisão confirmada: toda a mutação autenticada usa `X-CSRF-Token` e `Origin` allowlisted.

## Contexto do BK

- Entrega alvo: implementar `Login e logout com sessão segura (cookie HttpOnly)` com rastreabilidade direta ao requisito `RF02`.
- Foco técnico da macro: `Fundamentos e governance`.
- Regra de governança: preservar IDs BK, contrato de campos e consistência entre backlog, matriz, sprints e guias.

## Bloco pedagógico

### Objetivo

Implementar sessão segura para que os próximos BKs consigam saber quem está autenticado.

### Pré-requisitos

- Rever `RF02` e `RNF14`.
- Ter `User` e `passwordHash` preparados ou criar um utilizador de teste local.
- Ter segredo de sessão configurado fora do código.

### Erros comuns

- Guardar token em `localStorage`.
- Esquecer `credentials: 'include'` no frontend.
- Responder com mensagens que confirmam se um email existe.
- Limpar cookie com opções diferentes das usadas para criar.

### Check de compreensao

- [ ] Sei explicar o que é um cookie `HttpOnly`.
- [ ] Sei onde o middleware `requireAuth` entra no fluxo.
- [ ] Sei demonstrar que logout remove a sessão.

### Tempo estimado

- `M`: 2 a 4 horas, incluindo validação de cookie no browser.

## Bloco operacional

### Entrada

- BK: `BK-MF0-02`
- Requisito: `RF02`
- Dependências: `-`
- Artefactos: `RF.md`, `RNF.md`, `BACKLOG-MVP.md`, `MATRIZ-CANONICA-BK.md`

### Passos

1. Confirmar sessão opaca persistida e modelo `AuthSession`.
2. Validar input de login.
3. Comparar password com `bcrypt.compare`.
4. Emitir cookie `HttpOnly`.
5. Criar CSRF, logout, logout-all e `/me`.
6. Criar middleware `requireAuth`.
7. Criar UI de login sem guardar token.
8. Executar cenários negativos obrigatórios (mínimo 3) e registar evidência.

### Cenários negativos recomendados

- Credenciais erradas devem devolver `401`.
- `/api/auth/me` sem cookie deve devolver `401`.
- Logout deve invalidar acesso posterior a `/api/auth/me`.

### Validação

- [ ] Smoke: login válido cria cookie.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Técnico: cookie é `HttpOnly`.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificáveis.

### Matriz mínima de testes por prioridade

- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff

- Próximo BK recomendado: `BK-MF0-03`
- O próximo BK deve proteger criação de perfil com `requireAuth`.

## Snippet técnico aplicável

O código aplicável deste BK-MF0-02 já não fica como anexo isolado. Para cumprir o contrato documental sem contrariar o formato tutorial, considera-se técnico aplicável o conjunto de blocos completos no `## Tutorial linear de implementação`, sempre ligados a `BK-MF0-02` e `RF02`.

Usar um snippet solto aqui seria pedagogicamente mais fraco: o aluno poderia copiar uma função sem perceber ficheiro, imports, validação, erro esperado e handoff. Por isso, o código foi integrado nos passos onde é usado.

## Critérios de aceite

- Entrega funcional específica de `Login e logout com sessão segura (cookie HttpOnly)` validada contra `RF02`.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisão técnica e defesa PAP.

## Evidence para PR/defesa

- `pr`: `A preencher no fecho do BK`
- `proof_tecnico`: `A preencher após validação`
- `proof_negativos`: `A preencher após testes negativos`
- `proof_negocio`: sessão desbloqueia perfil, preferências, admin e fluxos personalizados.

## Próximo BK recomendado

`BK-MF0-03`

## Tutorial linear de implementação

### Passo 1 - Confirmar contrato, scope e riscos

1. Objetivo simples do passo: confirmar o que este BK entrega, o que fica fora e que contratos dos BKs vizinhos não podem ser quebrados.
2. Ficheiros envolvidos:
    - CRIAR: nenhum ficheiro de aplicação neste passo.
    - EDITAR: este guia BK, apenas para orientar a implementação.
    - LOCALIZAÇÃO: ler esta secção antes de abrir o editor de código.
    - REVER: RF/RNF indicados no header, backlog, matriz, MF-VIEWS e próximo BK.
3. O que fazer: ler e respeitar as decisões abaixo antes de implementar.
4. Código completo, correto e integrado: este passo ainda não tem código; o código aparece nos passos seguintes, junto do ficheiro onde é usado.
5. Explicação didática e detalhada: este passo evita que o aluno implemente uma funcionalidade correta isoladamente, mas incoerente com a app final. Primeiro confirma-se o contrato; só depois se escreve código.
6. Como validar: confirmar que o header do BK, RF/RNF, dependências e handoff continuam iguais aos documentos canónicos.
7. Erro comum ou cenário negativo: alterar scope, IDs, roles, nomes de ficheiros ou prometer IA/recomendações/pagamentos antes da fase correta.

**Decisão técnica confirmada:**
Este BK usa exclusivamente sessões opacas persistidas. O cookie `orelle_session` contém 32 bytes aleatórios em base64url; o MongoDB recebe apenas o HMAC SHA-256, titular, TTL e campos de revogação/atividade/CSRF. Identidade e permissões são sempre resolvidas e revalidadas no backend.

**Scope-in deste passo:**

- Acrescentar dependências de sessão ao backend.
- Implementar `POST /api/auth/login`.
- Implementar `GET /api/auth/csrf`.
- Implementar `POST /api/auth/logout`.
- Implementar `POST /api/auth/logout-all`.
- Implementar `GET /api/auth/me`.
- Criar `requireAuth` para proteger BKs seguintes.
- Configurar cookie `HttpOnly`, `SameSite=Lax` e `Secure` apenas fora de desenvolvimento.
- Garantir que credenciais inválidas não revelam se o email existe.

**Scope-out deste passo:**

- Recuperacao de password.
- Refresh tokens.
- OAuth/Google login.
- Gestao avancada de roles, que fica para `BK-MF0-05`.
- Proteger todas as mutações autenticadas com `X-CSRF-Token` e `Origin` allowlisted.

### Passo 2 - Mapear ficheiros antes de codificar

1. Objetivo simples do passo: identificar todos os ficheiros antes de escrever código, para evitar duplicados, imports partidos e contratos divergentes entre BKs.
2. Ficheiros envolvidos:
    - EDITAR:
        - `apps/api/package.json`
        - `apps/api/src/config/env.js`
        - `apps/api/src/app.js`
        - `apps/api/src/services/auth.service.js`
        - `apps/api/src/controllers/auth.controller.js`
        - `apps/api/src/routes/auth.routes.js`
        - `apps/web/src/services/apiClient.js`
        - `apps/web/src/App.jsx`

    - CRIAR:
        - `apps/api/src/services/session.service.js`
        - `apps/api/src/models/auth-session.model.js`
        - `apps/api/src/middlewares/auth.middleware.js`
        - `apps/api/src/middlewares/csrf.middleware.js`
        - `apps/api/tests/auth.session.test.js`
        - `apps/web/src/context/AuthContext.jsx`
        - `apps/web/src/pages/LoginPage.jsx`

    - REVER:
        - `apps/api/src/models/user.model.js`, criado no `BK-MF0-01`.
        - `docs/RNF.md`, requisitos `RNF10` e `RNF14`.
        - `docs/planificacao/guias-bk/MF0/BK-MF0-03-criacao-de-perfil-personalizado-com-nome-idade-tipo-de-pele-genero-e-objetivos-ex-hidratar-antiacne.md`, porque vai depender de `requireAuth`.
    - LOCALIZAÇÃO: usar exatamente os caminhos listados; quando o ficheiro já existir, editar o ficheiro existente em vez de criar outro com nome parecido.

3. O que fazer: criar ou editar estes ficheiros pela ordem dos passos seguintes.
4. Código completo, correto e integrado: este passo ainda não tem código; ele prepara a lista para os passos de implementação.
5. Explicação didática e detalhada: mapear ficheiros antes de programar ensina separacao de responsabilidades e reduz erros de arquitetura.
6. Como validar: verificar que cada caminho aparece uma única vez e que os nomes batem com os imports dos passos seguintes.
7. Erro comum ou cenário negativo: criar ficheiros duplicados, por exemplo outro controller com nome parecido, faz a app compilar parcialmente mas falhar no fluxo completo.

### Passo 3 - Implementar código por ficheiro

1. Objetivo simples do passo: escrever cada ficheiro no local certo, mantendo o contrato com os BKs anteriores e seguintes.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: os ficheiros aparecem um a um nos subpassos abaixo.
    - LOCALIZAÇÃO: cada subpasso indica o caminho completo do ficheiro.
    - REVER: imports, exports, nomes das funções e contratos HTTP usados no handoff.
3. O que fazer: seguir os subpassos na ordem apresentada; cada bloco de código deve ser colocado no ficheiro indicado.
4. Código completo, correto e integrado: os blocos surgem imediatamente abaixo, junto do ficheiro onde são usados.
5. Explicação didática e detalhada: a ordem dos ficheiros acompanha a arquitetura da app, para o aluno perceber como dados entram, são validados, passam pelo service e chegam ao frontend.
6. Como validar: após cada ficheiro, confirmar imports/exports e mensagens de erro antes de passar ao seguinte.
7. Erro comum ou cenário negativo: copiar apenas parte do código deixa o tutorial incoerente e quebra os passos posteriores.

### Passo 4 - Criar ou editar `apps/api/package.json`

1. Objetivo simples do passo: implementar o ficheiro `apps/api/package.json` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/api/package.json` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `apps/api/package.json`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `apps/api/package.json` e manter as dependências do `BK-MF0-01`, acrescentando apenas `cookie-parser` para ler o cookie. A sessão opaca usa `node:crypto`, Mongoose e APIs nativas; não precisa de biblioteca de tokens auto-contidos.

```json
{
    "name": "orelle-server",
    "version": "0.1.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "node --watch src/server.js",
        "start": "node src/server.js",
        "test": "vitest run"
    },
    "dependencies": {
        "bcryptjs": "^2.4.3",
        "cookie-parser": "^1.4.6",
        "cors": "^2.8.5",
        "dotenv": "^16.4.5",
        "express": "^4.19.2",
        "mongoose": "^8.5.1"
    },
    "devDependencies": {
        "supertest": "^7.0.0",
        "vitest": "^2.0.5"
    }
}
```

5. Explicação do código: `cookie-parser` deixa o Express ler `orelle_session`. A aleatoriedade e os HMACs vêm de `node:crypto`; a persistência e revogação usam Mongoose.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 5 - Criar ou editar `apps/api/src/config/env.js`

1. Objetivo simples do passo: implementar o ficheiro `apps/api/src/config/env.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/api/src/config/env.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `apps/api/src/config/env.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `apps/api/src/config/env.js` e acrescentar `sessionSecret` e `sessionTtl`.

```js
const DEFAULT_DEV_MONGO_URI = "mongodb://127.0.0.1:27017/orelle";
const DEFAULT_TEST_MONGO_URI = "mongodb://127.0.0.1:27017/orelle_test";
const INSECURE_SESSION_SECRETS = new Set([
    "dev-only-change-me",
    "change-me",
    "secret",
    "session-secret",
]);
const configuredNodeEnv = process.env.NODE_ENV ?? "development";
const defaultMongoUri =
    configuredNodeEnv === "test"
        ? DEFAULT_TEST_MONGO_URI
        : DEFAULT_DEV_MONGO_URI;

function isUnsafeProductionSessionSecret(secret) {
    const normalized = String(secret ?? "").trim();
    return normalized.length < 32 || INSECURE_SESSION_SECRETS.has(normalized.toLowerCase());
}

export const env = {
    nodeEnv: configuredNodeEnv,
    port: Number(process.env.PORT ?? 3001),
    mongoUri: process.env.MONGODB_URI ?? defaultMongoUri,
    clientOrigin: process.env.CLIENT_ORIGIN ?? "http://127.0.0.1:5173",
    sessionSecret: process.env.SESSION_SECRET ?? "dev-only-change-me",
    sessionTtl: process.env.SESSION_TTL ?? "2h",
};

if (!/^mongodb(?:\+srv)?:\/\//i.test(env.mongoUri)) {
    throw new Error("MONGODB_URI deve usar um protocolo MongoDB válido");
}

if (env.nodeEnv === "production") {
    if (!String(process.env.MONGODB_URI ?? "").trim()) {
        throw new Error("MONGODB_URI explícita é obrigatória em production");
    }
    if (isUnsafeProductionSessionSecret(env.sessionSecret)) {
        throw new Error("SESSION_SECRET forte obrigatorio em producao");
    }
}
```

5. Explicação do código: o segredo funciona como pepper do HMAC persistido e separa hashes CSRF por sessão. Os defaults conhecidos existem apenas para compatibilidade de import direto fora de produção; `dev:local`/`dev` substituem-nos por URI de replica set e segredo aleatório depois de limpar o ambiente herdado. Produção falha fechado sem Mongo explícito ou com segredo conhecido/fraco.
6. Como validar: em `dev:local`, confirma replica set efémero e segredo não impresso; com `NODE_ENV=production`, ausência de `MONGODB_URI` ou `SESSION_SECRET` forte tem de impedir o arranque.
7. Erro comum ou cenário negativo: arrancar a demonstração ou testes transacionais por import direto e confundir os defaults de compatibilidade com configuração segura. Os gates usam sempre runners isolados e nunca o valor conhecido `dev-only-change-me`.

### Passo 6 - Criar ou editar `apps/api/src/validators/auth.validator.js`

1. Objetivo simples do passo: separar a validação de registo da validação de login, mantendo mensagens claras e sem revelar se a conta existe.
2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/validators/auth.validator.js`.
    - LOCALIZAÇÃO: substituir o ficheiro criado no `BK-MF0-01` pela versao completa abaixo.
    - REVER: `apps/api/src/controllers/auth.controller.js` e `apps/api/src/services/auth.service.js`, porque ambos usam estes validators.
3. O que fazer: manter `validateRegisterInput` para registo e acrescentar `validateLoginInput` para login.
4. Código completo, correto e integrado:

Editar `apps/api/src/validators/auth.validator.js` e substituir pelo ficheiro completo abaixo.

```js
import { AppError } from "../middlewares/error.middleware.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

export function validateRegisterInput(body) {
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? "");
    const errors = {};

    if (!EMAIL_RE.test(email)) {
        errors.email = "Email invalido";
    }

    if (password.length < 8) {
        errors.password = "A password deve ter pelo menos 8 caracteres";
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        errors.password = "A password deve incluir letras e numeros";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de registo invalidos", errors);
    }

    return { email, password };
}

export function validateLoginInput(body) {
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? "");
    const errors = {};

    if (!EMAIL_RE.test(email)) {
        errors.email = "Email invalido";
    }

    if (!password) {
        errors.password = "Password obrigatória";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de login invalidos", errors);
    }

    return { email, password };
}
```

5. Explicação do código: o registo exige password forte porque esta a criar uma conta nova; o login apenas confirma que email e password foram enviados, porque a segurança principal acontece na comparacao com o hash guardado. Separar os validators evita misturar regras de criação de conta com regras de autenticação.
6. Como validar: pedir login sem password deve devolver `400`; pedir login com password errada mas formato válido deve chegar ao service e devolver `401 Credenciais invalidas`.
7. Erro comum ou cenário negativo: usar `validateRegisterInput` no login pode bloquear passwords antigas se a política de password mudar, criando uma regressão de autenticação.

### Passo 7 - Criar `AuthSession` e o service de sessão opaca

1. Objetivo simples do passo: implementar o ficheiro `apps/api/src/services/session.service.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/api/src/models/auth-session.model.js` e `apps/api/src/services/session.service.js`.
    - LOCALIZAÇÃO: model persistido e service de credenciais/revogação.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar o model em `apps/api/src/models/auth-session.model.js`.

```js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const authSessionSchema = new Schema(
    {
        tokenHash: { type: String, required: true, unique: true, select: false },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        expiresAt: { type: Date, required: true },
        revokedAt: { type: Date, default: null, index: true },
        lastSeenAt: { type: Date, required: true },
        csrfHash: { type: String, default: null, select: false },
    },
    { timestamps: true },
);

authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
authSessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

export const AuthSession = model("AuthSession", authSessionSchema);
```

Criar o contrato abaixo em `apps/api/src/services/session.service.js`.

```js
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";
import { AuthSession } from "../models/auth-session.model.js";

export const SESSION_COOKIE_NAME = "orelle_session";
export const SESSION_TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CSRF_HASH_PATTERN = /^[a-f0-9]{64}$/;

export function parseSessionTtlMs(value = env.sessionTtl) {
    const match = String(value ?? "2h").trim().match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) throw new Error("SESSION_TTL inválido");
    const factors = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return Number(match[1]) * factors[match[2]];
}

export function generateSessionToken() {
    return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(token) {
    return createHmac("sha256", env.sessionSecret)
        .update(String(token))
        .digest("hex");
}

export function getSessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: env.forceHttps,
        path: "/",
        maxAge: parseSessionTtlMs(),
    };
}

export async function createPersistentSession(user, { now = new Date() } = {}) {
    const token = generateSessionToken();
    await AuthSession.create({
        tokenHash: hashSessionToken(token),
        userId: user.id,
        expiresAt: new Date(now.getTime() + getSessionCookieOptions().maxAge),
        revokedAt: null,
        lastSeenAt: now,
        csrfHash: null,
    });
    return token;
}

export async function verifySessionToken(token, { now = new Date() } = {}) {
    if (!TOKEN_PATTERN.test(String(token ?? ""))) {
        throw new AppError(401, "Sessão inválida ou expirada");
    }
    const session = await AuthSession.findOneAndUpdate(
        {
            tokenHash: hashSessionToken(token),
            revokedAt: null,
            expiresAt: { $gt: now },
        },
        { $set: { lastSeenAt: now } },
        { new: true },
    ).lean();

    if (!session) throw new AppError(401, "Sessão inválida ou expirada");
    return { id: session.userId.toString(), sessionId: session._id.toString() };
}

export async function attachSessionCookie(res, user) {
    const token = await createPersistentSession(user);
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

export function clearSessionCookie(res) {
    const options = getSessionCookieOptions();
    delete options.maxAge;
    res.clearCookie(SESSION_COOKIE_NAME, options);
}

export async function revokeSessionToken(token, { now = new Date() } = {}) {
    if (!TOKEN_PATTERN.test(String(token ?? ""))) return false;
    const result = await AuthSession.updateOne(
        { tokenHash: hashSessionToken(token), revokedAt: null },
        { $set: { revokedAt: now } },
    );
    return result.modifiedCount > 0;
}

export async function revokeAllUserSessions(userId, { now = new Date() } = {}) {
    const result = await AuthSession.updateMany(
        { userId, revokedAt: null },
        { $set: { revokedAt: now } },
    );
    return result.modifiedCount;
}

export function hashCsrfToken(token, sessionId) {
    return createHmac("sha256", env.sessionSecret)
        .update("orelle-csrf-v1\0")
        .update(String(sessionId))
        .update("\0")
        .update(String(token))
        .digest("hex");
}

export async function issueCsrfTokenForSession(sessionId) {
    const csrfToken = randomBytes(32).toString("base64url");
    const result = await AuthSession.updateOne(
        { _id: sessionId, revokedAt: null, expiresAt: { $gt: new Date() } },
        { $set: { csrfHash: hashCsrfToken(csrfToken, sessionId) } },
    );
    if (result.matchedCount < 1) {
        throw new AppError(401, "Sessão inválida ou expirada");
    }
    return csrfToken;
}

export async function verifyCsrfTokenForSession(sessionId, csrfToken) {
    const session = await AuthSession.findOne({
        _id: sessionId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    }).select("+csrfHash");
    const storedHash = String(session?.csrfHash ?? "");
    const candidate = Buffer.from(hashCsrfToken(csrfToken, sessionId), "hex");
    const expected = CSRF_HASH_PATTERN.test(storedHash)
        ? Buffer.from(storedHash, "hex")
        : Buffer.alloc(candidate.length);
    const matches = timingSafeEqual(candidate, expected);
    if (!session || !TOKEN_PATTERN.test(String(csrfToken ?? "")) || !matches) {
        throw new AppError(403, "Token CSRF inválido");
    }
    return true;
}
```

5. Explicação do código: o token bruto existe apenas no browser e durante a emissão/verificação do pedido. A BD guarda o HMAC; TTL e filtro `revokedAt: null` falham fechados, e `lastSeenAt` é atualizado atomicamente. O monitor TTL limpa expirados de forma assíncrona, mas a query já os recusa no instante da expiração.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 8 - Criar ou editar `apps/api/src/middlewares/auth.middleware.js`

1. Objetivo simples do passo: implementar o ficheiro `apps/api/src/middlewares/auth.middleware.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/api/src/middlewares/auth.middleware.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `apps/api/src/middlewares/auth.middleware.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `apps/api/src/middlewares/auth.middleware.js`.

```js
import {
    SESSION_COOKIE_NAME,
    verifySessionToken,
} from "../services/session.service.js";
import { User } from "../models/user.model.js";
import { ensureUserCanAuthenticate } from "../services/auth.service.js";
import { requireCsrfForAuthenticatedMutation } from "./csrf.middleware.js";
import { AppError } from "./error.middleware.js";

/**
 * Bloqueia pedidos sem sessão válida.
 * Se passar, coloca o utilizador autenticado em req.user.
 */
export async function requireAuth(req, res, next) {
    const token = req.cookies?.[SESSION_COOKIE_NAME];

    if (!token) {
        return next(new AppError(401, "Autenticação obrigatória"));
    }

    try {
        const session = await verifySessionToken(token);
        const account = await User.findById(session.id).select(
            "email role isActive accountStatus",
        );
        ensureUserCanAuthenticate(account);
        req.user = { id: session.id, email: account.email, role: account.role };
        req.authSession = { id: session.sessionId };
        return requireCsrfForAuthenticatedMutation(req, res, next);
    } catch (err) {
        return next(err);
    }
}
```

Criar `apps/api/src/middlewares/csrf.middleware.js` com uma allowlist explícita partilhada com CORS. Métodos seguros (`GET`, `HEAD`, `OPTIONS`) passam sem prova; mutações autenticadas exigem ambos os sinais:

```js
import { verifyCsrfTokenForSession } from "../services/session.service.js";
import { AppError } from "./error.middleware.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function requireCsrfForAuthenticatedMutation(req, res, next) {
    if (SAFE_METHODS.has(req.method.toUpperCase())) return next();

    try {
        const origin = new URL(req.get("Origin")).origin;
        if (!req.app.locals.csrfAllowedOrigins.includes(origin)) {
            throw new AppError(403, "Origem do pedido não autorizada");
        }
        await verifyCsrfTokenForSession(
            req.authSession.id,
            req.get("X-CSRF-Token"),
        );
        return next();
    } catch (error) {
        return next(
            error instanceof AppError
                ? error
                : new AppError(403, "Origem do pedido não autorizada"),
        );
    }
}
```

5. Explicação do código: qualquer rota sensível usa a sessão persistida e revalida o estado/role atual da conta. Depois aplica a quota autenticada e, nas mutações, a proteção CSRF/origem. O `userId` nunca vem do body.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 9 - Criar ou editar `apps/api/src/services/auth.service.js`

1. Objetivo simples do passo: implementar o ficheiro `apps/api/src/services/auth.service.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/api/src/services/auth.service.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `apps/api/src/services/auth.service.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `apps/api/src/services/auth.service.js`. Manter `registerUser` e acrescentar `loginUser`.

```js
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { AppError } from "../middlewares/error.middleware.js";

function toSafeUser(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    };
}

export async function registerUser({ email, password }) {
    const existing = await User.findOne({ email }).select("_id");

    if (existing) {
        throw new AppError(409, "Já existe uma conta com este email");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, role: "cliente" });

    return toSafeUser(user);
}

export async function loginUser({ email, password }) {
    const user = await User.findOne({ email }).select(
        "+passwordHash email role createdAt",
    );

    if (!user) {
        throw new AppError(401, "Credenciais invalidas");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
        throw new AppError(401, "Credenciais invalidas");
    }

    return toSafeUser(user);
}
```

5. Explicação do código: o login procura o utilizador e compara a password enviada com o hash guardado. A mensagem de erro e igual para email inexistente e password errada para evitar enumeração de contas.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 10 - Criar ou editar `apps/api/src/controllers/auth.controller.js`

1. Objetivo simples do passo: implementar o ficheiro `apps/api/src/controllers/auth.controller.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/api/src/controllers/auth.controller.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `apps/api/src/controllers/auth.controller.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `apps/api/src/controllers/auth.controller.js` e substituir pelo ficheiro completo abaixo.

```js
import { loginUser, registerUser } from "../services/auth.service.js";
import {
    attachSessionCookie,
    clearSessionCookie,
    issueCsrfTokenForSession,
    revokeAllUserSessions,
    revokeSessionToken,
    SESSION_COOKIE_NAME,
} from "../services/session.service.js";
import {
    validateLoginInput,
    validateRegisterInput,
} from "../validators/auth.validator.js";

export async function registerController(req, res, next) {
    try {
        const input = validateRegisterInput(req.body);
        const user = await registerUser(input);

        return res.status(201).json({ user });
    } catch (err) {
        return next(err);
    }
}

export async function loginController(req, res, next) {
    try {
        const input = validateLoginInput(req.body);
        const user = await loginUser(input);

        await attachSessionCookie(res, user);

        return res.status(200).json({ user });
    } catch (err) {
        return next(err);
    }
}

export async function csrfController(req, res, next) {
    try {
        const csrfToken = await issueCsrfTokenForSession(req.authSession.id);
        res.set("Cache-Control", "no-store");
        return res.status(200).json({ csrfToken });
    } catch (error) {
        return next(error);
    }
}

export async function logoutController(req, res, next) {
    try {
        await revokeSessionToken(req.cookies?.[SESSION_COOKIE_NAME]);
        clearSessionCookie(res);
        return res.status(204).send();
    } catch (error) {
        return next(error);
    }
}

export async function logoutAllController(req, res, next) {
    try {
        await revokeAllUserSessions(req.user.id);
        clearSessionCookie(res);
        return res.status(204).send();
    } catch (error) {
        return next(error);
    }
}

export function meController(req, res) {
    return res.status(200).json({ user: req.user });
}
```

5. Explicação do código: o login só emite cookie depois de persistir a sessão. O endpoint CSRF roda a prova e devolve-a com `no-store`. Logout e logout-all revogam em MongoDB antes de limpar o cookie; `meController` devolve apenas o utilizador seguro.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 11 - Criar ou editar `apps/api/src/routes/auth.routes.js`

1. Objetivo simples do passo: implementar o ficheiro `apps/api/src/routes/auth.routes.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/api/src/routes/auth.routes.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `apps/api/src/routes/auth.routes.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `apps/api/src/routes/auth.routes.js` e substituir pelo ficheiro completo abaixo.

```js
import { Router } from "express";
import {
    loginController,
    csrfController,
    logoutAllController,
    logoutController,
    meController,
    registerController,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const authRoutes = Router();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);
authRoutes.get("/csrf", requireAuth, csrfController);
authRoutes.post("/logout", requireAuth, logoutController);
authRoutes.post("/logout-all", requireAuth, logoutAllController);
authRoutes.get("/me", requireAuth, meController);
```

5. Explicação do código: login e registo são públicos. CSRF, logout, logout-all e me exigem sessão ativa; a proteção de mutações é aplicada pelo fluxo comum de `requireAuth`.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 12 - Criar ou editar `apps/api/src/app.js`

1. Objetivo simples do passo: implementar o ficheiro `apps/api/src/app.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/api/src/app.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `apps/api/src/app.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `apps/api/src/app.js` e acrescentar `cookieParser()` antes das rotas.

```js
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export function createApp() {
    const app = express();

    app.locals.csrfAllowedOrigins = [new URL(env.clientOrigin).origin];
    app.use(cors({ origin: env.clientOrigin, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());

    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", app: "orelle" });
    });

    app.use("/api/auth", authRoutes);
    app.use(errorMiddleware);

    return app;
}
```

5. Explicação do código: sem `cookieParser`, `req.cookies` fica vazio e `requireAuth` não consegue ler `orelle_session`.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 13 - Criar ou editar `apps/web/src/services/apiClient.js`

1. Objetivo simples do passo: implementar o ficheiro `apps/web/src/services/apiClient.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/web/src/services/apiClient.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `apps/web/src/services/apiClient.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `apps/web/src/services/apiClient.js` para usar `/api` same-origin, `credentials: 'include'` e prova CSRF apenas em memória.

```js
const API_BASE_URL = "/api";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_EXEMPT_MUTATIONS = new Set(["/auth/login", "/auth/register"]);
let csrfTokenCache = null;

export function clearCsrfTokenCache() {
    csrfTokenCache = null;
}

async function getCsrfToken() {
    if (csrfTokenCache) return csrfTokenCache;
    const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Não foi possível obter proteção CSRF");
    const data = await response.json();
    csrfTokenCache = data.csrfToken;
    return csrfTokenCache;
}

export async function apiRequest(path, options = {}) {
    const method = String(options.method ?? "GET").toUpperCase();
    const headers = new Headers(options.headers ?? {});
    if (!SAFE_METHODS.has(method) && !CSRF_EXEMPT_MUTATIONS.has(path)) {
        headers.set("X-CSRF-Token", await getCsrfToken());
    }
    if (options.body !== undefined && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        headers,
    });

    if (response.status === 401) clearCsrfTokenCache();

    if (response.status === 204) {
        return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data?.error?.message ?? "Pedido falhou");
    }

    return data;
}
```

5. Explicação do código: `/api` não incorpora hosts locais no bundle. O browser envia o cookie sem o expor ao React; o token CSRF fica apenas em memória e acompanha as mutações autenticadas. Em `401`, o cliente comum deve limpar o cache CSRF e notificar o `AuthProvider`.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 14 - Criar ou editar `apps/web/src/context/AuthContext.jsx`

1. Objetivo simples do passo: implementar o ficheiro `apps/web/src/context/AuthContext.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/web/src/context/AuthContext.jsx` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `apps/web/src/context/AuthContext.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `apps/web/src/context/AuthContext.jsx`.

```jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    apiRequest,
    clearCsrfTokenCache,
} from "../services/apiClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRequest("/auth/me")
            .then((data) => setUser(data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    async function login(credentials) {
        clearCsrfTokenCache();
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });

        setUser(data.user);
        return data.user;
    }

    async function logout() {
        await apiRequest("/auth/logout", { method: "POST" });
        clearCsrfTokenCache();
        setUser(null);
    }

    async function logoutAll() {
        await apiRequest("/auth/logout-all", { method: "POST" });
        clearCsrfTokenCache();
        setUser(null);
    }

    const value = useMemo(
        () => ({ user, loading, login, logout, logoutAll }),
        [user, loading],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth deve ser usado dentro de AuthProvider");
    }

    return context;
}
```

5. Explicação do código: o contexto guarda o utilizador autenticado no frontend. O token continua no cookie `HttpOnly`; o React nunca le o token diretamente.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 15 - Criar ou editar `apps/web/src/pages/LoginPage.jsx`

1. Objetivo simples do passo: implementar o ficheiro `apps/web/src/pages/LoginPage.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/web/src/pages/LoginPage.jsx` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `apps/web/src/pages/LoginPage.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `apps/web/src/pages/LoginPage.jsx`.

```jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export function LoginPage() {
    const { login, logout, user } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function handleLogin(event) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const loggedUser = await login(form);
            setMessage(`Sessão iniciada como ${loggedUser.email}`);
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        await logout();
        setMessage("Sessão terminada");
    }

    return (
        <main>
            <h1>Login Orélle</h1>

            {user ? (
                <section>
                    <p>Autenticado como {user.email}</p>
                    <button type="button" onClick={handleLogout}>
                        Terminar sessão
                    </button>
                </section>
            ) : (
                <form onSubmit={handleLogin}>
                    <label>
                        Email
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={updateField}
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={updateField}
                            required
                        />
                    </label>

                    <button type="submit" disabled={loading}>
                        {loading ? "A entrar..." : "Entrar"}
                    </button>
                </form>
            )}

            {message && <p role="status">{message}</p>}
        </main>
    );
}
```

5. Explicação do código: esta página demonstra login, estado autenticado e logout. O cookie é invisível para JavaScript, mas o browser envia-o automaticamente.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 16 - Criar ou editar `apps/web/src/App.jsx`

1. Objetivo simples do passo: implementar o ficheiro `apps/web/src/App.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/web/src/App.jsx` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `apps/web/src/App.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `apps/web/src/App.jsx` para envolver a app em `AuthProvider`.

```jsx
import { AuthProvider } from "./context/AuthContext.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";

export function App() {
    return (
        <AuthProvider>
            <RegisterPage />
            <LoginPage />
        </AuthProvider>
    );
}
```

5. Explicação do código: nesta fase a UI pode mostrar registo e login na mesma página. Routing visual pode ser refinado mais tarde.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 17 - Validar payloads e respostas esperadas

1. Objetivo simples do passo: testar o contrato HTTP que a UI e os BKs seguintes vao usar.
2. Ficheiros envolvidos:
    - CRIAR: nenhum ficheiro novo.
    - EDITAR: nenhum ficheiro neste passo, salvo se a resposta real não bater com o contrato documentado.
    - LOCALIZAÇÃO: executar pedidos contra os endpoints implementados nos passos anteriores.
    - REVER: routes, controllers, validators e services deste BK.
3. O que fazer: usar os exemplos abaixo para confirmar pedidos válidos, respostas de sucesso e erros esperados.
4. Código completo, correto e integrado: os payloads abaixo fazem parte do contrato de API e devem bater com o código implementado.
5. Explicação didática e detalhada: payloads mostram ao aluno como o frontend comunica com o backend e que mensagens a app deve apresentar.
6. Como validar: executar os pedidos com cliente HTTP ou teste automatizado e comparar status code e JSON.
7. Erro comum ou cenário negativo: mudar nomes de campos no backend sem atualizar frontend e testes cria erros difíceis de diagnosticar.

Login válido:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "cliente@orelle.test",
  "password": "PalavraPasse12345"
}
```

Resposta `200` com header `Set-Cookie`:

```http
Set-Cookie: orelle_session=...; Path=/; HttpOnly; SameSite=Lax
```

```json
{
    "user": {
        "id": "66a000000000000000000001",
        "email": "cliente@orelle.test",
        "role": "cliente",
        "createdAt": "2026-05-29T10:00:00.000Z"
    }
}
```

Credenciais erradas `401`:

```json
{
    "error": {
        "message": "Credenciais invalidas"
    }
}
```

Sessão ausente em `/api/auth/me` `401`:

```json
{
    "error": {
        "message": "Autenticação obrigatória"
    }
}
```

Obter prova CSRF autenticada:

```http
GET /api/auth/csrf
Cookie: orelle_session=...
```

A resposta `200` inclui `{ "csrfToken": "..." }` e `Cache-Control: no-store`. O cliente guarda o valor apenas em memória.

Logout:

```http
POST /api/auth/logout
Cookie: orelle_session=...
Origin: https://origem-configurada.example
X-CSRF-Token: prova-ligada-a-esta-sessao
```

Resposta esperada: `204 No Content`, `revokedAt` preenchido e cookie limpo. `POST /api/auth/logout-all` usa os mesmos headers e revoga todas as sessões do titular.

### Passo 18 - Criar testes minimos

1. Objetivo simples do passo: provar que o comportamento principal e os cenários negativos funcionam antes de entregar o BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: ficheiro de teste indicado abaixo.
    - LOCALIZAÇÃO: pasta de testes do backend ou frontend indicada no próprio passo.
    - REVER: validators, services, controllers e rotas usados pelo teste.
3. O que fazer: criar o teste completo abaixo e correr a suite.
4. Código completo, correto e integrado: o teste abaixo deve acompanhar o código real, não ser apenas exemplo solto.
5. Explicação didática e detalhada: testes ajudam o aluno a perceber o que significa terminar um BK: não basta escrever código, é preciso provar o comportamento.
6. Como validar: correr o comando de testes documentado no BK e confirmar que os casos positivos e negativos passam.
7. Erro comum ou cenário negativo: testar apenas o caminho feliz deixa falhas de segurança e validação por descobrir.

Criar este ficheiro em `apps/api/tests/auth.session.test.js`.

```js
import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { AuthSession } from "../src/models/auth-session.model.js";
import { User } from "../src/models/user.model.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findOne: vi.fn(),
    },
}));
vi.mock("../src/models/auth-session.model.js", () => ({
    AuthSession: {
        create: vi.fn().mockResolvedValue({}),
    },
}));

describe("BK-MF0-02 / RF02 - sessão segura", () => {
    it("faz login e cria cookie HttpOnly", async () => {
        const passwordHash = await bcrypt.hash("PalavraPasse12345", 12);

        User.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({
                _id: { toString: () => "user-1" },
                email: "cliente@orelle.test",
                role: "cliente",
                passwordHash,
                createdAt: new Date("2026-05-29T10:00:00.000Z"),
            }),
        });

        const response = await request(createApp())
            .post("/api/auth/login")
            .send({ email: "cliente@orelle.test", password: "PalavraPasse12345" });

        expect(response.status).toBe(200);
        expect(response.headers["set-cookie"].join(";")).toContain("HttpOnly");
        expect(response.headers["set-cookie"].join(";")).toContain(
            "SameSite=Lax",
        );
        const persisted = AuthSession.create.mock.calls[0][0];
        expect(persisted.tokenHash).toMatch(/^[a-f0-9]{64}$/);
        expect(persisted).toEqual(
            expect.objectContaining({
                revokedAt: null,
                lastSeenAt: expect.any(Date),
                csrfHash: null,
            }),
        );
    });

    it("rejeita password errada sem criar cookie", async () => {
        const passwordHash = await bcrypt.hash("PalavraPasse12345", 12);

        User.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({
                _id: { toString: () => "user-1" },
                email: "cliente@orelle.test",
                role: "cliente",
                passwordHash,
            }),
        });

        const response = await request(createApp())
            .post("/api/auth/login")
            .send({ email: "cliente@orelle.test", password: "Errada123" });

        expect(response.status).toBe(401);
        expect(response.headers["set-cookie"]).toBeUndefined();
    });

    it("bloqueia /me sem cookie", async () => {
        const response = await request(createApp()).get("/api/auth/me");

        expect(response.status).toBe(401);
        expect(response.body.error.message).toBe("Autenticação obrigatória");
    });
});
```

5. Explicação do código: este ficheiro prova cookie `HttpOnly`, persistência por hash, erro genérico e bloqueio sem cookie. Acrescenta `opaque-session.service.test.js` para TTL/revogação/logout-all e `csrf-origin.test.js` para emissão `no-store`, hash CSRF, token ausente/cruzado e origem fora da allowlist.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 19 - Confirmar bloqueios e decisões antes do PR

1. Objetivo simples do passo: identificar decisões que não podem ser inventadas durante a implementação.
2. Ficheiros envolvidos:
    - CRIAR: nenhum ficheiro de aplicação.
    - EDITAR: apenas documentos canónicos se a decisão alterar contrato, scope ou política.
    - LOCALIZAÇÃO: rever os pontos abaixo antes de abrir PR.
    - REVER: README, RF, RNF, backlog, matriz e guias dependentes.
3. O que fazer: se algum bloqueio se aplicar, parar a implementação real e atualizar primeiro a fonte documental correta.
4. Código completo, correto e integrado: este passo não adiciona código; protege a coerência do código já escrito.
5. Explicação didática e detalhada: alunos não devem preencher lacunas com suposicoes, sobretudo quando há dados sensíveis, roles ou contratos usados por outros BKs.
6. Como validar: confirmar que não ficou nenhuma decisão implicita no código.
7. Erro comum ou cenário negativo: implementar uma regra por intuicao pode funcionar hoje, mas quebrar privacidade, segurança ou o handoff de fases seguintes.

Antes de deploy real, confirmar em `.env`:

```env
SESSION_SECRET=uma-string-longa-aleatoria
SESSION_TTL=2h
CLIENT_ORIGIN=http://localhost:5173
```

Se `SESSION_SECRET` não for definido no modo que o exige, a aplicação deve falhar ao arrancar. Isto impede calcular HMACs de sessão/CSRF com um pepper ausente ou fraco.

### Evidence para PR/defesa

- Screenshot ou output de DevTools mostrando `orelle_session` com `HttpOnly`.
- `POST /api/auth/login` válido com `200`.
- `POST /api/auth/login` inválido com `401` sem `Set-Cookie`.
- `GET /api/auth/me` sem cookie com `401`.
- `GET /api/auth/csrf` com `200`, `no-store` e hash persistido sem token bruto.
- Mutação sem prova, com prova cruzada ou origem não autorizada com `403`.
- `POST /api/auth/logout` com `204`, `revokedAt` e cookie limpo.
- `POST /api/auth/logout-all` com `204` e todas as sessões anteriores a devolver `401`.

### Handoff para BK-MF0-03

O próximo BK deve usar `requireAuth` em todas as rotas de perfil e deve ler o utilizador autenticado em `req.user.id`. Não deve aceitar `userId` vindo do body para criar perfil.

## Changelog

- `2026-04-14`: guia normalizado para contrato canónico comum.
- `2026-05-25`: guia refinado para implementação concreta de sessão segura.
- `2026-05-29`: tutorial linear integrado com cookie HttpOnly, JWT assinado, requireAuth, UI, payloads e testes negativos.
- `2026-05-29`: estrutura corrigida para tutorial linear integrado, com código, explicação, validação e negativo no passo onde são usados.
- `2026-05-29`: separado `validateLoginInput` de `validateRegisterInput` para manter login e registo coerentes.
- `2026-07-10` (estado corrente): revisão manual/Figma dispensada no alvo académico/local; RNF26 fica `ACEITE_RISCO`, sem alegar aprovação ou paridade.
- `2026-07-10`: paths pedagógicos normalizados para a estrutura pública `apps/api/` e `apps/web/`.
- `2026-07-10`: contrato ativo alinhado com sessões opacas persistidas, token de 256 bits, hash/TTL/revogação/atividade, logout-all, CSRF ligado à sessão e cliente `/api` same-origin; a entrada de 2026-05-29 permanece apenas como histórico substituído.
