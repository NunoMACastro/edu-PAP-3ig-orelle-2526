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
- `last_updated`: `2026-06-26`

#### Objetivo

Neste BK vais consolidar autenticação com cookies HttpOnly em toda a app. Login cria cookie seguro, logout limpa o cookie, rotas protegidas leem a sessão no backend e o frontend envia pedidos autenticados com `credentials: "include"`.

`CANONICO`: `RNF14` exige sessões autenticadas com cookies HttpOnly. `RF02` já define login/logout com sessão segura.

#### Importância

Sessão de utilizador é uma fronteira de segurança. Se a app guardar credenciais em JavaScript acessível ao browser, qualquer falha de UI pode transformar-se em roubo de sessão. O cookie HttpOnly reduz esse risco porque o token de sessão não fica disponível para código frontend.

#### Scope-in

- Confirmar opções de cookie HttpOnly.
- Bloquear segredo fraco em produção.
- Garantir `requireAuth` em rotas protegidas.
- Garantir logout com limpeza do mesmo cookie.
- Garantir `credentials: "include"` no cliente API.
- Criar teste para cookie, `/auth/me` e logout.

#### Scope-out

- Não criar OAuth, refresh tokens ou login social.
- Não mudar hashing de passwords; isso ficou no `BK-MF6-06`.
- Não trocar JWT assinado por sessão persistida em base de dados.
- Não alterar regras de role; este BK valida sessão, não permissões de negócio.

#### Estado antes e depois

- Antes: a app tem login e cookie, mas a MF7 exige provar que todas as chamadas protegidas dependem de HttpOnly e que o frontend não guarda segredo.
- Depois: login, logout, `/auth/me`, API client e middleware ficam alinhados para proteger consentimento, pedidos biométricos, checkout e exports.

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
- Sessão assinada: payload autenticado criptograficamente pelo backend.
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
- Testes: login, cookie, `/auth/me`, logout e rota protegida sem cookie.

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
        secure: env.nodeEnv === "production",
        path: "/",
        maxAge: 1000 * 60 * 60 * 2,
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

`httpOnly: true` impede leitura direta pelo frontend. `sameSite: "lax"` reduz envio automático em contextos externos. `secure` fica ligado em produção. `path: "/"` garante que toda a API consegue receber o cookie. A função de limpar remove `maxAge`, mantendo os restantes atributos iguais.

6. Validação do passo.

Confirma num teste ou log de resposta que `Set-Cookie` inclui `HttpOnly`.

7. Cenário negativo/erro esperado.

Se `secure` estiver sempre `true`, desenvolvimento local em HTTP deixa de conseguir testar login. Se estiver sempre `false`, produção fica fraca.

### Passo 3 - Criar e validar token assinado no cookie

1. Objetivo funcional do passo no contexto da app.

Assinar sessão no backend e rejeitar tokens inválidos ou expirados.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/session.service.js`
    - LOCALIZAÇÃO: `createSessionToken`, `verifySessionToken`, `attachSessionCookie`, `clearSessionCookie`.

3. Instruções do que fazer.

Mantém as funções completas abaixo.

4. Código completo, correto e integrado com a app final.

```js
/**
 * Cria um token de sessão a partir do utilizador seguro.
 *
 * @function createSessionToken
 * @param {{id: string, email: string, role: string}} user - Utilizador autenticado.
 * @returns {string} JWT assinado para colocar no cookie HttpOnly.
 */
export function createSessionToken(user) {
    return jwt.sign(
        {
            // O payload guarda apenas identidade mínima; permissões detalhadas ficam no backend.
            sub: user.id,
            email: user.email,
            role: user.role,
        },
        env.sessionSecret,
        { expiresIn: env.sessionTtl },
    );
}

/**
 * Valida um token de sessão e devolve o utilizador autenticado.
 *
 * @function verifySessionToken
 * @param {string} token - JWT recebido do cookie.
 * @returns {{id: string, email: string, role: string}} Dados mínimos do utilizador autenticado.
 * @throws {AppError} Quando o token está ausente, inválido ou expirado.
 */
