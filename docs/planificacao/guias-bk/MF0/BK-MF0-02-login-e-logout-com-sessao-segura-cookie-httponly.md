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
- `last_updated`: `2026-05-25`

#### BK-MF0-02 - Login e logout com sessão segura (cookie HttpOnly)

##### O que vamos fazer neste BK

Neste BK vamos implementar autenticação com login, logout e leitura do utilizador autenticado. O login deve validar email/password contra o `User` criado em `BK-MF0-01` quando esse BK já existir, mas a dependência canónica permanece `-`, tal como está na matriz.

O contrato técnico proposto é `POST /api/auth/login`, `POST /api/auth/logout` e `GET /api/auth/me`. A sessão será guardada num cookie `HttpOnly`, para que JavaScript no browser não consiga ler diretamente o token de sessão.

Esta fase foi detalhada sem mockup de UI. A página de login deve ser simples, com feedback claro e sem definir design final de marca.

##### Porque e que isto e importante

- Permite proteger rotas futuras de perfil, preferências, produtos administrativos e uploads.
- Aplica `RF02` e antecipa `RNF14`, mantendo sessão fora de `localStorage`.
- Ensina o fluxo `request -> middleware -> controller -> service -> response`.
- Cria o middleware `requireAuth`, reutilizado por quase todos os BKs seguintes.

##### O que entra (scope)

- Login com email e password.
- Logout com limpeza do cookie.
- Endpoint `GET /api/auth/me`.
- Cookie `HttpOnly`, `SameSite` e `Secure` em produção.
- Middleware `requireAuth`.
- Página React de login e estado de autenticação básico.
- Testes negativos de credenciais, ausência de cookie e logout.

##### O que nao entra (scope-out)

- Recuperação de password.
- Refresh tokens complexos.
- OAuth, Google Login ou autenticação externa.
- Gestão avançada de roles, que fica para `BK-MF0-05`.
- Proteção CSRF completa; deixar nota para fase de hardening se a estratégia de cookies for mantida.

##### Como saber que isto ficou bem

- Login válido devolve `200` e define cookie `HttpOnly`.
- Login inválido devolve `401` sem criar cookie.
- `GET /api/auth/me` devolve o utilizador apenas com cookie válido.
- Logout limpa o cookie.
- O frontend não guarda token em `localStorage` nem em `sessionStorage`.

#### Metadados do BK (CANONICO/DERIVADO):

- Prioridade: `P0` (CANONICO)
- Estado: `TODO` (CANONICO)
- Esforco: `M` (CANONICO)
- macro: `MF0` (CANONICO)
- Owner: `Bruna` (CANONICO)
- Apoio: `Izelicks` (CANONICO)
- Dependencias (BK IDs): `-` (CANONICO)
- Pre-condicoes: backend criado ou preparado; utilizador de teste criado por registo ou seed local (DERIVADO)
- Ref. Plano: `RF02`, `Fase 1`, `S01-S02`, `Reforco` (CANONICO)
- Flow ID: `FLOW-AUTH-SESSION` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF02` (CANONICO)
- Fonte de verdade: `docs/RNF.md` -> `RNF14` como restrição transversal (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-02` (CANONICO)
- Descricao: Login e logout com sessão segura baseada em cookie `HttpOnly` (CANONICO)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: existe ou está planeado o modelo `User` com `email` e `passwordHash`.
- Estado esperado depois do BK: a app tem sessão autenticada, logout e middleware para proteger rotas.
- Ficheiros a criar: `server/src/services/session.service.js`, `server/src/middlewares/auth.middleware.js`, `client/src/pages/LoginPage.jsx`, `client/src/context/AuthContext.jsx`.
- Ficheiros a editar: `server/src/routes/auth.routes.js`, `server/src/controllers/auth.controller.js`, `server/src/services/auth.service.js`, `client/src/services/apiClient.js`, `client/src/App.jsx`.
- Dependencias de BK anteriores: dependência canónica `-`; reutilização técnica do `User` de `BK-MF0-01` se já estiver implementado.
- Impacto na arquitetura: introduz autenticação transversal e middleware reutilizável.
- Impacto em frontend: cria estado autenticado e formulário de login.
- Impacto em backend: adiciona criação/validação de token ou sessão e leitura segura via cookie.
- Impacto em dados: não deve guardar token em texto claro na BD; se forem usadas sessões persistidas, guardar apenas identificadores/expiração.
- Impacto em segurança: cookie `HttpOnly`, `sameSite: 'lax'`, `secure` em produção e segredo fora do código.
- Impacto em testes: testar login válido, login inválido, rota protegida sem cookie e logout.
- Handoff para o próximo BK: `BK-MF0-03` deve usar `requireAuth` para criar perfil apenas do utilizador autenticado.

