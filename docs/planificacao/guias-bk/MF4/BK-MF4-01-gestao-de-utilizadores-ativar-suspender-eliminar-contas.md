# BK-MF4-01 - Gestão de utilizadores: ativar, suspender e desativar reversivelmente

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
- `last_updated`: `2026-07-10`

> **Estado atual da implementação de referência — 2026-07-10:** `DELETE /api/admin/users/:id` é a ação **Desativar**, não uma eliminação. Preserva email/password/dados, grava `accountStatus="suspended"`, `isActive=false`, `suspendedAt`, mantém `deletedAt=null` e revoga todas as sessões na mesma transação. A conta pode ser reativada por `PATCH .../status`, mas as sessões antigas permanecem revogadas. Apenas `DELETE /api/me/account`, iniciado pelo titular com password + `ELIMINAR`, pode criar o estado terminal `deleted`; esse tombstone nunca pode ser desativado ou reativado pelo painel admin.

#### Objetivo
Implementar a gestão administrativa de contas da Orélle para que um administrador consiga listar utilizadores, ativar, suspender ou executar a ação reversível “Desativar”, sem a confundir com eliminação terminal de dados nem expor passwords, dados biométricos, relatórios faciais ou campos internos.

#### Importância
`RF33` protege a operação da app: uma conta comprometida ou abusiva deve poder ser suspensa/desativada sem apagar dados sensíveis de forma descontrolada. Pedidos sobre fotografias/relatórios ficam em `BK-MF5-01`; a eliminação terminal da própria conta fica em `BK-MF7-02`. Este BK apenas impede login e reduz exposição operacional.

#### Scope-in
- Estender `User` com estado de conta.
- Bloquear login e sessão ativa de contas suspensas ou eliminadas.
- Criar endpoints admin para listar utilizadores e alterar estado.
- Criar desativação administrativa reversível com `accountStatus="suspended"`, preservando email/dados e revogando sessões atomicamente.
- Permitir reativação posterior sem ressuscitar cookies antigos.
- Criar página admin para executar as ações.
- Não renderizar ações mutáveis para tombstones `deleted`; contas `suspended` continuam a disponibilizar “Ativar”.
- Garantir que o administrador não se suspende nem desativa a si próprio neste fluxo.

#### Scope-out
- Não apagar fotografias faciais nem relatórios de análise neste BK.
- Não implementar pedidos RGPD de eliminação/anonymização biométrica; isso fica para `BK-MF5-01`.
- Não implementar `DELETE /api/me/account` nem eliminação terminal da própria conta; isso fica para `BK-MF7-02`.
- Não alterar roles; a alteração de role já vem de `BK-MF0-05`.
- Não permitir que o frontend envie ou decida `userId` de ownership sensível.

#### Estado antes e depois
- Antes: `apps` já tinha `User.isActive` e alteração de role, mas não tinha fluxo completo de listar, suspender, ativar e desativar reversivelmente contas.
- Depois: a API passa a ter gestão admin de estado de conta, suspensão/desativação revoga sessões, `suspended` pode regressar a `active`, `deleted` não pode regressar a outro estado e a UI só mostra ações compatíveis com o estado atual.

#### Pre-requisitos
- `BK-MF0-01`: modelo `User`, email e password protegida.
- `BK-MF0-02`: login com cookie HttpOnly e `requireAuth`.
- `BK-MF0-05`: role `administrador` e middleware `requireRole`.
- `RF33`: gestão de utilizadores por administrador.

#### Glossário
- Conta ativa: pode autenticar-se e usar a app.
- Conta suspensa: não pode autenticar-se, mas os dados ficam preservados para revisão.
- Conta desativada administrativamente: usa `accountStatus="suspended"`, fica sem acesso, conserva email/dados e pode ser reativada; as sessões revogadas não voltam a ser válidas.
- Eliminação terminal: fluxo distinto do próprio titular em `DELETE /api/me/account`, com confirmação forte, revogação de sessões e tratamento das coleções ligadas.
- DTO seguro: resposta sem `passwordHash`, tokens, cookies ou dados biométricos.

