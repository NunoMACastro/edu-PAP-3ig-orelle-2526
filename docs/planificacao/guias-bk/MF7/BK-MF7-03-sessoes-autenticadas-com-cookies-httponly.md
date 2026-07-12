# BK-MF7-03 - Sessões autenticadas com cookies HttpOnly

## Header
- `doc_id`: `GUIA-BK-MF7-03`
- `bk_id`: `BK-MF7-03`
- `macro`: `MF7`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF14`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF7-04`
- `guia_path`: `docs/planificacao/guias-bk/MF7/BK-MF7-03-sessoes-autenticadas-com-cookies-httponly.md`
- `last_updated`: `2026-07-10`

#### Objetivo

Neste BK vais consolidar sessões opacas persistidas com cookies HttpOnly em toda a app. O login persiste apenas o hash da credencial, logout/logout-all revogam na BD, rotas protegidas verificam TTL/estado atual e o cliente same-origin envia cookie e prova CSRF sem guardar tokens no browser.

`CANONICO`: `RNF14` exige sessões autenticadas com cookies HttpOnly. `RF02` já define login/logout com sessão segura.

#### Importância

Sessão de utilizador é uma fronteira de segurança. Se a app guardar credenciais em JavaScript acessível ao browser, qualquer falha de UI pode transformar-se em roubo de sessão. O cookie HttpOnly reduz esse risco porque o token de sessão não fica disponível para código frontend.

#### Scope-in

- Confirmar opções de cookie HttpOnly.
- Bloquear segredo fraco em produção.
- Garantir `requireAuth` em rotas protegidas.
- Garantir logout com limpeza do mesmo cookie.
- Garantir revogação persistida da sessão atual e de todas as sessões.
- Exigir `GET /api/auth/csrf`, `X-CSRF-Token` e `Origin` allowlisted nas mutações autenticadas.
- Garantir `credentials: "include"` no cliente API.
- Criar teste para cookie, `/auth/me` e logout.

#### Scope-out

- Não criar OAuth, refresh tokens ou login social.
- Não mudar hashing de passwords; isso ficou no `BK-MF6-06`.
- Não criar credenciais auto-contidas, refresh tokens ou fallback sem persistência.
- Não alterar regras de role; este BK valida sessão, não permissões de negócio.

#### Estado antes e depois

- Antes: a app tem login e cookie, mas a MF7 exige provar que todas as chamadas protegidas dependem de HttpOnly e que o frontend não guarda segredo.
- Depois: login, CSRF, logout, logout-all, `/auth/me`, API client e middleware ficam alinhados para proteger consentimento, pedidos biométricos, checkout e exports.

#### Pre-requisitos

- `BK-MF0-01`: registo com password.
- `BK-MF0-02`: login/logout base.
- `BK-MF6-05`: HTTPS em produção.
- `BK-MF6-06`: bcrypt.
- `BK-MF7-01` e `BK-MF7-02`: endpoints sensíveis dependentes de sessão.

#### Glossário

- HttpOnly: atributo de cookie que impede leitura direta por JavaScript do frontend.
- SameSite: atributo que limita envio automático do cookie em navegação externa.
- Secure: atributo que envia cookie apenas por HTTPS.
- Sessão opaca: token aleatório sem identidade embutida, resolvido através do hash persistido.
- Revogação: `revokedAt` torna a credencial inválida imediatamente, sem esperar pelo TTL.
- Prova CSRF: token aleatório ligado à sessão, guardado apenas como hash e enviado no header da mutação.
- Revalidação de conta: verificação do estado atual da conta antes de aceitar cookie antigo.

#### Conceitos teóricos essenciais

O browser guarda o cookie, mas quem valida a sessão é a API. O frontend só guarda o utilizador seguro devolvido por `/api/auth/me`, nunca o segredo usado para autenticar pedidos.

`credentials: "include"` é obrigatório porque, sem essa opção, `fetch` pode não enviar ou receber cookies em chamadas entre frontend e API.

O atributo `secure` deve estar ativo em produção e depende do canal HTTPS trabalhado em `BK-MF6-05`. Em desenvolvimento local pode ser `false` para permitir testes sem certificado.

#### Arquitetura do BK