#### Pre-leitura minima (10-15 min) (DERIVADO):

- `docs/RF.md`: `RF02`.
- `docs/RNF.md`: `RNF14`, `RNF10`, `RNF19`.
- `docs/planificacao/backlogs/BACKLOG-MVP.md`: linha `BK-MF0-02`.
- Guia `BK-MF0-01`, se já tiver sido executado, para confirmar `User.passwordHash`.
- Mockup: não existe nesta execução; usar layout simples.

#### Glossario (rapido) (DERIVADO):

- `Sessão`: prova temporária de que o utilizador já fez login.
- `Cookie HttpOnly`: cookie inacessível por JavaScript no browser.
- `SameSite`: política que reduz envio de cookies em navegações de outros sites.
- `JWT`: token assinado; usar apenas se a equipa escolher este formato.
- `Token opaco`: identificador sem dados internos; alternativa a JWT.
- `Middleware`: função que corre antes do controller.
- `requireAuth`: middleware que bloqueia pedidos sem sessão válida.
- `401`: erro para utilizador não autenticado.
- `403`: erro para utilizador autenticado mas sem permissão.

#### Conceitos teoricos essenciais (DERIVADO):

Um cookie `HttpOnly` é mais seguro do que guardar tokens no `localStorage` porque não pode ser lido diretamente por scripts no frontend. Isto reduz o impacto de ataques XSS, embora não dispense validação, escape de conteúdo e boas práticas de frontend.

O login não compara a password recebida com uma password guardada. Compara a password recebida com o `passwordHash` usando `bcrypt.compare`. Se a comparação passar, o servidor emite uma sessão.

O middleware `requireAuth` é uma peça de arquitetura. Ele lê o cookie, valida a sessão e coloca o utilizador em `req.user`. Assim, controllers futuros não precisam repetir lógica de autenticação.

Assunção técnica: para alunos de 12.º ano, pode usar-se JWT assinado em cookie `HttpOnly` por simplicidade. Se o orientador preferir sessões opacas guardadas no servidor, marcar como alteração técnica antes de implementar.

#### Guia de execucao (passo-a-passo) (DERIVADO):

0. **Objetivo (~15 min): confirmar estratégia de sessão**
   - Descricao detalhada do objetivo: decidir se a equipa usará JWT assinado em cookie ou sessão opaca.
   - Justificacao: mudar estratégia a meio quebra login, guards e testes.
   - Como fazer (0.1): registar a decisão no PR como `Assuncao tecnica`.
   - Como fazer (0.2): guardar `SESSION_SECRET` ou `JWT_SECRET` em `.env`, nunca no código.
   - Ficheiro a rever: `docs/RNF.md`.
   - Ficheiro alvo: `server/src/config/env.js`.
   - Snippet de referencia: `sessionSecret: process.env.SESSION_SECRET`.
   - O que verificar: app falha com erro claro se faltar segredo em ambiente real.

1. **Objetivo (~25 min): criar validação de login**
   - Descricao detalhada do objetivo: validar email e password antes do service.
   - Justificacao: evita chamadas desnecessárias à BD e respostas inconsistentes.
   - Como fazer (1.1): criar `validateLoginInput`.
   - Como fazer (1.2): devolver erro genérico quando credenciais estiverem erradas.
   - Ficheiro a rever: `server/src/validators/auth.validator.js`.
   - Ficheiro alvo: `server/src/validators/auth.validator.js`.
   - Snippet de referencia: `if (!email || !password) errors.credentials = 'Credenciais inválidas';`.
   - O que verificar: dados vazios devolvem `400`.

2. **Objetivo (~35 min): implementar service de login**
   - Descricao detalhada do objetivo: procurar utilizador por email e comparar password com `bcrypt`.
   - Justificacao: a regra de autenticação fica testável e separada do HTTP.
   - Como fazer (2.1): procurar `User.findOne({ email })`.
   - Como fazer (2.2): usar `await bcrypt.compare(password, user.passwordHash)`.
   - Ficheiro a rever: `server/src/models/user.model.js`.
   - Ficheiro alvo: `server/src/services/auth.service.js`.
   - Snippet de referencia: `const ok = await bcrypt.compare(password, user.passwordHash);`.
   - O que verificar: password errada não revela se o email existe.