#### Conceitos teóricos essenciais
A gestão de contas deve ser feita no backend. O frontend mostra botões, mas a autorização real depende da sessão e da role lida no servidor.

Uma desativação reversível é mais segura nesta fase do que apagar em cascata. A Orélle tem fotografias e relatórios sensíveis, e esses dados exigem fluxos próprios de privacidade. Neste BK, o verbo HTTP legado `DELETE` significa suspender acesso e revogar sessões; não reduz identificadores, não muda o email e não significa eliminação física/terminal.

Suspender e eliminar devem invalidar o uso posterior da conta. Como o cookie já pode existir no browser, o middleware de autenticação deve confirmar o estado atual do utilizador na base de dados antes de aceitar o pedido protegido.

`suspended` é o estado administrativo reversível. A escrita da conta e a revogação de `AuthSession` devem confirmar na mesma transação; uma falha na revogação faz rollback da suspensão. `deleted` fica reservado ao direito de eliminação do titular e é terminal: se o filtro excluir esse tombstone, a API devolve `409`, impedindo o painel de o alterar.

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

A ausência de código aqui é intencional: antes de escrever ficheiros, o aluno precisa de perceber que `RF33` é um requisito administrativo e não um atalho para apagar tudo da base de dados. Este passo ensina a separar ativação, suspensão/desativação reversível e eliminação terminal pelo titular. Essa separação evita tratar o verbo `DELETE` como `deleteOne`, perdendo histórico, auditoria e ligações a dados sensíveis.
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
        // código olha para `accountStatus` para distinguir active/suspended do
        // tombstone terminal deleted, que só o titular pode criar.
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

centralizar regras de listagem, suspensão, ativação e desativação administrativa reversível.
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
import { AuthSession } from "../models/auth-session.model.js";
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

/** Atualiza conta e, quando necessário, revoga sessões na mesma transação. */
async function updateAccountState({ targetUserId, update, revokeSessions, now }) {
    const session = await mongoose.startSession();
    let user = null;

    try {
        await session.withTransaction(async () => {
            user = await User.findOneAndUpdate(
                {
                    _id: targetUserId,
                    // Tombstones do titular nunca são mutáveis pelo painel admin.
                    accountStatus: { $ne: ACCOUNT_STATUSES.DELETED },
                },
                update,
                { new: true, runValidators: true, session },
            );

            if (user && revokeSessions) {
                await AuthSession.updateMany(
                    { userId: targetUserId, revokedAt: null },
                    { $set: { revokedAt: now, csrfHash: null } },
                    { session },
                );
            }
        });
        return user;
    } finally {
        await session.endSession();
    }
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

    const now = new Date();
    const update =
        status === ACCOUNT_STATUSES.ACTIVE
            ? { accountStatus: status, isActive: true, suspendedAt: null }
            : { accountStatus: status, isActive: false, suspendedAt: now };

    const user = await updateAccountState({
        targetUserId,
        update,
        revokeSessions: status === ACCOUNT_STATUSES.SUSPENDED,
        now,
    });

    if (!user) {
        const deletedAccount = await User.exists({
            _id: targetUserId,
            accountStatus: ACCOUNT_STATUSES.DELETED,
        });

        if (deletedAccount) {
            throw new AppError(409, "Uma conta eliminada não pode ser reativada");
        }

        throw new AppError(404, "Utilizador não encontrado");
    }

    return toAdminUserDto(user);
}

/**
 * Executa desativação administrativa reversível no âmbito de RF33.
 *
 * @async
 * @function softDeleteUserAccount
 * @param {{targetUserId: string, actorUserId: string}} params - Ação administrativa.
 * @returns {Promise<object>} Utilizador suspenso, com dados preservados.
 */