- Configuração: `env.sessionSecret`, `env.sessionTtl`.
- Service: `session.service.js`.
- Controller: `auth.controller.js`.
- Middleware: `auth.middleware.js`.
- Frontend: `apiClient.js` e `AuthContext.jsx`.
- Testes: entropia/hash, TTL, `lastSeenAt`, revogação, CSRF/origem, login, cookie, `/auth/me`, logout e logout-all.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/config/env.js`
- EDITAR: `apps/api/src/services/session.service.js`
- EDITAR: `apps/api/src/controllers/auth.controller.js`
- EDITAR: `apps/api/src/middlewares/auth.middleware.js`
- EDITAR: `apps/web/src/services/apiClient.js`
- EDITAR: `apps/web/src/context/AuthContext.jsx`
- REVER: `apps/api/src/routes/auth.routes.js`
- REVER: `apps/api/src/middlewares/role.middleware.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato RNF14/RF02

1. Objetivo funcional do passo no contexto da app.

Confirmar que sessão segura é requisito transversal.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/RF.md`
    - LOCALIZAÇÃO: `RNF14`, `RF02`.

3. Instruções do que fazer.

Regista que todos os endpoints de MF7 dependem de sessão validada no backend.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. É uma confirmação de contrato antes de alterar autenticação.

5. Explicação do código.

Sem código. O ponto pedagógico é perceber que cookie HttpOnly não é detalhe visual; é a base de proteção de endpoints sensíveis.

6. Validação do passo.

Executa `rg -n "RNF14|RF02|cookie HttpOnly" docs/RNF.md docs/RF.md`.

7. Cenário negativo/erro esperado.

Se uma rota sensível aceitar pedido sem sessão, este BK fica incompleto.

### Passo 2 - Centralizar opções do cookie de sessão

1. Objetivo funcional do passo no contexto da app.

Definir cookie HttpOnly com atributos consistentes.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/session.service.js`
    - LOCALIZAÇÃO: constantes e funções de cookie.

3. Instruções do que fazer.

Garante que o ficheiro contém as funções abaixo.

4. Código completo, correto e integrado com a app final.

```js
/**
 * Nome canónico do cookie de sessão.
 *
 * @type {"orelle_session"}
 */
export const SESSION_COOKIE_NAME = "orelle_session";

/**
 * Constrói as opções seguras do cookie de sessão.
 *
 * @function getSessionCookieOptions
 * @returns {{httpOnly: true, sameSite: "lax", secure: boolean, path: "/", maxAge: number}} Opções para `res.cookie`.
 */
export function getSessionCookieOptions() {
    // HttpOnly impede leitura por JavaScript; o frontend nunca recebe o segredo da sessão.
    // Secure fica dependente de produção porque o desenvolvimento local pode usar HTTP.
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: env.forceHttps,
        path: "/",
        maxAge: parseSessionTtlMs(env.sessionTtl),
    };
}

/**
 * Constrói as opções usadas para limpar o cookie de sessão.
 *
 * @function getClearSessionCookieOptions
 * @returns {{httpOnly: true, sameSite: "lax", secure: boolean, path: "/"}} Opções para `res.clearCookie`.
 */
function getClearSessionCookieOptions() {
    const options = getSessionCookieOptions();
    // A limpeza mantém path/sameSite/secure iguais para apontar ao mesmo cookie criado no login.
    delete options.maxAge;

    return options;
}
```

5. Explicação do código.

`httpOnly: true` impede leitura direta pelo frontend. `sameSite: "lax"` reduz envio automático em contextos externos. `secure` segue a política HTTPS validada. `path: "/"` cobre a API e `maxAge` coincide com o TTL persistido. A função de limpar remove apenas `maxAge`, mantendo os restantes atributos iguais.

6. Validação do passo.

Confirma num teste ou log de resposta que `Set-Cookie` inclui `HttpOnly`.

7. Cenário negativo/erro esperado.

Se `secure` estiver sempre `true`, desenvolvimento local em HTTP deixa de conseguir testar login. Se estiver sempre `false`, produção fica fraca.

### Passo 3 - Criar, validar e revogar sessão opaca persistida

1. Objetivo funcional do passo no contexto da app.

