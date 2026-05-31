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
- `last_updated`: `2026-05-29`

#### BK-MF0-02 - Login e logout com sessão segura (cookie HttpOnly)

##### O que vamos fazer neste BK

Neste BK vamos implementar autenticação com login, logout e leitura do utilizador autenticado. O login deve validar email/password contra o `User` criado em `BK-MF0-01` quando esse BK já existir, mas a dependência canónica permanece `-`, tal como está na matriz.

O contrato técnico proposto é `POST /api/auth/login`, `POST /api/auth/logout` e `GET /api/auth/me`. A sessão será guardada num cookie `HttpOnly`, para que JavaScript no browser não consiga ler diretamente o token de sessão.

Esta fase foi detalhada sem mockup de UI. A página de login deve ser simples, com feedback claro e sem definir design final de marca.

##### Porque é que isto é importante

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

##### O que não entra (scope-out)

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
- Ficheiros a criar: `server/src/services/session.service.js`, `server/src/middlewares/auth.middleware.js`, `client/src/pages/LoginPage.jsx`, `client/src/context/AuthContext.jsx`.
- Ficheiros a editar: `server/src/routes/auth.routes.js`, `server/src/controllers/auth.controller.js`, `server/src/services/auth.service.js`, `client/src/services/apiClient.js`, `client/src/App.jsx`.
- Dependências de BK anteriores: dependência canónica `-`; reutilização técnica do `User` de `BK-MF0-01` se já estiver implementado.
- Impacto na arquitetura: introduz autenticação transversal e middleware reutilizável.
- Impacto em frontend: cria estado autenticado e formulário de login.
- Impacto em backend: adiciona criação/validação de token ou sessão e leitura segura via cookie.
- Impacto em dados: não deve guardar token em texto claro na BD; se forem usadas sessões persistidas, guardar apenas identificadores/expiração.
- Impacto em segurança: cookie `HttpOnly`, `sameSite: 'lax'`, `secure` em produção e segredo fora do código.
- Impacto em testes: testar login válido, login inválido, rota protegida sem cookie e logout.
- Handoff para o próximo BK: `BK-MF0-03` deve usar `requireAuth` para criar perfil apenas do utilizador autenticado.

#### Pre-leitura mínima (10-15 min) (DERIVADO):

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

O middleware `requireAuth` é uma peça de arquitetura. Ele lê o cookie, válida a sessão e coloca o utilizador em `req.user`. Assim, controllers futuros não precisam repetir lógica de autenticação.

Assunção técnica: para alunos de 12.º ano, pode usar-se JWT assinado em cookie `HttpOnly` por simplicidade. Se o orientador preferir sessões opacas guardadas no servidor, marcar como alteração técnica antes de implementar.

#### Guia de execução (passo-a-passo) (DERIVADO):

0. **Objetivo (~15 min): confirmar estratégia de sessão**
    - Descrição detalhada do objetivo: decidir se a equipa usará JWT assinado em cookie ou sessão opaca.
    - Justificação: mudar estratégia a meio quebra login, guards e testes.
    - Como fazer (0.1): registar a decisão no PR como `Assuncao tecnica`.
    - Como fazer (0.2): guardar `SESSION_SECRET` ou `JWT_SECRET` em `.env`, nunca no código.
    - Ficheiro a rever: `docs/RNF.md`.
    - Ficheiro alvo: `server/src/config/env.js`.
    - Snippet de referência: `sessionSecret: process.env.SESSION_SECRET`.
    - O que verificar: app falha com erro claro se faltar segredo em ambiente real.

1. **Objetivo (~25 min): criar validação de login**
    - Descrição detalhada do objetivo: validar email e password antes do service.
    - Justificação: evita chamadas desnecessárias à BD e respostas inconsistentes.
    - Como fazer (1.1): criar `validateLoginInput`.
    - Como fazer (1.2): devolver erro genérico quando credenciais estiverem erradas.
    - Ficheiro a rever: `server/src/validators/auth.validator.js`.
    - Ficheiro alvo: `server/src/validators/auth.validator.js`.
    - Snippet de referência: `if (!email || !password) errors.credentials = 'Credenciais inválidas';`.
    - O que verificar: dados vazios devolvem `400`.