export async function softDeleteUserAccount({ targetUserId, actorUserId }) {
    if (!mongoose.isValidObjectId(targetUserId)) {
        throw new AppError(400, "ID de utilizador invalido");
    }

    if (targetUserId === actorUserId) {
        throw new AppError(400, "Um administrador não deve desativar a própria conta neste fluxo");
    }

    const now = new Date();
    const user = await updateAccountState({
        targetUserId,
        update: {
            accountStatus: ACCOUNT_STATUSES.SUSPENDED,
            isActive: false,
            suspendedAt: now,
            deletedAt: null,
        },
        revokeSessions: true,
        now,
    });

    if (!user) {
        const terminalAccount = await User.exists({
            _id: targetUserId,
            accountStatus: ACCOUNT_STATUSES.DELETED,
        });
        if (terminalAccount) {
            throw new AppError(409, "Uma conta eliminada terminalmente não pode ser desativada");
        }
        throw new AppError(404, "Utilizador não encontrado");
    }

    return toAdminUserDto(user);
}
```

5. Explicação do código.

O service concentra a regra de negócio e usa uma transação comum para conta + `AuthSession`. Suspender ou usar o endpoint legado `DELETE` preserva email/password/dados, grava `suspended` e revoga todas as sessões ativas; se a revogação falhar, a conta continua ativa por rollback. Reativar não ressuscita cookies revogados. O filtro exclui apenas `deleted`, tombstone terminal criado pelo titular; nesse caso o painel recebe `409`.
6. Validação do passo.

chamar cada função em teste e confirmar que o DTO não tem `passwordHash`; injetar falha na revogação e confirmar rollback de conta e sessões.
7. Cenário negativo/erro esperado.

apagar documentos relacionados, trocar o email ou gravar `deleted` neste endpoint misturaria RF33 com o direito terminal de eliminação.

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
 * Executa a desativação administrativa reversível de uma conta.
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

listar contas e criar ações de ativar, suspender e **Desativar** apenas para contas mutáveis. Uma conta `suspended` mostra “Ativar”; uma conta `active` mostra “Suspender” e “Desativar”. Para `accountStatus="deleted"`, mostra unicamente uma mensagem de tombstone terminal criado pelo titular.
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
     * Executa a ação administrativa reversível “Desativar”.
     *
     * @async
     * @param {string} userId - Utilizador alvo.
     * @returns {Promise<void>}
     */
    async function deactivateAccount(userId) {
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
                        {user.accountStatus === "deleted" ? (
                            <p role="status">Conta eliminada pelo titular: estado terminal.</p>
                        ) : user.accountStatus === "suspended" ? (
                            <button type="button" onClick={() => changeStatus(user.id, "active")}>
                                Ativar
                            </button>
                        ) : (
                            <>
                                <button type="button" onClick={() => changeStatus(user.id, "suspended")}>
                                    Suspender
                                </button>
                                <button type="button" onClick={() => deactivateAccount(user.id)}>
                                    Desativar
                                </button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
```

5. Explicação do código.

A página mostra “Desativar”, nunca “Eliminar”, para o endpoint administrativo legado. Contas suspensas podem ser ativadas; tombstones `deleted` não apresentam comandos. Esta proteção visual não substitui a transação/`409` no backend. A sessão via cookie HttpOnly segue automaticamente pelo `apiRequest`, e a autorização não pode ser contornada por manipulação do browser.
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
   - CRIAR/EDITAR: `apps/api/tests/admin-account-deactivation.replset.integration.test.js`
   - REVER: `apps/api/package.json`
   - LOCALIZAÇÃO: testes de integração.
3. Instruções do que fazer.