Gerar 256 bits aleatórios, persistir apenas o HMAC e rejeitar sessões ausentes, expiradas ou revogadas.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/session.service.js`
    - EDITAR: `apps/api/src/models/auth-session.model.js`
    - LOCALIZAÇÃO: `createPersistentSession`, `verifySessionToken`, `revokeSessionToken`, `revokeAllUserSessions`.

3. Instruções do que fazer.

Mantém as funções completas abaixo.

4. Código completo, correto e integrado com a app final.

```js
import { createHmac, randomBytes } from "node:crypto";
import { AuthSession } from "../models/auth-session.model.js";

export function generateSessionToken() {
    return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token) {
    return createHmac("sha256", env.sessionSecret)
        .update(String(token))
        .digest("hex");
}

export async function createPersistentSession(user) {
    const now = new Date();
    const token = generateSessionToken();
    await AuthSession.create({
        tokenHash: hashSessionToken(token),
        userId: user.id,
        expiresAt: new Date(now.getTime() + parseSessionTtlMs(env.sessionTtl)),
        revokedAt: null,
        lastSeenAt: now,
        csrfHash: null,
    });
    return token;
}

export async function verifySessionToken(token) {
    const now = new Date();
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

export async function revokeSessionToken(token) {
    return AuthSession.updateOne(
        { tokenHash: hashSessionToken(token), revokedAt: null },
        { $set: { revokedAt: new Date() } },
    );
}

export async function revokeAllUserSessions(userId) {
    return AuthSession.updateMany(
        { userId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
    );
}
```

5. Explicação do código.

O token não contém `userId`, email ou role. Só o HMAC chega a `AuthSession`, juntamente com `expiresAt`, `revokedAt`, `lastSeenAt` e `csrfHash`. A query de verificação recusa expiração/revogação no próprio pedido e atualiza atividade atomicamente. Limpar o cookie sem marcar `revokedAt` não cumpre o contrato.

6. Validação do passo.

Testa login e confirma que o body devolve `user`, não o token.

7. Cenário negativo/erro esperado.

Cookie alterado, expirado ou já revogado deve gerar `401`; um dump da coleção não pode conter a credencial bruta.

### Passo 4 - Bloquear segredo fraco em produção

1. Objetivo funcional do passo no contexto da app.

Impedir arranque da API com segredo previsível.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/config/env.js`
    - LOCALIZAÇÃO: `isUnsafeProductionSessionSecret` e validação final do ficheiro.

3. Instruções do que fazer.

Garante que produção exige segredo forte.

4. Código completo, correto e integrado com a app final.

```js
const INSECURE_SESSION_SECRETS = new Set([
    "dev-only-change-me",
    "change-me",
    "change-me-use-a-long-random-string",
    "secret",
    "session-secret",
]);

/**
 * Identifica segredos de sessão que não são aceitáveis em produção.
 *
 * @function isUnsafeProductionSessionSecret
 * @param {string|undefined} secret - Valor de SESSION_SECRET.
 * @returns {boolean} Verdadeiro quando o segredo é ausente, curto ou inseguro.
 */
export function isUnsafeProductionSessionSecret(secret) {
    const normalizedSecret = String(secret ?? "").trim();

    // O segredo funciona como pepper HMAC e não pode ser previsível.
    return (
        normalizedSecret.length < 32 ||
        INSECURE_SESSION_SECRETS.has(normalizedSecret.toLowerCase())
    );
}

if (
    env.nodeEnv === "production" &&
    isUnsafeProductionSessionSecret(env.sessionSecret)
) {
    throw new Error("SESSION_SECRET forte obrigatório em produção");
}
```

5. Explicação do código.

O HMAC persistido só protege credenciais capturadas da base se o pepper for difícil de adivinhar. Esta validação falha cedo, no arranque, em vez de aceitar hashes enfraquecidos.

6. Validação do passo.

Define `NODE_ENV=production` com segredo curto num ambiente local controlado e confirma que a API recusa arrancar.

7. Cenário negativo/erro esperado.

`SESSION_SECRET=secret` em produção deve falhar.

### Passo 5 - Proteger rotas com middleware de autenticação

1. Objetivo funcional do passo no contexto da app.

Ler o cookie no backend, validar a sessão persistida, revalidar a conta e proteger mutações contra CSRF.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/middlewares/auth.middleware.js`
    - EDITAR: `apps/api/src/middlewares/csrf.middleware.js`
    - LOCALIZAÇÃO: helpers de revalidação e função `requireAuth`.

3. Instruções do que fazer.

Confirma que `requireAuth` usa `SESSION_COOKIE_NAME`, aguarda `verifySessionToken`, revalida sempre a conta em runtime, preenche `req.authSession` e encaminha a mutação para a proteção CSRF/origem.

4. Código completo, correto e integrado com a app final.

```js
import {
    SESSION_COOKIE_NAME,
    verifySessionToken,
} from "../services/session.service.js";
import { ensureUserCanAuthenticate } from "../services/auth.service.js";
import { User } from "../models/user.model.js";
import { AppError } from "./error.middleware.js";
import { requireCsrfForAuthenticatedMutation } from "./csrf.middleware.js";

/**
 * Bloqueia pedidos sem sessão válida e popula req.user.
 *
 * @function requireAuth
 * @param {import("express").Request & {user?: object}} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {void}
 */
export async function requireAuth(req, res, next) {
    const token = req.cookies?.[SESSION_COOKIE_NAME];

    // O cookie HttpOnly é a única fonte de identidade aceite pelo backend.
    if (!token) {
        return next(new AppError(401, "Autenticação obrigatória"));
    }

    try {
        const session = await verifySessionToken(token);
        const account = await User.findById(session.id).select(
            "email role isActive accountStatus",
        );
        if (!account) throw new AppError(401, "Sessão inválida");

        ensureUserCanAuthenticate(account);
        req.user = { id: session.id, email: account.email, role: account.role };
        req.authSession = { id: session.sessionId };
        return requireCsrfForAuthenticatedMutation(req, res, next);
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código.

O middleware resolve o hash numa sessão ativa, atualiza `lastSeenAt`, confirma que a conta continua ativa e usa a role atual. Controllers deixam de aceitar identidade enviada pelo body. Em `POST`, `PUT`, `PATCH` ou `DELETE`, a continuação só ocorre se `X-CSRF-Token` estiver ligado à sessão e `Origin` pertencer à allowlist configurada.

6. Validação do passo.

Faz `GET /api/auth/me` sem cookie: deve devolver `401`. Depois faz login e repete: deve devolver o utilizador.

7. Cenário negativo/erro esperado.

Pedido com cookie expirado/revogado deve falhar com `401`; mutação sem token CSRF, com token de outra sessão ou origem não autorizada deve falhar com `403`.

### Passo 6 - Enviar cookies no cliente API

1. Objetivo funcional do passo no contexto da app.

Garantir que todos os pedidos frontend usam `/api` same-origin, enviam cookie e acrescentam a prova CSRF às mutações autenticadas.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/services/apiClient.js`
    - LOCALIZAÇÃO: funções `apiRequest` e `apiDownload`.

3. Instruções do que fazer.

Mantém `credentials: "include"` nas duas funções, a base fixa `/api` e um cache CSRF apenas em memória.

4. Código completo, correto e integrado com a app final.

```js
export const API_BASE_URL = "/api";
export const CSRF_HEADER_NAME = "X-CSRF-Token";
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

/**
 * Faz um pedido JSON para a API Orélle.
 *
 * @async
 * @function apiRequest
 * @param {string} path - Caminho da API.
 * @param {RequestInit} [options={}] - Opções adicionais do `fetch`.
 * @returns {Promise<unknown|null>} JSON da resposta ou null para 204.
 */
export async function apiRequest(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const method = String(options.method ?? "GET").toUpperCase();
    const headers = new Headers(options.headers ?? {});
    if (!SAFE_METHODS.has(method) && !CSRF_EXEMPT_MUTATIONS.has(path)) {
        headers.set(CSRF_HEADER_NAME, await getCsrfToken());
    }
    if (!isFormData && options.body !== undefined) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        headers,
    });

    if (response.status === 401) clearCsrfTokenCache();

    if (response.status === 204) return null;
    if (!response.ok) throw new Error(await readApiErrorMessage(response));
    return response.json().catch(() => ({}));
}

/**
 * Faz um pedido autenticado para endpoints que devolvem ficheiros.
 *
 * @async
 * @function apiDownload
 * @param {string} path - Caminho da API.
 * @param {RequestInit} [options={}] - Opções adicionais do `fetch`.
 * @returns {Promise<Response>} Resposta binária validada.
 */
export async function apiDownload(path, options = {}) {
    // Downloads também dependem do cookie porque relatórios e recibos pertencem ao utilizador.
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        ...options,
    });

    if (!response.ok) {
        throw new Error(await readApiErrorMessage(response));
    }

    return response;
}
```

5. Explicação do código.

`/api` preserva same-origin e impede publicar um fallback local. `credentials: "include"` envia cookies sem os expor ao JavaScript. O token CSRF é obtido por sessão e fica apenas em memória; o cliente limpa-o em `401` e o `AuthProvider` também o limpa em login/logout/logout-all. `FormData` continua a deixar o browser definir o boundary.

6. Validação do passo.

Depois do login, chama `/auth/me` pela UI e confirma que o utilizador aparece.

7. Cenário negativo/erro esperado.

Se removeres `credentials`, o browser pode ficar autenticado no cookie mas os pedidos seguintes aparecem como anónimos.

### Passo 7 - Testar persistência, CSRF e revogação

1. Objetivo funcional do passo no contexto da app.

Provar o contrato completo sem depender de seeds nem de uma base remota.

2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `apps/api/tests/opaque-session.service.test.js`
    - CRIAR/EDITAR: `apps/api/tests/csrf-origin.test.js`
    - CRIAR/EDITAR: `apps/api/tests/auth.session.test.js`

3. Instruções do que fazer.

Usa dependências injetadas nos testes unitários e `MongoMemoryReplSet` isolado nos testes de persistência/HTTP. Nunca apontes a suite para a URI de ambiente real.

4. Código correto e integrado para a prova unitária central:

```js
import { describe, expect, it, vi } from "vitest";
import { AuthSession } from "../src/models/auth-session.model.js";
import {
    createPersistentSession,
    hashSessionToken,
    revokeAllUserSessions,
    revokeSessionToken,
} from "../src/services/session.service.js";