3. **Objetivo (~30 min): criar emissão de cookie**
   - Descricao detalhada do objetivo: criar função que define cookie seguro no controller.
   - Justificacao: centralizar opções evita cookies diferentes entre endpoints.
   - Como fazer (3.1): criar `setAuthCookie(res, token)`.
   - Como fazer (3.2): usar `httpOnly: true`, `sameSite: 'lax'`, `secure: env.isProduction`.
   - Ficheiro a rever: `docs/RNF.md`.
   - Ficheiro alvo: `server/src/services/session.service.js`.
   - Snippet de referencia: `res.cookie('orelle_session', token, cookieOptions);`.
   - O que verificar: DevTools mostra cookie como `HttpOnly`.

4. **Objetivo (~30 min): criar login, logout e me**
   - Descricao detalhada do objetivo: expor endpoints de sessão.
   - Justificacao: frontend e BKs seguintes precisam de saber quem está autenticado.
   - Como fazer (4.1): adicionar `POST /login`, `POST /logout`, `GET /me`.
   - Como fazer (4.2): no logout, limpar cookie com as mesmas opções de path.
   - Ficheiro a rever: `server/src/routes/auth.routes.js`.
   - Ficheiro alvo: `server/src/controllers/auth.controller.js`.
   - Snippet de referencia: `res.clearCookie('orelle_session', cookieOptions);`.
   - O que verificar: logout remove acesso ao `/me`.

5. **Objetivo (~35 min): criar requireAuth**
   - Descricao detalhada do objetivo: bloquear rotas sem sessão válida.
   - Justificacao: perfil, preferências e admin dependem deste middleware.
   - Como fazer (5.1): ler cookie do pedido.
   - Como fazer (5.2): validar sessão e anexar `{ id, email, role }` a `req.user`.
   - Ficheiro a rever: `server/src/services/session.service.js`.
   - Ficheiro alvo: `server/src/middlewares/auth.middleware.js`.
   - Snippet de referencia: `req.user = sessionUser; return next();`.
   - O que verificar: sem cookie devolve `401`.

6. **Objetivo (~45 min): criar UI de login**
   - Descricao detalhada do objetivo: permitir login sem guardar token no browser.
   - Justificacao: cookies HttpOnly são enviados pelo browser automaticamente.
   - Como fazer (6.1): configurar `apiClient` com `credentials: 'include'`.
   - Como fazer (6.2): criar `LoginPage` com estados loading/error/success.
   - Ficheiro a rever: `client/src/services/apiClient.js`.
   - Ficheiro alvo: `client/src/pages/LoginPage.jsx`.
   - Snippet de referencia: `fetch(url, { credentials: 'include', ...options })`.
   - O que verificar: `localStorage` não contém tokens.

7. **Objetivo (~45 min): validar sessão e preparar handoff**
   - Descricao detalhada do objetivo: testar login, logout, `/me` e rota protegida.
   - Justificacao: bugs de auth bloqueiam todos os BKs seguintes.
   - Como fazer (7.1): criar smoke com utilizador válido.
   - Como fazer (7.2): Executar cenarios negativos obrigatorios (minimo 3) e registar resultados.
   - Ficheiro a rever: `docs/planificacao/sprints/PLANO-SPRINTS.md`.
   - Ficheiro alvo: `server/tests/auth.session.test.js`.
   - Snippet de referencia: `expect(response.headers['set-cookie']).toContain('HttpOnly');`.
   - O que verificar: evidência mostra cookie `HttpOnly` e logout efetivo.

#### Checklist de validacao (DERIVADO):

- Smoke: login válido devolve `200`, cria cookie e `/api/auth/me` devolve utilizador seguro.
- Negativo 1: passo 2; password errada; resultado esperado `401` sem cookie; risco que cobre: autenticação indevida.
- Negativo 2: passo 5; chamada a `/me` sem cookie; resultado esperado `401`; risco que cobre: acesso anónimo.
- Negativo 3: passo 6; verificar `localStorage`; resultado esperado sem token; risco que cobre: roubo de sessão por XSS.
- Tecnico: `requireAuth` existe e é reutilizável.
- Regressao das fases anteriores: confirmar que registo de `BK-MF0-01` continua a criar utilizador.
- UI/mockup: sem mockup; página baseline com feedback claro.
- Seguranca: cookie `HttpOnly`; segredo em `.env`; mensagem de erro de credenciais não enumera emails.