2. **Objetivo (~35 min): implementar service de login**
    - Descrição detalhada do objetivo: procurar utilizador por email e comparar password com `bcrypt`.
    - Justificação: a regra de autenticação fica testável e separada do HTTP.
    - Como fazer (2.1): procurar `User.findOne({ email })`.
    - Como fazer (2.2): usar `await bcrypt.compare(password, user.passwordHash)`.
    - Ficheiro a rever: `server/src/models/user.model.js`.
    - Ficheiro alvo: `server/src/services/auth.service.js`.
    - Snippet de referência: `const ok = await bcrypt.compare(password, user.passwordHash);`.
    - O que verificar: password errada não revela se o email existe.

3. **Objetivo (~30 min): criar emissão de cookie**
    - Descrição detalhada do objetivo: criar função que define cookie seguro no controller.
    - Justificação: centralizar opções evita cookies diferentes entre endpoints.
    - Como fazer (3.1): criar `setAuthCookie(res, token)`.
    - Como fazer (3.2): usar `httpOnly: true`, `sameSite: 'lax'`, `secure: env.isProduction`.
    - Ficheiro a rever: `docs/RNF.md`.
    - Ficheiro alvo: `server/src/services/session.service.js`.
    - Snippet de referência: `res.cookie('orelle_session', token, cookieOptions);`.
    - O que verificar: DevTools mostra cookie como `HttpOnly`.

4. **Objetivo (~30 min): criar login, logout e me**
    - Descrição detalhada do objetivo: expor endpoints de sessão.
    - Justificação: frontend e BKs seguintes precisam de saber quem está autenticado.
    - Como fazer (4.1): adicionar `POST /login`, `POST /logout`, `GET /me`.
    - Como fazer (4.2): no logout, limpar cookie com as mesmas opções de path.
    - Ficheiro a rever: `server/src/routes/auth.routes.js`.
    - Ficheiro alvo: `server/src/controllers/auth.controller.js`.
    - Snippet de referência: `res.clearCookie('orelle_session', cookieOptions);`.
    - O que verificar: logout remove acesso ao `/me`.

5. **Objetivo (~35 min): criar requireAuth**
    - Descrição detalhada do objetivo: bloquear rotas sem sessão válida.
    - Justificação: perfil, preferências e admin dependem deste middleware.
    - Como fazer (5.1): ler cookie do pedido.
    - Como fazer (5.2): validar sessão e anexar `{ id, email, role }` a `req.user`.
    - Ficheiro a rever: `server/src/services/session.service.js`.
    - Ficheiro alvo: `server/src/middlewares/auth.middleware.js`.
    - Snippet de referência: `req.user = sessionUser; return next();`.
    - O que verificar: sem cookie devolve `401`.

6. **Objetivo (~45 min): criar UI de login**
    - Descrição detalhada do objetivo: permitir login sem guardar token no browser.
    - Justificação: cookies HttpOnly são enviados pelo browser automaticamente.
    - Como fazer (6.1): configurar `apiClient` com `credentials: 'include'`.
    - Como fazer (6.2): criar `LoginPage` com estados loading/error/success.
    - Ficheiro a rever: `client/src/services/apiClient.js`.
    - Ficheiro alvo: `client/src/pages/LoginPage.jsx`.
    - Snippet de referência: `fetch(url, { credentials: 'include', ...options })`.
    - O que verificar: `localStorage` não contém tokens.

7. **Objetivo (~45 min): validar sessão e preparar handoff**
    - Descrição detalhada do objetivo: testar login, logout, `/me` e rota protegida.
    - Justificação: bugs de auth bloqueiam todos os BKs seguintes.
    - Como fazer (7.1): criar smoke com utilizador válido.
    - Como fazer (7.2): Executar cenários negativos obrigatórios (mínimo 3) e registar resultados.
    - Ficheiro a rever: `docs/planificacao/sprints/PLANO-SPRINTS.md`.
    - Ficheiro alvo: `server/tests/auth.session.test.js`.
    - Snippet de referência: `expect(response.headers['set-cookie']).toContain('HttpOnly');`.
    - O que verificar: evidência mostra cookie `HttpOnly` e logout efetivo.

#### Checklist de validação (DERIVADO):

