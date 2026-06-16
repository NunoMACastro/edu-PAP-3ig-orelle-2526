# BK-MF4-01 - Gestão de utilizadores (ativar, suspender, eliminar contas)

## Header
- `doc_id`: `GUIA-BK-MF4-01`
- `bk_id`: `BK-MF4-01`
- `macro`: `MF4`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF0-01`
- `rf_rnf`: `RF33`
- `fase_documental`: `Fase 2`
- `sprint`: `S08-S09`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF4-02`
- `guia_path`: `docs/planificacao/guias-bk/MF4/BK-MF4-01-gestao-de-utilizadores-ativar-suspender-eliminar-contas.md`
- `last_updated`: `2026-06-15`

#### Objetivo
Implementar a gestão administrativa de contas da Orélle para que um administrador consiga listar utilizadores, ativar contas, suspender contas e executar eliminação lógica sem expor passwords, dados biométricos, relatórios faciais ou campos internos.

#### Importância
`RF33` protege a operação da app: uma conta comprometida ou abusiva deve poder ser suspensa sem apagar dados sensíveis de forma descontrolada. A eliminação completa de fotografias e relatórios fica para `BK-MF5-01`, mas este BK já impede login e reduz a exposição da conta.

#### Scope-in
- Estender `User` com estado de conta.
- Bloquear login e sessão ativa de contas suspensas ou eliminadas.
- Criar endpoints admin para listar utilizadores e alterar estado.
- Criar eliminação lógica com email anonimizado e `isActive: false`.
- Criar página admin para executar as ações.
- Garantir que o administrador não se suspende nem elimina a si próprio neste fluxo.

#### Scope-out
- Não apagar fotografias faciais nem relatórios de análise neste BK.
- Não implementar pedidos RGPD de eliminação/anonymização biométrica; isso fica para `BK-MF5-01`.
- Não alterar roles; a alteração de role já vem de `BK-MF0-05`.
- Não permitir que o frontend envie ou decida `userId` de ownership sensível.

#### Estado antes e depois
- Antes: `apps` já tinha `User.isActive` e alteração de role, mas não tinha fluxo completo de listar, suspender, ativar e eliminar contas.
- Depois: a API passa a ter gestão admin de estado de conta, login bloqueia contas inativas e a UI admin mostra ações verificáveis.

#### Pre-requisitos
- `BK-MF0-01`: modelo `User`, email e password protegida.
- `BK-MF0-02`: login com cookie HttpOnly e `requireAuth`.
- `BK-MF0-05`: role `administrador` e middleware `requireRole`.
- `RF33`: gestão de utilizadores por administrador.

#### Glossário
- Conta ativa: pode autenticar-se e usar a app.
- Conta suspensa: não pode autenticar-se, mas os dados ficam preservados para revisão.
- Conta eliminada: fica desativada e anonimizada ao nível mínimo deste BK.
- Eliminação lógica: marca a conta como eliminada sem apagar coleções sensíveis fora deste requisito.
- DTO seguro: resposta sem `passwordHash`, tokens, cookies ou dados biométricos.

#### Conceitos teóricos essenciais
A gestão de contas deve ser feita no backend. O frontend mostra botões, mas a autorização real depende da sessão e da role lida no servidor.

Uma eliminação lógica é mais segura nesta fase do que apagar em cascata. A Orélle tem fotografias e relatórios sensíveis, e esses dados exigem um fluxo próprio de aprovação em `BK-MF5-01`. Neste BK, eliminar significa impedir acesso e reduzir identificadores diretos da conta.

Suspender e eliminar devem invalidar o uso posterior da conta. Como o cookie já pode existir no browser, o middleware de autenticação deve confirmar o estado atual do utilizador na base de dados antes de aceitar o pedido protegido.

#### Arquitetura do BK
- `user.model.js`: acrescenta `accountStatus` e datas administrativas.
- `auth.service.js`: recusa login de contas suspensas/eliminadas.
- `auth.middleware.js`: recusa pedidos autenticados de contas inativas.
- `admin-users.service.js`: lista utilizadores e altera estados.
- `admin-users.controller.js`: traduz pedidos HTTP para service.
- `admin-users.routes.js`: expõe endpoints protegidos por admin.
- `AdminUsersPage.jsx`: UI administrativa.
- `App.jsx`: mostra a página apenas para administradores.