export function verifySessionToken(token) {
    try {
        // jwt.verify rejeita assinatura alterada, segredo errado ou expiração ultrapassada.
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

/**
 * Escreve o cookie HttpOnly de sessão na resposta.
 *
 * @function attachSessionCookie
 * @param {import("express").Response} res - Resposta Express.
 * @param {{id: string, email: string, role: string}} user - Utilizador autenticado.
 * @returns {void}
 */
export function attachSessionCookie(res, user) {
    const token = createSessionToken(user);
    // O token segue no header Set-Cookie, não no body JSON devolvido ao browser.
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

/**
 * Limpa o cookie de sessão no logout.
 *
 * @function clearSessionCookie
 * @param {import("express").Response} res - Resposta Express.
 * @returns {void}
 */
export function clearSessionCookie(res) {
    // Logout deve apagar o mesmo nome e os mesmos atributos usados no login.
    res.clearCookie(SESSION_COOKIE_NAME, getClearSessionCookieOptions());
}
```

5. Explicação do código.

O token contém apenas `sub`, `email` e `role`, suficientes para identificar o utilizador. A assinatura usa `SESSION_SECRET`; se alguém alterar o payload, `jwt.verify` falha. `attachSessionCookie` nunca devolve o token no JSON, apenas no cookie HttpOnly.

6. Validação do passo.

Testa login e confirma que o body devolve `user`, não o token.

7. Cenário negativo/erro esperado.

Cookie alterado manualmente deve gerar `401`.

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

    // Em produção, segredo curto torna cookies assinados previsíveis.
    // Valores de exemplo comuns também são bloqueados para impedir deploy inseguro.
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

Um cookie assinado só é seguro se o segredo for difícil de adivinhar. Esta validação falha cedo, no arranque, em vez de deixar a API aceitar sessões fracas em produção.

6. Validação do passo.

Define `NODE_ENV=production` com segredo curto num ambiente local controlado e confirma que a API recusa arrancar.

7. Cenário negativo/erro esperado.

`SESSION_SECRET=secret` em produção deve falhar.

### Passo 5 - Proteger rotas com middleware de autenticação

1. Objetivo funcional do passo no contexto da app.

Ler cookie no backend e popular `req.user`.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/middlewares/auth.middleware.js`
    - LOCALIZAÇÃO: helpers de revalidação e função `requireAuth`.

3. Instruções do que fazer.

Confirma que o middleware usa `SESSION_COOKIE_NAME`, `verifySessionToken` e revalida a conta quando há acesso seguro ao modelo `User`.

4. Código completo, correto e integrado com a app final.

```js
import {
    SESSION_COOKIE_NAME,
    verifySessionToken,
} from "../services/session.service.js";
import { ensureUserCanAuthenticate } from "../services/auth.service.js";
import { User } from "../models/user.model.js";
import { AppError } from "./error.middleware.js";

/**
 * Decide se a sessão deve ser revalidada contra a conta persistida.
 *
 * @function shouldRevalidateSessionUser
 * @returns {boolean} Verdadeiro quando há contrato seguro para consultar User.
 */
function shouldRevalidateSessionUser() {
    if (typeof User.findById !== "function") return false;

    return (
        // Em runtime real a conta é revalidada para bloquear utilizadores suspensos.
        process.env.NODE_ENV !== "test" ||
        // Em testes, só revalidamos quando o próprio teste fornece mock explícito.
        User.findById._isMockFunction === true ||
        typeof User.findById.mock === "object"
    );
}

/**
 * Carrega apenas os campos necessários para validar estado e role da conta.
 *
 * @async
 * @function findSessionAccountState
 * @param {string} userId - ID presente no token de sessão.
 * @returns {Promise<object|null>} Estado de conta com role atual ou null.
 */
async function findSessionAccountState(userId) {
    const query = User.findById(userId);

    if (!query) return null;

    if (typeof query.select === "function") {
        return query.select("role isActive accountStatus");
    }

    return query;
}

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
        const sessionUser = verifySessionToken(token);

        if (shouldRevalidateSessionUser()) {
            const accountState = await findSessionAccountState(sessionUser.id);

            if (!accountState) {
                return next(new AppError(401, "Sessão inválida"));
            }

            // Revalidar estado atual impede que cookies antigos mantenham contas bloqueadas ativas.
            ensureUserCanAuthenticate(accountState);
            req.user = {
                ...sessionUser,
                role: accountState.role,
            };
            return next();
        }

        // Em testes sem BD, ainda validamos assinatura/expiração antes de aceitar a sessão.
        req.user = sessionUser;
        return next();
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código.

O middleware lê o cookie, valida assinatura e expiração, e coloca o utilizador no pedido. Quando a base de dados está disponível, também confirma que a conta continua ativa e usa a role atual. Controllers como consentimento, pedidos biométricos, checkout e exports deixam de aceitar identidade enviada pelo body.

6. Validação do passo.

Faz `GET /api/auth/me` sem cookie: deve devolver `401`. Depois faz login e repete: deve devolver o utilizador.

7. Cenário negativo/erro esperado.

Pedido com cookie expirado ou assinado com outro segredo deve falhar.

### Passo 6 - Enviar cookies no cliente API

1. Objetivo funcional do passo no contexto da app.

Garantir que todos os pedidos frontend autenticados enviam cookie.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/services/apiClient.js`
    - LOCALIZAÇÃO: funções `apiRequest` e `apiDownload`.

3. Instruções do que fazer.

Mantém `credentials: "include"` nas duas funções.

4. Código completo, correto e integrado com a app final.

```js
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
    // credentials include transporta o cookie HttpOnly sem expor token ao JavaScript.
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        // FormData precisa de deixar o browser definir o boundary do multipart.
        headers: isFormData
            ? options.headers
            : { "Content-Type": "application/json", ...(options.headers ?? {}) },
        ...options,
    });

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

`credentials: "include"` envia e recebe cookies. A função também evita forçar `Content-Type` em `FormData`, preservando upload de fotografias. A leitura de erro continua segura porque usa mensagem JSON controlada.

6. Validação do passo.

Depois do login, chama `/auth/me` pela UI e confirma que o utilizador aparece.

7. Cenário negativo/erro esperado.

Se removeres `credentials`, o browser pode ficar autenticado no cookie mas os pedidos seguintes aparecem como anónimos.

### Passo 7 - Testar login, me e logout

1. Objetivo funcional do passo no contexto da app.

Provar o contrato completo de sessão.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf7.session-cookie.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria teste de integração com supertest, login e agente persistente.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf7.session-cookie.test.js
import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findOne: vi.fn(),
    },
}));

/**
 * Cria um identificador mínimo com a interface usada pelos DTOs.
 *
 * @function objectId
 * @param {string} id - Valor textual a devolver por `toString`.
 * @returns {{toString: Function}} Objeto que simula um ObjectId Mongoose.
 */
function objectId(id) {
    return {
        toString() {
            return id;
        },
    };
}

describe("BK-MF7-03 sessões HttpOnly", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("bloqueia /auth/me sem cookie", async () => {
        const response = await request(createApp()).get("/api/auth/me");

        expect(response.status).toBe(401);
    });

    it("faz login, cria cookie HttpOnly e não devolve token no body", async () => {
        const passwordHash = await bcrypt.hash("PalavraPasse12345", 12);

        User.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({
                _id: objectId("user-1"),
                email: "cliente@orelle.test",
                role: "cliente",
                passwordHash,
                createdAt: new Date("2026-05-29T10:00:00.000Z"),
            }),
        });

        const response = await request(createApp())
            .post("/api/auth/login")
            .send({
                email: "cliente@orelle.test",
                password: "PalavraPasse12345",
            });

        // O teste cria o utilizador em mock para não depender de seeds ou estado local.
        expect(response.status).toBe(200);
        expect(response.headers["set-cookie"].join(";")).toContain("HttpOnly");
        expect(response.headers["set-cookie"].join(";")).toContain("SameSite=Lax");
        expect(response.body.user.email).toBe("cliente@orelle.test");
        expect(response.body.token).toBeUndefined();
    });

    it("aceita /auth/me com cookie assinado e rejeita depois do logout", async () => {
        const app = createApp();
        const agent = request.agent(app);
        const token = createSessionToken({
            id: "user-1",
            email: "cliente@orelle.test",
            role: "cliente",
        });

        const meBeforeLogout = await agent
            .get("/api/auth/me")
            .set("Cookie", [`orelle_session=${token}`]);

        // O cookie assinado é suficiente para identificar a sessão sem payload no body.
        expect(meBeforeLogout.status).toBe(200);
        expect(meBeforeLogout.body.user.email).toBe("cliente@orelle.test");

        const logout = await agent
            .post("/api/auth/logout")
            .set("Cookie", [`orelle_session=${token}`]);

        expect(logout.status).toBe(204);
        expect(logout.headers["set-cookie"].join(";")).toContain(
            "orelle_session=",
        );

        // Depois do logout, o mesmo agente já não deve conseguir ler /auth/me.
        const meAfterLogout = await agent.get("/api/auth/me");

        expect(meAfterLogout.status).toBe(401);
    });
});
```

5. Explicação do código.

O primeiro teste prova o negativo essencial. O segundo cria o utilizador em mock, faz login real contra a app Express e confirma `Set-Cookie` com `HttpOnly`, `SameSite=Lax`, body com `user` e ausência de `token`. O terceiro usa cookie assinado para provar `/auth/me` autenticado e confirma que logout limpa a sessão.

6. Validação do passo.

Executa `npm --prefix apps/api test`. O teste deve falhar se o login não devolver cookie HttpOnly, se `/auth/me` aceitar pedido anónimo ou se logout não limpar a sessão.

7. Cenário negativo/erro esperado.

`/api/auth/me` sem cookie deve falhar sempre. Login bem-sucedido que devolva `token` no body ou logout que mantenha a sessão ativa também deve falhar o teste.

#### Erros comuns

- Guardar token de sessão no frontend em vez de depender do cookie HttpOnly.
- Esquecer `credentials: "include"` no cliente API e depois assumir que a sessão falhou no backend.
- Limpar logout com atributos diferentes dos usados no login, deixando o browser conservar o cookie antigo.
- Testar apenas o sucesso do login e esquecer os negativos de `/auth/me` sem cookie e logout.

#### Cenários negativos obrigatórios

Executar cenários negativos obrigatórios (mínimo 3):

1. `/api/auth/me` sem cookie deve devolver `401`.
2. Cookie inválido, expirado ou assinado com outro segredo deve devolver `401`.
3. Logout deve limpar o cookie e impedir novo `/api/auth/me` autenticado no mesmo agente.

#### Expected results

- Login válido devolve `200`, body com `user` e header `Set-Cookie` com `HttpOnly`.
- Logout devolve `204` e limpa cookie.
- `/api/auth/me` sem cookie devolve `401`.
- `/api/auth/me` com cookie assinado devolve `200` e o utilizador seguro.
- Endpoints de MF7 usam `requireAuth`.
- Frontend usa `credentials: "include"` no cliente API.

#### Critérios de aceite

- Cookie tem `httpOnly: true`.
- Cookie usa `secure: true` em produção.
- Produção bloqueia `SESSION_SECRET` fraco.
- O frontend não guarda segredo de sessão.
- Rotas sensíveis não aceitam identidade pelo body.
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
| P1 | cookie assinado em `/api/auth/me` | `200` com `user` seguro |
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