testar listagem admin, suspensão/desativação com revogação transacional, reativação sem ressuscitar cookies, rollback quando a revogação falha, self-action, tombstone terminal e ausência de campos sensíveis. A prova material usa `MongoMemoryReplSet`; mocks não provam atomicidade.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/admin-account-deactivation.replset.integration.test.js
it("faz rollback se a revogação falhar e depois desativa/revoga uma vez", async () => {
    const user = await createActiveAccount("rollback");
    const actorUserId = new mongoose.Types.ObjectId().toString();
    const revokeSpy = vi
        .spyOn(AuthSession, "updateMany")
        .mockRejectedValueOnce(new Error("falha-injetada-revogacao"));

    await expect(softDeleteUserAccount({
        targetUserId: user._id.toString(),
        actorUserId,
    })).rejects.toThrow("falha-injetada-revogacao");
    revokeSpy.mockRestore();

    expect(await User.findById(user._id).lean()).toMatchObject({
        email: "rollback@orelle.test",
        isActive: true,
        accountStatus: ACCOUNT_STATUSES.ACTIVE,
        deletedAt: null,
    });
    expect(await AuthSession.countDocuments({
        userId: user._id,
        revokedAt: null,
    })).toBe(2);

    const deactivated = await softDeleteUserAccount({
        targetUserId: user._id.toString(),
        actorUserId,
    });
    expect(deactivated).toMatchObject({
        email: "rollback@orelle.test",
        isActive: false,
        accountStatus: ACCOUNT_STATUSES.SUSPENDED,
        deletedAt: null,
    });

    const activeSessions = await AuthSession.countDocuments({
        userId: user._id,
        revokedAt: null,
    });
    expect(activeSessions).toBe(0);

    const reactivated = await setUserAccountStatus({
        targetUserId: user._id.toString(),
        actorUserId,
        status: ACCOUNT_STATUSES.ACTIVE,
    });
    expect(reactivated.accountStatus).toBe(ACCOUNT_STATUSES.ACTIVE);
    // Reativar a conta nunca ressuscita os cookies já revogados.
    expect(await AuthSession.countDocuments({
        userId: user._id,
        revokedAt: null,
    })).toBe(0);
});