#### Criterios de aceite:

- Outputs: endpoints `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` e middleware `requireAuth`.
- Verificacoes: cookie `HttpOnly` criado no login e limpo no logout.
- Qualidade: não há tokens em `localStorage`/`sessionStorage`.
- Continuidade: `BK-MF0-03`, `BK-MF0-04`, `BK-MF0-06` e `BK-MF0-07` podem proteger rotas.
- Evidencia: output de testes/curl com headers `Set-Cookie` e teste negativo de cookie ausente.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher apos validacao`
- `neg`: `A preencher apos testes negativos`
- `files`: `server/src/middlewares/auth.middleware.js`, `server/src/services/session.service.js`, `client/src/pages/LoginPage.jsx`
- `commands`: `curl -i -X POST /api/auth/login`, `curl -i /api/auth/me`
- `screenshots`: login com erro e login com sucesso
- `notes`: confirmar estratégia JWT ou sessão opaca escolhida pela equipa

#### TODOs

- TODO: confirmar com orientador se a estratégia final será JWT em cookie ou sessão opaca.
- TODO (BLOCKER): definir segredo de sessão em ambiente local.
- FOLLOW-UP: adicionar proteção CSRF quando houver formulários sensíveis com cookies.
- Assuncao a validar: usar cookie `orelle_session` com `SameSite=Lax`.

## Contexto do BK
- Entrega alvo: implementar `Login e logout com sessão segura (cookie HttpOnly)` com rastreabilidade direta ao requisito `RF02`.
- Foco tecnico da macro: `Fundamentos e governance`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Implementar sessão segura para que os próximos BKs consigam saber quem está autenticado.

### Pre-requisitos
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
- Dependencias: `-`
- Artefactos: `RF.md`, `RNF.md`, `BACKLOG-MVP.md`, `MATRIZ-CANONICA-BK.md`

### Passos
1. Confirmar estratégia de sessão.
2. Validar input de login.
3. Comparar password com `bcrypt.compare`.
4. Emitir cookie `HttpOnly`.
5. Criar logout e `/me`.
6. Criar middleware `requireAuth`.
7. Criar UI de login sem guardar token.
8. Executar cenarios negativos obrigatorios (minimo 3) e registar evidência.

### Cenarios negativos recomendados
- Credenciais erradas devem devolver `401`.
- `/api/auth/me` sem cookie deve devolver `401`.
- Logout deve invalidar acesso posterior a `/api/auth/me`.

### Validacao
- [ ] Smoke: login válido cria cookie.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: cookie é `HttpOnly`.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF0-03`
- O próximo BK deve proteger criação de perfil com `requireAuth`.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF0-02';
const REQ_ID = 'RF02';
const MIN_NEGATIVOS = 3;

export function validarEvidenceBkMf002({ smokeOk, negativos, setCookieHeader, localStorageHasToken }) {
  if (!smokeOk) throw new Error(`${BK_ID}/${REQ_ID}: smoke de sessão falhou`);
  if (negativos < 3) throw new Error(`${BK_ID}/${REQ_ID}: negativos insuficientes`);
  if (!String(setCookieHeader).includes('HttpOnly')) {
    throw new Error(`${BK_ID}/${REQ_ID}: cookie sem HttpOnly`);
  }
  if (localStorageHasToken) throw new Error(`${BK_ID}/${REQ_ID}: token exposto no browser`);
  return { bkId: BK_ID, reqId: REQ_ID, minNegativos: MIN_NEGATIVOS, status: 'OK' };
}
```

## Criterios de aceite
- Entrega funcional especifica de `Login e logout com sessão segura (cookie HttpOnly)` validada contra `RF02`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: `A preencher no fecho do BK`
- `proof_tecnico`: `A preencher apos validacao`
- `proof_negativos`: `A preencher apos testes negativos`
- `proof_negocio`: sessão desbloqueia perfil, preferências, admin e fluxos personalizados.

## Proximo BK recomendado
`BK-MF0-03`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum.
- `2026-05-25`: guia refinado para implementação concreta de sessão segura.