#### Ficheiros a criar/editar/rever
- EDITAR: `apps/api/src/models/user.model.js`
- EDITAR: `apps/api/src/services/auth.service.js`
- EDITAR: `apps/api/src/middlewares/auth.middleware.js`
- EDITAR: `apps/api/src/services/admin-users.service.js`
- EDITAR: `apps/api/src/controllers/admin-users.controller.js`
- EDITAR: `apps/api/src/routes/admin-users.routes.js`
- CRIAR: `apps/web/src/pages/AdminUsersPage.jsx`
- EDITAR: `apps/web/src/App.jsx`
- REVER: `apps/api/src/constants/roles.js`
- REVER: `apps/api/src/middlewares/role.middleware.js`

#### Tutorial técnico linear
### Passo 1 - Confirmar contrato e fronteiras

1. Objetivo funcional do passo no contexto da app.

confirmar que `RF33` cobre gestão de contas, não eliminação biométrica completa.
2. Ficheiros envolvidos:
   - REVER: `docs/RF.md`
   - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
   - REVER: `docs/planificacao/guias-bk/MF5/BK-MF5-01-painel-para-consultores-admins-reverem-e-aprovarem-pedidos-de-eliminacao-anonymizacao-de-fotografias-e-relatorios.md`
   - LOCALIZAÇÃO: linhas de `RF33`, `RF41` e `BK-MF4-01`.
3. Instruções do que fazer.

escrever no PR que este BK desativa acesso e deixa a eliminação formal para o BK de privacidade próprio.
4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo. A decisão técnica é: RF33 altera estado de conta; RF41 trata dados biométricos.
```

5. Explicação do código.

A ausência de código aqui é intencional: antes de escrever ficheiros, o aluno precisa de perceber que `RF33` é um requisito administrativo e não um atalho para apagar tudo da base de dados. Este passo ensina a separar três ideias diferentes: ativar, suspender e eliminar logicamente. Essa separação evita um erro comum em projetos reais: tratar "eliminar conta" como `deleteOne`, perdendo histórico, auditoria e ligações a dados sensíveis que ainda têm de ser tratados por BKs posteriores.
6. Validação do passo.

o plano do PR não promete apagar fotografias ou relatórios nesta entrega.
7. Cenário negativo/erro esperado.

apagar dados biométricos neste BK quebra a sequência pedagógica e mistura `RF33` com `RF41`.

### Passo 2 - Estender o modelo User

1. Objetivo funcional do passo no contexto da app.

guardar estado administrativo da conta.
2. Ficheiros envolvidos:
   - EDITAR: `apps/api/src/models/user.model.js`
   - LOCALIZAÇÃO: dentro de `userSchema`.
3. Instruções do que fazer.

adicionar `accountStatus`, `suspendedAt` e `deletedAt`, mantendo `isActive` para compatibilidade com código anterior.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/user.model.js
export const ACCOUNT_STATUSES = Object.freeze({
    ACTIVE: "active",
    SUSPENDED: "suspended",
    DELETED: "deleted",
});

export const ACCOUNT_STATUS_VALUES = Object.freeze(
    Object.values(ACCOUNT_STATUSES),
);

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ROLE_VALUES,
            default: ROLES.CLIENTE,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // `accountStatus` é a decisão administrativa principal.
        // `isActive` fica por compatibilidade com BKs anteriores, mas o novo
        // código deve olhar para `accountStatus` para distinguir suspensão de eliminação lógica.
        accountStatus: {
            type: String,
            enum: ACCOUNT_STATUS_VALUES,
            default: ACCOUNT_STATUSES.ACTIVE,
            index: true,
        },
        // Estas datas não autorizam nem bloqueiam por si só.
        // Elas servem como evidência para defesa, suporte e auditoria interna.
        suspendedAt: {
            type: Date,
            default: null,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);
```