it("nunca altera um tombstone terminal criado pelo titular", async () => {
    const terminal = await User.create({
        email: "deleted-terminal@deleted.invalid",
        passwordHash: await bcrypt.hash("Password-Local-123", 4),
        role: "cliente",
        isActive: false,
        accountStatus: ACCOUNT_STATUSES.DELETED,
        deletedAt: new Date(),
    });
    const actorUserId = new mongoose.Types.ObjectId().toString();

    await expect(softDeleteUserAccount({
        targetUserId: terminal._id.toString(),
        actorUserId,
    })).rejects.toMatchObject({ statusCode: 409 });
    await expect(setUserAccountStatus({
        targetUserId: terminal._id.toString(),
        actorUserId,
        status: ACCOUNT_STATUSES.ACTIVE,
    })).rejects.toMatchObject({ statusCode: 409 });
});
```

5. Explicação do código.

O teste chama o service real contra um replica set efémero. A falha injetada prova que conta e revogação confirmam juntas; o caminho positivo prova email/dados preservados, `suspended`, sessões revogadas e reativação sem cookies antigos. O segundo cenário prova que `deleted` pertence exclusivamente ao fluxo terminal do titular.
6. Validação do passo.

correr `npm --prefix apps/api test -- tests/admin-account-deactivation.replset.integration.test.js` e depois a suite integral.
7. Cenário negativo/erro esperado.

concluir o BK só com smoke visual não cobre as falhas de autorização.

#### Expected results
- `GET /api/admin/users` devolve `200` para admin e lista segura de utilizadores.
- `PATCH /api/admin/users/:id/status` devolve `200` com estado atualizado.
- `DELETE /api/admin/users/:id` devolve `200` com conta `suspended`, email/dados preservados, `deletedAt=null` e sessões revogadas na mesma transação.
- Reativar a conta suspensa devolve `active`, mas não revalida nenhuma sessão antiga.
- Falha na revogação faz rollback da mudança de estado.
- `PATCH /api/admin/users/:id/status` sobre conta `deleted` devolve `409` e não altera o documento.
- Cliente sem role admin recebe `403`.
- Conta suspensa ou eliminada recebe `403` ao tentar autenticar ou usar sessão antiga.
- A UI chama à ação “Desativar”; contas `suspended` mostram “Ativar” e contas `deleted` não apresentam controlos mutáveis.

#### Critérios de aceite
- Entrega funcional específica de gestão administrativa (ativar, suspender e desativar reversivelmente) validada contra `RF33`.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Nenhuma resposta expõe `passwordHash`, cookies, fotografias, relatórios ou paths internos.
- O backend decide autorização por sessão e role; o frontend apenas apresenta comandos.
- `accountStatus="suspended"` é reversível e a revogação de sessões é atómica; `accountStatus="deleted"` é um tombstone exclusivo da eliminação terminal do titular e recebe `409` no fluxo admin.
- A UI nunca rotula o endpoint admin como “Eliminar” e nunca mostra ações mutáveis numa conta `deleted`.

#### Validação final
- Executar testes de integração da API.
- Executar build do frontend.
- Confirmar `git diff --check`.
- Confirmar `bash scripts/validate-planificacao.sh`.

#### Evidence para PR/defesa
- `proof_tecnico`: prints ou output dos endpoints `GET`, `PATCH` e `DELETE`.
- `proof_negativos`: `403` para cliente, `400` para self-action, rollback da falha de revogação e `409` para tombstone terminal.
- `proof_privacidade`: exemplo de DTO sem `passwordHash` e sem dados biométricos.
- `proof_ui`: screenshot da página admin com lista e botões.

#### Handoff
`BK-MF4-02` deve reutilizar `requireAuth` e `requireRole(ROLES.ADMIN)`. `BK-MF5-01` deve assumir que contas administrativamente suspensas conservam dados e ainda podem ter pedidos pendentes; eliminação terminal continua no fluxo próprio do titular.

#### Changelog
- `2026-06-15`: guia reescrito para fluxo administrativo real em `apps`, com estado de conta, bloqueio de sessão, routes admin, UI e negativos `P0`.

## Suplemento de validacao documental
Este suplemento fecha lacunas formais detetadas pelo validador de planificacao sem alterar o contrato funcional original do guia.

## Bloco pedagogico
### Objetivo
O aluno deve completar a gestão administrativa de utilizadores — ativar, suspender e desativar reversivelmente — com rastreabilidade direta a `RF33`, mantendo evidence objetiva, negativos por prioridade e handoff claro.

### Pre-requisitos
- Rever `RF33` nos documentos RF/RNF aplicáveis.
- Confirmar dependencias declaradas: `BK-MF0-01`.
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
- BK: `BK-MF4-01`
- Requisito: `RF33`
- Dependencias: `BK-MF0-01`
- Sprint: `S08-S09`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF4-01` e do requisito `RF33`.
2. Validar pre-condicoes e dependencias declaradas (`BK-MF0-01`).
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
- Proximo BK recomendado: `BK-MF4-02`
- Registar riscos, dependencias pendentes e validacoes executadas antes do fecho.

## Criterios de aceite
- Entrega funcional específica de gestão administrativa — ativar, suspender e desativar reversivelmente — validada contra `RF33`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Metadados do guia alinhados com matriz, backlog e anexos.

## Evidence para PR/defesa
- `proof_tecnico`: output, log, screenshot ou request/response do fluxo principal.
- `proof_negativos`: cenarios negativos executados e resultados observados.
- `proof_handoff`: estado final, riscos e proximo BK.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF4-01';
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
- `2026-07-10` (histórico supersedido): o `DELETE` admin foi inicialmente descrito como desativação lógica terminal; a linha corrente seguinte substitui essa interpretação.
- `2026-07-10`: `deleted` fica terminal apenas quando criado por `DELETE /api/me/account`; o painel admin devolve `409` e não mostra ações mutáveis para esse tombstone.
- `2026-07-10` (estado corrente): “Desativar” grava `suspended`, preserva email/dados, revoga sessões na mesma transação e permite reativação sem restaurar cookies antigos.
- `2026-06-30`: suplemento documental adicionado para cumprir validador de planificacao.