- Smoke: login válido devolve `200`, cria cookie e `/api/auth/me` devolve utilizador seguro.
- Negativo 1: passo 2; password errada; resultado esperado `401` sem cookie; risco que cobre: autenticação indevida.
- Negativo 2: passo 5; chamada a `/me` sem cookie; resultado esperado `401`; risco que cobre: acesso anónimo.
- Negativo 3: passo 6; verificar `localStorage`; resultado esperado sem token; risco que cobre: roubo de sessão por XSS.
- Técnico: `requireAuth` existe e é reutilizável.
- Regressão das fases anteriores: confirmar que registo de `BK-MF0-01` continua a criar utilizador.
- UI/mockup: sem mockup; página baseline com feedback claro.
- Segurança: cookie `HttpOnly`; segredo em `.env`; mensagem de erro de credenciais não enumera emails.

#### Critérios de aceite:

- Outputs: endpoints `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` e middleware `requireAuth`.
- Verificações: cookie `HttpOnly` criado no login e limpo no logout.
- Qualidade: não há tokens em `localStorage`/`sessionStorage`.
- Continuidade: `BK-MF0-03`, `BK-MF0-04`, `BK-MF0-06` e `BK-MF0-07` podem proteger rotas.
- Evidência: output de testes/curl com headers `Set-Cookie` e teste negativo de cookie ausente.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher após validação`
- `neg`: `A preencher após testes negativos`
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

1. Confirmar estratégia de sessão.
2. Validar input de login.
3. Comparar password com `bcrypt.compare`.
4. Emitir cookie `HttpOnly`.
5. Criar logout e `/me`.
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
Este BK usa JWT assinado guardado em cookie `HttpOnly` chamado `orelle_session`. Esta escolha e pedagógica e simples para o 12.º ano. Em produção real, a equipa pode trocar por sessões opacas guardadas no servidor, mas essa mudanca deve ser documentada antes de implementar.

**Scope-in deste passo:**

- Acrescentar dependências de sessão ao backend.
- Implementar `POST /api/auth/login`.
- Implementar `POST /api/auth/logout`.
- Implementar `GET /api/auth/me`.
- Criar `requireAuth` para proteger BKs seguintes.
- Configurar cookie `HttpOnly`, `SameSite=Lax` e `Secure` apenas fora de desenvolvimento.
- Garantir que credenciais inválidas não revelam se o email existe.

**Scope-out deste passo:**

- Recuperacao de password.
- Refresh tokens.
- OAuth/Google login.
- Gestao avancada de roles, que fica para `BK-MF0-05`.
- CSRF completo; fica como reforco de hardening, mas o guia já usa `SameSite=Lax`.

### Passo 2 - Mapear ficheiros antes de codificar

1. Objetivo simples do passo: identificar todos os ficheiros antes de escrever código, para evitar duplicados, imports partidos e contratos divergentes entre BKs.
2. Ficheiros envolvidos:
    - EDITAR:
        - `server/package.json`
        - `server/src/config/env.js`
        - `server/src/app.js`
        - `server/src/services/auth.service.js`
        - `server/src/controllers/auth.controller.js`
        - `server/src/routes/auth.routes.js`
        - `client/src/services/apiClient.js`
        - `client/src/App.jsx`

    - CRIAR:
        - `server/src/services/session.service.js`
        - `server/src/middlewares/auth.middleware.js`
        - `server/tests/auth.session.test.js`
        - `client/src/context/AuthContext.jsx`
        - `client/src/pages/LoginPage.jsx`

    - REVER:
        - `server/src/models/user.model.js`, criado no `BK-MF0-01`.
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

### Passo 4 - Criar ou editar `server/package.json`

1. Objetivo simples do passo: implementar o ficheiro `server/package.json` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/package.json` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/package.json`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `server/package.json` e substituir pelo ficheiro completo abaixo, mantendo scripts e dependências do `BK-MF0-01` e acrescentando `cookie-parser` e `jsonwebtoken`.

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
        "jsonwebtoken": "^9.0.2",
        "mongoose": "^8.5.1"
    },
    "devDependencies": {
        "supertest": "^7.0.0",
        "vitest": "^2.0.5"
    }
}
```

5. Explicação do código: este ficheiro continua a ser o manifesto completo do backend. `cookie-parser` deixa o Express ler cookies e `jsonwebtoken` cria/valida o token assinado que fica dentro do cookie, sem remover as dependências necessárias para registo, MongoDB e testes.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 5 - Criar ou editar `server/src/config/env.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/config/env.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/config/env.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/config/env.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `server/src/config/env.js` e acrescentar `sessionSecret` e `sessionTtl`.

```js
import "dotenv/config";