const user = { id: "66a000000000000000000001" };

describe("BK-MF7-03 - sessão opaca persistida", () => {
    it("persiste apenas hash, TTL, revogação, atividade e espaço CSRF", async () => {
        const now = new Date("2026-07-10T09:00:00.000Z");
        const sessionModel = { create: vi.fn().mockResolvedValue({}) };
        const token = await createPersistentSession(user, {
            now,
            ttlMs: 60_000,
            sessionModel,
        });
        const persisted = sessionModel.create.mock.calls[0][0];

        expect(Buffer.from(token, "base64url")).toHaveLength(32);
        expect(persisted).toEqual({
            tokenHash: hashSessionToken(token),
            userId: user.id,
            expiresAt: new Date("2026-07-10T09:01:00.000Z"),
            revokedAt: null,
            lastSeenAt: now,
            csrfHash: null,
        });
        expect(JSON.stringify(persisted)).not.toContain(token);
    });

    it("define índice TTL e campos privados", () => {
        const ttlIndex = AuthSession.schema
            .indexes()
            .find(([fields]) => fields.expiresAt === 1);

        expect(AuthSession.schema.path("tokenHash").options.select).toBe(false);
        expect(AuthSession.schema.path("csrfHash").options.select).toBe(false);
        expect(AuthSession.schema.path("lastSeenAt").isRequired).toBe(true);
        expect(ttlIndex?.[1].expireAfterSeconds).toBe(0);
    });

    it("revoga a sessão atual e todas as sessões do titular", async () => {
        const sessionModel = {
            updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
            updateMany: vi.fn().mockResolvedValue({ modifiedCount: 2 }),
        };

        await expect(
            revokeSessionToken("a".repeat(43), { sessionModel }),
        ).resolves.toBe(true);
        await expect(
            revokeAllUserSessions(user.id, { sessionModel }),
        ).resolves.toBe(2);
    });
});
```

5. Explicação do código.

O teste prova entropia, ausência do token bruto na persistência, TTL, campos privados e revogação. A integração HTTP deve acrescentar: login com cookie `HttpOnly`/`SameSite=Lax`; `/auth/me` sem sessão `401`; `GET /auth/csrf` com `no-store`; mutações sem token, com token de outra sessão ou origem fora da allowlist `403`; logout e logout-all tornam cookies antigos inválidos mesmo quando reapresentados.

6. Validação do passo.

Executa os três ficheiros focais e depois `npm --prefix apps/api test`. Todos devem correr contra configuração test-only e loopback.

7. Cenário negativo/erro esperado.

O BK falha se o dump contiver token bruto, se o monitor TTL for a única validação de expiração, se logout apenas limpar o cookie, se logout-all deixar uma sessão do mesmo titular ativa ou se uma mutação aceitar cookie sem CSRF/origem.

#### Erros comuns

- Guardar token de sessão no frontend em vez de depender do cookie HttpOnly.
- Esquecer `credentials: "include"` no cliente API e depois assumir que a sessão falhou no backend.
- Limpar logout com atributos diferentes dos usados no login, deixando o browser conservar o cookie antigo.
- Testar apenas o sucesso do login e esquecer os negativos de `/auth/me` sem cookie e logout.

#### Cenários negativos obrigatórios

Executar cenários negativos obrigatórios (mínimo 3):

1. `/api/auth/me` sem cookie deve devolver `401`.
2. Cookie opaco inválido, expirado ou revogado deve devolver `401`.
3. Logout deve revogar na BD, limpar o cookie e impedir novo `/api/auth/me` com a credencial antiga.
4. Mutação sem `X-CSRF-Token`, com token cruzado ou `Origin` fora da allowlist deve devolver `403`.
5. Logout-all deve invalidar todas as sessões do titular sem afetar outro utilizador.

#### Expected results

- Login válido devolve `200`, body com `user` e header `Set-Cookie` com `HttpOnly`.
- Logout devolve `204`, marca `revokedAt` e limpa cookie.
- Logout-all devolve `204` e revoga todas as sessões do titular.
- `/api/auth/me` sem cookie devolve `401`.
- `/api/auth/me` com sessão opaca ativa devolve `200` e o utilizador seguro.
- `GET /api/auth/csrf` devolve prova ligada à sessão com `Cache-Control: no-store`.
- Endpoints de MF7 usam `requireAuth`.
- Frontend usa `credentials: "include"` no cliente API.

#### Critérios de aceite

- Cookie tem `httpOnly: true`.
- Cookie usa `secure: true` em produção.
- Produção bloqueia `SESSION_SECRET` fraco.
- O frontend não guarda segredo de sessão.
- Rotas sensíveis não aceitam identidade pelo body.
- A BD guarda apenas hashes de sessão/CSRF, TTL, `revokedAt` e `lastSeenAt`.
- Mutações autenticadas exigem prova CSRF e origem allowlisted.
- Login, logout e `/auth/me` têm negativos.
- O teste final não depende de seed externa nem usa condição que esconda falhas.
- Cenários negativos concluídos: mínimo `3`.

#### Validação final

- `rg -n "SESSION_COOKIE_NAME|getSessionCookieOptions|credentials: \"include\"|requireAuth" apps/api/src apps/web/src`
- `npm --prefix apps/api test`
- `npm --prefix apps/web run build`
- Verificar manualmente o header `Set-Cookie` num login bem-sucedido.
- [ ] Negativos: mínimo `3` cenários executados e registados na evidence.

Matriz mínima de testes por prioridade:

| Prioridade | Prova | Resultado esperado |
| --- | --- | --- |
| P0 | `/api/auth/me` sem cookie | `401` |
| P0 | login com credenciais válidas | `200`, `Set-Cookie` com `HttpOnly`, body sem `token` |
| P0 | logout após cookie válido | `204`, cookie limpo e `/api/auth/me` volta a `401` |
| P1 | sessão opaca ativa em `/api/auth/me` | `200` com `user` seguro |
| P0 | CSRF ausente/cruzado ou origem fora da allowlist | `403` |
| P0 | logout-all com duas sessões do titular | ambas passam a `401`; sessão de terceiro mantém-se válida |
| P2 | build web com cliente API | `credentials: "include"` preservado |

Evidência de testes por camada:

| Camada | Evidência mínima |
| --- | --- |
| Backend unitário/integração | `npm --prefix apps/api test` com casos de login, `/auth/me` e logout |
| Frontend build | `npm --prefix apps/web run build` sem regressões no cliente API |
| Manual/browser | header `Set-Cookie` com `HttpOnly` e sessão preservada após refresh |

#### Evidence para PR/defesa

- Output de teste de `/auth/me` sem cookie.
- Header de login com `HttpOnly`.
- Output de logout com cookie limpo e `/auth/me` a voltar a `401`.
- Screenshot da UI autenticada após refresh.
- Nota técnica a explicar que o frontend guarda apenas `user` seguro.

#### Handoff

O `BK-MF7-04` deve validar que este comportamento funciona em Chrome, Safari, Edge e Firefox sem código específico para cada browser.

#### Changelog

- 2026-06-26: Guia reescrito para tutorial técnico linear, com cookie HttpOnly, segredo de sessão, middleware, cliente API e negativos de autenticação.
- 2026-06-26: Corrigido teste final para prova determinística de login, cookie HttpOnly, `/auth/me` e logout; reforçados comentários didáticos internos em blocos de sessão.
- 2026-07-10: contrato ativo substituído por sessões opacas persistidas com token de 256 bits, hash na BD, TTL/atividade/revogação, logout-all e proteção CSRF/origem; cliente normalizado para `/api` same-origin.

## Suplemento de validacao documental
Este suplemento fecha lacunas formais detetadas pelo validador de planificacao sem alterar o contrato funcional original do guia.

## Bloco pedagogico
### Objetivo
O aluno deve completar `Sessões autenticadas com cookies HttpOnly.` com rastreabilidade direta a `RNF14`, mantendo evidence objetiva, negativos por prioridade e handoff claro.

### Pre-requisitos
- Rever `RNF14` nos documentos RF/RNF aplicáveis.
- Confirmar dependencias declaradas: `-`.
- Consultar `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md` e o guia atual antes de implementar.

### Erros comuns
- Fechar o BK sem negativos minimos por prioridade.
- Alterar comportamento sem alinhar matriz, backlog, anexos e guia.
- Registar evidence sem output, screenshot, request/response ou teste verificavel.

### Check de compreensao
- [ ] Sei explicar o objetivo do BK e o requisito associado.
- [ ] Sei quais sao entradas, saidas, dependencias e criterio de sucesso.
- [ ] Sei executar o smoke principal e os negativos obrigatorios.

## Bloco operacional
### Entrada
- BK: `BK-MF7-03`
- Requisito: `RNF14`
- Dependencias: `-`
- Sprint: `S11-S12`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF7-03` e do requisito `RNF14`.
2. Validar pre-condicoes e dependencias declaradas (`-`).
3. Rever ficheiros reais ligados ao BK e identificar o fluxo principal.
4. Consolidar contrato de entrada/saida com validacao, ownership e erros controlados.
5. Executar smoke test do caminho principal e validar integracao com BKs adjacentes.
6. Registar evidencia tecnica objetiva antes do handoff.
7. Executar cenarios negativos obrigatorios (minimo 3) e registar o resultado.
8. Reexecutar validacao afetada e guardar evidence final para defesa/PR.

### Validacao
- [ ] Smoke: fluxo principal executa sem erro bloqueante.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: metadados alinhados entre guia, backlog, matriz e anexos.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF7-04`
- Registar riscos, dependencias pendentes e validacoes executadas antes do fecho.

## Criterios de aceite
- Entrega funcional especifica de `Sessões autenticadas com cookies HttpOnly.` validada contra `RNF14`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Metadados do guia alinhados com matriz, backlog e anexos.

## Evidence para PR/defesa
- `proof_tecnico`: output, log, screenshot ou request/response do fluxo principal.
- `proof_negativos`: cenarios negativos executados e resultados observados.
- `proof_handoff`: estado final, riscos e proximo BK.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF7-03';
const MIN_NEGATIVOS = 3;

export function validarEvidenceDocumental(evidence) {
  const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;

  if (evidence?.bkId !== BK_ID) {
    throw new Error('Evidence fora do contrato do BK');
  }

  if (negativos < 3) {
    throw new Error('Cenarios negativos abaixo do minimo exigido');
  }

  return { bkId: BK_ID, estado: 'validado' };
}
```

## Changelog
- `2026-06-30`: suplemento documental adicionado para cumprir validador de planificacao.