5. Explicação do código.

`accountStatus` é o campo que passa a explicar o estado real da conta. Repara que ele não substitui `role`: uma conta pode ser `administrador` e estar suspensa, ou ser `cliente` e estar ativa. `isActive` é mantido porque já pode existir código de MF0/MF1 a olhar para esse booleano; remover esse campo agora podia partir imports e testes anteriores. `suspendedAt` e `deletedAt` ajudam o aluno a perceber que decisões administrativas precisam de rasto temporal, mesmo quando ainda não existe uma tabela formal de auditoria.
6. Validação do passo.

criar utilizador novo e confirmar `accountStatus: "active"` e `isActive: true`.
7. Cenário negativo/erro esperado.

remover `isActive` sem rever todos os usos pode partir autenticação e dashboards.

### Passo 3 - Bloquear login e sessão de contas inativas

1. Objetivo funcional do passo no contexto da app.

impedir que contas suspensas ou eliminadas usem a app.
2. Ficheiros envolvidos:
   - EDITAR: `apps/api/src/services/auth.service.js`
   - EDITAR: `apps/api/src/middlewares/auth.middleware.js`
   - LOCALIZAÇÃO: após procurar o utilizador.
3. Instruções do que fazer.

validar estado no login e novamente no middleware.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/auth.service.js
import { ACCOUNT_STATUSES, User } from "../models/user.model.js";

/**
 * Confirma se a conta pode autenticar-se.
 *
 * @function ensureUserCanAuthenticate
 * @param {{isActive: boolean, accountStatus?: string}} user - Utilizador obtido da base de dados.
 * @returns {void}
 * @throws {AppError} Quando a conta foi suspensa ou eliminada.
 */
function ensureUserCanAuthenticate(user) {
    if (!user.isActive || user.accountStatus !== ACCOUNT_STATUSES.ACTIVE) {
        throw new AppError(403, "Conta inativa. Contacta a equipa Orélle.");
    }
}

export async function loginUser({ email, password }) {
    const user = await User.findOne({ email }).select(
        "+passwordHash email role createdAt isActive accountStatus",
    );

    if (!user) {
        throw new AppError(401, "Credenciais invalidas");
    }

    ensureUserCanAuthenticate(user);

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
        throw new AppError(401, "Credenciais invalidas");
    }

    return toSafeUser(user);
}
```

```js
// apps/api/src/middlewares/auth.middleware.js
import { ACCOUNT_STATUSES, User } from "../models/user.model.js";

/**
 * Bloqueia pedidos autenticados de contas que foram suspensas depois do login.
 *
 * @async
 * @function requireAuth
 * @param {import("express").Request & {user?: object}} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<void>}
 */