export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3001),
    mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/orelle",
    clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    sessionSecret: process.env.SESSION_SECRET ?? "dev-only-change-me",
    sessionTtl: process.env.SESSION_TTL ?? "2h",
};

if (
    env.nodeEnv === "production" &&
    env.sessionSecret === "dev-only-change-me"
) {
    throw new Error("SESSION_SECRET obrigatorio em producao");
}
```

5. Explicação do código: o segredo assina a sessão. Em desenvolvimento existe um valor temporario; em produção, a app deve falhar se o segredo não estiver definido.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 6 - Criar ou editar `server/src/validators/auth.validator.js`

1. Objetivo simples do passo: separar a validação de registo da validação de login, mantendo mensagens claras e sem revelar se a conta existe.
2. Ficheiros envolvidos:
    - EDITAR: `server/src/validators/auth.validator.js`.
    - LOCALIZAÇÃO: substituir o ficheiro criado no `BK-MF0-01` pela versao completa abaixo.
    - REVER: `server/src/controllers/auth.controller.js` e `server/src/services/auth.service.js`, porque ambos usam estes validators.
3. O que fazer: manter `validateRegisterInput` para registo e acrescentar `validateLoginInput` para login.
4. Código completo, correto e integrado:

Editar `server/src/validators/auth.validator.js` e substituir pelo ficheiro completo abaixo.

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

### Passo 7 - Criar ou editar `server/src/services/session.service.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/services/session.service.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/services/session.service.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/services/session.service.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/services/session.service.js`.

```js
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";

export const SESSION_COOKIE_NAME = "orelle_session";

export function getSessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: env.nodeEnv === "production",
        path: "/",
        maxAge: 1000 * 60 * 60 * 2,
    };
}

export function createSessionToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role,
        },
        env.sessionSecret,
        { expiresIn: env.sessionTtl },
    );
}

export function verifySessionToken(token) {
    try {
        const payload = jwt.verify(token, env.sessionSecret);

        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    } catch {
        throw new AppError(401, "Sessão inválida ou expirada");
    }
}

export function attachSessionCookie(res, user) {
    const token = createSessionToken(user);
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

export function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());
}
```

5. Explicação do código: este ficheiro concentra tudo o que sabe sobre cookies e tokens. Assim login, logout e `requireAuth` usam as mesmas regras.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 8 - Criar ou editar `server/src/middlewares/auth.middleware.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/middlewares/auth.middleware.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/middlewares/auth.middleware.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/middlewares/auth.middleware.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/middlewares/auth.middleware.js`.

```js
import {
    SESSION_COOKIE_NAME,
    verifySessionToken,
} from "../services/session.service.js";
import { AppError } from "./error.middleware.js";

/**
 * Bloqueia pedidos sem sessão válida.
 * Se passar, coloca o utilizador autenticado em req.user.
 */
export function requireAuth(req, res, next) {
    const token = req.cookies?.[SESSION_COOKIE_NAME];

    if (!token) {
        return next(new AppError(401, "Autenticação obrigatória"));
    }

    try {
        req.user = verifySessionToken(token);
        return next();
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código: qualquer rota sensível pode usar `requireAuth`. Se não houver cookie, responde `401`; se houver cookie válido, a rota sabe quem e o utilizador.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 9 - Criar ou editar `server/src/services/auth.service.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/services/auth.service.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/services/auth.service.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/services/auth.service.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `server/src/services/auth.service.js`. Manter `registerUser` e acrescentar `loginUser`.

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

### Passo 10 - Criar ou editar `server/src/controllers/auth.controller.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/controllers/auth.controller.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/controllers/auth.controller.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/controllers/auth.controller.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `server/src/controllers/auth.controller.js` e substituir pelo ficheiro completo abaixo.

```js
import { loginUser, registerUser } from "../services/auth.service.js";
import {
    attachSessionCookie,
    clearSessionCookie,
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

        attachSessionCookie(res, user);

        return res.status(200).json({ user });
    } catch (err) {
        return next(err);
    }
}

export function logoutController(req, res) {
    clearSessionCookie(res);
    return res.status(204).send();
}

export function meController(req, res) {
    return res.status(200).json({ user: req.user });
}
```

5. Explicação do código: `loginController` cria o cookie; `logoutController` remove o cookie; `meController` devolve o utilizador que `requireAuth` colocou em `req.user`.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 11 - Criar ou editar `server/src/routes/auth.routes.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/routes/auth.routes.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/routes/auth.routes.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/routes/auth.routes.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `server/src/routes/auth.routes.js` e substituir pelo ficheiro completo abaixo.

```js
import { Router } from "express";
import {
    loginController,
    logoutController,
    meController,
    registerController,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const authRoutes = Router();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);
authRoutes.post("/logout", logoutController);
authRoutes.get("/me", requireAuth, meController);
```

5. Explicação do código: `/me` é protegido. Login e registo não precisam de sessão previa; logout pode ser chamado mesmo que o cookie já tenha expirado.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 12 - Criar ou editar `server/src/app.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/app.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/app.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/app.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `server/src/app.js` e acrescentar `cookieParser()` antes das rotas.

```js
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export function createApp() {
    const app = express();

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

### Passo 13 - Criar ou editar `client/src/services/apiClient.js`

1. Objetivo simples do passo: implementar o ficheiro `client/src/services/apiClient.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/services/apiClient.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `client/src/services/apiClient.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `client/src/services/apiClient.js` e garantir `credentials: 'include'`.

```js
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
        ...options,
    });

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