export async function requireAuth(req, res, next) {
    const sessionValue = req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionValue) {
        return next(new AppError(401, "Autenticação obrigatória"));
    }

    try {
        const sessionUser = verifySessionToken(sessionValue);
        const user = await User.findById(sessionUser.id).select("role isActive accountStatus");

        if (!user || !user.isActive || user.accountStatus !== ACCOUNT_STATUSES.ACTIVE) {
            return next(new AppError(403, "Conta inativa. Contacta a equipa Orélle."));
        }

        req.user = { ...sessionUser, role: user.role };
        return next();
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código.

Há duas proteções complementares. No login, a API impede que uma conta suspensa ou eliminada crie uma nova sessão. No middleware, a API volta a confirmar o estado da conta em cada pedido protegido, porque um utilizador podia já ter um cookie válido antes da suspensão. Esta dupla verificação é importante em segurança: o frontend pode esconder botões, mas só o backend consegue impedir uma sessão antiga de continuar a chamar endpoints sensíveis.
6. Validação do passo.

suspender conta, tentar login e chamar uma rota protegida com cookie antigo; ambas devem devolver `403`.
7. Cenário negativo/erro esperado.

validar estado apenas no login deixa sessões antigas funcionarem.

### Passo 4 - Criar service administrativo

1. Objetivo funcional do passo no contexto da app.

centralizar regras de listagem, suspensão, ativação e eliminação lógica.
2. Ficheiros envolvidos:
   - EDITAR: `apps/api/src/services/admin-users.service.js`
   - LOCALIZAÇÃO: substituir service curto por service completo.
3. Instruções do que fazer.

devolver DTO seguro e impedir ações destrutivas sobre a própria conta.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/admin-users.service.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { ACCOUNT_STATUSES, User } from "../models/user.model.js";

/**
 * Converte utilizador para DTO administrativo seguro.
 *
 * @function toAdminUserDto
 * @param {object} user - Documento Mongoose.
 * @returns {object} Utilizador sem campos sensíveis.
 */
function toAdminUserDto(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        accountStatus: user.accountStatus,
        suspendedAt: user.suspendedAt,
        deletedAt: user.deletedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

/**
 * Lista utilizadores para administração, sem devolver segredos.
 *
 * @async
 * @function listAdminUsers
 * @returns {Promise<object[]>} Utilizadores seguros.
 */
export async function listAdminUsers() {
    const users = await User.find({})
        .select("email role isActive accountStatus suspendedAt deletedAt createdAt updatedAt")
        .sort({ createdAt: -1 })
        .limit(100);

    return users.map(toAdminUserDto);
}

/**
 * Altera o estado de conta de outro utilizador.
 *
 * @async
 * @function setUserAccountStatus
 * @param {{targetUserId: string, status: "active"|"suspended", actorUserId: string}} params - Dados da ação.
 * @returns {Promise<object>} Utilizador atualizado.
 * @throws {AppError} Quando a ação é inválida.
 */
export async function setUserAccountStatus({ targetUserId, status, actorUserId }) {
    if (!mongoose.isValidObjectId(targetUserId)) {
        throw new AppError(400, "ID de utilizador invalido");
    }

    if (targetUserId === actorUserId) {
        throw new AppError(400, "Um administrador não deve alterar a própria conta neste fluxo");
    }

    if (![ACCOUNT_STATUSES.ACTIVE, ACCOUNT_STATUSES.SUSPENDED].includes(status)) {
        throw new AppError(400, "Estado de conta invalido");
    }

    const update =
        status === ACCOUNT_STATUSES.ACTIVE
            ? { accountStatus: status, isActive: true, suspendedAt: null }
            : { accountStatus: status, isActive: false, suspendedAt: new Date() };

    const user = await User.findByIdAndUpdate(targetUserId, update, {
        new: true,
        runValidators: true,
    });

    if (!user) {
        throw new AppError(404, "Utilizador não encontrado");
    }

    return toAdminUserDto(user);
}

/**
 * Executa eliminação lógica da conta no âmbito de RF33.
 *
 * @async
 * @function softDeleteUserAccount
 * @param {{targetUserId: string, actorUserId: string}} params - Ação administrativa.
 * @returns {Promise<object>} Utilizador eliminado logicamente.
 */
export async function softDeleteUserAccount({ targetUserId, actorUserId }) {
    if (!mongoose.isValidObjectId(targetUserId)) {
        throw new AppError(400, "ID de utilizador invalido");
    }

    if (targetUserId === actorUserId) {
        throw new AppError(400, "Um administrador não deve eliminar a própria conta neste fluxo");
    }

    const deletedAt = new Date();
    const user = await User.findByIdAndUpdate(
        targetUserId,
        {
            accountStatus: ACCOUNT_STATUSES.DELETED,
            isActive: false,
            suspendedAt: deletedAt,
            deletedAt,
            email: `deleted-${targetUserId}@orelle.local`,
        },
        { new: true, runValidators: true },
    );

    if (!user) {
        throw new AppError(404, "Utilizador não encontrado");
    }

    return toAdminUserDto(user);
}
```

5. Explicação do código.

O service concentra a regra de negócio para evitar que controller, route ou frontend decidam estados de conta de formas diferentes. `setUserAccountStatus` trata suspensão/ativação e `softDeleteUserAccount` aplica eliminação lógica, sem apagar fotografias, relatórios ou histórico biométrico que pertencem a BKs futuros. A troca do email por um valor técnico reduz identificação direta no painel admin, mas não deve ser confundida com anonymização completa. Essa distinção é essencial em RGPD: este BK reduz exposição operacional; `BK-MF5-01` tratará pedidos formais sobre dados sensíveis.
6. Validação do passo.

chamar cada função em teste e confirmar que o DTO não tem `passwordHash`.
7. Cenário negativo/erro esperado.

apagar documentos relacionados aqui impediria `BK-MF5-01` de auditar e aprovar eliminação sensível.

### Passo 5 - Ligar controllers e routes

1. Objetivo funcional do passo no contexto da app.

expor contratos HTTP protegidos por admin.
2. Ficheiros envolvidos:
   - EDITAR: `apps/api/src/controllers/admin-users.controller.js`
   - EDITAR: `apps/api/src/routes/admin-users.routes.js`
   - LOCALIZAÇÃO: routes montadas em `/api/admin`.
3. Instruções do que fazer.

criar `GET /api/admin/users`, `PATCH /api/admin/users/:id/status` e `DELETE /api/admin/users/:id`.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/controllers/admin-users.controller.js
import {
    listAdminUsers,
    setUserAccountStatus,
    softDeleteUserAccount,
} from "../services/admin-users.service.js";

/**
 * Lista utilizadores para o painel admin.
 *
 * @async
 * @function listAdminUsersController
 */
export async function listAdminUsersController(req, res, next) {
    try {
        const users = await listAdminUsers();
        return res.status(200).json({ users });
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza estado administrativo da conta.
 *
 * @async
 * @function updateUserStatusController
 */
export async function updateUserStatusController(req, res, next) {
    try {
        const user = await setUserAccountStatus({
            targetUserId: req.params.id,
            status: String(req.body.status ?? "").trim(),
            actorUserId: req.user.id,
        });

        return res.status(200).json({ user });
    } catch (err) {
        return next(err);
    }
}

/**
 * Executa eliminação lógica de uma conta.
 *
 * @async
 * @function deleteUserAccountController
 */
export async function deleteUserAccountController(req, res, next) {
    try {
        const user = await softDeleteUserAccount({
            targetUserId: req.params.id,
            actorUserId: req.user.id,
        });

        return res.status(200).json({ user });
    } catch (err) {
        return next(err);
    }
}
```

```js
// apps/api/src/routes/admin-users.routes.js
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
    deleteUserAccountController,
    listAdminUsersController,
    updateUserStatusController,
} from "../controllers/admin-users.controller.js";

/**
 * Router Express para gestão administrativa de utilizadores.
 *
 * @type {import("express").Router}
 */
export const adminUsersRoutes = Router();

adminUsersRoutes.get("/users", requireAuth, requireRole(ROLES.ADMIN), listAdminUsersController);
adminUsersRoutes.patch("/users/:id/status", requireAuth, requireRole(ROLES.ADMIN), updateUserStatusController);
adminUsersRoutes.delete("/users/:id", requireAuth, requireRole(ROLES.ADMIN), deleteUserAccountController);
```

5. Explicação do código.

O controller só traduz HTTP para chamadas de service; ele não inventa regras novas. A route é onde o aluno vê a barreira de acesso: primeiro `requireAuth` confirma a sessão, depois `requireRole(ROLES.ADMIN)` confirma a responsabilidade administrativa. Esta ordem é pedagógica e segura: antes de perguntar "que permissões tem?", a API precisa de saber "quem é?". Mesmo que o frontend mostre um botão por engano, estes middlewares continuam a bloquear clientes e consultores.
6. Validação do passo.

cliente autenticado sem role admin recebe `403`; admin recebe `200`.
7. Cenário negativo/erro esperado.

montar estas routes fora de `/api/admin` dificulta auditoria e mistura recursos de cliente com operação.

### Passo 6 - Criar página React admin

1. Objetivo funcional do passo no contexto da app.

permitir smoke test visual da gestão de contas.
2. Ficheiros envolvidos:
   - CRIAR: `apps/web/src/pages/AdminUsersPage.jsx`
   - LOCALIZAÇÃO: ficheiro completo.
3. Instruções do que fazer.

listar contas e criar botões de ativar, suspender e eliminar.
4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/AdminUsersPage.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Painel administrativo de utilizadores.
 *
 * @function AdminUsersPage
 * @returns {JSX.Element} Lista e ações admin sobre contas.
 */
export function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    /**
     * Carrega utilizadores seguros a partir da API admin.
     *
     * @async
     * @returns {Promise<void>}
     */
    async function loadUsers() {
        setStatus("loading");
        setMessage("");

        try {
            const data = await apiRequest("/admin/users");
            setUsers(data.users);
            setStatus("success");
        } catch (err) {
            setStatus("error");
            setMessage(err.message);
        }
    }

    /**
     * Altera estado de conta sem enviar dados sensíveis.
     *
     * @async
     * @param {string} userId - Utilizador alvo.
     * @param {"active"|"suspended"} nextStatus - Estado pretendido.
     * @returns {Promise<void>}
     */
    async function changeStatus(userId, nextStatus) {
        await apiRequest(`/admin/users/${userId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: nextStatus }),
        });
        await loadUsers();
    }

    /**
     * Executa eliminação lógica da conta.
     *
     * @async
     * @param {string} userId - Utilizador alvo.
     * @returns {Promise<void>}
     */
    async function deleteAccount(userId) {
        await apiRequest(`/admin/users/${userId}`, { method: "DELETE" });
        await loadUsers();
    }

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <section className="page-section">
            <h2>Gestão de utilizadores</h2>
            {status === "loading" && <p>A carregar utilizadores...</p>}
            {message && <p role="alert">{message}</p>}
            <ul>
                {users.map((user) => (
                    <li key={user.id}>
                        <strong>{user.email}</strong>
                        <span> {user.role} - {user.accountStatus}</span>
                        <button type="button" onClick={() => changeStatus(user.id, "active")}>
                            Ativar
                        </button>
                        <button type="button" onClick={() => changeStatus(user.id, "suspended")}>
                            Suspender
                        </button>
                        <button type="button" onClick={() => deleteAccount(user.id)}>
                            Eliminar
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
```

5. Explicação do código.

A página mostra estados simples, mas o ponto didático é a separação entre visualização e decisão. O React prepara a ação do administrador e envia pedidos para endpoints concretos; a sessão via cookie HttpOnly segue automaticamente pelo `apiRequest`. Ainda assim, a UI não decide se alguém é admin, não escolhe o `userId` autenticado e não valida sozinha a segurança. Esse trabalho continua no backend, onde não pode ser contornado por manipulação do browser.
6. Validação do passo.

fazer login como admin e confirmar que a lista carrega; fazer login como cliente e confirmar que a API recusa.
7. Cenário negativo/erro esperado.

esconder a página de clientes não substitui a proteção `requireRole`.

### Passo 7 - Registar página no App

1. Objetivo funcional do passo no contexto da app.

disponibilizar a página no smoke test manual.
2. Ficheiros envolvidos:
   - EDITAR: `apps/web/src/App.jsx`
   - LOCALIZAÇÃO: imports e bloco `{isAdmin && (...)}`.
3. Instruções do que fazer.

importar `AdminUsersPage` e renderizar apenas para admin.
4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/App.jsx
import { useAuth } from "./context/AuthContext.jsx";
import { AdminUsersPage } from "./pages/AdminUsersPage.jsx";
import { AdminProductCreatePage } from "./pages/AdminProductCreatePage.jsx";
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage.jsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { StockAdminPage } from "./pages/StockAdminPage.jsx";

function AdminArea() {
    return (
        <>
            {/* A página de utilizadores entra no painel admin, mas não é a
                barreira de segurança. A barreira real continua nas rotas `/api/admin`. */}
            <AdminUsersPage />
            <AdminProductCreatePage />
            <AdminCategoriesPage />
            <AdminDashboardPage />
            <StockAdminPage />
        </>
    );
}

export function AppContent() {
    const { user } = useAuth();
    // Esta condição melhora a experiência visual, escondendo o painel de quem
    // não é admin. Não substitui `requireRole` no backend.
    const isAdmin = user?.role === "administrador";

    return (
        <>
            <RegisterPage />
            <LoginPage />
            {isAdmin && <AdminArea />}
        </>
    );
}
```

5. Explicação do código.

Este bloco ensina uma diferença importante entre UX e segurança. A condição `isAdmin` torna a interface mais limpa para clientes, mas não autoriza nada sozinha. Um aluno deve entender que qualquer pessoa consegue tentar chamar a API diretamente pelo browser ou por uma ferramenta externa; por isso, os endpoints admin continuam protegidos por `requireAuth` e `requireRole`. A UI ajuda a navegar, o backend protege os dados.
6. Validação do passo.

admin vê a secção; cliente não a vê.
7. Cenário negativo/erro esperado.

confiar só nesta condição visual deixa endpoints vulneráveis se as routes não estiverem protegidas.

### Passo 8 - Validar negativos e evidência

1. Objetivo funcional do passo no contexto da app.

provar que o BK cumpre `P0`.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `apps/api/tests/mf4.admin-users.test.js`
   - REVER: `apps/api/package.json`
   - LOCALIZAÇÃO: testes de integração.
3. Instruções do que fazer.

testar listagem admin, suspensão, bloqueio de login, self-action e ausência de campos sensíveis.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf4.admin-users.test.js
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    listAdminUsers,
    setUserAccountStatus,
    softDeleteUserAccount,
} from "../src/services/admin-users.service.js";
import { ACCOUNT_STATUSES, User } from "../src/models/user.model.js";

vi.mock("../src/models/user.model.js", () => ({
    ACCOUNT_STATUSES: Object.freeze({
        ACTIVE: "active",
        SUSPENDED: "suspended",
        DELETED: "deleted",
    }),
    User: {
        find: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

// O teste não precisa de um ObjectId real da base de dados; precisa de um valor
// com `toString()`, porque é isso que o service usa para montar DTOs.
function objectId(value) {
    return { toString: () => value };
}

// `makeUser` cria documentos falsos com a mesma forma dos documentos Mongoose
// usados pelo service. Isto mantém o teste legível e evita repetir objetos enormes.
function makeUser(overrides = {}) {
    return {
        _id: objectId(overrides.id ?? "64b7f1a0f4e6f5c6d7e8f901"),
        email: overrides.email ?? "cliente@orelle.local",
        role: overrides.role ?? "cliente",
        isActive: overrides.isActive ?? true,
        accountStatus: overrides.accountStatus ?? ACCOUNT_STATUSES.ACTIVE,
        suspendedAt: overrides.suspendedAt ?? null,
        deletedAt: overrides.deletedAt ?? null,
        passwordHash: overrides.passwordHash ?? "hash-fora-do-dto",
        createdAt: new Date("2026-06-15T10:00:00.000Z"),
        updatedAt: new Date("2026-06-15T10:00:00.000Z"),
    };
}

// A chain `find().select().sort().limit()` é simulada porque o service usa
// query builders do Mongoose. O objetivo do teste é validar a regra do service,
// não testar a base de dados.
function queryUsers(users) {
    return {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(users),
    };
}

describe("BK-MF4-01 admin users", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("lista utilizadores com DTO administrativo sem passwordHash", async () => {
        User.find.mockReturnValueOnce(queryUsers([makeUser()]));

        const users = await listAdminUsers();

        expect(User.find).toHaveBeenCalledWith({});
        expect(users).toEqual([
            expect.objectContaining({
                id: "64b7f1a0f4e6f5c6d7e8f901",
                email: "cliente@orelle.local",
                accountStatus: ACCOUNT_STATUSES.ACTIVE,
            }),
        ]);
        // Este é o ponto de privacidade do teste: o hash existe no documento falso,
        // mas nunca pode aparecer no DTO devolvido ao painel admin.
        expect(users[0]).not.toHaveProperty("passwordHash");
    });

    it("impede administrador de suspender a própria conta", async () => {
        const actorUserId = "64b7f1a0f4e6f5c6d7e8f901";

        await expect(
            setUserAccountStatus({
                targetUserId: actorUserId,
                actorUserId,
                status: ACCOUNT_STATUSES.SUSPENDED,
            }),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Um administrador não deve alterar a própria conta neste fluxo",
        });
        // Se esta chamada acontecesse, o admin poderia bloquear-se a si próprio
        // e deixar a equipa sem acesso operacional ao painel.
        expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("executa eliminação lógica sem expor dados sensíveis", async () => {
        const targetUserId = "64b7f1a0f4e6f5c6d7e8f901";
        const actorUserId = "64b7f1a0f4e6f5c6d7e8f902";
        User.findByIdAndUpdate.mockResolvedValueOnce(
            makeUser({
                id: targetUserId,
                email: `deleted-${targetUserId}@orelle.local`,
                isActive: false,
                accountStatus: ACCOUNT_STATUSES.DELETED,
                suspendedAt: new Date("2026-06-15T10:00:00.000Z"),
                deletedAt: new Date("2026-06-15T10:00:00.000Z"),
            }),
        );

        const user = await softDeleteUserAccount({ targetUserId, actorUserId });

        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            targetUserId,
            expect.objectContaining({
                accountStatus: ACCOUNT_STATUSES.DELETED,
                isActive: false,
                email: `deleted-${targetUserId}@orelle.local`,
            }),
            expect.objectContaining({ new: true, runValidators: true }),
        );
        expect(user).toMatchObject({
            id: targetUserId,
            accountStatus: ACCOUNT_STATUSES.DELETED,
            isActive: false,
        });
        expect(user).not.toHaveProperty("passwordHash");
    });
});
```

5. Explicação do código.

Os testes usam mocks apenas para substituir a base de dados, não para fugir à regra de negócio. Isto é importante para alunos: um teste útil deve chamar o service verdadeiro e verificar efeitos observáveis. O primeiro teste prova minimização (`passwordHash` não sai), o segundo prova segurança operacional (admin não se bloqueia a si próprio) e o terceiro prova que a eliminação é lógica, não destrutiva. Assim o aluno consegue defender o BK com evidência, não apenas com "funciona no meu computador".
6. Validação do passo.

correr `npm --prefix apps/api test` depois de implementar a API.
7. Cenário negativo/erro esperado.

concluir o BK só com smoke visual não cobre as falhas de autorização.

#### Expected results
- `GET /api/admin/users` devolve `200` para admin e lista segura de utilizadores.
- `PATCH /api/admin/users/:id/status` devolve `200` com estado atualizado.
- `DELETE /api/admin/users/:id` devolve `200` com conta marcada como `deleted`.
- Cliente sem role admin recebe `403`.
- Conta suspensa ou eliminada recebe `403` ao tentar autenticar ou usar sessão antiga.

#### Critérios de aceite
- Entrega funcional especifica de `Gestão de utilizadores (ativar, suspender, eliminar contas)` validada contra `RF33`.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Nenhuma resposta expõe `passwordHash`, cookies, fotografias, relatórios ou paths internos.
- O backend decide autorização por sessão e role; o frontend apenas apresenta comandos.

#### Validação final
- Executar testes de integração da API.
- Executar build do frontend.
- Confirmar `git diff --check`.
- Confirmar `bash scripts/validate-planificacao.sh`.

#### Evidence para PR/defesa
- `proof_tecnico`: prints ou output dos endpoints `GET`, `PATCH` e `DELETE`.
- `proof_negativos`: `403` para cliente, `400` para self-action e `403` para conta suspensa.
- `proof_privacidade`: exemplo de DTO sem `passwordHash` e sem dados biométricos.
- `proof_ui`: screenshot da página admin com lista e botões.

#### Handoff
`BK-MF4-02` deve reutilizar `requireAuth` e `requireRole(ROLES.ADMIN)`. `BK-MF5-01` deve assumir que contas eliminadas logicamente ainda podem ter pedidos pendentes sobre fotografias e relatórios.

#### Changelog
- `2026-06-15`: guia reescrito para fluxo administrativo real em `apps`, com estado de conta, bloqueio de sessão, routes admin, UI e negativos `P0`.