5. Explicação do código: `credentials: 'include'` permite que o browser envie e receba cookies da API. Sem isto, o cookie `HttpOnly` pode ser criado mas não circular corretamente entre frontend e backend.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 14 - Criar ou editar `client/src/context/AuthContext.jsx`

1. Objetivo simples do passo: implementar o ficheiro `client/src/context/AuthContext.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/context/AuthContext.jsx` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `client/src/context/AuthContext.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `client/src/context/AuthContext.jsx`.

```jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

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
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });

        setUser(data.user);
        return data.user;
    }

    async function logout() {
        await apiRequest("/auth/logout", { method: "POST" });
        setUser(null);
    }

    const value = useMemo(
        () => ({ user, loading, login, logout }),
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

### Passo 15 - Criar ou editar `client/src/pages/LoginPage.jsx`

1. Objetivo simples do passo: implementar o ficheiro `client/src/pages/LoginPage.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/pages/LoginPage.jsx` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `client/src/pages/LoginPage.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `client/src/pages/LoginPage.jsx`.

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

### Passo 16 - Criar ou editar `client/src/App.jsx`

1. Objetivo simples do passo: implementar o ficheiro `client/src/App.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/App.jsx` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `client/src/App.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `client/src/App.jsx` para envolver a app em `AuthProvider`.

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

Logout:

```http
POST /api/auth/logout
```

Resposta esperada: `204 No Content`, com limpeza do cookie.

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

Criar este ficheiro em `server/tests/auth.session.test.js`.

```js
import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/user.model.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findOne: vi.fn(),
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

5. Explicação do código: estes testes provam cookie `HttpOnly`, erro genérico de credenciais e bloqueio de rota protegida sem cookie.
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

Se `SESSION_SECRET` não for definido em produção, a aplicação deve falhar ao arrancar. Isto é intencional para não publicar sessões assinadas com segredo fraco.

### Evidence para PR/defesa

- Screenshot ou output de DevTools mostrando `orelle_session` com `HttpOnly`.
- `POST /api/auth/login` válido com `200`.
- `POST /api/auth/login` inválido com `401` sem `Set-Cookie`.
- `GET /api/auth/me` sem cookie com `401`.
- `POST /api/auth/logout` com `204` e cookie limpo.

### Handoff para BK-MF0-03

O próximo BK deve usar `requireAuth` em todas as rotas de perfil e deve ler o utilizador autenticado em `req.user.id`. Não deve aceitar `userId` vindo do body para criar perfil.

## Changelog

- `2026-04-14`: guia normalizado para contrato canónico comum.
- `2026-05-25`: guia refinado para implementação concreta de sessão segura.
- `2026-05-29`: tutorial linear integrado com cookie HttpOnly, JWT assinado, requireAuth, UI, payloads e testes negativos.
- `2026-05-29`: estrutura corrigida para tutorial linear integrado, com código, explicação, validação e negativo no passo onde são usados.
- `2026-05-29`: separado `validateLoginInput` de `validateRegisterInput` para manter login e registo coerentes.
